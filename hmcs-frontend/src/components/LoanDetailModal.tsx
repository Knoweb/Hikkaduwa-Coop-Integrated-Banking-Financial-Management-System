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
  const [tab, setTab] = useState<'overview' | 'schedule' | 'history'>('overview');
  const [history, setHistory] = useState<LoanService.LoanApprovalAction[]>([]);
  const [schedule, setSchedule] = useState<LoanService.EmiScheduleRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const user = AuthService.getCurrentUser();
  const userRole = user?.role || '';
  const currentStageInfo = LoanService.STAGE_LABELS[loan.currentStage] || { label: loan.currentStage, labelSi: '', role: '', color: 'bg-slate-100 text-slate-700' };
  const currentIdx = STAGE_ORDER.indexOf(loan.currentStage);
  const canAdvance = STAGE_ROLE_MAP[loan.currentStage]?.includes(userRole) && loan.status === 'PENDING';
  const canReject = canAdvance;

  useEffect(() => {
    if (tab === 'history') {
      setLoadingHistory(true);
      LoanService.getLoanApprovalHistory(loan.loanId)
        .then(setHistory)
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
    if (tab === 'schedule') {
      setLoadingSchedule(true);
      LoanService.getRepaymentSchedule(
        loan.requestedAmount,
        loan.termMonths || 36,
        loan.interestRate || 14
      )
        .then(setSchedule)
        .catch(() => {})
        .finally(() => setLoadingSchedule(false));
    }
  }, [tab]);

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
          {(['overview', 'schedule', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3.5 text-sm font-bold capitalize transition border-b-2 ${
                tab === t ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t === 'overview' ? '📋 Overview' : t === 'schedule' ? '📅 EMI Schedule' : '📜 Approval History'}
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
                      const elements: JSX.Element[] = [];

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
                    Repayment schedule for Rs. {Number(loan.requestedAmount).toLocaleString()} over {loan.termMonths} months at {loan.interestRate}% p.a.
                  </div>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-indigo-50 border-b border-indigo-100">
                        <tr>
                          {['#', 'Due Date', 'Principal', 'Interest', 'EMI', 'Balance'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-indigo-900 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {schedule.map(row => (
                          <tr key={row.installmentNo} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 font-bold text-slate-500 text-center w-10">{row.installmentNo}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.dueDate}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">Rs. {Number(row.principalPortion).toLocaleString()}</td>
                            <td className="px-4 py-3 text-rose-600 font-semibold">Rs. {Number(row.interestPortion).toLocaleString()}</td>
                            <td className="px-4 py-3 font-black text-indigo-700">Rs. {Number(row.emi).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">Rs. {Number(row.outstandingBalance).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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
                              <p className="font-bold text-slate-800 text-sm">{LoanService.STAGE_LABELS[action.stage]?.label || action.stage}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {action.actorUsername} · {action.actorRole.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                                action.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>{action.action}</span>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(action.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {action.comments && (
                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 italic">"{action.comments}"</p>
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
    </div>
  );
}
