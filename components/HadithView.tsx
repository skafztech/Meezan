import React, { useState, useEffect } from 'react';
import { Hadith } from '../types';
import { searchHadiths } from '../services/geminiService';
import { Book, Search, Loader2, Sparkles, RefreshCw } from 'lucide-react';

const HadithView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load random Hadiths on mount
  useEffect(() => {
    fetchHadiths('random');
  }, []);

  const fetchHadiths = async (searchTerm: string) => {
    setLoading(true);
    setHasSearched(true);
    const results = await searchHadiths(searchTerm);
    setHadiths(results);
    setLoading(false);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    fetchHadiths(query);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Book className="w-5 h-5 text-emerald-600" />
              Hadith Collection
            </h2>
            <p className="text-xs text-slate-500">Authentic sayings of the Prophet (ﷺ)</p>
          </div>
        </div>

        <div className="flex gap-2">
           <div className="relative flex-1">
             <input 
               type="text" 
               placeholder="Search Topic (e.g. Patience, Charity)..." 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
               className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
           </div>
           <button 
             onClick={handleSearch}
             className="bg-emerald-600 text-white px-4 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
           >
             Search
           </button>
        </div>
        
        <div className="mt-3 flex justify-center">
            <button 
                onClick={() => { setQuery(''); fetchHadiths('random'); }}
                className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
            >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Inspire Me (Random)
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Retrieving knowledge...</p>
           </div>
        ) : hadiths.length > 0 ? (
          hadiths.map((hadith, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
               <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <Sparkles size={18} />
                  </div>
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Narrated by</p>
                      <p className="font-medium text-slate-700">{hadith.narrator}</p>
                  </div>
               </div>

               <div className="mb-6 text-right">
                   <p className="font-arabic text-2xl leading-[2.2] text-slate-800" dir="rtl">{hadith.arabic}</p>
               </div>
               
               <div className="mb-4">
                   <p className="text-slate-600 leading-relaxed italic">"{hadith.translation}"</p>
               </div>

               <div className="pt-4 border-t border-slate-50 flex justify-end">
                   <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                       {hadith.source}
                   </span>
               </div>
            </div>
          ))
        ) : hasSearched && (
            <div className="text-center py-10 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No Hadiths found. Try a different topic.</p>
            </div>
        )}
        
        <div className="text-center text-[10px] text-slate-300 pb-4">
            Content retrieved via AI. Please verify with original sources.
        </div>
      </div>
    </div>
  );
};

export default HadithView;