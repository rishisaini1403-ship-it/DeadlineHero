export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin';
  points: number;
  level: number;
  streak: number;
  bestStreak: number;
  badges: string[];
  preferences?: {
    emailNotifications: boolean;
    reminderTime: number;
    theme: 'light' | 'dark';
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}