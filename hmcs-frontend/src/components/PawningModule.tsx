import React, { useState, useEffect } from 'react';
import { Gem, Plus, Eye, Search, Banknote, X } from 'lucide-react';
import * as PawningService from '../services/pawning.service';
import * as AccountService from '../services/account.service';
import IssuePawnTicketModal from './IssuePawnTicketModal';
import PawnTicketViewModal from './PawnTicketViewModal';
import PawnPaymentModal from './PawnPaymentModal';
import PawningDisburseModal from './PawningDisburseModal';
import { Snackbar, Alert } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';


export default function PawningModule({ branchId, readOnly }: { branchId: number, readOnly?: boolean }) {
  const { t } = useLanguage();
  if ((window as any).__isAdminView) return <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"><h3 className="text-xl font-bold text-red-600 mb-2">Access Denied</h3><p className="text-slate-600 mb-6">System Administrators are in Read-Only mode and cannot perform transactions or open accounts.</p><button onClick={() => {}} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-700">Close</button></div></div>;
  const [tickets, setTickets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [paymentTicket, setPaymentTicket] = useState<any>(null);
  const [disburseTicket, setDisburseTicket] = useState<any>(null);
  const [interestRate, setInterestRate] = useState('13');
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pawnActivityDate, setPawnActivityDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  
  const [showPaymentSearchModal, setShowPaymentSearchModal] = useState(false);
  const [searchTicketNumber, setSearchTicketNumber] = useState('');
  const [searchError, setSearchError] = useState('');

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
  const pendingCount = computedTickets.filter(t => t.displayStatus === 'PENDING').length;
  const approvedCount = computedTickets.filter(t => t.displayStatus === 'APPROVED').length;
  const inactiveCount = computedTickets.filter(t => t.displayStatus === 'INACTIVE' || t.status === 'OVERDUE').length;
  const nearingCount = computedTickets.filter(t => t.displayStatus === 'NEARING').length;
  const redeemedCount = computedTickets.filter(t => t.displayStatus === 'REDEEMED').length;

  const filteredByStatus = filter === 'ALL' ? computedTickets : 
                          filter === 'INACTIVE' ? computedTickets.filter(t => t.displayStatus === 'INACTIVE' || t.status === 'OVERDUE') :
                          computedTickets.filter(t => t.displayStatus === filter);

  const filteredTickets = filteredByStatus.filter(t => {
    if (!searchQuery) return true;
    const rawQ = searchQuery.toLowerCase().trim();
    const q = rawQ.replace(/^(pw|PW|Pw|pW)-/, '');
    const m = members.find(mem => String(mem.memberId) === String(t.memberId) || String(mem.membershipNumber) === String(t.memberId) || String(mem.membership_number) === String(t.memberId));
    const displayedName = getMemberInitials(t).toLowerCase();
    const nameStr = [
      displayedName,
      m?.fullNameSinhala,
      m?.fullName,
      m?.nameWithInitials,
      m?.name_with_initials,
      m?.firstName,
      m?.lastName,
      t.memberName,
      t.member?.nameWithInitials,
      t.member?.fullName,
      t.member?.fullNameSinhala
    ].filter(Boolean).join(' ').toLowerCase();
    const nicStr = String(m?.nic || t.member?.nic || '').toLowerCase();
    const ticketStr = String(t.ticketNumber || '').toLowerCase();
    const memNumStr = String(m?.membershipNumber || m?.membership_number || t.memberId || '').toLowerCase();
    return nameStr.includes(rawQ) || nicStr.includes(rawQ) || ticketStr.includes(q) || ticketStr.includes(rawQ) || memNumStr.includes(rawQ);
  });

  const eligibleTickets = tickets.filter(t => t.status !== 'PENDING' && t.status !== 'REDEEMED');
  const cleanSearchInput = searchTicketNumber.trim().replace(/^(pw|PW|Pw|pW)-/, '');
  const suggestions = searchTicketNumber.trim() 
    ? eligibleTickets.filter(t => {
        const displayedName = getMemberInitials(t).toLowerCase();
        const ticketStr = String(t.ticketNumber || '').toLowerCase();
        const searchLow = searchTicketNumber.trim().toLowerCase();
        return ticketStr.includes(cleanSearchInput.toLowerCase()) ||
               `pw-${t.ticketNumber}`.toLowerCase().includes(searchLow) ||
               displayedName.includes(searchLow) ||
               String(t.memberId).toLowerCase().includes(searchLow);
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-700 to-yellow-600 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shadow-inner">
            <Gem size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">{t(`උකස් ගිණුම් (Pawning Accounts)`)}</h3>
            <p className="text-amber-100 text-[11px] font-medium mt-0.5">{t(`උකස් කළමනාකරණය (Pawning Management)`)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <button 
                onClick={() => setShowPaymentSearchModal(true)}
                className="flex items-center gap-2 bg-amber-900 hover:bg-amber-950 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap border border-amber-800/50"
              >
                <Banknote size={14} /> {t(`වාරික ගෙවීම`)}</button>
              <button 
                onClick={() => setShowIssueModal(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Plus size={14} /> {t(`නව උකස් පත්‍රිකාවක් නිකුත් කිරීම`)}</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-2">
        <div 
          onClick={() => setFilter('ALL')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'ALL' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`මුළු ගිණුම්`)}</p>
          <p className={`text-2xl font-black ${filter === 'ALL' ? 'text-amber-700' : 'text-slate-800'}`}>{tickets.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`සියලු ගිණුම්`)}</p>
        </div>
        
        <div 
          onClick={() => setFilter('PENDING')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'PENDING' ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-slate-100 hover:border-orange-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`අනුමැතිය ලැබිය යුතු`)}</p>
          <p className={`text-2xl font-black ${filter === 'PENDING' ? 'text-orange-700' : 'text-orange-500'}`}>{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`අනුමැතිය සඳහා`)}</p>
        </div>

        <div 
          onClick={() => setFilter('APPROVED')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'APPROVED' ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`නිකුත් කළ යුතු`)}</p>
          <p className={`text-2xl font-black ${filter === 'APPROVED' ? 'text-blue-700' : 'text-blue-500'}`}>{approvedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`අනුමත කර ඇත`)}</p>
        </div>

        <div 
          onClick={() => setFilter('ACTIVE')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'ACTIVE' ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`ක්‍රියාකාරී උකස්`)}</p>
          <p className={`text-2xl font-black ${filter === 'ACTIVE' ? 'text-emerald-700' : 'text-emerald-600'}`}>{activeCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`සක්‍රිය ගිණුම්`)}</p>
        </div>

        <div 
          onClick={() => setFilter('NEARING')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'NEARING' ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-100 hover:border-amber-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`කල් පිරීමට ආසන්න`)}</p>
          <p className={`text-2xl font-black ${filter === 'NEARING' ? 'text-amber-700' : 'text-amber-500'}`}>{nearingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`දින 30 ඇතුළත`)}</p>
        </div>

        <div 
          onClick={() => setFilter('INACTIVE')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'INACTIVE' ? 'bg-red-50 border-red-500 shadow-sm' : 'bg-white border-slate-100 hover:border-red-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`අක්‍රිය උකස්`)}</p>
          <p className={`text-2xl font-black ${filter === 'INACTIVE' ? 'text-red-700' : 'text-red-500'}`}>{inactiveCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`කල් ඉකුත් වූ`)}</p>
        </div>

        <div 
          onClick={() => setFilter('REDEEMED')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${filter === 'REDEEMED' ? 'bg-slate-100 border-slate-400 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'}`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`නිදහස් කළ`)}</p>
          <p className={`text-2xl font-black ${filter === 'REDEEMED' ? 'text-slate-700' : 'text-blue-600'}`}>{redeemedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t(`බේරාගත් උකස්`)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t(`ටිකට් අංකය, සාමාජික අංකය, ජා.හැ.ප හෝ නම සොයන්න...`)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm mt-4">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`ටිකට්`)}<br/>{t(`අංකය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`සාමාජික`)}<br/>{t(`නම`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`නිකුත් කළ`)}<br/>{t(`දිනය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`භාණ්ඩ`)}<br/>{t(`විස්තරය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`උකස්`)}<br/>{t(`අත්තිකාරම`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`කල් ඉකුත් වන`)}<br/>{t(`දිනය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`තත්ත්වය`)}</th>
                <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`ක්‍රියාව`)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTickets.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium">{t(`උකස් ගිණුම් නොමැත. (No pawning tickets found)`)}</td></tr>
              ) : filteredTickets.map(ticket => (
                <tr key={ticket.ticketId} className="hover:bg-slate-50 transition group">
                  <td className="px-3 py-3 border-r border-slate-100 font-bold text-amber-700 whitespace-nowrap text-xs">{ticket.ticketNumber}</td>
                  <td className="px-3 py-3 border-r border-slate-100 font-semibold text-slate-800 text-xs">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {getMemberInitials(ticket)}
                    </div>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-xs text-slate-600 font-medium whitespace-nowrap text-center">
                    {new Date(ticket.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 whitespace-nowrap text-xs text-center">
                    <span className="text-slate-800 font-bold">{ticket.articleDescription}</span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-right font-bold whitespace-nowrap text-xs">
                    {(ticket.status === 'PENDING' || ticket.status === 'APPROVED') 
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ Pending</span>
                      : <span className="text-slate-800">Rs. {Number(ticket.advanceAmount).toLocaleString()}</span>
                    }
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-xs text-slate-600 font-medium whitespace-nowrap text-center">
                    {new Date(ticket.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100 text-center">
                    {(() => {
                      const displayStatus = ticket.displayStatus;
                      return (
                        <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold tracking-wider whitespace-nowrap ${
                          displayStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ticket.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          ticket.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          displayStatus === 'REDEEMED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          displayStatus === 'NEARING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {ticket.status === 'PENDING' ? 'අනුමැතියට යවා ඇත' :
                           ticket.status === 'APPROVED' ? 'අනුමත කර ඇත' :
                           displayStatus === 'ACTIVE' ? 'ක්‍රියාකාරී' :
                           displayStatus === 'INACTIVE' || ticket.status === 'OVERDUE' ? 'අක්‍රියයි' :
                           displayStatus === 'NEARING' ? 'කල් පිරීමට ආසන්නයි' :
                           displayStatus === 'REDEEMED' ? 'නිදහස් කළ' : displayStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedTicket(enrichTicketWithMember(ticket))}
                        className="px-2.5 py-1.5 rounded-lg text-[#025a4e] bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center border border-emerald-200/50 shadow-sm whitespace-nowrap gap-1 text-[11px] font-bold"
                      >
                        <Eye size={12} /> {t(`බලන්න`)}</button>
                      {ticket.status === 'APPROVED' && !readOnly && (
                        <button 
                          onClick={() => setDisburseTicket(enrichTicketWithMember(ticket))}
                          className="px-2.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm whitespace-nowrap gap-1 text-[11px] font-bold"
                        >
                          {t(`මුදල් නිකුත් කරන්න`)}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Modals */}

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
          onPay={() => {
            const ticketToPay = selectedTicket;
            setSelectedTicket(null);
            setPaymentTicket(ticketToPay);
          }}
        />
      )}
      
      {paymentTicket && (
        <PawnPaymentModal 
          ticket={paymentTicket} 
          onClose={() => setPaymentTicket(null)} 
          onSuccess={() => { setPaymentTicket(null); loadTickets(); }} 
        />
      )}

      {disburseTicket && (
        <PawningDisburseModal
          ticket={disburseTicket}
          onClose={() => setDisburseTicket(null)}
          onSuccess={() => { setDisburseTicket(null); loadTickets(); }}
        />
      )}

      {showPaymentSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <div>
                <h3 className="text-lg font-bold text-amber-900">{t(`වාරික ගෙවීම (Installment Payment)`)}</h3>
                <p className="text-xs font-medium text-amber-700 mt-0.5">{t(`උකස් පත්‍රිකා අංකය ඇතුළත් කරන්න`)}</p>
              </div>
              <button 
                onClick={() => {
                  setShowPaymentSearchModal(false);
                  setSearchTicketNumber('');
                  setSearchError('');
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              setSearchError('');
              if (!searchTicketNumber.trim()) {
                setSearchError('කරුණාකර උකස් පත්‍රිකා අංකයක් ඇතුළත් කරන්න.');
                return;
              }
              const cleanInput = searchTicketNumber.trim().replace(/^(pw|PW|Pw|pW)-/, '');
              const found = tickets.find(t => String(t.ticketNumber) === cleanInput);
              if (!found) {
                setSearchError('මෙම අංකයෙන් උකස් පත්‍රිකාවක් හමු නොවීය.');
                return;
              }
              if (found.status === 'PENDING') {
                setSearchError('මෙම උකස් පත්‍රිකාව තවමත් අනුමත වී නැත.');
                return;
              }
              if (found.status === 'REDEEMED') {
                setSearchError('මෙම උකස් පත්‍රිකාව දැනටමත් බේරාගෙන ඇත.');
                return;
              }
              setPaymentTicket(enrichTicketWithMember(found));
              setShowPaymentSearchModal(false);
              setSearchTicketNumber('');
            }} className="p-6 space-y-4">
              {searchError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                  {searchError}
                </div>
              )}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t(`උකස් පත්‍රිකා අංකය (Pawn Ticket Number) *`)}</label>
                <input 
                  type="text"
                  required
                  value={searchTicketNumber}
                  onChange={e => {
                    setSearchTicketNumber(e.target.value);
                    setSearchError('');
                  }}
                  placeholder="e.g. 87348349"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-semibold focus:border-amber-500 focus:outline-none"
                  autoComplete="off"
                />
                
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
                    {suggestions.map((t: any) => {
                      const memberName = getMemberInitials(t);
                      return (
                        <button
                          key={t.ticketId}
                          type="button"
                          onClick={() => {
                            setPaymentTicket(enrichTicketWithMember(t));
                            setShowPaymentSearchModal(false);
                            setSearchTicketNumber('');
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-amber-50/50 transition flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-amber-900">{t.ticketNumber}</span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-slate-600 font-medium">{memberName}</span>
                          </div>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t.status}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowPaymentSearchModal(false);
                    setSearchTicketNumber('');
                    setSearchError('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  {t(`අවලංගු කරන්න`)}</button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800 transition"
                >
                  {t(`පිරික්සන්න (Proceed)`)}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}
