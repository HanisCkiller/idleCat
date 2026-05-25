import React from 'react';
import { useStore } from '../store';
import { TrendingUp, Clock, CheckCircle, SkipForward, Coffee, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Stats = () => {
  const { stats } = useStore();

  const formatUsageTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black flex items-center gap-2 uppercase tracking-tighter">
          <TrendingUp className="w-4 h-4" /> Activity Log
        </h2>
      </div>
      
      {/* Today's Stats */}
      <div className="p-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[32px] shadow-xl flex flex-col items-center text-center gap-2 group transition-all">
        <div className="flex items-center gap-2 opacity-50">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Today's Usage</span>
        </div>
        <span className="text-4xl font-black tracking-tighter tabular-nums">
          {formatUsageTime(stats.focusMinutes)}
        </span>
      </div>

      {/* 7-Day Trend */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">7-Day Usage Trend</h3>
          <span className="text-[8px] font-bold text-zinc-300 dark:text-zinc-700 uppercase">Weekly Active</span>
        </div>
        
        <div className="flex items-end justify-between h-32 gap-1.5 px-1 bg-zinc-50/50 dark:bg-zinc-800/20 p-4 rounded-3xl border border-zinc-100/50 dark:border-zinc-800/50">
          {[45, 60, 30, 80, 55, 90, 70].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
              <div 
                className="w-full bg-zinc-900 dark:bg-zinc-100 rounded-full opacity-10 group-hover/bar:opacity-100 transition-all duration-300" 
                style={{ height: `${val}%` }}
                title={`${val} mins usage`}
              />
              <span className="text-[8px] font-black text-zinc-400 group-hover/bar:text-zinc-900 dark:group-hover/bar:text-zinc-100 transition-colors">
                {['M','T','W','T','F','S','S'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          IdleCat OS Monitoring Active
        </p>
      </div>
    </div>
  );
};
