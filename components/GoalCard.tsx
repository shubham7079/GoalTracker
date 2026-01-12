
import React, { useState, useEffect, useRef } from 'react';
import { Goal, GoalCategory } from '../types';
import GoalCalendar from './GoalCalendar';
import { formatRelativeTime, playAlarmSound, formatLocalizedDate } from '../utils';

interface GoalCardProps {
  goal: Goal;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getCategoryStyles = (category: GoalCategory) => {
  switch (category) {
    case 'Fitness': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Mindset': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Learning': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Work': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    case 'Personal': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
};

const getCategoryIcon = (category: GoalCategory) => {
  switch (category) {
    case 'Fitness':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'Mindset':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
        </svg>
      );
    case 'Learning':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'Work':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'Personal':
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
        </svg>
      );
  }
};

const GoalCard: React.FC<GoalCardProps> = ({ goal, onComplete, onDelete, onEdit }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // TIMER COMPLETED
      playAlarmSound();
      setIsTimerRunning(false);
      
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSetTimer = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setIsTimerRunning(false);
  };

  const isCompletedToday = () => {
    if (!goal.lastCompleted) return false;
    const last = new Date(goal.lastCompleted);
    const today = new Date();
    return (
      last.getDate() === today.getDate() &&
      last.getMonth() === today.getMonth() &&
      last.getFullYear() === today.getFullYear()
    );
  };

  const getReminderSummary = () => {
    if (!goal.reminderFrequency || goal.reminderFrequency === 'None') return null;
    if (goal.reminderFrequency === 'Daily') return `${goal.reminderTime} Daily`;
    if (goal.reminderFrequency === 'Weekly') {
      const days = goal.reminderDays?.length 
        ? goal.reminderDays.map(d => WEEKDAYS_SHORT[d]).join(', ')
        : 'Weekly';
      return `${goal.reminderTime} • ${days}`;
    }
    return null;
  };

  const progress = (goal.streak % 7) / 7 * 100;
  const completed = isCompletedToday();
  const reminderSummary = getReminderSummary();

  return (
    <div className={`relative group p-6 rounded-[2.5rem] border transition-all duration-300 ${
      completed 
        ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl'
    }`}>
      {completed && (
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce z-10 border-4 border-white dark:border-slate-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-2 flex-grow pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`self-start px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getCategoryStyles(goal.category || 'Other')}`}>
              {getCategoryIcon(goal.category || 'Other')}
              {goal.category || 'Other'}
            </span>
            {reminderSummary && (
              <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {reminderSummary}
              </span>
            )}
          </div>
          <h3 className={`text-xl font-bold truncate ${completed ? 'text-primary-800 dark:text-primary-300' : 'text-slate-900 dark:text-slate-100'}`}>
            {goal.title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
           <button 
            onClick={() => onEdit(goal)}
            className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
            title="Edit Goal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(goal.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            title="Delete Goal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium line-clamp-2">{goal.dailyTarget}</p>
      
      {goal.lastCompleted && (
        <div 
          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1 cursor-help"
          title={formatLocalizedDate(goal.lastCompleted)}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last win: {formatRelativeTime(goal.lastCompleted)}
        </div>
      )}

      <div className="space-y-5">
        <div className="flex justify-between items-center text-sm font-semibold">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full">
            <span className="text-lg">🔥</span>
            <span>{goal.streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full">
            <span className="text-lg">⭐</span>
            <span>Level {goal.currentLevel}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
            <span>Progress to Lv. {goal.currentLevel + 1}</span>
            <span>{goal.streak % 7} / 7 Days</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onComplete(goal.id)}
            disabled={completed}
            className={`flex-grow py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest ${
              completed 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 active:scale-[0.97]'
            }`}
          >
            {completed ? 'Victory for Today' : 'Complete Target'}
          </button>
          
          <button
            onClick={() => { setShowTimer(!showTimer); setShowHistory(false); }}
            className={`p-4 rounded-2xl border transition-all ${
              showTimer 
                ? 'bg-primary-600 text-white border-primary-600' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Focus Timer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={() => { setShowHistory(!showHistory); setShowTimer(false); }}
            className={`p-4 rounded-2xl border transition-all ${
              showHistory 
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="View History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {showTimer && (
          <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isTimerRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isTimerRunning ? 'bg-primary-500' : timeLeft === 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></span>
                </span>
                Focus Timer
              </h4>
              {timeLeft === 0 && <span className="text-[10px] font-black text-red-600 animate-bounce uppercase tracking-tighter">Time's Up! 🔔</span>}
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className={`text-4xl font-black font-mono tracking-widest transition-all duration-300 ${timeLeft === 0 ? 'text-red-500 scale-110 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                {formatTime(timeLeft)}
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {[5, 25, 60].map(m => (
                  <button 
                    key={m}
                    onClick={() => handleSetTimer(m)}
                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black text-slate-400 hover:text-primary-600 hover:border-primary-500 transition-all"
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  disabled={timeLeft === 0 && !isTimerRunning}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isTimerRunning 
                      ? 'bg-amber-500 text-white' 
                      : timeLeft === 0 
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50`}
                >
                  {isTimerRunning ? 'Pause' : timeLeft === 0 ? 'Completed' : 'Start'}
                </button>
                <button
                  onClick={() => { setIsTimerRunning(false); setTimeLeft(25 * 60); }}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistory && (
          <GoalCalendar completionHistory={goal.completionHistory} />
        )}
      </div>
    </div>
  );
};

export default GoalCard;
