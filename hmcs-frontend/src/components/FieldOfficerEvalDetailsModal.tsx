import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, FileText, User, Phone, MapPin, CreditCard, Calendar, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  loan: any;
  onClose: () => void;
}

export default function FieldOfficerEvalDetailsModal({ loan, onClose }: Props) {
  const { t } = useLanguage();
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  // Parse evaluation notes (stored as JSON: { text, documents })
  let evalText = '';
  let evalDocs: string[] = [];
  if (loan.evaluationNotes) {
    try {
      const parsed = JSON.parse(loan.evaluationNotes);
      evalText = parsed.text || '';
      evalDocs = Array.isArray(parsed.documents) ? parsed.documents : [];
    } catch {
      evalText = loan.evaluationNotes;
    }
  }

  const ad = loan.applicationData || {};
  const applicantName = ad.applicantName || ad.name || 'Unknown';
  const status = loan.evaluationStatus;

  const statusConfig = {
    RECOMMENDED:      { label: 'අනුමත කිරීමට නිර්දේශිතයි',    color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle size={20} className="text-emerald-600" /> },
    NOT_RECOMMENDED:  { label: 'නිර්දේශ කර නැත',              color: 'bg-rose-100 text-rose-800 border-rose-300',         icon: <XCircle size={20} className="text-rose-600" /> },
    NEEDS_MORE_INFO:  { label: 'වැඩිදුර තොරතුරු අවශ්‍යයි',      color: 'bg-amber-100 text-amber-800 border-amber-300',       icon: <AlertCircle size={20} className="text-amber-600" /> },
  }[status] || { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300', icon: null };

  const fields = [
    { icon: <User size={14} />,     label: t('නම (Name)'),                  value: applicantName },
    { icon: <CreditCard size={14}/>,label: t('ජා.හැ.ප. (NIC)'),             value: ad.nic || '—' },
    { icon: <Phone size={14} />,    label: t('දුරකථන (Phone)'),             value: ad.phone || ad.contactNumber || '—' },
    { icon: <MapPin size={14} />,   label: t('ලිපිනය (Address)'),           value: [ad.addressLine1, ad.addressLine2].filter(Boolean).join(', ') || ad.address || '—' },
    { icon: <FileText size={14} />, label: t('ණය අරමුණ (Loan Purpose)'),   value: ad.loanPurpose || ad.purpose || '—' },
    { icon: <Calendar size={14} />, label: t('රැකියාව (Job)'),             value: ad.primaryJob || ad.occupation || '—' },
    { icon: <FileText size={14} />, label: t('සේවායෝජකයා'),                value: ad.employerDetails || '—' },
    { icon: <FileText size={14} />, label: t('සාමාජික අංකය'),              value: ad.memberNo || ad.membershipNumber || '—' },
    { icon: <FileText size={14} />, label: t('පදිංචි කාලය'),              value: ad.residencePeriod || '—' },
    { icon: <FileText size={14} />, label: t('යැපෙන්නන්'),                 value: ad.dependentsCount !== undefined ? String(ad.dependentsCount) : '—' },
    { icon: <FileText size={14} />, label: t('කලත්‍රයාගේ රැකියාව'),       value: ad.spouseJobTitle || '—' },
    { icon: <FileText size={14} />, label: t('වාර්ෂික වියදම'),            value: ad.annualExpense ? `Rs. ${Number(ad.annualExpense).toLocaleString()}` : '—' },
  ].filter(f => f.value && f.value !== '—');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5 text-white flex items-start justify-between shrink-0">
          <div>
            <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest mb-1">Field Officer Evaluation Report</p>
            <h2 className="text-xl font-black">{applicantName}</h2>
            <p className="text-amber-100 text-sm mt-1">
              {loan.loanType?.name || 'ණය'} &nbsp;·&nbsp; Rs. {Number(loan.requestedAmount).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Evaluation Result */}
          <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${statusConfig.color}`}>
            {statusConfig.icon}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">ක්ෂේත්‍ර නිලධාරි නිර්දේශය</p>
              <p className="font-black text-base">{t(statusConfig.label)}</p>
            </div>
          </div>

          {/* Notes */}
          {evalText && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-amber-600" />
                {t('ක්ෂේත්‍ර නිලධාරිගේ සටහන් (Field Officer Notes)')}
              </h4>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{evalText}</p>
            </div>
          )}
          {!evalText && (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center text-slate-400 text-sm">
              සටහන් යොදා නැත.
            </div>
          )}

          {/* Uploaded Photos */}
          {evalDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <Image size={14} className="text-amber-600" />
                {t('ඡායාරූප / ලේඛන')} ({evalDocs.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {evalDocs.map((doc, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-amber-400 cursor-pointer transition group"
                    onClick={() => setPreviewIdx(i)}
                  >
                    <img src={doc} alt={`Document ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition">👁 {t('View')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Details */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <CreditCard size={14} className="text-indigo-600" />
                {t('ණය විස්තර (Loan Details)')}
              </h4>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: t('ඉල්ලූ මුදල'), value: `Rs. ${Number(loan.requestedAmount).toLocaleString()}` },
                { label: t('ණය වර්ගය'), value: loan.loanType?.name || '—' },
                { label: t('කාලය (Months)'), value: `${loan.termMonths} මාස` },
                { label: t('පොලී අනුපාතය'), value: `${loan.interestRate}% p.a.` },
                { label: t('අයදුම් කළ දිනය'), value: loan.appliedDate ? new Date(loan.appliedDate).toLocaleDateString('si-LK') : '—' },
                { label: t('ණය තත්ත්වය'), value: loan.status },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="font-black text-slate-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Applicant Details */}
          {fields.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <User size={14} className="text-indigo-600" />
                  {t('අයදුම්කරු විස්තර (Applicant Details)')}
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {fields.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-slate-400 mt-0.5 shrink-0">{f.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-semibold text-slate-800 break-words">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition text-sm"
          >
            {t('වසන්න (Close)')}
          </button>
        </div>
      </div>

      {/* Image Fullscreen Preview */}
      {previewIdx !== null && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewIdx(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition" onClick={() => setPreviewIdx(null)}>
            <X size={24} />
          </button>
          {previewIdx > 0 && (
            <button className="absolute left-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition" onClick={(e) => { e.stopPropagation(); setPreviewIdx(i => i! - 1); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          <img src={evalDocs[previewIdx]} alt="Preview" className="max-h-full max-w-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          {previewIdx < evalDocs.length - 1 && (
            <button className="absolute right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition" onClick={(e) => { e.stopPropagation(); setPreviewIdx(i => i! + 1); }}>
              <ChevronRight size={32} />
            </button>
          )}
          <p className="absolute bottom-4 text-white/50 text-sm">{previewIdx + 1} / {evalDocs.length}</p>
        </div>
      )}
    </div>
  );
}
