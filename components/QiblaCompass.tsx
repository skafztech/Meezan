import React, { useEffect, useState, useRef } from 'react';
import { Coordinates } from '../types';
import { calculateQiblaDirection } from '../services/prayerService';
import { Compass, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  coords: Coordinates | null;
}

const QiblaCompass: React.FC<Props> = ({ coords }) => {
  const [heading, setHeading] = useState<number>(0);
  const [qibla, setQibla] = useState<number>(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isAligned, setIsAligned] = useState<boolean>(false);
  
  // Ref to throttle updates
  const lastHeadingRef = useRef<number>(0);

  useEffect(() => {
    if (coords) {
      const q = calculateQiblaDirection(coords);
      setQibla(q);
    }
  }, [coords]);

  // Calculate deviation
  let deviation = Math.abs(heading - qibla);
  if (deviation > 180) deviation = 360 - deviation;
  
  const isNear = deviation <= 20 && deviation > 5;
  const relativeDiff = (heading - qibla + 540) % 360 - 180;
  const turnDirection = relativeDiff > 0 ? 'left' : 'right';

  // Check alignment
  useEffect(() => {
    const aligned = deviation < 5;
    
    if (aligned && !isAligned) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    setIsAligned(aligned);
  }, [deviation, isAligned]);

  const handleRequestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleOrientation);
          setError('');
        } else {
          setError('Permission denied for orientation access.');
        }
      } catch (e) {
        setError('Error requesting compass permission.');
      }
    } else {
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const webkitCompassHeading = (event as any).webkitCompassHeading;
    const alpha = event.alpha || 0;
    
    let compass = webkitCompassHeading || Math.abs(alpha - 360);
    compass = compass % 360;
    
    // Throttle updates: only update if change is > 0.5 degrees
    if (Math.abs(compass - lastHeadingRef.current) > 0.5) {
      lastHeadingRef.current = compass;
      setHeading(compass);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const getRotation = () => -heading;

  return (
    <div className={`flex flex-col items-center justify-between h-full p-6 text-center transition-colors duration-700 relative overflow-hidden ${isAligned ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      
      {/* Background Pulse Animation when Near */}
      {isNear && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
             <div className="w-[120%] h-[60%] bg-emerald-100/30 blur-3xl rounded-full animate-pulse transition-all duration-1000"></div>
         </div>
      )}

      {/* Header Info */}
      <div className="mt-4 space-y-2 relative z-10">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Compass className={isAligned ? "text-emerald-600" : "text-slate-800"} />
            Qibla Finder
        </h2>
        
        {error ? (
           <p className="text-red-500 text-xs bg-red-50 px-3 py-1 rounded-full">{error}</p>
        ) : !coords ? (
           <p className="text-slate-400 text-sm">Waiting for location...</p>
        ) : (
           <div className="flex flex-col items-center">
             <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-mono font-bold tracking-tighter transition-colors duration-300 ${isAligned ? 'text-emerald-600' : isNear ? 'text-emerald-500' : 'text-slate-700'}`}>
                    {Math.round(heading)}°
                </span>
                <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">
                    {Math.round(qibla)}° Qibla
                </span>
             </div>
             <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isAligned ? 'bg-emerald-100 text-emerald-700' : isNear ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                {isAligned ? "You are facing the Qibla" : isNear ? "Almost there..." : "Rotate phone to align"}
             </div>
           </div>
        )}
      </div>

      {/* Main Compass Area */}
      <div className="relative w-80 h-80 flex items-center justify-center my-8 z-10">
        
        {/* Outer Glow when Aligned */}
        {isAligned && (
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse blur-2xl transition-opacity duration-500"></div>
        )}

        {/* Near Alignment Indicator (Pulsing Ring) */}
        <div 
            className={`absolute inset-[-16px] rounded-full border-4 border-dashed border-emerald-300/40 transition-all duration-500 ease-in-out pointer-events-none ${isNear ? 'opacity-100 scale-100 animate-[spin_8s_linear_infinite]' : 'opacity-0 scale-90'}`}
        ></div>
        <div 
            className={`absolute inset-[-8px] rounded-full border-2 border-emerald-200/50 transition-all duration-300 pointer-events-none ${isNear ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
        ></div>

        {/* Alignment Indicator (Static at Top) */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className={`w-1.5 h-6 rounded-full mb-1 transition-colors duration-300 ${isAligned ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
            <ArrowUp size={24} className={`transition-colors duration-300 ${isAligned ? 'text-emerald-600' : 'text-slate-300'}`} />
        </div>

        {/* The Rotating Compass Card */}
        <div 
            className={`w-full h-full rounded-full border-4 bg-white shadow-2xl relative transition-transform duration-300 ease-out will-change-transform ${isAligned ? 'border-emerald-500 shadow-emerald-200' : isNear ? 'border-emerald-200 shadow-emerald-100' : 'border-slate-100'}`}
            style={{ transform: `rotate(${getRotation()}deg)` }}
        >
            {/* Degree Ticks */}
            {[0, 90, 180, 270].map((deg) => (
                <div key={deg} className="absolute top-0 left-0 w-full h-full" style={{ transform: `rotate(${deg}deg)` }}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-lg text-slate-400 font-sans">
                        {deg === 0 ? <span className="text-red-500">N</span> : deg === 90 ? 'E' : deg === 180 ? 'S' : 'W'}
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-300"></div>
                </div>
            ))}
            
            {/* Minor Ticks */}
            {Array.from({ length: 12 }).map((_, i) => (
                 <div key={i} className="absolute top-0 left-1/2 w-0.5 h-full -ml-px" style={{ transform: `rotate(${i * 30}deg)` }}>
                    <div className="w-full h-1.5 bg-slate-200"></div>
                    <div className="w-full h-1.5 bg-slate-200 absolute bottom-0"></div>
                 </div>
            ))}

            {/* Qibla Indicator */}
            {coords && (
                <div 
                    className="absolute top-0 left-1/2 w-0 h-1/2 origin-bottom -ml-px z-10"
                    style={{ transform: `rotate(${qibla}deg)` }}
                >
                    <div className={`absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-16 ${isAligned ? 'bg-emerald-500' : 'bg-emerald-200/50'}`}></div>
                    
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 transform -rotate-180">
                         <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-500 border-2 ${isAligned ? 'bg-emerald-600 border-emerald-400 scale-110' : 'bg-slate-800 border-slate-600'}`}>
                            <div className="absolute top-2 w-full h-1 bg-yellow-400/80"></div>
                            <div className="absolute bottom-2 right-2 w-2 h-4 bg-yellow-400/60 rounded-[1px]"></div>
                         </div>
                         <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] ${isAligned ? 'border-b-emerald-600' : 'border-b-slate-800'}`}></div>
                    </div>
                </div>
            )}
        </div>

        {/* Center Pivot */}
        <div className="absolute w-3 h-3 bg-white rounded-full z-20 shadow border-2 border-slate-200"></div>
        <div className="absolute w-32 h-px bg-slate-900/5"></div>
        <div className="absolute h-32 w-px bg-slate-900/5"></div>
      </div>

      {/* Directional Turn Guidance */}
      {isNear && !isAligned && (
        <>
            <div className={`absolute left-2 top-1/2 -translate-y-1/2 text-emerald-400 transition-opacity duration-300 ${turnDirection === 'left' ? 'opacity-100 animate-pulse' : 'opacity-10'}`}>
                <ChevronLeft size={56} strokeWidth={3} />
            </div>
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 transition-opacity duration-300 ${turnDirection === 'right' ? 'opacity-100 animate-pulse' : 'opacity-10'}`}>
                <ChevronRight size={56} strokeWidth={3} />
            </div>
        </>
      )}

      {/* Footer / Controls */}
      <div className="mb-8 w-full max-w-xs relative z-10">
        {!permissionGranted && (
            <button 
            onClick={handleRequestPermission}
            className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
            >
            <Compass size={18} />
            Calibrate Compass
            </button>
        )}
        
        <p className="text-slate-400 text-xs mt-6 leading-relaxed">
             For best results, place device flat.
             <br/>
             Avoid magnetic interference.
        </p>
      </div>
    </div>
  );
};

export default QiblaCompass;