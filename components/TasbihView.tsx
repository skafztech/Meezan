import React, { useState } from 'react';
import { TASBIH_TARGETS, INITIAL_TASBIH_COUNT } from '../constants';
import { RotateCcw, Settings, X, Minus, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const TasbihView: React.FC = () => {
  // Main counter state
  const [count, setCount] = useState(INITIAL_TASBIH_COUNT);
  const [laps, setLaps] = useState(0);

  // Configuration state
  const [target, setTarget] = useState(TASBIH_TARGETS[0]);
  const [step, setStep] = useState(1);
  const [startValue, setStartValue] = useState(0);

  // Settings UI state
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    target: TASBIH_TARGETS[0],
    step: 1,
    startValue: 0,
    currentCount: INITIAL_TASBIH_COUNT
  });

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [shouldResetLaps, setShouldResetLaps] = useState(true);

  const openSettings = () => {
    setTempSettings({
      target,
      step,
      startValue,
      currentCount: count
    });
    setShowSettings(true);
  };

  const saveSettings = () => {
    setTarget(tempSettings.target);
    setStep(tempSettings.step);
    setStartValue(tempSettings.startValue);
    setCount(tempSettings.currentCount);
    setShowSettings(false);
  };

  const increment = () => {
    const newCount = count + step;
    if (newCount >= target) {
      setLaps(l => l + 1);
      setCount(startValue);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(200);
    } else {
      setCount(newCount);
    }
  };

  const initiateReset = () => {
    setShouldResetLaps(true);
    setShowResetModal(true);
  };

  const performReset = (resetToValue: number) => {
    setCount(resetToValue);
    if (shouldResetLaps) {
      setLaps(0);
    }
    setShowResetModal(false);
  };

  if (showSettings) {
    return (
      <div className="flex flex-col h-full p-6 bg-slate-50">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Tasbih Settings</h2>
          <button 
            onClick={() => setShowSettings(false)} 
            className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-8 flex-1 overflow-y-auto pb-4">
          {/* Target Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Target Count</label>
            <input 
              type="number" 
              value={tempSettings.target} 
              onChange={(e) => setTempSettings({...tempSettings, target: parseInt(e.target.value) || 1})}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow text-lg font-mono text-slate-700"
            />
            <div className="flex flex-wrap gap-2">
              {TASBIH_TARGETS.map(t => (
                <button 
                  key={t}
                  onClick={() => setTempSettings({...tempSettings, target: t})}
                  className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                    tempSettings.target === t 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                      : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">The counter resets or laps when this number is reached.</p>
          </div>

          {/* Increment Step */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Increment Step</label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setTempSettings({...tempSettings, step: Math.max(1, tempSettings.step - 1)})} 
                className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Minus size={20} />
              </button>
              <input 
                type="number" 
                value={tempSettings.step} 
                onChange={(e) => setTempSettings({...tempSettings, step: parseInt(e.target.value) || 1})}
                className="flex-1 p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-center text-lg font-mono"
              />
              <button 
                onClick={() => setTempSettings({...tempSettings, step: tempSettings.step + 1})} 
                className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Start Value */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Starting Value</label>
            <input 
              type="number" 
              value={tempSettings.startValue} 
              onChange={(e) => setTempSettings({...tempSettings, startValue: parseInt(e.target.value) || 0})}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono text-slate-700"
            />
            <p className="text-xs text-slate-400">Value to return to after a lap or reset.</p>
          </div>

          {/* Current Count */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Current Count</label>
            <input 
              type="number" 
              value={tempSettings.currentCount} 
              onChange={(e) => setTempSettings({...tempSettings, currentCount: parseInt(e.target.value) || 0})}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono text-slate-700"
            />
            <p className="text-xs text-slate-400">Manually adjust the current progress.</p>
          </div>
        </div>

        <button 
          onClick={saveSettings}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all"
        >
          Save Changes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 bg-gradient-to-b from-slate-50 to-emerald-50/30 relative">
        {/* Settings Button */}
        <button 
            onClick={openSettings}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-full transition-all"
            aria-label="Settings"
        >
            <Settings size={24} />
        </button>

        <div className="flex flex-col items-center space-y-2 w-full mt-8">
            <h2 className="text-2xl font-bold text-slate-700">Digital Tasbih</h2>
            {/* Quick Target Switcher (Only shows presets, highlights if matches current target) */}
            <div className="flex space-x-2 overflow-x-auto max-w-full p-1 no-scrollbar">
                {TASBIH_TARGETS.map(t => (
                    <button 
                        key={t}
                        onClick={() => { setTarget(t); setCount(startValue); setLaps(0); }}
                        className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-colors ${
                            target === t 
                                ? 'bg-emerald-600 text-white border-emerald-600' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'
                        }`}
                    >
                        {t}
                    </button>
                ))}
                {/* Show current target if it's not in presets */}
                {!TASBIH_TARGETS.includes(target) && (
                     <button 
                        className="px-3 py-1 text-xs rounded-full border bg-emerald-600 text-white border-emerald-600 whitespace-nowrap"
                    >
                        {target} (Custom)
                    </button>
                )}
            </div>
        </div>

        {/* Counter UI */}
        <div className="relative group">
            <div className="absolute inset-0 bg-emerald-300 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <button 
                onClick={increment}
                className="relative w-64 h-64 rounded-full bg-white border-8 border-slate-100 shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-all duration-150 outline-none select-none"
            >
                <div className="text-6xl font-bold text-emerald-600 font-mono mb-2">{count}</div>
                <div className="text-slate-400 uppercase text-xs tracking-widest font-semibold">
                    {step > 1 ? `+${step}` : 'Count'}
                </div>
                <div className="absolute bottom-10 text-xs text-slate-300 font-medium">
                    Target: {target}
                </div>
            </button>
        </div>

        <div className="flex items-center space-x-8 w-full max-w-xs justify-center">
            <div className="text-center">
                <div className="text-2xl font-bold text-slate-700">{laps}</div>
                <div className="text-xs text-slate-400 uppercase">Cycles</div>
            </div>
            <button 
                onClick={initiateReset}
                className="p-4 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Reset"
            >
                <RotateCcw size={20} />
            </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-slate-800">
                  <div className="p-2 bg-red-100 rounded-full text-red-500">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Reset Counter?</h3>
                </div>
                
                <p className="text-slate-500 text-sm mb-6">
                  Choose how you would like to reset your counter.
                </p>

                <div className="flex items-center mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer" onClick={() => setShouldResetLaps(!shouldResetLaps)}>
                   <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${shouldResetLaps ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                      {shouldResetLaps && <CheckCircle2 size={14} />}
                   </div>
                   <span className="text-sm font-medium text-slate-700 select-none">Also reset Cycles (Laps)</span>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => performReset(startValue)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center"
                  >
                    Reset to Start ({startValue})
                  </button>
                  
                  {startValue !== 0 && (
                    <button 
                      onClick={() => performReset(0)}
                      className="w-full py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all"
                    >
                      Reset to Zero (0)
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowResetModal(false)}
                    className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default TasbihView;