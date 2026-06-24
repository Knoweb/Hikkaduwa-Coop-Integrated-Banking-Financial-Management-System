import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import * as AccountService from '../services/account.service';
import * as PawningService from '../services/pawning.service';

export default function IssuePawnTicketModal({ branchId, onClose, onSuccess }: { branchId: number; onClose: () => void; onSuccess: () => void }) {
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<AccountService.MemberData | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    articleDescription: '',
    grossWeightGrams: '',
    netWeightGrams: '',
    purityKarat: '22',
    assessedValue: '',
    advanceAmount: '',
    interestRate: ''
  });

  useEffect(() => {
    AccountService.getMembers().then(setMembers).catch(() => {});
    PawningService.getAllSettings().then((settings: any[]) => {
      const int = settings.find(s => s.settingKey === 'pw_int')?.settingValue || '13.00';
      const adv = settings.find(s => s.settingKey === 'pw_adv')?.settingValue || '120000';
      setForm(prev => ({ ...prev, advanceAmount: adv, interestRate: int }));
    }).catch(console.error);
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      alert('කරුණාකර සාමාජිකයෙකු තෝරන්න (Please select a member).');
      return;
    }
    setLoading(true);
    try {
      await PawningService.issueTicket({
        memberId: selectedMember.memberId,
        branchId,
        articleDescription: form.articleDescription,
        grossWeightGrams: Number(form.grossWeightGrams),
        netWeightGrams: Number(form.netWeightGrams),
        purityKarat: Number(form.purityKarat),
        assessedValue: Number(form.assessedValue),
        advanceAmount: Number(form.advanceAmount),
        interestRate: Number(form.interestRate),
        valuerId: '00000000-0000-0000-0000-000000000000' // Placeholder valuer ID
      });
      alert('Pawn ticket issued successfully!');
      onSuccess();
    } catch (err: any) {
      alert('Error issuing pawn ticket: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = search ? members.filter(m => 
    m.fullName.toLowerCase().includes(search.toLowerCase()) || 
    m.nic.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-yellow-50">
          <h3 className="text-lg font-bold text-yellow-800">නව උකස් පත්‍රිකාවක් නිකුත් කිරීම (Issue New Pawn Ticket)</h3>
          <button onClick={onClose}><X size={18} className="text-yellow-600 hover:text-yellow-800" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!selectedMember ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">සාමාජිකයා තෝරන්න (Select Member)</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="NIC හෝ නම මඟින් සොයන්න..."
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
                  {filteredMembers.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">සාමාජිකයින් හමු නොවීය.</p>}
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
                <button type="button" onClick={() => setSelectedMember(null)} className="text-xs text-blue-600 hover:underline">Change Member</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">භාණ්ඩ විස්තරය (Article Description) *</label>
                  <input required value={form.articleDescription} onChange={e => setForm({...form, articleDescription: e.target.value})} placeholder="e.g. 22K Gold Chain with Pendant" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">දළ බර (Gross Weight - g) *</label>
                  <input required type="number" step="0.01" value={form.grossWeightGrams} onChange={e => setForm({...form, grossWeightGrams: e.target.value})} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ශුද්ධ බර (Net Weight - g) *</label>
                  <input required type="number" step="0.01" value={form.netWeightGrams} onChange={e => setForm({...form, netWeightGrams: e.target.value})} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">රන් තත්වය (Purity - Karat) *</label>
                  <select required value={form.purityKarat} onChange={e => setForm({...form, purityKarat: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white">
                    <option value="24">24K (99.9%)</option>
                    <option value="22">22K (91.6%)</option>
                    <option value="21">21K (87.5%)</option>
                    <option value="18">18K (75.0%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">තක්සේරු වටිනාකම (Assessed Value - Rs) *</label>
                  <input required type="number" step="0.01" value={form.assessedValue} onChange={e => setForm({...form, assessedValue: e.target.value})} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">අත්තිකාරම් මුදල (Advance Amount - Rs) *</label>
                  <input required type="number" step="0.01" value={form.advanceAmount} onChange={e => setForm({...form, advanceAmount: e.target.value})} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">වාර්ෂික පොලී අනුපාතය (Interest Rate % p.a.)</label>
                  <input required type="number" step="0.01" value={form.interestRate} onChange={e => setForm({...form, interestRate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 text-slate-500 focus:outline-none" readOnly />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm transition">අවලංගු කරන්න (Cancel)</button>
          {selectedMember && (
            <button type="submit" form="pawn-form" disabled={loading} className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm shadow transition disabled:opacity-60">
              {loading ? 'Processing...' : 'නිකුත් කරන්න (Issue Ticket)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
