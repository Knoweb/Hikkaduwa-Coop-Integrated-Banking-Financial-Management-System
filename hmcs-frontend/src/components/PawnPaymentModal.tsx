import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Calendar, Info, Clock, CheckCircle } from 'lucide-react';
import { Snackbar, Alert } from '@mui/material';
import { makePayment } from '../services/pawning.service';
import { useLanguage } from '../context/LanguageContext';


export default function PawnPaymentModal({ ticket, onClose, onSuccess }: any) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, msg: string, severity: 'success' | 'error' | 'warning'}>({ open: false, msg: '', severity: 'success' });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const remainingPrincipal = ticket.remainingAdvance || ticket.advanceAmount;
  const rate = ticket.interestRate || 13;
  const carriedOver = ticket.carriedOverInterest || 0;

  // Dynamically calculate interest based on the selected date
  const dynamicCalc = useMemo(() => {
    try {
      const lastPayment = new Date(ticket.lastPaymentDate || ticket.issueDate);
      lastPayment.setHours(0, 0, 0, 0);
      const selected = new Date(paymentDate);
      selected.setHours(0, 0, 0, 0);

      const diffTime = selected.getTime() - lastPayment.getTime();
      let diffDays = diffTime >= 0 ? Math.ceil(diffTime / (1000 * 3600 * 24)) : 0;
      
      let chargeableDays = 0;
      if (diffDays > 0) {
        const months = Math.floor(diffDays / 30);
        const rem = diffDays % 30;
        if (rem === 0) chargeableDays = months * 30;
        else if (rem <= 15) chargeableDays = months * 30 + 15;
        else chargeableDays = (months + 1) * 30;
      }

      const newInterest = (remainingPrincipal * chargeableDays * rate) / 36500;
      const totalInterest = carriedOver + newInterest;
      return {
        interest: totalInterest,
        totalDue: remainingPrincipal + totalInterest,
        chargeableDays
      };
    } catch (e) {
      return { interest: 0, totalDue: remainingPrincipal, chargeableDays: 0 };
    }
  }, [paymentDate, remainingPrincipal, rate, carriedOver, ticket.lastPaymentDate, ticket.issueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setSnackbar({ open: true, msg: 'කරුණාකර නිවැරදි මුදලක් ඇතුළත් කරන්න.', severity: 'error' });
      return;
    }
    
    if (Number(amount) > dynamicCalc.totalDue) {
      setSnackbar({ open: true, msg: `ගෙවිය යුතු උපරිම මුදල Rs. ${dynamicCalc.totalDue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} කි.`, severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await makePayment(ticket.ticketId, Number(amount), paymentDate);
      onSuccess();
    } catch (err: any) {
      setSnackbar({ open: true, msg: err.response?.data?.message || 'ගෙවීම අසාර්ථකයි.', severity: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-amber-900">{t(`වාරික ගෙවීම (Payment)`)}</h3>
            <p className="text-xs font-medium text-amber-700 mt-0.5">{ticket.ticketNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Member Details Card */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-100 rounded-full opacity-50"></div>
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {ticket.memberDetails?.fullNameSinhala || ticket.memberDetails?.fullName || ticket.memberName || 'Unknown Member'}
                  </h4>
                  {ticket.memberDetails?.fullNameSinhala && (
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{ticket.memberDetails?.fullName}</p>
                  )}
                </div>
                <span className="bg-amber-500/10 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-200/50">
                  ID: {ticket.memberDetails?.membershipNumber || ticket.memberDetails?.membership_number || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-amber-200/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-700/70 uppercase font-bold tracking-wider">NIC Number</span>
                  <span className="text-xs font-semibold text-slate-800">{ticket.memberDetails?.nic || ticket.member?.nic || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">{t(`ගෙවන දිනය (Payment Date)`)}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-slate-400" />
                </div>
                <input
                  type="date"
                  value={paymentDate}
                  max={new Date().toLocaleDateString('en-CA')}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl outline-none transition font-semibold text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{t(`* දිනය අනුව පොලිය ස්වයංක්‍රීයව වෙනස් වේ (අවසාන ගෙවීමේ සිට දින 15/30 ඛණ්ඩ අනුව).`)}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">{t(`ඉතිරි මූලික මුදල (Principal)`)}</span>
              <span className="font-bold text-slate-800">Rs. {remainingPrincipal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">එකතු වූ පොලිය ({dynamicCalc.chargeableDays} දින සඳහා)</span>
              <span className="font-bold text-red-600">+ Rs. {dynamicCalc.interest.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-amber-900">{t(`මුළු ගෙවිය යුතු මුදල (Total Due)`)}</span>
              <span className="text-lg font-black text-amber-900">Rs. {dynamicCalc.totalDue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 italic">
              * ගණනය කිරීම: {carriedOver > 0 ? `පෙර ඉතිරි පොලිය Rs. ${carriedOver.toLocaleString()} + ` : ''} (ඉතිරි මූලික මුදල Rs. {remainingPrincipal.toLocaleString()} × දින {dynamicCalc.chargeableDays} × {rate}% වා.පො.) ÷ 36,500
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">{t(`ගෙවන මුදල (Payment Amount)`)}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-bold">Rs.</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={dynamicCalc.totalDue}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl outline-none transition font-black text-xl text-slate-800"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                {t(`අවලංගු කරන්න`)}</button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] px-4 py-2.5 text-sm bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 transition disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? 'ගෙවමින් පවතී...' : 'ගෙවන්න (Pay)'}
              </button>
            </div>
          </form>

          {/* Payment History Report */}
          {ticket.payments && ticket.payments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" /> {t(`පෙර ගෙවීම් වාර්තා (Payment History)`)}</h4>
              <div className="space-y-3">
                {ticket.payments.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle size={16} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{new Date(p.paymentDate).toLocaleDateString()}</p>
                        <p className="text-[10px] font-medium text-slate-500">
                          පොලියට: Rs. {p.interestPortion?.toLocaleString(undefined, {minimumFractionDigits:2})} | මූලික මුදලට: Rs. {p.principalPortion?.toLocaleString(undefined, {minimumFractionDigits:2})}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-slate-800">Rs. {p.paymentAmount?.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                  </div>
                ))}
              </div>
            </div>
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
