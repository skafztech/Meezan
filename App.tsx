import React, { useState, useEffect } from 'react';
import { View, Coordinates } from './types';
import { MOCK_COORDINATES } from './constants';
import PrayerTimesView from './components/PrayerTimesView';
import QuranView from './components/QuranView';
import AIChatView from './components/AIChatView';
import TasbihView from './components/TasbihView';
import QiblaCompass from './components/QiblaCompass';
import NamesView from './components/NamesView';
import ZakatView from './components/ZakatView';
import HadithView from './components/HadithView';
import TrackerView from './components/TrackerView';
import { Home, BookOpen, Clock, Compass, MessageCircle, Hash, Moon, Sun, Scroll, Calculator, Book, CalendarCheck } from 'lucide-react';
import { getDailyInspiration } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{arabic: string, translation: string, reference: string} | null>(null);
  
  useEffect(() => {
    // Try to get real location, fallback to mock if denied/unavailable
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("Using default coordinates due to error:", error);
          setCoords(MOCK_COORDINATES);
        }
      );
    } else {
      setCoords(MOCK_COORDINATES);
    }

    // Load daily inspiration
    getDailyInspiration().then(setDailyQuote);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case View.PRAYER_TIMES: return <PrayerTimesView coords={coords} />;
      case View.QURAN: return <QuranView />;
      case View.CHAT: return <AIChatView />;
      case View.TASBIH: return <TasbihView />;
      case View.QIBLA: return <QiblaCompass coords={coords} />;
      case View.NAMES: return <NamesView />;
      case View.ZAKAT: return <ZakatView />;
      case View.HADITH: return <HadithView />;
      case View.TRACKER: return <TrackerView />;
      case View.HOME:
      default:
        return (
          <div className="p-6 space-y-6 overflow-y-auto pb-24 h-full">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Meezan</h1>
                    <p className="text-slate-500 text-sm">Your Islamic Companion</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                    <Moon size={20} />
                </div>
            </header>

            {/* Daily Inspiration Card */}
            <div className="bg-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                    <Sun size={120} />
                </div>
                <h3 className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">Daily Inspiration</h3>
                {dailyQuote ? (
                    <div className="space-y-4 relative z-10">
                        <p className="font-arabic text-2xl text-right leading-loose">{dailyQuote.arabic}</p>
                        <p className="text-emerald-50 text-sm italic">"{dailyQuote.translation}"</p>
                        <p className="text-emerald-300 text-xs font-bold text-right">— {dailyQuote.reference}</p>
                    </div>
                ) : (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-emerald-600 rounded w-3/4"></div>
                        <div className="h-4 bg-emerald-600 rounded w-1/2"></div>
                    </div>
                )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setCurrentView(View.PRAYER_TIMES)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors">
                    <div className="p-3 bg-orange-50 text-orange-500 rounded-full"><Clock size={24} /></div>
                    <span className="font-medium text-slate-700">Prayer Times</span>
                </button>
                <button onClick={() => setCurrentView(View.QURAN)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-full"><BookOpen size={24} /></div>
                    <span className="font-medium text-slate-700">Quran</span>
                </button>
                <button onClick={() => setCurrentView(View.QIBLA)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors">
                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full"><Compass size={24} /></div>
                    <span className="font-medium text-slate-700">Qibla</span>
                </button>
                <button onClick={() => setCurrentView(View.TASBIH)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors">
                    <div className="p-3 bg-rose-50 text-rose-500 rounded-full"><Hash size={24} /></div>
                    <span className="font-medium text-slate-700">Tasbih</span>
                </button>
                 <button onClick={() => setCurrentView(View.NAMES)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors">
                    <div className="p-3 bg-purple-50 text-purple-500 rounded-full"><Scroll size={24} /></div>
                    <span className="font-medium text-slate-700">99 Names</span>
                </button>
                <button onClick={() => setCurrentView(View.TRACKER)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors">
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full"><CalendarCheck size={24} /></div>
                    <span className="font-medium text-slate-700">Tracker</span>
                </button>
                 <button onClick={() => setCurrentView(View.HADITH)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors col-span-2">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-full"><Book size={24} /></div>
                    <span className="font-medium text-slate-700">Hadith</span>
                </button>
                <button onClick={() => setCurrentView(View.ZAKAT)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 transition-colors col-span-2">
                    <div className="p-3 bg-teal-50 text-teal-500 rounded-full"><Calculator size={24} /></div>
                    <span className="font-medium text-slate-700">Zakat Calculator</span>
                </button>
            </div>

            {/* AI Assistant Promo */}
            <button onClick={() => setCurrentView(View.CHAT)} className="w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white flex items-center justify-between shadow-lg group">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                        <MessageCircle size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Ask Meezan AI</h3>
                        <p className="text-slate-400 text-xs">Islamic Scholar Assistant</p>
                    </div>
                </div>
                <div className="text-slate-400 group-hover:translate-x-1 transition-transform">→</div>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex justify-center bg-slate-200 min-h-screen font-sans">
      <div className="w-full max-w-md bg-white h-[100dvh] overflow-hidden flex flex-col relative shadow-2xl">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative bg-slate-50">
           {renderView()}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 z-50 absolute bottom-0 w-full pb-safe">
            <NavButton active={currentView === View.HOME} icon={<Home size={24} />} label="Home" onClick={() => setCurrentView(View.HOME)} />
            <NavButton active={currentView === View.QURAN} icon={<BookOpen size={24} />} label="Quran" onClick={() => setCurrentView(View.QURAN)} />
            <NavButton active={currentView === View.CHAT} icon={<MessageCircle size={24} />} label="Meezan AI" onClick={() => setCurrentView(View.CHAT)} isMain />
            <NavButton active={currentView === View.PRAYER_TIMES} icon={<Clock size={24} />} label="Prayers" onClick={() => setCurrentView(View.PRAYER_TIMES)} />
        </nav>
      </div>
    </div>
  );
};

interface NavButtonProps {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isMain?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick, isMain }) => {
    if (isMain) {
        return (
            <button 
                onClick={onClick}
                className={`-mt-8 p-4 rounded-full shadow-lg border-4 border-slate-50 transition-all active:scale-95 ${active ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}
            >
                {icon}
            </button>
        )
    }
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <div className={`mb-1 transition-transform ${active ? '-translate-y-1' : ''}`}>{icon}</div>
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
};

export default App;