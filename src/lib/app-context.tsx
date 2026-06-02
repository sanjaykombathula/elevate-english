import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, TaskAttempt, LessonProgress, DailyProgress, Achievement } from './types';
import { achievements as defaultAchievements } from './dummy-data';

interface AppState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onboardingComplete: boolean;
  loading: boolean;
  lessonProgress: Record<string, LessonProgress>;
  dailyProgress: DailyProgress;
  achievements: Achievement[];
  favoriteWords: string[];
  learnedWords: string[];
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: Partial<User>) => Promise<void>;
  recordAttempt: (lessonId: string, attempt: TaskAttempt) => Promise<void>;
  completeDailyTask: (marks: number) => Promise<void>;
  toggleFavoriteWord: (wordId: string) => Promise<void>;
  markWordLearned: (wordId: string) => Promise<void>;
  calculateMarks: (correct: boolean, attemptNumber: number, maxMarks: number) => number;
  getGrade: (percentage: number) => string;
  claimAdminIfNone: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const todayStr = () => new Date().toISOString().split('T')[0];

const emptyDaily = (): DailyProgress => ({
  date: todayStr(),
  tasksCompleted: 0,
  totalTasks: 10,
  marksEarned: 0,
  streakMaintained: false,
});

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    college: row.college || '',
    year: row.year || '',
    branch: row.branch || '',
    level: (row.level as User['level']) || 'Beginner',
    goal: row.goal || '',
    dailyTarget: row.daily_target ?? 20,
    streak: row.streak ?? 0,
    totalMarks: row.total_marks ?? 0,
    placementReadinessScore: row.placement_readiness_score ?? 0,
    grammarScore: row.grammar_score ?? 0,
    vocabularyScore: row.vocabulary_score ?? 0,
    speakingScore: row.speaking_score ?? 0,
    lessonsCompleted: row.lessons_completed ?? 0,
    joinedDate: row.joined_date || new Date().toISOString(),
    learningPath: row.learning_path || '',
    badges: row.badges || [],
  };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isAdmin: false,
    onboardingComplete: false,
    loading: true,
    lessonProgress: {},
    dailyProgress: emptyDaily(),
    achievements: defaultAchievements,
    favoriteWords: [],
    learnedWords: [],
  });

  const loadUserData = useCallback(async (userId: string) => {
    const [profileRes, lessonsRes, dailyRes, wordsRes, achRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('lesson_progress').select('*').eq('user_id', userId),
      supabase.from('daily_progress').select('*').eq('user_id', userId).eq('date', todayStr()).maybeSingle(),
      supabase.from('user_words').select('*').eq('user_id', userId),
      supabase.from('user_achievements').select('*').eq('user_id', userId),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    const isAdmin = !!(rolesRes.data || []).find((r: any) => r.role === 'admin');

    const profileRow = profileRes.data;
    const user = profileRow ? rowToUser(profileRow) : null;
    const onboardingComplete = !!profileRow?.onboarding_complete;

    const lessonProgress: Record<string, LessonProgress> = {};
    (lessonsRes.data || []).forEach((r: any) => {
      lessonProgress[r.lesson_id] = {
        lessonId: r.lesson_id,
        score: r.score,
        percentage: r.percentage,
        attempts: r.attempts || [],
        completed: r.completed,
        date: r.updated_at,
      };
    });

    const dailyProgress: DailyProgress = dailyRes.data
      ? {
          date: dailyRes.data.date,
          tasksCompleted: dailyRes.data.tasks_completed,
          totalTasks: dailyRes.data.total_tasks,
          marksEarned: dailyRes.data.marks_earned,
          streakMaintained: dailyRes.data.streak_maintained,
        }
      : emptyDaily();

    const favoriteWords: string[] = [];
    const learnedWords: string[] = [];
    (wordsRes.data || []).forEach((w: any) => {
      if (w.favorite) favoriteWords.push(w.word_id);
      if (w.learned) learnedWords.push(w.word_id);
    });

    const achievementsMap = new Map((achRes.data || []).map((a: any) => [a.achievement_id, a]));
    const achievements = defaultAchievements.map((a) => {
      const row: any = achievementsMap.get(a.id);
      return row ? { ...a, unlocked: row.unlocked, progress: row.progress } : a;
    });

    setState((s) => ({
      ...s,
      user,
      isAdmin,
      onboardingComplete,
      lessonProgress,
      dailyProgress,
      favoriteWords,
      learnedWords,
      achievements,
      loading: false,
    }));
  }, []);

  // Auth state listener
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, isAuthenticated: !!session }));
      if (session?.user) {
        setTimeout(() => loadUserData(session.user.id), 0);
      } else {
        setState((s) => ({
          ...s,
          user: null,
          onboardingComplete: false,
          lessonProgress: {},
          dailyProgress: emptyDaily(),
          favoriteWords: [],
          learnedWords: [],
          achievements: defaultAchievements,
          loading: false,
        }));
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session, isAuthenticated: !!session }));
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!state.session?.user) return;
    const userId = state.session.user.id;
    const channel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => loadUserData(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress', filter: `user_id=eq.${userId}` }, () => loadUserData(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress', filter: `user_id=eq.${userId}` }, () => loadUserData(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_words', filter: `user_id=eq.${userId}` }, () => loadUserData(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${userId}` }, () => loadUserData(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.session?.user?.id, loadUserData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name },
      },
    });
    return !error;
  };

  const signInWithGoogle = async () => {
    const { lovable } = await import('@/integrations/lovable');
    await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const completeOnboarding = async (data: Partial<User>) => {
    if (!state.session?.user) return;
    const pathMap: Record<string, string> = {
      Beginner: 'Beginner Path',
      Intermediate: 'Communication Builder Path',
      Advanced: 'Placement Ready Path',
    };
    const payload: any = {
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };
    if (data.name !== undefined) payload.name = data.name;
    if (data.college !== undefined) payload.college = data.college;
    if (data.year !== undefined) payload.year = data.year;
    if (data.branch !== undefined) payload.branch = data.branch;
    if (data.level !== undefined) {
      payload.level = data.level;
      payload.learning_path = data.learningPath || pathMap[data.level] || 'Communication Builder Path';
    }
    if (data.goal !== undefined) payload.goal = data.goal;
    if (data.dailyTarget !== undefined) payload.daily_target = data.dailyTarget;
    if (data.learningPath !== undefined) payload.learning_path = data.learningPath;

    await supabase.from('profiles').update(payload).eq('id', state.session.user.id);
    await loadUserData(state.session.user.id);
  };

  const calculateMarks = (correct: boolean, attemptNumber: number, maxMarks: number): number => {
    if (!correct) return 0;
    if (attemptNumber === 1) return maxMarks;
    if (attemptNumber === 2) return Math.floor(maxMarks * 0.7);
    return Math.floor(maxMarks * 0.5);
  };

  const recordAttempt = async (lessonId: string, attempt: TaskAttempt) => {
    if (!state.session?.user) return;
    const userId = state.session.user.id;
    const existing = state.lessonProgress[lessonId];
    const attempts = existing ? [...existing.attempts, attempt] : [attempt];
    const score = (existing?.score || 0) + attempt.marksEarned;

    await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        score,
        percentage: existing?.percentage || 0,
        attempts: attempts as any,
        completed: existing?.completed || false,
      },
      { onConflict: 'user_id,lesson_id' }
    );

    if (state.user) {
      await supabase
        .from('profiles')
        .update({ total_marks: state.user.totalMarks + attempt.marksEarned })
        .eq('id', userId);
    }
  };

  const completeDailyTask = async (marks: number) => {
    if (!state.session?.user) return;
    const userId = state.session.user.id;
    const date = todayStr();
    await supabase.from('daily_progress').upsert(
      {
        user_id: userId,
        date,
        tasks_completed: state.dailyProgress.tasksCompleted + 1,
        total_tasks: state.dailyProgress.totalTasks,
        marks_earned: state.dailyProgress.marksEarned + marks,
        streak_maintained: state.dailyProgress.streakMaintained,
      },
      { onConflict: 'user_id,date' }
    );
    if (state.user) {
      await supabase
        .from('profiles')
        .update({ total_marks: state.user.totalMarks + marks })
        .eq('id', userId);
    }
  };

  const toggleFavoriteWord = async (wordId: string) => {
    if (!state.session?.user) return;
    const userId = state.session.user.id;
    const isFav = state.favoriteWords.includes(wordId);
    const learned = state.learnedWords.includes(wordId);
    await supabase.from('user_words').upsert(
      { user_id: userId, word_id: wordId, favorite: !isFav, learned },
      { onConflict: 'user_id,word_id' }
    );
  };

  const markWordLearned = async (wordId: string) => {
    if (!state.session?.user) return;
    const userId = state.session.user.id;
    if (state.learnedWords.includes(wordId)) return;
    const favorite = state.favoriteWords.includes(wordId);
    await supabase.from('user_words').upsert(
      { user_id: userId, word_id: wordId, favorite, learned: true },
      { onConflict: 'user_id,word_id' }
    );
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const claimAdminIfNone = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('claim_admin_if_none');
    if (error) return false;
    if (state.session?.user) await loadUserData(state.session.user.id);
    return !!data;
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        signup,
        signInWithGoogle,
        logout,
        completeOnboarding,
        recordAttempt,
        completeDailyTask,
        toggleFavoriteWord,
        markWordLearned,
        calculateMarks,
        getGrade,
        claimAdminIfNone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
