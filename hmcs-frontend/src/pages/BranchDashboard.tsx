import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, CreditCard, FileText,
  Gem, ClipboardList, TrendingUp, AlertTriangle, CheckCircle,
  Clock, DollarSign, UserPlus, Scale, Banknote, ArrowDownLeft,
  ArrowUpRight, Shield, Bell, ChevronRight, Award, X, Search, PiggyBank, Lock, MapPin, FileImage, Eye, BookOpen, Percent, Activity, Trash2, Loader2, User, Printer, XCircle
} from 'lucide-react';
import GlobalSettings from '../components/GlobalSettings';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import * as LoanService from '../services/loan.service';
import * as LedgerService from '../services/ledger.service';
import { printAccountStatement } from '../utils/print';
import logo from '../assets/logo.jpg';
import { useLanguage } from '../context/LanguageContext';
import { FdViewModal } from '../components/FdViewModal';
import FdMonitorModal from '../components/FdMonitorModal';
import OpenAccountForm from '../components/OpenAccountForm';
import OpenFixedDepositForm from '../components/OpenFixedDepositForm';
import ViewAccountModal from '../components/ViewAccountModal';
import LoanApplicationModal from '../components/LoanApplicationModal';
import LoanDetailModal from '../components/LoanDetailModal';

import TransactionModal, { type TransactionAction } from '../components/TransactionModal';
import PawningModule from '../components/PawningModule';

export const getBranchName = (branchId: number) => {
  switch (branchId) {
    case 1: return 'Hikkaduwa Branch';
    case 2: return 'Dodanduwa Branch';
    case 3: return 'Rathgama Branch';
    case 4: return 'Seenigama Branch';
    case 5: return 'Thiranagama Branch';
    case 6: return 'Peraliya Branch';
    case 7: return 'Kalupe Branch';
    case 8: return 'Gonapinuwala Branch';
    default: return `Branch ${branchId}`; // Fallback to Branch ID for dynamic tenants
  }
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
    { isSection: true, label: 'People' },
    { icon: Users, label: 'Members', key: 'members' }, 
    { isSection: true, label: 'Operations' },
    { icon: CreditCard, label: 'Accounts', key: 'accounts' }, 
    { icon: CheckCircle, label: 'Approvals', key: 'approvals' },
    { 
        icon: FileText, 
        label: 'ණය (Loans)', 
        key: 'loans-parent', 
        subItems: [
          { label: 'ණය පෝලිම', key: 'loans' },
          { label: 'කළමනාකරු අනුමත කළ', key: 'manager-approved' },
          { label: 'කමිටුව අනුමත කළ ණය', key: 'committee-approved' }
        ]
      },
    { icon: Scale, label: 'Pawning', key: 'pawning' },
    { isSection: true, label: 'Finance' },
    { icon: BookOpen, label: 'General Ledger', key: 'gl' },
    { icon: AlertTriangle, label: 'Alerts', key: 'alerts' },
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
    { icon: Users, label: 'Non-Members', key: 'non-members' },
    { isSection: true, label: 'Core Banking Facilities' },
    { icon: PiggyBank, label: 'Savings Accounts', key: 'savings' },
    { icon: Lock, label: 'Fixed Deposits', key: 'fds' },
    { icon: FileText, label: 'Loan Accounts', key: 'loans' },
    { icon: Scale, label: 'Pawning (Gold Loans)', key: 'pawning' },
    { isSection: true, label: 'Daily Operations' },
    { icon: Banknote, label: 'Cash Transactions', key: 'transactions' },
    { icon: BookOpen, label: 'General Ledger', key: 'gl' },
    { isSection: true, label: 'Information' },
    { icon: Percent, label: 'Interest Rates', key: 'rates' }
  ],
  FIELD_OFFICER:        [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Field Tasks' },
    { icon: ClipboardList, label: 'Mobile Collection', key: 'tasks' }
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

// ── Queue Row ──────────────────────────────────────────────────────────────────
function QueueRow({ name, amount, status, date, onAction, actionLabel, actionColor }: any) {
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
function LoanReviewModal({ loan, onClose, onAction }: { loan: LoanService.Loan; onClose: () => void; onAction: () => void }) {
  const user = AuthService.getCurrentUser();
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const ad = loan.applicationData || {};

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'SAVINGS_TRANSFER'>('CASH');
  const [memberAccounts, setMemberAccounts] = useState<any[]>([]);
  const [selectedSavingsAcc, setSelectedSavingsAcc] = useState('');
  const [fetchingAccounts, setFetchingAccounts] = useState(false);

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

  const handle = async (action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const role = user?.role?.replace('ROLE_', '') || 'BRANCH_MANAGER';
      if (action === 'approve') {
        await LoanService.advanceLoanStage(loan.loanId, user?.username || '', role, comments || `Approved/Recommended by ${role}`);
      } else {
        await LoanService.rejectLoan(loan.loanId, user?.username || '', role, comments || `Rejected by ${role}`);
      }
      onAction();
      onClose();
    } catch { alert('Action failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleDisburse = async () => {
    if (paymentMethod === 'SAVINGS_TRANSFER' && !selectedSavingsAcc) {
      alert('කරුණාකර ඉතුරුම් ගිණුමක් තෝරන්න. (Please select a savings account.)');
      return;
    }
    if (!window.confirm(`ණය මුදල ${paymentMethod === 'CASH' ? 'අතින් (Cash)' : 'ඉතුරුම් ගිණුමට'} නිකුත කරන්නද?`)) return;
    setLoading(true);
    try {
      const disbursed = await LoanService.disburseLoan(
        loan.loanId,
        loan.requestedAmount,
        user?.username || 'system',
        paymentMethod,
        paymentMethod === 'SAVINGS_TRANSFER' ? selectedSavingsAcc : undefined
      );
      printDisbursementReceipt(disbursed, ad, user?.username || 'system');
      onAction();
      onClose();
    } catch (e: any) {
      alert('ණය මුදල නිකුත කිරීමේ දෝෂයකි: ' + (e?.response?.data || e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAgreement = () => {
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
            <p className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-1">ණය ඉල්ලීම් සමාලෝචනය | Loan Application Review</p>
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
            <h3 className="col-span-full text-sm font-bold text-blue-800 mb-2 pb-2 border-b border-slate-200">① අයදුම්කරුගේ තොරතුරු</h3>
            <Field label="සම්පූර්ණ නම" value={ad.applicantName || ad.name} />
            <Field label="ජා.හැ.ප. අංකය" value={ad.nic} />
            <Field label="සාමාජික අංකය" value={ad.memberNo || ad.officeMemberNo} />
            <Field label="ලිපිනය" value={ad.addressLine1 || ad.address} />
            <Field label="ජංගම දූරකථනය" value={ad.phone} />
            <Field label="ඉල්ලූ ණය මුදල" value={`Rs. ${loan.requestedAmount?.toLocaleString()}`} />
            <Field label="ණය අරමුණ" value={ad.loanPurpose} />
            <Field label="ණය ගෙවීමේ කාලය" value={`${loan.termMonths} months`} />
            <Field label="ණය ප්‍රමාණය (ද්‍රව්‍ය)" value={ad.requiredLoanGoods} />
          </div>

          {/* Assets */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="col-span-full text-sm font-bold text-blue-800 mb-2 pb-2 border-b border-slate-200">② වත්කම් විස්තර</h3>
            <Field label="ගොඩ ඉඩම" value={ad.assets?.landGoda ? `Rs. ${ad.assets.landGoda}` : undefined} />
            <Field label="මඩ ඉඩම" value={ad.assets?.landMada ? `Rs. ${ad.assets.landMada}` : undefined} />
            <Field label="වාහන" value={ad.assets?.vehicles ? `Rs. ${ad.assets.vehicles}` : undefined} />
            <Field label="සතුන්" value={ad.assets?.animals ? `Rs. ${ad.assets.animals}` : undefined} />
            <Field label="වාර්ෂික ප්‍රාථමික ආදායම" value={ad.annualIncomePrimary ? `Rs. ${ad.annualIncomePrimary}` : undefined} />
            <Field label="වාර්ෂික වියදම" value={ad.annualExpense ? `Rs. ${ad.annualExpense}` : undefined} />
          </div>

          {/* Guarantors */}
          {(ad.guarantor1 || ad.guarantor1Name) && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-blue-800 mb-3 pb-2 border-b border-slate-200">③ ඇපකරුවන්ගේ විස්තර</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[ad.guarantor1 || { name: ad.guarantor1Name, address: ad.guarantor1Address }, ad.guarantor2 || { name: ad.guarantor2Name, address: ad.guarantor2Address }].map((g: any, i) => g?.name && (
                  <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-xs font-bold text-blue-700 mb-2">{i === 0 ? 'පළමු' : 'දෙවන'} ඇපකරු</p>
                    <Field label="නම" value={g.name} />
                    <Field label="ලිපිනය" value={g.address} />
                    <Field label="NIC" value={g.nic} />
                    <Field label="ඩිජිටල් අත්සන" value={g.digitalSignatureUrl} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Docs */}
          {ad.supportingDocuments?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-blue-800 mb-2">④ ඇමිණුම් ලියකියවිලි</h3>
              {ad.supportingDocuments.map((d: string, i: number) => (
                <a key={i} href={d} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm block">{d}</a>
              ))}
            </div>
          )}

          {/* Decision */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-800 mb-2">⑤ අදහස් / Comments</h3>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="ඔබගේ අදහස් හෝ ප්‍රතික්ෂේප කිරීමේ හේතුව ලියන්න..."
              rows={3}
              className="w-full border border-amber-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200">
          {/* Disbursement Method Panel - shown for APPROVED loans */}
          {(loan.status === 'APPROVED' || loan.currentStage === 'STAGE_3_APPROVED') && (
            <div className="px-5 pt-4 pb-2 bg-blue-50/60 border-b border-blue-100">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">💳 ණය ගෙවීමේ ක්‍රමය (Disbursement Method)</p>
              <div className="flex rounded-xl overflow-hidden border border-blue-200 mb-3">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex-1 py-2 text-sm font-bold transition ${paymentMethod === 'CASH' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                  💵 අතින් මුදල් (Cash)
                </button>
                <button
                  onClick={() => setPaymentMethod('SAVINGS_TRANSFER')}
                  className={`flex-1 py-2 text-sm font-bold transition ${paymentMethod === 'SAVINGS_TRANSFER' ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                  🏦 ඉතුරුම් ගිණුමට (Savings Transfer)
                </button>
              </div>
              {paymentMethod === 'SAVINGS_TRANSFER' && (
                <div className="mb-2">
                  <label className="block text-xs font-semibold text-blue-700 mb-1">බැර කළ යුතු ඉතුරුම් ගිණුම (Savings Account)</label>
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
                    <p className="text-xs text-red-600 font-medium">⚠ මෙම සාමාජිකයාට සක්‍රීය ඉතුරුම් ගිණුමක් නොමැත. (No active savings accounts found.)</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="p-5 flex justify-between items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
              වසන්න (Close)
            </button>
            {loan.status === 'PENDING' && (
              <div className="flex gap-3">
                <button onClick={() => handle('reject')} disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow transition disabled:opacity-60">
                  {loading ? '...' : '✗ ප්‍රතික්ෂේප කරන්න (Reject)'}
                </button>
                <button onClick={() => handle('approve')} disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow transition disabled:opacity-60">
                  {loading ? '...' : '✓ අනුමත / නිර්දේශ කරන්න (Approve / Recommend)'}
                </button>
              </div>
            )}
            {(loan.status === 'APPROVED' || loan.currentStage === 'STAGE_3_APPROVED') && (
              <div className="flex gap-3">
                <button onClick={handlePrintAgreement}
                  className="px-5 py-2.5 rounded-xl border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-sm shadow-sm transition">
                  🖨 ගිවිසුම මුද්‍රණය (Print Agreement)
                </button>
                <button onClick={handleDisburse} disabled={loading || (paymentMethod === 'SAVINGS_TRANSFER' && memberAccounts.length === 0)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition disabled:opacity-60">
                  {loading ? '⏳ Processing...' : '💰 ණය මුදා හරින්න (Disburse)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchManagerView({ activeTab }: { activeTab: string }) {
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [loanQueue, setLoanQueue] = useState<LoanService.Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanService.Loan | null>(null);
  const [search, setSearch] = useState('');
  const { language } = useLanguage();

  const loadData = () => {
    AccountService.getBranchMembers().then(setMembers).catch(() => {});
    AccountService.getBranchAccounts().then(setAccounts).catch(() => {});
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

  if (activeTab === 'pawning') {
    return <PawningModule branchId={AuthService.getCurrentUser()?.branchId || 1} />;
  }

  if (activeTab === 'overview') return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}    label="Total Branch Balance" value={`Rs. ${totalBalance.toLocaleString()}`} sub="All accounts" color="text-blue-600" />
        <StatCard icon={Users}         label="Total Members"        value={members.length.toString()}              sub="Registered"  color="text-green-600" />
        <StatCard icon={CreditCard}    label="Total Accounts"       value={accounts.length.toString()}             sub="Active"      color="text-purple-600" />
        <StatCard icon={FileText}      label="Pending Loans"        value={managerPendingLoans.length.toString()} sub="Awaiting action" color="text-amber-600" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} /> ණය ඉල්ලීම් පෝලිම (Loan Queue)</h3>
          {managerPendingLoans.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No pending loan applications.</p> : managerPendingLoans.slice(0,5).map((l, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{(l.applicationData?.applicantName || l.applicationData?.name || l.memberId?.slice(0,8))}</p>
                <p className="text-xs text-slate-400">{l.appliedDate?.slice(0,10)} · Rs. {l.requestedAmount?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700">{l.status}</span>
                <button onClick={() => setSelectedLoan(l)} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">View</button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Alerts</h3>
          {[{ msg: 'FD #10234 matures in 3 days — Rs. 100,000', type: 'FD' }, { msg: 'Pawn Ticket #698594 expires in 7 days', type: 'PAWN' }].map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{a.type}</span>
              <p className="text-sm text-slate-700">{a.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">{m.fullName.charAt(0)}</div>
                    <span className="font-medium text-slate-800">{m.fullName}</span>
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



  if (activeTab === 'loans' || activeTab === 'committee-approved' || activeTab === 'manager-approved') {
    const isCommitteeApprovedTab = activeTab === 'committee-approved';
    const isManagerApprovedTab = activeTab === 'manager-approved';
    const displayedLoans = isCommitteeApprovedTab 
      ? loanQueue.filter(l => l.currentStage === 'STAGE_3_APPROVED' || l.status === 'APPROVED' || l.status === 'ACTIVE' || l.currentStage === 'DISBURSED')
      : isManagerApprovedTab
        ? loanQueue.filter(l => l.currentStage === 'STAGE_2_LOAN_COMMITTEE_APPROVAL' || l.currentStage === 'STAGE_3_APPROVED' || l.status === 'APPROVED' || l.status === 'ACTIVE' || l.currentStage === 'DISBURSED')
        : loanQueue.filter(l => l.currentStage === 'STAGE_1_MANAGER_APPROVAL' && l.status === 'PENDING');

    return (
      <>
        {selectedLoan && <LoanReviewModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} onAction={loadData} />}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} /> 
              {isCommitteeApprovedTab 
                ? 'කමිටුව අනුමත කළ ණය (Committee Approved)' 
                : isManagerApprovedTab
                  ? 'කළමනාකරු අනුමත කළ ණය (Manager Approved)'
                  : 'ණය නිර්දේශ පෝලිම (Manager Approval Queue)'}
            </h3>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${(isCommitteeApprovedTab || isManagerApprovedTab) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {displayedLoans.length} {(isCommitteeApprovedTab || isManagerApprovedTab) ? 'Approved' : 'Pending'}
            </span>
          </div>
          {displayedLoans.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {isCommitteeApprovedTab ? 'No approved loans from the committee.' : isManagerApprovedTab ? 'No loans approved by the manager yet.' : 'No loan applications awaiting manager review.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">අයදුම්කරු</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">ණය වර්ගය</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase">ඉල්ලූ මුදල</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">කාලය</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">දිනය</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">අදියර (Stage)</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">තත්ත්වය</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-slate-500 uppercase">ක්‍රියාව</th>
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
                    <td className="px-5 py-3 text-center text-slate-600">{l.termMonths} mo.</td>
                    <td className="px-5 py-3 text-center text-slate-400 text-xs">{l.appliedDate?.slice(0,10)}</td>
                    <td className="px-5 py-3 text-center text-xs font-semibold text-indigo-600">
                      {language === 'si' 
                        ? (LoanService.STAGE_LABELS[l.currentStage]?.labelSi || l.currentStage) 
                        : (LoanService.STAGE_LABELS[l.currentStage]?.label || l.currentStage)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        l.status === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
                        l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        l.status === 'ACTIVE'   ? 'bg-blue-100 text-blue-700' :
                        l.currentStage === 'DISBURSED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>{l.status === 'ACTIVE' ? '✓ DISBURSED' : l.status}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => setSelectedLoan(l)} className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center gap-1 mx-auto">
                        <Eye size={12}/> {(isCommitteeApprovedTab || isManagerApprovedTab) ? 'View' : 'සමාලෝචනය'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
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
  const [loans, setLoans] = useState<LoanService.Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanService.Loan | null>(null);

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
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Clock}        label="Pending Votes"  value={pendingLoans.length.toString()} color="text-amber-600" />
        <StatCard icon={CheckCircle}  label="Approved List" value={approvedLoans.length.toString()} color="text-green-600" />
        <StatCard icon={AlertTriangle} label="Rejected List" value={rejectedLoans.length.toString()} color="text-red-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Scale size={16} /> Loan Applications — Cast Your Vote</h3>
        {pendingLoans.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No pending loan applications awaiting committee vote.</p>
        ) : pendingLoans.map(l => (
          <div key={l.loanId} className="py-4 border-b border-slate-100 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-800">{(l.applicationData?.applicantName || l.applicationData?.name || '—')}</p>
                <p className="text-xs text-slate-400">{l.loanType?.name || '—'} · {l.termMonths} months · Rs. {l.requestedAmount?.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedLoan(l)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-semibold hover:bg-blue-700 transition">Review & Vote</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TellerView() {
  const [amount, setAmount] = useState('');
  const [accNo, setAccNo] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityDate, setActivityDate] = useState<string>('');

  const fetchActivities = () => {
    AccountService.getBranchActivities(activityDate).then(setActivities).catch(() => {});
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
              }

              return (
                <div key={act.id || idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition" onClick={() => setAccNo(act.reference)}>
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
        <button onClick={() => alert('Pawn Ticket issued successfully!')} className="mt-5 w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition">Issue Pawn Ticket</button>
      </div>
    </div>
  );
}

function CustomerServiceView({ activeTab, onTabChange, readOnly }: { activeTab: string, onTabChange?: (tab: string) => void, readOnly?: boolean }) {
  const { t, language } = useLanguage();
  const [showOpenAccountForm, setShowOpenAccountForm] = useState(false);
  const [showOpenFdForm, setShowOpenFdForm] = useState(false);
  const [showViewAccount, setShowViewAccount] = useState<{show: boolean, accountId: string|null}>({show: false, accountId: null});
  const [showMemberAccountsModal, setShowMemberAccountsModal] = useState(false);
  const [selectedMemberForAccounts, setSelectedMemberForAccounts] = useState<any>(null);
  const [expandedInterestId, setExpandedInterestId] = useState<string | null>(null);
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);

  const getMemberName = (memberId: string, accNo?: string) => {
    const m = members.find(mem => mem.memberId === memberId);
    if (m && (m.fullName || m.fullNameSinhala)) {
      return m.fullName || m.fullNameSinhala;
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
  const [loanFilter, setLoanFilter] = useState<'COMMITTEE_APPROVED' | 'ALL'>('COMMITTEE_APPROVED');
  const [viewLoan, setViewLoan] = useState<LoanService.Loan | null>(null);
  const [savingsTypes, setSavingsTypes] = useState<AccountService.SavingsAccountType[]>([]);
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
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
  const [monitoringFd, setMonitoringFd] = useState<any>(null);
  const [fixedDeposits, setFixedDeposits] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityDate, setActivityDate] = useState<string>('');
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
    AccountService.getBranchActivities(activityDate).then(setActivities).catch(() => {});
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

  const isNonMembersTab = activeTab === 'non-members';
  const displayedMembers = members.filter(m => isNonMembersTab ? m.isMember === false : m.isMember !== false);
  const filtered = members.filter(m => {
    const matchesSearch = search ? (
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.nic.toLowerCase().includes(search.toLowerCase()) ||
      (m.membershipNumber && m.membershipNumber.toLowerCase().includes(search.toLowerCase()))
    ) : true;
    const matchesTab = isNonMembersTab ? m.isMember === false : m.isMember !== false;
    
    let isMatch = search ? matchesSearch : matchesTab;
    
    if (ageFilter !== 'ALL') {
      const ageCat = m.ageCategory || 'ADULT';
      isMatch = isMatch && ageCat === ageFilter;
    }
    
    return isMatch;
  });

  const hasFormChanged = !(form as any).memberId || JSON.stringify(form) !== JSON.stringify(editingOriginalForm);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
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
      fetchData();
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
      const details = await AccountService.getActivityDetails(act.type, act.id);
      let memberName = 'Unknown';
      if (details.memberId) {
        try {
          const member = await AccountService.getMemberById(details.memberId);
          memberName = member.fullName || member.fullNameSinhala || 'Unknown';
        } catch (e) {
          if (details.accountNumber) {
            const acc = accounts.find(a => a.accountNumber === details.accountNumber);
            if (acc && acc.childName) memberName = acc.childName + " (Child)";
          }
        }
      }
      setActivityDetails({ ...act, ...details, _type: act.type, _memberName: memberName });
    } catch (e) {
      alert("Failed to fetch activity details");
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

  if (activeTab === 'fds') {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const getMemberName = (memberId: string) => {
      const m = members.find(mem => mem.memberId === memberId);
      return m ? (m.fullName || m.fullNameSinhala || 'Unknown') : 'Unknown';
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
              <h3 className="text-lg font-black tracking-tight">ස්ථාවර තැන්පතු (Fixed Deposits)</h3>
              <p className="text-emerald-200 text-[11px] font-medium mt-0.5">කාලීන තැන්පතු කළමනාකරණය</p>
            </div>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowOpenFdForm(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#01291f] px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Lock size={14} /> නව ගිණුමක් අරඹන්න
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">මුළු ගිණුම්</p>
            <p className="text-2xl font-black text-slate-800">{fixedDeposits.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">සියලු ගිණුම්</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">තැන්පතු මුදල</p>
            <p className="text-xl font-black text-[#025a4e]">Rs. {totalPrincipal.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">සියලු තැන්පතු එකතුව</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 shadow-sm">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">කල් පිරීමට නියමිත</p>
            <p className="text-2xl font-black text-amber-600">{maturingSoonCount}</p>
            <p className="text-[10px] text-amber-400 mt-0.5">දින 30 ඇතුලත</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">කල් පිරුණු</p>
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
                placeholder="ගිණුම් අංකය හො නම සොයන්න..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#025a4e] transition-all"
              />
            </div>

            {/* Dropdowns row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">වර්ගය:</label>
                <select
                  value={fdCategoryFilter}
                  onChange={e => setFdCategoryFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#025a4e] transition-all cursor-pointer"
                >
                  <option value="ALL">සියල්ල</option>
                  <option value="NORMAL">සාමාන්‍ය ස්ථාවර තැන්පතු</option>
                  <option value="SENIOR">ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු</option>
                  <option value="CHILD">ළමා ස්ථාවර තැන්පතු</option>
                </select>
              </div>

              {/* Status dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">වර්තමාන තත්වය:</label>
                <select
                  value={fdStatusFilter}
                  onChange={e => setFdStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#025a4e] transition-all cursor-pointer"
                >
                  <option value="ALL">සියල්ල</option>
                  <option value="ACTIVE">ක්‍රියාත්මක</option>
                  <option value="MATURING_SOON">කල් පිරීමට නියමිත</option>
                  <option value="MATURED">කල් පිරුණු</option>
                </select>
              </div>

              <p className="ml-auto text-xs text-slate-400">පෙන්වන්නේ <span className="font-bold text-slate-700">{filteredFDs.length}</span> / {fixedDeposits.length} ගිණුම්</p>
            </div>
          </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">ගිණුම්<br/>අංකය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">තැන්පත්කරු</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">වර්ගය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">තැන්පතු මුදල (Rs.)</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">කාලය /<br/>පොළිය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">කල් පිරීමේ දිනය</th>
                <th className="px-3 py-3 border-r border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">තත්ත්වය</th>
                <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">ක්‍රියාකාරකම්</th>
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
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {status === 'ACTIVE' ? 'ක්‍රියාකාරී' : status === 'MATURING_SOON' ? 'කල් පිරීමට ආසන්නයි' : 'කල් පිරී ඇත'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setViewingFd(fd)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#025a4e] bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">බලන්න</button>
                        {!readOnly && (
                          <>
                            <button onClick={() => setMonitoringFd(fd)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1 border border-slate-300 shadow-sm"><Activity size={13} className="text-slate-500" /><span>තත්වය</span></button>
                            <button onClick={() => { if(window.confirm('මෙම ස්ථාවර තැන්පතුව මකා දැමීමට අවශ්‍ය බව විශ්වාසද?')) { AccountService.deleteFixedDeposit(fd.fdId).then(() => { setAlertConfig({message: 'සාර්ථකව මකා දමන ලදී', isSuccess: true}); fetchData(); }).catch(err => setAlertConfig({message: 'මකා දැමීම අසාර්ථකයි'})); } }} className="px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center border border-red-200 shadow-sm"><Trash2 size={14} /></button>
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
            accountHolder={rowTxAccount?.childName || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullName || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullNameSinhala || 'N/A'}
            action={rowTxAction}
            allAccounts={accounts}
            members={members}
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
            onClose={() => setViewingFd(null)} 
          />
        )}

        {/* FD Monitor Modal */}
        {monitoringFd && (
          <FdMonitorModal 
            fd={monitoringFd} 
            memberName={getMemberName(monitoringFd.memberId)}
            onClose={() => setMonitoringFd(null)}
            onRelease={() => {
              setMonitoringFd(null);
              setRowTxAccount({ accountId: monitoringFd.id, accountNumber: monitoringFd.fdNumber, accountType: 'FIXED_DEPOSIT', balance: monitoringFd.principalAmount, memberId: monitoringFd.memberId, childName: '' } as any);
              setRowTxAction('CLOSE_FD');
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

  if (activeTab === 'pawning') {
    return <PawningModule branchId={user?.branchId || 1} />;
  }

  if (activeTab === 'loans') {
    const filteredLoans = loans.filter(l => {
      if (loanFilter === 'COMMITTEE_APPROVED' && l.status !== 'APPROVED' && l.status !== 'ACTIVE') return false;
      const member = members.find(m => m.memberId === l.memberId);
      const nameMatch = member ? (member.fullName || member.fullNameSinhala || '').toLowerCase().includes(loanSearch.toLowerCase()) : false;
      const typeMatch = (l.loanType?.name || '').toLowerCase().includes(loanSearch.toLowerCase());
      return nameMatch || typeMatch;
    });

    return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-indigo-600" size={22} /> ණය ගිණුම් අංශය
            </h3>
            <p className="text-sm text-slate-500 mt-1">ණය ඉල්ලුම්පත් සහ සක්‍රීය ණය ගිණුම් {filteredLoans.length} ක් කළමනාකරණය කරන්න.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {!readOnly && (
              <button onClick={() => setShowLoanModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
                <FileText size={18} /> නව ණයක් ඉල්ලුම් කරන්න
              </button>
            )}
          </div>
        </div>

        {/* Unified Data Table Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col ring-1 ring-slate-900/5">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/80">
            {/* Filter Toggle */}
            <div className="flex bg-slate-100/80 rounded-xl p-1 border border-slate-200">
              <button onClick={() => setLoanFilter('COMMITTEE_APPROVED')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  loanFilter === 'COMMITTEE_APPROVED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}>
                කමිටුව අනුමත කළ
              </button>
              <button onClick={() => setLoanFilter('ALL')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  loanFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}>
                සියලුම ණය
              </button>
            </div>
            {/* Search Bar */}
            <div className="relative w-full md:w-[450px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={loanSearch} onChange={e => setLoanSearch(e.target.value)} placeholder="සාමාජිකයා හෝ වර්ගය අනුව සොයන්න..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-indigo-50/80 border-b border-indigo-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">ගිණුම් අංකය</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">දිනය</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">සාමාජිකයා</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">ණය වර්ගය</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">මුදල</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">අදියර</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">තත්ත්වය</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-indigo-900 uppercase tracking-wider">ක්‍රියා</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50 bg-white">
              {filteredLoans.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">ණය ගිණුම් කිසිවක් හමු නොවීය</td></tr>
              ) : filteredLoans.map(l => {
                const member = members.find(m => m.memberId === l.memberId);
                return (
                <tr key={l.loanId} className="hover:bg-indigo-50/40 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-700 bg-indigo-50/50 rounded-l-lg">{l.accountNumber || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{l.appliedDate || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-800 font-bold">
                    {member ? (member.fullName || member.fullNameSinhala) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1.5 rounded-md font-bold uppercase tracking-wide">
                      {l.loanType?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800 text-base">Rs. {Number(l.requestedAmount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-600">
                    {l.currentStage === 'DISBURSED' ? 'මුදා හැර ඇත' : 
                     l.currentStage === 'COMPLETED' ? 'සම්පූර්ණයි' : 
                     l.currentStage === 'REJECTED' ? 'ප්‍රතික්ෂේපිතයි' : 
                     l.currentStage === 'ACTIVE' ? 'සක්‍රීයයි' :
                     LoanService.STAGE_LABELS[l.currentStage]?.labelSi || l.currentStage}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : l.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {l.status === 'PENDING' ? 'විනිශ්චය වෙමින් පවතී' : 
                       l.status === 'APPROVED' ? 'අනුමතයි' : 
                       l.status === 'REJECTED' ? 'ප්‍රතික්ෂේපිතයි' : 
                       l.status === 'DISBURSED' ? 'මුදා හැර ඇත' : 
                       l.status === 'ACTIVE' ? 'සක්‍රීයයි' : 
                       l.status === 'COMPLETED' ? 'සම්පූර්ණයි' : 
                       l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setViewLoan(l)} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition" title={t('View Loan')}>
                      බලන්න
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
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
            onUpdated={() => {
              setViewLoan(null);
              LoanService.getLoans().then(setLoans).catch(() => {});
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
                }

                return (
                  <div key={act.id || idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer" onClick={() => handleViewActivity(act)}>
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
                    <p className="font-semibold text-slate-800">{activityDetails._type}</p>
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
                      <p className="font-medium text-slate-800">{getBranchName(activityDetails.branchId)}</p>
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
              <p className="text-xs font-bold text-slate-500 tracking-wide">මුළු ගිණුම්</p>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{totalSavings}</h4>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-600"><CheckCircle size={40} /></div>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100"><CheckCircle size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">සක්‍රිය ගිණුම්</p>
              <h4 className="text-2xl font-black text-slate-800 leading-tight">{activeSavings}</h4>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-rose-600"><XCircle size={40} /></div>
            <div className="bg-rose-50 text-rose-600 p-2 rounded-lg border border-rose-100"><XCircle size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">අක්‍රිය ගිණුම්</p>
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
                onClick={() => { setSelectedMemberId(''); setShowAccModal(true); }}
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
                සමාජීය
              </button>
              
              <button 
                onClick={() => setSavingsTab('NON_SOCIETY')} 
                className={`relative z-10 flex-1 py-1.5 text-sm font-bold tracking-wide transition-all duration-300 ${savingsTab === 'NON_SOCIETY' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                සමාජීය නොවන
              </button>
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
                    {a.childName || members.find(m => m.memberId === a.memberId)?.fullName || members.find(m => m.memberId === a.memberId)?.fullNameSinhala || 'N/A'}
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
            accountHolder={rowTxAccount?.childName || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullName || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullNameSinhala || 'N/A'}
            action={rowTxAction}
            allAccounts={accounts}
            members={members}
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
            onClose={() => setViewingFd(null)} 
          />
        )}

        {/* FD Monitor Modal */}
        {monitoringFd && (
          <FdMonitorModal 
            fd={monitoringFd} 
            memberName={getMemberName(monitoringFd.memberId)}
            onClose={() => setMonitoringFd(null)}
            onRelease={() => {
              setMonitoringFd(null);
              setRowTxAccount({ accountId: monitoringFd.id, accountNumber: monitoringFd.fdNumber, accountType: 'FIXED_DEPOSIT', balance: monitoringFd.principalAmount, memberId: monitoringFd.memberId, childName: '' } as any);
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
        {showAccModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-6xl relative shadow-2xl rounded-2xl">
              <OpenAccountForm 
                isSocietyMember={savingsTab === 'SOCIETY'} 
                onClose={() => { setShowAccModal(false); setAccCustomerType(null); setSelectedMemberId(''); }} 
              />
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
                    <div className="grid grid-cols-3 gap-4">
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
                                  const isCredit = tx.transactionType.includes('DEPOSIT') || tx.transactionType.includes('INTEREST');
                                  const isInterest = tx.transactionType === 'INTEREST';
                                  const isFdInterest = tx.transactionType === 'FD_MONTHLY_INTEREST';
                                  const isExpanded = expandedInterestId === tx.transactionId;
                                  
                                  let txDate = new Date(tx.transactionTimestamp);
                                  let txMonthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
                                  let monthBalances = passbookData.dailyBalances.filter((db: any) => db.recordDate.startsWith(txMonthStr));

                                  return (
                                    <React.Fragment key={tx.transactionId}>
                                      <tr 
                                        className={`hover:bg-slate-50 transition-colors ${isInterest ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => { if(isInterest) setExpandedInterestId(isExpanded ? null : tx.transactionId) }}
                                      >
                                        <td className="px-4 py-3 text-slate-500">
                                          {txDate.toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                              {isInterest ? 'MONTHLY INTEREST' : isFdInterest ? 'FD INTEREST' : tx.transactionType.replace('_', ' ')}
                                            </span>
                                            {isInterest && (
                                              <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                                                {isExpanded ? 'Hide' : 'Details'}
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
                                      {isInterest && isExpanded && (
                                        <tr>
                                          <td colSpan={5} className="p-0 border-b-0 bg-slate-50/80 shadow-inner">
                                            <div className="p-4 px-6 border-l-4 border-blue-400 m-2 bg-white rounded-r-lg shadow-sm">
                                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Daily Balance Breakdown ({txMonthStr})</p>
                                              {monthBalances.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">No daily balances recorded for this period.</p>
                                              ) : (
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                                  {monthBalances.sort((a: any, b: any) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()).map((db: any) => (
                                                    <div key={db.id} className="flex justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                                                      <span className="font-medium text-slate-600">{db.recordDate}</span>
                                                      <span className="font-mono text-slate-500">Rs. {db.closingBalance?.toLocaleString() || db.endOfDayBalance?.toLocaleString()}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
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

      </div>
    );
  }

  if (activeTab === 'pawning') {
    return <PawningModule branchId={AuthService.getCurrentUser()?.branchId || 1} />;
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <StatCard icon={Users}        label={isNonMembersTab ? t('Total Non-Members') : t('Total Members')}    value={displayedMembers.length.toString()} color="text-green-600" />
        <StatCard icon={CreditCard}   label={t('Total Accounts')}   value={accounts.length.toString()} color="text-blue-600" />
        <StatCard icon={UserPlus}     label={isNonMembersTab ? t('Active Non-Members') : t('Active Members')}   value={displayedMembers.filter(m => m.status === 'ACTIVE').length.toString()} color="text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl p-6 pb-4 shadow-sm border border-slate-100 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> {isNonMembersTab ? t('Non-Members') : t('Branch Members')}</h3>
          {!readOnly && (
            <button onClick={() => { setForm(prev => ({ ...initialFormState, isMember: !isNonMembersTab })); setEditingOriginalForm(null); setShowRegModal(true); }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
              <UserPlus size={14} /> {isNonMembersTab ? t('Register Non-Member') : t('Register Member')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search by name or NIC...')}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
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
                <th className="px-4 py-3">{isNonMembersTab ? t('Name') : t('Member')}</th>
                <th className="px-4 py-3">{isNonMembersTab ? t('Client ID') : t('Membership No')}</th>
                <th className="px-4 py-3">{t('NIC / Birth Cert. No.')}</th>
                <th className="px-4 py-3">{t('Accounts')}</th>
                <th className="px-4 py-3">{t('Status')}</th>
                <th className="px-4 py-3 text-right">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">{isNonMembersTab ? t('No non-members found.') : t('No members found. Register the first member!')}</td></tr>
              ) : filtered.map(m => (
                <tr key={m.memberId} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {m.fullName.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{m.nameWithInitials || m.fullName}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">{m.membershipNumber || '-'}</td>
                  <td className="px-4 py-3">{m.nic}</td>
                  <td className="px-4 py-3">{getAccountCount(m.memberId)}</td>
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
            <form onSubmit={handleRegister} className="flex flex-col flex-1 overflow-hidden">
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
                අවලංගු කරන්න
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
              >
                තහවුරු කරන්න
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Account Modal */}
      {showAccModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{t('Open Savings Account')}</h3>
              <button onClick={() => { setShowAccModal(false); setAccCustomerType(null); setSelectedMemberId(''); }}><X size={18} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            {!selectedMemberId && accCustomerType === null ? (
              <div className="p-8 space-y-4">
                <h4 className="text-center text-slate-600 font-medium mb-6">{t('Registration Type')}</h4>
                <button onClick={() => setAccCustomerType('true')}
                  className="w-full p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-500 text-green-700 font-bold transition flex items-center justify-center gap-3">
                  <UserPlus size={20} />
                  {t('Society Member')}
                </button>
                <button onClick={() => setAccCustomerType('false')}
                  className="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 text-blue-700 font-bold transition flex items-center justify-center gap-3">
                  <Users size={20} />
                  {t('Non-Member')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOpenAccount} className="p-6 space-y-4">
                {accError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">{accError}</div>}
                
                {/* Member Selection if opened from general button */}
                {!selectedMemberId && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700">{accCustomerType === 'true' ? t('Society Member') : t('Non-Member')}</span>
                      <button type="button" onClick={() => setAccCustomerType(null)} className="text-xs text-blue-600 hover:underline">{t('Cancel')}</button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{t('Select Person')}</label>
                      <select required value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                        <option value="">-- {t('Select Person')} --</option>
                        {members.filter((m: any) => accCustomerType === 'true' ? m.isMember !== false : m.isMember === false).map(m => (
                          <option key={m.memberId} value={m.memberId}>{m.fullName} - {m.nic}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Account Type')}</label>
                <select value={accForm.accountType} onChange={e => setAccForm(p => ({ ...p, accountType: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="NORMAL">{t('Normal Savings (Samanaya 01)')}</option>
                    <option value="JANASETHA">{t('Janasetha')}</option>
                    <option value="DHANA_YOJANA">{t('Dhana Yojana')}</option>
                    <option value="VANDANA">{t('Vandana')}</option>
                    <option value="ARUNALU">{t('Arunalu (Children)')}</option>
                    <option value="RANTHILINA">{t('Ranthilina (Children)')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Initial Deposit (Rs.)')}</label>
                <input type="number" min="100" value={accForm.initialDeposit} onChange={e => setAccForm(p => ({ ...p, initialDeposit: parseInt(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              
              {['ARUNALU', 'RANTHILINA', 'CHILD'].includes(accForm.accountType) && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">{t('Child Information')}</h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{t("Child's Name *")}</label>
                    <input required value={accForm.childName} onChange={e => setAccForm(p => ({ ...p, childName: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{t('Birth Certificate No. *')}</label>
                      <input required value={accForm.childBirthCertificate} onChange={e => setAccForm(p => ({ ...p, childBirthCertificate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">{t('Date of Birth *')}</label>
                      <input required type="date" value={accForm.childDateOfBirth} onChange={e => setAccForm(p => ({ ...p, childDateOfBirth: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
                    </div>
                  </div>
                </div>
              )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAccModal(false); setAccCustomerType(null); setSelectedMemberId(''); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm">{t('Cancel')}</button>
                  <button type="submit" disabled={loading || !selectedMemberId} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                    {loading ? t('Opening...') : t('Open Account')}
                  </button>
                </div>
              </form>
            )}
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

function BankServiceManagerView() {
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
        ].map((l, i) => <QueueRow key={i} {...l} actionLabel="Issue Directive" actionColor="bg-purple-600" onAction={() => alert('Directive issued!')} />)}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function FieldOfficerView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MapPin}        label="Assigned Area"    value="Hikkaduwa South" color="text-teal-600" />
        <StatCard icon={Users}         label="Today's Visits"   value="24"             color="text-blue-600" />
        <StatCard icon={Banknote}      label="Daily Collection" value="Rs. 0.00"       color="text-green-600" />
        <StatCard icon={AlertTriangle} label="Overdue Loans"    value="3"              color="text-red-600" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><ClipboardList size={16} className="text-blue-600" /> Today's Collection Route</h3>
        <p className="text-sm text-slate-500 mb-4">Mobile collection features (offline sync, Bluetooth receipt printing) will be integrated here.</p>
        <div className="space-y-3">
          {[
            { name: 'K.D. Perera', address: '45 Beach Road, Hikkaduwa', type: 'Loan Repayment', amount: '2,500' },
            { name: 'S.M. Silva', address: '12 Temple Road, Hikkaduwa', type: 'Savings Deposit', amount: '1,000' },
            { name: 'R.P. Jayasinghe', address: '89 Galle Road, Hikkaduwa', type: 'Loan Repayment', amount: '5,000' }
          ].map((v, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">{v.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                  <p className="text-xs text-slate-500">{v.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Rs. {v.amount}</p>
                <p className="text-xs text-slate-500">{v.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── General Ledger View ──────────────────────────────────────────────────────
function LedgerView({ branchId }: { branchId?: number }) {
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
          <h3 className="font-bold text-slate-800">ණය ලෙජරය — General Ledger</h3>
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

export default function BranchDashboard({ overrideActiveTab, hideSidebar, overrideRole, readOnly, onBack }: { overrideActiveTab?: string, hideSidebar?: boolean, overrideRole?: string, readOnly?: boolean, onBack?: () => void } = {}) {
  const navigate   = useNavigate();
  const user       = AuthService.getCurrentUser();
  const [internalTab, setTabState] = useState(() => localStorage.getItem('hmcs_active_tab') || 'overview');
  const tab = overrideActiveTab || internalTab;
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    AccountService.getBranchNotifications().then(async (notifs) => {
      // Fetch Pawning Tickets to check for nearing maturity
      try {
        const { getTicketsByBranch } = await import('../services/pawning.service');
        const tickets = await getTicketsByBranch(user.branchId);
        const nearingPawning = tickets.filter((t: any) => {
          if (t.status === 'REDEEMED' || t.status === 'OVERDUE') return false;
          const expiry = new Date(t.expiryDate);
          const diffDays = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          return diffDays <= 30 && diffDays >= 0;
        });
        const pawningNotifs = nearingPawning.map((t: any) => ({
          type: 'PW_MATURITY',
          isRead: false,
          title: `උකස් පත්‍රිකාව කල්පිරීමට ආසන්නයි (PW-${t.ticketNumber})`,
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

  const { t } = useLanguage();

  if (!user) { navigate('/login'); return null; }

  const role    = overrideRole || user.role?.replace('ROLE_', '') || 'TELLER';
  const roleConfig = ROLE_CONFIG[role]  || ROLE_CONFIG['TELLER'];
  const branchTheme = BRANCH_THEMES[user.branchId] || BRANCH_THEMES[1];
  
  const config = {
    ...roleConfig,
    bg: branchTheme.bg,
    gradient: branchTheme.gradient,
    color: branchTheme.color,
    logoBg: branchTheme.logoBg
  };

  const navItems = ROLE_NAV[role]    || ROLE_NAV['TELLER'];

  const renderContent = () => {
    if (tab === 'rates') {
      return <div className="mt-4"><GlobalSettings currentTab='rates' readOnly={true} /></div>;
    }

    switch (role) {
      case 'BRANCH_MANAGER':       return <BranchManagerView activeTab={tab} />;
      case 'LOAN_COMMITTEE':       return <LoanCommitteeView activeTab={tab} />;
      case 'TELLER':               return <TellerView />;
      case 'VALUER':               return <ValuerView />;
      case 'FIELD_OFFICER':        return <FieldOfficerView />;
      case 'SENIOR_OFFICER':       return <CustomerServiceView activeTab={tab} onTabChange={setTab} readOnly={readOnly} />;
      case 'BANK_SERVICE_MANAGER': return <BankServiceManagerView />;
      default:                     return <BranchManagerView activeTab={tab} />;
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
              <p className="text-white/70 text-[10px] leading-tight">{user.branchName ? t(user.branchName) : t(getBranchName(user.branchId))}</p>
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
                        {sub.icon && <sub.icon size={18} className={`mr-2.5 shrink-0 ${tab === sub.key ? config.color : 'text-white/70'}`} />}
                        <span className="flex-1">{t(sub.label)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <button key={item.key} onClick={() => setTab(item.key!)}
                className={`flex items-center w-full px-4 py-2.5 mb-1.5 rounded-xl text-[15px] font-bold transition-all border ${
                  tab === item.key 
                    ? 'bg-white border-white text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)] scale-[1.02]' 
                    : 'bg-white/5 border-white/30 text-white/80 hover:bg-white/15 hover:border-white/50 hover:text-white'
                }`}>
                <item.icon size={20} className={`mr-3.5 shrink-0 ${tab === item.key ? config.color : 'text-white/80'}`} />
                <span className="flex-1">{t(item.label)}</span>
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
              <h1 className="text-lg font-bold text-slate-800">{user.branchName ? t(user.branchName) : t(getBranchName(user.branchId))}</h1>
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
    </div>
  );
}


