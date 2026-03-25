export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  year: string;
  branch: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  goal: string;
  dailyTarget: number;
  streak: number;
  totalMarks: number;
  placementReadinessScore: number;
  grammarScore: number;
  vocabularyScore: number;
  speakingScore: number;
  lessonsCompleted: number;
  joinedDate: string;
  learningPath: string;
  badges: string[];
}

export type QuestionType = 'mcq' | 'fill-blank' | 'sentence-correction' | 'rearrange' | 'match' | 'vocabulary' | 'speaking' | 'pronunciation' | 'interview';

export interface Question {
  id: string;
  lessonId: string;
  type: QuestionType;
  question: string;
  options?: string[];
  acceptedAnswers?: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  attemptsAllowed: number;
  hint?: string;
  matchPairs?: { left: string; right: string }[];
  words?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  estimatedTime: string;
  marksTotal: number;
  questions: Question[];
  icon: string;
}

export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  example: string;
  pronunciationHint: string;
  synonyms: string[];
  antonyms: string[];
  level: string;
  category: string;
  interviewUsage: string;
}

export interface SpeakingPrompt {
  id: string;
  category: string;
  prompt: string;
  expectedDuration: number;
  marks: number;
  tips: string[];
  sampleResponse?: string;
}

export interface TaskAttempt {
  questionId: string;
  answer: string;
  correct: boolean;
  attemptNumber: number;
  marksEarned: number;
  timeSpent: number;
}

export interface LessonProgress {
  lessonId: string;
  score: number;
  percentage: number;
  attempts: TaskAttempt[];
  completed: boolean;
  date: string;
}

export interface DailyProgress {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  marksEarned: number;
  streakMaintained: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  category: string;
}
