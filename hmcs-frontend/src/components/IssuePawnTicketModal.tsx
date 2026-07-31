import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import * as AccountService from '../services/account.service';
import * as PawningService from '../services/pawning.service';
import { Snackbar, Alert } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';

export default function IssuePawnTicketModal({ branchId, onClose, onSuccess }: { branchId: number; onClose: () => void; onSuccess: () => void }) {
  const { t } = useLanguage();

  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<AccountService.MemberData | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ticketNumber: '',
    articleDescription: '',
    grossWeightGrams: '',
    netWeightGrams: '',
    purityKarat: '22',
    assessedValue: '',
    advanceAmount: '',
    interestRate: '',
    issueDate: new Date().toLocaleDateString('en-CA')
  });

  const [adminSettings, setAdminSettings] = useState({ advancePerSov: 120000, interestRate: 13.00 });

  useEffect(() => {
    AccountService.getMembers().then(setMembers).catch(() => {});
    PawningService.getAllSettings().then((settings: any[]) => {
      const int = Number(settings.find(s => s.settingKey === 'INTEREST_RATE')?.settingValue || '13.00');
      setAdminSettings({ advancePerSov: 0, interestRate: int });
      setForm(prev => ({ ...prev, interestRate: int.toString() }));
    }).catch(console.error);
  }, []);

  const [snackbar, setSnackbar] = useState<{open: boolean, msg: string, severity: 'success' | 'error' | 'warning'}>({ open: false, msg: '', severity: 'success' });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setSnackbar({ open: true, msg: 'කරුණාකර සාමාජිකයෙකු තෝරන්න!', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await PawningService.issueTicket({
        ticketNumber: form.ticketNumber,
        memberId: selectedMember.memberId,
        branchId,
        articleDescription: form.articleDescription,
        grossWeightGrams: Number(form.grossWeightGrams),
        netWeightGrams: Number(form.netWeightGrams),
        purityKarat: Number(form.purityKarat),
        assessedValue: 0, // Set later by Valuer/Committee
        advanceAmount: 0, // Set later by Valuer/Committee
        interestRate: Number(form.interestRate),
        issueDate: form.issueDate,
        valuerId: '00000000-0000-0000-0000-000000000000' // Placeholder valuer ID
      });
      setSnackbar({ open: true, msg: 'නව උකස් පත්‍රිකාව සාර්ථකව නිකුත් කරන ලදී!', severity: 'success' });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setSnackbar({ open: true, msg: 'දෝෂයක් ඇතිවිය: ' + (err.response?.data?.message || err.message), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = search ? members.filter(m => 
    m.fullName?.toLowerCase().includes(search.toLowerCase()) || 
    m.nic?.toLowerCase().includes(search.toLowerCase()) ||
    m.membershipNumber?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-yellow-50">
          <h3 className="text-lg font-bold text-yellow-800">{t(`නව උකස් පත්‍රිකාවක් නිකුත් කිරීම (Issue New Pawn Ticket)`)}</h3>
          <button onClick={onClose}><X size={18} className="text-yellow-600 hover:text-yellow-800" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className={`mb-6 p-4 rounded-xl border ${
            form.issueDate && form.issueDate < new Date().toLocaleDateString('en-CA') 
            ? 'bg-amber-100/60 border-amber-300' 
            : 'bg-yellow-50/50 border-yellow-100/50'
          }`}>
            <label className="block text-xs font-bold text-yellow-800 mb-1">{t(`ගිණුම ආරම්භ කළ දිනය / නිකුත් කළ දිනය (Issue Date) *`)}</label>
            <input required type="date" value={form.issueDate} onChange={e => setForm({...form, issueDate: e.target.value})} className="w-full border border-yellow-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white" />
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-yellow-600">{t(`පරණ ගිණුම් සඳහා අදාළ දිනය තෝරන්න. (Select past date for historical records)`)}</p>
              {form.issueDate && form.issueDate < new Date().toLocaleDateString('en-CA') && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full animate-in fade-in">
                  {t(`⚠️ පැරණි උකස් ඇතුළත් කිරීමක්`)}</span>
              )}
            </div>
          </div>

          {!selectedMember ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{t(`සාමාජිකයා තෝරන්න (Select Member)`)}</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder={t(`NIC හෝ නම මඟින් සොයන්න...`)}
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              {search && (
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto shadow-sm">
                  {filteredMembers.map(m => (
                    <div key={m.memberId} onClick={() => setSelectedMember(m)} className="p-3 hover:bg-slate-50 cursor-pointer transition">
                      <p className="font-bold text-slate-800">{m.fullName}</p>
                      <p className="text-xs text-slate-500">NIC: {m.nic} | Member No: {m.membershipNumber || 'N/A'}</p>
                    </div>
                  ))}
                  {filteredMembers.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">{t(`සාමාජිකයින් හමු නොවීය.`)}</p>}
                </div>
              )}
            </div>
          ) : (
            <form id="pawn-form" onSubmit={handleIssue} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pawner Details</p>
                  <p className="font-bold text-slate-800">{selectedMember.fullName}</p>
                  <p className="text-sm text-slate-600">{selectedMember.nic} · {selectedMember.contactNumber}</p>
                </div>
                 <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-500 mb-1">{t(`වාර්ෂික පොලිය`)}</span>
                  <span className="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">{form.interestRate}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <button type="button" onClick={() => setSelectedMember(null)} className="text-xs text-blue-600 hover:underline">Change Member</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t(`උකස් පත්‍රිකා අංකය (Ticket Number) *`)}</label>
                  <input required value={form.ticketNumber} onChange={e => setForm({...form, ticketNumber: e.target.value})} placeholder="e.g. 698594" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t(`භාණ්ඩ විස්තරය (Article Description) *`)}</label>
                  <input required value={form.articleDescription} onChange={e => setForm({...form, articleDescription: e.target.value})} placeholder="e.g. 22K Gold Chain with Pendant" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t(`දළ බර (Gross Weight - g) *`)}</label>
                  <input required type="number" step="0.01" value={form.grossWeightGrams} onChange={e => setForm({...form, grossWeightGrams: e.target.value})} onWheel={(e) => (e.target as HTMLElement).blur()} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t(`ශුද්ධ බර (Net Weight - g) *`)}</label>
                  <input required type="number" step="0.01" value={form.netWeightGrams} onChange={e => setForm({...form, netWeightGrams: e.target.value})} onWheel={(e) => (e.target as HTMLElement).blur()} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t(`රන් තත්වය (Purity - Karat) *`)}</label>
                  <select required value={form.purityKarat} onChange={e => setForm({...form, purityKarat: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white">
                    <option value="24">24K (99.9%)</option>
                    <option value="22">22K (91.6%)</option>
                    <option value="21">21K (87.5%)</option>
                    <option value="18">18K (75.0%)</option>
                  </select>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
          <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-sm transition">{t(`අවලංගු කරන්න (Cancel)`)}</button>
          {selectedMember && (
            <button type="submit" form="pawn-form" disabled={loading} className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm shadow transition disabled:opacity-60">
              {loading ? 'Processing...' : 'නිකුත් කරන්න (Issue Ticket)'}
            </button>
          )}
        </div>
      </div>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem', fontWeight: 'bold' }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}
