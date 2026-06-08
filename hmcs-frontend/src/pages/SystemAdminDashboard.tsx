import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Building, Plus, Edit, Trash2,
  CheckCircle, Server, Database, Clock, Shield, Key, Users,
  Settings, ChevronRight, Save, ArrowLeft, X, Eye, EyeOff, Percent, PiggyBank
} from 'lucide-react';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.jpg';

const BRANCHES = [
  { id: 1, name: 'Main Branch - Hikkaduwa', location: 'Hikkaduwa Town' },
  { id: 2, name: 'Dodanduwa Branch',        location: 'Dodanduwa' },
  { id: 3, name: 'Rathgama Branch',          location: 'Rathgama' },
  { id: 4, name: 'Seenigama Branch',         location: 'Seenigama' },
  { id: 5, name: 'Thiranagama Branch',       location: 'Thiranagama' },
  { id: 6, name: 'Peraliya Branch',          location: 'Peraliya' },
  { id: 7, name: 'Kalupe Branch',            location: 'Kalupe' },
  { id: 8, name: 'Gonapinuwala Branch',      location: 'Gonapinuwala' },
];

const ROLES = [
  'GENERAL_MANAGER', 'BRANCH_MANAGER', 'BANK_SERVICE_MANAGER',
  'LOAN_COMMITTEE', 'FIELD_OFFICER', 'TELLER', 'VALUER'
];

const ROLE_COLORS: Record<string, string> = {
  GENERAL_MANAGER:      'bg-purple-100 text-purple-700 border border-purple-200',
  BRANCH_MANAGER:       'bg-blue-100 text-blue-700 border border-blue-200',
  BANK_SERVICE_MANAGER: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  LOAN_COMMITTEE:       'bg-amber-100 text-amber-700 border border-amber-200',
  FIELD_OFFICER:        'bg-green-100 text-green-700 border border-green-200',
  TELLER:               'bg-red-100 text-red-700 border border-red-200',
  VALUER:               'bg-yellow-100 text-yellow-700 border border-yellow-200',
  SYSTEM_ADMIN:         'bg-slate-100 text-slate-700 border border-slate-200',
};

const ROLE_AVATARS: Record<string, string> = {
  GENERAL_MANAGER:      'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white',
  BRANCH_MANAGER:       'bg-gradient-to-tr from-blue-500 to-cyan-500 text-white',
  BANK_SERVICE_MANAGER: 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white',
  LOAN_COMMITTEE:       'bg-gradient-to-tr from-amber-500 to-orange-500 text-white',
  FIELD_OFFICER:        'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white',
  TELLER:               'bg-gradient-to-tr from-rose-500 to-orange-500 text-white',
  VALUER:               'bg-gradient-to-tr from-yellow-500 to-amber-500 text-white',
  SYSTEM_ADMIN:         'bg-gradient-to-tr from-slate-600 to-slate-800 text-white',
};

const DEMO_USERS = [
  { id: 1, username: 'admin',       fullName: 'System Administrator', role: 'SYSTEM_ADMIN',      branchId: 1, status: 'ACTIVE' },
  { id: 2, username: 'gm_perera',   fullName: 'D.P. Perera',          role: 'GENERAL_MANAGER',   branchId: 1, status: 'ACTIVE' },
  { id: 3, username: 'mgr_hkw',     fullName: 'R.M. Silva',           role: 'BRANCH_MANAGER',    branchId: 1, status: 'ACTIVE' },
  { id: 4, username: 'teller_hkw',  fullName: 'K.D. Jayasinghe',      role: 'TELLER',            branchId: 1, status: 'ACTIVE' },
  { id: 5, username: 'valuer_hkw',  fullName: 'A.B. Bandara',         role: 'VALUER',            branchId: 1, status: 'ACTIVE' },
  { id: 6, username: 'mgr_dod',     fullName: 'S.M. Fernando',        role: 'BRANCH_MANAGER',    branchId: 2, status: 'ACTIVE' },
  { id: 7, username: 'teller_dod',  fullName: 'N.P. Karunaratne',     role: 'TELLER',            branchId: 2, status: 'ACTIVE' },
];

const BRANCH_GLOWS = [
  { glow: 'rgba(59,130,246,0.45)',  badge: '#1d4ed8', border: '#3b82f6', bg: 'rgba(59,130,246,0.07)' },
  { glow: 'rgba(168,85,247,0.45)', badge: '#7c3aed', border: '#a855f7', bg: 'rgba(168,85,247,0.07)' },
  { glow: 'rgba(34,197,94,0.45)',  badge: '#16a34a', border: '#22c55e', bg: 'rgba(34,197,94,0.07)'  },
  { glow: 'rgba(249,115,22,0.45)', badge: '#ea580c', border: '#f97316', bg: 'rgba(249,115,22,0.07)' },
  { glow: 'rgba(20,184,166,0.45)', badge: '#0f766e', border: '#14b8a6', bg: 'rgba(20,184,166,0.07)' },
  { glow: 'rgba(236,72,153,0.45)', badge: '#be185d', border: '#ec4899', bg: 'rgba(236,72,153,0.07)' },
  { glow: 'rgba(234,179,8,0.45)',  badge: '#a16207', border: '#eab308', bg: 'rgba(234,179,8,0.07)'  },
  { glow: 'rgba(239,68,68,0.45)',  badge: '#b91c1c', border: '#ef4444', bg: 'rgba(239,68,68,0.07)'  },
];

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ allUsers, onSelectBranch }: {
  allUsers: AuthService.UserDTO[];
  onSelectBranch: (b: typeof BRANCHES[0]) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,    label: t('Total System Users'), value: allUsers.length.toString(),      sub: t('Across all branches'), color: 'text-blue-600',    bg: 'bg-blue-50' },
          { icon: Building, label: t('Active Branches'),    value: '8 / 8',   sub: t('All online'),           color: 'text-green-600',   bg: 'bg-green-50' },
          { icon: Server,   label: t('System Uptime'),      value: '99.9%',   sub: t('Last 45 days'),         color: 'text-purple-600',  bg: 'bg-purple-50' },
          { icon: Database, label: t('Daily Backup'),       value: 'Success', sub: t('Today 02:00 AM'),       color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Glowing Branch Tiles */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Live Branch Network — Click to Manage</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {BRANCHES.map((branch, idx) => {
            const g = BRANCH_GLOWS[idx % BRANCH_GLOWS.length];
            const count = allUsers.filter(u => u.branchId === branch.id && u.role !== 'SYSTEM_ADMIN' && u.role !== 'GENERAL_MANAGER').length;
            return (
              <button key={branch.id} onClick={() => onSelectBranch(branch)}
                style={{
                  background: g.bg,
                  border: `1.5px solid ${g.border}`,
                  boxShadow: `0 0 18px ${g.glow}, 0 4px 20px rgba(0,0,0,0.06)`,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${g.glow}, 0 8px 32px rgba(0,0,0,0.12)`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${g.glow}, 0 4px 20px rgba(0,0,0,0.06)`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
                className="rounded-2xl p-5 text-left cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: g.badge }}>B{branch.id}</div>
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: g.badge }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: g.badge }} /> {t('Online')}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-0.5">{t(branch.name)}</p>
                <p className="text-xs text-slate-400 mb-3">{t(branch.location)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-white/70 text-slate-600">
                    {count} {count === 1 ? t('user') : t('users')}
                  </span>
                  <ChevronRight size={14} style={{ color: g.badge }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Clock size={16} className="text-orange-500" /> {t('System Activity Log')}</h3>
        <div className="space-y-2">
          {[
            { time: '09:12 AM', msg: 'teller_hkw processed deposit — Rs. 15,000',    type: 'INFO' },
            { time: '09:08 AM', msg: 'valuer_hkw issued Pawn Ticket #698601',         type: 'INFO' },
            { time: '09:01 AM', msg: 'gm_perera approved loan for K.D. Perera',       type: 'SUCCESS' },
            { time: '08:45 AM', msg: 'mgr_dod logged in from Dodanduwa Branch',       type: 'INFO' },
            { time: '08:30 AM', msg: 'All 8 branches online — system healthy',        type: 'SUCCESS' },
            { time: '02:00 AM', msg: 'Automated daily backup completed successfully', type: 'SUCCESS' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-3 text-xs border-b border-slate-50 py-2 last:border-0">
              <span className="text-slate-400 w-16 shrink-0">{l.time}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${l.type === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{l.type}</span>
              <span className="text-slate-600">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Branch Detail (Users + Settings inside a branch) ──────────────────────────
function BranchDetail({ branch, allUsers, onRefresh, onBack }: {
  branch: typeof BRANCHES[0];
  allUsers: AuthService.UserDTO[];
  onRefresh: () => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [innerTab, setInnerTab] = useState('users');
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthService.UserDTO | null>(null);
  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'TELLER' });
  const [error, setError] = useState('');
  const [savingsTypes, setSavingsTypes] = useState<AccountService.SavingsAccountType[]>([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newType, setNewType] = useState({ code: '', nameEn: '', nameSi: '', isChildAccount: false });

  const fetchSavingsTypes = async () => {
    try {
      const types = await AccountService.getSavingsAccountTypes();
      setSavingsTypes(types);
    } catch (err) {
      console.error("Failed to load savings types");
    }
  };

  useEffect(() => {
    fetchSavingsTypes();
  }, []);

  const handleAddSavingsType = async () => {
    if (newType.code && newType.nameEn && newType.nameSi) {
      try {
        await AccountService.createSavingsAccountType(newType as any);
        setNewType({ code: '', nameEn: '', nameSi: '', isChildAccount: false });
        setShowTypeForm(false);
        fetchSavingsTypes();
      } catch (err) {
        alert("Failed to add account type. Ensure code is unique.");
      }
    }
  };

  const handleDeleteSavingsType = async (id: number) => {
    if (confirm("Are you sure you want to delete this account type?")) {
      try {
        await AccountService.deleteSavingsAccountType(id);
        fetchSavingsTypes();
      } catch (err) {
        alert("Failed to delete account type.");
      }
    }
  };

  const branchUsers = allUsers.filter(u => u.branchId === branch.id && u.role !== 'SYSTEM_ADMIN' && u.role !== 'GENERAL_MANAGER');

  const startEdit = (u: AuthService.UserDTO) => {
    setEditingUser(u);
    setForm({ username: u.username, fullName: u.fullName, password: '', role: u.role });
    setShowPassword(false);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.username || !form.fullName) return;
    try {
      setError('');
      if (editingUser) {
        await AuthService.updateUser(editingUser.userId!, {
          username: form.username,
          fullName: form.fullName,
          password: form.password || undefined,
          role: form.role,
          branchId: branch.id,
          status: editingUser.status
        });
      } else {
        if (!form.password) { setError('Password is required'); return; }
        await AuthService.createUser({
          username: form.username,
          fullName: form.fullName,
          password: form.password,
          role: form.role,
          branchId: branch.id,
          status: 'ACTIVE'
        });
      }
      setForm({ username: '', fullName: '', password: '', role: 'TELLER' });
      setEditingUser(null);
      setShowPassword(false);
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data || 'Operation failed');
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await AuthService.deleteUser(userId);
        onRefresh();
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition">
          <ArrowLeft size={14} /> Overview
        </button>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-semibold text-slate-800">{branch.name}</span>
      </div>

      {/* Branch Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-bold text-xl">B{branch.id}</div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{branch.name}</h2>
            <p className="text-sm text-slate-400">{branch.location} · {branchUsers.length} staff accounts</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
        </span>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-4">
        {([
          ['users', Users, 'Staff & Users'], 
          ['rates', Percent, 'Interest Rates'],
          ['account_types', PiggyBank, 'Account Types'],
          ['config', Settings, 'Branch Config']
        ] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setInnerTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${innerTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {innerTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition">
              <Plus size={16} /> Add User
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-lg w-full transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Key className="text-slate-700" size={20} /> 
                    {editingUser ? 'Edit User Profile' : `New User — ${branch.name}`}
                  </h4>
                  <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition">
                    <X size={18} />
                  </button>
                </div>
                {error && <div className="text-red-600 text-xs mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 font-semibold flex items-center gap-2">⚠️ {error}</div>}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="e.g. D.P. Perera" className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Username</label>
                    <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      disabled={!!editingUser}
                      placeholder="e.g. teller_hkw" className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition disabled:bg-slate-50 disabled:text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      {editingUser ? 'New Password (leave blank to keep)' : 'Temporary Password'}
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={form.password} 
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder={editingUser ? "Leave empty to keep existing" : "Set password"} 
                        className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition">
                      {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                  <button onClick={handleSubmit} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm transition">
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {branchUsers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No staff accounts yet.</p>
                <p className="text-sm mt-1">Click "Add User" to create the first account for this branch.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Full Name', 'Username', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchUsers.map(u => (
                    <tr key={u.userId || u.username} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${ROLE_AVATARS[u.role] || 'bg-slate-200 text-slate-600'}`}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition">
                            <Edit size={12} className="text-slate-500" /> Edit
                          </button>
                          <button onClick={() => handleDelete(u.userId!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-lg transition">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Rates Tab ── */}
      {innerTab === 'rates' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Percent size={16} /> Branch Interest & Loan Rates</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'FD Interest Rate (%)',     value: 8.0 },
                { label: 'FD Bonus Rate (%)',         value: 2.5 },
                { label: 'Pawning Rate (% p.a.)',     value: 13 },
                { label: 'Max Loan Term (Months)',    value: 60 },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                  <input type="number" defaultValue={f.value} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
              <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition">
                <Save size={16} /> Save Rates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Account Types Tab ── */}
      {innerTab === 'account_types' && (
        <div className="space-y-5 max-w-4xl">
          {showTypeForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-md w-full">
                <h4 className="font-bold text-slate-800 mb-4">Add Savings Type</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Code</label>
                    <input value={newType.code} onChange={e => setNewType(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Account Target</label>
                    <select value={newType.isChildAccount ? 'child' : 'adult'} onChange={e => setNewType(p => ({ ...p, isChildAccount: e.target.value === 'child' }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">English Name</label>
                      <input value={newType.nameEn} onChange={e => setNewType(p => ({ ...p, nameEn: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Sinhala Name</label>
                      <input value={newType.nameSi} onChange={e => setNewType(p => ({ ...p, nameSi: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowTypeForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                  <button onClick={handleAddSavingsType} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold">Save</button>
                </div>
              </div>
            </div>
          )}
          {/* Savings Account Types Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Database size={16} /> Manage Savings Account Types</h3>
              <button 
                onClick={() => setShowTypeForm(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2">
                <Plus size={14} /> Add Type
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                    <tr><th className="px-4 py-2.5">Code</th><th className="px-4 py-2.5">Target</th><th className="px-4 py-2.5">English</th><th className="px-4 py-2.5">Sinhala</th><th className="px-4 py-2.5 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {savingsTypes.map(st => (
                      <tr key={st.id}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{st.code}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${st.isChildAccount ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {st.isChildAccount ? 'Child' : 'Adult'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{st.nameEn}</td>
                        <td className="px-4 py-3 text-slate-600">{st.nameSi}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteSavingsType(st.id!)} className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Branch Config Tab ── */}
      {innerTab === 'config' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Building size={16} /> Branch Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Branch Name', value: branch.name }, { label: 'Location', value: branch.location }].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                  <input defaultValue={f.value} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={16} /> Branch Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Mark branch as Active / Inactive</p>
                <p className="text-xs text-slate-400 mt-0.5">Inactive branches cannot process transactions.</p>
              </div>
              <select defaultValue="ACTIVE" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition">
              <Save size={16} /> Save Config
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SystemAdminDashboard() {
  const navigate  = useNavigate();
  const user      = AuthService.getCurrentUser();
  const { t, language, setLanguage } = useLanguage();
  const [allUsers, setAllUsers] = useState<AuthService.UserDTO[]>([]);
  const [activeBranch, setActiveBranch] = useState<typeof BRANCHES[0] | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await AuthService.getUsers();
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchUsers();
    }
  }, [user]);

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <img src={logo} alt="HMCS" className="w-8 h-8 rounded-lg object-cover mr-3 border border-white/20" />
          <div>
            <p className="font-bold text-white text-sm">{t('HMCS Bank')}</p>
            <p className="text-white/50 text-xs">{t('System Administration')}</p>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-white/10">
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user.username}</p>
              <p className="text-white/50 text-xs flex items-center gap-1"><Shield size={10} /> System Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => setActiveBranch(null)}
            className={`flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${!activeBranch ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
            <LayoutDashboard size={18} className="mr-3" />Overview
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => { AuthService.logout(); navigate('/login'); }}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition">
            <LogOut size={16} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{t('System Administration Panel')}</h1>
            <p className="text-xs text-slate-400">{t('HMCS Integrated Banking System · All 8 Branches')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-bold rounded-md transition ${language === 'en' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <button onClick={() => setLanguage('si')} className={`px-3 py-1 text-sm font-bold rounded-md transition ${language === 'si' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>සිංහල</button>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('8 / 8 Branches Online')}
            </span>
          </div>
        </header>

        <div className="p-8">
          {!activeBranch ? (
            <OverviewTab allUsers={allUsers} onSelectBranch={setActiveBranch} />
          ) : (
            <BranchDetail branch={activeBranch} allUsers={allUsers} onRefresh={fetchUsers} onBack={() => setActiveBranch(null)} />
          )}
        </div>
      </main>
    </div>
  );
}
