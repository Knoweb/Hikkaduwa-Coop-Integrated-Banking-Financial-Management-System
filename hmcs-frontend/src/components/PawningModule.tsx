import React, { useState, useEffect } from 'react';
import { Gem, Plus, Eye, Search } from 'lucide-react';
import * as PawningService from '../services/pawning.service';
import * as AccountService from '../services/account.service';
import IssuePawnTicketModal from './IssuePawnTicketModal';
import PawnTicketViewModal from './PawnTicketViewModal';
import PawnPaymentModal from './PawnPaymentModal';
import { Snackbar, Alert } from '@mui/material';

export default function PawningModule({ branchId }: { branchId: number }) {
  if ((window as any).__isAdminView) return <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"><h3 className="text-xl font-bold text-red-600 mb-2">Access Denied</h3><p className="text-slate-600 mb-6">System Administrators are in Read-Only mode and cannot perform transactions or open accounts.</p><button onClick={() => {}} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-700">Close</button></div></div>;
  const [tickets, setTickets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [paymentTicket, setPaymentTicket] = useState<any>(null);
  const [interestRate, setInterestRate] = useState('13');
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [snackbar, setSnackbar] = useState<{open: boolean, msg: string, severity: 'success' | 'error' | 'warning'}>({ open: false, msg: '', severity: 'success' });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await PawningService.getTicketsByBranch(branchId);
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMemberInitials = (ticket: any): string => {
    const found = members.find(m => m.memberId === ticket.memberId);
    if (found?.nameWithInitials) return found.nameWithInitials;
    if (ticket.member?.nameWithInitials) return ticket.member.nameWithInitials;
    if (ticket.memberName) return ticket.memberName;
    return found ? (found.fullNameSinhala || found.fullName) : (ticket.memberId?.toString().slice(0, 8) || '—');
  };

  const enrichTicketWithMember = (ticket: any) => {
    const member = members.find(m => m.memberId === ticket.memberId) || {};
    return { ...ticket, memberDetails: member };
  };

  const handleRedeem = async (ticket: any) => {
    setPaymentTicket(enrichTicketWithMember(ticket));
  };

  useEffect(() => {
    loadTickets();
    AccountService.getMembers().then(setMembers).catch(() => {});
    PawningService.getAllSettings().then((settings: any[]) => {
      const int = settings.find(s => s.settingKey === 'pw_int')?.settingValue || '13.00';
      setInterestRate(int);
    }).catch(console.error);
  }, [branchId]);

  const computedTickets = tickets.map(t => {
    let displayStatus = t.status;
    if (t.status === 'ACTIVE') {
      const expiry = new Date(t.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30 && diffDays >= 0) displayStatus = 'NEARING';
    }
    return { ...t, displayStatus };
  });

  const activeCount = computedTickets.filter(t => t.displayStatus === 'ACTIVE').length;
  const inactiveCount = computedTickets.filter(t => t.displayStatus === 'INACTIVE' || t.status === 'OVERDUE').length;
  const nearingCount = computedTickets.filter(t => t.displayStatus === 'NEARING').length;
  const redeemedCount = computedTickets.filter(t => t.displayStatus === 'REDEEMED').length;

  const filteredByStatus = filter === 'ALL' ? computedTickets : 
                          filter === 'INACTIVE' ? computedTickets.filter(t => t.displayStatus === 'INACTIVE' || t.status === 'OVERDUE') :
                          computedTickets.filter(t => t.displayStatus === filter);

  const filteredTickets = filteredByStatus.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const m = members.find(mem => String(mem.membership_number || mem.memberId) === String(t.memberId));
    const nameStr = (m?.fullNameSinhala || m?.fullName || m?.name_with_initials || '').toLowerCase();
    const nicStr = (m?.nic || '').toLowerCase();
    const ticketStr = `pw-${t.ticketNumber}`.toLowerCase();
    const pureNum = String(t.ticketNumber).toLowerCase();
    return nameStr.includes(q) || nicStr.includes(q) || ticketStr.includes(q) || pureNum.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-700 to-yellow-600 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shadow-inner">
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">උකස් ගිණුම් (Pawning Accounts)</h3>
            <p className="text-amber-100 text-[11px] font-medium mt-0.5">උකස් කළමනාකරණය (Pawning Management)</p>
          </div>
        </div>
        <button 
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
        >
          <Plus size={14} /> නව උකස් පත්‍රිකාවක් නිකුත් කිරීම
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-2">
        <div 
          onClick={() => setFilter('ALL')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'ALL' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">මුළු ගිණුම්</p>
          <p className={`text-2xl font-black ${filter === 'ALL' ? 'text-amber-700' : 'text-slate-800'}`}>{tickets.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">සියලු ගිණුම්</p>
        </div>
        
        <div 
          onClick={() => setFilter('ACTIVE')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'ACTIVE' ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ක්‍රියාකාරී උකස්</p>
          <p className={`text-2xl font-black ${filter === 'ACTIVE' ? 'text-emerald-700' : 'text-emerald-600'}`}>{activeCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">සක්‍රිය ගිණුම්</p>
        </div>

        <div 
          onClick={() => setFilter('NEARING')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'NEARING' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-100 hover:border-amber-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">කල් පිරීමට ආසන්න</p>
          <p className={`text-2xl font-black ${filter === 'NEARING' ? 'text-amber-700' : 'text-amber-500'}`}>{nearingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">දින 30 ඇතුළත</p>
        </div>

        <div 
          onClick={() => setFilter('INACTIVE')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'INACTIVE' ? 'bg-red-50 border-red-500 shadow-sm' : 'bg-white border-slate-100 hover:border-red-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">අක්‍රිය උකස්</p>
          <p className={`text-2xl font-black ${filter === 'INACTIVE' ? 'text-red-700' : 'text-red-500'}`}>{inactiveCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">කල් ඉකුත් වූ</p>
        </div>

        <div 
          onClick={() => setFilter('REDEEMED')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'REDEEMED' ? 'bg-slate-100 border-slate-400 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">නිදහස් කළ</p>
          <p className={`text-2xl font-black ${filter === 'REDEEMED' ? 'text-slate-700' : 'text-blue-600'}`}>{redeemedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">බේරාගත් උකස්</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ගිණුම් අංකය, ජා.හැ.ප හෝ නම සොයන්න..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm mt-4">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">ටිකට්<br/>අංකය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">සාමාජික<br/>නම</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">නිකුත් කළ<br/>දිනය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">භාණ්ඩ<br/>විස්තරය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">අත්තිකාරම්<br/>(Rs.)</th>
                <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">පොලිය<br/>({interestRate}%)</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">කල් ඉකුත් වන<br/>දිනය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">තත්ත්වය</th>
                <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">ක්‍රියාව</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTickets.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">උකස් ගිණුම් නොමැත. (No pawning tickets found)</td></tr>
              ) : filteredTickets.map(t => (
                <tr key={t.ticketId} className="hover:bg-slate-50 transition group">
                  <td className="px-3 py-3 border-r border-slate-100 font-bold text-amber-700 whitespace-nowrap text-xs">PW-{t.ticketNumber}</td>
                  <td className="px-3 py-3 border-r border-slate-100 font-semibold text-slate-800 text-xs">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {getMemberInitials(t)}
                    </div>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-xs text-slate-600 font-medium whitespace-nowrap text-center">
                    {new Date(t.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 whitespace-nowrap text-xs text-center">
                    <span className="text-slate-800 font-bold">{t.articleDescription}</span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-right font-bold text-slate-800 whitespace-nowrap text-xs">Rs. {Number(t.advanceAmount).toLocaleString()}</td>
                  <td className="px-3 py-3 border-r border-slate-100 text-right font-bold text-red-600 whitespace-nowrap text-xs">
                    {t.status === 'REDEEMED' ? <span className="text-slate-400 font-normal">—</span> : `+ Rs. ${Number(t.accruedInterest).toLocaleString()}`}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-xs text-slate-600 font-medium whitespace-nowrap text-center">
                    {new Date(t.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-center">
                    {(() => {
                      const displayStatus = t.displayStatus;
                      return (
                        <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold tracking-wider whitespace-nowrap ${
                          displayStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          displayStatus === 'REDEEMED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          displayStatus === 'NEARING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {displayStatus === 'ACTIVE' ? 'ක්‍රියාකාරී' :
                           displayStatus === 'INACTIVE' || t.status === 'OVERDUE' ? 'අක්‍රියයි' :
                           displayStatus === 'NEARING' ? 'කල් පිරීමට ආසන්නයි' :
                           displayStatus === 'REDEEMED' ? 'නිදහස් කළ' : displayStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedTicket(enrichTicketWithMember(t))}
                        className="px-2.5 py-1.5 rounded-lg text-[#025a4e] bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center border border-emerald-200/50 shadow-sm whitespace-nowrap gap-1 text-[11px] font-bold"
                      >
                        <Eye size={12} /> බලන්න
                      </button>
                      <button 
                        onClick={() => handleRedeem(t)}
                        disabled={t.status === 'REDEEMED'}
                        className="px-2.5 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center border border-red-200/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap gap-1 text-[11px] font-bold"
                      >
                        වාරික ගෙවීම
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showIssueModal && (
        <IssuePawnTicketModal 
          branchId={branchId}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => {
            setShowIssueModal(false);
            loadTickets();
          }}
        />
      )}

      {selectedTicket && (
        <PawnTicketViewModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {paymentTicket && (
        <PawnPaymentModal
          ticket={paymentTicket}
          onClose={() => setPaymentTicket(null)}
          onSuccess={() => {
            setPaymentTicket(null);
            setSnackbar({ open: true, msg: 'ගෙවීම සාර්ථකයි!', severity: 'success' });
            loadTickets();
          }}
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}
