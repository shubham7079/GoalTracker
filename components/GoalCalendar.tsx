
import React from 'react';
import { formatLocalizedDate } from '../utils';

interface GoalCalendarProps {
  completionHistory: string[];
}

const GoalCalendar: React.FC<GoalCalendarProps> = ({ completionHistory }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Get days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getCompletionForDay = (day: number) => {
    return completionHistory.find(dateStr => {
      const d = new Date(dateStr);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = today.toLocaleString('default', { month: 'long' });

  return (
    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {monthName} {year}
        </h4>
        <div className="flex gap-2 items-center">
           <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Done</span>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[8px] font-black text-slate-300 dark:text-slate-600 mb-1">{d}</div>
        ))}
        
        {blanks.map(i => (
          <div key={`blank-${i}`} className="aspect-square"></div>
        ))}
        
        {days.map(day => {
          const completionDate = getCompletionForDay(day);
          const completed = !!completionDate;
          const isToday = day === today.getDate();
          
          return (
            <div 
              key={day}
              title={completed ? `Completed on ${formatLocalizedDate(completionDate)}` : `Day ${day}`}
              className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-lg transition-all relative cursor-default ${
                completed 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : isToday 
                    ? 'border-2 border-primary-500 text-primary-500' 
                    : 'text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalCalendar;
