
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Goal, GoalCategory } from '../types';
import * as goalService from '../services/goalService';
import GoalCard from '../components/GoalCard';
import ProgressStats from '../components/ProgressStats';
import { GoogleGenAI } from "@google/genai";
import { playSuccessSound, playLevelUpSound, formatLocalizedDate, formatRelativeTime } from '../utils';

const CATEGORIES: GoalCategory[] = ['Fitness', 'Mindset', 'Learning', 'Work', 'Personal', 'Other'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Dashboard: React.FC = () => {
  const { auth } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSmartTimeLoading, setIsSmartTimeLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<GoalCategory | 'All'>('All');
  
  // Form State
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    dailyTarget: '',
    category: 'Other' as GoalCategory,
    reminderTime: '',
    reminderFrequency: 'None' as 'Daily' | 'Weekly' | 'None',
    reminderDays: [] as number[]
  });

  useEffect(() => {
    fetchGoals();
  }, [auth.user]);

  const fetchGoals = async () => {
    if (!auth.user) return;
    try {
      const data = await goalService.getUserGoals(auth.user.id);
      setGoals(data);
      if (data.length > 0) generateAiInsight(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsight = async (currentGoals: Goal[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const goalList = currentGoals.map(g => g.title).join(", ");
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `The user ${auth.user?.name} has the following active goals: ${goalList}. Give them a one-sentence, short, punchy motivational insight or boost for today. Be creative and concise (max 15 words).`,
      });
      setAiInsight(response.text?.trim() || "");
    } catch (err) {
      console.error("AI Insight failed", err);
    }
  };

  const handleSuggestTarget = async () => {
    if (!formData.title) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest a concise daily target for a goal titled "${formData.title}". Keep it under 8 words.`,
      });
      setFormData(prev => ({ ...prev, dailyTarget: response.text?.trim() || "" }));
    } catch (err) {
      console.error("AI Suggestion failed", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSmartTime = async () => {
    if (!formData.title) return;
    setIsSmartTimeLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest an optimal HH:MM time (24h format) for a reminder for the goal: "${formData.title}" in category "${formData.category}". ONLY return the time in HH:MM format, nothing else.`,
      });
      const suggestedTime = response.text?.trim() || "09:00";
      // Validate time format briefly
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(suggestedTime)) {
        setFormData(prev => ({ ...prev, reminderTime: suggestedTime }));
      }
    } catch (err) {
      console.error("Smart Time failed", err);
    } finally {
      setIsSmartTimeLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const currentGoal = goals.find(g => g.id === id);
      const oldLevel = currentGoal?.currentLevel || 1;
      
      const updated = await goalService.completeGoal(id);
      
      // Play sound based on outcome
      if (updated.currentLevel > oldLevel) {
        playLevelUpSound();
      } else {
        playSuccessSound();
      }

      setGoals(prev => prev.map(g => g.id === id ? updated : g));
      if (updated.streak % 5 === 0) generateAiInsight(goals);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await goalService.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) return;
    
    // Simple validation
    if (formData.reminderFrequency === 'Weekly' && formData.reminderDays.length === 0) {
      alert("Please select at least one day for weekly reminders.");
      return;
    }

    try {
      if (editingGoal) {
        await goalService.updateGoal(editingGoal.id, formData);
      } else {
        await goalService.addGoal(
          auth.user.id, 
          formData.title, 
          formData.description, 
          formData.dailyTarget, 
          formData.category,
          formData.reminderTime || undefined,
          formData.reminderFrequency,
          formData.reminderDays
        );
      }
      fetchGoals();
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReminderDay = (day: number) => {
    setFormData(prev => {
      const days = prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day].sort();
      return { ...prev, reminderDays: days };
    });
  };

  const openModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({ 
        title: goal.title, 
        description: goal.description, 
        dailyTarget: goal.dailyTarget, 
        category: goal.category,
        reminderTime: goal.reminderTime || '',
        reminderFrequency: goal.reminderFrequency || 'None',
        reminderDays: goal.reminderDays || []
      });
    } else {
      setEditingGoal(null);
      setFormData({ 
        title: '', 
        description: '', 
        dailyTarget: '', 
        category: 'Other',
        reminderTime: '',
        reminderFrequency: 'None',
        reminderDays: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const filteredGoals = activeFilter === 'All' 
    ? goals 
    : goals.filter(g => g.category === activeFilter);

  const getReminderPreview = () => {
    if (formData.reminderFrequency === 'None') return "No alerts scheduled.";
    if (!formData.reminderTime) return "Select a time for your alert.";
    
    if (formData.reminderFrequency === 'Daily') {
      return `Alert sent daily at ${formData.reminderTime}.`;
    }
    
    if (formData.reminderFrequency === 'Weekly') {
      if (formData.reminderDays.length === 0) return "Select days for your weekly schedule.";
      const days = formData.reminderDays.map(d => WEEKDAYS_FULL[d].substring(0, 3)).join(', ');
      return `Alert every ${days} at ${formData.reminderTime}.`;
    }
    return "";
  };

  const stats = {
    totalCompletions: goals.reduce((acc, g) => acc + g.completionHistory.length, 0),
    avgLevel: goals.length > 0 ? (goals.reduce((acc, g) => acc + g.currentLevel, 0) / goals.length).toFixed(1) : 0,
    topStreak: Math.max(0, ...goals.map(g => g.streak)),
    activeReminders: goals.filter(g => g.reminderFrequency !== 'None').length
  };

  // Recent Wins display for editing modal
  const recentWins = editingGoal 
    ? [...editingGoal.completionHistory].reverse().slice(0, 5) 
    : [];

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Welcome & AI Insight */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Hello, {auth.user?.name.split(' ')[0]} 👋
            </h1>
            {aiInsight ? (
              <div className="flex items-center gap-3 py-3 px-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-xl">✨</span>
                <p className="text-lg font-medium text-primary-200 leading-tight">{aiInsight}</p>
              </div>
            ) : (
              <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse"></div>
            )}
          </div>
          <button 
            onClick={() => openModal()}
            className="group px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary-500/25 flex items-center gap-3 active:scale-95"
          >
            <span className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </span>
            Add Goal
          </button>
        </div>
        
        <div className="relative z-10 mt-10 grid grid-cols-4 gap-4 border-t border-white/10 pt-8">
           <div className="text-center">
             <div className="text-2xl font-black">{stats.totalCompletions}</div>
             <div className="text-[8px] font-black uppercase tracking-widest text-white/50">Total Wins</div>
           </div>
           <div className="text-center border-x border-white/10">
             <div className="text-2xl font-black">{stats.topStreak}</div>
             <div className="text-[8px] font-black uppercase tracking-widest text-white/50">Top Streak</div>
           </div>
           <div className="text-center border-r border-white/10">
             <div className="text-2xl font-black">{stats.avgLevel}</div>
             <div className="text-[8px] font-black uppercase tracking-widest text-white/50">Avg. Level</div>
           </div>
           <div className="text-center">
             <div className="text-2xl font-black">{stats.activeReminders}</div>
             <div className="text-[8px] font-black uppercase tracking-widest text-white/50">Alerts On</div>
           </div>
        </div>

        <div className="absolute -bottom-12 -right-12 text-white/5 rotate-12 select-none pointer-events-none">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
        </div>
      </div>

      {goals.length > 0 && <ProgressStats goals={goals} />}

      {goals.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            <button
              onClick={() => setActiveFilter('All')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeFilter === 'All' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-primary-500'}`}
            >
              All Goals
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeFilter === cat ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-primary-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
            Showing {filteredGoals.length} {activeFilter === 'All' ? 'Goals' : `${activeFilter} Goals`}
          </p>
        </div>
      )}

      {filteredGoals.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
          <div className="text-8xl mb-6">{goals.length === 0 ? '🏝️' : '🔍'}</div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {goals.length === 0 ? 'Your Dashboard is Calm' : `No ${activeFilter} Goals Yet`}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
            {goals.length === 0 ? 'Start your transformation by adding your first goal.' : 'Try adjusting your filters or add a new goal in this category.'}
          </p>
          <button 
            onClick={() => openModal()}
            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {goals.length === 0 ? 'Create Your First Goal' : 'Add Category Goal'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGoals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onComplete={handleComplete} 
              onDelete={handleDelete}
              onEdit={openModal}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingGoal ? 'Edit Goal' : 'New Adventure'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Recent Activity Context Summary */}
              {editingGoal && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Wins</h4>
                   </div>
                   {recentWins.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                        {recentWins.map((date, idx) => (
                          <div 
                            key={idx} 
                            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 cursor-help"
                            title={formatLocalizedDate(date)}
                          >
                             <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                             {formatRelativeTime(date)}
                          </div>
                        ))}
                     </div>
                   ) : (
                     <p className="text-[10px] font-medium text-slate-400 italic">No completions yet. Your first victory awaits!</p>
                   )}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Select Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat})}
                        className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.category === cat ? 'bg-primary-600 border-primary-600 text-white shadow-lg ring-4 ring-primary-500/10 scale-105' : 'bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 hover:border-primary-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Goal Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 outline-none font-bold text-slate-900 dark:text-white transition-all focus:ring-4 focus:ring-primary-500/5"
                    placeholder="e.g. Daily Coding Challenge"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Target</label>
                    <button type="button" onClick={handleSuggestTarget} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-400 disabled:opacity-50 flex items-center gap-1 transition-colors">
                      {isAiLoading ? (
                        <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : '✨ Magic Target'}
                    </button>
                  </div>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 outline-none font-bold text-slate-900 dark:text-white transition-all focus:ring-4 focus:ring-primary-500/5"
                    placeholder="e.g. 1 hour of React practice"
                    value={formData.dailyTarget}
                    onChange={e => setFormData({...formData, dailyTarget: e.target.value})}
                  />
                </div>

                {/* Reminder Settings Section */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Alerts</h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Frequency</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 outline-none font-bold text-sm text-slate-900 dark:text-white transition-all"
                        value={formData.reminderFrequency}
                        onChange={e => setFormData({...formData, reminderFrequency: e.target.value as any})}
                      >
                        <option value="None">Disabled</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2 ml-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time</label>
                        <button 
                          type="button" 
                          onClick={handleSmartTime}
                          disabled={formData.reminderFrequency === 'None'}
                          className="text-[8px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-400 disabled:opacity-30 flex items-center gap-1 transition-opacity"
                        >
                          {isSmartTimeLoading ? '...' : '✨ Smart Time'}
                        </button>
                      </div>
                      <input 
                        type="time"
                        disabled={formData.reminderFrequency === 'None'}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 outline-none font-bold text-sm text-slate-900 dark:text-white transition-all disabled:opacity-50"
                        value={formData.reminderTime}
                        onChange={e => setFormData({...formData, reminderTime: e.target.value})}
                      />
                    </div>
                  </div>

                  {formData.reminderFrequency === 'Weekly' && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1 text-center">Repeat On</label>
                      <div className="flex justify-between items-center px-2">
                        {WEEKDAYS.map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleReminderDay(idx)}
                            className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center border-2 transition-all ${
                              formData.reminderDays.includes(idx)
                                ? 'bg-primary-600 border-primary-600 text-white shadow-md scale-110'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-primary-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                     <div className="text-[9px] font-bold text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2 rounded-lg text-center border border-slate-200/50 dark:border-slate-700/50">
                        {getReminderPreview()}
                     </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Goal Description (Optional)</label>
                  <textarea 
                    rows={2}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 outline-none font-medium text-slate-600 dark:text-slate-400 resize-none transition-all focus:ring-4 focus:ring-primary-500/5"
                    placeholder="Why is this important to you?"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-5 bg-primary-600 text-white font-black rounded-[2rem] shadow-xl shadow-primary-500/20 hover:bg-primary-500 active:scale-95 transition-all uppercase tracking-widest text-xs">
                  {editingGoal ? 'Update Goal' : 'Create Adventure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
