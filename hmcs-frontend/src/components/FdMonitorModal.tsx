import React from 'react';
import { X, Activity, ArrowUpRight, TrendingUp, Clock, CalendarDays, Wallet } from 'lucide-react';

export default function FdMonitorModal({ fd, memberName, onClose, onRelease }: { fd: any, memberName: string, onClose: () => void, onRelease: () => void }) {
  
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
  const dailyInterest = ((principal * (intRate / 100)) / 365) * taxMultiplier;
  const totalExpectedInterest = dailyInterest * totalDays;
  const totalMaturityValue = principal + totalExpectedInterest;
  const remainingInterest = Math.max(0, totalExpectedInterest - accInterest);
  
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
              <h2 className="text-lg font-black leading-tight tracking-wide">ස්ථාවර තැන්පතු තත්වය (FD Status)</h2>
              <p className="text-xs font-semibold text-indigo-100 mt-0.5">ගිණුම් අංකය: {fd.fdNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          <div className="flex items-center gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {memberName.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">තැන්පත්කරු</p>
              <p className="font-bold text-slate-800 text-sm">{memberName}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">තැන්පතු මුදල (PRINCIPAL)</p>
              <p className="font-black text-indigo-700 text-lg">Rs. {Number(fd.principalAmount).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            </div>
          </div>

          {/* Progress Bar Section */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">කාලය ගතවීම</span>
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
              <span className="text-[10px] font-bold text-slate-400">ගත වූ කාලය: <span className="text-blue-600">{diffDays} දින</span></span>
              <span className="text-[10px] font-bold text-slate-400">කල් පිරීමට: <span className={isMatured ? 'text-rose-500' : 'text-amber-600'}>{daysToMaturityText}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingUp size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">දැනට එකතු වූ පොළිය</span>
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-emerald-700 mb-1">
                Rs. {accInterest.toLocaleString('en-US', {minimumFractionDigits: 2})}
              </div>
              <div className="text-[10px] text-emerald-600/70 font-semibold mb-3">
                දිනකට පොළිය: Rs. {dailyInterest.toLocaleString('en-US', {minimumFractionDigits: 2})}
              </div>
              
              <div className="mt-auto pt-3 border-t border-emerald-200/60">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald-700/80 font-bold">මාසිකව හැදෙන පොළිය (Est.)</span>
                  <span className="text-xs font-black text-emerald-700">Rs. {estMonthlyInterest.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[9px] text-emerald-600/70 font-semibold">පොලී අනුපාතය: {intRate.toFixed(2)}% ({payoutMethodText})</p>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${hasTaxForm ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                    {hasTaxForm ? 'No WHT' : '10% WHT Deducted'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Wallet size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">කල් පිරෙන විට මුළු මුදල</span>
                </div>
                <div className="font-mono text-xl font-black text-indigo-700">
                  Rs. {totalMaturityValue.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </div>
                <div className="mt-2 pt-2 border-t border-indigo-200/50 flex justify-between items-center">
                  <span className="text-[10px] text-indigo-600/80 font-bold">ඉදිරියට ලැබීමට ඇති පොළිය:</span>
                  <span className="text-[11px] font-black text-indigo-600">Rs. {remainingInterest.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">කල් පිරුණු පසු ක්‍රියාමාර්ගය</p>
                <p className="text-xs font-bold text-slate-700">{matInstructionText}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ක්‍රියාමාර්ග (Actions)</h4>
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm">ගිණුම නිදහස් කිරීම (Close FD)</p>
                  <p className="text-[10px] font-semibold text-slate-500">සම්පූර්ණ මුදල සම්බන්ධිත ගිණුමට බැර කෙරේ.</p>
                </div>
              </div>
              <button 
                onClick={onRelease}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <ArrowUpRight size={14} /> නිදහස් කරන්න
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
