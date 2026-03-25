import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, TaskAttempt, LessonProgress, DailyProgress, Achievement } from './types';
import { defaultUser, achievements as defaultAchievements } from './dummy-data';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  lessonProgress: Record<string, LessonProgress>;
  dailyProgress: DailyProgress;
  achievements: Achievement[];
  favoriteWords: string[];
  learnedWords: string[];
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  completeOnboarding: (data: Partial<User>) => void;
  recordAttempt: (lessonId: string, attempt: TaskAttempt) => void;
  completeDailyTask: (marks: number) => void;
  toggleFavoriteWord: (wordId: string) => void;
  markWordLearned: (wordId: string) => void;
  calculateMarks: (correct: boolean, attemptNumber: number, maxMarks: number) => number;
  getGrade: (percentage: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('mentorsplace-state');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      user: null,
      isAuthenticated: false,
      onboardingComplete: false,
      lessonProgress: {},
      dailyProgress: { date: new Date().toISOString().split('T')[0], tasksCompleted: 0, totalTasks: 10, marksEarned: 0, streakMaintained: false },
      achievements: defaultAchievements,
      favoriteWords: [],
      learnedWords: [],
    };
  });

  const persist = useCallback((newState: AppState) => {
    setState(newState);
    localStorage.setItem('mentorsplace-state', JSON.stringify(newState));
  }, []);

  const login = (email: string, _password: string): boolean => {
    if (email && _password.length >= 8) {
      const user = { ...defaultUser, email };
      const newState = { ...state, user, isAuthenticated: true };
      persist(newState);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, _password: string): boolean => {
    if (name && email && _password.length >= 8) {
      const user = { ...defaultUser, name, email, totalMarks: 0, streak: 0, lessonsCompleted: 0, badges: [] };
      const newState = { ...state, user, isAuthenticated: true, onboardingComplete: false };
      persist(newState);
      return true;
    }
    return false;
  };

  const logout = () => {
    persist({ ...state, user: null, isAuthenticated: false });
  };

  const completeOnboarding = (data: Partial<User>) => {
    if (!state.user) return;
    const user = { ...state.user, ...data };
    persist({ ...state, user, onboardingComplete: true });
  };

  const calculateMarks = (correct: boolean, attemptNumber: number, maxMarks: number): number => {
    if (!correct) return 0;
    if (attemptNumber === 1) return maxMarks;
    if (attemptNumber === 2) return Math.floor(maxMarks * 0.7);
    return Math.floor(maxMarks * 0.5);
  };

  const recordAttempt = (lessonId: string, attempt: TaskAttempt) => {
    const existing = state.lessonProgress[lessonId] || { lessonId, score: 0, percentage: 0, attempts: [], completed: false, date: new Date().toISOString() };
    const updated = { ...existing, attempts: [...existing.attempts, attempt], score: existing.score + attempt.marksEarned };
    const newProgress = { ...state.lessonProgress, [lessonId]: updated };
    const newUser = state.user ? { ...state.user, totalMarks: state.user.totalMarks + attempt.marksEarned } : state.user;
    persist({ ...state, lessonProgress: newProgress, user: newUser });
  };

  const completeDailyTask = (marks: number) => {
    const dp = { ...state.dailyProgress, tasksCompleted: state.dailyProgress.tasksCompleted + 1, marksEarned: state.dailyProgress.marksEarned + marks };
    const newUser = state.user ? { ...state.user, totalMarks: state.user.totalMarks + marks } : state.user;
    persist({ ...state, dailyProgress: dp, user: newUser });
  };

  const toggleFavoriteWord = (wordId: string) => {
    const favs = state.favoriteWords.includes(wordId) ? state.favoriteWords.filter(f => f !== wordId) : [...state.favoriteWords, wordId];
    persist({ ...state, favoriteWords: favs });
  };

  const markWordLearned = (wordId: string) => {
    if (!state.learnedWords.includes(wordId)) {
      persist({ ...state, learnedWords: [...state.learnedWords, wordId] });
    }
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <AppContext.Provider value={{ ...state, login, signup, logout, completeOnboarding, recordAttempt, completeDailyTask, toggleFavoriteWord, markWordLearned, calculateMarks, getGrade }}>
      {children}
    </AppContext.Provider>
  );
};
