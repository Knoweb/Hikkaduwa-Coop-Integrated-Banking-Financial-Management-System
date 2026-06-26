import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, XCircle, ChevronRight, Clock, User,
  FileText, Calculator, AlertTriangle, TrendingDown, Calendar,
  BadgeCheck, Info
} from 'lucide-react';
import * as LoanService from '../services/loan.service';
import * as AuthService from '../services/auth.service';
import { printLoanAgreement } from '../utils/print';

interface Props {
  loan: LoanService.Loan;
  memberName: string;
  onClose: () => void;
  onUpdated: () => void;
}

const STAGE_ORDER = [
  'STAGE_1_MANAGER_APPROVAL',
  'STAGE_2_LOAN_COMMITTEE_APPROVAL',
  'STAGE_3_APPROVED',
];

// Which roles can advance each stage
const STAGE_ROLE_MAP: Record<string, string[]> = {
  STAGE_1_MANAGER_APPROVAL:        ['BRANCH_MANAGER'],
  STAGE_2_LOAN_COMMITTEE_APPROVAL: ['LOAN_COMMITTEE'],
  STAGE_3_APPROVED:                [],
};

export default function LoanDetailModal({ loan, memberName, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<'overview' | 'schedule' | 'payments' | 'history'>('overview');
  const [history, setHistory] = useState<LoanService.LoanApprovalAction[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Repayment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'SAVINGS_TRANSFER'>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  const [repayments, setRepayments] = useState<any[]>([]);
  const [loadingRepayments, setLoadingRepayments] = useState(false);

  const user = AuthService.getCurrentUser();
  const userRole = user?.role || '';
  const currentStageInfo = LoanService.STAGE_LABELS[loan.currentStage] || { label: loan.currentStage, labelSi: '', role: '', color: 'bg-slate-100 text-slate-700' };
  const currentIdx = STAGE_ORDER.indexOf(loan.currentStage);
  const canAdvance = STAGE_ROLE_MAP[loan.currentStage]?.includes(userRole) && loan.status === 'PENDING';
  const canReject = canAdvance;

  // --- Dynamic Calculations for Payments Tab ---
  const monthlyPrincipal = Number(loan.requestedAmount) / Number(loan.termMonths);
  const totalPrincipalPaid = repayments.reduce((sum, r) => sum + Number(r.principalPortion || 0), 0);
  const outstandingPrincipal = Number(loan.requestedAmount) - totalPrincipalPaid;
  const totalEstimatedInterest = (Number(loan.requestedAmount) * Number(loan.interestRate) * (Number(loan.termMonths) + 1)) / (2 * 12 * 100);

  // Auto-calculate suggested amount when payment date changes
  useEffect(() => {
    if (showPaymentModal) {
      const lastDate = repayments.length > 0 ? new Date(repayments[0].paymentDate) : new Date(loan.disbursementDate || loan.appliedDate || new Date());
      const payDateObj = new Date(paymentDate || new Date());
      let daysElapsed = Math.floor((payDateObj.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (daysElapsed < 0) daysElapsed = 0;
      
      const calculatedInterest = outstandingPrincipal * daysElapsed * (Number(loan.interestRate) / 36500);
      const monthsPassed = Math.max(1, Math.round(daysElapsed / 30));
      const calculatedPrincipal = monthlyPrincipal * monthsPassed;
      const suggestedAmount = calculatedInterest + calculatedPrincipal;
      
      setPaymentAmount(Math.round(suggestedAmount).toString());
    }
  }, [paymentDate, showPaymentModal, repayments, outstandingPrincipal, loan.interestRate, monthlyPrincipal, loan.disbursementDate, loan.appliedDate]);

  useEffect(() => {
    if (tab === 'history') {
      setLoadingHistory(true);
      LoanService.getLoanApprovalHistory(loan.loanId)
        .then(setHistory)
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
    if (tab === 'payments') {
      setLoadingRepayments(true);
      LoanService.getRepayments(loan.loanId)
        .then(setRepayments)
        .catch(() => {})
        .finally(() => setLoadingRepayments(false));
    }
    if (tab === 'schedule') {
      loadSchedule();
    }
  }, [tab]);

  const loadSchedule = () => {
    setLoadingSchedule(true);
    if (loan.status === 'ACTIVE' || loan.status === 'COMPLETED') {
      LoanService.getSavedSchedule(loan.loanId)
        .then(setSchedule)
        .catch(() => {})
        .finally(() => setLoadingSchedule(false));
    } else {
      LoanService.getRepaymentSchedule(
        loan.requestedAmount,
        loan.termMonths || 36,
        loan.interestRate || 14,
        loan.appliedDate
      )
        .then(setSchedule)
        .catch(() => {})
        .finally(() => setLoadingSchedule(false));
    }
  };

  const handleRepay = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      alert("Invalid payment amount");
      return;
    }
    setPaymentLoading(true);
    try {
      await LoanService.repayInstallment(
        loan.loanId,
        Number(paymentAmount),
        paymentMethod,
        paymentRef,
        user?.username || 'system',
        user?.branchId || 1,
        paymentDate
      );
      setShowPaymentModal(false);
      setPaymentAmount('');
      loadSchedule(); // Refresh schedule to show ticks
      if (tab === 'payments') {
        setLoadingRepayments(true);
        LoanService.getRepayments(loan.loanId)
          .then(setRepayments)
          .catch(() => {})
          .finally(() => setLoadingRepayments(false));
      }
      onUpdated();
    } catch (e: any) {
      alert(e.response?.data?.error || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAdvance = async () => {
    setActionLoading(true); setActionError('');
    try {
      await LoanService.advanceLoanStage(loan.loanId, user?.username || 'unknown', userRole, comments);
      onUpdated();
      onClose();
    } catch (e: any) {
      setActionError(e.response?.data || 'Action failed');
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this loan application?')) return;
    setActionLoading(true); setActionError('');
    try {
      await LoanService.rejectLoan(loan.loanId, user?.username || 'unknown', userRole, comments);
      onUpdated();
      onClose();
    } catch (e: any) {
      setActionError(e.response?.data || 'Action failed');
    } finally { setActionLoading(false); }
  };

  const nextStage = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1
    ? LoanService.STAGE_LABELS[STAGE_ORDER[currentIdx + 1]]?.label
    : 'Final Stage';

  const ad = loan.applicationData || {};

  
  const translateRole = (role: string) => {
    if (!role) return 'පද්ධතිය (SYSTEM)';
    if (role === 'BRANCH_MANAGER') return 'ශාඛා කළමනාකරු';
    if (role === 'LOAN_COMMITTEE') return 'ණය කමිටුව';
    if (role === 'SENIOR_OFFICER') return 'ජ්‍යෙෂ්ඨ නිලධාරී';
    return role.replace(/_/g, ' ');
  };

  const translateAction = (act: string) => {
    if (act === 'APPROVED') return 'අනුමතයි';
    if (act === 'REJECTED') return 'ප්‍රතික්ෂේපිතයි';
    if (act === 'DISBURSED') return 'මුදා හැරියා';
    return act;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-6 text-white flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Loan Application</p>
            <h2 className="text-2xl font-black">{memberName}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-indigo-200 text-sm font-mono">
                Rs. {Number(loan.requestedAmount).toLocaleString()}
              </span>
              <span className="text-indigo-300">·</span>
              <span className="text-indigo-200 text-sm">{loan.loanType?.name}</span>
              <span className="text-indigo-300">·</span>
              <span className="text-indigo-200 text-sm">{loan.termMonths} months</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${
              loan.status === 'APPROVED' ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30' :
              loan.status === 'REJECTED' ? 'bg-red-400/20 text-red-100 border border-red-300/30' :
              'bg-amber-400/20 text-amber-100 border border-amber-300/30'
            }`}>{loan.status}</span>
            <button onClick={onClose} className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition">
              <X size={20} />
            </button>
          </div>
        </div>



        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white">
          {(['overview', 'schedule', 'payments', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3.5 text-sm font-bold capitalize transition border-b-2 ${
                tab === t ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t === 'overview' ? '📋 දළ විශ්ලේෂණය (Overview)' : t === 'schedule' ? '📅 ණය සැලසුම (Schedule)' : t === 'payments' ? '💵 වාරික ගෙවීම් (Payments)' : '📜 අනුමත ඉතිහාසය (History)'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`rounded-2xl p-4 flex items-center gap-4 ${
                loan.status === 'REJECTED' ? 'bg-red-50 border border-red-200' :
                loan.status === 'APPROVED' ? 'bg-emerald-50 border border-emerald-200' :
                'bg-indigo-50 border border-indigo-200'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  loan.status === 'REJECTED' ? 'bg-red-100' :
                  loan.status === 'APPROVED' ? 'bg-emerald-100' : 'bg-indigo-100'
                }`}>
                  {loan.status === 'REJECTED' ? <XCircle size={22} className="text-red-600" /> :
                   loan.status === 'APPROVED' ? <BadgeCheck size={22} className="text-emerald-600" /> :
                   <Clock size={22} className="text-indigo-600" />}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Current Stage: {currentStageInfo.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{currentStageInfo.labelSi}</p>
                </div>
                {loan.status === 'PENDING' && nextStage && (
                  <div className="ml-auto text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Stage</p>
                    <p className="text-xs font-semibold text-slate-600">{nextStage}</p>
                  </div>
                )}
              </div>

              {/* Loan Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Requested Amount', value: `Rs. ${Number(loan.requestedAmount).toLocaleString()}`, icon: '💰' },
                  { label: 'Term', value: `${loan.termMonths} months`, icon: '📅' },
                  { label: 'Interest Rate', value: `${loan.interestRate}% p.a.`, icon: '📈' },
                  { label: 'Loan Type', value: loan.loanType?.name || '—', icon: '🏷️' },
                  { label: 'Applied Date', value: loan.appliedDate || '—', icon: '📋' },
                  { label: 'Branch ID', value: `Branch ${loan.branchId}`, icon: '🏦' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="font-black text-slate-800 text-base">{item.icon} {item.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick EMI calc */}
              {loan.termMonths && loan.interestRate && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <Calculator size={16} className="text-indigo-600" /> Quick EMI Estimate
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {(() => {
                      const p = Number(loan.requestedAmount);
                      const m = loan.termMonths || 36;
                      const r = Number(loan.interestRate);
                      const monthlyPrincipal = p / m;
                      const monthlyInterest = (p * r * 30) / 36500;
                      return [
                        { label: 'Monthly Principal', value: `Rs. ${monthlyPrincipal.toLocaleString('en', { maximumFractionDigits: 0 })}` },
                        { label: '+ Monthly Interest (est.)', value: `Rs. ${monthlyInterest.toLocaleString('en', { maximumFractionDigits: 0 })}` },
                        { label: '= Total EMI', value: `Rs. ${(monthlyPrincipal + monthlyInterest).toLocaleString('en', { maximumFractionDigits: 0 })}`, highlight: true },
                      ];
                    })().map(item => (
                      <div key={item.label} className={`rounded-xl p-3 ${(item as any).highlight ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-100'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${(item as any).highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{item.label}</p>
                        <p className={`font-black text-sm ${(item as any).highlight ? 'text-white' : 'text-slate-800'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-400 mt-3">Formula: Interest = (Principal × Days × Rate%) ÷ 36,500</p>
                </div>
              )}

              {/* Application Data (Sinhala + Sections) */}
              {loan.applicationData && Object.keys(loan.applicationData).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h4 className="font-bold text-indigo-900 text-base flex items-center gap-2">
                      <FileText size={18} className="text-indigo-600" /> අයදුම්පත් දත්ත (Application Form Data)
                    </h4>
                  </div>
                  <div className="p-6 space-y-8">
                    {(() => {
                      const data = loan.applicationData as Record<string, any>;
                      
                      const FIELD_LABELS_SI: Record<string, string> = {
                        applicantName: 'අයදුම්කරුගේ නම (Applicant Name)',
                        memberNo: 'සාමාජික අංකය (Member No)',
                        nic: 'ජාතික හැඳුනුම්පත් අංකය (NIC)',
                        dob: 'උපන් දිනය (DOB)',
                        gender: 'ස්ත්‍රී / පුරුෂ භාවය (Gender)',
                        civilStatus: 'සිවිල් තත්ත්වය (Civil Status)',
                        phone: 'දුරකථන අංකය (Phone)',
                        addressLine1: 'ලිපිනය - පේළිය 1 (Address Line 1)',
                        addressLine2: 'ලිපිනය - පේළිය 2 (Address Line 2)',
                        residencePeriod: 'පදිංචි කාලය (Residence Period)',
                        primaryJob: 'ප්‍රධාන රැකියාව (Primary Job)',
                        employerDetails: 'සේවායෝජක විස්තර (Employer Details)',
                        annualExpense: 'වාර්ෂික වියදම (Annual Expense)',
                        dependentsCount: 'යැපෙන්නන් ගණන (Dependents)',
                        spouseJobTitle: 'කලත්‍රයාගේ රැකියාව (Spouse Job)',
                        loanPurpose: 'ණයෙහි අරමුණ (Loan Purpose)',
                        branch: 'ශාඛාව (Branch)',
                        sharesObtained: 'ලබාගත් කොටස් ගණන (Shares Obtained)'
                      };

                      const SECTIONS = [
                        {
                          title: 'සාමාජික විස්තර (Personal Details)',
                          icon: <User size={18} className="text-indigo-500" />,
                          keys: ['applicantName', 'memberNo', 'nic', 'dob', 'gender', 'civilStatus']
                        },
                        {
                          title: 'සම්බන්ධතා සහ පදිංචිය (Contact & Residence)',
                          icon: <FileText size={18} className="text-indigo-500" />,
                          keys: ['phone', 'addressLine1', 'addressLine2', 'residencePeriod']
                        },
                        {
                          title: 'රැකියාව සහ ආදායම් (Employment & Income)',
                          icon: <TrendingDown size={18} className="text-indigo-500" />,
                          keys: ['primaryJob', 'employerDetails', 'annualExpense', 'dependentsCount', 'spouseJobTitle']
                        },
                        {
                          title: 'ණය විස්තර (Loan Details)',
                          icon: <FileText size={18} className="text-indigo-500" />,
                          keys: ['loanPurpose', 'branch', 'sharesObtained']
                        }
                      ];

                      const processedKeys = new Set<string>();
                      const elements: React.ReactNode[] = [];

                      SECTIONS.forEach((section, idx) => {
                        const activeKeys = section.keys.filter(k => data[k] !== undefined && data[k] !== null && data[k] !== '');
                        if (activeKeys.length === 0) return;

                        activeKeys.forEach(k => processedKeys.add(k));

                        elements.push(
                          <div key={section.title} className={idx !== 0 ? 'pt-6 border-t border-slate-100' : ''}>
                            <h5 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                              {section.icon} {section.title}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                              {activeKeys.map(k => (
                                <div key={k} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-sm font-semibold text-slate-500 mb-1">{FIELD_LABELS_SI[k] || k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-base font-bold text-slate-900 break-words">{String(data[k]) || '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });

                      const otherKeys = Object.keys(data).filter(k => !processedKeys.has(k) && typeof data[k] !== 'object' && data[k] !== null && data[k] !== '');
                      if (otherKeys.length > 0) {
                        elements.push(
                          <div key="other" className="pt-6 border-t border-slate-100">
                            <h5 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                              <Info size={18} className="text-indigo-500" /> වෙනත් විස්තර (Other Details)
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                              {otherKeys.map(k => (
                                <div key={k} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-sm font-semibold text-slate-500 mb-1">{FIELD_LABELS_SI[k] || k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-base font-bold text-slate-900 break-words">{String(data[k]) || '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return elements;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EMI Schedule Tab ── */}
          {tab === 'schedule' && (
            <div>
              {loadingSchedule ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3 text-sm text-slate-500 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <Info size={16} className="text-indigo-600 shrink-0" />
                    රු. {Number(loan.requestedAmount).toLocaleString()} ක මුදලක් සඳහා මාස {loan.termMonths} ක කාලයකට අදාළ වන {loan.interestRate}% ක වාර්ෂික පොලී අනුපාතය යටතේ සකසන ලද ණය ආපසු ගෙවීමේ සැලසුම.
                  </div>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-indigo-50 border-b border-indigo-100">
                        <tr>
                          {['#', 'ගෙවිය යුතු දිනය', 'මූලික මුදල', 'පොලිය', 'වාරිකය', 'ඉතිරි ශේෂය'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-indigo-900 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {schedule.map((row: any) => {
                           const expectedAmount = row.totalExpectedAmount || row.emi;
                           const principal = row.expectedPrincipal || row.principalPortion;
                           const interest = row.expectedInterest || row.interestPortion;
                           return (
                          <tr key={row.installmentNumber || row.installmentNo} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 font-bold text-slate-500 text-center w-10">{row.installmentNumber || row.installmentNo}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.dueDate}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">රු. {Number(principal).toLocaleString()}</td>
                            <td className="px-4 py-3 text-rose-600 font-semibold">රු. {Number(interest).toLocaleString()}</td>
                            <td className="px-4 py-3 font-black text-indigo-700">රු. {Number(expectedAmount).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">රු. {Number(row.outstandingBalance || 0).toLocaleString()}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Payments Tab ── */}
          {tab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 mb-1">ණය වාරික ගෙවීම් (Installment Payments)</h3>
                  <p className="text-xs text-indigo-600">
                    හීන වන ශේෂ ක්‍රමය යටතේ ගෙවීම් කර ඇති ආකාරය සහ ණය ශේෂය මෙහි දැක්වේ.
                  </p>
                </div>
              </div>

              {/* Top Section Summary */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">ණය මුදල</p>
                  <p className="text-lg font-black text-indigo-900">රු. {Number(loan.requestedAmount).toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">වාර්ෂික පොලිය</p>
                  <p className="text-lg font-black text-indigo-900">{loan.interestRate}%</p>
                </div>
              </div>

              <div className="flex justify-end">
                {(userRole === 'SENIOR_OFFICER' || userRole === 'CASHIER' || userRole === 'BRANCH_MANAGER') && (
                  <button 
                    onClick={() => {
                      setPaymentAmount('');
                      setPaymentDate(new Date().toISOString().split('T')[0]);
                      setShowPaymentModal(true);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition flex items-center gap-2">
                    වාරිකයක් ගෙවන්න
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">දිනය</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">ගෙවූ මූලික මුදල</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">ගෙවූ පොලිය</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">මුළු ගෙවූ මුදල</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loadingRepayments ? (
                      <tr><td colSpan={4} className="p-8 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                    ) : repayments.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">ගෙවීම් කිසිවක් තවම සිදුකර නොමැත</td></tr>
                    ) : (
                      repayments.map((r: any) => (
                        <tr key={r.repaymentId || r.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{new Date(r.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">රු. {Number(r.principalPortion).toLocaleString()}</td>
                          <td className="px-4 py-3 text-rose-600 font-semibold">රු. {Number(r.interestPortion).toLocaleString()}</td>
                          <td className="px-4 py-3 font-black text-emerald-700 text-right">රු. {Number(r.totalPaid).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Remaining Balance Summary */}
              {!loadingRepayments && (
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 mb-1">ඉතිරි ගෙවිය යුතු මූලික මුදල (Outstanding Balance)</h3>
                    <p className="text-xs text-rose-600">මීළඟ පොලී ගණනය කිරීම් සිදුවන්නේ මෙම ඉතිරි මුදල මතයි.</p>
                  </div>
                  <div className="text-2xl font-black text-rose-700">
                    රු. {Math.round(outstandingPrincipal).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <div>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Clock size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No approval actions yet.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {history.map((action, idx) => (
                      <div key={action.actionId} className="flex gap-5 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          action.action === 'APPROVED' ? 'bg-emerald-500 text-white' :
                          action.action === 'REJECTED' ? 'bg-red-500 text-white' :
                          'bg-slate-400 text-white'
                        }`}>
                          {action.action === 'APPROVED' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </div>
                        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{LoanService.STAGE_LABELS[action.stage]?.labelSi || (action.stage === 'DISBURSED' ? 'මුදා හැර ඇත (Disbursed)' : action.stage)}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {action.actorUsername} • {translateRole(action.actorRole)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                                  action.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>{translateAction(action.action)}</span>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(action.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                            {action.comments && (
                              <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 italic">"{action.comments
                                .replace('Approved/Recommended by BRANCH_MANAGER', 'ශාඛා කළමනාකරු විසින් අනුමත/නිර්දේශ කරන ලදී')
                                .replace('Approved/Recommended by LOAN_COMMITTEE', 'Loan Committee විසින් අනුමත/නිර්දේශ කරන ලදී')
                                .replace('Rejected by BRANCH_MANAGER', 'ශාඛා කළමනාකරු විසින් ප්‍රතික්ෂේප කරන ලදී')
                                .replace(/Loan disbursed \(CASH\)\. Account No:/, 'ණය මුදල මුදා හැරියා (මුදලින්). ගිණුම් අංකය:')
                                .replace(/Loan disbursed\. Account No:/, 'ණය මුදල මුදා හැරියා. ගිණුම් අංකය:')}"</p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {((canAdvance || canReject) && loan.status === 'PENDING') ? (
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
            {actionError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                <AlertTriangle size={16} /> {actionError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Comments / Notes (optional)
              </label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Add remarks for this decision..."
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              {canReject && (
                <button onClick={handleReject} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60">
                  <XCircle size={16} /> Reject
                </button>
              )}
              {canAdvance && currentIdx < STAGE_ORDER.length - 1 && (
                <button onClick={handleAdvance} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60 shadow-md shadow-indigo-300">
                  <ChevronRight size={16} />
                  {actionLoading ? 'Processing...' : `Advance → ${nextStage}`}
                </button>
              )}
            </div>
          </div>
        ) : (loan.status === 'APPROVED' || loan.currentStage === 'STAGE_3_APPROVED') ? (
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
            <button onClick={() => printLoanAgreement(loan, ad)}
              className="px-5 py-2.5 rounded-xl border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-sm shadow-sm transition flex items-center gap-2">
              <FileText size={16} /> 🖨 ගිවිසුම මුද්‍රණය (Print Agreement)
            </button>
          </div>
        ) : null}
      </div>

      {/* Payment Overlay Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <h4 className="font-bold text-white flex items-center gap-2 text-lg">
                <BadgeCheck size={20} className="text-indigo-200" /> වාරිකයක් ගෙවන්න
              </h4>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {(() => {
                const lastDate = repayments.length > 0 ? new Date(repayments[0].paymentDate) : new Date(loan.disbursementDate || loan.appliedDate || new Date());
                const payDateObj = new Date(paymentDate || new Date());
                let daysElapsed = Math.floor((payDateObj.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
                if (daysElapsed < 0) daysElapsed = 0;
                const calculatedInterest = outstandingPrincipal * daysElapsed * (Number(loan.interestRate) / 36500);

                return (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 text-center flex flex-col items-center">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">ගෙවුණු දින ගණන: {daysElapsed} දින</div>
                    <div className="text-xs font-semibold text-indigo-600/70 mt-1">
                      ගණනය කළ පොලිය: රු. {Math.round(calculatedInterest).toLocaleString()}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Payment Date (දිනය)</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 transition outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Amount to Pay (Rs.)</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} 
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 transition outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Reference Note</label>
                  <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} 
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm transition outline-none" placeholder="e.g. Receipt #123 or Transfer ID" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button onClick={handleRepay} disabled={paymentLoading} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2">
                {paymentLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Processing...</>
                ) : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
