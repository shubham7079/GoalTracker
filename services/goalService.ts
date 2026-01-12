import { Goal, GoalCategory } from '../types';

const BASE_URL = ''; 
const API_URL = `${BASE_URL}/api/goals`;
const MOCK_GOALS_KEY = 'dgt_mock_goals';

const isStandalone = () => !BASE_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-auth-token': localStorage.getItem('dgt_token') || ''
});

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  if (res.status === 404 || (contentType && !contentType.includes("application/json"))) {
    throw new Error("Goal service not available. Check your backend configuration.");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || `Error: ${res.status}`);
  return data;
};

export const getUserGoals = async (userId: string): Promise<Goal[]> => {
  if (isStandalone()) {
    const goals = JSON.parse(localStorage.getItem(MOCK_GOALS_KEY) || '[]');
    return goals.filter((g: Goal) => g.userId === userId);
  }
  const res = await fetch(API_URL, { headers: getHeaders() });
  return handleResponse(res);
};

export const addGoal = async (
  userId: string, 
  title: string, 
  description: string, 
  dailyTarget: string, 
  category: GoalCategory = 'Other',
  reminderTime?: string,
  reminderFrequency?: 'Daily' | 'Weekly' | 'None',
  reminderDays?: number[]
): Promise<Goal> => {
  if (isStandalone()) {
    const goals = JSON.parse(localStorage.getItem(MOCK_GOALS_KEY) || '[]');
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      description,
      dailyTarget,
      category,
      currentLevel: 1,
      streak: 0,
      lastCompleted: null,
      completionHistory: [],
      createdAt: new Date().toISOString(),
      reminderTime,
      reminderFrequency,
      reminderDays
    };
    goals.push(newGoal);
    localStorage.setItem(MOCK_GOALS_KEY, JSON.stringify(goals));
    return newGoal;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, description, dailyTarget, category, reminderTime, reminderFrequency, reminderDays })
  });
  return handleResponse(res);
};

export const updateGoal = async (id: string, updates: Partial<Goal>): Promise<Goal> => {
  if (isStandalone()) {
    const goals = JSON.parse(localStorage.getItem(MOCK_GOALS_KEY) || '[]');
    const index = goals.findIndex((g: Goal) => g.id === id);
    if (index === -1) throw new Error('Goal not found');
    goals[index] = { ...goals[index], ...updates };
    localStorage.setItem(MOCK_GOALS_KEY, JSON.stringify(goals));
    return goals[index];
  }

  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return handleResponse(res);
};

export const deleteGoal = async (id: string): Promise<void> => {
  if (isStandalone()) {
    const goals = JSON.parse(localStorage.getItem(MOCK_GOALS_KEY) || '[]');
    const filtered = goals.filter((g: Goal) => g.id !== id);
    localStorage.setItem(MOCK_GOALS_KEY, JSON.stringify(filtered));
    return;
  }

  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete goal');
};

export const completeGoal = async (id: string): Promise<Goal> => {
  if (isStandalone()) {
    const goals = JSON.parse(localStorage.getItem(MOCK_GOALS_KEY) || '[]');
    const index = goals.findIndex((g: Goal) => g.id === id);
    if (index === -1) throw new Error('Goal not found');
    
    const goal = goals[index];
    const now = new Date();
    goal.streak += 1;
    if (goal.streak > 0 && goal.streak % 7 === 0) goal.currentLevel += 1;
    goal.lastCompleted = now.toISOString();
    goal.completionHistory.push(now.toISOString());
    
    localStorage.setItem(MOCK_GOALS_KEY, JSON.stringify(goals));
    return goal;
  }

  const res = await fetch(`${API_URL}/${id}/complete`, {
    method: 'POST',
    headers: getHeaders()
  });
  return handleResponse(res);
};