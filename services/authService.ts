import { User } from '../types';

/**
 * SET THIS to your deployed backend URL (e.g. https://my-api.onrender.com)
 * If left empty, the app will use 'LocalStorage Mode' (Standalone).
 */
const BASE_URL = ''; 
const API_URL = `${BASE_URL}/api/auth`;
const TOKEN_KEY = 'dgt_token';
const CURRENT_USER_KEY = 'dgt_current_user';
const MOCK_USERS_KEY = 'dgt_mock_users';

const isStandalone = () => !BASE_URL;

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (res.status === 404 || (contentType && !contentType.includes("application/json"))) {
    throw new Error("Backend not found. Please deploy your server or use Standalone Mode.");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || `Error: ${res.status}`);
  return data;
};

export const getStoredAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  try {
    return {
      token: token || (userStr ? 'mock-token' : null),
      user: userStr ? JSON.parse(userStr) : null
    };
  } catch {
    return { token: null, user: null };
  }
};

export const setStoredAuth = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const register = async (email: string, name: string, password: string): Promise<{ token: string; user: User }> => {
  if (isStandalone()) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) throw new Error('User already exists');
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      createdAt: new Date().toISOString()
    };
    
    users.push({ ...newUser, password });
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    return { token: 'mock-token', user: newUser };
  }

  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return handleResponse(res);
};

export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  if (isStandalone()) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid Credentials');
    
    const { password: _, ...userPublic } = user;
    return { token: 'mock-token', user: userPublic as User };
  }

  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
};

export const updateProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  if (isStandalone()) {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) throw new Error('Not logged in');
    const user = { ...JSON.parse(userStr), ...updates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'x-auth-token': token || ''
    },
    body: JSON.stringify(updates)
  });
  return handleResponse(res);
};