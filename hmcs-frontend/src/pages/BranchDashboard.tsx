import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, CreditCard, FileText,
  Gem, ClipboardList, TrendingUp, AlertTriangle, CheckCircle,
  Clock, DollarSign, UserPlus, Scale, Banknote, ArrowDownLeft,
  ArrowUpRight, Shield, Bell, ChevronRight, ChevronDown, Calculator, Award, X, Search, PiggyBank, Lock, MapPin, FileImage, Eye, BookOpen, Percent, Activity, Trash2, Loader2, User, Printer, XCircle, Power, Briefcase, Plus, Calendar, AlertCircle, List
} from 'lucide-react';
import GlobalSettings from '../components/GlobalSettings';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import * as LoanService from '../services/loan.service';
import * as PawningService from '../services/pawning.service';
import * as LedgerService from '../services/ledger.service';
import * as BranchService from '../services/branch.service';
import PawningApprovalsView from '../components/PawningApprovalsView';
import { printAccountStatement, printLoanAgreement, printDisbursementReceipt, printPawnTicket } from '../utils/print';
import logo from '../assets/logo.jpg';
import { useLanguage } from '../context/LanguageContext';
import { FdViewModal } from '../components/FdViewModal';
import FdMonitorModal from '../components/FdMonitorModal';
import OpenAccountForm from '../components/OpenAccountForm';
import OpenFixedDepositForm from '../components/OpenFixedDepositForm';
import RenewFixedDepositModal from '../components/RenewFixedDepositModal';
import ViewAccountModal from '../components/ViewAccountModal';
import LoanApplicationModal from '../components/LoanApplicationModal';
import LoanDetailModal from '../components/LoanDetailModal';
import GlobalLoanSearchModal from '../components/GlobalLoanSearchModal';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InsuranceReport from '../components/InsuranceReport';
import BranchOverviewView from '../components/BranchOverviewView';

import TransactionModal, { type TransactionAction } from '../components/TransactionModal';
import PawningModule from '../components/PawningModule';
import ConfirmDialog from '../components/ConfirmDialog';

export const getBranchName = (branchId: number) => {
  const { t } = useLanguage();
  const branchMap: Record<number, string> = {
    1: 'Hikkaduwa Branch',
    2: 'Dodanduwa Branch',
    3: 'Rathgama Branch',
    4: 'Seenigama Branch',
    5: 'Thiranagama Branch',
    6: 'Peraliya Branch',
    7: 'Kalupe Branch',
    8: 'Gonapinuwala Branch',
    9: 'Baddegama Main Branch',
    10: 'සන්දරවල ශාඛාව',
    11: 'Galle Main Branch',
    12: 'දොඩංගොඩ ශාඛාව',
  };
  return branchMap[branchId] || `Branch ${branchId}`;
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  BRANCH_MANAGER:       { label: 'Branch Manager',       color: 'text-blue-700',   bg: 'bg-blue-600',   gradient: 'from-blue-900 via-blue-800 to-slate-900' },
  BANK_SERVICE_MANAGER: { label: 'Bank Service Manager', color: 'text-purple-700', bg: 'bg-purple-600', gradient: 'from-purple-900 via-purple-800 to-slate-900' },
  LOAN_COMMITTEE:       { label: 'Loan Committee',       color: 'text-amber-700',  bg: 'bg-amber-600',  gradient: 'from-amber-900 via-amber-800 to-slate-900' },
  SENIOR_OFFICER:       { label: 'Senior Officer',       color: 'text-teal-700',   bg: 'bg-teal-600',   gradient: 'from-teal-900 via-teal-800 to-slate-900' },
  FIELD_OFFICER:        { label: 'Field Officer',        color: 'text-green-700',  bg: 'bg-green-600',  gradient: 'from-green-900 via-green-800 to-slate-900' },
  TELLER:               { label: 'Teller',               color: 'text-red-700',    bg: 'bg-red-600',    gradient: 'from-red-900 via-red-800 to-slate-900' },
  VALUER:               { label: 'Valuer',               color: 'text-yellow-700', bg: 'bg-yellow-600', gradient: 'from-yellow-900 via-yellow-800 to-slate-900' },
};

const BRANCH_THEMES: Record<number, { bg: string; gradient: string; color: string; logoBg: string }> = {
  1: { color: 'text-blue-700',   bg: 'bg-blue-600',   gradient: 'from-blue-900 via-blue-800 to-slate-900',       logoBg: 'bg-blue-800' },
  2: { color: 'text-purple-700', bg: 'bg-purple-600', gradient: 'from-purple-900 via-purple-800 to-slate-900',   logoBg: 'bg-purple-800' },
  3: { color: 'text-green-700',  bg: 'bg-green-600',  gradient: 'from-green-900 via-green-800 to-slate-900',     logoBg: 'bg-green-800' },
  4: { color: 'text-orange-700', bg: 'bg-orange-600', gradient: 'from-orange-900 via-orange-800 to-slate-900',   logoBg: 'bg-orange-800' },
  5: { color: 'text-teal-700',   bg: 'bg-teal-600',   gradient: 'from-teal-900 via-teal-800 to-slate-900',       logoBg: 'bg-teal-800' },
  6: { color: 'text-pink-700',   bg: 'bg-pink-600',   gradient: 'from-pink-900 via-pink-800 to-slate-900',       logoBg: 'bg-pink-800' },
  7: { color: 'text-yellow-700', bg: 'bg-yellow-600', gradient: 'from-yellow-900 via-yellow-800 to-slate-900',   logoBg: 'bg-yellow-800' },
  8: { color: 'text-red-700',    bg: 'bg-red-600',    gradient: 'from-red-900 via-red-800 to-slate-900',         logoBg: 'bg-red-800' },
};

const ROLE_NAV: Record<string, { icon?: any; label: string; key?: string; isSection?: boolean; subItems?: { icon?: any; label: string; key: string }[] }[]> = {
  BRANCH_MANAGER:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Manager Operations' },
    { icon: FileText, label: 'කළමනාකාර අනුමැතිය', key: 'loans' },
    { icon: CheckCircle, label: 'කමිටුව අනුමත කළ ණය', key: 'committee-approved' },
    { icon: Briefcase, label: 'Pawning Approvals', key: 'pawning_approvals' },
    { isSection: true, label: 'Customer Relations' },
    { icon: UserPlus, label: 'Members', key: 'members' },
    { isSection: true, label: 'Core Banking Facilities' },
    { icon: PiggyBank, label: 'Savings Accounts', key: 'savings' },
    { icon: Lock, label: 'Fixed Deposits', key: 'fds' },
    { icon: FileText, label: 'Loan Accounts', key: 'customer-loans' },
    { icon: Scale, label: 'Pawning (Gold Loans)', key: 'pawning' },
    { icon: Shield, label: 'Insurance Report', key: 'insurance' },
    { isSection: true, label: 'Daily Operations' },
    // { icon: Banknote, label: 'Cash Transactions', key: 'transactions' },
    // { icon: BookOpen, label: 'General Ledger', key: 'gl' },
    { icon: ClipboardList, label: 'Summary Ledger', key: 'summary-ledger' },
    { icon: Banknote, label: 'Cash Balances', key: 'vault-cash' },
    { isSection: true, label: 'Information' },
    { icon: Percent, label: 'Interest Rates', key: 'rates' }
  ],
  BANK_SERVICE_MANAGER: [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Compliance' },
    { icon: Shield, label: 'Audit Logs', key: 'loans' }
  ],
  LOAN_COMMITTEE:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Approvals' },
    { icon: Scale, label: 'Vote on Loans', key: 'loans' }
  ],
  SENIOR_OFFICER:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' },
    { isSection: true, label: 'Customer Relations' },
    { icon: UserPlus, label: 'Members', key: 'members' },
    { isSection: true, label: 'Core Banking Facilities' },
    { icon: PiggyBank, label: 'Savings Accounts', key: 'savings' },
    { icon: Lock, label: 'Fixed Deposits', key: 'fds' },
    { icon: FileText, label: 'Loan Accounts', key: 'loans' },
    { icon: Scale, label: 'Pawning (Gold Loans)', key: 'pawning' },
    { icon: Shield, label: 'Insurance Report', key: 'insurance' },
    { isSection: true, label: 'Daily Operations' },
    { icon: Briefcase, label: 'ක්ෂේත්‍ර නිලධාරී මුදල් භාරගැනීම්', key: 'handovers' },
    // { icon: Banknote, label: 'Cash Transactions', key: 'transactions' },
    // { icon: BookOpen, label: 'General Ledger', key: 'gl' },
    { icon: ClipboardList, label: 'Summary Ledger', key: 'summary-ledger' },
    { icon: Banknote, label: 'Cash Balances', key: 'vault-cash' },
    { isSection: true, label: 'Information' },
    { icon: Percent, label: 'Interest Rates', key: 'rates' }
  ],
  FIELD_OFFICER:        [
    { icon: LayoutDashboard, label: 'දළ විශ්ලේෂණය', key: 'overview' }, 
    { isSection: true, label: 'ක්ෂේත්‍ර රාජකාරි' },
    { icon: FileText, label: 'ණය පරීක්ෂණ', key: 'evaluations' },
    { icon: ClipboardList, label: 'මුදල් එකතු කිරීම', key: 'collection' }
  ],

  TELLER:               [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Transactions' },
    { icon: ArrowDownLeft, label: 'Deposit', key: 'deposit' }, 
    { icon: ArrowUpRight, label: 'Withdraw', key: 'withdraw' }
  ],
  VALUER:               [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Appraisals' },
    { icon: Gem, label: 'New Pawn Ticket', key: 'pawn' }
  ],
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Loan Outstanding Cell ──────────────────────────────────────────────────────
function LoanOutstandingCell({ loan }: { loan: any }) {
  const { t } = useLanguage();
  const [outstanding, setOutstanding] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loan.status === 'ACTIVE' || loan.status === 'COMPLETED' || loan.currentStage === 'DISBURSED') {
      setLoading(true);
      LoanService.getRepayments(loan.loanId)
        .then((repayments: any[]) => {
          if (!repayments || repayments.length === 0) {
            setOutstanding(loan.requestedAmount);
          } else {
            const totalPrincipalPaid = repayments.reduce((sum: number, r: any) => sum + Number(r.principalPortion || 0), 0);
            const bal = Number(loan.requestedAmount) - totalPrincipalPaid;
            setOutstanding(bal < 0 ? 0 : bal);
          }
        })
        .catch(() => setOutstanding(loan.requestedAmount))
        .finally(() => setLoading(false));
    } else {
      setOutstanding(loan.requestedAmount);
    }
  }, [loan.loanId, loan.status, loan.requestedAmount, loan.currentStage]);

  if (loading) return <span className="animate-pulse text-slate-300">...</span>;
  if (outstanding === null) return <span>-</span>;
  
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono font-black text-rose-600 text-sm">
        Rs. {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </span>
      {outstanding === 0 && (
        <span className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">{t(`පියවා ඇත`)}</span>
      )}
    </div>
  );
}

// ── Queue Row ──────────────────────────────────────────────────────────────────
function QueueRow({ name, amount, status, date, onAction, actionLabel, actionColor }: any) {
  const { t } = useLanguage();
  const statusColors: Record<string, string> = {
    PENDING:  'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-xs text-slate-400">{date} · Rs. {amount?.toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
        {onAction && <button onClick={onAction} className={`text-xs px-3 py-1.5 rounded-lg font-semibold text-white ${actionColor || 'bg-blue-600'} hover:opacity-90 transition`}>{actionLabel}</button>}
      </div>
    </div>
  );
}

// ── Role Views ─────────────────────────────────────────────────────────────────
// ── Loan Review Modal ─────────────────────────────────────────────────────────
function LoanReviewModal({ loan, onClose, onAction }: { loan: LoanService.Loan; onClose: () => void; onAction: (action?: any) => void }) {
  const { t } = useLanguage();
  const user = AuthService.getCurrentUser();
  const canApprove = loan.status === 'PENDING' && (
    (user?.role?.includes('BRANCH_MANAGER') && loan.currentStage === 'STAGE_1_MANAGER_APPROVAL') ||
    (user?.role?.includes('LOAN_COMMITTEE') && loan.currentStage === 'STAGE_2_LOAN_COMMITTEE_APPROVAL')
  );
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const ad = loan.applicationData || {};

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'SAVINGS_TRANSFER'>('CASH');
  const [memberAccounts, setMemberAccounts] = useState<any[]>([]);
  const [selectedSavingsAcc, setSelectedSavingsAcc] = useState('');
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [loanAccountNumber, setLoanAccountNumber] = useState('');

  useEffect(() => {
    if (paymentMethod === 'SAVINGS_TRANSFER' && loan.memberId) {
      setFetchingAccounts(true);
      LoanService.getMemberSavingsAccounts(loan.memberId)
        .then(accs => {
          setMemberAccounts(accs);
          if (accs.length > 0) setSelectedSavingsAcc(accs[0].accountNumber);
        })
        .catch(() => setMemberAccounts([]))
        .finally(() => setFetchingAccounts(false));
    }
  }, [paymentMethod, loan.memberId]);

  
  // Field Officer Assignment
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [selectedFo, setSelectedFo] = useState('');
  const [assigningFo, setAssigningFo] = useState(false);

  useEffect(() => {
    import('../services/auth.service').then(Auth => {
      Auth.getUsers().then(users => {
        setFieldOfficers(users.filter(u => u.role === 'ROLE_FIELD_OFFICER' || u.role === 'FIELD_OFFICER' || u.role.includes('FIELD')));
      }).catch(() => {});
    });
  }, []);

  const handleAssignFo = async () => {
    if (!selectedFo) {
      (window as any).showToast('කරුණාකර ක්ෂේත්‍ර නිලධාරියෙකු තෝරන්න.');
      return;
    }
    setAssigningFo(true);
    try {
      await LoanService.assignEvaluator(loan.loanId, selectedFo);
      (window as any).showToast('සාර්ථකව පැවරුවා!');
      loan.evaluatorId = selectedFo;
      loan.evaluationStatus = 'ASSIGNED';
      onAction('assign');
    } catch (e: any) {
      (window as any).showToast('පැවරීමේ දෝෂයකි.');
    } finally {
      setAssigningFo(false);
    }
  };

  const handle = async (action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const role = user?.role?.replace('ROLE_', '') || 'BRANCH_MANAGER';
      if (action === 'approve') {
        await LoanService.advanceLoanStage(loan.loanId, user?.username || '', role, comments || `Approved/Recommended by ${role}`);
      } else {
        await LoanService.rejectLoan(loan.loanId, user?.username || '', role, comments || `Rejected by ${role}`);
      }
      onAction(action);
      onClose();
    } catch { (window as any).showToast('Action failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleDisburse = async () => {
    if (paymentMethod === 'SAVINGS_TRANSFER' && !selectedSavingsAcc) {
      (window as any).showToast('කරුණාකර ඉතුරුම් ගිණුමක් තෝරන්න. (Please select a savings account.)');
      return;
    }
    if (!loanAccountNumber.trim()) {
      (window as any).showToast('කරුණාකර ණය ගිණුම් අංකය ඇතුළත් කරන්න. (Please enter the loan account number.)');
      return;
    }
    if (!await new Promise<boolean>(resolve => {
      setConfirmDialog({
        isOpen: true,
        title: 'ණය නිකුත් කිරීම',
        message: `ණය මුදල ${paymentMethod === 'CASH' ? 'අතින් (Cash)' : 'ඉතුරුම් ගිණුමට'} නිකුත කරන්නද?`,
        variant: 'info',
        onConfirm: () => { setConfirmDialog(d => ({ ...d, isOpen: false })); resolve(true); }
      });
      setTimeout(() => resolve(false), 30000);
    })) return;
    setLoading(true);
    try {
      const disbursed = await LoanService.disburseLoan(
        loan.loanId,
        loan.requestedAmount,
        user?.username || 'system',
        paymentMethod,
        paymentMethod === 'SAVINGS_TRANSFER' ? selectedSavingsAcc : undefined,
        loanAccountNumber
      );
      // printDisbursementReceipt(disbursed, ad, user?.username || 'system');
      onAction();
      onClose();
    } catch (e: any) {
      (window as any).showToast('ණය මුදල නිකුත කිරීමේ දෝෂයකි: ' + (e?.response?.data || e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAgreement = () => {
  const { t } = useLanguage();
    printLoanAgreement(loan, ad);
  };

  const Field = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-5 rounded-t-2xl flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">
                {t(`ණය ඉල්ලීම් සමාලෝචනය | Loan Application Review`)}</p>
              {(loan as any).applicationNumber && (
                <span className="bg-white/20 text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded shadow-sm border border-white/10 tracking-widest">
                  #{(loan as any).applicationNumber}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold">{ad.applicantName || ad.name || 'Applicant'}</h2>
            <p className="text-blue-200 text-sm mt-1">Rs. {loan.requestedAmount?.toLocaleString()} · {loan.loanType?.name} · {loan.termMonths} months</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
              loan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>{loan.currentStage?.replace(/_/g, ' ')}</span>
            <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded-lg transition"><X size={18}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Applicant Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="col-span-full text-sm font-bold text-blue-800 mb-2 pb-2 border-b border-slate-200">{t(`① අයදුම්කරුගේ තොරතුරු`)}</h3>
            <Field label={t(`සම්පූර්ණ නම`)} value={ad.applicantName || ad.name} />
            <Field label={t(`ජා.හැ.ප. අංකය`)} value={ad.nic} />
            <Field label={t(`සාමාජික අංකය`)} value={ad.memberNo || ad.officeMemberNo} />
            <Field label={t(`ලිපිනය`)} value={ad.addressLine1 || ad.address} />
            <Field label={t(`ජංගම දූරකථනය`)} value={ad.phone} />
            <Field label={t(`ඉල්ලූ ණය මුදල`)} value={`Rs. ${loan.requestedAmount?.toLocaleString()}`} />
            <Field label={t(`ණය අරමුණ`)} value={ad.loanPurpose} />
            <Field label={t(`ණය ගෙවීමේ කාලය`)} value={`${loan.termMonths} months`} />
            <Field label={t(`ණය ප්‍රමාණය (ද්‍රව්‍ය)`)} value={ad.requiredLoanGoods} />
          </div>

          {/* Assets */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="col-span-full text-sm font-bold text-blue-800 mb-2 pb-2 border-b border-slate-200">{t(`② වත්කම් විස්තර`)}</h3>
            <Field label={t(`ගොඩ ඉඩම`)} value={ad.assets?.landGoda ? `Rs. ${ad.assets.landGoda}` : undefined} />
            <Field label={t(`මඩ ඉඩම`)} value={ad.assets?.landMada ? `Rs. ${ad.assets.landMada}` : undefined} />
            <Field label={t(`වාහන`)} value={ad.assets?.vehicles ? `Rs. ${ad.assets.vehicles}` : undefined} />
            <Field label={t(`සතුන්`)} value={ad.assets?.animals ? `Rs. ${ad.assets.animals}` : undefined} />
            <Field label={t(`වාර්ෂික ප්‍රාථමික ආදායම`)} value={ad.annualIncomePrimary ? `Rs. ${ad.annualIncomePrimary}` : undefined} />
            <Field label={t(`වාර්ෂික වියදම`)} value={ad.annualExpense ? `Rs. ${ad.annualExpense}` : undefined} />
          </div>

          {/* Guarantors */}
          {(ad.guarantor1 || ad.guarantor1Name) && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-blue-800 mb-3 pb-2 border-b border-slate-200">{t(`③ ඇපකරුවන්ගේ විස්තර`)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[ad.guarantor1 || { name: ad.guarantor1Name, address: ad.guarantor1Address }, ad.guarantor2 || { name: ad.guarantor2Name, address: ad.guarantor2Address }].map((g: any, i) => g?.name && (
                  <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-xs font-bold text-blue-700 mb-2">{i === 0 ? 'පළමු' : 'දෙවන'} ඇපකරු</p>
                    <Field label={t(`නම`)} value={g.name} />
                    <Field label={t(`ලිපිනය`)} value={g.address} />
                    <Field label="NIC" value={g.nic} />
                    {g.digitalSignatureUrl ? (
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 block">{t(`ඩිජිටල් අත්සන`)}</span>
                        <img src={g.digitalSignatureUrl} alt="Signature" className="h-12 w-auto mt-1 border border-slate-200 rounded object-contain bg-white" />
                      </div>
                    ) : (
                      <Field label={t(`ඩිජිටල් අත්සන`)} value="—" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Docs */}
          {ad.supportingDocuments?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-blue-800 mb-2">{t(`④ ඇමිණුම් ලියකියවිලි`)}</h3>
              {ad.supportingDocuments.map((d: string, i: number) => (
                <a key={i} href={d} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm block">{d}</a>
              ))}
            </div>
          )}


          
          {/* Field Officer Evaluation */}
          {loan.evaluatorId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-emerald-800 mb-2">{t(`🔍 ක්ෂේත්‍ර නිලධාරී වාර්තාව (Field Officer Evaluation)`)}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-emerald-600 font-semibold mb-1">{t(`තත්ත්වය (Status)`)}</p>
                  <span className={`px-2 py-1 rounded font-bold text-xs ${loan.evaluationStatus === 'RECOMMENDED' ? 'bg-emerald-200 text-emerald-800' : loan.evaluationStatus === 'NOT_RECOMMENDED' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                    {loan.evaluationStatus}
                  </span>
                </div>
                {loan.evaluationNotes && (
                  <div className="col-span-2 mt-2">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">{t(`සටහන් (Notes)`)}</p>
                    {(() => {
                      try {
                        const parsed = JSON.parse(loan.evaluationNotes);
                        return (
                          <div className="space-y-3">
                            <p className="p-3 bg-white border border-emerald-200 rounded-lg text-slate-700 whitespace-pre-wrap">{parsed.text}</p>
                            {parsed.documents && parsed.documents.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {parsed.documents.map((d: string, i: number) => (
                                  <img key={i} src={d} alt="Report Doc" className="h-32 w-auto max-w-[200px] rounded-lg border border-slate-200 object-contain bg-white shadow-sm cursor-pointer hover:scale-105 transition" onClick={() => setPreviewImage(d)} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return <p className="p-3 bg-white border border-emerald-200 rounded-lg text-slate-700">{loan.evaluationNotes}</p>;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Decision */}
          {canApprove && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-800 mb-2">{t(`⑤ අදහස් / Comments`)}</h3>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder={t(`ඔබගේ අදහස් හෝ ප්‍රතික්ෂේප කිරීමේ හේතුව ලියන්න...`)}
                rows={3}
                className="w-full border border-amber-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
          )}

          {/* Field Officer Assignment */}
          {user?.role?.includes('BRANCH_MANAGER') && loan.currentStage === 'STAGE_1_MANAGER_APPROVAL' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <h4 className="text-sm font-bold text-blue-800 mb-2">{t(`ක්ෂේත්‍ර නිලධාරීවරයෙකුට පවරන්න (Assign to Field Officer)`)}</h4>
              <div className="flex gap-2">
                <select value={selectedFo} onChange={e => setSelectedFo(e.target.value)} className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">{t(`-- නිලධාරියා තෝරන්න --`)}</option>
                  {fieldOfficers.map(fo => <option key={fo.userId} value={fo.userId}>{fo.fullName || fo.username}</option>)}
                </select>
                <button type="button" onClick={handleAssignFo} disabled={assigningFo || !selectedFo} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {assigningFo ? '...' : 'පවරන්න'}
                </button>
              </div>
              {loan.evaluatorId && (
                 <p className="mt-2 text-xs font-semibold text-green-700">✓ දැනටමත් පවරා ඇත (Status: {loan.evaluationStatus})</p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200">
          {/* Disbursement Information - shown for DISBURSED loans */}
          {(loan.currentStage === 'DISBURSED' || loan.status === 'ACTIVE' || loan.status === 'COMPLETED') && ad.disbursementMethod && (
            <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${ad.disbursementMethod === 'CASH' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {ad.disbursementMethod === 'CASH' ? '💵' : '🏦'}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`ණය ගෙවූ ක්‍රමය (Disbursement Method)`)}</p>
                  <p className="text-sm font-bold text-slate-800">
                    {ad.disbursementMethod === 'CASH' ? 'අතින් මුදල් (Cash)' : 'ඉතුරුම් ගිණුමට (Savings Transfer)'}
                    {ad.disbursementMethod === 'SAVINGS_TRANSFER' && ad.disbursementSavingsAccount && (
                      <span className="text-emerald-700 ml-2 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-xs">
                        ගිණුම: {ad.disbursementSavingsAccount}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disbursement Method Panel - shown for APPROVED loans */}
          {(loan.status === 'APPROVED' || loan.currentStage === 'STAGE_3_APPROVED') && (
            <div className="px-5 pt-4 pb-2 bg-blue-50/60 border-b border-blue-100">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">{t(`💳 ණය ගෙවීමේ ක්‍රමය (Disbursement Method)`)}</p>
              <div className="flex rounded-xl overflow-hidden border border-blue-200 mb-3">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex-1 py-2 text-sm font-bold transition ${paymentMethod === 'CASH' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                  {t(`💵 අතින් මුදල් (Cash)`)}</button>
                <button
                  onClick={() => setPaymentMethod('SAVINGS_TRANSFER')}
                  className={`flex-1 py-2 text-sm font-bold transition ${paymentMethod === 'SAVINGS_TRANSFER' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                  {t(`🏦 ඉතුරුම් ගිණුමට (Savings Transfer)`)}</button>
              </div>
              {paymentMethod === 'SAVINGS_TRANSFER' && (
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-blue-700 mb-1">{t(`බැර කළ යුතු ඉතුරුම් ගිණුම (Savings Account)`)}</label>
                  {fetchingAccounts ? (
                    <p className="text-xs text-slate-500 animate-pulse">Fetching accounts...</p>
                  ) : memberAccounts.length > 0 ? (
                    <select
                      value={selectedSavingsAcc}
                      onChange={e => setSelectedSavingsAcc(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {memberAccounts.map(acc => (
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
              <div className="mb-3 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-800">{t(`මුදා හරින මුදල (Amount to Disburse):`)}</span>
                <span className="text-lg font-black text-emerald-700">Rs. {Number(loan.approvedAmount || loan.requestedAmount || 0).toLocaleString()}</span>
              </div>
              <div className="mb-2">
                <label className="block text-xs font-semibold text-blue-700 mb-1">{t(`ණය ගිණුම් අංකය (Loan Account Number)`)}<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={loanAccountNumber}
                  onChange={e => setLoanAccountNumber(e.target.value)}
                  placeholder="e.g. LN-12345"
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          )}

          <div className="p-5 flex justify-between items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
              {t(`වසන්න (Close)`)}</button>
            {canApprove && (
              <div className="flex gap-3">
                <button onClick={() => handle('reject')} disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow transition disabled:opacity-60">
                  {loading ? '...' : '✗ ප්‍රතික්ෂේප කරන්න (Reject)'}
                </button>
                <button onClick={() => handle('approve')} disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow transition disabled:opacity-60">
                  {loading ? '...' : (
                    (loan.loanType?.name?.includes('සේවක') || loan.loanType?.name?.includes('කෙටි') || (loan as any).loanTypeStr?.includes('සේවක') || (loan as any).loanTypeStr?.includes('කෙටි')) && loan.currentStage === 'STAGE_1_MANAGER_APPROVAL'
                      ? 'ණය කමිටුවට වෙත යවන්න'
                      : '✓ අනුමත කරන්න (Approve)'
                  )}
                </button>
              </div>
            )}
            {(loan.status === 'APPROVED' || loan.currentStage === 'STAGE_3_APPROVED') && (
              <div className="flex gap-3">
                <button onClick={handlePrintAgreement}
                  className="px-5 py-2.5 rounded-xl border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-sm shadow-sm transition">
                  {t(`🖨 ගිවිසුම මුද්‍රණය (Print Agreement)`)}</button>
                <button onClick={handleDisburse} disabled={loading || (paymentMethod === 'SAVINGS_TRANSFER' && memberAccounts.length === 0) || !loanAccountNumber.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition disabled:opacity-60">
                  {loading ? '⏳ Processing...' : '💰 ණය මුදා හරින්න (Disburse)'}
                </button>
              </div>
            )}
            {(loan.currentStage === 'DISBURSED' || loan.status === 'ACTIVE' || loan.status === 'COMPLETED') && (
              <div className="flex gap-3">
                <button onClick={() => printDisbursementReceipt(loan, ad, user?.username || 'system')}
                  className="px-5 py-2.5 rounded-xl border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-sm shadow-sm transition">
                  {t(`🖨 රිසිට් පත මුද්‍රණය (Print Receipt)`)}</button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Full Screen Image Preview Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-red-500 bg-black/50 rounded-full p-2 transition-colors" onClick={() => setPreviewImage(null)}>
            <X size={24} />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[95vh] object-contain rounded-lg cursor-default shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />
    </div>
  );
}

function BranchManagerView({ activeTab, setTab }: { activeTab: string; setTab: (tab: string) => void }) {
  const { t } = useLanguage();
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<any[]>([]);
  const [loanQueue, setLoanQueue] = useState<LoanService.Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanService.Loan | null>(null);
  const [search, setSearch] = useState('');
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');

  // Reset viewMode when switching tabs to ensure sensible defaults
  useEffect(() => { setViewMode('pending'); }, [activeTab]);

  const loadData = () => {
    AccountService.getBranchMembers().then(setMembers).catch(() => {});
    AccountService.getBranchAccounts().then(setAccounts).catch(() => {});
    AccountService.getFixedDeposits().then(setFixedDeposits).catch(() => {});
    LoanService.getLoans().then(setLoanQueue).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const filteredMembers = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.nic.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAccounts = accounts.filter(a =>
    a.accountNumber.toLowerCase().includes(search.toLowerCase())
  );

  const loans = loanQueue;
  const managerPendingLoans = loanQueue.filter(l => l.currentStage === 'STAGE_1_MANAGER_APPROVAL' && l.status === 'PENDING');

  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }

  if (activeTab === 'pawning_approvals') {

    return <PawningApprovalsView />;

  }



  if (activeTab === 'pawning') {
    return <PawningModule branchId={AuthService.getCurrentUser()?.branchId || 1} />;
  }

  if (activeTab === 'overview') {
    const user = AuthService.getCurrentUser();
    return (
      <BranchOverviewView 
        branchId={user?.branchId || 1}
        members={members}
        accounts={accounts}
        fixedDeposits={fixedDeposits}
        loans={loans}
        setTab={setTab}
        t={t}
      />
    );
  }

  if (activeTab === 'members') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Branch Members ({members.length})</h3>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or NIC..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Member</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">NIC</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No members found</td></tr>
            ) : filteredMembers.map(m => (
              <tr key={m.memberId} className="hover:bg-slate-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">{(m.nameWithInitials || m.fullName).charAt(0)}</div>
                    <span className="font-medium text-slate-800">{m.nameWithInitials || m.fullName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{m.nic}</td>
                <td className="px-5 py-3 text-slate-600">{m.contactNumber}</td>
                <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (activeTab === 'accounts') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Branch Accounts ({accounts.length}) — Total: Rs. {totalBalance.toLocaleString()}</h3>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search account number..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Account No.</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Balance</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Opened</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No accounts found</td></tr>
            ) : filteredAccounts.map(a => (
              <tr key={a.accountId} className="hover:bg-slate-50 transition">
                <td className="px-5 py-3 font-bold text-slate-800">{a.accountNumber}</td>
                <td className="px-5 py-3"><span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium">{a.accountType}</span></td>
                <td className="px-5 py-3 font-semibold text-slate-800">Rs. {Number(a.balance).toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{a.openedDate || '—'}</td>
                <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );



  if (activeTab === 'loans' || activeTab === 'committee-approved') {
    const isCommitteeApprovedTab = activeTab === 'committee-approved';

    const requiresCommittee = (l: any) => {
      const typeStr = (l.loanType?.name || l.loanTypeStr || '').toLowerCase();
      return typeStr.includes('සේවක') || typeStr.includes('කෙටි');
    };

    let displayedLoans = [];
    if (isCommitteeApprovedTab) {
      displayedLoans = viewMode === 'pending' 
        ? loanQueue.filter(l => l.currentStage === 'STAGE_3_APPROVED' && l.status === 'APPROVED' && requiresCommittee(l))
        : loanQueue.filter(l => (l.status === 'ACTIVE' || l.currentStage === 'DISBURSED' || l.status === 'COMPLETED') && requiresCommittee(l));
    } else {
      displayedLoans = viewMode === 'pending'
        ? loanQueue.filter(l => l.currentStage === 'STAGE_1_MANAGER_APPROVAL' && l.status === 'PENDING')
        : loanQueue.filter(l => l.currentStage !== 'STAGE_1_MANAGER_APPROVAL' || l.status !== 'PENDING');
    }

    // Sort so newest ones appear at the top
    displayedLoans.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.appliedDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.appliedDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    let pendingCount = 0;
    let historyCount = 0;
    if (isCommitteeApprovedTab) {
      pendingCount = loanQueue.filter(l => l.currentStage === 'STAGE_3_APPROVED' && l.status === 'APPROVED' && requiresCommittee(l)).length;
      historyCount = loanQueue.filter(l => (l.currentStage === 'DISBURSED' || l.status === 'ACTIVE' || l.status === 'COMPLETED') && requiresCommittee(l)).length;
    } else {
      pendingCount = loanQueue.filter(l => l.currentStage === 'STAGE_1_MANAGER_APPROVAL' && l.status === 'PENDING').length;
      historyCount = loanQueue.filter(l => l.currentStage !== 'STAGE_1_MANAGER_APPROVAL' || l.status !== 'PENDING').length;
    }

    return (
      <div className="space-y-4">
        {selectedLoan && <LoanReviewModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} onAction={(action) => { loadData(); if (action !== 'assign') setViewMode('history'); }} />}
        
        {!isCommitteeApprovedTab && (
          <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit">
            <button 
              onClick={() => setViewMode('pending')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'pending' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              අනුමැතිය සඳහා පොරොත්තු (Pending)
              {pendingCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${viewMode === 'pending' ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>{pendingCount}</span>
              )}
            </button>
            <button 
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {t(`පෙර වාර්තා (History)`)}</button>
          </div>
        )}

        {isCommitteeApprovedTab && (
          <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit">
            <button 
              onClick={() => setViewMode('pending')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'pending' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              මුදාහැරිය යුතු (To Disburse)
              {pendingCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${viewMode === 'pending' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{pendingCount}</span>
              )}
            </button>
            <button 
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {t(`නිකුත් කළ ණය (Disbursed)`)}</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} /> 
              {isCommitteeApprovedTab 
                ? (viewMode === 'pending' ? 'මුදාහැරිය යුතු ණය' : 'නිකුත් කළ ණය') 
                : (viewMode === 'pending' ? 'ණය නිර්දේශ පෝලිම' : 'පෙර සමාලෝචනය කළ ණය')}
            </h3>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${viewMode === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {displayedLoans.length} වාර්තා
            </span>
          </div>
          {displayedLoans.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {t(`වාර්තා කිසිවක් හමු නොවීය.`)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t(`අයදුම්කරු`)}</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t(`ණය වර්ගය`)}</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">{t(`ඉල්ලූ මුදල`)}</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">{t(`කාලය`)}</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">{(viewMode === 'history' || isCommitteeApprovedTab) ? 'අනුමත කළ දිනය/වේලාව' : 'ඉල්ලුම් කළ දිනය'}</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">{t(`අදියර (STAGE)`)}</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">{t(`තත්ත්වය`)}</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">{t(`ක්‍රියාව`)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLoans.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{l.applicationData?.applicantName || l.applicationData?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{l.applicationData?.nic || l.memberId?.slice(0,12)}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{l.loanType?.name || '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">Rs. {l.requestedAmount?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-center text-slate-600">මාස {l.termMonths}</td>
                    <td className="px-5 py-3 text-center text-slate-400 text-xs">
                      {(viewMode === 'history' || isCommitteeApprovedTab) && l.updatedAt ? (
                        <>
                          <div className="font-semibold text-slate-600">{new Date(l.updatedAt).toLocaleDateString()}</div>
                          <div className="text-[10px]">{new Date(l.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </>
                      ) : (
                        l.appliedDate?.slice(0,10)
                      )}
                    </td>
                    <td className="px-5 py-3 text-center text-xs font-semibold text-indigo-600">
                      {l.currentStage === 'STAGE_3_APPROVED' && !((l.loanType?.name || (l as any).loanTypeStr || '').toLowerCase().includes('සේවක') || (l.loanType?.name || (l as any).loanTypeStr || '').toLowerCase().includes('කෙටි'))
                        ? 'අවසාන අනුමැතිය ලබා දෙන ලදී'
                        : LoanService.STAGE_LABELS[l.currentStage]?.labelSi || (l.currentStage === 'DISBURSED' ? 'නිකුත් කර ඇත' : l.currentStage)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        l.status === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
                        l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        l.status === 'ACTIVE'   ? 'bg-blue-100 text-blue-700' :
                        l.currentStage === 'DISBURSED' ? 'bg-blue-100 text-blue-700' :
                        l.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {l.status === 'ACTIVE' ? '✓ නිකුත් කර ඇත' : 
                         l.currentStage === 'DISBURSED' ? 'නිකුත් කර ඇත' :
                         l.status === 'COMPLETED' ? 'අවසන්' :
                         l.status === 'PENDING' ? 'PENDING' :
                         l.status === 'APPROVED' ? (isCommitteeApprovedTab && viewMode === 'pending' ? 'අනුමතයි (මුදාහැරිය යුතු)' : 'අනුමතයි') :
                         l.status === 'REJECTED' ? 'ප්‍රතික්ෂේපයි' : l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => setSelectedLoan(l)} className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center gap-1 mx-auto">
                        <Eye size={12}/> {(l.status === 'APPROVED' && l.currentStage !== 'DISBURSED' && l.status !== 'ACTIVE' && l.status !== 'COMPLETED') ? 'මුදාහරින්න' : 'බලන්න'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'gl') {
    const currentUser = AuthService.getCurrentUser();
    return <LedgerView branchId={currentUser?.branchId || 1} />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Alerts</h3>
      {[{ msg: 'FD #10234 matures in 3 days — Rs. 100,000', type: 'FD' }, { msg: 'Pawn Ticket #698594 expires in 7 days', type: 'PAWN' }].map((a, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{a.type}</span>
          <p className="text-sm text-slate-700">{a.msg}</p>
        </div>
      ))}
    </div>
  );
}

function LoanCommitteeView({ activeTab }: { activeTab: string }) {
  const { t } = useLanguage();
  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }

  const [loans, setLoans] = useState<LoanService.Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanService.Loan | null>(null);
  const [activeListTab, setActiveListTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const loadData = () => {
    LoanService.getLoans().then(setLoans).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const pendingLoans = loans.filter(l => l.currentStage === 'STAGE_2_LOAN_COMMITTEE_APPROVAL' && l.status === 'PENDING');
  const approvedLoans = loans.filter(l => l.currentStage === 'STAGE_3_APPROVED' || l.status === 'APPROVED' || l.status === 'ACTIVE' || l.currentStage === 'DISBURSED');
  const rejectedLoans = loans.filter(l => l.status === 'REJECTED');

  return (
    <div className="space-y-6">
      {selectedLoan && <LoanReviewModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} onAction={loadData} />}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => setActiveListTab('pending')} className={`bg-white rounded-2xl p-5 cursor-pointer shadow-sm border-2 transition-all flex items-center gap-4 ${activeListTab === 'pending' ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-slate-100 hover:border-amber-200'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
            <Clock size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t(`අනුමැතිය ලබාදිය යුතු`)}</p>
            <p className="text-2xl font-bold text-slate-800">{pendingLoans.length}</p>
          </div>
        </div>

        <div onClick={() => setActiveListTab('approved')} className={`bg-white rounded-2xl p-5 cursor-pointer shadow-sm border-2 transition-all flex items-center gap-4 ${activeListTab === 'approved' ? 'border-emerald-500 scale-[1.02] shadow-md' : 'border-slate-100 hover:border-emerald-200'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
            <CheckCircle size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t(`අනුමත කළ ණය`)}</p>
            <p className="text-2xl font-bold text-slate-800">{approvedLoans.length}</p>
          </div>
        </div>

        <div onClick={() => setActiveListTab('rejected')} className={`bg-white rounded-2xl p-5 cursor-pointer shadow-sm border-2 transition-all flex items-center gap-4 ${activeListTab === 'rejected' ? 'border-red-500 scale-[1.02] shadow-md' : 'border-slate-100 hover:border-red-200'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
            <AlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t(`ප්‍රතික්ෂේප කළ ණය`)}</p>
            <p className="text-2xl font-bold text-slate-800">{rejectedLoans.length}</p>
          </div>
        </div>
      </div>

      {activeListTab === 'pending' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Scale size={16} className="text-amber-600" /> {t(`ණය අයදුම්පත් — ඔබගේ අනුමැතිය ලබා දෙන්න`)}</h3>
          {pendingLoans.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-300 rounded-xl">{t(`අනුමැතිය සඳහා පොරොත්තුවෙන් පවතින ණය අයදුම්පත් නොමැත.`)}</p>
          ) : pendingLoans.map(l => (
            <div key={l.loanId} className="mb-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`ණය ඉල්ලුම්කරු`)}</p>
                  <p className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">
                    {(() => {
                      const fullName = l.applicationData?.applicantName || l.applicationData?.name || '—';
                      if (fullName === '—') return fullName;
                      const parts = fullName.trim().split(/\s+/);
                      if (parts.length <= 1) return fullName;
                      const lastName = parts.pop();
                      const initials = parts.map((p: string) => p.charAt(0).toUpperCase() + '.').join(' ');
                      return `${initials} ${lastName}`;
                    })()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {(l as any).applicationNumber && (
                      <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">
                        <FileText size={14} /> {(l as any).applicationNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                      <FileText size={14} /> {l.loanType?.name || '—'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <MapPin size={14} /> {getBranchName(l.branchId)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <Clock size={14} /> මාස {l.termMonths}
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                      <Banknote size={14} /> Rs. {l.requestedAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <button onClick={() => setSelectedLoan(l)} className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl font-bold shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 flex items-center gap-2">
                    <Eye size={16} /> {t(`පරීක්ෂා කර අනුමත කරන්න`)}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeListTab === 'approved' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" /> {t(`අනුමත කළ ණය අයදුම්පත්`)}</h3>
          {approvedLoans.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-300 rounded-xl">{t(`දැනට අනුමත කළ ණය අයදුම්පත් නොමැත.`)}</p>
          ) : approvedLoans.map(l => (
            <div key={l.loanId} className="mb-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`ණය ඉල්ලුම්කරු`)}</p>
                  <p className="text-lg font-bold text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors">
                    {(() => {
                      const fullName = l.applicationData?.applicantName || l.applicationData?.name || '—';
                      if (fullName === '—') return fullName;
                      const parts = fullName.trim().split(/\s+/);
                      if (parts.length <= 1) return fullName;
                      const lastName = parts.pop();
                      const initials = parts.map((p: string) => p.charAt(0).toUpperCase() + '.').join(' ');
                      return `${initials} ${lastName}`;
                    })()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {(l as any).applicationNumber && (
                      <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">
                        <FileText size={14} /> {(l as any).applicationNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                      <FileText size={14} /> {l.loanType?.name || '—'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <MapPin size={14} /> {getBranchName(l.branchId)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <Clock size={14} /> මාස {l.termMonths}
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                      <Banknote size={14} /> Rs. {l.requestedAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm flex items-center gap-2 border border-emerald-200">
                    <CheckCircle size={16} /> {t(`අනුමත කර ඇත`)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeListTab === 'rejected' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-600" /> {t(`ප්‍රතික්ෂේප කළ ණය අයදුම්පත්`)}</h3>
          {rejectedLoans.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-300 rounded-xl">{t(`ප්‍රතික්ෂේප කළ ණය අයදුම්පත් නොමැත.`)}</p>
          ) : rejectedLoans.map(l => (
            <div key={l.loanId} className="mb-4 p-5 border border-slate-200 rounded-xl bg-white hover:border-red-300 hover:shadow-md transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`ණය ඉල්ලුම්කරු`)}</p>
                  <p className="text-lg font-bold text-slate-800 mb-3 group-hover:text-red-700 transition-colors">
                    {(() => {
                      const fullName = l.applicationData?.applicantName || l.applicationData?.name || '—';
                      if (fullName === '—') return fullName;
                      const parts = fullName.trim().split(/\s+/);
                      if (parts.length <= 1) return fullName;
                      const lastName = parts.pop();
                      const initials = parts.map((p: string) => p.charAt(0).toUpperCase() + '.').join(' ');
                      return `${initials} ${lastName}`;
                    })()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {(l as any).applicationNumber && (
                      <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">
                        <FileText size={14} /> {(l as any).applicationNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100">
                      <FileText size={14} /> {l.loanType?.name || '—'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <MapPin size={14} /> {getBranchName(l.branchId)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      <Clock size={14} /> මාස {l.termMonths}
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                      <Banknote size={14} /> Rs. {l.requestedAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <span className="px-4 py-2 bg-red-100 text-red-800 rounded-xl font-bold text-sm flex items-center gap-2 border border-red-200">
                    <XCircle size={16} /> {t(`ප්‍රතික්ෂේප කර ඇත`)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TellerView() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [accNo, setAccNo] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityDate, setActivityDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchActivities = () => {
    setLoadingActivity(true);
    const branchId = AuthService.getCurrentUser()?.branchId || 1;
    Promise.all([
      AccountService.getBranchActivities(activityDate),
      LoanService.getBranchTransactions(branchId).catch(() => []),
      PawningService.getBranchTransactions(branchId).catch(() => [])
    ]).then(([accActivities, loanTxs, pawnTxs]) => {
      const mappedLoan = loanTxs.map((tx: any) => ({
        id: tx.transactionId,
        type: tx.transactionType,
        amount: tx.amount,
        timestamp: tx.transactionTimestamp,
        reference: tx.reference,
        memberId: tx.processedBy,
        balanceAfter: tx.balanceAfter
      }));
      const mappedPawn = pawnTxs.map((tx: any) => ({
        id: tx.transactionId,
        type: tx.transactionType,
        amount: tx.amount,
        timestamp: tx.transactionTimestamp,
        reference: tx.reference,
        memberId: tx.processedBy,
        balanceAfter: tx.balanceAfter
      }));
      
      let combined = [...accActivities, ...mappedLoan, ...mappedPawn];
      if (activityDate) {
         combined = combined.filter(c => c.timestamp && c.timestamp.startsWith(activityDate));
      }
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(combined);
    }).catch(() => {})
      .finally(() => setLoadingActivity(false));
  };

  useEffect(() => {
    AccountService.getBranchAccounts().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [activityDate]);

  const handleTx = async () => {
    if (!accNo || !amount) return;
    setLoading(true); setResult(null);
    try {
      const amt = parseFloat(amount);
      const res = txType === 'deposit'
        ? await AccountService.deposit({ accountNumber: accNo, amount: amt })
        : await AccountService.withdraw({ accountNumber: accNo, amount: amt });
      setResult({ ok: true, msg: `✓ ${txType === 'deposit' ? 'Deposited' : 'Withdrawn'} Rs. ${amt.toLocaleString()}. New balance: Rs. ${(res as any).balance?.toLocaleString()}` });
      setAmount(''); setAccNo('');
      AccountService.getBranchAccounts().then(setAccounts).catch(() => {});
      fetchActivities();
    } catch (e: any) {
      setResult({ ok: false, msg: e.response?.data || 'Transaction failed' });
    } finally { setLoading(false); }
  };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Activity size={16} /> Branch Activity Log</h3>
            <input 
              type="date" 
              value={activityDate} 
              onChange={(e) => setActivityDate(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01443b]"
            />
          </div>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No recent activities</p>
            ) : activities.map((act, idx) => {
              let icon = <Activity size={16} />;
              let colorClass = "bg-slate-100 text-slate-600";
              let label = act.type;
              
              if (act.type === 'DEPOSIT') {
                icon = <ArrowDownLeft size={16} />; colorClass = "bg-green-100 text-green-700"; label = "මුදල් තැන්පතුව (Cash Deposit)";
              } else if (act.type === 'WITHDRAWAL') {
                icon = <ArrowUpRight size={16} />; colorClass = "bg-red-100 text-red-700"; label = "මුදල් ආපසු ගැනීම (Cash Withdrawal)";
              } else if (act.type === 'NEW_SAVINGS') {
                icon = <UserPlus size={16} />; colorClass = "bg-blue-100 text-blue-700"; label = "නව ඉතුරුම් ගිණුමක් විවෘත කිරීම (New Savings)";
              } else if (act.type === 'NEW_FD') {
                icon = <Lock size={16} />; colorClass = "bg-purple-100 text-purple-700"; label = "නව ස්ථාවර තැන්පතුවක් විවෘත කිරීම (New FD)";
              } else if (act.type === 'INITIAL_DEPOSIT') {
                icon = <ArrowDownLeft size={16} />; colorClass = "bg-emerald-100 text-emerald-700"; label = "ආරම්භක තැන්පතුව (Initial Deposit)";
              } else if (act.type === 'FD_MATURED') {
                icon = <CheckCircle size={16} />; colorClass = "bg-amber-100 text-amber-700"; label = "ස්ථාවර තැන්පතුවක් කල් පිරීම (FD Matured)";
              } else if (act.type === 'LOAN_DISBURSEMENT') {
                icon = <ArrowUpRight size={16} />; colorClass = "bg-indigo-100 text-indigo-700"; label = "ණය මුදා හැරීම (Loan Disbursement)";
              } else if (act.type === 'LOAN_REPAYMENT') {
                icon = <ArrowDownLeft size={16} />; colorClass = "bg-teal-100 text-teal-700"; label = "ණය වාරික ගෙවීම (Loan Repayment)";
              } else if (act.type === 'PAWN_ISSUE') {
                icon = <ArrowUpRight size={16} />; colorClass = "bg-yellow-100 text-yellow-700"; label = "උකස් අත්තිකාරම් නිකුතුව (Pawn Advance)";
              } else if (act.type === 'PAWN_REPAYMENT') {
                icon = <ArrowDownLeft size={16} />; colorClass = "bg-orange-100 text-orange-700"; label = "උකස් වාරික ගෙවීම (Pawn Repayment)";
              }

              return (<div key={act.id || idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition" onClick={() => setAccNo(act.reference)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800 truncate">{label}</p>
                      <p className="text-sm font-black text-slate-800 whitespace-nowrap">Rs. {Number(act.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs font-mono text-slate-500">{act.reference || 'N/A'}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{new Date(act.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ValuerView() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ nic: '', grossWeight: '', netWeight: '', purity: '', advanceAmount: '' });
  const interestRate = 13;
  const assessedValue = form.netWeight ? (parseFloat(form.netWeight) * 12000).toFixed(2) : '0.00';
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Gem}           label="Active Pawn Tickets" value="34"   color="text-yellow-600" />
        <StatCard icon={Award}         label="Gold Assessed Today"  value="6"   color="text-amber-600" />
        <StatCard icon={AlertTriangle} label="Expiring This Week"   value="2"   color="text-red-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-lg">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Gem size={16} className="text-yellow-600" /> Issue New Pawn Ticket</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Member NIC', key: 'nic', placeholder: '200XXXXXXXX' },
            { label: 'Gross Weight (g)', key: 'grossWeight', placeholder: '5.5' },
            { label: 'Net Weight (g)', key: 'netWeight', placeholder: '5.0' },
            { label: 'Purity (Karat)', key: 'purity', placeholder: '22' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-500 text-xs">Assessed Value</p><p className="font-bold text-slate-800">Rs. {parseFloat(assessedValue).toLocaleString()}</p></div>
          <div><p className="text-slate-500 text-xs">Interest Rate (p.a.)</p><p className="font-bold text-slate-800">{interestRate}%</p></div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">Advance Amount (Rs.)</label>
          <input value={form.advanceAmount} onChange={e => setForm(p => ({ ...p, advanceAmount: e.target.value }))} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>
        <button onClick={() => (window as any).showToast('Pawn Ticket issued successfully!')} className="mt-5 w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition">Issue Pawn Ticket</button>
      </div>
    </div>
  );
}

function CustomerServiceView({ activeTab, onTabChange, readOnly, confirmDialog, setConfirmDialog }: { activeTab: string, onTabChange?: (tab: string) => void, readOnly?: boolean, confirmDialog: any, setConfirmDialog: any }) {
  const { t, language } = useLanguage();
  const [showOpenAccountForm, setShowOpenAccountForm] = useState(false);
  const [showOpenFdForm, setShowOpenFdForm] = useState(false);
  const [showViewAccount, setShowViewAccount] = useState<{show: boolean, accountId: string|null}>({show: false, accountId: null});
  const [showMemberAccountsModal, setShowMemberAccountsModal] = useState(false);
  const [selectedMemberForAccounts, setSelectedMemberForAccounts] = useState<any>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestModalMonth, setInterestModalMonth] = useState<string>('');
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);

  const getMemberName = (memberId: string, accNo?: string) => {
    const m = members.find(mem => mem.memberId === memberId);
    if (m) {
      if (language === 'si' && m.fullNameSinhala) {
        return m.fullNameSinhala;
      }
      return m.nameWithInitials || m.fullName || m.fullNameSinhala || 'Unknown';
    }
    if (accNo) {
      const acc = accounts.find(a => a.accountNumber === accNo);
      if (acc && acc.childName) return acc.childName + " (Child)";
    }
    return 'Unknown';
  };

  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [loans, setLoans] = useState<LoanService.Loan[]>([]);
  const [loanSearch, setLoanSearch] = useState('');
  const [loanFilter, setLoanFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'COMPLETED'>('ACTIVE');
  const [viewLoan, setViewLoan] = useState<LoanService.Loan | null>(null);
  const [openNoticeOnModal, setOpenNoticeOnModal] = useState(false);
  const [savingsTypes, setSavingsTypes] = useState<AccountService.SavingsAccountType[]>([]);
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [showRegModal, setShowRegModal] = useState(false);
  const [memberTypeFilter, setMemberTypeFilter] = useState<'ALL' | 'MEMBERS' | 'NON_MEMBERS'>('ALL');
  const [showMemberChoiceModal, setShowMemberChoiceModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSelectedLoan, setGlobalSelectedLoan] = useState<any>(null);
  const [viewAccount, setViewAccount] = useState<AccountService.AccountData | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [accError, setAccError] = useState('');
  const [isChildReg, setIsChildReg] = useState(false);
  const [guardianNic, setGuardianNic] = useState('');
  const [guardianMemberNo, setGuardianMemberNo] = useState('');
  const [guardianSearch, setGuardianSearch] = useState('');
  const [guardianSearchResults, setGuardianSearchResults] = useState<any[]>([]);
  const [showGuardianDropdown, setShowGuardianDropdown] = useState(false);
  const [selectedGuardianData, setSelectedGuardianData] = useState<any>(null);
  const initialFormState: any = { isMember: true, membershipNumber: '', nameWithInitials: '', fullName: '', fullNameSinhala: '', nic: '', dateOfBirth: '', gender: 'MALE', maritalStatus: 'UNMARRIED', address: '', province: '', contactNumber: '', belongsToOtherSociety: false, otherSocietyName: '', numberOfShares: '' as number | string, photographUrl: '', digitalSignatureUrl: '' };
  const [form, setForm] = useState(initialFormState);
  const [editingOriginalForm, setEditingOriginalForm] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, onConfirm: () => void, title: string, message: string}>({isOpen: false, onConfirm: () => {}, title: '', message: ''});
  const [accForm, setAccForm] = useState({ accountType: 'NORMAL', initialDeposit: 1000, childName: '', childBirthCertificate: '', childDateOfBirth: '' });
  const [accCustomerType, setAccCustomerType] = useState<'true' | 'false' | null>(null);
  const [savingsTab, setSavingsTab] = useState<'SOCIETY' | 'NON_SOCIETY'>('SOCIETY');
  const [photoProgress, setPhotoProgress] = useState(0);
  const [signatureProgress, setSignatureProgress] = useState(0);
  
  // Passbook state
  const [showPassbook, setShowPassbook] = useState<string | null>(null);
  const [passbookData, setPassbookData] = useState<{ account: any; transactions: any[]; dailyBalances: any[] } | null>(null);
  const [passbookLoading, setPassbookLoading] = useState(false);

  // Global Transaction state
  const [txAmount, setTxAmount] = useState('');
  const [txAccNo, setTxAccNo] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [txResult, setTxResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // Row Transaction Modal state
  const [rowTxAction, setRowTxAction] = useState<TransactionAction | null>(null);
  const [rowTxAccount, setRowTxAccount] = useState<AccountService.AccountData | null>(null);
  const [viewingFd, setViewingFd] = useState<any>(null);
  const [renewFd, setRenewFd] = useState<any>(null);
  const [monitoringFd, setMonitoringFd] = useState<any>(null);
  const [fixedDeposits, setFixedDeposits] = useState<any[]>([]);
  const [loanLedgers, setLoanLedgers] = useState<any[]>([]);
  const [loanActivityDate, setLoanActivityDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [activities, setActivities] = useState<any[]>([]);
  const [activityDate, setActivityDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [activityDetails, setActivityDetails] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [fdTypes, setFdTypes] = useState<any[]>([]);
  const [fdSearch, setFdSearch] = useState('');
  const [fdLoading, setFdLoading] = useState(false);
  const [fdCategoryFilter, setFdCategoryFilter] = useState<'ALL'|'NORMAL'|'SENIOR'|'CHILD'>('ALL');
  const [fdStatusFilter, setFdStatusFilter] = useState<'ALL'|'ACTIVE'|'MATURING_SOON'|'MATURED'>('ALL');
  const [alertConfig, setAlertConfig] = useState<{message: string, isSuccess?: boolean} | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoProgress(10);
      setForm(p => ({ ...p, photographUrl: '' }));
      
      const interval = setInterval(() => {
        setPhotoProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 15;
        });
      }, 50);

      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          setForm(p => ({ ...p, photographUrl: reader.result as string }));
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureProgress(10);
      setForm(p => ({ ...p, digitalSignatureUrl: '' }));
      
      const interval = setInterval(() => {
        setSignatureProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 15;
        });
      }, 50);

      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          setForm(p => ({ ...p, digitalSignatureUrl: reader.result as string }));
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchActivities = () => {
    setLoadingActivity(true);
    const branchId = AuthService.getCurrentUser()?.branchId || 1;
    Promise.all([
      AccountService.getBranchActivities(activityDate),
      LoanService.getBranchTransactions(branchId).catch(() => []),
      PawningService.getBranchTransactions(branchId).catch(() => [])
    ]).then(([accActivities, loanTxs, pawnTxs]) => {
      const mappedLoan = loanTxs.map((tx: any) => ({
        id: tx.transactionId,
        type: tx.transactionType,
        amount: tx.amount,
        timestamp: tx.transactionTimestamp,
        reference: tx.reference,
        memberId: tx.processedBy,
        balanceAfter: tx.balanceAfter
      }));
      const mappedPawn = pawnTxs.map((tx: any) => ({
        id: tx.transactionId,
        type: tx.transactionType,
        amount: tx.amount,
        timestamp: tx.transactionTimestamp,
        reference: tx.reference,
        memberId: tx.processedBy,
        balanceAfter: tx.balanceAfter
      }));
      
      let combined = [...accActivities, ...mappedLoan, ...mappedPawn];
      if (activityDate) {
         combined = combined.filter(c => c.timestamp && c.timestamp.startsWith(activityDate));
      }
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(combined);
    }).catch(() => {})
      .finally(() => setLoadingActivity(false));
  };

  useEffect(() => {
    fetchActivities();
  }, [activityDate]);

  useEffect(() => {
    AccountService.getBranchMembers().then(setMembers).catch(() => {});
  }, []);

  const fetchData = () => {
    AccountService.getBranchMembers().then(setMembers).catch(() => {});
    AccountService.getBranchAccounts().then(setAccounts).catch(() => {});
    LoanService.getLoans().then(setLoans).catch(() => {});
    const bId = AuthService.getCurrentUser()?.branchId || 1;
    LoanService.getBranchLedger(bId).then(setLoanLedgers).catch(() => {});
    AccountService.getSavingsAccountTypes().then(setSavingsTypes).catch(() => {});
    AccountService.getFixedDepositTypes().then(setFdTypes).catch(() => {});
    setFdLoading(true);
    AccountService.getFixedDeposits().then(setFixedDeposits).catch(() => {}).finally(() => setFdLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleGuardianSearch = (q: string) => {
    setGuardianSearch(q);
    if (!q) {
      setShowGuardianDropdown(false);
      return;
    }
    const res = members.filter(m => 
      m.nic.toLowerCase().includes(q.toLowerCase()) || 
      m.fullName.toLowerCase().includes(q.toLowerCase()) || 
      (m.membershipNumber && m.membershipNumber.toLowerCase().includes(q.toLowerCase()))
    );
    setGuardianSearchResults(res);
    setShowGuardianDropdown(true);
  };

  const selectGuardian = (m: any) => {
    setGuardianNic(m.nic);
    setGuardianMemberNo(m.membershipNumber || '');
    setGuardianSearch(m.nameWithInitials || m.fullName);
    setSelectedGuardianData(m);
    setShowGuardianDropdown(false);
  };

  const isNonMembersTab = false;
  const displayedMembers = members.filter(m => {
    if (memberTypeFilter === 'MEMBERS') return m.isMember !== false;
    if (memberTypeFilter === 'NON_MEMBERS') return m.isMember === false;
    return true;
  });
  const filtered = members.filter(m => {
    const matchesSearch = search ? (
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.nic.toLowerCase().includes(search.toLowerCase()) ||
      (m.membershipNumber && m.membershipNumber.toLowerCase().includes(search.toLowerCase()))
    ) : true;
    
    let matchesType = true;
    if (memberTypeFilter === 'MEMBERS') matchesType = m.isMember !== false;
    if (memberTypeFilter === 'NON_MEMBERS') matchesType = m.isMember === false;
    
    let isMatch = matchesSearch && matchesType;
    
    if (ageFilter !== 'ALL') {
      const ageCat = m.ageCategory || 'ADULT';
      isMatch = isMatch && ageCat === ageFilter;
    }
    
    return isMatch;
  });

  const hasFormChanged = !(form as any).memberId || JSON.stringify(form) !== JSON.stringify(editingOriginalForm);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // Manual validation
    if (!form.membershipNumber || !form.nic || !form.nameWithInitials || !form.fullName || !form.dateOfBirth || !form.address || !form.contactNumber) {
        setRegError("කරුණාකර සියලුම අනිවාර්ය තොරතුරු (තරුව * සලකුණු කර ඇති) සම්පූර්ණ කරන්න.");
        return;
    }
    if (isChildReg && !selectedGuardianData && !guardianNic) {
        setRegError("කරුණාකර භාරකරුගේ ජා.හැ.ප අංකය (Guardian NIC) ඇතුළත් කරන්න.");
        return;
    }

    if ((form as any).memberId) {
      setConfirmModal({
        isOpen: true,
        title: "තහවුරු කරන්න",
        message: "ඔබට මෙම සාමාජික තොරතුරු යාවත්කාලීන කිරීමට අවශ්‍ය බව සහතිකද?",
        onConfirm: processRegistration
      });
      return;
    }
    processRegistration();
  };

  const processRegistration = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setRegError(''); setLoading(true);
    try {
      const sharePrice = Number(localStorage.getItem('SYS_SHARE_PRICE')) || 100.0;
      const numShares = Number(form.numberOfShares) || 0;
      const payload = { 
        ...form, 
        numberOfShares: numShares,
        shareAmount: numShares * sharePrice,
        ageCategory: isChildReg ? 'CHILD' : 'ADULT',
        guardianNic: isChildReg ? guardianNic : null,
        guardianMemberNo: isChildReg ? guardianMemberNo : null
      };
      await AccountService.registerMember(payload as any);
      setShowRegModal(false);
      setForm(initialFormState);
      fetchData();
      (window as any).showToast?.((form as any).memberId ? 'සාමාජික තොරතුරු සාර්ථකව යාවත්කාලීන කරන ලදී! (Successfully updated!)' : 'නව සාමාජිකයා සාර්ථකව ලියාපදිංචි කරන ලදී! (Successfully registered!)', 'success');
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.message || data?.error || (typeof data === 'string' ? data : 'Registration failed. Check details.');
      setRegError(msg);
    } finally { setLoading(false); }
  };

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setAccError(''); setLoading(true);
    try {
      await AccountService.openAccount({ memberId: selectedMemberId, ...accForm });
      setShowAccModal(false);
      setAccCustomerType(null);
      fetchData();
      (window as any).showToast?.('නව ගිණුම සාර්ථකව ආරම්භ කරන ලදී! (Account opened successfully!)', 'success');
    } catch (err: any) {
      setAccError(err.response?.data || 'Failed to open account');
    } finally { setLoading(false); }
  };

  const handleViewPassbook = async (accountId: string) => {
    setShowPassbook(accountId);
    setPassbookLoading(true);
    setPassbookData(null);
    try {
      const data = await AccountService.getPassbook(accountId);
      setPassbookData(data);
    } catch (err) {
      console.error('Failed to fetch passbook:', err);
    } finally {
      setPassbookLoading(false);
    }
  };

  const handleViewActivity = async (act: any) => {
    setLoadingActivity(true);
    try {
      let details: any = {};
      let memberName = 'Unknown';

      if (act.type === 'LOAN_DISBURSEMENT' || act.type === 'LOAN_REPAYMENT') {
        const loansList = await LoanService.getLoans();
        const loan = loansList.find((l: any) => l.loanNumber === act.reference || l.loanId === act.reference);
        if (loan) {
          details.transactionId = act.id;
          details.accountNumber = (loan as any).loanNumber || loan.loanId;
          details.amount = act.amount;
          details.balanceAfter = act.balanceAfter;
          details.memberId = loan.memberId;
          details.branchId = loan.branchId;
          details.timestamp = act.timestamp;
          if (loan.memberId) {
            const member = await AccountService.getMemberById(loan.memberId);
            memberName = language === 'si' && member.fullNameSinhala ? member.fullNameSinhala : (member.fullName || 'Unknown');
          }
        }
      } else if (act.type === 'PAWN_ISSUE' || act.type === 'PAWN_REPAYMENT') {
        const ticketsList = await PawningService.getAllTickets();
        const ticket = ticketsList.find(t => String(t.ticketNumber) === String(act.reference));
        if (ticket) {
          details.transactionId = act.id;
          details.accountNumber = ticket.ticketNumber;
          details.amount = act.amount;
          details.balanceAfter = act.balanceAfter;
          details.memberId = ticket.memberId;
          details.branchId = ticket.branchId;
          details.timestamp = act.timestamp;
          if (ticket.memberId) {
            const member = await AccountService.getMemberById(ticket.memberId);
            memberName = language === 'si' && member.fullNameSinhala ? member.fullNameSinhala : (member.fullName || 'Unknown');
          }
        }
      } else {
        details = await AccountService.getActivityDetails(act.type, act.id);
        if (details.memberId) {
          try {
            const member = await AccountService.getMemberById(details.memberId);
            if (language === 'si' && member.fullNameSinhala) {
              memberName = member.fullNameSinhala;
            } else {
              memberName = member.fullName || member.fullNameSinhala || 'Unknown';
            }
          } catch (e) {
            if (details.accountNumber) {
              const acc = accounts.find(a => a.accountNumber === details.accountNumber);
              if (acc && acc.childName) memberName = acc.childName + " (Child)";
            }
          }
        }
      }

      setActivityDetails({ ...act, ...details, _type: act.type, _memberName: memberName });
    } catch (e) {
      console.error('Failed to view activity details:', e);
      (window as any).showToast("Failed to fetch activity details");
    } finally {
      setLoadingActivity(false);
    }
  }

  const totalBranchBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  const getAccountCount = (memberId?: string) => {
    const savingsCount = accounts.filter(a => a.memberId === memberId).length;
    const fdCount = fixedDeposits.filter(f => f.memberId === memberId).length;
    const loanCount = loans.filter(l => l.memberId === memberId).length;
    return savingsCount + fdCount + loanCount;
  };

  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = a.accountNumber.toLowerCase().includes(search.toLowerCase());
    const member = members.find(m => m.memberId === a.memberId);
    // If member not found, default to false (treat as non-member)
    const isSociety = member ? member.isMember !== false : false; 
    const matchesTab = savingsTab === 'SOCIETY' ? isSociety : !isSociety;
    return matchesSearch && matchesTab;
  });

  if (activeTab === 'handovers') {
    return <FieldHandoversView members={members} loans={loans} />;
  }

  if (activeTab === 'overview') {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <LayoutDashboard size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Senior Officer Overview</h3>
        <p className="text-slate-500">Welcome to your dashboard. Use the sidebar to manage members and financial accounts.</p>
      </div>
    );
  }

  if (activeTab === 'gl') {
    const currentUser = AuthService.getCurrentUser();
    return <LedgerView branchId={currentUser?.branchId || 1} />;
  }

  if (activeTab === 'summary-ledger') {
    const currentUser = AuthService.getCurrentUser();
    return <SummaryLedgerView branchId={currentUser?.branchId || 1} members={members} />;
  }

  if (activeTab === 'vault-cash') {
    const currentUser = AuthService.getCurrentUser();
    return <VaultCashView branchId={currentUser?.branchId || 1} />;
  }

  if (activeTab === 'fds') {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const getMemberName = (memberId: string) => {
  const { t } = useLanguage();
      const m = members.find(mem => mem.memberId === memberId);
      return m ? (m.nameWithInitials || m.fullName || m.fullNameSinhala || 'Unknown') : 'Unknown';
    };

    const getFdCategory = (fd: any): string => {
      const typeObj = fdTypes.find(t => t.id === fd.typeId || t.id === fd.fdTypeId);
      if (typeObj) {
        if (typeObj.code?.startsWith('FD_SNR')) return 'SENIOR';
        if (typeObj.code?.startsWith('FD_CHD')) return 'CHILD';
        return 'NORMAL';
      }
      
      // Fallback
      const num = fd.termMonths || 0;
      const rate = Number(fd.interestRate);
      if (rate >= 12) return 'SENIOR';
      if (num <= 3 && rate === 0) return 'CHILD';
      return 'NORMAL';
    };

    const getFdStatus = (fd: any): string => {
      if (fd.status && fd.status !== 'ACTIVE') return fd.status;
      const maturity = new Date(fd.maturityDate);
      if (maturity <= today) return 'MATURED';
      if (maturity <= thirtyDaysLater) return 'MATURING_SOON';
      return 'ACTIVE';
    };

    const filteredFDs = fixedDeposits.filter(fd => {
      const name = getMemberName(fd.memberId);
      const status = getFdStatus(fd);
      const category = getFdCategory(fd);
      const matchSearch = (fd.fdNumber || '').toLowerCase().includes(fdSearch.toLowerCase()) || name.toLowerCase().includes(fdSearch.toLowerCase());
      const matchCategory = fdCategoryFilter === 'ALL' || category === fdCategoryFilter;
      const matchStatus = fdStatusFilter === 'ALL' || status === fdStatusFilter;
      return matchSearch && matchCategory && matchStatus;
    });

    const totalPrincipal = fixedDeposits.reduce((sum, fd) => sum + Number(fd.principalAmount || 0), 0);
    const activeCount = fixedDeposits.filter(fd => getFdStatus(fd) === 'ACTIVE').length;
    const maturingSoonCount = fixedDeposits.filter(fd => getFdStatus(fd) === 'MATURING_SOON').length;
    const maturedCount = fixedDeposits.filter(fd => getFdStatus(fd) === 'MATURED').length;

    return (
      <div className="space-y-4">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-[#025a4e] to-[#037a68] rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shadow-inner">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t(`ස්ථාවර තැන්පතු (Fixed Deposits)`)}</h3>
              <p className="text-emerald-200 text-[11px] font-medium mt-0.5">{t(`කාලීන තැන්පතු කළමනාකරණය`)}</p>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowOpenFdForm(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#01291f] px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Lock size={14} /> {t(`නව ගිණුමක් අරඹන්න`)}</button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`මුළු ගිණුම්`)}</p>
            <p className="text-2xl font-black text-slate-800">{fixedDeposits.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t(`සියලු ගිණුම්`)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`තැන්පතු මුදල`)}</p>
            <p className="text-xl font-black text-[#025a4e]">Rs. {totalPrincipal.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t(`සියලු තැන්පතු එකතුව`)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 shadow-sm">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">{t(`කල් පිරීමට නියමිත`)}</p>
            <p className="text-2xl font-black text-amber-600">{maturingSoonCount}</p>
            <p className="text-[10px] text-amber-400 mt-0.5">{t(`දින 30 ඇතුලත`)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`කල් පිරුණු`)}</p>
            <p className="text-2xl font-black text-slate-600">{maturedCount}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
            {/* Search - full width row */}
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={fdSearch}
                onChange={e => setFdSearch(e.target.value)}
                placeholder={t(`ගිණුම් අංකය හො නම සොයන්න...`)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#025a4e] transition-all"
              />
            </div>

            {/* Dropdowns row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">{t(`වර්ගය:`)}</label>
                <select
                  value={fdCategoryFilter}
                  onChange={e => setFdCategoryFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#025a4e] transition-all cursor-pointer"
                >
                  <option value="ALL">{t(`සියල්ල`)}</option>
                  <option value="NORMAL">{t(`සාමාන්‍ය ස්ථාවර තැන්පතු`)}</option>
                  <option value="SENIOR">{t(`ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු`)}</option>
                  <option value="CHILD">{t(`ළමා ස්ථාවර තැන්පතු`)}</option>
                </select>
              </div>

              {/* Status dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">{t(`වර්තමාන තත්වය:`)}</label>
                <select
                  value={fdStatusFilter}
                  onChange={e => setFdStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#025a4e] transition-all cursor-pointer"
                >
                  <option value="ALL">{t(`සියල්ල`)}</option>
                  <option value="ACTIVE">{t(`ක්‍රියාත්මක`)}</option>
                  <option value="MATURING_SOON">{t(`කල් පිරීමට නියමිත`)}</option>
                  <option value="MATURED">{t(`කල් පිරුණු`)}</option>
                </select>
              </div>

              <p className="ml-auto text-xs text-slate-400">{t(`පෙන්වන්නේ`)}<span className="font-bold text-slate-700">{filteredFDs.length}</span> / {fixedDeposits.length} ගිණුම්</p>
            </div>
          </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`ගිණුම්`)}<br/>{t(`අංකය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`තැන්පත්කරු`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`වර්ගය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`තැන්පතු මුදල (Rs.)`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`කාලය /`)}<br/>{t(`පොළිය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`කල් පිරීමේ දිනය`)}</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`තත්ත්වය`)}</th>
                <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`ක්‍රියාකාරකම්`)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {fdLoading ? (
                <tr><td colSpan={8} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-2 text-slate-400"><div className="w-8 h-8 border-2 border-slate-300 border-t-[#025a4e] rounded-full animate-spin"></div><span className="text-sm">Loading...</span></div></td></tr>
              ) : filteredFDs.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-12 text-center text-slate-400">
                  <Lock size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="font-semibold">{fdSearch || fdCategoryFilter !== 'ALL' || fdStatusFilter !== 'ALL' ? 'ගැලපෙන ස්ථාවර තැන්පතු කිසිවක් හමුවුණේ නැත.' : 'කිසිදු ස්ථාවර තැන්පතු ගිණුමක් හමුවුණේ නැත.'}</p>
                </td></tr>
              ) : filteredFDs.map((fd, i) => {
                const status = getFdStatus(fd);
                const maturityDate = new Date(fd.maturityDate);
                const daysLeft = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const category = getFdCategory(fd);
                const categoryLabel = category === 'NORMAL' ? 'සාමාන්‍ය' : category === 'SENIOR' ? 'ජ්‍යෙෂ්ඨ' : 'ළමා';
                const categoryStyle = category === 'NORMAL' ? 'bg-blue-50 text-blue-700 border-blue-200' : category === 'SENIOR' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-pink-50 text-pink-700 border-pink-200';
                return (
                  <tr key={i} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-3 py-3 border-r border-slate-100">
                      <span className="font-mono font-bold text-[#025a4e] bg-emerald-50 px-2 py-1 rounded-lg text-[11px]">{fd.fdNumber}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-slate-100 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#025a4e] to-teal-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                          {getMemberName(fd.memberId).charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 text-sm whitespace-normal">{getMemberName(fd.memberId)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap border-r border-slate-100">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${categoryStyle}`}>{categoryLabel}</span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap border-r border-slate-100">
                      <span className="font-mono font-black text-slate-800 text-sm">Rs. {Number(fd.principalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap border-r border-slate-100">
                      <span className="block font-bold text-slate-700 text-xs">{fd.termMonths} මාස</span>
                      <span className="text-[10px] font-bold text-indigo-500">{Number(fd.interestRate).toFixed(2)}% (වා.පො.)</span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap border-r border-slate-100">
                      <span className="block font-medium text-slate-700 text-xs">{fd.maturityDate}</span>
                      {daysLeft > 0 && daysLeft <= 60 && (
                        <span className="text-[10px] font-bold text-amber-500">දින {daysLeft}කින් කල්පිරේ</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap border-r border-slate-100">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${
                        status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        status === 'MATURING_SOON' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        status === 'INACTIVE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        status === 'CLOSED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {status === 'ACTIVE' ? 'ක්‍රියාකාරී' : status === 'MATURING_SOON' ? 'කල් පිරීමට ආසන්නයි' : status === 'INACTIVE' ? 'අක්‍රියයි' : status === 'CLOSED' ? 'වසා ඇත' : 'කල් පිරී ඇත'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewingFd(fd)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#025a4e] bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">{t(`බලන්න`)}</button>
                        {!readOnly && (
                          <>

                            <button onClick={() => setMonitoringFd(fd)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1 border border-slate-300 shadow-sm"><Activity size={13} className="text-slate-500" /><span>{t(`තත්වය`)}</span></button>
                            <button 
                              onClick={() => { 
                                setConfirmDialog({ 
                                  isOpen: true, 
                                  title: fd.status === 'ACTIVE' || !fd.status ? 'ස්ථාවර තැන්පතුව අක්‍රිය කරන්නද?' : 'ස්ථාවර තැන්පතුව සක්‍රිය කරන්නද?', 
                                  message: `මෙම ස්ථාවර තැන්පතුව ${(fd.status === 'ACTIVE' || !fd.status) ? 'අක්‍රිය' : 'සක්‍රිය'} කිරීමට ඔබ ස්ථිරද?`, 
                                  variant: (fd.status === 'ACTIVE' || !fd.status) ? 'warning' : 'info', 
                                  onConfirm: () => { 
                                    AccountService.updateFixedDepositStatus(fd.fdId, (fd.status === 'ACTIVE' || !fd.status) ? 'INACTIVE' : 'ACTIVE')
                                      .then(() => { 
                                        setAlertConfig({message: 'තත්වය සාර්ථකව වෙනස් කරන ලදී', isSuccess: true}); 
                                        fetchData(); 
                                      })
                                      .catch(err => setAlertConfig({message: 'තත්වය වෙනස් කිරීම අසාර්ථකයි'})); 
                                    setConfirmDialog(d => ({ ...d, isOpen: false })); 
                                  } 
                                }); 
                              }} 
                              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center border shadow-sm ${(fd.status === 'ACTIVE' || !fd.status) ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'}`}
                              title={(fd.status === 'ACTIVE' || !fd.status) ? 'Deactivate' : 'Activate'}
                            >
                              <Power size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>

        {/* Row Transaction Modal */}
        {rowTxAction && (
          <TransactionModal 
            accountId={rowTxAccount?.accountId || ''}
            accountNumber={rowTxAccount?.accountNumber || ''}
            accountType={rowTxAccount?.accountType || ''}
            balance={Number(rowTxAccount?.balance || 0)}
            accountHolder={rowTxAccount?.childName || members.find(m => m.memberId === rowTxAccount?.memberId)?.nameWithInitials || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullNameSinhala || 'N/A'}
            action={rowTxAction}
            allAccounts={accounts}
            members={members}
            isMatured={rowTxAccount?.isMatured}
            linkedSavingsAccount={(rowTxAccount as any)?.linkedSavingsAccount}
            memberId={(rowTxAccount as any)?.memberId}
            penaltyAmount={(rowTxAccount as any)?.penaltyAmount}
            principalAmount={(rowTxAccount as any)?.principalAmount}
            onClose={() => { setRowTxAction(null); setRowTxAccount(null); }}
            onSuccess={() => {
              setRowTxAction(null); setRowTxAccount(null);
              // Refresh accounts
              fetchData();
            }}
          />
        )}

        {/* FD View Modal */}
        {viewingFd && (
          <FdViewModal 
            fd={viewingFd} 
            members={members}
            savingsAccounts={accounts}
            onClose={() => setViewingFd(null)} 
          />
        )}

        {/* FD Monitor Modal */}
        {monitoringFd && (
          <FdMonitorModal 
            fd={monitoringFd} 
            memberName={getMemberName(monitoringFd.memberId)}
            onClose={() => setMonitoringFd(null)}
            onRelease={(isMatured, releaseAmount, penaltyAmount, principalAmount) => {
              setMonitoringFd(null);
              const linkedAcc = accounts.find(a => a.accountId === monitoringFd.linkedSavingsAccountId);
              setRowTxAccount({ accountId: monitoringFd.fdId, accountNumber: monitoringFd.fdNumber, accountType: 'FIXED_DEPOSIT', balance: releaseAmount, memberId: monitoringFd.memberId, childName: '', isMatured, linkedSavingsAccount: linkedAcc ? linkedAcc.accountNumber : 'Not Linked', penaltyAmount, principalAmount } as any);
              setRowTxAction('CLOSE_FD');
            }}
            onRenew={() => {
              setMonitoringFd(null);
              setRenewFd(monitoringFd);
            }}
          />
        )}

        {/* FD Renew Modal */}
        {renewFd && (
          <RenewFixedDepositModal
            fd={renewFd}
            onClose={() => setRenewFd(null)}
            onSuccess={() => {
              setRenewFd(null);
              setAlertConfig({message: 'ස්ථාවර තැන්පතුව සාර්ථකව අලුත් කරන ලදී!', isSuccess: true});
              fetchData();
            }}
          />
        )}

        {/* Modal for Open FD */}
        {showOpenFdForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full my-8">
              <OpenFixedDepositForm onClose={() => { setShowOpenFdForm(false); fetchData(); }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }

  if (activeTab === 'pawning_approvals') {

    return <PawningApprovalsView />;

  }



  if (activeTab === 'pawning') {
    return <PawningModule branchId={user?.branchId || 1} />;
  }

  if (activeTab === 'loans' || activeTab === 'customer-loans') {
    const totalLoansCount = loans.length;
    const activeLoansCount = loans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED').length;
    const committeeApprovedCount = loans.filter(l => l.status === 'APPROVED').length;
    const totalLoanAmount = loans.reduce((sum, l) => sum + (Number(l.requestedAmount) || 0), 0);
    
    const requiresCommittee = (l: any) => {
      const typeStr = (l.loanType?.name || l.loanTypeStr || '').toLowerCase();
      return typeStr.includes('සේවක') || typeStr.includes('කෙටි');
    };

    const overdueSavedIds = new Set<string>(JSON.parse(localStorage.getItem('hmcs_overdue_loans') || '[]'));

    const filteredLoans = loans.filter(l => {
      const isSavedOverdue = overdueSavedIds.has(l.loanId);
      if (isSavedOverdue) l.status = 'OVERDUE';
      if (loanFilter === 'ACTIVE' && !(l.status === 'ACTIVE' || l.status === 'DISBURSED') && !isSavedOverdue) return false;
      if (loanFilter === 'PENDING' && l.status !== 'PENDING' && !(l.status === 'APPROVED' && l.currentStage !== 'DISBURSED')) return false;
      if (loanFilter === 'OVERDUE' && !(l.status === 'OVERDUE' || l.isOverdue || isSavedOverdue || (l.overdueAmount && Number(l.overdueAmount) > 0))) return false;
      if (loanFilter === 'COMPLETED' && l.status !== 'COMPLETED') return false;
      const term = loanSearch.toLowerCase();
      const member = members.find(m => m.memberId === l.memberId);
      const nameMatch = member ? (member.fullName || member.fullNameSinhala || '').toLowerCase().includes(term) : false;
      const typeMatch = (l.loanType?.name || '').toLowerCase().includes(term);
      const accMatch = (l.accountNumber || '').toLowerCase().includes(term);
      const appMatch = (l.applicationNumber || (l.applicationData as any)?.applicationNumber || '').toLowerCase().includes(term);
      return nameMatch || typeMatch || accMatch || appMatch;
    });

    return (
      <div className="space-y-4">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shadow-inner">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t(`ණය ගිණුම් (Loan Accounts)`)}</h3>
              <p className="text-indigo-200 text-[11px] font-medium mt-0.5">{t(`ණය කළමනාකරණය (Loan Management)`)}</p>
            </div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Search size={14} /> {t(`වාරික ගෙවීම`)}</button>
              <button
                onClick={() => setShowLoanModal(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#01291f] px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                <FileText size={14} /> {t(`නව ණයක් ඉල්ලුම් කරන්න`)}</button>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`මුළු ගිණුම්`)}</p>
            <p className="text-2xl font-black text-slate-800">{totalLoansCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t(`සියලු ණය ගිණුම්`)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t(`මුළු ණය මුදල`)}</p>
            <p className="text-xl font-black text-indigo-700">Rs. {totalLoanAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t(`ඉල්ලුම් කළ ණය එකතුව`)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">{t(`කමිටුව අනුමත කළ`)}</p>
            <p className="text-2xl font-black text-emerald-700">{committeeApprovedCount}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">{t(`අනුමත වූ ණය`)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">{t(`සක්‍රීය ණය`)}</p>
            <p className="text-2xl font-black text-blue-600">{activeLoansCount}</p>
            <p className="text-[10px] text-blue-400 mt-0.5">{t(`දැනට ගෙවන ණය`)}</p>
          </div>
        </div>

        {/* Unified Data Table Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
            {/* Search - full width row */}
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={loanSearch} onChange={e => setLoanSearch(e.target.value)} placeholder={t(`ඉල්ලුම්පත් / ගිණුම් අංකය, සාමාජිකයා හෝ වර්ගය සොයන්න...`)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            {/* Dropdowns / Tabs row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100/80 rounded-xl p-1 border border-slate-200 overflow-x-auto w-full md:w-auto hide-scrollbar">
                <button onClick={() => setLoanFilter('ALL')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    loanFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  {t(`සියලුම ණය`)}</button>
                <button onClick={() => setLoanFilter('ACTIVE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    loanFilter === 'ACTIVE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  {t(`සක්‍රීය ණය`)}</button>
                                <button onClick={() => setLoanFilter('PENDING')}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    loanFilter === 'PENDING' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  අනුමැතිය ලැබිය යුතු ණය
                  {loans.some(l => l.status === 'PENDING' || (l.status === 'APPROVED' && l.currentStage !== 'DISBURSED')) && (
                    <span className="flex h-2 w-2 relative -mt-3 -ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button onClick={() => setLoanFilter('OVERDUE')}
                  className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    loanFilter === 'OVERDUE' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  {t(`කල්පසු වූ ණය`)}
                  {loans.some(l => l.status === 'OVERDUE' || l.isOverdue || (l.overdueAmount && Number(l.overdueAmount) > 0)) && (
                    <span className="flex h-2 w-2 relative -mt-3 -ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </button>
                <button onClick={() => setLoanFilter('COMPLETED')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    loanFilter === 'COMPLETED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}>
                  {t(`අවසන් කළ ණය`)}</button>
              </div>
              <p className="ml-auto text-xs text-slate-400">{t(`පෙන්වන්නේ`)}<span className="font-bold text-slate-700">{filteredLoans.length}</span> / {loans.length} ණය</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[800px]">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`ගිණුම්`)}<br/>{t(`අංකය`)}</th>
                  <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`සාමාජිකයා`)}</th>
                  <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`ණය වර්ගය`)}</th>
                  <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`මුදල (Rs.)`)}</th>
                  <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-rose-600 uppercase tracking-widest whitespace-nowrap">{t(`ගෙවීමට ඇති මුදල`)}</th>
                  <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{t(`තත්ත්වය`)}</th>
                  <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">{t(`ක්‍රියා`)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredLoans.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-12 text-center text-slate-400">
                    <FileText size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">{t(`ණය ගිණුම් කිසිවක් හමු නොවීය`)}</p>
                  </td></tr>
                ) : filteredLoans.map(l => {
                  const member = members.find(m => m.memberId === l.memberId);
                  return (
                  <tr key={l.loanId} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-3 py-3 border-r border-slate-100">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg text-[11px]">{l.accountNumber || 'N/A'}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-slate-100 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                          {member ? (member.nameWithInitials || member.fullName || member.fullNameSinhala || 'U').charAt(0) : (l.applicationData?.applicantName || l.applicationData?.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800 text-sm">{member ? (member.nameWithInitials || member.fullName || member.fullNameSinhala) : (l.applicationData?.applicantName || l.applicationData?.name || 'N/A')}</span>
                          <span className="block text-[10px] text-slate-500">{l.appliedDate || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center border-r border-slate-100">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                        {l.loanType?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap border-r border-slate-100">
                      <span className="font-mono font-black text-slate-800 text-sm">Rs. {Number(l.requestedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap border-r border-slate-100 bg-rose-50/20">
                      <LoanOutstandingCell loan={l} />
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap border-r border-slate-100">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {l.status === 'PENDING' ? 'විනිශ්චය වෙමින් පවතී' : 
                         l.status === 'APPROVED' ? 'අනුමතයි' : 
                         l.status === 'REJECTED' ? 'ප්‍රතික්ෂේපිතයි' : 
                         l.status === 'DISBURSED' ? 'මුදා හැර ඇත' : 
                         l.status === 'ACTIVE' ? 'සක්‍රීයයි' : 
                         l.status === 'COMPLETED' ? 'සම්පූර්ණයි' : 
                         l.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setViewLoan(l); setOpenNoticeOnModal(false); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200 shadow-sm" title={t('View Loan')}>
                          {(l.status === 'APPROVED' && l.currentStage !== 'DISBURSED' && l.status !== 'ACTIVE' && l.status !== 'COMPLETED') ? 'මුදා හරින්න' : 'බලන්න'}
                        </button>
                        {l.status === 'OVERDUE' && (
                          <button onClick={() => { setViewLoan(l); setOpenNoticeOnModal(true); }} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200 shadow-sm flex items-center gap-1" title="දැනුම්දීමේ ලිපිය">
                            <FileText size={13} className="text-amber-600" /> ලිපිය
                          </button>
                        )}
                        {!readOnly && (
                          <button onClick={() => { setConfirmDialog({ isOpen: true, title: 'ණය ගිණුම මකන්නද?', message: 'මෙම ණය ගිණුම මකා දැමීමට අවශ්‍ය බව විශ්වාසද? මෙය ආපසු හැරවිය නොහැක.', variant: 'danger', onConfirm: () => { LoanService.deleteLoan(l.loanId).then(() => { setAlertConfig({message: 'සාර්ථකව මකා දමන ලදී', isSuccess: true}); LoanService.getLoans().then(setLoans); }).catch(err => setAlertConfig({message: 'මකා දැමීම අසාර්ථකයි'})); setConfirmDialog(d => ({ ...d, isOpen: false })); } }); }} className="px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center border border-red-200 shadow-sm" title={t(`මකා දමන්න`)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
        {/* Loan Application Modal */}
        {showLoanModal && (
          <LoanApplicationModal 
            onClose={() => {
              setShowLoanModal(false);
              LoanService.getLoans().then(setLoans).catch(() => {});
            }} 
          />
        )}

        {/* Loan Detail & Approval Modal */}
        {viewLoan && (
          <LoanDetailModal
            loan={viewLoan}
            memberName={(() => {
              const m = members.find(m => m.memberId === viewLoan.memberId);
              return m ? (m.fullName || m.fullNameSinhala) : 'Unknown Member';
            })()}
            onClose={() => setViewLoan(null)}
            defaultOpenNotice={openNoticeOnModal}
            onUpdated={() => {
              setViewLoan(null);
              LoanService.getLoans().then(setLoans).catch(() => {});
            }}
          />
        )}
        {showGlobalSearch && (
          <GlobalLoanSearchModal
            onClose={() => setShowGlobalSearch(false)}
            onSelectLoan={(loan) => {
              setShowGlobalSearch(false);
              setGlobalSelectedLoan(loan);
            }}
            currentBranchId={user?.branchId}
          />
        )}
        {globalSelectedLoan && (
          <LoanDetailModal
            loan={globalSelectedLoan}
            onClose={() => setGlobalSelectedLoan(null)}
            onUpdated={() => {
              setGlobalSelectedLoan(null);
            }}
          />
        )}
      </div>
    );
  }
  if (activeTab === 'transactions') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Activity size={16} /> Branch Activity Log</h3>
              <input 
                type="date" 
                value={activityDate} 
                onChange={(e) => setActivityDate(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01443b]"
              />
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No recent activities</p>
              ) : activities.map((act, idx) => {
                let icon = <Activity size={16} />;
                let colorClass = "bg-slate-100 text-slate-600";
                let label = act.type;
                
                if (act.type === 'DEPOSIT') {
                  icon = <ArrowDownLeft size={16} />; colorClass = "bg-green-100 text-green-700"; label = "මුදල් තැන්පතුව (Cash Deposit)";
                } else if (act.type === 'WITHDRAWAL') {
                  icon = <ArrowUpRight size={16} />; colorClass = "bg-red-100 text-red-700"; label = "මුදල් ආපසු ගැනීම (Cash Withdrawal)";
                } else if (act.type === 'NEW_SAVINGS') {
                  icon = <UserPlus size={16} />; colorClass = "bg-blue-100 text-blue-700"; label = "නව ඉතුරුම් ගිණුමක් විවෘත කිරීම (New Savings)";
                } else if (act.type === 'NEW_FD') {
                  icon = <Lock size={16} />; colorClass = "bg-purple-100 text-purple-700"; label = "නව ස්ථාවර තැන්පතුවක් විවෘත කිරීම (New FD)";
                } else if (act.type === 'INITIAL_DEPOSIT') {
                  icon = <ArrowDownLeft size={16} />; colorClass = "bg-emerald-100 text-emerald-700"; label = "ආරම්භක තැන්පතුව (Initial Deposit)";
                } else if (act.type === 'FD_MATURED') {
                  icon = <CheckCircle size={16} />; colorClass = "bg-amber-100 text-amber-700"; label = "ස්ථාවර තැන්පතුවක් කල් පිරීම (FD Matured)";
                } else if (act.type === 'LOAN_DISBURSEMENT') {
                  icon = <ArrowUpRight size={16} />; colorClass = "bg-indigo-100 text-indigo-700"; label = "ණය මුදා හැරීම (Loan Disbursement)";
                } else if (act.type === 'LOAN_REPAYMENT') {
                  icon = <ArrowDownLeft size={16} />; colorClass = "bg-teal-100 text-teal-700"; label = "ණය වාරික ගෙවීම (Loan Repayment)";
                } else if (act.type === 'PAWN_ISSUE') {
                  icon = <ArrowUpRight size={16} />; colorClass = "bg-yellow-100 text-yellow-700"; label = "උකස් අත්තිකාරම් නිකුතුව (Pawn Advance)";
                } else if (act.type === 'PAWN_REPAYMENT') {
                  icon = <ArrowDownLeft size={16} />; colorClass = "bg-orange-100 text-orange-700"; label = "උකස් වාරික ගෙවීම (Pawn Repayment)";
                }

                return (<div key={act.id || idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer" onClick={() => handleViewActivity(act)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                      {loadingActivity ? <Loader2 size={16} className="animate-spin" /> : icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{act.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-700">
                            {act.amount ? `Rs. ${act.amount.toLocaleString()}` : '-'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(act.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Details Modal */}
        {activityDetails && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Activity size={20} className="text-blue-400" />
                  {t('Activity Details')}
                </h3>
                <button onClick={() => setActivityDetails(null)} className="text-slate-400 hover:text-white transition bg-white/10 p-1.5 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-700">
                <div className="grid grid-cols-2 gap-y-5">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Type')}</p>
                    <p className="font-semibold text-slate-800">{t(activityDetails._type)}</p>
                  </div>
                  {(activityDetails.transactionId || activityDetails.accountId || activityDetails.fdId) && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Reference ID')}</p>
                      <p className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                        {activityDetails.transactionId || activityDetails.accountId || activityDetails.fdId}
                      </p>
                    </div>
                  )}
                  {activityDetails.amount !== undefined && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Amount')}</p>
                      <p className="font-bold text-emerald-600 text-base">Rs. {Number(activityDetails.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                  )}
                  {activityDetails.balanceAfter !== undefined && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Balance After')}</p>
                      <p className="font-bold text-slate-800 text-base">Rs. {Number(activityDetails.balanceAfter).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                  )}
                  {activityDetails.accountNumber && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Account No')}</p>
                      <p className="font-medium text-slate-800">{activityDetails.accountNumber}</p>
                    </div>
                  )}
                  {activityDetails.memberId && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Account Owner')}</p>
                      <p className="font-medium text-slate-800">{activityDetails._memberName || getMemberName(activityDetails.memberId, activityDetails.accountNumber)}</p>
                    </div>
                  )}
                  {activityDetails.branchId && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Branch')}</p>
                      <p className="font-medium text-slate-800">{t(getBranchName(activityDetails.branchId))}</p>
                    </div>
                  )}
                  {activityDetails.fdNumber && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('FD No')}</p>
                      <p className="font-medium text-slate-800">{activityDetails.fdNumber}</p>
                    </div>
                  )}
                  {activityDetails.principalAmount !== undefined && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Principal Amount')}</p>
                      <p className="font-bold text-emerald-600 text-base">Rs. {Number(activityDetails.principalAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                  )}
                  {activityDetails.interestRate !== undefined && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Interest Rate')}</p>
                      <p className="font-bold text-slate-800">{activityDetails.interestRate}%</p>
                    </div>
                  )}
                  {activityDetails.openedDate && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Opened Date')}</p>
                      <p className="font-medium text-slate-800">{new Date(activityDetails.openedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {activityDetails.maturityDate && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Maturity Date')}</p>
                      <p className="font-medium text-slate-800">{new Date(activityDetails.maturityDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {activityDetails.timestamp && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">{t('Timestamp')}</p>
                      <p className="font-medium text-slate-800">{new Date(activityDetails.timestamp).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setActivityDetails(null)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-200 bg-slate-200/50 rounded-xl transition text-sm">
                  {t('Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'insurance') {
    return <InsuranceReport />;
  }

  if (activeTab === 'savings') {
    const totalSavings = accounts.length;
    const activeSavings = accounts.filter(a => a.status === 'ACTIVE').length;
    const inactiveSavings = accounts.filter(a => a.status === 'INACTIVE').length;

    return (
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        {/* KPI Cards (Top) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><PiggyBank size={40} /></div>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg border border-blue-100"><PiggyBank size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">{t(`මුළු ගිණුම්`)}</p>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{totalSavings}</h4>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-600"><CheckCircle size={40} /></div>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100"><CheckCircle size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">{t(`සක්‍රිය ගිණුම්`)}</p>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{activeSavings}</h4>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-rose-600"><XCircle size={40} /></div>
            <div className="bg-rose-50 text-rose-600 p-2 rounded-lg border border-rose-100"><XCircle size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">{t(`අක්‍රිය ගිණුම්`)}</p>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{inactiveSavings}</h4>
            </div>
          </div>
        </div>

        {/* Action Buttons (Only for non-readOnly) */}
        {!readOnly && (
          <div className="flex justify-center items-center py-2">
            <div className="inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
              {/* Deposit */}
              <button
                onClick={() => { setRowTxAccount(null); setRowTxAction('DEPOSIT'); }}
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/40"
              >
                <ArrowDownLeft size={16} /> {t('Deposit')}
              </button>

              {/* Withdraw */}
              <button
                onClick={() => { setRowTxAccount(null); setRowTxAction('WITHDRAW'); }}
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 hover:shadow-rose-500/40 ml-1.5"
              >
                <ArrowUpRight size={16} /> {t('Withdraw')}
              </button>

              {/* Open Account */}
              <button
                onClick={() => { setAccCustomerType(null); setSelectedMemberId(''); setShowAccModal(true); }}
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 ml-1.5"
              >
                <CreditCard size={16} /> {t('Open Account')}
              </button>
            </div>
          </div>
        )}

        {/* Unified Data Table Card */}
        <div className="bg-slate-50 rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col ring-1 ring-slate-900/5 flex-1 min-h-0">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-100/80">
            
            {/* Compact Animated Tab Switcher */}
            <div className="relative flex bg-slate-200/50 p-1 rounded-xl w-full md:w-[320px] shadow-inner">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${savingsTab === 'NON_SOCIETY' ? 'left-[50%] bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'left-1 bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.8)]'} overflow-hidden`}
              >
                <div className="absolute inset-[-150%] animate-[spin_2s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0 200deg, rgba(255,255,255,0.3) 290deg, white 360deg)' }}></div>
                <div className={`absolute inset-[2.5px] rounded-[5.5px] transition-colors duration-500 ${savingsTab === 'NON_SOCIETY' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
              </div>
              
              <button 
                onClick={() => setSavingsTab('SOCIETY')} 
                className={`relative z-10 flex-1 py-1.5 text-sm font-bold tracking-wide transition-all duration-300 ${savingsTab === 'SOCIETY' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t(`සමාජීය`)}</button>
              
              <button 
                onClick={() => setSavingsTab('NON_SOCIETY')} 
                className={`relative z-10 flex-1 py-1.5 text-sm font-bold tracking-wide transition-all duration-300 ${savingsTab === 'NON_SOCIETY' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t(`සමාජීය නොවන`)}</button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search account number...')}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm transition-all placeholder:text-slate-400" />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 bg-white">
          <table className="w-full text-sm relative">
            <thead className="bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest w-[15%]">{t('Account No.')}</th>
                <th className="px-5 py-5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest w-[25%]">{t('Account Holder')}</th>
                <th className="px-5 py-5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest w-[15%]">{t('Type')}</th>
                <th className="px-5 py-5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest w-[15%]">{t('Balance')}</th>
                <th className="px-5 py-5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest w-[10%]">{t('Status')}</th>
                <th className="px-5 py-5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest w-[20%]">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAccounts.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">{t('No accounts found')}</td></tr>
              ) : filteredAccounts.map(a => (
                <tr key={a.accountId} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-5 font-bold text-slate-800 font-mono text-base">{a.accountNumber}</td>
                  <td className="px-5 py-5 text-slate-700 font-medium group-hover:text-blue-900 transition-colors">
                    {a.childName || members.find(m => m.memberId === a.memberId)?.nameWithInitials || members.find(m => m.memberId === a.memberId)?.fullNameSinhala || 'N/A'}
                  </td>
                  <td className="px-5 py-5">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide inline-block">
                      {t(a.accountType)}
                    </span>
                  </td>
                  <td className="px-5 py-5 font-black text-slate-800 text-base text-right">Rs. {Number(a.balance).toLocaleString()}</td>
                  <td className="px-5 py-5 text-center">
                    <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border inline-block ${a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {t(a.status)}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex justify-center items-center gap-2">
                    <button onClick={() => setViewAccount(a)} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition" title={t('View Account')}>
                      {t('View')}
                    </button>
                    <button onClick={() => handleViewPassbook(a.accountId!)} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition flex items-center gap-1" title={t('View Passbook')}>
                      <BookOpen size={14} /> Passbook
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: a.status === 'ACTIVE' ? 'ගිණුම අක්‍රිය කරන්නද?' : 'ගිණුම සක්‍රිය කරන්නද?',
                          message: `"${a.accountNumber}" ගිණුම ${a.status === 'ACTIVE' ? 'අක්‍රිය' : 'සක්‍රිය'} කිරීමට ඔබ ස්ථිරද?`,
                          variant: a.status === 'ACTIVE' ? 'warning' : 'info',
                          onConfirm: async () => {
                            try {
                              await AccountService.updateAccountStatus(a.accountId!, a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                              fetchData();
                            } catch (e) { (window as any).showToast('Failed to update account status'); }
                            setConfirmDialog(d => ({ ...d, isOpen: false }));
                          }
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg transition flex items-center justify-center border shadow-sm ${a.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'}`}
                      title={a.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                    >
                      <Power size={14} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Row Transaction Modal */}
        {rowTxAction && (
          <TransactionModal 
            accountId={rowTxAccount?.accountId || ''}
            accountNumber={rowTxAccount?.accountNumber || ''}
            accountType={rowTxAccount?.accountType || ''}
            balance={Number(rowTxAccount?.balance || 0)}
            accountHolder={rowTxAccount?.childName || members.find(m => m.memberId === rowTxAccount?.memberId)?.nameWithInitials || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullNameSinhala || 'N/A'}
            action={rowTxAction}
            allAccounts={accounts}
            members={members}
            isMatured={rowTxAccount?.isMatured}
            linkedSavingsAccount={(rowTxAccount as any)?.linkedSavingsAccount}
            memberId={(rowTxAccount as any)?.memberId}
            penaltyAmount={(rowTxAccount as any)?.penaltyAmount}
            principalAmount={(rowTxAccount as any)?.principalAmount}
            onClose={() => { setRowTxAction(null); setRowTxAccount(null); }}
            onSuccess={() => {
              setRowTxAction(null); setRowTxAccount(null);
              // Refresh accounts
              AccountService.getBranchAccounts().then(setAccounts).catch(() => {});
            }}
          />
        )}

        {/* FD View Modal */}
        {viewingFd && (
          <FdViewModal 
            fd={viewingFd} 
            members={members}
            savingsAccounts={accounts}
            onClose={() => setViewingFd(null)} 
          />
        )}

        {/* FD Monitor Modal */}
        {monitoringFd && (
          <FdMonitorModal 
            fd={monitoringFd} 
            memberName={getMemberName(monitoringFd.memberId)}
            onClose={() => setMonitoringFd(null)}
            onRelease={(isMatured, releaseAmount, penaltyAmount, principalAmount) => {
              setMonitoringFd(null);
              const linkedAcc = accounts.find(a => a.accountId === monitoringFd.linkedSavingsAccountId);
              setRowTxAccount({ accountId: monitoringFd.fdId, accountNumber: monitoringFd.fdNumber, accountType: 'FIXED_DEPOSIT', balance: releaseAmount, memberId: monitoringFd.memberId, childName: '', isMatured, linkedSavingsAccount: linkedAcc ? linkedAcc.accountNumber : 'Not Linked', penaltyAmount, principalAmount } as any);
              setRowTxAction('CLOSE_FD');
            }}
          />
        )}

        {/* Modal for Open Regular Account */}
        {showOpenAccountForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full my-8">
              <OpenAccountForm onClose={() => { setShowOpenAccountForm(false); fetchData(); }} />
            </div>
          </div>
        )}

        {/* Modal for Open FD */}
        {showOpenFdForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full my-8">
              <OpenFixedDepositForm onClose={() => { setShowOpenFdForm(false); fetchData(); }} />
            </div>
          </div>
        )}

        {/* Open Account Modal */}
        {showAccModal && accCustomerType !== null && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-6xl relative shadow-2xl rounded-2xl">
              <OpenAccountForm 
                isSocietyMember={accCustomerType === 'true'} 
                onClose={() => { setShowAccModal(false); setAccCustomerType(null); setSelectedMemberId(''); fetchData(); }} 
              />
            </div>
          </div>
        )}

        {/* Choice Popup */}
        {showAccModal && accCustomerType === null && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">{t('Open Savings Account')}</h3>
                <button onClick={() => { setShowAccModal(false); setAccCustomerType(null); setSelectedMemberId(''); }}><X size={18} className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              
              <div className="p-8 space-y-4">
                <h4 className="text-center text-slate-600 font-medium mb-6">{t('Registration Type')}</h4>
                <button onClick={() => setAccCustomerType('true')}
                  className="w-full p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-500 text-green-700 font-bold transition flex items-center justify-center gap-3">
                  <UserPlus size={20} />
                  {t('Society Account')}
                </button>
                <button onClick={() => setAccCustomerType('false')}
                  className="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 text-blue-700 font-bold transition flex items-center justify-center gap-3">
                  <Users size={20} />
                  {t('Non-Society Account')}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* View Account Modal */}
        {viewAccount && (
          <ViewAccountModal 
            account={viewAccount} 
            members={members} 
            onClose={() => setViewAccount(null)} 
          />
        )}

        {/* Passbook Modal */}
        {showPassbook && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-600" /> Account Passbook / Statement
                  </h3>
                  {passbookData && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">{passbookData.account?.accountNumber}</p>
                  )}
                </div>
                <button onClick={() => setShowPassbook(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-0 overflow-y-auto flex-1">
                {passbookLoading ? (
                  <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading passbook data...</div>
                ) : passbookData ? (
                  <div className="p-6 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-2">
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
                        <p className="text-2xl font-black text-slate-800 font-mono">Rs. {passbookData.account?.balance?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interest Rate</p>
                        <p className="text-2xl font-black text-indigo-600 font-mono">{(passbookData.account?.annualInterestRate * 100).toFixed(2)}%</p>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">{passbookData.account?.status}</p>
                      </div>
                      
                      {(() => {
                        const today = new Date();
                        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                        const currentMonthBalances = passbookData.dailyBalances?.filter((db: any) => db.recordDate.startsWith(currentMonthStr)) || [];
                        const accruedInterest = currentMonthBalances.reduce((sum: number, db: any) => sum + (db.dailyInterestEarned || 0), 0);
                        
                        return (
                            <div 
                              className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm cursor-pointer hover:bg-blue-100 transition-colors flex flex-col justify-center items-center h-full group"
                              onClick={() => {
                                setInterestModalMonth('');
                                setShowInterestModal(true);
                              }}
                            >
                              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 group-hover:scale-105 transition-transform">
                                <Calculator size={18} /> {t(`උපයා ඇති පොලිය`)}</p>
                              <span className="text-[10px] text-blue-400 mt-1 font-semibold uppercase">
                                Click to View Details
                              </span>
                            </div>
                        );
                      })()}
                    </div>

                    <div className="w-full">
                      {/* Transactions */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Transactions History</h4>
                        {passbookData.transactions.length === 0 ? (
                          <p className="text-sm text-slate-500">No transactions recorded.</p>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Date</th>
                                  <th className="px-4 py-3 font-semibold">Description</th>
                                  <th className="px-4 py-3 font-semibold text-right">Withdrawals</th>
                                  <th className="px-4 py-3 font-semibold text-right">Deposits</th>
                                  <th className="px-4 py-3 font-semibold text-right">Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {passbookData.transactions.sort((a: any, b: any) => new Date(b.transactionTimestamp).getTime() - new Date(a.transactionTimestamp).getTime()).map((tx: any) => {
                                  const isFdClosure =
                                    tx.transactionType === 'FD_CLOSURE' ||
                                    tx.transactionType === 'FIXED_DEPOSIT_CLOSURE' ||
                                    tx.transactionType === 'FD_RELEASE' ||
                                    !!(tx.reference && tx.reference.toLowerCase().startsWith('fd closure')) ||
                                    !!(tx.description && (
                                      tx.description.toLowerCase().includes('fixed deposit') ||
                                      tx.description.toLowerCase().includes('fd closure')
                                    ));
                                  const isCredit = tx.transactionType.includes('DEPOSIT') || tx.transactionType.includes('INTEREST') || tx.transactionType === 'BROUGHT_FORWARD' || isFdClosure;
                                  const isInterest = tx.transactionType === 'INTEREST';
                                  const isFdInterest = tx.transactionType === 'FD_MONTHLY_INTEREST' || tx.transactionType === 'MONTHLY_INTEREST';
                                  
                                  let txDate = new Date(tx.transactionTimestamp);
                                  let txMonthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

                                  return (
                                    <React.Fragment key={tx.transactionId}>
                                      <tr 
                                        className={`hover:bg-slate-50 transition-colors ${isInterest ? 'cursor-pointer' : ''}`}
                                        onClick={() => { 
                                          if(isInterest) {
                                            setInterestModalMonth(txMonthStr);
                                            setShowInterestModal(true);
                                          }
                                        }}
                                      >
                                        <td className="px-4 py-3 text-slate-500">
                                          {txDate.toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                              {isInterest ? 'මාසික පොලිය (MONTHLY INTEREST)' : 
                                               isFdInterest ? 'ස්ථාවර තැන්පතු පොලිය (FD INTEREST)' : 
                                               isFdClosure ? 'ස්ථාවර තැන්පතු වසා දැමීම (FIXED DEPOSIT CLOSURE)' :
                                               tx.transactionType === 'INITIAL_DEPOSIT' ? 'පෙර ශේෂය (BROUGHT FORWARD)' :
                                               tx.transactionType === 'BROUGHT_FORWARD' ? 'පෙර ශේෂය (BROUGHT FORWARD)' :
                                               tx.transactionType === 'WITHDRAWAL' ? 'මුදල් ආපසු ගැනීම (WITHDRAWAL)' :
                                               tx.transactionType === 'DEPOSIT' ? (tx.reference && tx.reference.includes('Loan Disbursement') ? tx.reference : 'තැන්පතුව (DEPOSIT)') :
                                               tx.transactionType.replace('_', ' ')}
                                            </span>
                                            {isInterest && (
                                              <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                                                Details
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-rose-600 font-mono">
                                          {!isCredit ? `Rs. ${tx.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-mono">
                                          {isCredit ? `Rs. ${tx.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono">
                                          Rs. {tx.balanceAfter.toLocaleString()}
                                        </td>
                                      </tr>
                                      </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-red-500 font-medium">Failed to load passbook.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {showInterestModal && passbookData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Calculator size={18} /> {t('Monthly Interest Details')} (මාසික පොලී විස්තර)
                </h3>
                <button onClick={() => setShowInterestModal(false)} className="text-blue-100 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                {(() => {
                  // Group daily balances by month
                  const balancesByMonth: { [monthStr: string]: any[] } = {};
                  (passbookData.dailyBalances || []).forEach((db: any) => {
                    const monthStr = db.recordDate.substring(0, 7); // YYYY-MM
                    if (!balancesByMonth[monthStr]) balancesByMonth[monthStr] = [];
                    balancesByMonth[monthStr].push(db);
                  });
                  
                  const sortedMonths = Object.keys(balancesByMonth).sort((a, b) => b.localeCompare(a));
                  
                  if (sortedMonths.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Calculator size={48} className="text-slate-300 mb-4" />
                        <h4 className="text-lg font-medium text-slate-700 mb-2">{t(`පොලී වාර්තා නොමැත (No interest records yet)`)}</h4>
                        <p className="text-slate-500 max-w-sm">
                          {t(`මෙම ගිණුම සඳහා දෛනික පොලී වාර්තා තවමත් සකසා නොමැත. දෛනික පොලිය ගණනය වන්නේ සෑම දිනකම මධ්‍යම රාත්‍රියේදී (End of Day) ය. අද දින ආරම්භ කළ ගිණුම් වල පොලී විස්තර හෙට දින සිට මෙතැනින් බලාගත හැක.`)}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {sortedMonths.map(monthStr => {
                        const monthDbs = balancesByMonth[monthStr];
                        
                        // Calculate minimum balance of the month
                        const minBalance = monthDbs.reduce((min, db) => {
                          const bal = db.closingBalance || db.endOfDayBalance || 0;
                          return min === null ? bal : Math.min(min, bal);
                        }, null as number | null) || 0;

                        // Get latest annual rate of the month
                        const latestDb = monthDbs[monthDbs.length - 1];
                        const annualRate = latestDb?.annualInterestRate != null ? parseFloat(latestDb.annualInterestRate) : 0.06;

                        // Calculate monthly interest using the minimum balance method
                        const monthlyInterest = (minBalance * annualRate) / 12;

                        const isExpanded = interestModalMonth === monthStr;
                        
                        return (
                          <div key={monthStr} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-200">
                            <div 
                              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
                              onClick={() => setInterestModalMonth(isExpanded ? '' : monthStr)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-800 text-sm">
                                    {new Date(monthStr + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">{monthStr}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block font-medium">මාසික පොලිය</span>
                                <span className="font-mono font-black text-emerald-600 text-sm">Rs. {monthlyInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <span className="text-slate-500 text-xs font-semibold block uppercase">මාසයේ අවම ශේෂය (Min Balance)</span>
                                    <span className="text-slate-800 text-base font-bold font-mono mt-1 block">Rs. {minBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <span className="text-slate-500 text-xs font-semibold block uppercase">වාර්ෂික පොලී අනුපාතය (Rate)</span>
                                    <span className="text-slate-800 text-base font-bold font-mono mt-1 block">{(annualRate * 100).toFixed(2)}%</span>
                                  </div>
                                </div>

                                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-blue-700 text-xs font-black block uppercase">මාසිකව උපයා ඇති පොලිය (Total Earned)</span>
                                    <p className="text-slate-500 text-[10px] mt-0.5 font-medium">සූත්‍රය: (අවම ශේෂය රු. {minBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} × {(annualRate * 100).toFixed(2)}%) ÷ 12</p>
                                  </div>
                                  <span className="text-emerald-600 text-lg font-black font-mono">Rs. {monthlyInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="border-t border-slate-200/60 pt-4">
                                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">දෛනික ශේෂයන්ගේ ලේඛනය (Daily Balances List)</h5>
                                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white custom-scrollbar">
                                    <table className="w-full text-left text-[11px] border-collapse">
                                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                                        <tr>
                                          <th className="px-3 py-1.5 text-slate-500 font-bold">දිනය (Date)</th>
                                          <th className="px-3 py-1.5 text-right text-slate-500 font-bold">දෛනික ශේෂය (EOD Balance)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 font-mono">
                                        {monthDbs.sort((a: any, b: any) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()).map((db: any, idx: number) => {
                                          const bal = db.closingBalance || db.endOfDayBalance || 0;
                                          const isMin = bal === minBalance;
                                          return (
                                            <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isMin ? 'bg-amber-50/70 font-semibold text-amber-900' : 'text-slate-600'}`}>
                                              <td className="px-3 py-1 flex items-center gap-1.5">
                                                {db.recordDate}
                                                {isMin && <span className="bg-amber-100 text-amber-800 text-[8px] px-1 py-0.5 rounded font-sans uppercase font-bold">අවම ශේෂය (Min)</span>}
                                              </td>
                                              <td className="px-3 py-1 text-right">Rs. {bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }

  if (activeTab === 'pawning_approvals') {

    return <PawningApprovalsView />;

  }



  if (activeTab === 'pawning') {
    return <PawningModule branchId={AuthService.getCurrentUser()?.branchId || 1} />;
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <StatCard icon={Users}        label="මුළු සාමාජිකයින් (Total Members)"    value={members.filter(m => m.isMember !== false).length.toString()} color="text-green-600" />
        <StatCard icon={CreditCard}   label={t('Total Accounts')}   value={accounts.length.toString()} color="text-blue-600" />
        <StatCard icon={UserPlus}     label="සාමාජික නොවන අය (Non-Members)"   value={members.filter(m => m.isMember === false).length.toString()} color="text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl p-6 pb-4 shadow-sm border border-slate-100 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> සාමාජිකයින් සහ ගනුදෙනුකරුවන් (Members & Customers)</h3>
          {!readOnly && (
            <button onClick={() => setShowMemberChoiceModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
              <UserPlus size={14} /> ලියාපදිංචි කරන්න (Register)
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search by name or NIC...')}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <select value={memberTypeFilter} onChange={e => setMemberTypeFilter(e.target.value as any)}
            className="w-48 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white text-slate-600 font-medium">
            <option value="ALL">සියල්ල (All Customers)</option>
            <option value="MEMBERS">සාමාජිකයින් (Members)</option>
            <option value="NON_MEMBERS">සාමාජික නොවන අය (Non-members)</option>
          </select>
          <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}
            className="w-40 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white text-slate-600 font-medium">
            <option value="ALL">{t('All Ages')}</option>
            <option value="ADULT">{t('Adults Only')}</option>
            <option value="CHILD">{t('Children Only')}</option>
          </select>
        </div>
        <div className="overflow-auto border border-slate-100 rounded-xl flex-1 min-h-0">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">සාමාජිකයා / ගනුදෙනුකරු (Name)</th>
                <th className="px-4 py-3">සාමාජික / සේවාලාභී අංකය (ID / No.)</th>
                <th className="px-4 py-3">{t('NIC / Birth Cert. No.')}</th>
                <th className="px-4 py-3">{t('Accounts')}</th>
                <th className="px-4 py-3">වර්ගය (Type)</th>
                <th className="px-4 py-3">{t('Status')}</th>
                <th className="px-4 py-3 text-right">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">කිසිදු සාමාජිකයෙකු හෝ ගනුදෙනුකරුවෙකු හමු නොවීය. (No records found.)</td></tr>
              ) : filtered.map(m => (
                <tr key={m.memberId} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {m.fullName.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{m.nameWithInitials || m.fullName}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">{m.membershipNumber || m.clientId || '-'}</td>
                  <td className="px-4 py-3">{m.nic}</td>
                  <td className="px-4 py-3">{getAccountCount(m.memberId)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isMember !== false ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {m.isMember !== false ? 'සාමාජික (Member)' : 'සාමාජික නොවන (Non-member)'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t(m.status || '')}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {m.ageCategory ? t(m.ageCategory) : t('ADULT')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { 
                          setSelectedMemberForAccounts(m);
                          setShowMemberAccountsModal(true);
                        }}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100 transition flex items-center gap-1.5">
                        <CreditCard size={12} /> {t('View Accounts')}
                      </button>
                      <button onClick={() => { 
                          setForm(m as any);
                          setEditingOriginalForm(m as any);
                          setIsChildReg(m.ageCategory === 'CHILD');
                          setGuardianNic(m.guardianNic || '');
                          setGuardianMemberNo(m.guardianMemberNo || '');
                          if (m.guardianNic || m.guardianMemberNo) {
                            const g = members.filter(gm => (m.guardianNic && gm.nic === m.guardianNic) || (m.guardianMemberNo && gm.membershipNumber === m.guardianMemberNo))[0];
                            setSelectedGuardianData(g || null);
                          } else {
                            setSelectedGuardianData(null);
                          }
                          setShowRegModal(true); 
                        }}
                        className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-200 transition flex items-center gap-1.5 inline-flex">
                        <User size={12} /> {t('Profile')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMemberAccountsModal && selectedMemberForAccounts && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b-4 border-blue-600">
              <h3 className="font-bold text-white flex items-center gap-2">
                <CreditCard size={18} /> {t('Accounts for')} {selectedMemberForAccounts.nameWithInitials || selectedMemberForAccounts.fullName}
              </h3>
              <button onClick={() => setShowMemberAccountsModal(false)} className="text-slate-300 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              
              {(() => {
                const memberSavings = accounts.filter(a => a.memberId === selectedMemberForAccounts.memberId);
                const memberFds = fixedDeposits.filter(f => f.memberId === selectedMemberForAccounts.memberId);
                const memberLoans = loans.filter(l => l.memberId === selectedMemberForAccounts.memberId);
                const memberPawning: any[] = []; // Placeholder for future Pawning integration
                const totalMemberAccounts = memberSavings.length + memberFds.length + memberLoans.length + memberPawning.length;

                if (totalMemberAccounts === 0) {
                  return <p className="text-sm text-slate-500 italic text-center py-4">{t('No accounts found')}</p>;
                }

                return (
                  <>
                    {/* Savings Accounts */}
                    {memberSavings.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><PiggyBank size={16} className="text-emerald-600"/> {t('Savings Accounts')}</h4>
                        <div className="space-y-2">
                          {memberSavings.map(a => (
                            <div key={a.id} onClick={() => { 
                                setSearch(a.accountNumber); 
                                setShowMemberAccountsModal(false); 
                                if(onTabChange) onTabChange('savings'); 
                              }} 
                              className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                              <div>
                                <p className="font-bold text-slate-800 group-hover:text-blue-700">{a.accountNumber}</p>
                                <p className="text-xs text-slate-500">{a.accountType}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fixed Deposits */}
                    {memberFds.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Lock size={16} className="text-amber-600"/> {t('Fixed Deposits')}</h4>
                        <div className="space-y-2">
                          {memberFds.map(f => (
                            <div key={f.id} onClick={() => { 
                                setFdSearch(f.fdNumber); 
                                setShowMemberAccountsModal(false); 
                                if(onTabChange) onTabChange('fds'); 
                              }} 
                              className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                              <div>
                                <p className="font-bold text-slate-800 group-hover:text-blue-700">{f.fdNumber}</p>
                                <p className="text-xs text-slate-500">Rs. {Number(f.principalAmount).toLocaleString()}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Loans */}
                    {memberLoans.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText size={16} className="text-red-600"/> {t('Loan Accounts')}</h4>
                        <div className="space-y-2">
                          {memberLoans.map(l => (
                            <div key={l.id} onClick={() => { 
                                setLoanSearch(l.loanNumber || l.memberId); 
                                setShowMemberAccountsModal(false); 
                                if(onTabChange) onTabChange('loans'); 
                              }} 
                              className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                              <div>
                                <p className="font-bold text-slate-800 group-hover:text-blue-700">{l.loanNumber || 'Pending Loan'}</p>
                                <p className="text-xs text-slate-500">{l.loanType?.name || 'Loan'}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pawning */}
                    {memberPawning.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Scale size={16} className="text-purple-600"/> {t('Pawning')}</h4>
                        <div className="space-y-2">
                          {memberPawning.map(p => (
                            <div key={p.id} onClick={() => { 
                                // setPawningSearch(p.pawningNumber); 
                                setShowMemberAccountsModal(false); 
                                // if(onTabChange) onTabChange('pawning'); 
                              }} 
                              className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center group">
                              <div>
                                <p className="font-bold text-slate-800 group-hover:text-blue-700">{p.pawningNumber || 'Pending Pawning'}</p>
                                <p className="text-xs text-slate-500">{p.type || 'Pawning'}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {showMemberChoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between text-white border-b-4 border-green-600">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus size={16} />
                ලියාපදිංචි කිරීම් වර්ගය තෝරන්න (Select Type)
              </h3>
              <button 
                onClick={() => setShowMemberChoiceModal(false)} 
                className="text-white/80 hover:text-white transition bg-white/10 p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-center mb-6 text-sm font-semibold">
                ලියාපදිංචි කරනු ලබන්නේ සමිතියේ සාමාජිකයෙක්ද? නැතහොත් සාමාජික නොවන අයෙක්ද?
              </p>
              
              <button 
                onClick={() => {
                  setForm({ ...initialFormState, isMember: true });
                  setEditingOriginalForm(null);
                  setShowMemberChoiceModal(false);
                  setShowRegModal(true);
                }}
                className="w-full flex items-center justify-center gap-3 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                <UserPlus size={18} />
                ඔව්, සාමාජිකයෙක් (Yes, Member)
              </button>

              <button 
                onClick={() => {
                  setForm({ ...initialFormState, isMember: false });
                  setEditingOriginalForm(null);
                  setShowMemberChoiceModal(false);
                  setShowRegModal(true);
                }}
                className="w-full flex items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border-2 border-slate-200 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                <Users size={18} />
                නැත, සාමාජික නොවන අයෙක් (No, Non-Member)
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header / Letterhead */}
            <div className="bg-slate-800 px-6 py-5 flex justify-between items-center shrink-0 border-b-4 border-green-600">
              <div className="flex items-center gap-4">
                <img src={logo} alt="HMCS Logo" className="w-12 h-12 rounded-md object-cover border border-white/20 shadow-sm bg-white" />
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide uppercase">{user.branchName ? t(user.branchName) : t(getBranchName(user.branchId))}</h2>
                  <p className="text-slate-300 text-sm">{(form as any).memberId ? t('Edit Profile') : form.isMember ? t('Register New Member') : t('Register Non-Member')}</p>
                </div>
              </div>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-white transition bg-white/10 p-1.5 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRegister} className="flex flex-col flex-1 overflow-hidden" noValidate>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {regError && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500 font-medium shadow-sm">{regError}</div>}
                
                <div className="space-y-8">
                  {/* Section 1: Identification */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <FileText size={16} className="text-green-600"/> {t('Identification Details')}
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200">{form.isMember ? t('Society Member') : t('Non-Member')}</span>
                    </h3>
                  
                  {!form.isMember && (
                    <div className="mb-5">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Age Category')} <span className="text-red-500">*</span></label>
                      <select required value={isChildReg ? 'child' : 'adult'} onChange={e => setIsChildReg(e.target.value === 'child')}
                        className="w-full max-w-sm border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50">
                        <option value="adult">{t('Adult (18+)')}</option>
                        <option value="child">{t('Child (Under 18)')}</option>
                      </select>
                    </div>
                  )}

                  {isChildReg ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 space-y-4 shadow-sm">
                      <div className="flex gap-2">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                          {t('Children (under 18) cannot be official members. A Guardian\'s NIC is required to proceed. Please enter the child\'s Birth Certificate Number in the NIC field below.')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedGuardianData ? (
                          <div className="col-span-2 p-4 bg-white border border-amber-300 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-800 font-bold shadow-inner">
                                {selectedGuardianData.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm mb-0.5">{selectedGuardianData.nameWithInitials || selectedGuardianData.fullName}</div>
                                <div className="text-xs text-slate-500 font-medium flex gap-3">
                                  <span className="flex items-center gap-1"><span className="text-slate-400">NIC:</span> {selectedGuardianData.nic}</span>
                                  {selectedGuardianData.membershipNumber && <span className="flex items-center gap-1"><span className="text-slate-400">ID:</span> {selectedGuardianData.membershipNumber}</span>}
                                </div>
                              </div>
                            </div>
                            <button type="button" onClick={() => { setSelectedGuardianData(null); setGuardianNic(''); setGuardianMemberNo(''); setGuardianSearch(''); }} className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition">
                              {t('Change Guardian')}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 relative">
                              <label className="block text-xs font-bold text-amber-800 mb-1.5">{t('Search & Auto-fill Guardian')}</label>
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                                <input value={guardianSearch} onChange={e => handleGuardianSearch(e.target.value)} placeholder={t('Search Guardian by Name, NIC, or ID...')}
                                  className="w-full pl-9 pr-4 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                              </div>
                              {showGuardianDropdown && guardianSearchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                  {guardianSearchResults.map(m => (
                                    <div key={m.memberId} onClick={() => selectGuardian(m)} className="px-4 py-2 hover:bg-amber-50 cursor-pointer border-b border-amber-50 last:border-0">
                                      <div className="font-semibold text-sm text-slate-800">{m.nameWithInitials || m.fullName}</div>
                                      <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                        <span>NIC: {m.nic}</span>
                                        <span className="font-medium text-amber-700">{m.membershipNumber || 'Non-Member'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-amber-800 mb-1.5">{t('Guardian NIC')} <span className="text-red-500">*</span></label>
                              <input required value={guardianNic} onChange={e => setGuardianNic(e.target.value)} placeholder="e.g. 198XXXXXXXXX"
                                className="w-full border border-amber-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-amber-800 mb-1.5">{t('Guardian ID')}</label>
                              <input value={guardianMemberNo} onChange={e => setGuardianMemberNo(e.target.value)} placeholder="(Optional)"
                                className="w-full border border-amber-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{form.isMember ? t('Membership Number') : isChildReg ? t('Child ID') : t('Client ID')} <span className="text-red-500">*</span></label>
                      <input required value={form.membershipNumber} onChange={e => setForm(p => ({ ...p, membershipNumber: e.target.value }))} placeholder={form.isMember ? "e.g. M-1025" : isChildReg ? "e.g. CH-8042" : "e.g. C-8042"}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Personal Information */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2"><UserPlus size={16} className="text-green-600"/> {t('Personal Information')}</h3>
                  <div className="grid grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{isChildReg ? t('Birth Certificate No.') : t('National Identity Card (NIC)')} <span className="text-red-500">*</span></label>
                      <input required value={form.nic} onChange={e => setForm(p => ({ ...p, nic: e.target.value }))} placeholder={isChildReg ? "Birth Certificate Number" : "e.g. 199XXXXXXXXX"}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Name with Initials')} <span className="text-red-500">*</span></label>
                      <input required value={form.nameWithInitials} onChange={e => setForm(p => ({ ...p, nameWithInitials: e.target.value }))} placeholder="e.g. A.B.C. Perera"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Full Name (English)')} <span className="text-red-500">*</span></label>
                      <input required value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>

                  </div>
                  
                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                      <input required type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
                      <select required value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Marital Status <span className="text-red-500">*</span></label>
                      <select required value={form.maritalStatus} onChange={e => setForm(p => ({ ...p, maritalStatus: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50">
                        <option value="UNMARRIED">Unmarried</option>
                        <option value="MARRIED">Married</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact Details */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2"><MapPin size={16} className="text-green-600"/> {t('Address')} & {t('Contact Number')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Address')} <span className="text-red-500">*</span></label>
                      <textarea required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Province')}</label>
                      <input value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Contact Number')} <span className="text-red-500">*</span></label>
                      <input required value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))} placeholder="07X XXXXXXX"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                    </div>
                  </div>
                </div>

                {/* Section 4: Membership & Shares */}
                {form.isMember && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2"><Award size={16} className="text-green-600"/> {t('Membership Details')}</h3>
                    <div className="grid grid-cols-2 gap-5 mb-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Number of Shares')}</label>
                        <input type="number" min="0" step="1" value={form.numberOfShares} onChange={e => setForm(p => ({ ...p, numberOfShares: e.target.value }))} placeholder="e.g. 10"
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
                        {form.numberOfShares && (
                          <div className="text-xs text-green-700 font-bold mt-1.5 ml-1">
                            මුළු අරමුදල: රු. {(Number(form.numberOfShares) * (Number(localStorage.getItem('SYS_SHARE_PRICE')) || 100.0)).toFixed(2)} (1 කොටසක් = රු. {Number(localStorage.getItem('SYS_SHARE_PRICE')) || 100.0})
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.belongsToOtherSociety} onChange={e => setForm(p => ({ ...p, belongsToOtherSociety: e.target.checked }))} 
                          className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500" />
                        <span className="text-sm font-bold text-slate-700">{t('Belongs to another society?')}</span>
                      </label>
                      {form.belongsToOtherSociety && (
                        <div className="mt-3 ml-8">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Other Society Name')}</label>
                          <input value={form.otherSocietyName} onChange={e => setForm(p => ({ ...p, otherSocietyName: e.target.value }))}
                            className="w-full max-w-md border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Digital Documents for both Members and Non-Members */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <FileImage size={16} className="text-green-600"/> {t('Digital Documents')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Photograph')}</label>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                      
                      {photoProgress > 0 && photoProgress < 100 && (
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all duration-75" style={{ width: `${photoProgress}%` }}></div>
                        </div>
                      )}
                      
                      {form.photographUrl && (
                        <div className="mt-3 flex items-start gap-3 p-2 bg-green-50/50 rounded-lg border border-green-100 w-fit">
                          <img src={form.photographUrl} alt="Photograph Preview" className="w-12 h-12 rounded object-cover border border-green-200 shadow-sm" />
                          <p className="text-xs text-green-700 font-medium flex items-center gap-1.5 mt-1 pr-2"><CheckCircle size={14}/> Photo successfully attached</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Digital Signature')}</label>
                      <input type="file" accept="image/*" onChange={handleSignatureUpload}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                      
                      {signatureProgress > 0 && signatureProgress < 100 && (
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all duration-75" style={{ width: `${signatureProgress}%` }}></div>
                        </div>
                      )}
                      
                      {form.digitalSignatureUrl && (
                        <div className="mt-3 flex items-start gap-3 p-2 bg-green-50/50 rounded-lg border border-green-100 w-fit">
                          <img src={form.digitalSignatureUrl} alt="Signature Preview" className="h-12 object-contain bg-white rounded border border-green-200 shadow-sm px-2" />
                          <p className="text-xs text-green-700 font-medium flex items-center gap-1.5 mt-1 pr-2"><CheckCircle size={14}/> Signature successfully attached</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 p-4 px-6 flex justify-end gap-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-6 py-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-bold text-sm transition shadow-sm">
                  {t('Cancel')}
                </button>
                {hasFormChanged && (
                  <button type="submit" disabled={loading} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md disabled:opacity-60 transition flex items-center gap-2">
                    {loading ? t('Processing...') : <><CheckCircle size={18}/> {(form as any).memberId ? t('Save Changes') : t('Authorize & Register')}</>}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MUI-style Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                {t(`අවලංගු කරන්න`)}</button>
              <button 
                onClick={confirmModal.onConfirm} 
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
              >
                {t(`තහවුරු කරන්න`)}</button>
            </div>
          </div>
        </div>
      )}

        {/* View Account Modal */}
        {viewAccount && (
          <ViewAccountModal 
            account={viewAccount} 
            members={members} 
            onClose={() => setViewAccount(null)} 
          />
        )}

      </div>
    );
}

function FieldHandoversView({ members, loans }: { members: any[]; loans: any[] }) {
  const { t } = useLanguage();
  const [allCollections, setAllCollections] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [handoversSummary, setHandoversSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; officer: string; total: number } | null>(null);
  const [acceptedOfficers, setAcceptedOfficers] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const user = AuthService.getCurrentUser();

  const fetchHandovers = () => {
    setLoading(true);
    LoanService.getPendingFieldCollections(user?.branchId || 1)
      .then(data => {
        setAllCollections(data);
      })
      .catch((e) => console.error('Failed to fetch handovers', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  useEffect(() => {
    const filtered = allCollections.filter((item: any) => {
      if (!filterDate) return true;
      if (!item.createdAt) return false;
      let dateStr = "";
      if (typeof item.createdAt === 'string') {
        dateStr = item.createdAt.split('T')[0].split(' ')[0];
      } else if (Array.isArray(item.createdAt)) {
        dateStr = `${item.createdAt[0]}-${String(item.createdAt[1]).padStart(2, '0')}-${String(item.createdAt[2]).padStart(2, '0')}`;
      } else {
         const d = new Date(item.createdAt);
         dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      return dateStr === filterDate;
    });

    filtered.sort((a: any, b: any) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      
      const getTime = (dateVal: any) => {
        if (!dateVal) return 0;
        if (typeof dateVal === 'string') return new Date(dateVal).getTime();
        if (Array.isArray(dateVal)) return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0, dateVal[5] || 0).getTime();
        return new Date(dateVal).getTime();
      };
      
      return getTime(b.createdAt) - getTime(a.createdAt);
    });

    setCollections(filtered);

    const grouped = filtered.reduce((acc: any, curr: any) => {
      if (curr.status !== 'PENDING') return acc;
      const officer = curr.fieldOfficerUsername || curr.collectedBy;
      if (!acc[officer]) acc[officer] = { officer, total: 0, count: 0 };
      acc[officer].total += Number(curr.amount);
      acc[officer].count += 1;
      return acc;
    }, {});
    setHandoversSummary(Object.values(grouped));
  }, [allCollections, filterDate]);

  const executeAccept = async () => {
    if (!confirmState) return;
    try {
      await LoanService.handoverFieldCash({
        fieldOfficerUsername: confirmState.officer,
        amount: confirmState.total,
        tellerUsername: user?.username,
        branchId: user?.branchId
      });
      (window as any).showToast('සාර්ථකව භාරගන්නා ලදී! (Handover Accepted)');
      setAcceptedOfficers(prev => [...prev, confirmState.officer]);
    } catch (e: any) {
      (window as any).showToast('දෝෂයකි: ' + (e.response?.data?.error || e.message));
    } finally {
      setConfirmState(null);
    }
  };

  const handleAcceptClick = (officer: string) => {
    const summary = handoversSummary.find(s => s.officer === officer);
    if (summary) {
      setConfirmState({ isOpen: true, officer: summary.officer, total: summary.total });
    }
  };

  if (loading) return <div className="text-center p-10"><span className="animate-pulse">Loading...</span></div>;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Briefcase size={18} className="text-blue-600" /> {t(`පවරා ඇති ක්ෂේත්‍ර නිලධාරී මුදල් භාරගැනීම් (Field Officer Handovers)`)}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">{t(`දිනය (Date):`)}</span>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>
      {collections.length === 0 ? (
        <p className="text-slate-500 text-sm">{t(`මේ මොහොතේ ක්ෂේත්‍ර නිලධාරීන්ගෙන් භාරගැනීමට මුදල් නොමැත. (No pending handovers from field officers at this moment.)`)}</p>
      ) : (
        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[12px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border border-slate-200">{t(`සාමාජිකයා (Member)`)}</th>
                <th className="px-6 py-4 border border-slate-200">{t(`ලිපිනය (Address)`)}</th>
                <th className="px-6 py-4 border border-slate-200">{t(`ණය අංකය (Loan No)`)}</th>
                <th className="px-6 py-4 border border-slate-200">{t(`දිනය (Date)`)}</th>
                <th className="px-6 py-4 text-right border border-slate-200">{t(`මුදල (Amount)`)}</th>
                <th className="px-6 py-4 text-center border border-slate-200">{t(`ක්‍රියාව (Action)`)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map((item, i) => {
                const loan = loans.find(l => l.loanId === item.loanId || l.id === item.loanId);
                const member = members.find(m => m.memberId === loan?.memberId || m.id === loan?.memberId);
                const officerName = item.fieldOfficerUsername || item.collectedBy;
                
                // Only show the Accept button on the first row for each officer
                const isFirstForOfficer = collections.findIndex(c => (c.fieldOfficerUsername || c.collectedBy) === officerName) === i;
                const officerSummary = handoversSummary.find(s => s.officer === officerName);

                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors bg-white">
                    <td className="px-6 py-4 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[13px]">{member?.fullName || 'නොදන්නා'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-[12px] border border-slate-200" title={member?.address}>
                      {member?.address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-mono text-[13px] font-bold border border-slate-200">
                      {loan?.accountNumber || item.loanId?.substring(0,8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[12px] border border-slate-200">
                      {(() => {
                        let d = new Date();
                        if (typeof item.createdAt === 'string') d = new Date(item.createdAt);
                        else if (Array.isArray(item.createdAt)) d = new Date(item.createdAt[0], item.createdAt[1] - 1, item.createdAt[2], item.createdAt[3] || 0, item.createdAt[4] || 0, item.createdAt[5] || 0);
                        else if (item.createdAt) d = new Date(item.createdAt);
                        return d.toLocaleString('si-LK');
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right border border-slate-200">
                      <span className="font-mono text-[14px] font-black text-slate-800">
                        Rs. {Number(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center border border-slate-200">
                      {item.status === 'HANDED_OVER' || acceptedOfficers.includes(officerName) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                          <CheckCircle size={14} /> {t(`භාරගන්නා ලදී`)}</span>
                      ) : (
                        isFirstForOfficer && officerSummary ? (
                          <button 
                            onClick={() => handleAcceptClick(officerName)} 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition inline-flex items-center gap-2 text-[11px]"
                            title={`Accept all cash from ${officerName} (Rs. ${officerSummary.total.toLocaleString()})`}
                          >
                            <CheckCircle size={14} /> {t(`භාරගන්න`)}</button>
                        ) : (
                          <span className="text-slate-300 text-[11px]"></span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmState?.isOpen && (
        <ConfirmDialog
          isOpen={true}
          title={t(`මුදල් භාරගැනීම තහවුරු කරන්න`)}
          message={`ඔබට විශ්වාසද ${confirmState.officer} වෙතින් Rs. ${confirmState.total.toLocaleString()} ක මුදලක් භාරගැනීමට අවශ්‍ය බව?`}
          confirmText="ඔව්, භාරගන්න"
          cancelText="අවලංගු කරන්න"
          variant="info"
          onConfirm={executeAccept}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}

function BankServiceManagerView() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Shield}   label="Active Directives" value="4"    color="text-purple-600" />
        <StatCard icon={FileText} label="Loans Under Review" value="9"   color="text-amber-600" />
        <StatCard icon={Bell}     label="Compliance Alerts"  value="2"   color="text-red-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={16} /> Loan Compliance Queue</h3>
        {[
          { name: 'K.D. Perera', amount: 250000, status: 'PENDING', date: '2026-06-01' },
          { name: 'S.M. Silva',  amount: 500000, status: 'PENDING', date: '2026-06-02' },
        ].map((l, i) => <QueueRow key={i} {...l} actionLabel="Issue Directive" actionColor="bg-purple-600" onAction={() => (window as any).showToast('Directive issued!')} />)}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function FieldOfficerView({ activeTab }: { activeTab: string }) {
  const { t } = useLanguage();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [evaluationStatus, setEvaluationStatus] = useState('RECOMMENDED');
  const [submitting, setSubmitting] = useState(false);

  const [evalTab, setEvalTab] = useState<'pending' | 'history'>('pending');

  const [evaluationDocs, setEvaluationDocs] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const getMemberName = (memberId: string) => {
    const m = members.find(mem => mem.memberId === memberId);
    return m ? (m.nameWithInitials || m.fullName || m.fullNameSinhala || 'Unknown') : 'Unknown';
  };

  // Mobile Collection States
  const [searchAccNum, setSearchAccNum] = useState('');
  const [searchedLoan, setSearchedLoan] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  const fetchLoans = () => {
    setLoading(true);
    LoanService.getLoans().then(setLoans).catch(() => {}).finally(() => setLoading(false));
  };

  const handleSearchLoan = async () => {
    if (!searchAccNum.trim()) {
      setSearchError('කරුණාකර ගිණුම් අංකයක් ඇතුලත් කරන්න');
      return;
    }
    setSearchError('');
    setSearchedLoan(null);
    setLoading(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      const branchLoans = currentUser?.branchId 
        ? await LoanService.getBranchLoans(currentUser.branchId) 
        : await LoanService.getGlobalLoans();
        
      const found = branchLoans.find((l: any) => l.accountNumber === searchAccNum.trim());
      if (!found) {
        setSearchError('මෙම ගිණුම් අංකය සඳහා ණයක් මෙම ශාඛාවෙන් සොයාගත නොහැකි විය.');
      } else if (found.status !== 'ACTIVE' && found.currentStage !== 'DISBURSED') {
        setSearchError('මෙම ණය ගිණුම දැනට සක්‍රීය තත්වයේ නොමැත.');
      } else {
        setSearchedLoan(found);
      }
    } catch (e) {
      setSearchError('සෙවීමේදී දෝෂයක් ඇති විය.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    AccountService.getBranchMembers().then(setMembers).catch(() => {});
  }, []);

  const user = AuthService.getCurrentUser();
  // Fallback to known UUID if the auth service hasn't been restarted to provide user.userId
  const currentUserId = user?.userId || (user?.username === 'field_hkw' ? '5c64fca7-e8d7-454f-b882-467b904d5dbb' : null);
  const assignedLoans = loans.filter(l => l.evaluatorId === currentUserId && l.evaluationStatus === 'ASSIGNED');
  const completedLoans = loans.filter(l => l.evaluatorId === currentUserId && l.evaluationStatus !== 'ASSIGNED');

  const [collectionBalance, setCollectionBalance] = useState(0);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectionLoan, setCollectionLoan] = useState<any>(null);
  const [collectDate, setCollectDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<any>(null);

  // New UI states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [myCollections, setMyCollections] = useState<any[]>([]);
  const [collectionHistoryFilter, setCollectionHistoryFilter] = useState('');

  const fetchMyCollections = async () => {
    try {
      if (user?.username) {
        const all = await LoanService.getFieldCollectionHistory(user.username);
        setMyCollections(all);
      }
    } catch (e) {}
  };

  const fetchFieldBalance = async () => {
    try {
      if (user?.username) {
        const bal = await LoanService.getFieldCollectionBalance(user.username);
        setCollectionBalance(bal);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (activeTab === 'handover' || activeTab === 'overview' || activeTab === 'collection') {
      fetchFieldBalance();
    }
    if (activeTab === 'collection') {
      fetchMyCollections();
    }
  }, [activeTab, user?.username, loans.length]);

  const collectionList = loans.filter(l => l.status === 'ACTIVE' && l.evaluatorId === currentUserId && (l.repaymentMethod === 'FIELD_COLLECTION' || l.applicationData?.repaymentMethod === 'FIELD_COLLECTION'));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEvaluationDocs(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (loanId: string) => {
    if (!evaluationNotes.trim()) return (window as any).showToast('කරුණාකර සටහන් ඇතුලත් කරන්න');
    setSubmitting(true);
    try {
      const payload = JSON.stringify({ text: evaluationNotes, documents: evaluationDocs });
      await LoanService.submitEvaluation(loanId, evaluationStatus, payload);
      (window as any).showToast('වාර්තාව සාර්ථකව යවන ලදී!');
      setSelectedLoan(null);
      setEvaluationNotes('');
      setEvaluationDocs([]);
      fetchLoans();
    } catch(e) {
      (window as any).showToast('දෝෂයකි');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollect = async () => {
    if (!collectAmount || isNaN(Number(collectAmount))) return (window as any).showToast('කරුණාකර නිවැරදි මුදලක් ඇතුලත් කරන්න');
    setSubmitting(true);
    try {
      await LoanService.recordFieldCollection(
        collectionLoan.loanId,
        Number(collectAmount),
        user?.username || 'system',
        user?.branchId || 1,
        collectDate
      );
      (window as any).showToast('මුදල සාර්ථකව එකතු කරන ලදී! (Pending Handover)');
      setShowCollectModal(false);
      setShowSearchModal(false);
      setCollectAmount('');
      setCollectDate(new Date().toLocaleDateString('en-CA'));
      fetchLoans();
      fetchFieldBalance();
      fetchMyCollections();
    } catch(e) {
      (window as any).showToast('දෝෂයක්! කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandover = async () => {
    if (collectionBalance <= 0) return (window as any).showToast('භාරදීමට මුදල් නොමැත.');
    setSubmitting(true);
    try {
      await LoanService.handoverFieldCash({
        fieldOfficerUsername: user?.username || '',
        amount: collectionBalance
      });
      (window as any).showToast('මුදල් භාරදීම සාර්ථකයි!');
      fetchFieldBalance();
    } catch(e) {
      (window as any).showToast('දෝෂයක්!');
    } finally {
      setSubmitting(false);
    }
  };

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText}      label={t(`පොරොත්තු පරීක්ෂණ`)} value={assignedLoans.length} color="text-amber-600" />
          <StatCard icon={Users}         label={t(`අද දින ගමන්`)}      value="0"             color="text-blue-600" />
          <StatCard icon={Banknote}      label={t(`එකතු කළ මුළු මුදල`)}     value="Rs. 0"     color="text-green-600" />
          <StatCard icon={AlertTriangle} label={t(`ප්‍රමාද වූ ණය`)}       value="0"              color="text-red-600" />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><LayoutDashboard size={16} className="text-blue-600" /> {t(`ක්ෂේත්‍ර නිලධාරී සාරාංශය`)}</h3>
          <p className="text-sm text-slate-500 mb-4">{t(`අද දින සඳහා ඔබට පවරා ඇති ණය පරීක්ෂණ සහ මුදල් එකතු කිරීමේ කාර්යයන් පහතින් දැක්වේ.`)}</p>
        </div>
      </div>
    );
  }

  const filteredCollections = myCollections.filter((c: any) => {
    if (!collectionHistoryFilter.trim()) return true;
    const loan = loans.find(l => l.loanId === c.loanId);
    const accNum = loan?.accountNumber || '';
    const name = loan?.applicationData?.name || loan?.applicationData?.applicantName || '';
    const dateStr = new Date(c.createdAt || c.collectedAt).toLocaleDateString();
    
    const term = collectionHistoryFilter.toLowerCase();
    return accNum.toLowerCase().includes(term) || name.toLowerCase().includes(term) || dateStr.includes(term);
  });

  if (activeTab === 'evaluations') {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shadow-inner">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t(`ක්ෂේත්‍ර පරීක්ෂණ (Loan Evaluations)`)}</h3>
              <p className="text-amber-100 text-[11px] font-medium mt-0.5">{t(`පෙර විපරම සහ පසු විපරම`)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6 w-max">
          <button 
            onClick={() => { setEvalTab('pending'); setSelectedLoan(null); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${evalTab === 'pending' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            පවරා ඇති ණය පරීක්ෂණ (Pending)
            {assignedLoans.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${evalTab === 'pending' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>{assignedLoans.length}</span>
            )}
          </button>
          <button 
            onClick={() => { setEvalTab('history'); setSelectedLoan(null); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${evalTab === 'history' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            {t(`අවසන් කළ ණය පරීක්ෂණ (History)`)}</button>
        </div>

        {evalTab === 'pending' ? (
          selectedLoan ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-amber-600" /> {t(`වාර්තාව ඇතුලත් කිරීම`)}</h3>
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h4 className="font-bold text-lg">{selectedLoan.applicationData?.name || selectedLoan.applicationData?.applicantName || 'N/A'}</h4>
                     <p className="text-sm text-amber-700">Rs. {Number(selectedLoan.requestedAmount).toLocaleString()} - {selectedLoan.loanType?.name || 'ණය'}</p>
                   </div>
                   <button onClick={() => { setSelectedLoan(null); setEvaluationDocs([]); }} className="text-amber-500 hover:text-amber-700"><X size={20}/></button>
                 </div>

                 <div className="mb-4 p-4 bg-white border border-amber-200 rounded-xl space-y-2">
                   <h5 className="font-bold text-slate-800 text-sm">{t(`Customer Details (ගනුදෙනුකරුගේ විස්තර)`)}</h5>
                   <p className="text-sm text-slate-600"><strong>{t(`ලිපිනය (Address):`)}</strong> {selectedLoan.applicationData?.addressLine1} {selectedLoan.applicationData?.addressLine2}</p>
                   <p className="text-sm text-slate-600"><strong>{t(`දුරකථන (Phone):`)}</strong> {selectedLoan.applicationData?.phone}</p>
                   <p className="text-sm text-slate-600"><strong>{t(`හැඳුනුම්පත (NIC):`)}</strong> {selectedLoan.applicationData?.nic}</p>
                   <p className="text-sm text-slate-600"><strong>{t(`ණය අරමුණ (Purpose):`)}</strong> {selectedLoan.applicationData?.loanPurpose}</p>
                 </div>
                 
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">{t(`නිර්දේශය (Recommendation)`)}</label>
                     <select value={evaluationStatus} onChange={e => setEvaluationStatus(e.target.value)} className="w-full border border-amber-300 rounded-lg p-2 bg-white">
                       <option value="RECOMMENDED">{t(`අනුමත කිරීමට නිර්දේශ කරමි (Recommend)`)}</option>
                       <option value="NOT_RECOMMENDED">{t(`නිර්දේශ නොකරමි (Not Recommend)`)}</option>
                       <option value="NEEDS_MORE_INFO">{t(`වැඩිදුර තොරතුරු අවශ්‍යයි (Needs More Info)`)}</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">{t(`ඇගයීම් සටහන් (Evaluation Notes)`)}</label>
                     <textarea value={evaluationNotes} onChange={e => setEvaluationNotes(e.target.value)} rows={4} className="w-full border border-amber-300 rounded-lg p-2 bg-white" placeholder={t(`පරීක්ෂාවේදී නිරීක්ෂණය කළ කරුණු...`)}></textarea>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">{t(`ඡායාරූප / ලියකියවිලි (Documents/Photos)`)}</label>
                     <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full border border-amber-300 rounded-lg p-2 bg-white text-sm" />
                     {evaluationDocs.length > 0 && (
                       <div className="flex gap-2 mt-2 flex-wrap">
                         {evaluationDocs.map((doc, i) => (
                           <img key={i} src={doc} alt="Preview" className="h-16 w-auto rounded border border-amber-200 object-cover" />
                         ))}
                       </div>
                     )}
                   </div>
                   <button onClick={() => handleSubmit(selectedLoan.loanId)} disabled={submitting} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50">
                     {submitting ? 'යැවෙමින් පවතී...' : 'වාර්තාව යවන්න (Submit)'}
                   </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                 <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-amber-600" /> {t(`පවරා ඇති ණය පරීක්ෂණ (Pending)`)}</h3>
                 <div className="space-y-3">
                   {loading ? (
                     <p className="text-slate-500 text-sm text-center py-4">Loading...</p>
                   ) : assignedLoans.length === 0 ? (
                     <p className="text-slate-500 text-sm text-center py-4 border border-dashed rounded-xl border-slate-300">{t(`පවරා ඇති ණය පරීක්ෂණ නොමැත.`)}</p>
                   ) : (
                     assignedLoans.map((l: any) => {
                       const loanName = l.applicationData?.name || l.applicationData?.applicantName || 'Unknown';
                       return (
                         <div key={l.loanId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">{loanName.charAt(0)}</div>
                             <div>
                               <p className="text-sm font-semibold text-slate-800">{loanName}</p>
                               <p className="text-xs text-slate-500">{l.loanType?.name || 'ණය'} - Rs. {Number(l.requestedAmount).toLocaleString()}</p>
                             </div>
                           </div>
                           <button onClick={() => { setSelectedLoan(l); setEvaluationNotes(''); setEvaluationStatus('RECOMMENDED'); }} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700">{t(`වාර්තාව ඇතුලත් කරන්න`)}</button>
                         </div>
                       );
                     })
                   )}
                 </div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" /> {t(`අවසන් කළ ණය පරීක්ෂණ (History)`)}</h3>
             <div className="space-y-3">
               {loading ? (
                 <p className="text-slate-500 text-sm text-center py-4">Loading...</p>
               ) : completedLoans.length === 0 ? (
                 <p className="text-slate-500 text-sm text-center py-4 border border-dashed rounded-xl border-slate-300">{t(`අවසන් කළ ණය පරීක්ෂණ නොමැත.`)}</p>
               ) : (
                 completedLoans.map((l: any) => {
                   const loanName = l.applicationData?.name || l.applicationData?.applicantName || 'Unknown';
                   return (
                     <div key={l.loanId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">{loanName.charAt(0)}</div>
                         <div>
                           <p className="text-sm font-semibold text-slate-800">{loanName}</p>
                           <p className="text-xs text-slate-500">{l.loanType?.name || 'ණය'} - {l.evaluationStatus}</p>
                         </div>
                       </div>
                       <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">{t(`යවා ඇත`)}</span>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'collection') {
    const searchSuggestions = searchAccNum.trim().length >= 2 && (!searchedLoan || searchedLoan.accountNumber !== searchAccNum)
      ? loans.filter((l: any) => 
          (l.branchId === user?.branchId || !l.branchId) && // Some loans might not have branchId in older mock data
          (l.status === 'ACTIVE' || l.currentStage === 'DISBURSED') &&
          ((l.accountNumber || '').toLowerCase().includes(searchAccNum.toLowerCase()) || 
          (l.applicationData?.name || '').toLowerCase().includes(searchAccNum.toLowerCase()) ||
          (getMemberName(l.memberId) || '').toLowerCase().includes(searchAccNum.toLowerCase()))
        ).slice(0, 5)
      : [];

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shadow-inner">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t(`දෛනික එකතු කිරීම් (Mobile Collection)`)}</h3>
              <p className="text-emerald-100 text-[11px] font-medium mt-0.5">{t(`ණය සහ ඉතුරුම් වාරික එකතු කිරීම`)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><MapPin size={16} className="text-emerald-600" /> {t(`මුදල් එකතු කිරීම් ඉතිහාසය (Collection History)`)}</h3>
            <button 
              onClick={() => { setSearchAccNum(''); setSearchedLoan(null); setShowSearchModal(true); }}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} /> {t(`අලුත් එකතු කිරීමක් (Add Collection)`)}</button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={t(`දිනය, නම හෝ ගිණුම් අංකයෙන් සොයන්න (Search by date, name or account number)`)}
                value={collectionHistoryFilter}
                onChange={e => setCollectionHistoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredCollections.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8 border border-dashed rounded-xl border-slate-300 bg-slate-50">
                {t(`ගැලපෙන කිසිදු මුදල් එකතු කිරීමක් හමු නොවිණි.`)}</p>
            ) : (
              filteredCollections.map((c: any, i: number) => {
                const matchedLoan = loans.find(l => l.loanId === c.loanId);
                const name = matchedLoan?.applicationData?.name || matchedLoan?.applicationData?.applicantName || 'Unknown';
                const accNum = matchedLoan?.accountNumber || c.loanId.substring(0, 8);
                const isHandedOver = c.status === 'HANDED_OVER';

                return (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md hover:border-emerald-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${isHandedOver ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'} flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform`}>
                      <Banknote size={20} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-800"><span className="text-slate-600 font-medium text-sm mr-2">{t(`සාමාජිකයාගේ නම:`)}</span>{name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[12px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">
                           <span className="text-slate-500 font-semibold font-sans mr-1">{t(`ණය අංකය:`)}</span>{accNum}
                        </span>
                        {(matchedLoan?.applicationData?.membershipNumber || matchedLoan?.applicationData?.memberNo || matchedLoan?.applicationData?.nic) && (
                          <span className="text-[12px] font-bold bg-slate-50 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-slate-500 font-semibold mr-1">{matchedLoan?.applicationData?.membershipNumber || matchedLoan?.applicationData?.memberNo ? 'සාමාජික අංකය:' : 'ජා.හැ.ප අංකය:'}</span>
                            {matchedLoan?.applicationData?.membershipNumber || matchedLoan?.applicationData?.memberNo || matchedLoan?.applicationData?.nic}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-700 font-bold">
                        <Calendar size={14} className="text-slate-500" />
                        <span>{new Date(c.createdAt || c.collectedAt || Date.now()).toLocaleDateString('si-LK')}</span>
                        <span className="text-slate-400 mx-1">•</span>
                        <Clock size={14} className="text-slate-500" />
                        <span>{new Date(c.createdAt || c.collectedAt || Date.now()).toLocaleTimeString('si-LK', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`text-lg font-black tracking-tight ${isHandedOver ? 'text-blue-700' : 'text-emerald-700'}`}>Rs. {c.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg mt-1.5 border ${isHandedOver ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {isHandedOver ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{isHandedOver ? 'Handed Over' : 'Pending Handover'}</span>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Search Modal */}
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Search className="text-emerald-600" size={20}/> {t(`ණය ගිණුම සොයන්න`)}</h3>
                  <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <div className="flex gap-3 mb-6 relative">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder={t(`උදා: LN-12345 (Enter Loan Account Number)`)} 
                      value={searchAccNum} 
                      onChange={e => { setSearchAccNum(e.target.value); setSearchedLoan(null); setSearchError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSearchLoan()}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                    {searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {searchSuggestions.map((s: any) => (
                          <div 
                            key={s.loanId} 
                            onClick={() => {
                              setSearchAccNum(s.accountNumber);
                              setSearchedLoan(s);
                              setSearchError('');
                            }}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-800">{s.applicationData?.name || s.applicationData?.applicantName || getMemberName(s.memberId) || 'Unknown'}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{s.accountNumber}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleSearchLoan} 
                    disabled={loading}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-colors h-[50px] self-start"
                  >
                    {loading ? 'සොයමින්...' : 'සොයන්න'}
                  </button>
                </div>

                {searchError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertTriangle size={16} /> {searchError}
                  </div>
                )}

                {searchedLoan && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between p-5 rounded-xl border-2 border-emerald-100 bg-emerald-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xl shadow-inner">
                          {(searchedLoan.applicationData?.name || searchedLoan.applicationData?.applicantName || getMemberName(searchedLoan.memberId) || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-800">{searchedLoan.applicationData?.name || searchedLoan.applicationData?.applicantName || getMemberName(searchedLoan.memberId) || 'Unknown'}</p>
                          <p className="text-sm text-slate-600 font-medium font-mono bg-white px-2 py-0.5 rounded border border-slate-100 inline-block mt-1">{searchedLoan.accountNumber}</p>
                          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><MapPin size={12}/> {searchedLoan.applicationData?.addressLine1}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedLoanForDetails(searchedLoan)} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1 shadow-sm transition-colors">
                            <Eye size={14} /> {t(`විස්තර`)}</button>
                          <button onClick={() => { setCollectionLoan(searchedLoan); setShowCollectModal(true); setCollectAmount(''); setCollectDate(new Date().toLocaleDateString('en-CA')); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-md transition-all hover:scale-105 active:scale-95">
                            <Plus size={14} /> {t(`එකතු කරන්න`)}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Collection Modal */}
        {showCollectModal && collectionLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t(`වාරිකය එකතු කිරීම`)}</h3>
                <div className="flex justify-between items-start mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{collectionLoan.applicationData?.name || collectionLoan.applicationData?.applicantName || getMemberName(collectionLoan.memberId) || 'Unknown'}</p>
                    <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs text-slate-600 ml-1 marker:text-emerald-500">
                      <li>
                        <span className="font-bold text-slate-800">{t(`ණය අංකය:`)}</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{collectionLoan.accountNumber}</span>
                      </li>
                      {(collectionLoan.applicationData?.membershipNumber || collectionLoan.applicationData?.memberNo || collectionLoan.applicationData?.nic) && (
                        <li>
                          <span className="font-bold text-slate-800">{collectionLoan.applicationData?.membershipNumber || collectionLoan.applicationData?.memberNo ? 'සාමාජික අංකය:' : 'ජා.හැ.ප අංකය:'}</span>{' '}
                          <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium border border-emerald-100">
                            {collectionLoan.applicationData?.membershipNumber || collectionLoan.applicationData?.memberNo || collectionLoan.applicationData?.nic}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                  <input 
                    type="date" 
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-300 shadow-sm mt-0.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t(`මුදල (Rs.)`)}</label>
                  <input type="number" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} className="w-full border-2 border-emerald-500 rounded-xl p-3 text-lg font-bold text-emerald-800 focus:outline-none" autoFocus placeholder="1000" />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCollectModal(false)} className="px-4 py-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-sm">{t(`අවලංගු කරන්න`)}</button>
                  <button onClick={handleCollect} disabled={submitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                    {submitting ? 'එකතු කරමින්...' : 'එකතු කරන්න'}
                  </button>
                </div>
             </div>
          </div>
        )}
        {/* View Details Modal */}
        {selectedLoanForDetails && (
          <LoanDetailModal loan={selectedLoanForDetails} onClose={() => setSelectedLoanForDetails(null)} />
        )}
      </div>
    );
  }

  if (activeTab === 'handover') {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shadow-inner">
              <Banknote size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{t(`මුදල් භාරදීම (Cash Handover)`)}</h3>
              <p className="text-blue-100 text-[11px] font-medium mt-0.5">{t(`අද දින එකතු කරන ලද මුදල් ශාඛාවට භාරදීම`)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
           <Banknote size={48} className="text-blue-200 mx-auto mb-4" />
           <h2 className="text-4xl font-black text-slate-800 mb-2">Rs. {collectionBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
           <p className="text-sm text-slate-500 mb-6">{t(`අද දින එකතු කළ මුළු මුදල (භාරදීමට නියමිත)`)}</p>
           <button onClick={handleHandover} disabled={collectionBalance <= 0 || submitting} className={`px-6 py-3 font-bold rounded-xl shadow-md transition ${collectionBalance > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
             {submitting ? 'භාර දෙමින්...' : 'Teller වෙත මුදල් භාරදීම තහවුරු කරන්න'}
           </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── General Ledger View ──────────────────────────────────────────────────────
function LedgerView({ branchId }: { branchId?: number }) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LedgerService.LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      let data: LedgerService.LedgerEntry[];
      if (fromDate && toDate) {
        data = await LedgerService.getLedgerByRange(fromDate, toDate, branchId);
      } else if (branchId) {
        data = await LedgerService.getBranchLedger(branchId);
      } else {
        data = await LedgerService.getAllLedgerEntries();
      }
      setEntries(data);
    } catch {
      setError('Failed to load GL entries. Make sure the loan service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = filterType === 'ALL' ? entries : entries.filter(e => e.entryType === filterType);
  const totalDebit  = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const totalCredit = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const accountLabel = (code: string) =>
    LedgerService.GL_ACCOUNT_LABELS[code] || code;

  const accountColor = (code: string) => {
    if (code === 'LOAN_RECEIVABLE')  return 'bg-blue-100 text-blue-800';
    if (code === 'CASH_IN_VAULT')    return 'bg-emerald-100 text-emerald-800';
    if (code === 'SAVINGS_DEPOSITS') return 'bg-purple-100 text-purple-800';
    if (code === 'INTEREST_INCOME')  return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
          <p className="text-2xl font-black text-slate-800">{filtered.length}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Debit (Loan Assets)</p>
          <p className="text-2xl font-black text-blue-800">Rs. {totalDebit.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Credit (Cash / Savings)</p>
          <p className="text-2xl font-black text-emerald-800">Rs. {totalCredit.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Entry Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              <option value="ALL">All Types</option>
              <option value="DISBURSEMENT">Disbursements</option>
              <option value="REPAYMENT">Repayments</option>
              <option value="INTEREST">Interest</option>
            </select>
          </div>
          <button onClick={fetchEntries}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
            🔍 Apply Filter
          </button>
          <button onClick={() => { setFromDate(''); setToDate(''); setFilterType('ALL'); setTimeout(fetchEntries, 0); }}
            className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition">
            Clear
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <BookOpen size={18} className="text-blue-600" />
          <h3 className="font-bold text-slate-800">{t(`ණය ලෙජරය — General Ledger`)}</h3>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading GL entries...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No ledger entries found.</p>
            <p className="text-slate-400 text-xs mt-1">GL entries are automatically created when loans are disbursed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Debit Account</th>
                  <th className="px-5 py-3">Credit Account</th>
                  <th className="px-5 py-3 text-right">Amount (Rs.)</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(entry => (
                  <tr key={entry.entryId} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{entry.entryDate}</td>
                    <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold whitespace-nowrap">{entry.referenceNumber || '—'}</td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs">
                      <p className="text-xs leading-snug">{entry.description}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${accountColor(entry.debitAccount)}`}>
                        {accountLabel(entry.debitAccount)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${accountColor(entry.creditAccount)}`}>
                        {accountLabel(entry.creditAccount)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">
                      {Number(entry.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {entry.paymentMethod || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{entry.createdBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-700 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-right text-sm">TOTALS</td>
                  <td className="px-5 py-3 text-right font-mono text-base text-blue-800">
                    Rs. {totalDebit.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Summary Ledger View (ශේෂ පත්‍ර ලේඛන සාරාංශය) ──────────────────────────────
function SummaryLedgerView({ branchId, members }: { branchId?: number; members: AccountService.MemberData[] }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    BranchService.getBranches().then(setBranches).catch(() => {});
  }, []);

  const getDynamicBranchName = () => {
    const b = branches.find(x => x.branchId === branchId);
    return b ? b.branchName : `Branch ${branchId}`;
  };
  const [summaryData, setSummaryData] = useState<{
    memberActive: { name: string; count: number; balance: number }[];
    memberInactive: { name: string; count: number; balance: number }[];
    nonMemberActive: { name: string; count: number; balance: number }[];
    nonMemberInactive: { name: string; count: number; balance: number }[];
    fds: { name: string; count: number; balance: number }[];
    loans: { name: string; count: number; balance: number }[];
    pawning: { name: string; count: number; balance: number }[];
    totalSavings: number;
    totalFds: number;
    totalLoans: number;
    totalPawn: number;
    totalLiabilities: number;
    totalAssets: number;
  } | null>(null);

  const MONTHS = [
    { value: 1, label: 'ජනවාරි (January)' },
    { value: 2, label: 'පෙබරවාරි (February)' },
    { value: 3, label: 'මාර්තු (March)' },
    { value: 4, label: 'අප්‍රේල් (April)' },
    { value: 5, label: 'මැයි (May)' },
    { value: 6, label: 'ජූනි (June)' },
    { value: 7, label: 'ජූලි (July)' },
    { value: 8, label: 'අගෝස්තු (August)' },
    { value: 9, label: 'සැප්තැම්බර් (September)' },
    { value: 10, label: 'ඔක්තෝබර් (October)' },
    { value: 11, label: 'නොවැම්බර් (November)' },
    { value: 12, label: 'දෙසැම්බර් (December)' },
  ];

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [savings, fds, loansList, pawnTickets, fdTypes] = await Promise.all([
        AccountService.getBranchAccounts().catch(() => []),
        AccountService.getFixedDeposits().catch(() => []),
        LoanService.getLoans().catch(() => []),
        PawningService.getTicketsByBranch(branchId || 1).catch(() => []),
        AccountService.getFixedDepositTypes().catch(() => [])
      ]);

      const year = new Date().getFullYear();
      const endDay = new Date(year, selectedMonth, 0).getDate();
      const toDateStr = `${year}-${String(selectedMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      const toDateVal = new Date(toDateStr);

      const isBeforeDate = (dateVal: any) => {
        if (!dateVal) return true;
        return new Date(dateVal) <= toDateVal;
      };

      // Filter by selected month
      const filteredSavings = savings.filter((a: any) => isBeforeDate(a.openedDate));
      const filteredFds = fds.filter((f: any) => f.status === 'ACTIVE' && isBeforeDate(f.openedDate));
      
      const filteredLoans = loansList.filter((l: any) => {
        if (l.status !== 'ACTIVE' && l.status !== 'DISBURSED') return false;
        const lDate = l.disbursementDate || l.createdAt || l.appliedDate;
        return isBeforeDate(lDate);
      });

      const filteredPawn = pawnTickets.filter((t: any) => {
        if (t.status !== 'ACTIVE' && t.status !== 'OVERDUE') return false;
        return isBeforeDate(t.issueDate);
      });

      const getDisplayName = (typeStr: string) => {
        const tLower = typeStr.toLowerCase().trim();
        if (tLower === 'samanaya' || tLower === 'normal') return 'සාමාන්‍ය';
        if (tLower === 'janasetha') return 'ජනසෙත';
        if (tLower === 'ranthilina') return 'රන්තිලින';
        if (tLower === 'arunalu') return 'අරුණලු';
        if (tLower === 'dhana_yojana' || tLower === 'dhana yojana') return 'ධනෝපායන';
        if (tLower === 'vandana') return 'වන්දනා';
        if (tLower === 'jeewana' || tLower === 'jeevana') return 'ජීවන';
        if (tLower === 'sewana') return 'සෙවන';
        return typeStr;
      };

      // 1. Group Savings by member status and active status
      const memberActiveGroups: { [key: string]: { count: number; balance: number } } = {};
      const memberInactiveGroups: { [key: string]: { count: number; balance: number } } = {};
      const nonMemberActiveGroups: { [key: string]: { count: number; balance: number } } = {};
      const nonMemberInactiveGroups: { [key: string]: { count: number; balance: number } } = {};

      filteredSavings.forEach((a: any) => {
        const rawType = a.accountType || 'Normal Savings';
        const type = getDisplayName(rawType);
        const member = members.find((m: any) => m.memberId === a.memberId);
        const isMember = member ? member.isMember !== false : false;
        const isActive = a.status === 'ACTIVE';

        const targetGroup = isMember 
          ? (isActive ? memberActiveGroups : memberInactiveGroups)
          : (isActive ? nonMemberActiveGroups : nonMemberInactiveGroups);

        if (!targetGroup[type]) {
          targetGroup[type] = { count: 0, balance: 0 };
        }
        targetGroup[type].count += 1;
        targetGroup[type].balance += Number(a.balance) || 0;
      });

      const memberActiveList = Object.keys(memberActiveGroups).map(name => ({
        name,
        count: memberActiveGroups[name].count,
        balance: memberActiveGroups[name].balance
      }));
      const memberInactiveList = Object.keys(memberInactiveGroups).map(name => ({
        name,
        count: memberInactiveGroups[name].count,
        balance: memberInactiveGroups[name].balance
      }));
      const nonMemberActiveList = Object.keys(nonMemberActiveGroups).map(name => ({
        name,
        count: nonMemberActiveGroups[name].count,
        balance: nonMemberActiveGroups[name].balance
      }));
      const nonMemberInactiveList = Object.keys(nonMemberInactiveGroups).map(name => ({
        name,
        count: nonMemberInactiveGroups[name].count,
        balance: nonMemberInactiveGroups[name].balance
      }));

      // 2. Fixed Deposits (Group by category only)
      const getFdCategoryName = (f: any) => {
        const typeObj = fdTypes.find((t: any) => t.id === f.typeId || t.id === f.fdTypeId);
        if (typeObj && typeObj.name) {
          // E.g. "සාමාන්‍ය ස්ථාවර තැන්පතු - 12 මාස" -> "සාමාන්‍ය ස්ථාවර තැන්පතු"
          return typeObj.name.split(' - ')[0].trim();
        }
        // Fallback if type not found
        return 'සාමාන්‍ය ස්ථාවර තැන්පතු';
      };

      const fdGroups: { [key: string]: { count: number; balance: number } } = {};
      filteredFds.forEach((f: any) => {
        const type = getFdCategoryName(f);
        
        if (!fdGroups[type]) {
          fdGroups[type] = { count: 0, balance: 0 };
        }
        fdGroups[type].count += 1;
        fdGroups[type].balance += Number(f.principalAmount) || 0;
      });

      const fdList = Object.keys(fdGroups).map(name => ({
        name,
        count: fdGroups[name].count,
        balance: fdGroups[name].balance
      }));

      // 3. Group Loans by type
      const loanGroups: { [key: string]: { count: number; balance: number } } = {};
      filteredLoans.forEach((l: any) => {
        const type = l.loanType?.name || l.loanTypeStr || 'Normal Loan';
        if (!loanGroups[type]) {
          loanGroups[type] = { count: 0, balance: 0 };
        }
        loanGroups[type].count += 1;
        loanGroups[type].balance += Number(l.outstandingBalance || l.amount || 0);
      });

      const loanList = Object.keys(loanGroups).map(name => ({
        name,
        count: loanGroups[name].count,
        balance: loanGroups[name].balance
      }));

      // 4. Pawning
      const totalPawnLoan = filteredPawn.reduce((sum: number, t: any) => sum + (Number(t.advanceAmount) || 0), 0);
      let totalPaymentsCount = 0;
      let totalPaymentsAmount = 0;
      filteredPawn.forEach((t: any) => {
        if (t.payments && Array.isArray(t.payments)) {
          totalPaymentsCount += t.payments.length;
          totalPaymentsAmount += t.payments.reduce((sum: number, p: any) => sum + (Number(p.paymentAmount) || 0), 0);
        }
      });

      const pawnList: any[] = [];
      if (filteredPawn.length > 0) {
        pawnList.push({ name: 'උ/ණය (Pawn Loans)', count: filteredPawn.length, balance: totalPawnLoan });
        pawnList.push({ name: 'උ/වාරික (Pawn Repayments)', count: totalPaymentsCount, balance: totalPaymentsAmount });
      }

      const totalS = filteredSavings.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
      const totalF = fdList.reduce((s, i) => s + i.balance, 0);
      const totalL = loanList.reduce((s, i) => s + i.balance, 0);
      const totalP = totalPawnLoan - totalPaymentsAmount;

      setSummaryData({
        memberActive: memberActiveList,
        memberInactive: memberInactiveList,
        nonMemberActive: nonMemberActiveList,
        nonMemberInactive: nonMemberInactiveList,
        fds: fdList,
        loans: loanList,
        pawning: pawnList,
        totalSavings: totalS,
        totalFds: totalF,
        totalLoans: totalL,
        totalPawn: totalP,
        totalLiabilities: totalS + totalF,
        totalAssets: totalL + totalP
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [branchId, selectedMonth]);

  const splitBalance = (val: number) => {
    const parts = Number(val || 0).toFixed(2).split('.');
    return {
      rupees: parts[0],
      cents: parts[1]
    };
  };

  const handlePrint = () => {
    const element = document.getElementById('summary-ledger-printable');
    if (!element) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Copy all style links and scripts from the parent document to print window so styles compile
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Summary Ledger - ${t(getDynamicBranchName())}</title>
          ${styles}
          <style>
            @media print {
              body {
                background-color: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              /* Landscape orientation for wider tables */
              @page {
                size: A4 landscape;
                margin: 5mm;
              }
              #summary-ledger-printable {
                border: 3px solid #1E40AF !important;
                box-shadow: none !important;
                padding: 15px !important;
                background-image: none !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
              }
            }
            body {
              padding: 20px;
              background-color: #FAF8F5;
              font-family: 'Noto Sans Sinhala', sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="w-full">
            ${element.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Premium Outside Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center text-[#1E40AF]">
            <ClipboardList size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">{t(`ශාඛා සාරාංශ ලේඛනය (Branch Summary Ledger)`)}</h4>
            <p className="text-xs text-slate-500 font-medium">ශාඛාව (Branch): {t(getDynamicBranchName())}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{t(`මාසය තෝරන්න (Select Month):`)}</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm min-w-[150px]"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Printer size={14} />
            {t(`මුද්‍රණය කරන්න (Print)`)}</button>
        </div>
      </div>

      <div id="summary-ledger-printable" className="bg-[#FAF8F5] rounded-3xl border-4 border-[#1E40AF]/30 shadow-2xl p-8 relative overflow-hidden select-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
             backgroundSize: '100% 30px',
             lineHeight: '30px'
           }}>
        
        {/* Lined Notebook Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-blue-500/40 pb-3 shrink-0">
          <div className="text-xs font-bold text-blue-600 font-mono">ශාඛාව (Branch): {t(getDynamicBranchName())}</div>
          <div className="text-xs font-bold text-blue-600 font-mono">
            මාසය (Month): {MONTHS.find(m => m.value === selectedMonth)?.label}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-blue-700 animate-pulse font-bold text-sm">{t(`දත්ත සාරාංශය සකස් කරමින්... (Generating ledger balances...)`)}</div>
        ) : !summaryData ? (
          <div className="p-12 text-center text-blue-700 font-bold text-sm">{t(`දත්ත ලබා ගැනීමට අපොහොසත් විය.`)}</div>
        ) : (
          <div className="grid grid-cols-2 border-4 border-[#1E40AF] rounded-2xl overflow-hidden divide-x-4 divide-double divide-[#1E40AF] bg-[#FAF8F5]">
            
            {/* Left Side: Liabilities (Savings & Fixed) */}
            <div>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#1E40AF] text-[#1E40AF] font-bold bg-blue-50/30">
                    <th className="px-3 py-2 border-r border-[#1E40AF]/40 w-[45%]">{t(`ලේඛනය (Category)`)}</th>
                    <th className="px-3 py-2 border-r border-[#1E40AF]/40 text-center w-[15%]">{t(`ගි/ගණ`)}</th>
                    <th className="px-3 py-2 text-right w-[40%]" colSpan={2}>{t(`ශේෂය (Balance)`)}</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-[#1D3D8C]">
                  
                  {/* 1. Main Headline */}
                  <tr className="bg-amber-50/20 text-[#C22727] border-b border-[#1E40AF]/30">
                    <td className="px-3 py-1 font-bold italic" colSpan={4}>{t(`ඉතුරුම් තැන්පතු (Savings Deposits)`)}</td>
                  </tr>

                  {/* 1.1 සාමාජික ගිණුම් (Member Accounts) */}
                  {summaryData.memberActive.length > 0 && (
                    <>
                      <tr className="bg-blue-50/5 text-slate-700 border-b border-[#1E40AF]/20 font-bold italic text-xs">
                        <td className="px-4 py-0.5 pl-6" colSpan={4}>{t(`සාමාජික ගිණුම් (Member Accounts)`)}</td>
                      </tr>
                      {summaryData.memberActive.map((item, idx) => {
                        const sb = splitBalance(item.balance);
                        return (
                          <tr key={`sav-ma-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20">
                            <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-10">{item.name}</td>
                            <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                            <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                            <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-blue-200 text-blue-900 bg-blue-50/80 font-extrabold shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]">
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-8 text-[11px] italic">{t(`එකතුව (සාමාජික ගිණුම්)`)}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono text-[11px]">
                          {summaryData.memberActive.reduce((s, i) => s + i.count, 0)}
                        </td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20 text-[11px]">
                          {splitBalance(summaryData.memberActive.reduce((s, i) => s + i.balance, 0)).rupees}
                        </td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                          {splitBalance(summaryData.memberActive.reduce((s, i) => s + i.balance, 0)).cents}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 1.2 සාමාජික නොවන ගිණුම් (Non-Member Accounts) */}
                  {summaryData.nonMemberActive.length > 0 && (
                    <>
                      <tr className="bg-blue-50/5 text-slate-700 border-b border-[#1E40AF]/20 font-bold italic text-xs">
                        <td className="px-4 py-0.5 pl-6" colSpan={4}>{t(`සාමාජික නොවන ගිණුම් (Non-Member Accounts)`)}</td>
                      </tr>
                      {summaryData.nonMemberActive.map((item, idx) => {
                        const sb = splitBalance(item.balance);
                        return (
                          <tr key={`sav-nma-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20">
                            <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-10">{item.name}</td>
                            <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                            <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                            <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-blue-200 text-blue-900 bg-blue-50/80 font-extrabold shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]">
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-8 text-[11px] italic">{t(`එකතුව (සාමාජික නොවන ගිණුම්)`)}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono text-[11px]">
                          {summaryData.nonMemberActive.reduce((s, i) => s + i.count, 0)}
                        </td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20 text-[11px]">
                          {splitBalance(summaryData.nonMemberActive.reduce((s, i) => s + i.balance, 0)).rupees}
                        </td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                          {splitBalance(summaryData.nonMemberActive.reduce((s, i) => s + i.balance, 0)).cents}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 1.3 සාමාජික අක්‍රීය ගිණුම් (Inactive Member Accounts) */}
                  {summaryData.memberInactive.length > 0 && (
                    <>
                      <tr className="bg-blue-50/5 text-slate-700 border-b border-[#1E40AF]/20 font-bold italic text-xs">
                        <td className="px-4 py-0.5 pl-6" colSpan={4}>{t(`සාමාජික අක්‍රීය ගිණුම් (Inactive Member Accounts)`)}</td>
                      </tr>
                      {summaryData.memberInactive.map((item, idx) => {
                        const sb = splitBalance(item.balance);
                        return (
                          <tr key={`sav-mi-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20 text-slate-500 bg-blue-50/5">
                            <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-10">{item.name}</td>
                            <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                            <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                            <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-blue-200 text-blue-900 bg-blue-50/80 font-extrabold shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]">
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-8 text-[11px] italic">{t(`එකතුව (සාමාජික අක්‍රීය)`)}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono text-[11px]">
                          {summaryData.memberInactive.reduce((s, i) => s + i.count, 0)}
                        </td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20 text-[11px]">
                          {splitBalance(summaryData.memberInactive.reduce((s, i) => s + i.balance, 0)).rupees}
                        </td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                          {splitBalance(summaryData.memberInactive.reduce((s, i) => s + i.balance, 0)).cents}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 1.4 සාමාජික නොවන අක්‍රීය ගිණුම් (Inactive Non-Member Accounts) */}
                  {summaryData.nonMemberInactive.length > 0 && (
                    <>
                      <tr className="bg-blue-50/5 text-slate-700 border-b border-[#1E40AF]/20 font-bold italic text-xs">
                        <td className="px-4 py-0.5 pl-6" colSpan={4}>{t(`සාමාජික නොවන අක්‍රීය ගිණුම් (Inactive Non-Member Accounts)`)}</td>
                      </tr>
                      {summaryData.nonMemberInactive.map((item, idx) => {
                        const sb = splitBalance(item.balance);
                        return (
                          <tr key={`sav-nmi-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20 text-slate-500 bg-blue-50/5">
                            <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-10">{item.name}</td>
                            <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                            <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                            <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b border-blue-200 text-blue-900 bg-blue-50/80 font-extrabold shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]">
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-8 text-[11px] italic">{t(`එකතුව (සාමාජික නොවන අක්‍රීය)`)}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono text-[11px]">
                          {summaryData.nonMemberInactive.reduce((s, i) => s + i.count, 0)}
                        </td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20 text-[11px]">
                          {splitBalance(summaryData.nonMemberInactive.reduce((s, i) => s + i.balance, 0)).rupees}
                        </td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                          {splitBalance(summaryData.nonMemberInactive.reduce((s, i) => s + i.balance, 0)).cents}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 1.3 මුළු ඉතුරුම් තැන්පතු එකතුව */}
                  <tr className="bg-blue-100/80 text-[#1E40AF] font-black border-b-2 border-blue-300 shadow-[inset_0_0_15px_rgba(30,64,175,0.25)]">
                    <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-6">{t(`එකතුව (ඉතුරුම් තැන්පතු)`)}</td>
                    <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">
                      {summaryData.memberActive.reduce((s, i) => s + i.count, 0) +
                       summaryData.memberInactive.reduce((s, i) => s + i.count, 0) +
                       summaryData.nonMemberActive.reduce((s, i) => s + i.count, 0) +
                       summaryData.nonMemberInactive.reduce((s, i) => s + i.count, 0)}
                    </td>
                    <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">
                      {splitBalance(summaryData.totalSavings).rupees}
                    </td>
                    <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                      {splitBalance(summaryData.totalSavings).cents}
                    </td>
                  </tr>

                  {/* 2. Fixed Deposits Section Headline */}
                  <tr className="bg-amber-50/20 text-[#C22727] border-b border-[#1E40AF]/30">
                    <td className="px-3 py-1 font-bold italic" colSpan={4}>{t(`ස්ථාවර තැන්පතු (Fixed Deposits)`)}</td>
                  </tr>
                  {summaryData.fds.map((item, idx) => {
                    const sb = splitBalance(item.balance);
                    return (
                      <tr key={`fd-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20">
                        <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-6">{item.name}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                      </tr>
                    );
                  })}
                  {summaryData.fds.length > 0 && (
                    <tr className="bg-blue-100/80 text-[#1E40AF] font-black border-b-2 border-blue-300 shadow-[inset_0_0_15px_rgba(30,64,175,0.25)]">
                      <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-6">{t(`එකතුව (ස්ථාවර තැන්පතු)`)}</td>
                      <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">
                        {summaryData.fds.reduce((s, i) => s + i.count, 0)}
                      </td>
                      <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">
                        {splitBalance(summaryData.totalFds).rupees}
                      </td>
                      <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                        {splitBalance(summaryData.totalFds).cents}
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* Right Side: Assets (Loans & Pawning) */}
            <div>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#1E40AF] text-[#1E40AF] font-bold bg-blue-50/30">
                    <th className="px-3 py-2 border-r border-[#1E40AF]/40 w-[45%]">{t(`ලේඛනය (Category)`)}</th>
                    <th className="px-3 py-2 border-r border-[#1E40AF]/40 text-center w-[15%]">{t(`ගි/ගණ`)}</th>
                    <th className="px-3 py-2 text-right w-[40%]" colSpan={2}>{t(`ශේෂය (Balance)`)}</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-[#1D3D8C]">
                  
                  {/* 1. Loans Section Headline */}
                  <tr className="bg-amber-50/20 text-[#C22727] border-b border-[#1E40AF]/30">
                    <td className="px-3 py-1 font-bold italic" colSpan={4}>{t(`ණය ගිණුම් (Loans & Advances)`)}</td>
                  </tr>
                  {summaryData.loans.map((item, idx) => {
                    const sb = splitBalance(item.balance);
                    return (
                      <tr key={`loan-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20">
                        <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-6">{item.name}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                      </tr>
                    );
                  })}
                  {summaryData.loans.length > 0 && (
                    <tr className="bg-blue-100/80 text-[#1E40AF] font-black border-b-2 border-blue-300 shadow-[inset_0_0_15px_rgba(30,64,175,0.25)]">
                      <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-6">{t(`එකතුව (ණය ගිණුම්)`)}</td>
                      <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">
                        {summaryData.loans.reduce((s, i) => s + i.count, 0)}
                      </td>
                      <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">
                        {splitBalance(summaryData.totalLoans).rupees}
                      </td>
                      <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                        {splitBalance(summaryData.totalLoans).cents}
                      </td>
                    </tr>
                  )}

                  {/* 2. Pawning Section Headline */}
                  <tr className="bg-amber-50/20 text-[#C22727] border-b border-[#1E40AF]/30">
                    <td className="px-3 py-1 font-bold italic" colSpan={4}>{t(`උකස් අත්තිකාරම් (Pawn Advances)`)}</td>
                  </tr>
                  {summaryData.pawning.map((item, idx) => {
                    const sb = splitBalance(item.balance);
                    return (
                      <tr key={`pawn-${idx}`} className="hover:bg-amber-50/40 border-b border-[#1E40AF]/20">
                        <td className="px-4 py-1 border-r border-[#1E40AF]/40 pl-6">{item.name}</td>
                        <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">{item.count}</td>
                        <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">{sb.rupees}</td>
                        <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">{sb.cents}</td>
                      </tr>
                    );
                  })}
                  {summaryData.pawning.length > 0 && (
                    <tr className="bg-blue-100/80 text-[#1E40AF] font-black border-b-2 border-blue-300 shadow-[inset_0_0_15px_rgba(30,64,175,0.25)]">
                      <td className="px-3 py-1 border-r border-[#1E40AF]/40 pl-6">{t(`එකතුව (උකස් අත්තිකාරම්)`)}</td>
                      <td className="px-3 py-1 border-r border-[#1E40AF]/40 text-center font-mono">
                        {summaryData.pawning.reduce((s, i) => s + i.count, 0)}
                      </td>
                      <td className="px-3 py-1 text-right font-mono border-r border-[#1E40AF]/20">
                        {splitBalance(summaryData.totalPawn).rupees}
                      </td>
                      <td className="px-1.5 py-1 text-center font-mono text-[10px] w-8">
                        {splitBalance(summaryData.totalPawn).cents}
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>



          </div>
        )}
      </div>
    </div>
  );
}

// ── Vault Cash View (මුදල් ශේෂය සහ ගනුදෙනු) ──────────────────────────────
function VaultCashView({ branchId }: { branchId?: number }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'MONTH' | 'DAY'>('MONTH');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [membersMap, setMembersMap] = useState<Record<string, { memberNo: string, name: string }>>({});
  
  useEffect(() => {
    AccountService.getBranchMembers().then(members => {
      const map: Record<string, { memberNo: string, name: string }> = {};
      members.forEach(m => {
        if (m.memberId) {
          map[m.memberId] = {
            memberNo: m.membershipNumber || '',
            name: m.nameWithInitials || m.fullName || 'Unknown'
          };
        }
      });
      setMembersMap(map);
    }).catch(console.error);
  }, [branchId]);

  const [cashData, setCashData] = useState<{
    inflow: { parsed: { title: string; details: string[]; account: string }; amount: number }[];
    outflow: { parsed: { title: string; details: string[]; account: string }; amount: number }[];
    totalInflow: number;
    totalOutflow: number;
    vaultBalance: number;
  } | null>(null);

  const MONTHS = [
    { value: 1, label: 'ජනවාරි (January)' },
    { value: 2, label: 'පෙබරවාරි (February)' },
    { value: 3, label: 'මාර්තු (March)' },
    { value: 4, label: 'අප්‍රේල් (April)' },
    { value: 5, label: 'මැයි (May)' },
    { value: 6, label: 'ජූනි (June)' },
    { value: 7, label: 'ජූලි (July)' },
    { value: 8, label: 'අගෝස්තු (August)' },
    { value: 9, label: 'සැප්තැම්බර් (September)' },
    { value: 10, label: 'ඔක්තෝබර් (October)' },
    { value: 11, label: 'නොවැම්බර් (November)' },
    { value: 12, label: 'දෙසැම්බර් (December)' },
  ];

  const parseLedgerDescription = (raw: string, relatedAccount: string, mMap: Record<string, { memberNo: string, name: string }>) => {
    if (!raw) return { title: 'හඳුනා නොගත් ගනුදෙනුවක් (Unknown Transaction)', details: [], account: relatedAccount };
    
    const titleTranslations: Record<string, string> = {
      'Loan Disbursement': 'ණය මුදල නිකුත් කිරීම',
      'Loan Repayment (Cash In)': 'ණය වාරිකය අයකර ගැනීම',
      'Loan Repayment': 'ණය වාරිකය අයකර ගැනීම',
      'Cash Deposit': 'මුදල් තැන්පතුව',
      'Cash Withdrawal': 'මුදල් ආපසු ගැනීම',
      'Pawning Advance': 'උකස් අත්තිකාරම් නිකුතුව',
      'Pawning Redemption': 'උකස් බේරා ගැනීම'
    };

    // Split by '—' or '|'
    const parts = raw.split(/—|\|/).map(s => s.trim()).filter(Boolean);
    
    let originalTitle = parts[0] || 'Transaction';
    let title = originalTitle;
    
    // Handle specific dynamic titles
    if (originalTitle.startsWith('Field Cash Handover by')) {
      const username = originalTitle.replace('Field Cash Handover by', '').trim();
      title = `ක්ෂේත්‍ර නිලධාරී අත්තිකාරම් බේරුම් කිරීම (${username})`;
    } else {
      title = titleTranslations[originalTitle] || originalTitle;
    }
    
    const details: string[] = [];
    
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        let detail = parts[i];
        if (detail.startsWith('Member:')) {
          const uuid = detail.replace('Member:', '').trim();
          const memberInfo = mMap[uuid];
          if (memberInfo) {
            detail = `සාමාජික අංකය: ${memberInfo.memberNo} - ${memberInfo.name}`;
          } else {
            detail = `සාමාජික අංකය: ${uuid}`;
          }
        } else if (detail.startsWith('සාමාජික අංකය:')) {
          const uuid = detail.replace('සාමාජික අංකය:', '').trim();
          const memberInfo = mMap[uuid];
          if (memberInfo) {
            detail = `සාමාජික අංකය: ${memberInfo.memberNo} - ${memberInfo.name}`;
          }
        }
        if (detail.startsWith('Method:')) detail = detail.replace('Method:', 'ක්‍රමය:');
        details.push(detail);
      }
    }
    return { title, details, account: relatedAccount };
  };

  const fetchCashData = async () => {
    setLoading(true);
    try {
      const ledgerData = await LedgerService.getBranchLedger(branchId || 1).catch(() => []);

      const year = new Date().getFullYear();
      let targetDateEnd: Date;
      let isDisplayMatch: (d: any) => boolean;

      if (filterMode === 'MONTH') {
        const endDay = new Date(year, selectedMonth, 0).getDate();
        targetDateEnd = new Date(year, selectedMonth - 1, endDay, 23, 59, 59);
        isDisplayMatch = (dateVal: any) => {
          if (!dateVal) return false;
          try {
             let y, m;
             if (Array.isArray(dateVal)) {
                y = Number(dateVal[0]);
                m = Number(dateVal[1]);
             } else {
                const d = new Date(dateVal);
                y = d.getFullYear();
                m = d.getMonth() + 1;
             }
             return y === year && m === selectedMonth;
          } catch(e) { return false; }
        };
      } else {
        const [sy, sm, sd] = selectedDate.split('-').map(Number);
        targetDateEnd = new Date(sy, sm - 1, sd, 23, 59, 59);
        isDisplayMatch = (dateVal: any) => {
          if (!dateVal) return false;
          try {
             let y, m, d;
             if (Array.isArray(dateVal)) {
                y = Number(dateVal[0]);
                m = Number(dateVal[1]);
                d = Number(dateVal[2]);
             } else {
                const dt = new Date(dateVal);
                y = dt.getFullYear();
                m = dt.getMonth() + 1;
                d = dt.getDate();
             }
             return y === sy && m === sm && d === sd;
          } catch(e) { return false; }
        };
      }

      let cumulativeIn = 0;
      let cumulativeOut = 0;
      ledgerData.forEach((e: any) => {
        let dObj: Date;
        if (Array.isArray(e.entryDate) && e.entryDate.length >= 3) {
           dObj = new Date(e.entryDate[0], e.entryDate[1] - 1, e.entryDate[2]);
        } else {
           dObj = new Date(e.entryDate);
        }
        if (dObj && !isNaN(dObj.getTime()) && dObj <= targetDateEnd) {
          const amt = Number(e.amount) || 0;
          if (e.debitAccount === 'CASH_IN_VAULT') cumulativeIn += amt;
          if (e.creditAccount === 'CASH_IN_VAULT') cumulativeOut += amt;
        }
      });
      const vaultBalance = Math.max(0, cumulativeIn - cumulativeOut);

      const inflowList: { parsed: any; amount: number }[] = [];
      const outflowList: { parsed: any; amount: number }[] = [];

      ledgerData.filter((e: any) => isDisplayMatch(e.entryDate)).forEach((e: any) => {
        const amt = Number(e.amount) || 0;
        if (e.debitAccount === 'CASH_IN_VAULT') {
          const parsed = parseLedgerDescription(e.description || 'Cash Inflow', e.creditAccount || 'Other', membersMap);
          const timeStamp = e.createdAt || e.entryDate;
          if (timeStamp) parsed.details.push(`දිනය/වේලාව: ${new Date(timeStamp).toLocaleString('en-GB')}`);
          inflowList.push({ parsed, amount: amt });
        }
        if (e.creditAccount === 'CASH_IN_VAULT') {
          const parsed = parseLedgerDescription(e.description || 'Cash Outflow', e.debitAccount || 'Other', membersMap);
          const timeStamp = e.createdAt || e.entryDate;
          if (timeStamp) parsed.details.push(`දිනය/වේලාව: ${new Date(timeStamp).toLocaleString('en-GB')}`);
          outflowList.push({ parsed, amount: amt });
        }
      });

      const totalIn = inflowList.reduce((sum, item) => sum + item.amount, 0);
      const totalOut = outflowList.reduce((sum, item) => sum + item.amount, 0);

      setCashData({
        inflow: inflowList,
        outflow: outflowList,
        totalInflow: totalIn,
        totalOutflow: totalOut,
        vaultBalance
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData();
  }, [branchId, selectedMonth, selectedDate, filterMode, membersMap]);

  const splitBalance = (val: number) => {
    const parts = Number(val || 0).toFixed(2).split('.');
    return {
      rupees: parts[0] || '0',
      cents: parts[1] || '00'
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF8F5] rounded-3xl border-4 border-indigo-600/30 shadow-2xl p-8 relative overflow-hidden select-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
             backgroundSize: '100% 30px',
             lineHeight: '30px'
           }}>
        
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 border-b-2 border-indigo-500 pb-4 gap-4">
          <div className="text-sm font-bold text-indigo-600 font-mono">ශාඛාව (Branch): {getBranchName(branchId || 1)}</div>
          <h3 className="text-xl font-bold text-indigo-700 text-center uppercase tracking-widest font-mono flex-1 pl-4">
            {t(`මුදල් ශේෂ විස්තරය (VAULT CASH STATEMENT)`)}</h3>
          <div className="flex items-center gap-4 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 shadow-sm">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider pl-2 hidden sm:inline-block">Filter By:</span>
            <div className="flex border-2 border-indigo-500 rounded-lg overflow-hidden shrink-0 shadow-sm">
              <button
                className={`px-4 py-1.5 text-xs font-bold transition-colors ${filterMode === 'MONTH' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}
                onClick={() => setFilterMode('MONTH')}
              >
                {t(`මාසික (Monthly)`)}</button>
              <button
                className={`px-4 py-1.5 text-xs font-bold transition-colors ${filterMode === 'DAY' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}
                onClick={() => setFilterMode('DAY')}
              >
                {t(`දෛනික (Daily)`)}</button>
            </div>
            
            <div className="h-8 w-px bg-indigo-200 mx-1"></div>
            
            {filterMode === 'MONTH' ? (
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none border-2 border-indigo-500 bg-white text-indigo-700 font-bold rounded-lg pl-4 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm cursor-pointer"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            ) : (
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border-2 border-indigo-500 bg-white text-indigo-700 font-bold rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm cursor-pointer"
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-indigo-700 animate-pulse font-bold text-sm">{t(`දත්ත ලබා ගනිමින්... (Loading vault details...)`)}</div>
        ) : !cashData ? (
          <div className="p-12 text-center text-indigo-700 font-bold text-sm">{t(`දත්ත ලබා ගැනීමට අපොහොසත් විය.`)}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 border-4 border-indigo-600 rounded-2xl overflow-hidden divide-x-4 divide-double divide-indigo-600 bg-[#FAF8F5]">
              
              {/* Left Side: Cash Inflow */}
              <div>
                <div className="bg-indigo-50 p-2 font-bold text-center border-b-2 border-indigo-600 text-indigo-700 text-sm tracking-wide">
                  {t(`මුදල් ලැබීම් (Cash Inflows / Debits)`)}</div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50/30">
                      <th className="px-3 py-2 border-r border-indigo-600/40 w-[70%]">{t(`විස්තරය (Description)`)}</th>
                      <th className="px-3 py-2 text-right w-[30%]" colSpan={2}>{t(`මුදල (Amount)`)}</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-indigo-900">
                    {cashData.inflow.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-indigo-400 font-normal">{t(`ලැබීම් නොමැත (No inflows)`)}</td></tr>
                    )}
                    {cashData.inflow.map((item, idx) => {
                      const sb = splitBalance(item.amount);
                      return (
                        <tr key={`in-${idx}`} className="hover:bg-indigo-50/20 border-b border-indigo-600/20">
                          <td className="px-3 py-2 border-r border-indigo-600/40 align-top">
                            <div className="font-bold text-indigo-900 mb-1">{item.parsed.title}</div>
                            {item.parsed.details.map((d: string, i: number) => (
                              <div key={i} className="text-[10px] text-indigo-700 font-mono mt-0.5 opacity-90">• {d}</div>
                            ))}
                            <div className="text-[9px] bg-indigo-100/70 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded inline-block mt-1.5 font-mono uppercase">
                              {item.parsed.account}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono border-r border-indigo-600/20 align-top pt-3">{sb.rupees}</td>
                          <td className="px-1.5 py-2 text-center font-mono text-[10px] w-8 align-top pt-3.5">{sb.cents}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Right Side: Cash Outflow */}
              <div>
                <div className="bg-indigo-50 p-2 font-bold text-center border-b-2 border-indigo-600 text-indigo-700 text-sm tracking-wide">
                  {t(`මුදල් ගෙවීම් (Cash Outflows / Credits)`)}</div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-indigo-600 text-indigo-700 font-bold bg-indigo-50/30">
                      <th className="px-3 py-2 border-r border-indigo-600/40 w-[70%]">{t(`විස්තරය (Description)`)}</th>
                      <th className="px-3 py-2 text-right w-[30%]" colSpan={2}>{t(`මුදල (Amount)`)}</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-indigo-900">
                    {cashData.outflow.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-indigo-400 font-normal">{t(`ගෙවීම් නොමැත (No outflows)`)}</td></tr>
                    )}
                    {cashData.outflow.map((item, idx) => {
                      const sb = splitBalance(item.amount);
                      return (
                        <tr key={`out-${idx}`} className="hover:bg-indigo-50/20 border-b border-indigo-600/20">
                          <td className="px-3 py-2 border-r border-indigo-600/40 align-top">
                            <div className="font-bold text-indigo-900 mb-1">{item.parsed.title}</div>
                            {item.parsed.details.map((d: string, i: number) => (
                              <div key={i} className="text-[10px] text-indigo-700 font-mono mt-0.5 opacity-90">• {d}</div>
                            ))}
                            <div className="text-[9px] bg-indigo-100/70 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded inline-block mt-1.5 font-mono uppercase">
                              {item.parsed.account}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono border-r border-indigo-600/20 align-top pt-3">{sb.rupees}</td>
                          <td className="px-1.5 py-2 text-center font-mono text-[10px] w-8 align-top pt-3.5">{sb.cents}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Vault Balance Card removed as per request */}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BranchDashboard({ overrideActiveTab, hideSidebar, overrideRole, readOnly, onBack }: { overrideActiveTab?: string, hideSidebar?: boolean, overrideRole?: string, readOnly?: boolean, onBack?: () => void } = {}) {
  const navigate   = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const user       = AuthService.getCurrentUser();
  const role       = overrideRole || user?.role?.replace('ROLE_', '') || 'TELLER';
  const navItems   = ROLE_NAV[role] || ROLE_NAV['TELLER'];
  const [internalTab, setTabState] = useState(() => localStorage.getItem('hmcs_active_tab') || 'overview');
  const tab = overrideActiveTab || (navItems.some(n => n.key === internalTab) ? internalTab : 'overview');
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' });
  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => setSnackbar({ open: true, message, severity });
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [committeeApprovedCount, setCommitteeApprovedCount] = useState(0);
  const [pendingPawnCount, setPendingPawnCount] = useState(0);
  const [pendingEvaluationsCount, setPendingEvaluationsCount] = useState(0);
  const [pendingHandoversCount, setPendingHandoversCount] = useState(0);

  useEffect(() => {
    const currentRole = user?.role?.replace('ROLE_', '');
    if (currentRole === 'BRANCH_MANAGER') {
      import('../services/loan.service').then(LoanService => {
        LoanService.getLoans().then(loans => {
          const myLoans = loans.filter((l: any) => l.branchId === user.branchId);
          
          const pending = myLoans.filter((l: any) => l.currentStage === 'STAGE_1_MANAGER_APPROVAL' && l.status === 'PENDING');
          setPendingApprovalsCount(pending.length);
          
          const requiresCommittee = (l: any) => {
            const typeStr = (l.loanType?.name || l.loanTypeStr || '').toLowerCase();
            return typeStr.includes('සේවක') || typeStr.includes('කෙටි');
          };
          const committee = myLoans.filter((l: any) => l.currentStage === 'STAGE_3_APPROVED' && l.status === 'APPROVED' && requiresCommittee(l));
          setCommitteeApprovedCount(committee.length);
          
          if (pending.length > 0) {
            setNotifications(prev => {
              const loanNotifs = pending.map(l => ({
                type: 'LOAN_APPROVAL',
                isRead: false,
                title: `නව ණය අනුමැතියක් (Loan #${l.loanId})`,
                message: `${l.amount ? `රු. ${l.amount.toLocaleString()} ක` : 'නව'} ණයක් අනුමත කිරීම සඳහා පෝලිමට එක් වී ඇත.`,
                timestamp: new Date().toISOString()
              }));
              // filter out old loan notifs so we don't duplicate on re-renders
              const filtered = prev.filter(n => n.type !== 'LOAN_APPROVAL');
              return [...loanNotifs, ...filtered];
            });
          }
        }).catch(() => {});
      });
    }

    // For LOAN_COMMITTEE - fetch pending pawning tickets count and pending loan approvals
    if (currentRole === 'LOAN_COMMITTEE') {
      import('../services/loan.service').then(LoanService => {
        LoanService.getLoans().then(loans => {
          const pending = loans.filter((l: any) => l.currentStage === 'STAGE_2_LOAN_COMMITTEE_APPROVAL' && l.status === 'PENDING');
          setPendingApprovalsCount(pending.length);
        }).catch(() => {});
      });
      PawningService.getAllTickets().then((tickets: any[]) => {
        const pending = tickets.filter((t: any) => t.status === 'PENDING');
        setPendingPawnCount(pending.length);
        if (pending.length > 0) {
          setNotifications(prev => {
            const pawnNotifs = pending.map((t: any) => ({
              type: 'PAWN_APPROVAL',
              isRead: false,
              title: `නව උකස් අනුමැතිය අවශ්‍යයි (${t.ticketNumber})`,
              message: `ශාඛාව ${t.branchId} ගෙන් උකස් පත්‍රිකාවක් අනුමැතිය ලබා ගැනීමට ඉදිරිපත් වී ඇත.`,
              timestamp: new Date().toISOString()
            }));
            const filtered = prev.filter(n => n.type !== 'PAWN_APPROVAL');
            return [...pawnNotifs, ...filtered];
          });
        }
      }).catch(() => {});
    }

    // For FIELD_OFFICER - fetch pending loan evaluations count
    if (currentRole === 'FIELD_OFFICER' || currentRole?.includes('FIELD')) {
      import('../services/loan.service').then(LoanService => {
        LoanService.getLoans().then(loans => {
          const currentUserId = user?.userId || (user?.username === 'field_hkw' ? '5c64fca7-e8d7-454f-b882-467b904d5dbb' : null);
          const pending = loans.filter((l: any) => l.evaluatorId === currentUserId && l.evaluationStatus === 'ASSIGNED');
          setPendingEvaluationsCount(pending.length);
        }).catch(() => {});
      });
    }

    // For SENIOR_OFFICER - fetch pending field cash handovers count
    if (currentRole === 'SENIOR_OFFICER') {
      import('../services/loan.service').then(LoanService => {
        LoanService.getPendingFieldCollections(user?.branchId || 1).then((data: any[]) => {
          const pending = data.filter((item: any) => item.status === 'PENDING');
          setPendingHandoversCount(pending.length);
        }).catch(() => {});
      });
    }
  }, [user]);

  useEffect(() => {
    AccountService.getBranchNotifications().then(async (notifs) => {
      // Fetch Pawning Tickets to check for nearing maturity
      try {
        const tickets = await PawningService.getTicketsByBranch(user.branchId);
        const pending = tickets.filter((t: any) => t.status === 'PENDING');
        setPendingPawnCount(pending.length);
        
        const nearingPawning = tickets.filter((t: any) => {
          if (t.status === 'REDEEMED' || t.status === 'OVERDUE') return false;
          const expiry = new Date(t.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          return diffDays <= 30 && diffDays >= 0;
        });
        const pawningNotifs = nearingPawning.map((t: any) => ({
          type: 'PW_MATURITY',
          isRead: false,
          title: `උකස් පත්‍රිකාව කල්පිරීමට ආසන්නයි (${t.ticketNumber})`,
          message: `මෙම උකස් පත්‍රිකාව (${t.ticketNumber}) දින ${Math.ceil((new Date(t.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} කින් කල් පිරේ.`
        }));
        setNotifications([...pawningNotifs, ...notifs]);
      } catch (e) {
        setNotifications(notifs);
      }
    }).catch(() => {});
  }, [user.branchId]);

  const setTab = (newTab: string) => {
    localStorage.setItem('hmcs_active_tab', newTab);
    setTabState(newTab);
  };

  const { t, language, setLanguage } = useLanguage();

  if (!user) { navigate('/login'); return null; }


  const roleConfig = ROLE_CONFIG[role]  || ROLE_CONFIG['TELLER'];
  const branchTheme = BRANCH_THEMES[user.branchId] || BRANCH_THEMES[1];
  
  const config = {
    ...roleConfig,
    bg: branchTheme.bg,
    gradient: branchTheme.gradient,
    color: branchTheme.color,
    logoBg: branchTheme.logoBg
  };



  const renderContent = () => {
    if (tab === 'rates') {
      return <div className="mt-4"><GlobalSettings currentTab='rates' readOnly={true} /></div>;
    }

    switch (role) {
      case 'BRANCH_MANAGER':
        if (['overview', 'approvals', 'loans', 'manager-approved', 'committee-approved', 'pawning_approvals'].includes(tab)) {
          return <BranchManagerView activeTab={tab} setTab={setTabState} />;
        }
        return <CustomerServiceView activeTab={tab} onTabChange={setTab} readOnly={readOnly} confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />;
      case 'LOAN_COMMITTEE':       return <LoanCommitteeView activeTab={tab} />;
      case 'TELLER':               return <TellerView />;
      case 'VALUER':               return <ValuerView />;
      case 'FIELD_OFFICER':        return <FieldOfficerView activeTab={tab} />;
      case 'SENIOR_OFFICER':
        if (tab === 'overview') {
          return <BranchManagerView activeTab="overview" setTab={setTabState} />;
        }
        return <CustomerServiceView activeTab={tab} onTabChange={setTab} readOnly={readOnly} confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />;
      case 'BANK_SERVICE_MANAGER': return <BankServiceManagerView />;
      default:                     return <BranchManagerView activeTab={tab} setTab={setTabState} />;
    }
  };

  return (
    <div className={`flex ${hideSidebar ? 'flex-1 min-h-0 w-full' : 'min-h-screen bg-slate-50'}`}>
      {/* Sidebar */}
      {!hideSidebar && (
        <aside className={`w-64 bg-gradient-to-b ${config.gradient} flex flex-col fixed h-full z-10`}>
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#01443b] rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-white text-[14px] leading-tight">{user.organizationName ? t(user.organizationName) : 'HMCS Bank'}</p>
              <p className="text-white/70 text-[10px] leading-tight">{user.role === 'LOAN_COMMITTEE' ? t('Central Loan Committee') : (user.branchName ? t(user.branchName) : t(getBranchName(user.branchId)))}</p>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 border-b border-white/10">
          <div className={`${config.bg} bg-opacity-30 rounded-lg px-2.5 py-1.5 flex items-center gap-2`}>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-tight">{user.username}</p>
              <p className="text-white/60 text-[10px] leading-tight">{t(config.label)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.isSection) {
              return (
                <div key={`sec-${idx}`} className={idx === 0 ? "mb-1.5 px-4" : "mt-4 mb-1.5 px-4"}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">{t(item.label)}</p>
                </div>
              );
            }
            if (item.subItems) {
              return (
                <div key={item.key} className="relative group">
                  <button className="flex items-center w-full px-4 py-2.5 mb-1.5 rounded-xl text-[15px] font-bold transition-all border text-left leading-tight bg-white/5 border-white/30 text-white/80 hover:bg-white/15 hover:border-white/50 hover:text-white">
                    <item.icon size={20} className="mr-3.5 shrink-0 text-white/80" />
                    <span className="flex-1">{t(item.label)}</span>
                    {item.key === 'loans-parent' && pendingApprovalsCount > 0 && (
                      <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] mr-2">
                        {pendingApprovalsCount}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-white/50 group-hover:rotate-90 transition-transform" />
                  </button>
                  <div className="hidden group-hover:block pl-8 space-y-0.5 mb-1">
                    {item.subItems.map((sub: any) => (
                      <button key={sub.key} onClick={() => setTab(sub.key)}
                        className={`flex items-center w-full px-4 py-2 mt-1 rounded-xl text-[14px] font-semibold transition-all border text-left leading-tight ${
                          tab === sub.key 
                            ? 'bg-white border-white text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)]' 
                            : 'bg-white/5 border-white/30 text-white/70 hover:text-white hover:bg-white/10'
                        }`}>
                        <div className="flex items-center flex-1">
                          {sub.icon && <sub.icon size={18} className={`mr-2.5 shrink-0 ${tab === sub.key ? config.color : 'text-white/70'}`} />}
                          <span className="flex-1">{t(sub.label)}</span>
                        </div>
                        {sub.key === 'loans' && pendingApprovalsCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                            {pendingApprovalsCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <button key={item.key} onClick={() => setTab(item.key!)}
                className={`flex items-center justify-between w-full px-4 py-2.5 mb-1.5 rounded-xl text-[15px] font-bold transition-all border text-left ${
                  tab === item.key 
                    ? 'bg-white border-white text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)] scale-[1.02]' 
                    : 'bg-white/5 border-white/30 text-white/80 hover:bg-white/15 hover:border-white/50 hover:text-white'
                }`}>
                <div className="flex items-center flex-1">
                  <item.icon size={20} className={`mr-3.5 shrink-0 ${tab === item.key ? config.color : 'text-white/80'}`} />
                  <span>{t(item.label)}</span>
                </div>
                {(item.key === 'loans' || item.key === 'approvals') && pendingApprovalsCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {pendingApprovalsCount}
                  </span>
                )}
                {item.key === 'committee-approved' && committeeApprovedCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm ml-2">
                    {committeeApprovedCount}
                  </span>
                )}
                {item.key === 'pawning_approvals' && pendingPawnCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {pendingPawnCount}
                  </span>
                )}
                {item.key === 'evaluations' && pendingEvaluationsCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {pendingEvaluationsCount}
                  </span>
                )}
                {item.key === 'handovers' && pendingHandoversCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {pendingHandoversCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-2 border-t border-white/10">
          {onBack ? (
            <button onClick={onBack}
              className="flex items-center w-full px-3 py-1.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition">
              <LogOut size={14} className="mr-2 rotate-180" /> {t('Back to Admin')}
            </button>
          ) : (
            <button onClick={() => { AuthService.logout(); navigate('/login'); }}
              className="flex items-center w-full px-3 py-1.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition">
              <LogOut size={14} className="mr-2" /> {t('Sign Out')}
            </button>
          )}
        </div>
      </aside>
      )}

      {/* Main */}
      <main className={`flex-1 overflow-x-hidden bg-slate-50 relative flex flex-col min-h-0 ${!hideSidebar ? 'md:ml-64' : ''}`}>
        {/* Header — only shown in standalone branch view */}
        {!hideSidebar && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                {user.role === 'LOAN_COMMITTEE' 
                  ? `${user.organizationName ? t(user.organizationName) : 'HMCS Bank'} - ණය කමිටුව` 
                  : (user.branchName ? t(user.branchName) : t(getBranchName(user.branchId)))}
              </h1>
              <p className="text-xs text-slate-400">{t(config.label)} {t('Dashboard')}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('Branch Online')}
              </span>
              <div className="relative">
                <div className="relative cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={18} className="text-slate-400 hover:text-slate-600" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 shadow-lg rounded-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-slate-800">Notifications</h4>
                      <span className="text-xs text-slate-400">{notifications.length}</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-400">No new notifications</div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div key={idx} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-default ${notif.isRead ? 'opacity-70' : 'bg-blue-50/20'}`}>
                            <div className="flex gap-3">
                              <div className="mt-0.5">
                                {notif.type === 'FD_MATURITY' ? <AlertTriangle size={16} className="text-amber-500" /> : 
                                 notif.type === 'PW_MATURITY' ? <Scale size={16} className="text-amber-600" /> : 
                                 <Bell size={16} className="text-blue-500" />}
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-slate-800">{notif.title}</h5>
                                <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                                <span className="text-[10px] text-slate-400 mt-2 block">{new Date(notif.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'en' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5"></div>
              <button onClick={() => setLanguage('si')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'si' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t(`සිංහල`)}</button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5"></div>
              <button onClick={() => setLanguage('ta')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'ta' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>தமிழ்</button>
            </div>
            <button 
              onClick={() => {
                AuthService.logout();
                navigate('/login');
              }} 
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              title={t('Sign Out')}
            >
              <LogOut size={18} />
            </button>
            </div>
          </header>
        )}

        {/* Content */}
        <div className={`flex flex-col flex-1 min-h-0 ${hideSidebar ? 'px-6 pt-4 pb-4' : 'px-8 pt-8 pb-8'}`}>
          {/* Page title — hidden in System Admin embedded view */}
          {!hideSidebar && (
            <div className="mb-6 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {t(navItems.find(n => n.key === tab)?.label || 'Overview')}
              </h2>
              <p className="text-sm text-slate-500">{t('Welcome back')}, {user.username}. {t("Here's your work summary.")}</p>
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col">{renderContent()}</div>
        </div>
      </main>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem', fontWeight: 500, fontFamily: 'Noto Sans Sinhala, sans-serif' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />
    </div>
  );
}


