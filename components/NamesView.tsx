
import React, { useState } from 'react';
import { NAMES_OF_ALLAH } from '../constants';
import { Search, ChevronLeft, Scroll } from 'lucide-react';

const NamesView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = NAMES_OF_ALLAH.filter(name => 
    name.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) || 
    name.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(name.number).includes(searchQuery)
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Scroll className="w-5 h-5 text-emerald-600" />
              99 Names of Allah
            </h2>
            <p className="text-xs text-slate-500">Asmaul Husna</p>
          </div>
        </div>
        
        <div className="relative">
           <input 
             type="text" 
             placeholder="Search Name or Meaning..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
           />
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {filteredNames.map((name) => (
            <div 
              key={name.number}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative group hover:border-emerald-300 transition-all hover:shadow-md"
            >
              <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-full">
                {name.number}
              </div>
              
              <div className="flex-1 flex items-center justify-center py-4">
                 <p className="font-arabic text-3xl text-emerald-800">{name.arabic}</p>
              </div>
              
              <div className="w-full pt-3 border-t border-slate-50">
                <p className="font-bold text-slate-700 text-sm">{name.transliteration}</p>
                <p className="text-xs text-slate-500 mt-0.5">{name.meaning}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredNames.length === 0 && (
            <div className="text-center py-10 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No names found matching "{searchQuery}"</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default NamesView;
