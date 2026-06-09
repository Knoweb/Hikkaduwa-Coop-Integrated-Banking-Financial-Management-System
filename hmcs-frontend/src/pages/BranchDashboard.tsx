import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, CreditCard, FileText,
  Gem, ClipboardList, TrendingUp, AlertTriangle, CheckCircle,
  Clock, DollarSign, UserPlus, Scale, Banknote, ArrowDownLeft,
  ArrowUpRight, Shield, Bell, ChevronRight, Award, X, Search, PiggyBank, Lock, MapPin, FileImage
} from 'lucide-react';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import logo from '../assets/logo.jpg';
import { useLanguage } from '../context/LanguageContext';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  BRANCH_MANAGER:       { label: 'Branch Manager',       color: 'text-blue-700',   bg: 'bg-blue-600',   gradient: 'from-blue-900 via-blue-800 to-slate-900' },
  BANK_SERVICE_MANAGER: { label: 'Bank Service Manager', color: 'text-purple-700', bg: 'bg-purple-600', gradient: 'from-purple-900 via-purple-800 to-slate-900' },
  LOAN_COMMITTEE:       { label: 'Loan Committee',       color: 'text-amber-700',  bg: 'bg-amber-600',  gradient: 'from-amber-900 via-amber-800 to-slate-900' },
  SENIOR_OFFICER:       { label: 'Senior Officer',       color: 'text-teal-700',   bg: 'bg-teal-600',   gradient: 'from-teal-900 via-teal-800 to-slate-900' },
  FIELD_OFFICER:        { label: 'Field Officer',        color: 'text-green-700',  bg: 'bg-green-600',  gradient: 'from-green-900 via-green-800 to-slate-900' },
  TELLER:               { label: 'Teller',               color: 'text-red-700',    bg: 'bg-red-600',    gradient: 'from-red-900 via-red-800 to-slate-900' },
  VALUER:               { label: 'Valuer',               color: 'text-yellow-700', bg: 'bg-yellow-600', gradient: 'from-yellow-900 via-yellow-800 to-slate-900' },
};

const ROLE_NAV: Record<string, { icon?: any; label: string; key?: string; isSection?: boolean }[]> = {
  BRANCH_MANAGER:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'People' },
    { icon: Users, label: 'Members', key: 'members' }, 
    { isSection: true, label: 'Operations' },
    { icon: CreditCard, label: 'Accounts', key: 'accounts' }, 
    { icon: FileText, label: 'Loan Queue', key: 'loans' }, 
    { icon: AlertTriangle, label: 'Alerts', key: 'alerts' }
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
    { isSection: true, label: 'People Management' },
    { icon: UserPlus, label: 'Members', key: 'members' },
    { icon: Users, label: 'Non-Members', key: 'non-members' },
    { isSection: true, label: 'Financial Accounts' },
    { icon: PiggyBank, label: 'Savings Accounts', key: 'savings' },
    { icon: Lock, label: 'Fixed Deposits', key: 'fds' },
    { icon: FileText, label: 'Loan Accounts', key: 'loans' }
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
function BranchManagerView({ activeTab }: { activeTab: string }) {
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    AccountService.getMembers().then(setMembers).catch(() => {});
    AccountService.getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const filteredMembers = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.nic.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAccounts = accounts.filter(a =>
    a.accountNumber.toLowerCase().includes(search.toLowerCase())
  );

  const loans = [
    { name: 'K.D. Perera', amount: 250000, status: 'PENDING', date: '2026-06-01' },
    { name: 'S.M. Silva',  amount: 180000, status: 'PENDING', date: '2026-06-02' },
    { name: 'R.P. Jayasinghe', amount: 450000, status: 'APPROVED', date: '2026-05-31' },
  ];

  if (activeTab === 'overview') return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}    label="Total Branch Balance" value={`Rs. ${totalBalance.toLocaleString()}`} sub="All accounts" color="text-blue-600" />
        <StatCard icon={Users}         label="Total Members"        value={members.length.toString()}              sub="Registered"  color="text-green-600" />
        <StatCard icon={CreditCard}    label="Total Accounts"       value={accounts.length.toString()}             sub="Active"      color="text-purple-600" />
        <StatCard icon={FileText}      label="Pending Loans"        value={loans.filter(l => l.status === 'PENDING').length.toString()} sub="Awaiting action" color="text-amber-600" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} /> Pending Loan Queue</h3>
          {loans.filter(l => l.status === 'PENDING').map((l, i) => <QueueRow key={i} {...l} actionLabel="Recommend" actionColor="bg-blue-600" onAction={() => alert(`Recommended loan for ${l.name}`)} />)}
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

  if (activeTab === 'loans') return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} /> Loan Recommendation Queue</h3>
      {loans.map((l, i) => <QueueRow key={i} {...l} actionLabel="Recommend" actionColor="bg-blue-600" onAction={l.status === 'PENDING' ? () => alert(`Recommended loan for ${l.name}`) : undefined} />)}
    </div>
  );

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
  const [voted, setVoted] = useState<Record<number, string>>({});
  const loans = [
    { id: 0, name: 'K.D. Perera',      amount: 250000, type: 'PERSONAL',   months: 24 },
    { id: 1, name: 'S.M. Silva',       amount: 180000, type: 'EMERGENCY',  months: 12 },
    { id: 2, name: 'A.B. Bandara',     amount: 500000, type: 'BUSINESS',   months: 36 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Clock}        label="Pending Votes"  value={loans.length - Object.keys(voted).length} color="text-amber-600" />
        <StatCard icon={CheckCircle}  label="Approved Today" value={Object.values(voted).filter(v => v === 'approve').length} color="text-green-600" />
        <StatCard icon={AlertTriangle} label="Rejected Today" value={Object.values(voted).filter(v => v === 'reject').length} color="text-red-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Scale size={16} /> Loan Applications — Cast Your Vote</h3>
        {loans.map(l => (
          <div key={l.id} className="py-4 border-b border-slate-100 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-800">{l.name}</p>
                <p className="text-xs text-slate-400">{l.type} · {l.months} months · Rs. {l.amount.toLocaleString()}</p>
              </div>
              {voted[l.id] ? (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${voted[l.id] === 'approve' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {voted[l.id] === 'approve' ? '✓ Approved' : '✗ Rejected'}
                </span>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setVoted(v => ({ ...v, [l.id]: 'approve' }))} className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg font-semibold hover:bg-green-700 transition">Approve</button>
                  <button onClick={() => setVoted(v => ({ ...v, [l.id]: 'reject' }))}  className="px-4 py-1.5 bg-red-600  text-white text-sm rounded-lg font-semibold hover:bg-red-700  transition">Reject</button>
                </div>
              )}
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

  useEffect(() => {
    AccountService.getAccounts().then(setAccounts).catch(() => {});
  }, []);

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
      AccountService.getAccounts().then(setAccounts).catch(() => {});
    } catch (e: any) {
      setResult({ ok: false, msg: e.response?.data || 'Transaction failed' });
    } finally { setLoading(false); }
  };

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Banknote}   label="Total Branch Balance" value={`Rs. ${totalBalance.toLocaleString()}`} color="text-green-600" />
        <StatCard icon={CreditCard} label="Active Accounts"      value={accounts.length.toString()}            color="text-blue-600" />
        <StatCard icon={TrendingUp} label="Account Types"        value={[...new Set(accounts.map(a => a.accountType))].length.toString()} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Banknote size={16} /> Cash Transaction</h3>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-4">
            <button onClick={() => setTxType('deposit')}  className={`flex-1 py-2.5 text-sm font-semibold transition ${txType === 'deposit'  ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Deposit</button>
            <button onClick={() => setTxType('withdraw')} className={`flex-1 py-2.5 text-sm font-semibold transition ${txType === 'withdraw' ? 'bg-red-600 text-white'   : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Withdraw</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Account Number</label>
              <input value={accNo} onChange={e => setAccNo(e.target.value)} placeholder="e.g. ACC-123456"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Amount (Rs.)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            {result && (
              <div className={`p-3 rounded-xl text-sm font-medium ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {result.msg}
              </div>
            )}
            <button onClick={handleTx} disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold transition disabled:opacity-60 ${txType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {loading ? 'Processing...' : `Process ${txType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={16} /> Branch Accounts</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No accounts found</p>
            ) : accounts.map(a => (
              <div key={a.accountId} onClick={() => setAccNo(a.accountNumber)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{a.accountNumber}</p>
                  <p className="text-xs text-slate-400">{a.accountType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">Rs. {Number(a.balance).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
                </div>
              </div>
            ))}
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

function CustomerServiceView({ activeTab }: { activeTab: string }) {
  const { t, language } = useLanguage();
  const user = AuthService.getCurrentUser();
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<AccountService.SavingsAccountType[]>([]);
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
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
  const initialFormState = { isMember: true, membershipNumber: '', nameWithInitials: '', fullName: '', fullNameSinhala: '', nic: '', dateOfBirth: '', gender: 'MALE', maritalStatus: 'UNMARRIED', address: '', province: '', contactNumber: '', belongsToOtherSociety: false, otherSocietyName: '', shareAmount: '' as number | string, photographUrl: '', digitalSignatureUrl: '' };
  const [form, setForm] = useState(initialFormState);
  const [accForm, setAccForm] = useState({ accountType: 'NORMAL', initialDeposit: 1000, childName: '', childBirthCertificate: '', childDateOfBirth: '' });
  const [accCustomerType, setAccCustomerType] = useState<'true' | 'false' | null>(null);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [signatureProgress, setSignatureProgress] = useState(0);

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

  const fetchData = () => {
    AccountService.getMembers().then(setMembers).catch(() => {});
    AccountService.getAccounts().then(setAccounts).catch(() => {});
    AccountService.getSavingsAccountTypes().then(setSavingsTypes).catch(() => {});
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (form.memberId) {
      if (!window.confirm(t("Are you sure you want to save changes to this profile?"))) return;
    }
    setRegError(''); setLoading(true);
    try {
      const payload = { 
        ...form, 
        shareAmount: Number(form.shareAmount) || 0,
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
      setAccError(err.response?.data || 'Failed to open account.');
    } finally { setLoading(false); }
  };

  const getAccountCount = (memberId?: string) => accounts.filter(a => a.memberId === memberId).length;

  const filteredAccounts = accounts.filter(a => a.accountNumber.toLowerCase().includes(search.toLowerCase()));

  if (activeTab === 'savings') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{t('Branch Accounts')} ({accounts.length})</h3>
          <button onClick={() => { setSelectedMemberId(''); setShowAccModal(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <CreditCard size={14} /> {t('Open Account')}
          </button>
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search account number...')}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('Account No.')}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('Type')}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('Balance')}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">{t('No accounts found')}</td></tr>
              ) : filteredAccounts.map(a => (
                <tr key={a.accountId} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 font-bold text-slate-800">{a.accountNumber}</td>
                  <td className="px-5 py-3"><span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium">{t(a.accountType)}</span></td>
                  <td className="px-5 py-3 font-semibold text-slate-800">Rs. {Number(a.balance).toLocaleString()}</td>
                  <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t(a.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                    {savingsTypes.map(st => (
                      <option key={st.id} value={st.code}>
                        {language === 'si' ? st.nameSi : st.nameEn}
                      </option>
                    ))}
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
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                    {loading ? t('Opening...') : t('Open Account')}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Users}        label={isNonMembersTab ? t('Total Non-Members') : t('Total Members')}    value={displayedMembers.length.toString()} color="text-green-600" />
        <StatCard icon={CreditCard}   label={t('Total Accounts')}   value={accounts.length.toString()} color="text-blue-600" />
        <StatCard icon={UserPlus}     label={isNonMembersTab ? t('Active Non-Members') : t('Active Members')}   value={displayedMembers.filter(m => m.status === 'ACTIVE').length.toString()} color="text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> {isNonMembersTab ? t('Non-Members') : t('Branch Members')}</h3>
          <button onClick={() => { setForm(prev => ({ ...initialFormState, isMember: !isNonMembersTab })); setShowRegModal(true); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <UserPlus size={14} /> {isNonMembersTab ? t('Register Non-Member') : t('Register Member')}
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
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
        <div className="overflow-x-auto max-h-80 border border-slate-100 rounded-xl">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t(m.status)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {m.ageCategory ? t(m.ageCategory) : t('ADULT')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { 
                        setForm(m as any); 
                        setIsChildReg(m.ageCategory === 'CHILD');
                        setGuardianNic(m.guardianNic || '');
                        setGuardianMemberNo(m.guardianMemberNo || '');
                        if (m.guardianNic || m.guardianMemberNo) {
                          const g = members.find(gm => (m.guardianNic && gm.nic === m.guardianNic) || (m.guardianMemberNo && gm.membershipNumber === m.guardianMemberNo));
                          setSelectedGuardianData(g || null);
                        } else {
                          setSelectedGuardianData(null);
                        }
                        setShowRegModal(true); 
                      }}
                      className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-200 transition flex items-center gap-1.5 inline-flex">
                      <FileText size={12} /> {t('View / Edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header / Letterhead */}
            <div className="bg-slate-800 px-6 py-5 flex justify-between items-center shrink-0 border-b-4 border-green-600">
              <div className="flex items-center gap-4">
                <img src={logo} alt="HMCS Logo" className="w-12 h-12 rounded-md object-cover border border-white/20 shadow-sm bg-white" />
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide uppercase">{t('Hikkaduwa Branch')}</h2>
                  <p className="text-slate-300 text-sm">{form.memberId ? t('Edit Profile') : form.isMember ? t('Register New Member') : t('Register Non-Member')}</p>
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
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Full Name (Sinhala/Tamil)')}</label>
                      <input value={form.fullNameSinhala} onChange={e => setForm(p => ({ ...p, fullNameSinhala: e.target.value }))}
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
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('Share Amount (Rs.)')}</label>
                        <input type="number" min="0" step="0.01" value={form.shareAmount} onChange={e => setForm(p => ({ ...p, shareAmount: e.target.value }))} placeholder="e.g. 1000.00"
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50" />
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
                  </div>
                </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 p-4 px-6 flex justify-end gap-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-6 py-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-bold text-sm transition shadow-sm">
                  {t('Cancel')}
                </button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md disabled:opacity-60 transition flex items-center gap-2">
                  {loading ? t('Processing...') : <><CheckCircle size={18}/> {form.memberId ? t('Save Changes') : t('Authorize & Register')}</>}
                </button>
              </div>
            </form>
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

export default function BranchDashboard() {
  const navigate   = useNavigate();
  const user       = AuthService.getCurrentUser();
  const [tab, setTabState] = useState(() => localStorage.getItem('hmcs_active_tab') || 'overview');
  
  const setTab = (newTab: string) => {
    localStorage.setItem('hmcs_active_tab', newTab);
    setTabState(newTab);
  };

  const { t, language, toggleLanguage } = useLanguage();

  if (!user) { navigate('/login'); return null; }

  const role    = user.role?.replace('ROLE_', '') || 'TELLER';
  const config  = ROLE_CONFIG[role]  || ROLE_CONFIG['TELLER'];
  const navItems = ROLE_NAV[role]    || ROLE_NAV['TELLER'];

  const renderContent = () => {
    switch (role) {
      case 'BRANCH_MANAGER':       return <BranchManagerView activeTab={tab} />;
      case 'LOAN_COMMITTEE':       return <LoanCommitteeView activeTab={tab} />;
      case 'TELLER':               return <TellerView />;
      case 'VALUER':               return <ValuerView />;
      case 'FIELD_OFFICER':        return <FieldOfficerView />;
      case 'SENIOR_OFFICER':       return <CustomerServiceView activeTab={tab} />;
      case 'BANK_SERVICE_MANAGER': return <BankServiceManagerView />;
      default:                     return <BranchManagerView activeTab={tab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`w-64 bg-gradient-to-b ${config.gradient} flex flex-col fixed h-full z-10`}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <img src={logo} alt="HMCS" className="w-8 h-8 rounded-lg object-cover mr-3 border border-white/20" />
          <div>
            <p className="font-bold text-white text-sm">{t('Hikkaduwa Branch')}</p>
            <p className="text-white/50 text-xs">HMCS Bank</p>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-white/10">
          <div className={`${config.bg} bg-opacity-30 rounded-xl px-3 py-2 flex items-center gap-2`}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user.username}</p>
              <p className="text-white/60 text-xs">{t(config.label)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.isSection) {
              return (
                <div key={`sec-${idx}`} className={idx === 0 ? "mb-2 px-3" : "mt-6 mb-2 px-3"}>
                  {idx !== 0 && <div className="h-px w-full bg-white/10 mb-3"></div>}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{t(item.label)}</p>
                </div>
              );
            }
            return (
              <button key={item.key} onClick={() => setTab(item.key!)}
                className={`flex items-center w-full px-3 py-3 mb-2 rounded-xl text-sm font-bold transition-all border ${
                  tab === item.key 
                    ? 'bg-white border-white text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)] scale-[1.02]' 
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}>
                <item.icon size={18} className={`mr-3 shrink-0 ${tab === item.key ? config.color : 'text-white/70'}`} />
                {t(item.label)}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => { AuthService.logout(); navigate('/login'); }}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition">
            <LogOut size={16} className="mr-2" /> {t('Sign Out')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{t('Hikkaduwa Branch')}</h1>
            <p className="text-xs text-slate-400">{t(config.label)} {t('Dashboard')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition border border-slate-200 shadow-sm">
              <span className={language === 'en' ? 'text-blue-700' : 'text-slate-500 hover:text-blue-700'}>EN</span>
              <span className="text-slate-300">|</span>
              <span className={language === 'si' ? 'text-blue-700' : 'text-slate-500 hover:text-blue-700'}>සිංහල</span>
            </button>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('Branch Online')}
            </span>
            <Bell size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {t(navItems.find(n => n.key === tab)?.label || 'Overview')}
            </h2>
            <p className="text-sm text-slate-500">{t('Welcome back')}, {user.username}. {t("Here's your work summary.")}</p>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
