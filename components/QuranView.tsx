import React, { useState, useEffect, useRef } from 'react';
import { SURAHS } from '../constants';
import { Surah, Ayah } from '../types';
import { getSurahContent } from '../services/geminiService';
import { BookOpen, ChevronLeft, Loader2, Sparkles, Play, Pause, Square, Search, Globe } from 'lucide-react';

const TRANSLATIONS = [
  { id: 'Saheeh International', name: 'Saheeh International' },
  { id: 'Dr. Mustafa Khattab', name: 'The Clear Quran (Khattab)' },
  { id: 'Abdullah Yusuf Ali', name: 'Yusuf Ali' },
  { id: 'Marmaduke Pickthall', name: 'Pickthall' },
  { id: 'Mufti Taqi Usmani', name: 'Mufti Taqi Usmani' },
];

const QuranView: React.FC = () => {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState(TRANSLATIONS[0].id);
  
  // Audio State
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Cleanup audio when view changes or component unmounts
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const fetchSurahContent = async (surah: Surah, translation: string) => {
    setLoading(true);
    setAyahs([]);
    const content = await getSurahContent(surah, translation);
    setAyahs(content);
    setLoading(false);
  };

  const handleSurahClick = (surah: Surah) => {
    stopAudio();
    setSelectedSurah(surah);
    fetchSurahContent(surah, selectedTranslation);
  };

  const handleTranslationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTranslation = e.target.value;
    setSelectedTranslation(newTranslation);
    if (selectedSurah) {
        fetchSurahContent(selectedSurah, newTranslation);
    }
  };

  const handleBack = () => {
    stopAudio();
    setSelectedSurah(null);
    setAyahs([]);
  };

  const toggleAudio = () => {
    if (!selectedSurah) return;

    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    } else {
      setIsLoadingAudio(true);
      // Source: MP3Quran Server 8 (Mishary Rashid Alafasy) - Reliable
      // Padded surah number (e.g. 001.mp3, 114.mp3)
      const paddedNumber = String(selectedSurah.number).padStart(3, '0');
      const audioUrl = `https://server8.mp3quran.net/afs/${paddedNumber}.mp3`;
      
      const newAudio = new Audio(audioUrl);
      
      newAudio.addEventListener('canplaythrough', () => {
        setIsLoadingAudio(false);
        newAudio.play();
        setIsPlaying(true);
      });

      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });

      newAudio.addEventListener('timeupdate', () => {
         if(newAudio.duration) {
             setAudioProgress((newAudio.currentTime / newAudio.duration) * 100);
         }
      });
      
      newAudio.addEventListener('error', () => {
          setIsLoadingAudio(false);
          setIsPlaying(false);
          // Only alert if we haven't manually stopped it (src check)
          if (newAudio.src) {
             alert("Could not load audio for this Surah.");
          }
      });

      setAudio(newAudio);
    }
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setAudio(null);
    setIsPlaying(false);
    setAudioProgress(0);
    setIsLoadingAudio(false);
  };

  const filteredSurahs = SURAHS.filter(s => 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name.includes(searchQuery) ||
    String(s.number).includes(searchQuery)
  );

  if (selectedSurah) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between mb-4">
             <div className="flex items-center">
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full mr-2">
                    <ChevronLeft className="w-6 h-6 text-emerald-700" />
                </button>
                <div>
                    <h2 className="font-bold text-lg text-slate-800">{selectedSurah.englishName}</h2>
                    <p className="text-xs text-slate-500">{selectedSurah.englishNameTranslation}</p>
                </div>
             </div>
             
             {/* Translation Selector */}
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Globe className="w-4 h-4 text-emerald-600" />
                <select 
                    value={selectedTranslation}
                    onChange={handleTranslationChange}
                    className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer w-full md:w-auto"
                >
                    {TRANSLATIONS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
             </div>
          </div>
          
          {/* Audio Player Controls */}
          <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
              <button 
                onClick={toggleAudio}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'} shadow-sm`}
                disabled={isLoadingAudio}
              >
                  {isLoadingAudio ? <Loader2 className="w-5 h-5 animate-spin"/> : isPlaying ? <Pause className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current ml-1"/>}
              </button>
              
              <div className="flex-1 flex flex-col justify-center gap-1">
                 <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <span>Recitation</span>
                    <span>Mishary Alafasy</span>
                 </div>
                 <div className="h-1.5 w-full bg-emerald-200 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${audioProgress}%` }}></div>
                 </div>
              </div>

              <button 
                onClick={stopAudio}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                disabled={!audio}
              >
                  <Square className="w-4 h-4 fill-current"/>
              </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-emerald-700 font-medium">Retrieving {selectedTranslation}...</p>
            </div>
          ) : (
            <>
              {selectedSurah.number !== 9 && (
                 <div className="text-center mb-8 pt-4">
                    <p className="font-arabic text-3xl text-emerald-900 leading-loose">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
                 </div>
              )}
              {ayahs.length > 0 ? ayahs.map((ayah) => (
                <div key={ayah.number} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                  <div className="absolute top-4 left-4 w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">
                    {ayah.numberInSurah}
                  </div>
                  <div className="mb-4 text-right pl-12">
                    <p className="font-arabic text-3xl leading-[2.5] text-slate-800" dir="rtl">{ayah.text}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-slate-600 leading-relaxed text-lg">{ayah.translation}</p>
                  </div>
                </div>
              )) : (
                  <div className="text-center p-8 text-slate-400">
                     <p>Unable to load text content. Check connection.</p>
                  </div>
              )}
              <div className="text-center text-xs text-slate-400 py-4">
                 Text generated by Gemini AI. Recitation by Mishary Alafasy.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 pb-24 bg-slate-50">
      <div className="mb-6 space-y-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Quran</h2>
           <p className="text-slate-500">Read and listen to the Holy Quran</p>
        </div>
        
        <div className="relative">
           <input 
             type="text" 
             placeholder="Search Surah (e.g. Yasin, 36)" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
           />
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>
      </div>

      <div className="grid gap-3">
        {filteredSurahs.map((surah) => (
          <button
            key={surah.number}
            onClick={() => handleSurahClick(surah)}
            className="flex items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors relative rotate-45 group-hover:rotate-0 transform duration-300">
               <span className="-rotate-45 group-hover:rotate-0 transition-transform duration-300">{surah.number}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 group-hover:text-emerald-700">{surah.englishName}</h3>
              <p className="text-xs text-slate-500">{surah.englishNameTranslation}</p>
            </div>
            <div className="text-right">
              <p className="font-arabic text-xl text-slate-700 font-bold">{surah.name}</p>
              <p className="text-xs text-slate-400">{surah.numberOfAyahs} Ayahs</p>
            </div>
          </button>
        ))}
        
        {filteredSurahs.length === 0 && (
            <div className="text-center py-10 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No Surahs found matching "{searchQuery}"</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuranView;