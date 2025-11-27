import React, { useState, useEffect } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, Circle, Trophy, BarChart3 } from 'lucide-react';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Type for daily log: { "Fajr": true, "Dhuhr": false ... }
type DailyLog = Record<string, boolean>;
// Type for all history: { "2023-10-27": { ... }, ... }
type TrackerHistory = Record<string, DailyLog>;

const TrackerView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [history, setHistory] = useState<TrackerHistory>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('prayer_tracker');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Calculate streak based on "All 5 prayers"
    // This is a simple calculation: consecutive days ending yesterday/today where count is 5
    let currentStreak = 0;
    const today = new Date();
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const k = formatDateKey(d);
        const dayData = history[k];
        if (dayData && Object.values(dayData).filter(Boolean).length === 5) {
            currentStreak++;
        } else {
            // Allow today to be incomplete without breaking streak yet, unless we look at yesterday
            if (i === 0) continue; 
            break; 
        }
    }
    setStreak(currentStreak);
  }, [history]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayData = (date: Date): DailyLog => {
    const key = formatDateKey(date);
    return history[key] || {};
  };

  const togglePrayer = (prayer: string) => {
    const key = formatDateKey(selectedDate);
    const currentDayData = history[key] || {};
    
    const newDayData = {
      ...currentDayData,
      [prayer]: !currentDayData[prayer]
    };

    const newHistory = {
      ...history,
      [key]: newDayData
    };

    setHistory(newHistory);
    localStorage.setItem('prayer_tracker', JSON.stringify(newHistory));
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const currentKey = formatDateKey(selectedDate);
  const currentData = history[currentKey] || {};
  const completedCount = Object.values(currentData).filter(Boolean).length;
  const progress = (completedCount / 5) * 100;

  // Format date for display
  const displayDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isToday = formatDateKey(new Date()) === currentKey;

  // Generate last 7 days for chart
  const weeklyStats = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const k = formatDateKey(d);
      const dayData = history[k] || {};
      const count = Object.values(dayData).filter(Boolean).length;
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), count, fullDate: k };
  });

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              Prayer Tracker
            </h2>
            <p className="text-xs text-slate-500">Track your Namaz habits</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
             <Trophy className="w-4 h-4 text-amber-500" />
             <span className="text-xs font-bold text-amber-700">{streak} Day Streak</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <ChevronLeft size={24} />
            </button>
            <div className="text-center">
                <span className="block font-bold text-slate-800 text-sm">{isToday ? 'Today' : displayDate.split(',')[0]}</span>
                <span className="text-xs text-slate-400">{selectedDate.toLocaleDateString()}</span>
            </div>
            <button 
                onClick={() => changeDate(1)} 
                disabled={isToday}
                className={`p-2 rounded-xl transition-colors ${isToday ? 'text-slate-200' : 'hover:bg-slate-100 text-slate-400'}`}
            >
                <ChevronRight size={24} />
            </button>
        </div>

        {/* Daily Progress */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10"></div>
             
             <div>
                 <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">Daily Progress</p>
                 <h3 className="text-3xl font-bold">{completedCount} <span className="text-lg text-emerald-200 font-normal">/ 5</span></h3>
                 <p className="text-xs text-emerald-200 mt-2">
                     {completedCount === 5 ? "Alhamdulillah! All prayers offered." : "Keep it up!"}
                 </p>
             </div>

             <div className="relative w-16 h-16">
                 {/* Circular Progress (Simplified SVG) */}
                 <svg className="w-full h-full transform -rotate-90">
                     <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-emerald-900/30" />
                     <circle 
                        cx="32" cy="32" r="28" 
                        stroke="white" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={175.9} 
                        strokeDashoffset={175.9 - (175.9 * progress) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                     />
                 </svg>
             </div>
        </div>

        {/* Prayer List */}
        <div className="space-y-3">
             {PRAYERS.map((prayer) => {
                 const isDone = currentData[prayer];
                 return (
                     <button
                        key={prayer}
                        onClick={() => togglePrayer(prayer)}
                        className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all duration-200 ${
                            isDone 
                                ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                                : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'
                        }`}
                     >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {isDone ? <CheckCircle2 size={20} className="fill-current" /> : <Circle size={20} />}
                            </div>
                            <span className={`font-bold text-lg ${isDone ? 'text-emerald-900' : 'text-slate-700'}`}>{prayer}</span>
                        </div>
                        
                        <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                            {isDone ? 'Offered' : 'Pending'}
                        </div>
                     </button>
                 );
             })}
        </div>

        {/* Weekly Stats Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 mb-4">
                 <BarChart3 className="w-5 h-5 text-emerald-600" />
                 <h3 className="font-bold text-slate-800">Weekly Overview</h3>
             </div>
             
             <div className="flex items-end justify-between h-32 gap-2">
                 {weeklyStats.map((stat, idx) => (
                     <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                         <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end overflow-hidden h-full">
                             <div 
                                className={`w-full transition-all duration-500 ${stat.count === 5 ? 'bg-emerald-500' : stat.count > 0 ? 'bg-emerald-300' : 'bg-slate-200'}`}
                                style={{ height: `${(stat.count / 5) * 100}%` }}
                             ></div>
                         </div>
                         <div className={`text-[10px] font-bold ${stat.fullDate === currentKey ? 'text-emerald-600' : 'text-slate-400'}`}>
                             {stat.day}
                         </div>
                     </div>
                 ))}
             </div>
        </div>

      </div>
    </div>
  );
};

export default TrackerView;