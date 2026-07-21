import React, { useState, useEffect } from 'react';
import { getLoanTypes } from '../services/loan.service';
import type { LoanType } from '../services/loan.service';
import { X, FileText, ChevronRight, Briefcase, Phone, Users, Home, Landmark, ShieldAlert, CreditCard, Banknote, Wallet, Building2, Package, Zap } from 'lucide-react';
import DisasterLoanForm from './DisasterLoanForm';
import NormalLoanForm from './NormalLoanForm';
import { useLanguage } from '../context/LanguageContext';


const getIconForLoanName = (name: string) => {
  
  if (name.includes('ක්ෂණික')) return Zap;
  if (name.includes('දුරකථන')) return Phone;
  if (name.includes('ආපදා')) return ShieldAlert;
  if (name.includes('සේවක')) return Briefcase;
  if (name.includes('ශ්‍රමික')) return Briefcase;
  if (name.includes('පාරිභෝගික')) return Wallet;
  if (name.includes('කෙටි')) return CreditCard;
  if (name.includes('FD')) return Landmark;
  if (name.includes('අර්ත සාදක')) return Home;
  if (name.includes('මහා සභා')) return Users;
  if (name.includes('MPCS')) return Building2;
  if (name.includes('කොටස්')) return Package;
  if (name.includes('අත්තිකාරම්')) return Banknote;
  if (name.includes('කල්පසු')) return ShieldAlert;
  return Banknote;
};

const getColorForLoanName = (name: string) => {
  
  if (name.includes('ක්ෂණික')) return 'text-yellow-500 bg-yellow-50 border-yellow-200 shadow-yellow-100';
  if (name.includes('දුරකථන')) return 'text-purple-600 bg-purple-50 border-purple-200 shadow-purple-100';
  if (name.includes('ආපදා')) return 'text-red-600 bg-red-50 border-red-200 shadow-red-100';
  if (name.includes('සේවක')) return 'text-blue-600 bg-blue-50 border-blue-200 shadow-blue-100';
  if (name.includes('ශ්‍රමික')) return 'text-blue-600 bg-blue-50 border-blue-200 shadow-blue-100';
  if (name.includes('පාරිභෝගික')) return 'text-green-600 bg-green-50 border-green-200 shadow-green-100';
  if (name.includes('කෙටි')) return 'text-orange-600 bg-orange-50 border-orange-200 shadow-orange-100';
  if (name.includes('FD')) return 'text-indigo-600 bg-indigo-50 border-indigo-200 shadow-indigo-100';
  if (name.includes('අර්ත සාදක')) return 'text-teal-600 bg-teal-50 border-teal-200 shadow-teal-100';
  if (name.includes('මහා සභා')) return 'text-pink-600 bg-pink-50 border-pink-200 shadow-pink-100';
  if (name.includes('MPCS')) return 'text-cyan-600 bg-cyan-50 border-cyan-200 shadow-cyan-100';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100';
};

// කෙටි ණය first, then සේවක ණය, ක්ෂණික ණය, ශ්‍රමික ණය, rest in original order
const sortLoanTypes = (types: LoanType[]): LoanType[] => {
  const keti = types.filter(t => t.name.includes('කෙටි'));
  const sewaka = types.filter(t => t.name.includes('සේවක'));
  const kshanika = types.filter(t => t.name.includes('ක්ෂණික'));
  const shramika = types.filter(t => t.name.includes('ශ්‍රමික'));
  const rest = types.filter(t => !t.name.includes('කෙටි') && !t.name.includes('සේවක') && !t.name.includes('ක්ෂණික') && !t.name.includes('ශ්‍රමික'));
  return [...keti, ...sewaka, ...kshanika, ...shramika, ...rest];
};

const LoanApplicationModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const types = await getLoanTypes();
        setLoanTypes(types);
      } catch (error: any) {
        console.error("Failed to load loan types", error);
        setError(error.message || "Failed to load loan types");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTypes();
  }, []);

  if (selectedLoanType) {
    const isDisasterLoan = selectedLoanType.name.includes('ආපදා ණය') || selectedLoanType.name.includes('සේවක ණය');
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
        <div className="relative w-full max-w-5xl">
            {/* Close button for the modal */}
            <button onClick={onClose} className="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors z-50">
              <X size={24} className="text-slate-500" />
            </button>
            
            {isDisasterLoan ? (
              <DisasterLoanForm loanTypeId={selectedLoanType.loanTypeId} onClose={onClose} />
            ) : (
              <NormalLoanForm loanTypeId={selectedLoanType.loanTypeId} onClose={onClose} />
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
              <FileText size={24} className="text-indigo-200" /> 
              {t(`ණය වර්ගය තෝරන්න`)}</h3>
            <p className="text-indigo-100 text-xs mt-0.5 font-medium opacity-90">Select a loan type to proceed with your application</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/50" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortLoanTypes(loanTypes).map(type => {
              const Icon = getIconForLoanName(type.name);
              const colorClass = getColorForLoanName(type.name);
              
              return (
                <button 
                  key={type.loanTypeId}
                  onClick={() => setSelectedLoanType(type)}
                  className="relative flex flex-col items-center p-4 rounded-2xl bg-white hover:bg-slate-50 transition-all duration-300 text-center group border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 border-2 shadow-inner group-hover:scale-110 transition-transform duration-300 ${colorClass}`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  
                  <div className="font-bold text-slate-800 text-[11px] leading-snug group-hover:text-indigo-600 transition-colors line-clamp-3 h-12 flex items-center justify-center w-full px-1">
                    {type.name}
                  </div>
                  
                  <div className="mt-2 w-full pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Max Amount
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {type.maxAmount ? `Rs. ${(type.maxAmount/1000).toFixed(0)}k` : 'N/A'}
                    </div>
                  </div>
                </button>
              );
            })}
            
            {isLoading && (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 flex flex-col items-center justify-center py-12 text-slate-400 animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-base font-medium">{t(`ණය වර්ග පූරණය වෙමින් පවතී... (Loading...)`)}</p>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 flex flex-col items-center justify-center py-12 text-red-500">
                <ShieldAlert size={48} className="mb-4 text-red-400" />
                <p className="text-base font-medium mb-2">{t(`ණය වර්ග පූරණය කිරීම අසාර්ථක විය.`)}</p>
                <p className="text-sm font-mono bg-red-50 p-2 rounded">{error}</p>
              </div>
            )}
            
            {!isLoading && !error && loanTypes.length === 0 && (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-base font-medium">{t(`කිසිදු ණය වර්ගයක් සොයාගත නොහැකි විය.`)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplicationModal;
