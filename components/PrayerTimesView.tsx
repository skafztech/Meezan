import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PrayerTimes, Coordinates, CalculationMethod, PrayerTimeOffsets } from '../types';
import { calculatePrayerTimes, CALCULATION_METHODS } from '../services/prayerService';
import { getCoordinatesForLocation, getLocationName } from '../services/geminiService';
import { Clock, MapPin, Search, Navigation, Loader2, Bell, BellOff, Volume2, X, Play, Square, Edit2, Check, RotateCcw, Settings, Plus, Minus } from 'lucide-react';

interface Props {
  coords: Coordinates | null;
}

interface AlarmConfig {
  enabled: boolean;
  sound: 'adhan' | 'soft' | 'beep';
}

const SOUNDS = {
  adhan: { name: 'Mecca Adhan', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3' },
  soft: { name: 'Soft Chime', url: 'https://assets.mixkit.co/active_storage/sfx/221/221-preview.mp3' },
  beep: { name: 'Simple Beep', url: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3' }
};

// Define explicit order and keys for prayers to ensure consistent matching
const PRAYER_ORDER: { key: keyof PrayerTimes; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
];

const PrayerTimesView: React.FC<Props> = ({ coords }) => {
  const [calculatedTimes, setCalculatedTimes] = useState<PrayerTimes | null>(null);
  const [customTimes, setCustomTimes] = useState<Partial<PrayerTimes>>({});
  const [timeOffsets, setTimeOffsets] = useState<PrayerTimeOffsets>({
    fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0
  });
  
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<keyof PrayerTimes | null>(null);
  const [timeToNext, setTimeToNext] = useState<string>('');
  
  // Settings
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>(CalculationMethod.MWL);
  const [showSettings, setShowSettings] = useState(false);

  // Search & Location State
  const [mode, setMode] = useState<'gps' | 'manual'>('gps');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualLocation, setManualLocation] = useState<{ coords: Coordinates, name: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [gpsLocationName, setGpsLocationName] = useState<string>('Locating...');

  // Alarm State
  const [alarms, setAlarms] = useState<Record<string, AlarmConfig>>({});
  const [editingAlarmPrayer, setEditingAlarmPrayer] = useState<string | null>(null);
  const [tempAlarmConfig, setTempAlarmConfig] = useState<AlarmConfig>({ enabled: false, sound: 'adhan' });
  const [activeAlarm, setActiveAlarm] = useState<string | null>(null);

  // Time Editing State
  const [editingTimeKey, setEditingTimeKey] = useState<keyof PrayerTimes | null>(null);
  const [tempTimeVal, setTempTimeVal] = useState('');
  
  // Audio Refs & State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggeredTime = useRef<string | null>(null);
  const [previewPlayingKey, setPreviewPlayingKey] = useState<string | null>(null);

  // Load Saved Data
  useEffect(() => {
    const savedAlarms = localStorage.getItem('prayer_alarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }

    const savedCustomTimes = localStorage.getItem('custom_prayer_times');
    if (savedCustomTimes) {
      setCustomTimes(JSON.parse(savedCustomTimes));
    }

    const savedMethod = localStorage.getItem('calculation_method');
    if (savedMethod && Object.values(CalculationMethod).includes(savedMethod as CalculationMethod)) {
      setCalculationMethod(savedMethod as CalculationMethod);
    }

    const savedOffsets = localStorage.getItem('prayer_offsets');
    if (savedOffsets) {
      setTimeOffsets(JSON.parse(savedOffsets));
    }
  }, []);

  // Determine which coordinates to use - Memoized to prevent loops
  const activeCoords = useMemo(() => {
    return mode === 'gps' ? coords : (manualLocation ? manualLocation.coords : null);
  }, [mode, coords, manualLocation]);

  // Fetch Location Name for GPS
  useEffect(() => {
    const resolveGpsName = async () => {
      if (mode === 'gps' && coords) {
         // Optimization for Mock Coords (Mecca)
         if (coords.latitude === 21.4225 && coords.longitude === 39.8262) {
             setGpsLocationName("Mecca, Saudi Arabia");
             return;
         }
         
         const name = await getLocationName(coords.latitude, coords.longitude);
         setGpsLocationName(name || `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`);
      }
    };
    resolveGpsName();
  }, [mode, coords]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      const result = await getCoordinatesForLocation(searchQuery);
      if (result) {
        setManualLocation({
          coords: { latitude: result.latitude, longitude: result.longitude },
          name: result.name
        });
        setMode('manual');
        setSearchQuery('');
      } else {
        setSearchError('Location not found.');
      }
    } catch (e) {
      setSearchError('Error searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  const updateCalculationMethod = (method: CalculationMethod) => {
    setCalculationMethod(method);
    localStorage.setItem('calculation_method', method);
  };

  const updateOffset = (key: keyof PrayerTimes, delta: number) => {
    const newOffsets = { ...timeOffsets, [key]: (timeOffsets[key] || 0) + delta };
    setTimeOffsets(newOffsets);
    localStorage.setItem('prayer_offsets', JSON.stringify(newOffsets));
  };

  // Calculate Times
  useEffect(() => {
    if (activeCoords) {
      const today = new Date();
      const calc = calculatePrayerTimes(today, activeCoords, calculationMethod);
      setCalculatedTimes(calc);
    }
  }, [activeCoords, calculationMethod]);

  // Robust Time Parser
  // Handles: "5:30 PM", "05:30 PM", "17:30", "5:30 p.m."
  const parseTimeParts = (timeStr: string) => {
    try {
      // Regex matches HH:MM followed optionally by whitespace and AM/PM variants
      const match = timeStr.match(/(\d+):(\d+)\s*([AaPp][Mm\.]{0,2})?/);
      if (!match) return { h: 0, m: 0 };
      
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const modifier = match[3] ? match[3].toLowerCase().replace(/\./g, '') : '';
      
      if (modifier === 'pm' && h !== 12) h += 12;
      if (modifier === 'am' && h === 12) h = 0;
      
      return { h, m };
    } catch (e) {
      console.warn("Time parse error", timeStr);
      return { h: 0, m: 0 };
    }
  };

  // Helper to apply offset
  const applyOffset = (timeStr: string, offsetMinutes: number): string => {
    if (offsetMinutes === 0) return timeStr;
    
    const { h, m } = parseTimeParts(timeStr);

    const date = new Date();
    date.setHours(h, m + offsetMinutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Merge Calculated + Offsets + Custom Overrides
  const displayedTimes: PrayerTimes | null = useMemo(() => {
    if (!calculatedTimes) return null;

    const withOffsets: Partial<PrayerTimes> = {};
    (Object.keys(calculatedTimes) as Array<keyof PrayerTimes>).forEach(key => {
        try {
          withOffsets[key] = applyOffset(calculatedTimes[key], timeOffsets[key]);
        } catch (e) {
          // Fallback to original if logic fails
          withOffsets[key] = calculatedTimes[key];
        }
    });

    return { ...(withOffsets as PrayerTimes), ...customTimes };
  }, [calculatedTimes, customTimes, timeOffsets]);

  // Parse time string to minutes for comparison
  const parseTimeToMinutes = (timeStr: string): number => {
    const { h, m } = parseTimeParts(timeStr);
    return h * 60 + m;
  };

  // Convert "HH:MM AM/PM" to "HH:MM" (24h) for input[type="time"]
  const toInputTime = (timeStr: string) => {
    const { h, m } = parseTimeParts(timeStr);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Convert "HH:MM" (24h) back to "HH:MM AM/PM"
  const fromInputTime = (inputTime: string) => {
    const [h, m] = inputTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Clock & Logic Checker
  useEffect(() => {
    if (!displayedTimes) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTimeLeft(now.toLocaleTimeString('en-US'));

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Determine Next Prayer
      let foundNext = false;
      let nextKey: keyof PrayerTimes | null = null;
      
      for (const prayer of PRAYER_ORDER) {
        const prayerTimeStr = displayedTimes[prayer.key];
        if (!prayerTimeStr) continue;
        const prayerMinutes = parseTimeToMinutes(prayerTimeStr);
        
        if (prayerMinutes > currentMinutes) {
          nextKey = prayer.key;
          foundNext = true;
          break;
        }
      }
      // If no prayer found later today, next is Fajr tomorrow
      if (!foundNext) nextKey = 'fajr';
      setNextPrayer(nextKey);

      // Calculate Countdown
      if (nextKey && displayedTimes[nextKey]) {
          const prayerTimeStr = displayedTimes[nextKey];
          const pMinutes = parseTimeToMinutes(prayerTimeStr);
          let diffMinutes = pMinutes - currentMinutes;
          
          if (diffMinutes < 0) {
             // Next prayer is tomorrow (Fajr)
             diffMinutes += 24 * 60;
          }
          
          const nowSeconds = now.getSeconds();
          const totalSecondsDiff = (diffMinutes * 60) - nowSeconds;
          
          const h = Math.floor(totalSecondsDiff / 3600);
          const m = Math.floor((totalSecondsDiff % 3600) / 60);
          const s = totalSecondsDiff % 60;
          
          setTimeToNext(`-${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }

      // Check Alarms
      if (lastTriggeredTime.current === currentTimeString) return;

      Object.entries(displayedTimes).forEach(([prayerKey, prayerTime]) => {
        if (prayerTime === currentTimeString) {
          const config = alarms[prayerKey];
          if (config && config.enabled) {
            if (lastTriggeredTime.current !== currentTimeString) {
               const displayLabel = PRAYER_ORDER.find(p => p.key === prayerKey)?.label || prayerKey;
               triggerAlarm(displayLabel, config.sound);
               lastTriggeredTime.current = currentTimeString;
            }
          }
        }
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [displayedTimes, alarms]);

  const triggerAlarm = (prayerLabel: string, soundType: 'adhan' | 'soft' | 'beep') => {
    setActiveAlarm(prayerLabel);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(SOUNDS[soundType].url);
    audio.loop = soundType !== 'adhan'; 
    audio.play().catch(e => console.log("Audio play blocked", e));
    audioRef.current = audio;

    if (soundType !== 'adhan') {
        setTimeout(() => stopAlarm(), 120000); 
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveAlarm(null);
  };

  const openAlarmSettings = (prayerKey: string) => {
    setEditingAlarmPrayer(prayerKey);
    setTempAlarmConfig(alarms[prayerKey] || { enabled: false, sound: 'adhan' });
  };

  const saveAlarmSettings = () => {
    if (editingAlarmPrayer) {
      const newAlarms = { ...alarms, [editingAlarmPrayer]: tempAlarmConfig };
      setAlarms(newAlarms);
      localStorage.setItem('prayer_alarms', JSON.stringify(newAlarms));
      setEditingAlarmPrayer(null);
      stopPreview();
    }
  };

  // Custom Time Handlers
  const startEditingTime = (key: keyof PrayerTimes, currentVal: string) => {
      setEditingTimeKey(key);
      setTempTimeVal(toInputTime(currentVal));
  };

  const saveCustomTime = () => {
      if (editingTimeKey && tempTimeVal) {
          const newFormatted = fromInputTime(tempTimeVal);
          const newCustomTimes = { ...customTimes, [editingTimeKey]: newFormatted };
          setCustomTimes(newCustomTimes);
          localStorage.setItem('custom_prayer_times', JSON.stringify(newCustomTimes));
          setEditingTimeKey(null);
      }
  };

  const resetCustomTime = (key: keyof PrayerTimes) => {
      const newCustomTimes = { ...customTimes };
      delete newCustomTimes[key];
      setCustomTimes(newCustomTimes);
      localStorage.setItem('custom_prayer_times', JSON.stringify(newCustomTimes));
  };

  const playPreview = (soundKey: 'adhan' | 'soft' | 'beep') => {
    if (previewPlayingKey === soundKey) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(SOUNDS[soundKey].url);
    audio.addEventListener('ended', () => setPreviewPlayingKey(null));
    audio.play().catch(e => console.log("Preview play blocked", e));
    previewAudioRef.current = audio;
    setPreviewPlayingKey(soundKey);
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    setPreviewPlayingKey(null);
  };

  // If no GPS permission and no manual location set yet
  if (!activeCoords && mode === 'gps' && !coords) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-emerald-800 p-8 text-center space-y-6">
        <MapPin className="w-16 h-16 opacity-50" />
        <div>
            <h2 className="text-xl font-bold">Location Required</h2>
            <p className="mt-2 text-sm text-emerald-600">Please enable location access or search for a city manually.</p>
        </div>
        
        <div className="w-full max-w-xs">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter city name..."
                    className="flex-1 px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                    {isSearching ? <Loader2 className="animate-spin w-5 h-5"/> : <Search className="w-5 h-5" />}
                </button>
            </div>
            {searchError && <p className="text-red-500 text-xs mt-2">{searchError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 h-full overflow-y-auto relative">
      
      {/* Active Alarm Banner */}
      {activeAlarm && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-top duration-300">
           <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between mx-auto max-w-md border border-emerald-400">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-full animate-pulse">
                    <Volume2 className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-bold">It is time for {activeAlarm}</h3>
                    <p className="text-xs text-emerald-100">Click stop to dismiss alarm</p>
                 </div>
              </div>
              <button 
                onClick={stopAlarm}
                className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-transform"
              >
                Stop
              </button>
           </div>
        </div>
      )}

      {/* Location Toggle & Search */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 space-y-3 relative group">
        <div className="flex justify-between items-center px-1">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                 Location & Method
             </div>
             <button 
                onClick={() => setShowSettings(true)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                title="Prayer Settings"
             >
                 <Settings size={14} />
             </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setMode('gps')}
                disabled={!coords}
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${mode === 'gps' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
            >
                <Navigation size={14} className="mr-1" />
                Current Location
            </button>
            <button 
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${mode === 'manual' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Search size={14} className="mr-1" />
                Search City
            </button>
        </div>

        {mode === 'manual' && (
            <div className="relative">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city (e.g. London, Dubai)"
                    className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 disabled:opacity-50"
                >
                    {isSearching ? <Loader2 size={16} className="animate-spin"/> : <Search size={16} />}
                </button>
            </div>
        )}
        {searchError && mode === 'manual' && <p className="text-xs text-red-500 px-1">{searchError}</p>}
      </div>

      {!activeCoords ? (
         <div className="text-center py-10 text-slate-400">
             <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
             <p>Search for a location to view prayer times</p>
         </div>
      ) : !displayedTimes ? (
        <div className="p-8 text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2"/>
            <span className="text-emerald-700">Calculating Times...</span>
        </div>
      ) : (
        <>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-all shrink-0">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-1">Current Time</h2>
                            <div className="text-4xl font-bold font-mono tracking-tight">{timeLeft}</div>
                        </div>
                        {nextPrayer && displayedTimes[nextPrayer] && (
                            <div className="text-right">
                                <div className="text-emerald-200 text-xs uppercase font-bold tracking-wider mb-1">Next: {PRAYER_ORDER.find(p => p.key === nextPrayer)?.label}</div>
                                <div className="text-xl font-bold font-mono">{timeToNext}</div>
                                <div className="text-sm text-emerald-200">{displayedTimes[nextPrayer]}</div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center mt-4 text-emerald-200 text-xs justify-between">
                        <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-[150px]">
                                {mode === 'gps' 
                                    ? gpsLocationName
                                    : manualLocation?.name || 'Manual Location'
                                }
                            </span>
                        </div>
                        <span className="bg-emerald-700/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                           {CALCULATION_METHODS.find(m => m.id === calculationMethod)?.id}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden w-full">
                {PRAYER_ORDER.map((prayerDef) => {
                  const prayerTime = displayedTimes[prayerDef.key];
                  const alarm = alarms[prayerDef.key];
                  const isEnabled = alarm?.enabled;
                  const isNext = nextPrayer === prayerDef.key;
                  const isCustom = !!customTimes[prayerDef.key];
                  const offset = timeOffsets[prayerDef.key];
                  const isEditing = editingTimeKey === prayerDef.key;

                  if (!prayerTime) return null;

                  return (
                    <div 
                        key={prayerDef.key} 
                        className={`flex justify-between items-center p-4 border-b border-emerald-50 last:border-0 transition-all relative overflow-hidden ${
                            isNext 
                                ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-500/30' 
                                : prayerDef.key === 'sunrise' ? 'bg-orange-50/50' : 'hover:bg-emerald-50'
                        }`}
                    >
                        {isNext && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                        
                        {/* Label */}
                        <div className="flex items-center space-x-3 w-1/3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                isNext ? 'bg-emerald-600 text-white shadow-md' :
                                prayerDef.key === 'sunrise' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <Clock size={16} />
                            </div>
                            <div>
                                <span className={`font-medium block ${isNext ? 'text-emerald-900 font-bold' : prayerDef.key === 'sunrise' ? 'text-slate-500' : 'text-slate-800'}`}>
                                    {prayerDef.label}
                                </span>
                                {isNext && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Next Prayer</span>}
                                {offset !== 0 && (
                                   <span className="text-[9px] text-slate-400 font-mono block">
                                      {offset > 0 ? '+' : ''}{offset} min
                                   </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Time Display/Edit & Controls */}
                        <div className="flex items-center justify-end gap-3 flex-1">
                            {isEditing ? (
                                <div className="flex items-center bg-white border border-emerald-200 rounded-lg p-1 shadow-sm animate-in fade-in zoom-in duration-200">
                                    <input 
                                        type="time" 
                                        value={tempTimeVal}
                                        onChange={(e) => setTempTimeVal(e.target.value)}
                                        className="bg-transparent text-sm font-mono font-bold text-slate-700 outline-none w-24 px-1"
                                    />
                                    <button onClick={saveCustomTime} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={16}/></button>
                                    <button onClick={() => setEditingTimeKey(null)} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={16}/></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/time">
                                    <span className={`font-mono text-lg ${isNext ? 'font-bold text-emerald-700' : 'text-slate-700'} ${isCustom ? 'text-amber-600' : ''}`}>
                                        {prayerTime}
                                    </span>
                                    {isCustom && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Custom Time Set"></div>}
                                    
                                    {/* Edit Button (Visible on Hover/Focus) */}
                                    <div className="flex gap-1 opacity-0 group-hover/time:opacity-100 focus-within:opacity-100 transition-opacity">
                                         <button 
                                            onClick={() => startEditingTime(prayerDef.key, prayerTime)}
                                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                            title="Edit Time"
                                         >
                                            <Edit2 size={14} />
                                         </button>
                                         {isCustom && (
                                             <button 
                                                onClick={() => resetCustomTime(prayerDef.key)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Reset to Calculated Time"
                                             >
                                                <RotateCcw size={14} />
                                             </button>
                                         )}
                                    </div>
                                </div>
                            )}

                            {/* Alarm Toggle */}
                            {prayerDef.key !== 'sunrise' && !isEditing && (
                                <button 
                                    onClick={() => openAlarmSettings(prayerDef.key)}
                                    className={`p-2 rounded-full transition-all active:scale-95 ${isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                >
                                    {isEnabled ? <Bell size={16} className="fill-current" /> : <BellOff size={16} />}
                                </button>
                            )}
                        </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Spacer to ensure last item is scrollable past floating nav/buttons */}
            <div className="h-24 shrink-0" />
        </>
      )}

      {/* General Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden h-[80vh] flex flex-col">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Settings size={18} />
                      Prayer Settings
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                  
                  {/* Calculation Method */}
                  <div className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">Calculation Method</label>
                      <p className="text-xs text-slate-500 mb-2">Adjusts how Fajr and Isha angles are calculated based on region.</p>
                      
                      <div className="space-y-2">
                          {CALCULATION_METHODS.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => updateCalculationMethod(m.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                                    calculationMethod === m.id 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'
                                }`}
                              >
                                  <div className="flex justify-between items-center">
                                      <span>{m.name}</span>
                                      {calculationMethod === m.id && <Check size={16} className="text-emerald-600" />}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-normal">{m.id}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Time Adjustments */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="block text-sm font-bold text-slate-700">Time Adjustments (Minutes)</label>
                      <p className="text-xs text-slate-500 mb-2">Manually adjust calculated times for specific prayers.</p>
                      
                      <div className="grid grid-cols-1 gap-3">
                         {PRAYER_ORDER.map((prayer) => (
                             <div key={prayer.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                 <span className="font-medium text-slate-700 text-sm">{prayer.label}</span>
                                 <div className="flex items-center gap-3">
                                     <button 
                                        onClick={() => updateOffset(prayer.key, -1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                     >
                                         <Minus size={14} />
                                     </button>
                                     <span className={`w-12 text-center font-mono font-bold text-sm ${timeOffsets[prayer.key] !== 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                         {timeOffsets[prayer.key] > 0 ? '+' : ''}{timeOffsets[prayer.key]}
                                     </span>
                                     <button 
                                        onClick={() => updateOffset(prayer.key, 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                     >
                                         <Plus size={14} />
                                     </button>
                                 </div>
                             </div>
                         ))}
                      </div>
                  </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all"
                >
                    Done
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Alarm Settings Modal */}
      {editingAlarmPrayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">Alarm Settings: {PRAYER_ORDER.find(p => p.key === editingAlarmPrayer)?.label}</h3>
                  <button onClick={() => { setEditingAlarmPrayer(null); stopPreview(); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-6">
                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-medium">Enable Alarm</label>
                      <button 
                        onClick={() => setTempAlarmConfig({...tempAlarmConfig, enabled: !tempAlarmConfig.enabled})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${tempAlarmConfig.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${tempAlarmConfig.enabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                  </div>

                  {/* Sound Selector */}
                  <div className={`space-y-3 transition-opacity ${!tempAlarmConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alarm Sound</label>
                      <div className="grid grid-cols-1 gap-2">
                          {(Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>).map((key) => (
                              <div 
                                key={key}
                                onClick={() => setTempAlarmConfig({...tempAlarmConfig, sound: key})}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${tempAlarmConfig.sound === key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}
                              >
                                  <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${tempAlarmConfig.sound === key ? 'border-emerald-500' : 'border-slate-300'}`}>
                                          {tempAlarmConfig.sound === key && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                                      </div>
                                      <span className="text-sm font-medium text-slate-700">{SOUNDS[key].name}</span>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); playPreview(key); }}
                                    className="p-1.5 text-emerald-600 bg-emerald-100 rounded-full hover:bg-emerald-200"
                                  >
                                      {previewPlayingKey === key ? <Square size={12} className="fill-current"/> : <Play size={12} className="fill-current"/>}
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>

                  <button 
                    onClick={saveAlarmSettings}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all"
                  >
                    Save Settings
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PrayerTimesView;