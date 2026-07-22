import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, XCircle, ChevronRight, Clock, User,
  FileText, Calculator, AlertTriangle, TrendingDown, Calendar,
  BadgeCheck, Info, Printer
} from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import * as LoanService from '../services/loan.service';
import * as AuthService from '../services/auth.service';
import * as BranchService from '../services/branch.service';
import { printLoanAgreement, printDisbursementReceipt } from '../utils/print';
import { getBranchName } from '../pages/BranchDashboard';
import ConfirmDialog from './ConfirmDialog';
import { useLanguage } from '../context/LanguageContext';
import { PrintableNoticeLetter } from './PrintableNoticeLetter';


interface Props {
  loan: LoanService.Loan;
  memberName: string;
  onClose: () => void;
  onUpdated: () => void;
  defaultOpenNotice?: boolean;
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

export default function LoanDetailModal({ loan, memberName, onClose, onUpdated, defaultOpenNotice = false }: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'overview' | 'schedule' | 'payments' | 'history'>('overview');
  const [history, setHistory] = useState<LoanService.LoanApprovalAction[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' });
  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => setSnackbar({ open: true, message, severity });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [branchName, setBranchName] = useState<string>(`Branch ID: ${loan.branchId}`);

  // Notice Letter Print State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeType, setNoticeType] = useState<1 | 2 | 3 | 4 | 5>(1);
  const noticePrintRef = React.useRef<HTMLDivElement>(null);

  // Auto calculate recommended notice stage (every 2 weeks / 14 days overdue)
  const calcRecommendedNotice = () => {
    const overdueDays = (loan as any).overdueDays || 
      (loan.updatedAt ? Math.floor((new Date().getTime() - new Date(loan.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0);
    
    if (overdueDays >= 57) return 5; // Week 8+ (Red Notice)
    if (overdueDays >= 43) return 4; // Week 7-8 (Registered Mail)
    if (overdueDays >= 29) return 3; // Week 5-6 (Guarantors Notice)
    if (overdueDays >= 15) return 2; // Week 3-4 (2nd Notice)
    return 1; // Week 1-2 (1st Notice)
  };

  const handleOpenNoticeModal = () => {
    const rec = calcRecommendedNotice();
    setNoticeType(rec);
    setShowNoticeModal(true);
  };

  const handlePrintNotice = () => {
    const element = noticePrintRef.current;
    if (!element) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Notice Letter - Loan ${loan.loanId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Repayment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'SAVINGS_TRANSFER'>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

  const [repayments, setRepayments] = useState<any[]>([]);
  const [loadingRepayments, setLoadingRepayments] = useState(false);

  // Disbursement State
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disbursePaymentMethod, setDisbursePaymentMethod] = useState<'CASH' | 'SAVINGS_TRANSFER'>('CASH');
  const [disburseLoanAccountNumber, setDisburseLoanAccountNumber] = useState('');
  const [disburseSelectedSavingsAcc, setDisburseSelectedSavingsAcc] = useState('');
  const [disburseMemberAccounts, setDisburseMemberAccounts] = useState<any[]>([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);

  useEffect(() => {
    if (showDisburseModal && disbursePaymentMethod === 'SAVINGS_TRANSFER' && disburseMemberAccounts.length === 0) {
      setFetchingAccounts(true);
      LoanService.getMemberSavingsAccounts(loan.memberId)
        .then(accs => {
          setDisburseMemberAccounts(accs);
          if (accs.length > 0) setDisburseSelectedSavingsAcc(accs[0].accountNumber);
        })
        .catch(() => {})
        .finally(() => setFetchingAccounts(false));
    }
  }, [showDisburseModal, disbursePaymentMethod, loan.memberId, disburseMemberAccounts.length]);

  const handleDisburse = async () => {
    if (disbursePaymentMethod === 'SAVINGS_TRANSFER' && !disburseSelectedSavingsAcc) {
      showMessage('කරුණාකර ඉතුරුම් ගිණුමක් තෝරන්න. (Please select a savings account.)', 'error');
      return;
    }
    if (!disburseLoanAccountNumber.trim()) {
      showMessage('කරුණාකර ණය ගිණුම් අංකය ඇතුළත් කරන්න. (Please enter the loan account number.)', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'ණය නිකුත් කිරීම',
      message: `ණය මුදල ${disbursePaymentMethod === 'CASH' ? 'අතින් (Cash)' : 'ඉතුරුම් ගිණුමට'} නිකුත් කරන්නද?`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
        setActionLoading(true);
        try {
          const disbursed = await LoanService.disburseLoan(
            loan.loanId,
            loan.requestedAmount,
            user?.username || '',
            disbursePaymentMethod,
            disburseSelectedSavingsAcc,
            disburseLoanAccountNumber
          );
          showMessage('ණය සාර්ථකව මුදා හරින ලදී!', 'success');
          setShowDisburseModal(false);
          const ad = typeof loan.applicationData === 'string' ? JSON.parse(loan.applicationData) : (loan.applicationData || {});
          // printDisbursementReceipt(disbursed, ad, user?.username || 'system'); // Disabled auto-print
          onUpdated();
        } catch (e: any) {
          showMessage('ණය මුදා හැරීම අසාර්ථකයි.', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const user = AuthService.getCurrentUser();
  const userRole = user?.role || '';
  const currentStageInfo = (() => {
    const defaultInfo = LoanService.STAGE_LABELS[loan.currentStage] || { label: loan.currentStage, labelSi: '', role: '', color: 'bg-slate-100 text-slate-700' };
    if (loan.currentStage === 'STAGE_3_APPROVED') {
      const typeStr = (loan.loanType?.name || (loan as any).loanTypeStr || '').toLowerCase();
      const requiresCommittee = typeStr.includes('සේවක') || typeStr.includes('කෙටි');
      if (!requiresCommittee) {
        return { ...defaultInfo, label: 'Final Approval Granted', labelSi: 'අවසාන අනුමැතිය ලබා දෙන ලදී' };
      }
    }
    return defaultInfo;
  })();
  const currentIdx = STAGE_ORDER.indexOf(loan.currentStage);
  const canAdvance = STAGE_ROLE_MAP[loan.currentStage]?.includes(userRole) && loan.status === 'PENDING';
  const canReject = canAdvance;

  // --- Dynamic Calculations for Payments Tab ---
  const monthlyPrincipal = Number(loan.requestedAmount) / Number(loan.termMonths);
  const totalPrincipalPaid = repayments.reduce((sum, r) => sum + Number(r.principalPortion || 0), 0);
  const outstandingPrincipal = Number(loan.requestedAmount) - totalPrincipalPaid;
  const totalEstimatedInterest = (Number(loan.requestedAmount) * Number(loan.interestRate) * (Number(loan.termMonths) + 1)) / (2 * 12 * 100);

  const getDaysBetween = (d1: string | Date, d2: string | Date) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    const diffTime = date2.getTime() - date1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const enrichRepayments = (rawRepayments: any[]) => {
    if (!rawRepayments || rawRepayments.length === 0) return [];
    const sorted = [...rawRepayments].sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    
    let currentOutstanding = Number(loan.requestedAmount);
    let lastDate = loan.disbursementDate || loan.appliedDate || new Date();
    
    const enriched = sorted.map(r => {
      const days = getDaysBetween(lastDate, r.paymentDate);
      const outstandingBefore = currentOutstanding;
      const rate = Number(loan.interestRate);
      
      const formula = `රු. ${Math.round(outstandingBefore).toLocaleString()} × දින ${days} × (${rate}% / 36500)`;
      
      currentOutstanding = currentOutstanding - Number(r.principalPortion || 0);
      if (currentOutstanding < 0) currentOutstanding = 0;
      
      lastDate = r.paymentDate;
      
      return {
        ...r,
        daysElapsed: days,
        outstandingBefore,
        outstandingAfter: currentOutstanding,
        calcFormula: formula
      };
    });
    
    return enriched.reverse();
  };

  useEffect(() => {
    BranchService.getBranches().then(branches => {
      const b = branches.find((branch: any) => branch.branchId === loan.branchId);
      if (b) setBranchName(b.branchName);
    }).catch(() => {});
  }, [loan.branchId]);

  const modalLastDate = repayments.length > 0 ? new Date(repayments[0].paymentDate) : new Date(loan.disbursementDate || loan.appliedDate || new Date());
  const modalPayDateObj = new Date(paymentDate || new Date());
  const modalDaysElapsed = Math.max(0, Math.floor((modalPayDateObj.getTime() - modalLastDate.getTime()) / (1000 * 3600 * 24)));
  const modalCalculatedInterest = outstandingPrincipal * modalDaysElapsed * (Number(loan.interestRate) / 36500);

  const payAmtNum = Number(paymentAmount) || 0;
  const liveInterestPortion = Math.min(payAmtNum, modalCalculatedInterest);
  const livePrincipalPortion = Math.max(0, payAmtNum - modalCalculatedInterest);
  const liveOutstandingAfter = Math.max(0, outstandingPrincipal - livePrincipalPortion);

  // Auto-open notice letter modal when viewing an OVERDUE loan and defaultOpenNotice is true
  useEffect(() => {
    if (loan.status === 'OVERDUE' && defaultOpenNotice) {
      handleOpenNoticeModal();
    }
  }, [loan.status, loan.loanId, defaultOpenNotice]);

  // Auto-calculate suggested amount when payment date changes
  useEffect(() => {
    if (showPaymentModal) {
      const monthsPassed = Math.max(1, Math.round(modalDaysElapsed / 30));
      const calculatedPrincipal = monthlyPrincipal * monthsPassed;
      const suggestedAmount = modalCalculatedInterest + calculatedPrincipal;
      setPaymentAmount(Math.round(suggestedAmount).toString());
    }
  }, [paymentDate, showPaymentModal]);

  useEffect(() => {
    if (tab === 'history') {
      setLoadingHistory(true);
      LoanService.getLoanApprovalHistory(loan.loanId)
        .then(data => {
          const ad = typeof loan.applicationData === 'string' ? JSON.parse(loan.applicationData || '{}') : (loan.applicationData || {});
          const applicantName = ad.applicantName || ad.name || memberName || 'අයදුම්කරු (Applicant)';
          const appliedAction: LoanService.LoanApprovalAction = {
            actionId: 'initial-application',
            loanId: loan.loanId,
            stage: 'APPLICATION',
            action: 'APPLIED',
            actorUsername: applicantName,
            actorRole: 'MEMBER',
            comments: 'ණය ඉල්ලුම් පත සාර්ථකව පද්ධතියට ඇතුළත් කරන ලදී. ශාඛා කළමනාකරුගේ අනුමැතිය අපේක්ෂාවෙන් පවතී. (Loan application successfully submitted. Pending Branch Manager approval.)',
            createdAt: loan.appliedDate ? new Date(loan.appliedDate).toISOString() : new Date().toISOString()
          };
          setHistory([appliedAction, ...data]);
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
    if (tab === 'payments') {
      setLoadingRepayments(true);
      LoanService.getRepayments(loan.loanId)
        .then(data => setRepayments(enrichRepayments(data)))
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
      showMessage('කරුණාකර නිවැරදි මුදලක් ඇතුළත් කරන්න. (Invalid payment amount)', 'warning');
      return;
    }
    // Show confirmation first
    setConfirmDialog({
      isOpen: true,
      title: 'වාරිකය ගෙවීම තහවුරු කරන්න',
      message: `රු. ${Number(paymentAmount).toLocaleString()} ක් ${paymentDate} දිනට ගෙවීමට අවශ්‍ය බව විශ්වාසද? (Are you sure you want to pay Rs. ${Number(paymentAmount).toLocaleString()} on ${paymentDate}?)`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
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
          setPaymentRef('');
          loadSchedule();
          // Always refresh repayments and switch to payments tab
          setLoadingRepayments(true);
          LoanService.getRepayments(loan.loanId)
            .then(data => {
              setRepayments(enrichRepayments(data));
              setTab('payments'); // 👈 Auto-switch to payments tab
            })
            .catch(() => {})
            .finally(() => setLoadingRepayments(false));
          showMessage(`රු. ${Number(paymentAmount).toLocaleString()} ක් සාර්ථකව ගෙවා ඇත! ✅`, 'success');
          onUpdated();
        } catch (e: any) {
          showMessage(e.response?.data?.error || 'ගෙවීම අසාර්ථකයි. (Payment failed)', 'error');
        } finally {
          setPaymentLoading(false);
        }
      }
    });
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
    setConfirmDialog({
      isOpen: true,
      title: 'ණය අදර ප්‍රත්‍යාගය ප්‍රතික්ෂේප කරන්නද?',
      message: 'මෙම ණය අදරප්‍රත්‍යාගය ප්‍රතික්ෂේප කරන්නද? මෙය ආපසු හැරවිය නොහැක.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
        setActionLoading(true); setActionError('');
        try {
          await LoanService.rejectLoan(loan.loanId, user?.username || 'unknown', userRole, comments);
          onUpdated();
          onClose();
        } catch (e: any) {
          setActionError(e.response?.data || 'Action failed');
        } finally { setActionLoading(false); }
      }
    });
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
    if (act === 'APPLIED') return 'ඉල්ලුම් කළා';
    return act;
  };

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-6 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                Loan Application
              </p>
              {(loan as any).applicationNumber && (
                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-md text-xs font-mono font-bold tracking-wider border border-white/30 shadow-sm">
                  {(loan as any).applicationNumber}
                </span>
              )}
            </div>
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
            {loan.status === 'OVERDUE' && (
              <button
                onClick={handleOpenNoticeModal}
                className="text-xs px-3.5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-white/40"
              >
                <Printer size={15} /> 📄 දැනුම්දීම් ලිපිය (Notice)
              </button>
            )}
            {loan.status === 'OVERDUE' ? (
              <button 
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    loan.status = 'ACTIVE';
                    (loan as any).isOverdue = false;
                    await LoanService.updateLoanStatus(loan.loanId, 'ACTIVE').catch(() => {});
                    showMessage('ණය තත්ත්වය සක්‍රීය (ACTIVE) ලෙස යාවත්කාලීන විය!', 'success');
                    onUpdated();
                  } catch(e) {
                    showMessage('තත්ත්වය වෙනස් කිරීම අසාර්ථකයි', 'error');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="text-xs px-4 py-2 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-2 border-white/90 shadow-[0_0_15px_rgba(16,185,129,0.6)] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                ✓ සක්‍රීය ණයක් කරන්න
              </button>
            ) : (loan.status === 'ACTIVE' || loan.currentStage === 'DISBURSED') ? (
              <button 
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    loan.status = 'OVERDUE';
                    (loan as any).isOverdue = true;
                    await LoanService.updateLoanStatus(loan.loanId, 'OVERDUE').catch(() => {});
                    showMessage('ණය තත්ත්වය කල්පසු වූ ණයක් (OVERDUE) ලෙස සලකුණු කරන ලදී!', 'warning');
                    onUpdated();
                  } catch(e) {
                    showMessage('තත්ත්වය වෙනස් කිරීම අසාර්ථකයි', 'error');
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="text-xs px-4 py-2 rounded-xl font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-2 border-white/90 shadow-[0_0_18px_rgba(239,68,68,0.7)] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider animate-pulse"
              >
                🚨 කල්පසු ණයක් ලෙස සලකුණු කරන්න
              </button>
            ) : null}

            <span className={`text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${
              loan.status === 'APPROVED' ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30' :
              loan.status === 'REJECTED' ? 'bg-red-400/20 text-red-100 border border-red-300/30' :
              loan.status === 'OVERDUE' ? 'bg-rose-500/30 text-rose-100 border border-rose-400/40' :
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
                  { label: 'ඉල්ලුම් කළ මුදල', value: `රු. ${Number(loan.requestedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: '💰' },
                  { label: 'කාල සීමාව', value: `මාස ${loan.termMonths}`, icon: '📅' },
                  { label: 'පොලී අනුපාතය', value: `වාර්ෂිකව ${loan.interestRate}%`, icon: '📈' },
                  { label: 'ණය වර්ගය', value: loan.loanType?.name || '—', icon: '🏷️' },
                  { label: 'අයදුම් කළ දිනය', value: loan.appliedDate || '—', icon: '📋' },
                  { label: 'ශාඛාව', value: branchName, icon: '🏦' },
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
                    <Calculator size={16} className="text-indigo-600" /> {t(`මූලික වාරික ඇස්තමේන්තුව (Quick EMI Estimate)`)}</h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {(() => {
                      const p = Number(loan.requestedAmount);
                      const m = loan.termMonths || 36;
                      const r = Number(loan.interestRate);
                      const monthlyPrincipal = p / m;
                      const monthlyInterest = (p * r * 30) / 36500;
                      return [
                        { label: 'මාසික මූලික මුදල', value: `රු. ${monthlyPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { label: '+ මාසික පොලිය (ඇස්ත.)', value: `රු. ${monthlyInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                        { label: '= මාසික වාරිකය', value: `රු. ${(monthlyPrincipal + monthlyInterest).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
                      ];
                    })().map(item => (
                      <div key={item.label} className={`rounded-xl p-3 ${(item as any).highlight ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-100'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${(item as any).highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{item.label}</p>
                        <p className={`font-black text-sm ${(item as any).highlight ? 'text-white' : 'text-slate-800'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-400 mt-3">{t(`සූත්‍රය: පොලිය = (මූලික මුදල × දින ගණන × අනුපාතය%) ÷ 36,500`)}</p>
                </div>
              )}

              {/* Application Data (Sinhala + Sections) */}
              {loan.applicationData && Object.keys(loan.applicationData).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h4 className="font-bold text-indigo-900 text-base flex items-center gap-2">
                      <FileText size={18} className="text-indigo-600" /> {t(`අයදුම්පත් දත්ත (Application Form Data)`)}</h4>
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
                              <Info size={18} className="text-indigo-500" /> {t(`වෙනත් විස්තර (Other Details)`)}</h5>
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
                  <div className="mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <span>රු. {Number(loan.requestedAmount).toLocaleString()} ක මුදලක් සඳහා මාස {loan.termMonths} ක කාලයකට අදාළ වන {loan.interestRate}% ක වාර්ෂික පොලී අනුපාතය යටතේ සකසන ලද ණය ආපසු ගෙවීමේ සැලසුම.</span>
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 space-y-2">
                      <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">{t(`📐 ගණනය කිරීමේ ක්‍රමය (Calculation Method)`)}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="font-bold text-slate-600 mb-1">{t(`🔢 මාසික මූලික මුදල`)}</p>
                          <p className="text-slate-500 font-mono">{t(`= ණය මුදල ÷ මාස ගණන`)}</p>
                          <p className="text-indigo-700 font-black mt-1">= රු. {Number(loan.requestedAmount).toLocaleString()} ÷ {loan.termMonths}</p>
                          <p className="text-emerald-700 font-black">= රු. {(Number(loan.requestedAmount) / (loan.termMonths || 1)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="font-bold text-slate-600 mb-1">{t(`📈 1 වැනි මාසයේ පොලිය`)}</p>
                          <p className="text-slate-500 font-mono">{t(`= ශේෂය × (අනු. ÷ 36500) × 30`)}</p>
                          <p className="text-indigo-700 font-black mt-1">= රු. {Number(loan.requestedAmount).toLocaleString()} × ({loan.interestRate}÷36500) × 30</p>
                          <p className="text-rose-600 font-black">= රු. {(Number(loan.requestedAmount) * Number(loan.interestRate) * 30 / 36500).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div className="bg-indigo-600 rounded-lg p-3 text-white">
                          <p className="font-bold text-indigo-200 mb-1">{t(`💡 ගෙවීම් ක්‍රමය`)}</p>
                          <p className="text-xs text-indigo-200">{t(`හීන වන ශේෂ (Declining Balance)`)}</p>
                          <p className="text-xs text-indigo-200 mt-1">{t(`සෑම මාසයකම මූලික මුදල සමාන. ශේෂය අඩු වන විට පොලියද අඩු වේ.`)}</p>
                          <p className="text-xs text-indigo-200 font-mono mt-1">P × r × 30 ÷ 36500</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-indigo-50 border-b border-indigo-100">
                        <tr>
                          {['#', 'ගෙවිය යුතු දිනය', 'දිනගණන', 'මූලික මුදල', 'පොලිය', 'වාරිකය', 'ඉතිරි ශේෂය'].map(h => (
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
                             <td className="px-4 py-3 text-center"><span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{row.daysInPeriod || 30}d</span></td>
                            <td className="px-4 py-3 font-semibold text-slate-800">රු. {Number(principal).toLocaleString()}</td>
                            <td className="px-4 py-3 text-rose-600 font-semibold">රු. {Number(interest).toLocaleString()}</td>
                            <td className="px-4 py-3 font-black text-indigo-700">රු. {Number(expectedAmount).toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">රු. {Number(row.outstandingBalance || 0).toLocaleString()}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                  {/* Accuracy note */}
                  <div className="mt-3 flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <span className="text-emerald-500 font-black shrink-0 mt-0.5">✓</span>
                    <span>
                      <strong>{t(`නිවැරදි ගණනය:`)}</strong> {t(`ඉහත පොලිය ගණනය කිරීමේදී සෑම මාසයකටම`)}<strong>{t(`ඇත්ත දිනගණන`)}</strong> {t(`(පෙබරවාරි 28/29, දින 31 ක් ඇති මාස ආදිය) ගනිති. 
                      ගෙවිය යුතු දිනය නියමිත ලෙස ගෙව්වහොත් schedule table එකේ ඇති ප්‍රමාණයම ගෙවිය යුතුය.`)}</span>
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
                  <h3 className="text-sm font-bold text-indigo-900 mb-1">{t(`ණය වාරික ගෙවීම් (Installment Payments)`)}</h3>
                  <p className="text-xs text-indigo-600">
                    {t(`හීන වන ශේෂ ක්‍රමය යටතේ ගෙවීම් කර ඇති ආකාරය සහ ණය ශේෂය මෙහි දැක්වේ.`)}</p>
                </div>
              </div>

              {/* Top Section Summary */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">{t(`ණය මුදල`)}</p>
                  <p className="text-lg font-black text-indigo-900">රු. {Number(loan.requestedAmount).toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">{t(`වාර්ෂික පොලිය`)}</p>
                  <p className="text-lg font-black text-indigo-900">{loan.interestRate}%</p>
                </div>
              </div>

              <div className="flex justify-end">
                {(userRole === 'SENIOR_OFFICER' || userRole === 'CASHIER' || userRole === 'BRANCH_MANAGER') && (
                  <button 
                    onClick={() => {
                      setPaymentAmount('');
                      setPaymentDate(new Date().toLocaleDateString('en-CA'));
                      setShowPaymentModal(true);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm transition flex items-center gap-2">
                    {t(`වාරිකයක් ගෙවන්න`)}</button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`දිනය`)}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`විස්තරය`)}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`දින ගණන`)}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`ගෙවූ මූලික මුදල`)}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`ගෙවූ පොලිය`)}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`මුළු ගෙවූ මුදල`)}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">{t(`ඉතිරි ශේෂය`)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loadingRepayments ? (
                      <tr><td colSpan={7} className="p-8 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                    ) : repayments.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">{t(`ගෙවීම් කිසිවක් තවම සිදුකර නොමැත`)}</td></tr>
                    ) : (
                      repayments.map((r: any) => (
                        <tr key={r.repaymentId || r.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{new Date(r.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <div className="font-medium text-slate-800">{r.reference || 'Manual Payment'}</div>
                            {r.paymentBranchId && r.paymentBranchId !== loan.branchId && (
                              <div className="text-[10px] font-bold text-amber-700 mt-1 bg-amber-100 inline-block px-1.5 py-0.5 rounded border border-amber-200">
                                {getBranchName(r.paymentBranchId)} මගින්
                              </div>
                            )}
                            {r.calcFormula && (
                              <div className="text-[10px] text-slate-500 font-mono mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                                🧮 {r.calcFormula} = රු. {Number(r.interestPortion).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.daysElapsed !== undefined && (
                              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{r.daysElapsed}d</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">රු. {Number(r.principalPortion).toLocaleString()}</td>
                          <td className="px-4 py-3 text-rose-600 font-semibold">රු. {Number(r.interestPortion).toLocaleString()}</td>
                          <td className="px-4 py-3 font-black text-emerald-700 text-right">රු. {Number(r.totalPaid).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-right">රු. {Number(r.outstandingAfter || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Accuracy note */}
              {repayments.length > 0 && (
                <div className="mt-3 mb-6 flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="text-emerald-500 font-black shrink-0 mt-0.5">✓</span>
                  <span>
                    <strong>{t(`නිවැරදි ගණනය:`)}</strong> {t(`ඉහත පොලිය ගණනය කිරීමේදී අවසන් වරට ගෙවීම් කළ දින සිට (හෝ ණය ලබාගත් දින සිට) අද දක්වා`)}<strong>{t(`ඇත්ත දිනගණන`)}</strong> {t(`(Days Elapsed) මත පදනම්ව දෛනික පොලිය ගණනය කර ඇත.`)}</span>
                </div>
              )}

              {/* Remaining Balance Summary */}
              {!loadingRepayments && (
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 mb-1">{t(`ඉතිරි ගෙවිය යුතු මූලික මුදල (Outstanding Balance)`)}</h3>
                    <p className="text-xs text-rose-600">{t(`මීළඟ පොලී ගණනය කිරීම් සිදුවන්නේ මෙම ඉතිරි මුදල මතයි.`)}</p>
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
                          action.action === 'APPLIED' ? 'bg-blue-500 text-white' :
                          'bg-slate-400 text-white'
                        }`}>
                          {action.action === 'APPROVED' ? <CheckCircle size={16} /> : 
                           action.action === 'APPLIED' ? <FileText size={16} /> : 
                           <XCircle size={16} />}
                        </div>
                        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">
                                {action.stage === 'APPLICATION' ? 'ණය ඉල්ලුම්පත (Application)' :
                                 LoanService.STAGE_LABELS[action.stage]?.labelSi || (action.stage === 'DISBURSED' ? 'මුදා හැර ඇත (Disbursed)' : action.stage)}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {action.actorUsername} • {translateRole(action.actorRole)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                                  action.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                                  action.action === 'APPLIED' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-red-100 text-red-700'
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
              <FileText size={16} /> {t(`🖨 ගිවිසුම මුද්‍රණය (Print Agreement)`)}</button>
            {((userRole === 'SENIOR_OFFICER' || userRole === 'BRANCH_MANAGER') && (loan.status === 'APPROVED' || loan.currentStage === 'STAGE_3_APPROVED')) && (
              <button onClick={() => setShowDisburseModal(true)} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-2">
                {t(`💰 ණය මුදා හරින්න (Disburse)`)}</button>
            )}
            {(loan.currentStage === 'DISBURSED' || loan.status === 'ACTIVE' || loan.status === 'COMPLETED') && (
              <button onClick={() => {
                const ad = typeof loan.applicationData === 'string' ? JSON.parse(loan.applicationData) : (loan.applicationData || {});
                printDisbursementReceipt(loan, ad, user?.username || 'system');
              }} className="px-5 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm transition flex items-center gap-2 border border-blue-200">
                {t(`🖨 රිසිට් පත (Print Receipt)`)}</button>
            )}
          </div>
        ) : null}
      </div>

      {/* Disbursement Overlay Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h4 className="font-bold text-white flex items-center gap-2 text-lg">
                {t(`💰 ණය මුදා හරින්න`)}</h4>
              <button onClick={() => setShowDisburseModal(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">{t(`💳 ණය ගෙවීමේ ක්‍රමය (Disbursement Method)`)}</p>
                <div className="flex rounded-xl overflow-hidden border border-blue-200">
                  <button
                    onClick={() => setDisbursePaymentMethod('CASH')}
                    className={`flex-1 py-2 text-sm font-bold transition ${disbursePaymentMethod === 'CASH' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                    {t(`💵 අතින් මුදල් (Cash)`)}</button>
                  <button
                    onClick={() => setDisbursePaymentMethod('SAVINGS_TRANSFER')}
                    className={`flex-1 py-2 text-sm font-bold transition ${disbursePaymentMethod === 'SAVINGS_TRANSFER' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                    {t(`🏦 ඉතුරුම් ගිණුමට`)}</button>
                </div>
              </div>
              
              {disbursePaymentMethod === 'SAVINGS_TRANSFER' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-blue-700 mb-1">{t(`බැර කළ යුතු ඉතුරුම් ගිණුම (Savings Account)`)}</label>
                  {fetchingAccounts ? (
                    <p className="text-xs text-slate-500 animate-pulse">Fetching accounts...</p>
                  ) : disburseMemberAccounts.length > 0 ? (
                    <select
                      value={disburseSelectedSavingsAcc}
                      onChange={e => setDisburseSelectedSavingsAcc(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {disburseMemberAccounts.map(acc => (
                        <option key={acc.accountNumber} value={acc.accountNumber}>
                          {acc.accountNumber} — Rs. {Number(acc.balance).toLocaleString()} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-red-600 font-medium">{t(`⚠ මෙම සාමාජිකයාට සක්‍රීය ඉතුරුම් ගිණුමක් නොමැත. (No active savings accounts found.)`)}</p>
                  )}
                </div>
              )}
              
              <div className="mb-2">
                <label className="block text-xs font-semibold text-blue-700 mb-1">{t(`ණය ගිණුම් අංකය (Loan Account Number)`)}<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={disburseLoanAccountNumber}
                  onChange={e => setDisburseLoanAccountNumber(e.target.value)}
                  placeholder="e.g. LN-12345"
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button onClick={() => setShowDisburseModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition">{t(`අවලංගු කරන්න`)}</button>
              <button onClick={handleDisburse} disabled={actionLoading || (disbursePaymentMethod === 'SAVINGS_TRANSFER' && disburseMemberAccounts.length === 0) || !disburseLoanAccountNumber.trim()} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2">
                {actionLoading ? 'Processing...' : 'මුදා හරින්න'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Overlay Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <h4 className="font-bold text-white flex items-center gap-2 text-lg">
                <BadgeCheck size={20} className="text-indigo-200" /> {t(`වාරිකයක් ගෙවන්න`)}</h4>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/70 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-700 bg-white/50 px-3 py-2 rounded-lg border border-indigo-100/60 flex-col gap-1.5 items-stretch">
                  <div className="flex justify-between">
                    <span>📅 ආරම්භක දිනය ({repayments.length > 0 ? 'අන්තිම ගෙවීම' : 'මුදාහළ දිනය'}):</span>
                    <span className="font-mono font-black">{modalLastDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t(`📅 ගෙවන දිනය (තේරූ දිනය):`)}</span>
                    <span className="font-mono font-black">{modalPayDateObj.toLocaleDateString()}</span>
                  </div>
                  <div className="border-t border-indigo-200/30 my-0.5"></div>
                  <div className="flex justify-between text-indigo-800 font-black">
                    <span>{t(`🔢 ගතවූ දින ගණන:`)}</span>
                    <span>{modalDaysElapsed} දින</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-indigo-700">
                  <span>{t(`📉 ගණනය කිරීමට ගන්නා ණය මුදල:`)}</span>
                  <span>රු. {Math.round(outstandingPrincipal).toLocaleString()}</span>
                </div>
                <div className="border-t border-indigo-200/50 my-1"></div>
                <div className="text-[11px] text-indigo-800 font-mono bg-white/60 p-2.5 rounded-lg border border-indigo-100 text-center">
                  <div className="text-[10px] text-slate-500 font-sans font-bold uppercase mb-1">{t(`පොලී ගණනය කිරීමේ සූත්‍රය (Formula):`)}</div>
                  රු. {Math.round(outstandingPrincipal).toLocaleString()} × දින {modalDaysElapsed} × ({loan.interestRate}% / 36500)
                </div>
                <div className="text-center text-sm font-black text-indigo-900 mt-1">
                  ගණනය කළ පොලිය: රු. {Math.round(modalCalculatedInterest).toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t(`Payment Date (දිනය)`)}</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 font-bold text-slate-800 transition outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{t(`Amount to Pay (Rs.) (ගෙවන මුදල)`)}</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} 
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 transition outline-none" />
                  
                  {paymentAmount && Number(paymentAmount) > 0 && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>{t(`💰 ගෙවූ මුළු මුදල (Total Paid):`)}</span>
                        <span className="font-bold">රු. {payAmtNum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>{t(`📉 පොලියට බැර වන මුදල (Interest Portion):`)}</span>
                        <span>රු. {Math.round(liveInterestPortion).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>{t(`💵 මූලික මුදලට බැර වන මුදල (Principal Portion):`)}</span>
                        <span>රු. {Math.round(livePrincipalPortion).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-slate-200 my-1"></div>
                      <div className="flex justify-between text-indigo-900 font-bold">
                        <span>{t(`ඉතිරි ණය ශේෂය (Outstanding Balance After):`)}</span>
                        <span>රු. {Math.round(liveOutstandingAfter).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
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
              <button
                onClick={handleRepay}
                disabled={paymentLoading || !paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0}
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {paymentLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> {t(`ප්‍රකියා කරයි...`)}</>
                ) : (
                  <><span>✓</span> {t(`වාරිකය ගෙවන්න`)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notice Letter Modal ── */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Printer size={18} className="text-amber-400" />
                  ණය හිඟ මුදල් දැනුම්දීමේ ලිපිය (Loan Overdue Notice)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  සති 2න් 2ට අනුරූප අදියර ලිපිය තෝරාගෙන මුද්‍රණය කරන්න (Automatic Bi-weekly Notice Generator)
                </p>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition">
                <X size={20} />
              </button>
            </div>

            {/* Notice Type Selector Bar */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex bg-white p-1 rounded-xl border border-slate-300 shadow-sm overflow-x-auto">
                {[
                  { id: 1, label: '1 වන ලිපිය (සති 2)', desc: '1 වන ලිපිය (ණයකරු)' },
                  { id: 2, label: '2 වන ලිපිය (සති 4)', desc: '2 වන ලිපිය (හිඟ වාරික)' },
                  { id: 3, label: '3 වන ලිපිය (සති 6)', desc: 'අත්වැල ලිපිය (ඇපකරුවන්)' },
                  { id: 4, label: '4 වන ලිපිය (සති 8)', desc: 'ලියාපදිංචි තැපෑලෙන්' },
                  { id: 5, label: '5 වන ලිපිය (රතු නිවේදනය)', desc: 'අවසන් නීතිමය ලිපිය' },
                ].map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNoticeType(n.id as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      noticeType === n.id
                        ? (n.id === 5 ? 'bg-red-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md')
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handlePrintNotice}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2"
              >
                <Printer size={16} /> මුද්‍රණය කරන්න (Print Letter)
              </button>
            </div>

            {/* Letter Preview Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-200/50 flex justify-center">
              <div className="bg-white shadow-2xl rounded-lg border border-slate-300 w-full max-w-[800px]">
                <PrintableNoticeLetter
                  ref={noticePrintRef}
                  noticeType={noticeType}
                  loan={loan}
                  memberName={memberName}
                  member={loan.applicationData || { fullName: memberName }}
                  guarantors={(loan as any).guarantors || []}
                  overdueAmount={(loan as any).overdueAmount || loan.requestedAmount}
                  totalDue={(loan as any).overdueAmount || loan.requestedAmount}
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      variant={confirmDialog.variant}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
    />
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      style={{ zIndex: 99999 }}
    >
      <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', fontWeight: 'bold' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
  );
}
