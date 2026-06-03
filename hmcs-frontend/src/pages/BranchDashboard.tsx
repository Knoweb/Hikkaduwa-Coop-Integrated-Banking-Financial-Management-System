import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, CreditCard, FileText,
  Gem, ClipboardList, TrendingUp, AlertTriangle, CheckCircle,
  Clock, DollarSign, UserPlus, Scale, Banknote, ArrowDownLeft,
  ArrowUpRight, Shield, Bell, ChevronRight, Award, X, Search
} from 'lucide-react';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import logo from '../assets/logo.jpg';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  BRANCH_MANAGER:       { label: 'Branch Manager',       color: 'text-blue-700',   bg: 'bg-blue-600',   gradient: 'from-blue-900 via-blue-800 to-slate-900' },
  BANK_SERVICE_MANAGER: { label: 'Bank Service Manager', color: 'text-purple-700', bg: 'bg-purple-600', gradient: 'from-purple-900 via-purple-800 to-slate-900' },
  LOAN_COMMITTEE:       { label: 'Loan Committee',       color: 'text-amber-700',  bg: 'bg-amber-600',  gradient: 'from-amber-900 via-amber-800 to-slate-900' },
  FIELD_OFFICER:        { label: 'Field Officer',        color: 'text-green-700',  bg: 'bg-green-600',  gradient: 'from-green-900 via-green-800 to-slate-900' },
  TELLER:               { label: 'Teller',               color: 'text-red-700',    bg: 'bg-red-600',    gradient: 'from-red-900 via-red-800 to-slate-900' },
  VALUER:               { label: 'Valuer',               color: 'text-yellow-700', bg: 'bg-yellow-600', gradient: 'from-yellow-900 via-yellow-800 to-slate-900' },
};

const ROLE_NAV: Record<string, { icon: any; label: string; key: string }[]> = {
  BRANCH_MANAGER:       [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: Users, label: 'Members', key: 'members' }, { icon: CreditCard, label: 'Accounts', key: 'accounts' }, { icon: FileText, label: 'Loan Queue', key: 'loans' }, { icon: AlertTriangle, label: 'Alerts', key: 'alerts' }],
  BANK_SERVICE_MANAGER: [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: Shield, label: 'Compliance', key: 'loans' }],
  LOAN_COMMITTEE:       [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: Scale, label: 'Vote on Loans', key: 'loans' }],
  FIELD_OFFICER:        [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: UserPlus, label: 'Register Member', key: 'members' }, { icon: ClipboardList, label: 'Field Tasks', key: 'tasks' }],
  TELLER:               [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: ArrowDownLeft, label: 'Deposit', key: 'deposit' }, { icon: ArrowUpRight, label: 'Withdraw', key: 'withdraw' }],
  VALUER:               [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: Gem, label: 'New Pawn Ticket', key: 'pawn' }],
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

function FieldOfficerView() {
  const user = AuthService.getCurrentUser();
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [search, setSearch] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [accError, setAccError] = useState('');
  const [form, setForm] = useState({ fullName: '', nic: '', dateOfBirth: '', address: '', contactNumber: '' });
  const [accForm, setAccForm] = useState({ accountType: 'REGULAR', initialDeposit: 1000 });

  const fetchData = () => {
    AccountService.getMembers().then(setMembers).catch(() => {});
    AccountService.getAccounts().then(setAccounts).catch(() => {});
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.nic.toLowerCase().includes(search.toLowerCase())
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setRegError(''); setLoading(true);
    try {
      await AccountService.registerMember(form);
      setShowRegModal(false);
      setForm({ fullName: '', nic: '', dateOfBirth: '', address: '', contactNumber: '' });
      fetchData();
    } catch (err: any) {
      setRegError(err.response?.data || 'Registration failed. Check NIC for duplicates.');
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Users}        label="Total Members"    value={members.length.toString()} color="text-green-600" />
        <StatCard icon={CreditCard}   label="Total Accounts"   value={accounts.length.toString()} color="text-blue-600" />
        <StatCard icon={UserPlus}     label="Active Members"   value={members.filter(m => m.status === 'ACTIVE').length.toString()} color="text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={16} /> Branch Members</h3>
          <button onClick={() => setShowRegModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <UserPlus size={14} /> Register Member
          </button>
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or NIC..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No members found. Register the first member!</p>
          ) : filtered.map(m => (
            <div key={m.memberId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {m.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.fullName}</p>
                  <p className="text-xs text-slate-400">{m.nic} · {getAccountCount(m.memberId)} account(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span>
                <button onClick={() => { setSelectedMemberId(m.memberId || ''); setShowAccModal(true); }}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                  Open Account
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register Member Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Register New Member</h3>
              <button onClick={() => setShowRegModal(false)}><X size={18} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {regError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">{regError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <input required value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">NIC Number</label>
                  <input required value={form.nic} onChange={e => setForm(p => ({ ...p, nic: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Contact Number</label>
                  <input required value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth</label>
                <input required type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                <textarea required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                  {loading ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Account Modal */}
      {showAccModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Open Savings Account</h3>
              <button onClick={() => setShowAccModal(false)}><X size={18} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleOpenAccount} className="p-6 space-y-4">
              {accError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">{accError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Account Type</label>
                <select value={accForm.accountType} onChange={e => setAccForm(p => ({ ...p, accountType: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="REGULAR">Regular Savings</option>
                  <option value="CHILD">Children's Account</option>
                  <option value="SENIOR">Senior Citizen</option>
                  <option value="FIXED">Fixed Deposit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Initial Deposit (Rs.)</label>
                <input type="number" min="100" value={accForm.initialDeposit} onChange={e => setAccForm(p => ({ ...p, initialDeposit: parseInt(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAccModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                  {loading ? 'Opening...' : 'Open Account'}
                </button>
              </div>
            </form>
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
export default function BranchDashboard() {
  const navigate   = useNavigate();
  const user       = AuthService.getCurrentUser();
  const [tab, setTab] = useState('overview');

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
            <p className="font-bold text-white text-sm">HMCS Bank</p>
            <p className="text-white/50 text-xs">Hikkaduwa Branch</p>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-white/10">
          <div className={`${config.bg} bg-opacity-30 rounded-xl px-3 py-2 flex items-center gap-2`}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user.username}</p>
              <p className="text-white/60 text-xs">{config.label}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.key ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={18} className="mr-3" />{item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => { AuthService.logout(); navigate('/login'); }}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition">
            <LogOut size={16} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Hikkaduwa Branch</h1>
            <p className="text-xs text-slate-400">{config.label} Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Branch Online
            </span>
            <Bell size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {navItems.find(n => n.key === tab)?.label || 'Overview'}
            </h2>
            <p className="text-sm text-slate-500">Welcome back, {user.username}. Here's your work summary.</p>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
