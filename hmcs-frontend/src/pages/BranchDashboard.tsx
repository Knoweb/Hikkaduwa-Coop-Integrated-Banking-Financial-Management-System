import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, CreditCard, FileText,
  Gem, ClipboardList, TrendingUp, AlertTriangle, CheckCircle,
  Clock, DollarSign, UserPlus, Scale, Banknote, ArrowDownLeft,
  ArrowUpRight, Shield, Bell, ChevronRight, Award
} from 'lucide-react';
import * as AuthService from '../services/auth.service';
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
  BRANCH_MANAGER:       [{ icon: LayoutDashboard, label: 'Overview', key: 'overview' }, { icon: FileText, label: 'Loan Queue', key: 'loans' }, { icon: CreditCard, label: 'Accounts', key: 'accounts' }, { icon: AlertTriangle, label: 'Alerts', key: 'alerts' }],
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
  const loans = [
    { name: 'K.D. Perera', amount: 250000, status: 'PENDING', date: '2026-06-01' },
    { name: 'S.M. Silva',  amount: 180000, status: 'PENDING', date: '2026-06-02' },
    { name: 'R.P. Jayasinghe', amount: 450000, status: 'APPROVED', date: '2026-05-31' },
  ];
  if (activeTab === 'overview') return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}    label="EOD Cash Position" value="Rs. 2.4M"  sub="End of today"      color="text-blue-600" />
        <StatCard icon={FileText}      label="Pending Loans"     value="5"          sub="Awaiting approval"  color="text-amber-600" />
        <StatCard icon={Users}         label="Total Members"     value="1,284"      sub="Active accounts"   color="text-green-600" />
        <StatCard icon={AlertTriangle} label="FD Alerts"         value="3"          sub="Maturing this week" color="text-red-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} /> Loan Recommendation Queue</h3>
        {loans.map((l, i) => <QueueRow key={i} {...l} actionLabel="Recommend" actionColor="bg-blue-600" onAction={l.status === 'PENDING' ? () => alert(`Recommended loan for ${l.name}`) : undefined} />)}
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
  );
  return <div className="bg-white rounded-2xl p-6 shadow-sm"><h3 className="font-semibold text-slate-700">Loan Queue</h3>{loans.map((l, i) => <QueueRow key={i} {...l} actionLabel="Recommend" actionColor="bg-blue-600" onAction={() => {}} />)}</div>;
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
  const [accNo, setAccNo]   = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={TrendingUp}   label="Transactions Today" value="47"        color="text-blue-600" />
        <StatCard icon={Banknote}     label="Cash Processed"     value="Rs. 1.2M"  color="text-green-600" />
        <StatCard icon={UserPlus}     label="Accounts Opened"    value="3"         color="text-purple-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-md">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Banknote size={16} /> Cash Transaction</h3>
        <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-5">
          <button onClick={() => setTxType('deposit')}  className={`flex-1 py-2.5 text-sm font-semibold transition ${txType === 'deposit'  ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Deposit</button>
          <button onClick={() => setTxType('withdraw')} className={`flex-1 py-2.5 text-sm font-semibold transition ${txType === 'withdraw' ? 'bg-red-600   text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Withdraw</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Account Number</label>
            <input value={accNo} onChange={e => setAccNo(e.target.value)} placeholder="e.g. ACC-0001234" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Amount (Rs.)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button onClick={() => alert(`${txType} of Rs. ${amount} for ${accNo} processed!`)} className={`w-full py-3 rounded-xl text-white font-semibold transition ${txType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            Process {txType.charAt(0).toUpperCase() + txType.slice(1)}
          </button>
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Pending Field Visits" value="8"  color="text-green-600" />
        <StatCard icon={FileText}      label="Reports Submitted"    value="3"  color="text-blue-600" />
        <StatCard icon={UserPlus}      label="Members Registered"   value="12" color="text-purple-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><ClipboardList size={16} /> Pending Field Tasks</h3>
        {[
          { name: 'K.D. Perera — Loan Asset Verification',    due: 'Due: Today',       urgent: true },
          { name: 'S.M. Silva — KYC Update Required',         due: 'Due: Tomorrow',    urgent: false },
          { name: 'A.B. Bandara — Property Valuation Report', due: 'Due: Jun 5, 2026', urgent: false },
        ].map((t, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              {t.urgent && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              <div>
                <p className="text-sm font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400">{t.due}</p>
              </div>
            </div>
            <button className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-1">
              Submit Report <ChevronRight size={12} />
            </button>
          </div>
        ))}
      </div>
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
