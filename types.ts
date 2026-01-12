
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  avatar?: string;
}

export type GoalCategory = 'Fitness' | 'Mindset' | 'Learning' | 'Work' | 'Personal' | 'Other';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  dailyTarget: string;
  category: GoalCategory;
  currentLevel: number;
  streak: number;
  lastCompleted: string | null;
  completionHistory: string[];
  createdAt: string;
  reminderTime?: string;
  reminderFrequency?: 'Daily' | 'Weekly' | 'None';
  reminderDays?: number[]; // 0-6 for Sunday-Saturday
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export type Theme = 'light' | 'dark';
