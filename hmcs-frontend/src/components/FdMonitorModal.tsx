import React from 'react';
import { X, Activity, ArrowUpRight, TrendingUp, Clock, CalendarDays, Wallet } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FdMonitorModal({ fd, memberName, onClose, onRelease }: { fd: any, memberName: string, onClose: () => void, onRelease: (isMatured: boolean, releaseAmount: number, penaltyAmount: number, principalAmount: number) => void }) {
  const { t } = useLanguage();
  
  const start = new Date(fd.openedDate || fd.createdAt || fd.startDate || new Date());
  const today = new Date();
  
  const mat = fd.maturityDate ? new Date(fd.maturityDate) : new Date(start.getTime() + (fd.termMonths || 1) * 30 * 24 * 60 * 60 * 1000);
  
  const totalTime = Math.max(0, mat.getTime() - start.getTime());
  const totalDays = Math.max(1, Math.ceil(totalTime / (1000 * 60 * 60 * 24)));

  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.round((diffDays / totalDays) * 100));

  let daysToMaturityText = '-';
  let isMatured = false;
  if(fd.maturityDate) {
    const timeToMat = mat.getTime() - today.getTime();
    const daysToMat = Math.ceil(timeToMat / (1000 * 60 * 60 * 24));
    if (daysToMat > 0) {
      daysToMaturityText = `${daysToMat} දින`;
    } else {
      daysToMaturityText = "කල් පිරී ඇත (Matured)";
      isMatured = true;
    }
  }

  const payoutMethodText = fd.interestPayoutMethod === 'MONTHLY' ? 'මාසිකව' : 'කල් පිරීමේදී';
  
  const principal = Number(fd.principalAmount);
  const intRate = Number(fd.interestRate);
  const accInterest = Number(fd.accumulatedInterest || 0);

  const hasTaxForm = fd.hasSubmittedTaxForm === true;
  const taxMultiplier = hasTaxForm ? 1 : 0.9;

  const estMonthlyInterest = ((principal * (intRate / 100)) / 12) * taxMultiplier;
  const totalExpectedInterest = (principal * (intRate / 100)) * ((fd.termMonths || 1) / 12) * taxMultiplier;
  
  // If monthly, interest goes to savings, so maturity value is just principal.
  // If at maturity, interest is added to principal at the end.
  const totalMaturityValue = fd.interestPayoutMethod === 'MONTHLY' ? principal : principal + totalExpectedInterest;
  

  let paidOutInterest = 0;
  let monthsPaid = 0;
  let paidHistory: { date: Date, amount: number }[] = [];
  
  if (fd.interestPayoutMethod === 'MONTHLY' && fd.lastInterestPayoutDate) {
    const openedDateObj = new Date(fd.openedDate || start);
    const lastPayoutDateObj = new Date(fd.lastInterestPayoutDate);
    monthsPaid = (lastPayoutDateObj.getFullYear() - openedDateObj.getFullYear()) * 12 + 
                 (lastPayoutDateObj.getMonth() - openedDateObj.getMonth());
    if (monthsPaid > 0) {
      let totalCalculated = 0;
      for (let i = 1; i <= monthsPaid; i++) {
        const payoutDate = new Date(openedDateObj.getFullYear(), openedDateObj.getMonth() + i, openedDateObj.getDate());
        
        const theoreticalTotal = Number((estMonthlyInterest * i).toFixed(2));
        const amount = Number((theoreticalTotal - totalCalculated).toFixed(2));
        totalCalculated = theoreticalTotal;

        paidHistory.push({
          date: payoutDate,
          amount: amount
        });
      }
      paidHistory.reverse();
      paidOutInterest = totalCalculated;
    }
  }

  // Remaining interest to be paid/accrued
  const remainingInterest = fd.interestPayoutMethod === 'MONTHLY' 
    ? Math.max(0, totalExpectedInterest - paidOutInterest)
    : Math.max(0, totalExpectedInterest - accInterest);

  const lastCalculationDate = fd.lastInterestPayoutDate || fd.openedDate || start;
  const formattedLastDate = new Date(lastCalculationDate).toLocaleDateString('si-LK');

  const maturityInstructionMap: any = {
    'REINVEST_PRINCIPAL_AND_INTEREST': 'මුළු මුදලම යළි ආයෝජනය (Auto Renew)',
    'REINVEST_PRINCIPAL_PAY_INTEREST': 'පොළිය ලබාදී මුදල යළි ආයෝජනය',
    'CLOSE_ACCOUNT': 'ගිණුම නිදහස් කර Savings එකට බැර කිරීම'
  };
  const matInstructionText = maturityInstructionMap[fd.maturityInstruction] || fd.maturityInstruction || 'තීරණය කර නැත';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight tracking-wide">{t(`ස්ථාවර තැන්පතු තත්වය (FD Status)`)}</h2>
              <p className="text-xs font-semibold text-indigo-100 mt-0.5">ගිණුම් අංකය: {fd.fdNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          <div className="flex items-center gap-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {memberName.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t(`තැන්පත්කරු`)}</p>
              <p className="font-bold text-slate-800 text-sm">{memberName}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t(`තැන්පතු මුදල (PRINCIPAL)`)}</p>
              <p className="font-black text-indigo-700 text-lg">Rs. {Number(fd.principalAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-100">
                <Wallet size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">{t(`ගිණුම නිදහස් කිරීම (Close FD)`)}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{t(`සම්පූර්ණ මුදල සම්බන්ධිත ගිණුමට බැර කෙරේ.`)}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const penalty = isMatured ? 0 : (principal * 0.05);
                const releaseAmt = isMatured ? totalMaturityValue : (principal + accInterest - penalty);
                onRelease(isMatured, releaseAmt, penalty, principal);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <ArrowUpRight size={14} /> {t(`නිදහස් කරන්න`)}</button>
          </div>

          {/* Progress Bar Section */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">{t(`කාලය ගතවීම`)}</span>
              </div>
              <span className="text-xs font-black text-slate-800">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] font-bold text-slate-400">{t(`ගත වූ කාලය:`)}<span className="text-blue-600">{diffDays} දින</span></span>
              <span className="text-[10px] font-bold text-slate-400">{t(`කල් පිරීමට:`)}<span className={isMatured ? 'text-rose-500' : 'text-amber-600'}>{daysToMaturityText}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm flex flex-col overflow-hidden">
              <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                  <TrendingUp size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">{t(`පොළී විස්තර (Interest)`)}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${hasTaxForm ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {hasTaxForm ? 'No WHT' : '10% WHT'}
                </span>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                {fd.interestPayoutMethod === 'MONTHLY' ? (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">
                      Savings ගිණුමට ගෙවූ පොළිය {monthsPaid > 0 ? `(${monthsPaid} මාස)` : ''}
                    </p>
                    <p className="font-mono text-3xl font-black text-emerald-600">
                      Rs. {paidOutInterest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                    
                    {paidHistory.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{t(`ගෙවීම් ඉතිහාසය`)}</p>
                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                          {paidHistory.map((h, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 px-3 rounded-lg border border-slate-100">
                              <span className="text-xs font-semibold text-slate-600">{h.date.toLocaleDateString('si-LK')}</span>
                              <span className="font-mono text-xs font-bold text-emerald-600">Rs. {h.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide">
                      {t(`දැනට එකතු වී ඇති පොළිය (Accrued)`)}<span className="block text-[11px] text-slate-400 normal-case mt-0.5 font-medium">({formattedLastDate} සිට අද දක්වා)</span>
                    </p>
                    <p className="font-mono text-3xl font-black text-emerald-600">
                      Rs. {accInterest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">{t(`මාසිකව හැදෙන පොළිය`)}</span>
                    <span className="font-mono font-black text-slate-700">Rs. {estMonthlyInterest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">{t(`වාර්ෂික පොලී අනුපාතය`)}</span>
                    <span className="font-mono font-black text-slate-700">{intRate.toFixed(2)}% ({payoutMethodText})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Wallet size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t(`කල් පිරෙන විට මුළු මුදල`)}</span>
                </div>
                <div className="font-mono text-xl font-black text-indigo-700">
                  Rs. {totalMaturityValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200/50">
                  <span className="text-[10px] text-indigo-600/80 font-bold">{t(`ඉදිරියට ලැබීමට ඇති පොළිය:`)}</span>
                  <span className="font-mono text-[11px] font-black text-indigo-600">Rs. {remainingInterest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t(`කල් පිරුණු පසු ක්‍රියාමාර්ගය`)}</p>
                <p className="text-xs font-bold text-slate-700">{matInstructionText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
