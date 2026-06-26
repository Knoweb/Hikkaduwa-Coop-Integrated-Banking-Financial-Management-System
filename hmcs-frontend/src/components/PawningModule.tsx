import React, { useState, useEffect } from 'react';
import { Gem, Plus, Eye } from 'lucide-react';
import * as PawningService from '../services/pawning.service';
import * as AccountService from '../services/account.service';
import IssuePawnTicketModal from './IssuePawnTicketModal';
import PawnTicketViewModal from './PawnTicketViewModal';

export default function PawningModule({ branchId }: { branchId: number }) {
  if (window.__isAdminView) return <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"><h3 className="text-xl font-bold text-red-600 mb-2">Access Denied</h3><p className="text-slate-600 mb-6">System Administrators are in Read-Only mode and cannot perform transactions or open accounts.</p><button onClick={typeof onClose !== 'undefined' ? onClose : () => {}} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-700">Close</button></div></div>;
  const [tickets, setTickets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [interestRate, setInterestRate] = useState('13');

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

  const getMemberName = (ticket: any): string => {
    if (ticket.memberName)     return ticket.memberName;
    if (ticket.memberFullName) return ticket.memberFullName;
    if (ticket.member?.fullNameSinhala) return ticket.member.fullNameSinhala;
    if (ticket.member?.fullName)        return ticket.member.fullName;
    const found = members.find(m => m.memberId === ticket.memberId);
    return found ? (found.fullNameSinhala || found.fullName) : (ticket.memberId?.toString().slice(0, 8) || '—');
  };

  const handleRedeem = async (ticket: any) => {
    if (!window.confirm(`Are you sure you want to redeem ticket ${ticket.ticketNumber}?\nTotal Due: Rs. ${Number(ticket.totalDueAmount).toLocaleString()}`)) return;
    setLoading(true);
    try {
      await PawningService.redeemTicket(ticket.ticketId);
      alert('Pawn ticket redeemed successfully!');
      loadTickets();
    } catch (e: any) {
      alert('Redemption failed: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    AccountService.getMembers().then(setMembers).catch(() => {});
    PawningService.getAllSettings().then((settings: any[]) => {
      const int = settings.find(s => s.settingKey === 'pw_int')?.settingValue || '13.00';
      setInterestRate(int);
    }).catch(console.error);
  }, [branchId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Gem size={16} /> 
          උකස් ගිණුම් කළමනාකරණය (Pawning Accounts)
        </h3>
        <button 
          onClick={() => setShowIssueModal(true)}
          className="text-xs px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition flex items-center gap-2"
        >
          <Plus size={14}/> නව උකස් පත්‍රිකාවක් නිකුත් කිරීම
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">ටිකට් අංකය</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">සාමාජික නම</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">භාණ්ඩ විස්තරය</th>
            <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">බර (ග්‍රෑම්)</th>
            <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">අත්තිකාරම් මුදල</th>
            <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">පොලිය ({interestRate}%)</th>
            <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">තත්ත්වය</th>
            <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">ක්‍රියාව</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.length === 0 ? (
            <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">උකස් ගිණුම් නොමැත. (No pawning tickets found)</td></tr>
          ) : tickets.map(t => (
            <tr key={t.ticketId} className="hover:bg-slate-50 transition">
              <td className="px-5 py-3 font-bold text-slate-800">{t.ticketNumber}</td>
              <td className="px-5 py-3 font-semibold text-slate-800">{getMemberName(t)}</td>
              <td className="px-5 py-3 text-slate-600">{t.articleDescription}</td>
              <td className="px-5 py-3 text-right font-mono text-slate-800">{t.netWeightGrams}g</td>
              <td className="px-5 py-3 text-right font-semibold text-slate-800">Rs. {Number(t.advanceAmount).toLocaleString()}</td>
              <td className="px-5 py-3 text-right font-semibold text-red-600">+ Rs. {Number(t.accruedInterest).toLocaleString()}</td>
              <td className="px-5 py-3 text-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  t.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                  t.status === 'REDEEMED' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>{t.status}</span>
              </td>
              <td className="px-5 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => setSelectedTicket(t)}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition flex items-center gap-1">
                    <Eye size={12}/> View
                  </button>
                  {(t.status === 'ACTIVE' || t.status === 'OVERDUE') && (
                    <button 
                      onClick={() => handleRedeem(t)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center gap-1">
                      Redeem
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
    </div>
  );
}
