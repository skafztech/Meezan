
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Info, ChevronLeft, RefreshCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ZakatView: React.FC = () => {
  // Nisab Settings (Defaults approx market rates)
  const [goldPrice, setGoldPrice] = useState<number>(65); // Price per gram
  const [silverPrice, setSilverPrice] = useState<number>(0.85); // Price per gram
  const [nisabType, setNisabType] = useState<'gold' | 'silver'>('gold');

  // Assets
  const [cash, setCash] = useState<string>('');
  const [goldSilverValue, setGoldSilverValue] = useState<string>('');
  const [investments, setInvestments] = useState<string>('');
  const [owedToYou, setOwedToYou] = useState<string>('');
  const [businessAssets, setBusinessAssets] = useState<string>('');

  // Liabilities
  const [debts, setDebts] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('');

  // Results
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [netAssets, setNetAssets] = useState(0);
  const [zakatDue, setZakatDue] = useState(0);
  const [isEligible, setIsEligible] = useState(false);

  const NISAB_GOLD_GRAMS = 87.48;
  const NISAB_SILVER_GRAMS = 612.36;

  const nisabThreshold = nisabType === 'gold' 
    ? goldPrice * NISAB_GOLD_GRAMS 
    : silverPrice * NISAB_SILVER_GRAMS;

  useEffect(() => {
    const parse = (val: string) => parseFloat(val) || 0;

    const tAssets = parse(cash) + parse(goldSilverValue) + parse(investments) + parse(owedToYou) + parse(businessAssets);
    const tLiabilities = parse(debts) + parse(expenses);
    const net = Math.max(0, tAssets - tLiabilities);
    
    setTotalAssets(tAssets);
    setTotalLiabilities(tLiabilities);
    setNetAssets(net);

    const eligible = net >= nisabThreshold;
    setIsEligible(eligible);
    setZakatDue(eligible ? net * 0.025 : 0);
  }, [cash, goldSilverValue, investments, owedToYou, businessAssets, debts, expenses, nisabThreshold]);

  const resetForm = () => {
    setCash('');
    setGoldSilverValue('');
    setInvestments('');
    setOwedToYou('');
    setBusinessAssets('');
    setDebts('');
    setExpenses('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Zakat Calculator
            </h2>
            <p className="text-xs text-slate-500">Calculate your 2.5% obligation</p>
          </div>
          <button onClick={resetForm} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Reset Calculator">
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Result Card */}
        <div className={`rounded-2xl p-6 text-white shadow-lg transition-all duration-500 border border-white/10 ${isEligible ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
           <div className="flex justify-between items-start mb-4">
              <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isEligible ? 'text-emerald-200' : 'text-slate-300'}`}>Total Zakat Payable</h3>
                  <div className="text-4xl font-bold font-mono tracking-tight flex items-baseline gap-1">
                      <span className="text-2xl opacity-70">$</span>
                      {zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isEligible ? 'bg-emerald-500/20 border-emerald-400 text-emerald-50' : 'bg-white/10 border-white/20 text-slate-300'}`}>
                  {isEligible ? 'Eligible' : 'Not Eligible'}
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-white/10">
               <div>
                   <span className={`block mb-1 ${isEligible ? 'text-emerald-200' : 'text-slate-300'}`}>Net Assets</span>
                   <span className="font-mono font-bold text-lg">${netAssets.toLocaleString()}</span>
               </div>
               <div className="text-right">
                   <span className={`block mb-1 ${isEligible ? 'text-emerald-200' : 'text-slate-300'}`}>Nisab Threshold ({nisabType})</span>
                   <span className="font-mono font-bold text-lg opacity-80">${nisabThreshold.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
               </div>
           </div>
        </div>

        {/* Nisab Configuration */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm">
                <Info size={16} className="text-emerald-500"/>
                Nisab Settings
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Gold Price (/g)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input 
                            type="number" 
                            value={goldPrice} 
                            onChange={e => setGoldPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Silver Price (/g)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input 
                            type="number" 
                            value={silverPrice} 
                            onChange={e => setSilverPrice(parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                 </div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setNisabType('gold')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${nisabType === 'gold' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Gold Standard
                </button>
                <button 
                    onClick={() => setNisabType('silver')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${nisabType === 'silver' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Silver Standard
                </button>
            </div>
        </div>

        {/* Assets Form */}
        <div>
            <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp size={16} /> Assets
                </h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    + {totalAssets.toLocaleString()}
                </span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="bg-emerald-50/50 border-b border-emerald-100 p-2 text-[10px] text-emerald-600 text-center font-medium">
                    Wealth you have possessed for one lunar year
                </div>
                <InputRow label="Cash & Savings" value={cash} setValue={setCash} placeholder="0.00" theme="green" />
                <InputRow label="Gold & Silver Value" value={goldSilverValue} setValue={setGoldSilverValue} placeholder="0.00" theme="green" />
                <InputRow label="Investments & Shares" value={investments} setValue={setInvestments} placeholder="0.00" theme="green" />
                <InputRow label="Money Owed To You" value={owedToYou} setValue={setOwedToYou} placeholder="0.00" theme="green" />
                <InputRow label="Business Inventory" value={businessAssets} setValue={setBusinessAssets} placeholder="0.00" last theme="green" />
            </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center -my-2 relative z-10">
            <div className="bg-slate-100 p-1.5 rounded-full border border-slate-200 text-slate-400 shadow-sm">
                <Minus size={16} strokeWidth={3} />
            </div>
        </div>

        {/* Liabilities Form */}
        <div>
            <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wide flex items-center gap-2">
                    <TrendingDown size={16} /> Liabilities
                </h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    - {totalLiabilities.toLocaleString()}
                </span>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden">
                <div className="bg-rose-50/50 border-b border-rose-100 p-2 text-[10px] text-rose-600 text-center font-medium">
                    Debts due immediately
                </div>
                <InputRow label="Debts & Loans" value={debts} setValue={setDebts} placeholder="0.00" theme="red" />
                <InputRow label="Expenses Due" value={expenses} setValue={setExpenses} placeholder="0.00" last theme="red" />
            </div>
        </div>
        
        <div className="text-center text-[10px] text-slate-400 p-4 leading-relaxed">
            Calculations are estimations based on the input values provided.<br/>Please consult a scholar for complex financial situations.
        </div>

      </div>
    </div>
  );
};

interface InputRowProps {
    label: string;
    value: string;
    setValue: (v: string) => void;
    placeholder: string;
    last?: boolean;
    theme: 'green' | 'red';
}

const InputRow: React.FC<InputRowProps> = ({ label, value, setValue, placeholder, last, theme }) => (
    <div className={`flex items-center p-3 ${!last ? (theme === 'green' ? 'border-b border-emerald-50' : 'border-b border-rose-50') : ''} hover:bg-slate-50 transition-colors group`}>
        <label className={`flex-1 text-sm font-medium ${theme === 'green' ? 'text-emerald-900' : 'text-rose-900'}`}>{label}</label>
        <div className="relative w-36">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
            <input 
                type="number" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className={`w-full pl-7 pr-3 py-2 bg-slate-50 border border-transparent rounded-lg text-right text-sm font-mono focus:outline-none transition-all shadow-sm ${
                    theme === 'green' 
                    ? 'focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 text-emerald-800' 
                    : 'focus:bg-white focus:border-rose-300 focus:ring-2 focus:ring-rose-100 text-rose-800'
                }`}
            />
        </div>
    </div>
);

export default ZakatView;
