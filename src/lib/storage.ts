// Local storage utilities for offline-first ERP

const STORAGE_PREFIX = 'erp_';

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

// Auth storage
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export function getAuthState(): AuthState {
  return getItem<AuthState>('auth', {
    isAuthenticated: false,
    user: null,
    token: null,
  });
}

export function setAuthState(state: AuthState): void {
  setItem('auth', state);
}

export function clearAuth(): void {
  removeItem('auth');
}

// Demo users for local auth
export const DEMO_USERS: User[] = [
  {
    id: '1',
    name: 'Management',
    email: 'vigu092@gmail.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Mohan Raj',
    email: 'goodlifefurnituremanager@gmail.com',
    role: 'manager',
  },
  {
    id: '3',
    name: 'Vikesh',
    email: 'glfslteam1@gmail.com',
    role: 'user',
  },
];

// Simple password validation (demo purposes)
export function validateCredentials(email: string, password: string): User | null {
  const user = DEMO_USERS.find((u) => u.email === email);
  // Demo: any password works
  if (user && password.length >= 4) {
    return user;
  }
  return null;
}
