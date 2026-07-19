import React, { useState } from 'react';
import { Gem, Banknote } from 'lucide-react';
import * as PawningService from '../services/pawning.service';

export default function PawningDisburseModal({ ticket, onClose, onSuccess }: { ticket: any, onClose: () => void, onSuccess: () => void }) {
  const [advanceAmount, setAdvanceAmount] = useState(ticket.assessedValue || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDisburse = async () => {
    if (!advanceAmount || isNaN(Number(advanceAmount)) || Number(advanceAmount) <= 0) {
      setError('කරුණාකර නිවැරදි උකස් අත්තිකාරමක් ඇතුළත් කරන්න.');
      return;
    }
    
    if (Number(advanceAmount) > Number(ticket.assessedValue)) {
      setError(`උකස් අත්තිකාරම තක්සේරු වටිනාකම (Rs. ${Number(ticket.assessedValue).toLocaleString()}) ඉක්මවා යා නොහැක.`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await PawningService.disburseTicket(ticket.ticketId, Number(advanceAmount));
      (window as any).showToast?.('උකස් අත්තිකාරම සාර්ථකව නිකුත් කරන ලදී!');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-100">
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Banknote size={20} /> උකස් අත්තිකාරම් නිකුත් කිරීම
            </h2>
            <p className="text-emerald-100/80 text-sm mt-0.5">පත්‍රිකා අංකය: {ticket.ticketNumber}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-emerald-200 text-xl font-bold p-2">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold mb-1">සාමාජිකයා</p>
              <p className="text-sm font-semibold">{ticket.memberDetails?.fullName || ticket.memberId?.substring(0,8)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-bold mb-1">කමිටු තක්සේරුව (Assessed)</p>
              <p className="text-lg font-black text-emerald-800">Rs. {Number(ticket.assessedValue).toLocaleString()}</p>
            </div>
          </div>
          
          {ticket.committeeRemarks && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700 font-bold mb-1">කමිටුවේ සටහන</p>
              <p className="text-sm font-semibold text-amber-900">{ticket.committeeRemarks}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">නිකුත් කරන උකස් අත්තිකාරම (Advance Amount) *</label>
              <input 
                type="number" 
                value={advanceAmount} 
                onChange={e => setAdvanceAmount(e.target.value)}
                className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 font-bold text-lg text-slate-800 focus:border-emerald-500 focus:outline-none"
                placeholder="උදා: 50000.00"
              />
              <p className="text-xs text-slate-500 mt-1">කමිටුවෙන් අනුමත කළ උපරිම අගය: Rs. {Number(ticket.assessedValue).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition">
            අවලංගු කරන්න
          </button>
          <button onClick={handleDisburse} disabled={loading} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50">
            <Banknote size={18} /> {loading ? 'නිකුත් කරමින්...' : 'මුදල් නිකුත් කරන්න'}
          </button>
        </div>
      </div>
    </div>
  );
}
