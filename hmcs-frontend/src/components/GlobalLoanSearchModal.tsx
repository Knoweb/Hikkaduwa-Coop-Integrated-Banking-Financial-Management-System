import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import * as LoanService from '../services/loan.service';
import { getBranchName } from '../pages/BranchDashboard';
import { useLanguage } from '../context/LanguageContext';

import * as AccountService from '../services/account.service';

interface Props {
  onClose: () => void;
  onSelectLoan: (loan: any) => void;
  currentBranchId?: number;
}

export default function GlobalLoanSearchModal({ onClose, onSelectLoan, currentBranchId }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loansData, membersData] = await Promise.all([
          LoanService.getGlobalLoans(),
          AccountService.getMembers()
        ]);
        // Only keep active loans that can be repaid
        setLoans(loansData.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED'));
        setMembers(membersData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLoans = search.trim() ? loans.filter(l => {
    const s = search.toLowerCase();
    const appData = l.applicationData || {};
    const member = members.find(m => m.memberId === l.memberId);
    
    const name = (member?.fullNameSinhala || member?.nameWithInitials || member?.fullName || appData.name || appData.applicantName || appData.fullName || '').toLowerCase();
    const nic = (member?.nic || appData.nic || '').toLowerCase();
    const memNo = (member?.membershipNumber || appData.membershipNumber || '').toLowerCase();
    const accNo = (l.accountNumber || '').toLowerCase();
    return name.includes(s) || nic.includes(s) || memNo.includes(s) || accNo.includes(s);
  }) : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Search size={20} />
              {t(`ඕනෑම ශාඛාවකින් වාරික ගෙවීම (Cross-Branch Repayment)`)}</h2>
            <p className="text-blue-100 text-xs mt-1">{t(`ගනුදෙනුකරුගේ නම, ජා.හැ.අ, සාමාජික අංකය හෝ ගිණුම් අංකය මගින් සොයන්න`)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-2 shrink-0 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              autoFocus
              placeholder={t(`නම, NIC, සාමාජික අංකය හෝ ගිණුම් අංකය ඇතුලත් කරන්න...`)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3 text-blue-500" />
              <p className="text-sm font-medium">{t(`දත්ත ලබා ගනිමින් පවතී...`)}</p>
            </div>
          ) : !search.trim() ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Search size={48} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">{t(`කරුණාකර ගනුදෙනුකරුගේ නම, ජා.හැ.අ, සාමාජික අංකය හෝ ගිණුම් අංකය ඇතුලත් කරන්න.`)}</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Search size={48} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">{t(`කිසිදු ණය ගිණුමක් හමු නොවීය.`)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLoans.map((loan) => {
                const appData = loan.applicationData || {};
                const member = members.find(m => m.memberId === loan.memberId);
                const name = member?.fullNameSinhala || member?.nameWithInitials || member?.fullName || appData.name || appData.applicantName || appData.fullName || 'Unknown';
                const isOtherBranch = currentBranchId && loan.branchId !== currentBranchId;

                return (
                  <div key={loan.loanId} className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md ${isOtherBranch ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${isOtherBranch ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          {name}
                          {isOtherBranch && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={10} /> වෙනත් ශාඛාවක් ({getBranchName(loan.branchId)})
                            </span>
                          )}
                        </h4>
                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                          <span><strong>ID:</strong> {appData.nic || 'N/A'}</span>
                          <span><strong>Acc No:</strong> {loan.accountNumber || 'N/A'}</span>
                          <span><strong>Amount:</strong> Rs. {loan.approvedAmount?.toLocaleString() || loan.requestedAmount?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectLoan(loan)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all"
                    >
                      {t(`ගෙවීම් කරන්න (Pay)`)}</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
