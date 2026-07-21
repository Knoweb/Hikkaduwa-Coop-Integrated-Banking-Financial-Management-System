import ConfirmDialog from './ConfirmDialog';
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, Scale, Eye, FileText, MapPin, Banknote } from 'lucide-react';
import axios from 'axios';
import { getCurrentUser } from '../services/auth.service';
import * as PawningService from '../services/pawning.service';
import * as AccountService from '../services/account.service';
import { getBranches } from '../services/branch.service';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useLanguage } from '../context/LanguageContext';

export default function PawningApprovalsView() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [activeListTab, setActiveListTab] = useState<'pending' | 'approved'>('pending');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getBranchName = (id: number) => {
    const branch = branches.find(b => b.branchId === id || b.id === id);
    return branch?.branchName || branch?.name || `ශාඛාව ${id}`;
  };

  const loadData = async () => {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      let apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/pawning/tickets` 
        : 'http://localhost:8080/api/v1/pawning/tickets';
      
      // Fetch only branch-specific tickets for manager/officer
      if (user?.role === 'BRANCH_MANAGER' || user?.role === 'SENIOR_OFFICER' || user?.branchId) {
        apiUrl = `${apiUrl}/branch/${user.branchId}`;
      }
      
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    loadData(); 
    AccountService.getMembers().then(setMembers).catch(() => {});
    getBranches().then(setBranches).catch(() => {});
  }, []);

  const pendingTickets = tickets.filter(t => t.status === 'PENDING');
  const approvedTickets = tickets.filter(t => t.status === 'APPROVED' || t.status === 'ACTIVE');

  const getMemberDetails = (memberId: string) => {
    if (!memberId) return { name: '—', number: '—' };
    const normalizedId = String(memberId).toLowerCase();
    const member = members.find(m => String(m.memberId).toLowerCase() === normalizedId);
    if (!member) return { name: '—', number: memberId?.substring(0, 8) + '...' };
    return {
      name: member.fullNameSinhala || member.fullName || member.nameWithInitials || '—',
      number: member.membershipNumber || member.memberId?.substring(0, 8)
    };
  };


  return (
    <div className="space-y-6">
      {selectedTicket && (
        <PawningReviewModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onAction={loadData}
          memberDetails={getMemberDetails(selectedTicket.memberId)}
          branchName={getBranchName(selectedTicket.branchId)}
          showToast={showToast}
        />
      )}
      
      <div className="flex border-b border-slate-200 gap-6 mb-6">
        <button 
          onClick={() => setActiveListTab('pending')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${activeListTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={16} />
          <span>අනුමැතිය ලැබිය යුතු ({pendingTickets.length})</span>
          {activeListTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        <button 
          onClick={() => setActiveListTab('approved')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${activeListTab === 'approved' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle size={16} />
          <span>පෙර වාර්තා ({approvedTickets.length})</span>
          {activeListTab === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {activeListTab === 'pending' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Scale size={16} className="text-amber-600" /> අනුමැතිය ලැබිය යුතු උකස් අයදුම්පත්</h3>
          {pendingTickets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-300 rounded-xl">අනුමැතිය සඳහා පොරොත්තුවෙන් පවතින උකස් අයදුම්පත් නොමැත.</p>
          ) : pendingTickets.map(t => (
            <div key={t.ticketId} className="mb-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">උකස් ඉල්ලුම්කරු</p>
                  <p className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                    {getMemberDetails(t.memberId).name}
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    සාමාජික අංකය: {getMemberDetails(t.memberId).number}
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    උකස් පත්‍රිකා අංකය: <span className="text-amber-800 font-bold">{t.ticketNumber}</span>
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mb-3">
                    ශාඛාව: <span className="text-blue-700 font-bold">{getBranchName(t.branchId)}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">
                      <FileText size={14} /> {t.ticketNumber}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <MapPin size={14} /> {getBranchName(t.branchId)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                      <Scale size={14} /> {t.articleDescription}
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                      දළ බර: {t.grossWeightGrams}g
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <button onClick={() => setSelectedTicket(t)} className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl font-bold shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 flex items-center gap-2">
                    <Eye size={16} /> පරීක්ෂා කර අනුමත කරන්න
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeListTab === 'approved' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" /> පෙර උකස් වාර්තා</h3>
          {approvedTickets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-300 rounded-xl">පෙර උකස් වාර්තා නොමැත.</p>
          ) : approvedTickets.map(t => (
            <div key={t.ticketId} className="mb-4 p-5 border border-emerald-100 rounded-xl bg-emerald-50/30 hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">උකස් ඉල්ලුම්කරු</p>
                  <p className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                    {getMemberDetails(t.memberId).name}
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    සාමාජික අංකය: {getMemberDetails(t.memberId).number}
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    උකස් පත්‍රිකා අංකය: <span className="text-amber-800 font-bold">{t.ticketNumber}</span>
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mb-3">
                    ශාඛාව: <span className="text-blue-700 font-bold">{getBranchName(t.branchId)}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">
                      <FileText size={14} /> {t.ticketNumber}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <MapPin size={14} /> {getBranchName(t.branchId)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                      <Scale size={14} /> {t.articleDescription}
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">
                      අනුමත මුදල: Rs. {Number(t.assessedValue).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <span className="px-5 py-2.5 bg-emerald-100 text-emerald-800 text-sm rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle size={16} /> අනුමතයි
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

function PawningReviewModal({ ticket, onClose, onAction, memberDetails, branchName, showToast }: { ticket: any; onClose: () => void; onAction: () => void; memberDetails: any; branchName: string; showToast?: (msg: string, severity?: 'success' | 'error' | 'warning' | 'info') => void }) {
  const [assessedValue, setAssessedValue] = useState(ticket.assessedValue || '');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {}
  });

  const handleApprove = async () => {
    console.log('handleApprove clicked. Ticket:', ticket, 'Assessed Value:', assessedValue, 'Remarks:', remarks);
    if (!assessedValue || isNaN(Number(assessedValue))) {
      setError('කරුණාකර නිවැරදි තක්සේරු වටිනාකමක් ඇතුළත් කරන්න.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'උකස් අයදුම්පත අනුමත කරන්නද?',
      message: `තක්සේරු මුදල රු. ${Number(assessedValue).toLocaleString()} ලෙස මෙම උකස් පත්‍රිකාව අනුමත කිරීමට අවශ්‍ය බව විශ්වාසද?`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
        setLoading(true);
        setError('');
        try {
          console.log('Calling PawningService.approveTicket with ID:', ticket.ticketId);
          const result = await PawningService.approveTicket(ticket.ticketId, {
            assessedValue: Number(assessedValue),
            remarks
          });
          console.log('Approve API call success:', result);
          if (showToast) {
            showToast('✅ උකස් පත්‍රිකාව සාර්ථකව අනුමත කරන ලදී! ශාඛාවට දැනුම් දී ඇත.', 'success');
          } else {
            (window as any).showToast?.('✅ උකස් පත්‍රිකාව සාර්ථකව අනුමත කරන ලදී! ශාඛාවට දැනුම් දී ඇත.');
          }
          onAction();
          onClose();
        } catch (err: any) {
          console.error('Approve API call failed:', err);
          const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || String(err);
          setError('දෝෂයක් ඇතිවිය: ' + errMsg);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleReject = async () => {
    console.log('handleReject clicked. Ticket:', ticket, 'Remarks:', remarks);
    if (!remarks.trim()) {
      setError('ප්‍රතික්ෂේප කිරීමේ හේතුව remarks ලෙස ඇතුළත් කරන්න.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'උකස් අයදුම්පත ප්‍රතික්ෂේප කරන්නද?',
      message: 'මෙම උකස් පත්‍රිකාව ප්‍රතික්ෂේප කිරීමට අවශ්‍ය බව විශ්වාසද? මෙය ආපසු හැරවිය නොහැක.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
        setLoading(true);
        setError('');
        try {
          console.log('Calling PawningService.approveTicket (Reject) with ID:', ticket.ticketId);
          const result = await PawningService.approveTicket(ticket.ticketId, {
            assessedValue: 0,
            remarks: `[REJECTED] ${remarks}`
          });
          console.log('Reject API call success:', result);
          if (showToast) {
            showToast('❌ උකස් පත්‍රිකාව ප්‍රතික්ෂේප කරන ලදී.', 'error');
          } else {
            (window as any).showToast?.('❌ උකස් පත්‍රිකාව ප්‍රතික්ෂේප කරන ලදී.');
          }
          onAction();
          onClose();
        } catch (err: any) {
          console.error('Reject API call failed:', err);
          const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || String(err);
          setError('දෝෂයක් ඇතිවිය: ' + errMsg);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-100">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">උකස් පත්‍රිකා අනුමැතිය (Pawning Approval)</h2>
            <p className="text-blue-100/80 text-sm mt-0.5">අංකය: {ticket.ticketNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Eye size={20} className="opacity-0" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/60 mb-5 space-y-2">
            <p className="text-[11px] font-black text-blue-800 uppercase tracking-widest">උකස් ඉල්ලුම්කරුගේ විස්තර (Pawner Details)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">සාමාජිකයාගේ නම</p>
                <p className="text-sm font-bold text-slate-800">{memberDetails.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">සාමාජික අංකය</p>
                <p className="text-sm font-bold text-slate-800">{memberDetails.number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ශාඛාව</p>
                <p className="text-sm font-bold text-blue-800">{branchName}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold mb-1">භාණ්ඩයේ විස්තරය</p>
              <p className="text-sm font-semibold">{ticket.articleDescription}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold mb-1">රන් තත්ත්වය (Karat)</p>
              <p className="text-sm font-semibold">{ticket.purityKarat}K</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold mb-1">දළ බර</p>
              <p className="text-sm font-semibold">{ticket.grossWeightGrams}g</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold mb-1">ශුද්ධ බර</p>
              <p className="text-sm font-semibold">{ticket.netWeightGrams}g</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">තක්සේරු වටිනාකම / අනුමත කරන මුදල (Rs.) *</label>
              <input 
                type="number" 
                value={assessedValue} 
                onChange={e => { setAssessedValue(e.target.value); setError(''); }}
                className={`w-full border-2 rounded-xl px-4 py-3 font-semibold focus:outline-none ${error && !assessedValue ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-500'}`}
                placeholder="උදා: 50000.00"
              />
              {error && !assessedValue && (
                <p className="text-xs text-red-600 font-bold mt-1">{error}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">සටහන් (Remarks)</label>
              <textarea 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="කමිටුවේ සටහන මෙහි ඇතුළත් කරන්න..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition">
            අවලංගු කරන්න
          </button>
          <button onClick={handleReject} disabled={loading} className="px-6 py-2.5 rounded-xl bg-red-100 text-red-700 font-bold border border-red-300 hover:bg-red-200 transition disabled:opacity-50">
            {loading ? '...' : '❌ ප්‍රතික්ෂේප කරන්න'}
          </button>
          <button onClick={handleApprove} disabled={loading} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'අනුමත කරමින් පවතී...' : '✅ අනුමත කරන්න (Approve)'}
          </button>
        </div>
      </div>
    </div>
  );
}
