import React from 'react';
import { Goal, GoalCategory } from '../types';

interface ProgressStatsProps {
  goals: Goal[];
}

const CATEGORIES: GoalCategory[] = ['Fitness', 'Mindset', 'Learning', 'Work', 'Personal', 'Other'];

const ProgressStats: React.FC<ProgressStatsProps> = ({ goals }) => {
  if (goals.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCompletedOnDate = (goal: Goal, date: Date) => {
    return goal.completionHistory.some(dStr => {
      const d = new Date(dStr);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const isCompletedToday = (goal: Goal) => isCompletedOnDate(goal, today);

  // 1. Weekly Momentum Calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weeklyData = last7Days.map(date => {
    const completedCount = goals.filter(g => isCompletedOnDate(g, date)).length;
    const totalCount = goals.length;
    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      count: completedCount,
      rate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    };
  });

  // 2. Category Stats
  const categoryStats = CATEGORIES.map(cat => {
    const catGoals = goals.filter(g => g.category === cat);
    const total = catGoals.length;
    const completedToday = catGoals.filter(isCompletedToday).length;
    const completionRate = total > 0 ? (completedToday / total) * 100 : 0;
    return { name: cat, total, completedToday, completionRate };
  }).filter(s => s.total > 0);

  // 3. Level Distribution
  const levelDistribution = goals.reduce((acc, g) => {
    acc[g.currentLevel] = (acc[g.currentLevel] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const maxLevel = Math.max(...(Object.keys(levelDistribution).map(Number) as number[]), 1);
  const levelLabels = Array.from({ length: Math.min(maxLevel, 5) }, (_, i) => i + 1);
  const maxLevelCount = Math.max(...(Object.values(levelDistribution) as number[]), 1);

  // 4. Global Summary
  const globalCompletionToday = goals.filter(isCompletedToday).length;
  const globalCompletionRate = goals.length > 0 ? (globalCompletionToday / goals.length) * 100 : 0;
  const totalLevels = goals.reduce((acc, g) => acc + g.currentLevel, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Global Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Success</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(globalCompletionRate)}%</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Mastery</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalLevels} <span className="text-xs text-slate-400">Levels</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Momentum</div>
            <div className="flex items-center gap-1">
               {weeklyData.slice(-3).map((d, i) => (
                 <div key={i} className={`w-2 h-4 rounded-full ${d.rate > 50 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
               ))}
               <span className="text-2xl font-black text-slate-900 dark:text-white ml-2">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Momentum Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Momentum</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Goal Completions Trend</p>
            </div>
          </div>
          <div className="flex items-end justify-between h-32 gap-3 px-2">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full h-full flex flex-col justify-end">
                   <div 
                    className={`w-full rounded-t-lg transition-all duration-700 ease-out hover:opacity-80 ${i === 6 ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                    style={{ height: `${Math.max(d.rate, 10)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-black">
                      {d.count} Goals Done
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${i === 6 ? 'text-primary-600' : 'text-slate-400'}`}>
                  {d.dayName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Level Spread Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Level Distribution</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Mastery across Goals</p>
            </div>
          </div>
          <div className="flex items-end justify-between h-32 gap-4 px-2">
            {levelLabels.map(lvl => {
              const count = levelDistribution[lvl] || 0;
              const height = (count / maxLevelCount) * 100;
              return (
                <div key={lvl} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full h-full flex flex-col justify-end">
                    <div 
                      className="w-full bg-orange-500 rounded-t-lg transition-all duration-1000 ease-out hover:bg-orange-400"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lv.{lvl}</span>
                </div>
              );
            })}
            {maxLevel > 5 && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full h-full flex flex-col justify-end">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-[20%] opacity-50" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">6+</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown (Vertical) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Category Focus</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Success per Realm</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {categoryStats.map(stat => (
            <div key={stat.name} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stat.name}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {stat.completedToday}/{stat.total} Completed
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                  style={{ width: `${stat.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressStats;