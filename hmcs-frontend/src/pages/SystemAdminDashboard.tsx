import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Building, Plus, Edit, Trash2,
  CheckCircle, Server, Database, Clock, Shield, Key, Users, UserMinus,
  Settings, ChevronRight, ChevronDown, ChevronUp, Save, ArrowLeft, X, Eye, EyeOff, Percent, PiggyBank,
  Lock, Briefcase, Scale, AlertTriangle, FileText, Banknote, ClipboardList
} from 'lucide-react';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import * as LoanService from '../services/loan.service';
import * as BranchService from '../services/branch.service';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.jpg';



// ROLES will be fetched from backend dynamically


const ROLE_COLORS: Record<string, string> = {
  GENERAL_MANAGER:      'bg-purple-100 text-purple-700 border border-purple-200',
  BRANCH_MANAGER:       'bg-blue-100 text-blue-700 border border-blue-200',
  BANK_SERVICE_MANAGER: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  LOAN_COMMITTEE:       'bg-amber-100 text-amber-700 border border-amber-200',
  FIELD_OFFICER:        'bg-green-100 text-green-700 border border-green-200',
  TELLER:               'bg-red-100 text-red-700 border border-red-200',
  VALUER:               'bg-yellow-100 text-yellow-700 border border-yellow-200',
  ORGANIZATION_ADMIN:         'bg-slate-100 text-slate-700 border border-slate-200',
};

const ROLE_AVATARS: Record<string, string> = {
  GENERAL_MANAGER:      'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white',
  BRANCH_MANAGER:       'bg-gradient-to-tr from-blue-500 to-cyan-500 text-white',
  BANK_SERVICE_MANAGER: 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white',
  LOAN_COMMITTEE:       'bg-gradient-to-tr from-amber-500 to-orange-500 text-white',
  FIELD_OFFICER:        'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white',
  TELLER:               'bg-gradient-to-tr from-rose-500 to-orange-500 text-white',
  VALUER:               'bg-gradient-to-tr from-yellow-500 to-amber-500 text-white',
  ORGANIZATION_ADMIN:         'bg-gradient-to-tr from-slate-600 to-slate-800 text-white',
};

const DEMO_USERS = [
  { id: 1, username: 'admin',       fullName: 'System Administrator', role: 'ORGANIZATION_ADMIN',      branchId: 1, status: 'ACTIVE' },
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

import axios from 'axios';

// ── Tenant Insights View ────────────────────────────────────────────────────────
function TenantInsightsView({ tenantId, tenantName, onBack }: { tenantId: number, tenantName: string, onBack: () => void }) {
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ fullName: '', username: '', password: '', role: '', branchId: '' });
  const [editUserForm, setEditUserForm] = useState({ fullName: '', username: '', role: '', status: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, [tenantId]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const fetchedBranches = await BranchService.getBranches(tenantId);
      const fetchedUsers = await AuthService.getUsers(tenantId);
      const fetchedRoles = await AuthService.getRoles();
      setBranches(fetchedBranches);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await AuthService.createUser({
        fullName: userForm.fullName,
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        branchId: parseInt(userForm.branchId, 10),
        status: 'ACTIVE'
      }, tenantId);
      setShowAddUser(false);
      setUserForm({ fullName: '', username: '', password: '', role: '', branchId: '' });
      fetchInsights();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to add user');
    }
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditUserForm({
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      status: user.status,
      password: ''
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await AuthService.updateUser(selectedUser.userId, {
        ...selectedUser,
        fullName: editUserForm.fullName,
        username: editUserForm.username,
        role: editUserForm.role,
        status: editUserForm.status,
        password: editUserForm.password,
      }, tenantId);
      setShowEditUser(false);
      fetchInsights();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await AuthService.deleteUser(selectedUser.userId, tenantId);
      setShowEditUser(false);
      fetchInsights();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to delete user');
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">{tenantName} - Insights</h2>
          <p className="text-slate-500 text-sm">View branches and users for this organization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Branches */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building size={18} className="text-indigo-600" />
            Branches
          </h3>
          {loading ? <p className="text-slate-500 text-sm">Loading branches...</p> : (
            <div className="space-y-3">
              {branches.length === 0 && <p className="text-slate-400 text-sm italic">No branches found.</p>}
              {branches.map(b => (
                <div key={b.branchId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{b.branchName}</p>
                    <p className="text-xs text-slate-500">{b.location}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${b.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              Users
            </h3>
            <button onClick={() => setShowAddUser(true)} className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition">
              <Plus size={14} /> Add User
            </button>
          </div>
          {loading ? <p className="text-slate-500 text-sm">Loading users...</p> : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.filter(u => ['LOAN_COMMITTEE', 'ORGANIZATION_ADMIN'].includes(u.role)).length === 0 && <p className="text-slate-400 text-sm italic">No users found.</p>}
              {users.filter(u => ['LOAN_COMMITTEE', 'ORGANIZATION_ADMIN'].includes(u.role)).map(u => (
                <div key={u.userId} onClick={() => handleEditClick(u)} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-blue-300 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${ROLE_AVATARS[u.role] || 'bg-slate-200 text-slate-600'}`}>
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{u.fullName}</p>
                      <p className="text-xs font-mono text-slate-400">{u.username}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                      {branches.find(b => b.branchId === u.branchId)?.branchName || 'Head Office'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Add User to {tenantName}</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Full Name</label>
                <input type="text" value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Username</label>
                  <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Password</label>
                  <div className="relative">
                    <input type={showAddPassword ? "text" : "password"} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
                    <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {showAddPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="">Select Role</option>
                    {roles.filter(r => ['LOAN_COMMITTEE', 'ORGANIZATION_ADMIN'].includes(r.roleName)).map(r => (
                      <option key={r.roleId} value={r.roleName}>{r.roleName.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl transition hover:bg-blue-700">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit size={18} className="text-blue-600" />
                Edit User
              </h3>
              <button onClick={() => setShowEditUser(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Full Name</label>
                <input type="text" value={editUserForm.fullName} onChange={e => setEditUserForm({...editUserForm, fullName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Username</label>
                  <input type="text" value={editUserForm.username} onChange={e => setEditUserForm({...editUserForm, username: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50" readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">New Password</label>
                  <div className="relative">
                    <input type={showEditPassword ? "text" : "password"} value={editUserForm.password} onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} placeholder="Leave blank to keep current" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
                    <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Status</label>
                  <select value={editUserForm.status} onChange={e => setEditUserForm({...editUserForm, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Role</label>
                  <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm, role: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white" required>
                    {roles.filter(r => ['LOAN_COMMITTEE', 'ORGANIZATION_ADMIN'].includes(r.roleName)).map(r => (
                      <option key={r.roleId} value={r.roleName}>{r.roleName.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button type="button" onClick={handleDeleteUser} className="px-3 py-2 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition flex items-center gap-1">
                  <Trash2 size={16} /> Delete
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEditUser(false)} className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl transition hover:bg-blue-700">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tenants Tab ──────────────────────────────────────────────────────────────
function TenantsTab() {
  const { t } = useLanguage();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewTenantId, setViewTenantId] = useState<number | null>(null);
  const [viewTenantName, setViewTenantName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', subdomain: '', branchName: '', adminUsername: '', adminPassword: '' });
  const [error, setError] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const headers = user?.token ? { Authorization: 'Bearer ' + user.token } : {};
      const res = await axios.get('http://localhost:8080/api/v1/auth/organizations', { headers });
      setTenants(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subdomain || !form.branchName || !form.adminUsername || !form.adminPassword) return;
    try {
      setError('');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const headers = user?.token ? { Authorization: 'Bearer ' + user.token } : {};
      
      await axios.post('http://localhost:8080/api/v1/auth/organizations', form, { headers });
      setForm({ name: '', subdomain: '', branchName: '', adminUsername: '', adminPassword: '' });
      setShowAdd(false);
      fetchTenants();
    } catch (err: any) {
      const errMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : (err.response?.data?.message || 'Failed to create organization. Username might already exist.');
      setError(errMsg);
    }
  };



  const toggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await AuthService.updateOrganizationStatus(id, newStatus);
      fetchTenants();
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  if (viewTenantId) {
    return <TenantInsightsView tenantId={viewTenantId} tenantName={viewTenantName} onBack={() => setViewTenantId(null)} />;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Organizations (SaaS Tenants)</h2>
          <p className="text-slate-500 text-sm">Manage all registered banking societies on the platform.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition">
          <Plus size={18} /> Add Organization
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">නව සමිතියක් ලියාපදිංචි කරන්න (Register New Organization)</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">සමුපකාර සමිතියේ නම</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="උදා: පොළොන්නරුව සමුපකාර බැංකුව" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">උප වසම් කේතය (Subdomain)</label>
                  <input type="text" value={form.subdomain} onChange={e => setForm({...form, subdomain: e.target.value.toLowerCase()})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. polonnaruwa" required pattern="^[a-z0-9-]+$" title="Lowercase letters, numbers, hyphens" />
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-3">මූලික සැකසුම් (Admin & Branch)</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">ප්‍රධාන ශාඛාවේ නම</label>
                    <input type="text" value={form.branchName} onChange={e => setForm({...form, branchName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="උදා: පොළොන්නරුව ප්‍රධාන ශාඛාව" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">පරිපාලකගේ පරිශීලක නාමය (Username)</label>
                    <input type="text" value={form.adminUsername} onChange={e => setForm({...form, adminUsername: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="උදා: admin_polo" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">පරිපාලකගේ මුරපදය (Password)</label>
                    <input type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" required />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition">අවලංගු කරන්න</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl transition hover:bg-indigo-700">නව සමිතිය නිර්මාණය කරන්න</button>
              </div>
            </form>
          </div>
        </div>
      )}



      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Organization Name</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Subdomain</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading tenants...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No organizations found.</td></tr>
            ) : (
              tenants.map(t => (
                <tr key={t.organizationId} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-semibold text-slate-400">#{t.organizationId}</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{t.name}</td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-semibold">{t.subdomain}.cooperation.com</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex gap-2">
                    <button onClick={() => toggleStatus(t.organizationId, t.status)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${t.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                      {t.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => { setViewTenantId(t.organizationId); setViewTenantName(t.name); }} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition flex items-center gap-1">
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ allUsers, onSelectBranch, branches, onAddBranch, activities, user }: {
  allUsers: AuthService.UserDTO[];
  onSelectBranch: (b: BranchService.BranchDTO) => void;
  branches: BranchService.BranchDTO[];
  onAddBranch: () => void;
  activities: any[];
  user: any;
}) {
  const { t } = useLanguage();
  const [schedulerStatus, setSchedulerStatus] = useState<Record<string, AccountService.SchedulerLog> | null>(null);

  useEffect(() => {
    if (user?.tenantId !== 0) {
      AccountService.getSchedulerStatus()
        .then(res => {
          if (res.data) setSchedulerStatus(res.data);
        })
        .catch(err => console.error("Failed to fetch scheduler status", err));
    }
  }, [user]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  return (
    <div className="space-y-8">
      <div className={`grid grid-cols-2 ${user?.tenantId !== 0 ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-4`}>
        {[
          { icon: Users,    label: t('Total System Users'), value: allUsers.length.toString(),      sub: t('Across all branches'), color: 'text-blue-600',    bg: 'bg-blue-50' },
          { icon: Building, label: t('Active Branches'),    value: `${branches.filter(b => b.status === 'ACTIVE').length} / ${branches.length}`,   sub: t('All online'),           color: 'text-green-600',   bg: 'bg-green-50' },
          { icon: Server,   label: t('System Uptime'),      value: '99.9%',   sub: t('Last 45 days'),         color: 'text-purple-600',  bg: 'bg-purple-50' },
          { icon: Database, label: t('Daily Backup'),       value: 'Success', sub: t('Today 02:00 AM'),       color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ...(user?.tenantId !== 0 ? [{ 
            icon: Clock, 
            label: 'Savings EOD', 
            value: schedulerStatus?.['EOD_SAVINGS'] ? schedulerStatus['EOD_SAVINGS'].status : 'Pending', 
            sub: schedulerStatus?.['EOD_SAVINGS'] ? (
              <span className="flex flex-col gap-0.5 mt-1">
                <span><span className="font-semibold text-slate-500">Last:</span> {formatDateTime(schedulerStatus['EOD_SAVINGS'].executionTime)}</span>
                <span><span className="font-semibold text-slate-500">Next:</span> Today 11:59 PM</span>
              </span>
            ) : 'Next: Today 11:59 PM', 
            color: schedulerStatus?.['EOD_SAVINGS']?.status === 'SUCCESS' ? 'text-green-600' : 'text-orange-600', 
            bg: schedulerStatus?.['EOD_SAVINGS']?.status === 'SUCCESS' ? 'bg-green-50' : 'bg-orange-50' 
          }, { 
            icon: Clock, 
            label: 'Fixed Deposit EOD', 
            value: schedulerStatus?.['EOD_FD'] ? schedulerStatus['EOD_FD'].status : 'Pending', 
            sub: schedulerStatus?.['EOD_FD'] ? (
              <span className="flex flex-col gap-0.5 mt-1">
                <span><span className="font-semibold text-slate-500">Last:</span> {formatDateTime(schedulerStatus['EOD_FD'].executionTime)}</span>
                <span><span className="font-semibold text-slate-500">Next:</span> Today 11:59 PM</span>
              </span>
            ) : 'Next: Today 11:59 PM', 
            color: schedulerStatus?.['EOD_FD']?.status === 'SUCCESS' ? 'text-green-600' : 'text-orange-600', 
            bg: schedulerStatus?.['EOD_FD']?.status === 'SUCCESS' ? 'bg-green-50' : 'bg-orange-50' 
          }] : []),
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Glowing Branch Tiles */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Live Branch Network - Click to Manage</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {branches.map((branch, idx) => {
            const g = BRANCH_GLOWS[idx % BRANCH_GLOWS.length];
            const count = allUsers.filter(u => u.branchId === branch.branchId && u.role !== 'ORGANIZATION_ADMIN' && u.role !== 'GENERAL_MANAGER').length;
            return (
              <button key={branch.branchId} onClick={() => onSelectBranch(branch)}
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
                    style={{ background: g.badge }}>B{branch.branchId}</div>
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: g.badge }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: g.badge }} /> {t('Online')}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-0.5">{t(branch.branchName)}</p>
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
          <button onClick={onAddBranch}
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: `1.5px dashed #cbd5e1`,
              boxShadow: `0 0 18px rgba(148, 163, 184, 0.2), 0 4px 20px rgba(0,0,0,0.04)`,
              transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px rgba(148, 163, 184, 0.4), 0 8px 32px rgba(0,0,0,0.08)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
              (e.currentTarget as HTMLElement).style.borderColor = '#94a3b8';
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px rgba(148, 163, 184, 0.2), 0 4px 20px rgba(0,0,0,0.04)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
            }}
            className="rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:text-slate-700 flex items-center justify-center mb-3 transition-colors">
              <Plus size={24} />
            </div>
            <p className="font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">{t('Add Branch')}</p>
          </button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Clock size={16} className="text-orange-500" /> {t('System Activity Log')}</h3>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">No recent activities found</div>
          ) : activities.slice(0, 10).map((act, i) => {
            const time = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let typeLabel = 'INFO';
            let msg = `${act.type} `;
            if (act.type === 'DEPOSIT') { msg = `Deposit processed — Rs. ${act.amount}`; typeLabel = 'SUCCESS'; }
            if (act.type === 'WITHDRAWAL') { msg = `Withdrawal processed — Rs. ${act.amount}`; typeLabel = 'INFO'; }
            if (act.type === 'NEW_SAVINGS') { msg = `New savings account opened (${act.reference})`; typeLabel = 'SUCCESS'; }
            if (act.type === 'NEW_FD') { msg = `New fixed deposit opened (${act.reference})`; typeLabel = 'SUCCESS'; }
            if (act.type === 'PAWN_TICKET') { msg = `Pawn ticket issued (${act.reference})`; typeLabel = 'INFO'; }
            if (act.type === 'LOAN_APPROVAL') { msg = `Loan approved (${act.reference})`; typeLabel = 'SUCCESS'; }

            return (
              <div key={i} className="flex items-center gap-3 text-xs border-b border-slate-50 py-2 last:border-0">
                <span className="text-slate-400 w-16 shrink-0">{time}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${typeLabel === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{typeLabel}</span>
                <span className="text-slate-600">{msg}</span>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}

// ── Branch Detail (Users + Settings inside a branch) ──────────────────────────
function BranchDetail({ branch, allUsers, onRefresh, onBack, innerTab, navigate }: {
  branch: BranchService.BranchDTO;
  allUsers: AuthService.UserDTO[];
  onRefresh: () => void;
  onBack: () => void;
  innerTab: string;
  navigate: any;
}) {
  const { t, language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthService.UserDTO | null>(null);
  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'TELLER' });
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [config, setConfig] = useState({ name: branch.branchName, location: branch.location || '', status: branch.status });
  const [savingConfig, setSavingConfig] = useState(false);

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await BranchService.updateBranch(branch.branchId!, {
        branchName: config.name,
        location: config.location,
        status: config.status
      });
      onRefresh(); // Refresh branches to get updated info
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    AuthService.getRoles()
      .then(data => setRoles(data.map(r => r.roleName)))
      .catch(() => setRoles(['GENERAL_MANAGER','BRANCH_MANAGER','BANK_SERVICE_MANAGER','LOAN_COMMITTEE','FIELD_OFFICER','TELLER','VALUER','SENIOR_OFFICER']));
  }, []);

  const branchUsers = allUsers.filter(u => u.branchId === branch.branchId && u.role !== 'ORGANIZATION_ADMIN' && u.role !== 'GENERAL_MANAGER');

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
          branchId: branch.branchId,
          status: editingUser.status
        });
      } else {
        if (!form.password) { setError('Password is required'); return; }
        await AuthService.createUser({
          username: form.username,
          fullName: form.fullName,
          password: form.password,
          role: form.role,
          branchId: branch.branchId,
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
        (window as any).showToast('Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition">
          <ArrowLeft size={14} /> {t('Overview')}
        </button>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-semibold text-slate-800">{t(branch.branchName)}</span>
      </div>

      {/* Branch Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-bold text-xl">B{branch.branchId}</div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t(branch.branchName)}</h2>
            <p className="text-sm text-slate-400">{t(branch.location)} · {branchUsers.length} {t('staff accounts')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/branch/${branch.branchId}`)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm">
            <Eye size={16} /> {t('Enter Branch Dashboard')}
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('Active')}
          </span>
        </div>
      </div>



      {/* ── Users Tab ── */}
      {innerTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition">
              <Plus size={16} /> {t('Add User')}
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-lg w-full transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Key className="text-slate-700" size={20} /> 
                    {editingUser ? t('Edit User Profile') : `${t('New User —')} ${t(branch.branchName)}`}
                  </h4>
                  <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition">
                    <X size={18} />
                  </button>
                </div>
                {error && <div className="text-red-600 text-xs mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 font-semibold flex items-center gap-2">⚠️ {error}</div>}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Full Name')}</label>
                    <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="e.g. D.P. Perera" className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Username')}</label>
                    <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      disabled={!!editingUser}
                      placeholder="e.g. teller_hkw" className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition disabled:bg-slate-50 disabled:text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      {editingUser ? t('New Password (leave blank to keep)') : t('Temporary Password')}
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={form.password} 
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder={editingUser ? t('Leave empty to keep existing') : t('Set password')} 
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Role')}</label>
                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition">
                      {roles.length === 0 ? (
                        <option disabled>Loading roles...</option>
                      ) : roles.filter(r => !['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'GENERAL_MANAGER', 'BANK_SERVICE_MANAGER', 'LOAN_COMMITTEE'].includes(r)).map(r => {
                        let label = r.replace(/_/g, ' ');
                        if (r === 'BRANCH_MANAGER') label = 'BRANCH MANAGER (ශාඛා කළමනාකරු)';
                        if (r === 'SENIOR_OFFICER') label = 'SENIOR OFFICER (ලිපිකරු)';
                        return <option key={r} value={r}>{label}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">{t('Cancel')}</button>
                  <button onClick={handleSubmit} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm transition">
                    {editingUser ? t('Save Changes') : t('Create User')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {branchUsers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('No staff accounts yet.')}</p>
                <p className="text-sm mt-1">{t('Click "Add User" to create the first account for this branch.')}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Full Name', 'Username', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t(h)}</th>
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
                          {t(u.role.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase()))))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {t('Active')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(u)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition">
                            <Edit size={12} className="text-slate-500" /> {t('Edit')}
                          </button>
                          <button onClick={() => handleDelete(u.userId!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-lg transition">
                            <Trash2 size={12} /> {t('Delete')}
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

      {/* ── Branch Config Tab ── */}
      {innerTab === 'config' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Building size={16} /> {t('Branch Information')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Branch Name')}</label>
                <input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Location')}</label>
                <input value={config.location} onChange={e => setConfig({...config, location: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={16} /> {t('Branch Status')}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{t('Mark branch as Active / Inactive')}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('Inactive branches cannot process transactions.')}</p>
              </div>
              <select value={config.status} onChange={e => setConfig({...config, status: e.target.value})} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="ACTIVE">{t('Active')}</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveConfig} disabled={savingConfig} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition">
              <Save size={16} /> {savingConfig ? t('Saving...') : t('Save Config')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


import GlobalSettings from '../components/GlobalSettings';
import BranchDashboard from './BranchDashboard';

export default function SystemAdminDashboard() {
  const [mainTab, setMainTab] = useState<'overview' | 'rates' | 'account_types' | 'settings' | 'tenants'>(
    () => {
      const saved = sessionStorage.getItem('sa_mainTab');
      if (saved) return saved as any;
      const u = AuthService.getCurrentUser();
      return (u && u.tenantId === 0) ? 'tenants' : 'overview';
    }
  );
  const navigate  = useNavigate();
  const user      = AuthService.getCurrentUser();
  const { t, language, setLanguage } = useLanguage();
  const [allUsers, setAllUsers] = useState<AuthService.UserDTO[]>([]);
  const [branches, setBranches] = useState<BranchService.BranchDTO[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [addBranchForm, setAddBranchForm] = useState({ branchName: '', location: '', status: 'ACTIVE' });
  const [addingBranch, setAddingBranch] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  const handleCreateBranch = async () => {
    if(!addBranchForm.branchName) return;
    try {
      setAddingBranch(true);
      await BranchService.createBranch(addBranchForm);
      setShowAddBranch(false);
      setAddBranchForm({ branchName: '', location: '', status: 'ACTIVE' });
      fetchBranches();
    } catch(e) {
      console.error(e);
    } finally {
      setAddingBranch(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await BranchService.getBranches();
      const mapped = data.map(b => ({
        ...b,
        id: b.branchId!,
        name: b.branchName
      }));
      setBranches(mapped);
    } catch (e) {
      console.error('Failed to fetch branches', e);
    }
  };

  useEffect(() => {
    if (user && user.tenantId !== 0) {
      fetchBranches();
      AccountService.getBranchActivities().then(setActivities).catch(console.error);
    }
  }, [user?.token]);
  const [activeBranch, setActiveBranch] = useState<BranchService.BranchDTO | null>(() => {
    const saved = sessionStorage.getItem('sa_activeBranch');
    if (saved) {
      const parsed = JSON.parse(saved);
      localStorage.setItem('overrideBranchId', parsed.id.toString());
      return parsed;
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('sa_activeTab') || 'users');

  useEffect(() => { sessionStorage.setItem('sa_mainTab', mainTab); }, [mainTab]);
  useEffect(() => { sessionStorage.setItem('sa_activeTab', activeTab); }, [activeTab]);

  const handleSelectBranch = (branch: BranchService.BranchDTO) => {
    sessionStorage.setItem('sa_activeBranch', JSON.stringify(branch));
    localStorage.setItem('overrideBranchId', branch.branchId.toString());
    setActiveBranch(branch);
    setActiveTab('users');
  };

  const handleClearBranch = () => {
    sessionStorage.removeItem('sa_activeBranch');
    localStorage.removeItem('overrideBranchId');
    setActiveBranch(null);
  };

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
      if (user.tenantId === 0) {
        // SaaS Platform Admin should not be trapped in a society's branch view
        sessionStorage.removeItem('sa_activeBranch');
        localStorage.removeItem('overrideBranchId');
        setActiveBranch(null);
        setMainTab('tenants');
      } else {
        fetchUsers();
      }
    }
  }, [user?.token]);

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col fixed h-full z-10 border-r border-slate-800">
        <div className="h-20 flex items-center px-6">
          <img src={logo} alt="HMCS" className="w-8 h-8 rounded-lg object-cover mr-3 shadow-sm ring-1 ring-white/10" />
          <div>
            <p className="font-bold text-white text-sm tracking-wide">{user?.tenantId === 0 ? t('HMCS SaaS Platform') : (user?.organizationName || t('HMCS Bank'))}</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">{user?.tenantId === 0 ? t('Global Administration') : t('System Administration')}</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col px-3 py-3 space-y-1 overflow-hidden">
          {/* Main System Tabs */}
          {!activeBranch && (
            <div className="space-y-1">
              {user.tenantId === 0 ? (
                // Platform Admin Tabs (Tenant 0)
                <button onClick={() => { handleClearBranch(); setMainTab('tenants'); }}
                  className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'tenants' ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                  <Building size={18} className="mr-3" />{t('Organizations (SaaS)')}
                </button>
              ) : (
                // Society Admin Tabs (e.g. Tenant 1)
                <>
                  <button onClick={() => { setActiveBranch(null); setMainTab('overview'); }}
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'overview' && !activeBranch ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <LayoutDashboard size={18} className="mr-3" />{t('Overview')}
                  </button>
                  <button onClick={() => { handleClearBranch(); setMainTab('rates'); }}
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'rates' ? 'bg-emerald-600/10 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <Percent size={18} className="mr-3" />{t('Interest Rates')}
                  </button>
                  <button onClick={() => { handleClearBranch(); setMainTab('account_types'); }}
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'account_types' ? 'bg-amber-600/10 text-amber-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <PiggyBank size={18} className="mr-3" />{t('Account Types')}
                  </button>
                  <button onClick={() => { handleClearBranch(); setMainTab('settings'); }}
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${mainTab === 'settings' ? 'bg-slate-600/10 text-slate-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <Settings size={18} className="mr-3" />{t('Settings')}
                  </button>
                </>
              )}
            </div>
          )}
          
          {activeBranch && (
            <div className="mt-1 mb-1 flex flex-col flex-1 h-full overflow-hidden">
              <div className="px-3 mb-2 flex items-center gap-2 bg-slate-800/30 py-2 rounded-lg border border-slate-700/50 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse shrink-0"></div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider line-clamp-1">{t(activeBranch.branchName)}</p>
              </div>
              <div className="flex flex-col flex-1 px-1 gap-1 overflow-y-auto pb-2">
                {[
                  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { key: 'members', label: 'Members', icon: Users },
                  { key: 'non-members', label: 'Non-Members', icon: UserMinus },
                  { key: 'savings', label: 'Savings', icon: PiggyBank },
                  { key: 'fds', label: 'Fixed Deposits', icon: Lock },
                  { key: 'loans', label: 'Loans', icon: Briefcase },
                  { key: 'pawning', label: 'Pawning', icon: Scale },
                  { isSection: true, label: 'Daily Operations' },
                  { key: 'summary-ledger', label: 'Summary Ledger', icon: ClipboardList },
                  { key: 'vault-cash', label: 'Cash Balances', icon: Banknote },
                  { key: 'staff', label: 'Branch Staff', icon: Users },
                  { key: 'config', label: 'Branch Config', icon: Settings }
                ].map(item => (
                  item.isSection ? (
                    <p key={item.label} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2 mb-0.5 px-3 shrink-0">
                      {t(item.label)}
                    </p>
                  ) : (
                  <button key={item.key} onClick={() => setActiveTab(item.key!)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-[13px] font-semibold transition-all border shrink-0 ${
                      activeTab === item.key 
                        ? 'bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-sm' 
                        : 'bg-slate-800/20 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-600'
                    }`}>
                    <item.icon size={16} className={`mr-2.5 shrink-0 ${activeTab === item.key ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="flex-1 text-left tracking-wide line-clamp-1">{t(item.label)}</span>
                  </button>
                  )
                ))}
              </div>
              <div className="px-2 mt-3 pt-3 border-t border-slate-800/80 shrink-0">
                <button onClick={() => { handleClearBranch(); setMainTab('overview'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-[14px] font-bold transition shadow-sm border border-slate-700 group">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('Back')}
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4">
          <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-between group border border-slate-700/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-slate-200 text-sm font-semibold truncate leading-tight">{user.username}</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider truncate mt-0.5">
                  {user.tenantId === 0 ? t('SaaS Platform Admin') : t('Society Admin')}
                </p>
              </div>
            </div>
            <button onClick={() => { AuthService.logout(); navigate('/login'); }}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition" title={t('Sign Out')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{activeBranch ? t(activeBranch.branchName) : (user?.tenantId === 0 ? t('SaaS Administration Panel') : `${user?.organizationName || t('HMCS Bank')} - ${t('System Administration Panel')}`)}</h1>
            <p className="text-xs text-slate-400">
              {user?.tenantId === 0
                ? t('Managing All Organizations')
                : `${user?.organizationName || t('HMCS Bank')} · ${t('All')} ${branches.length} ${t('Branches')}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'en' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5"></div>
              <button onClick={() => setLanguage('si')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'si' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>සිංහල</button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5"></div>
              <button onClick={() => setLanguage('ta')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'ta' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>தமிழ்</button>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {`${branches.filter(b => b.status === 'ACTIVE').length} / ${branches.length} ${t('Branches')} Online`}
            </span>
            <button
              onClick={() => { AuthService.logout(); navigate('/login'); }}
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              title={t('Sign Out')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 px-8 pt-8 pb-6">
          {mainTab === 'tenants' && <TenantsTab />}
          {mainTab === 'rates' && <GlobalSettings currentTab='rates' />}
          {mainTab === 'account_types' && <GlobalSettings currentTab='account_types' />}
          {mainTab === 'settings' && <GlobalSettings currentTab='settings' />}
          {mainTab === 'overview' && (
            activeBranch ? (
              (activeTab === 'staff' || activeTab === 'config') ? (
                <BranchDetail branch={activeBranch} allUsers={allUsers} onRefresh={fetchUsers} onBack={() => handleClearBranch()} innerTab={activeTab === 'staff' ? 'users' : 'config'} navigate={navigate} />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <BranchDashboard key={activeBranch.branchId} overrideActiveTab={activeTab} hideSidebar={true} overrideRole="SENIOR_OFFICER" readOnly={true} />
                  </div>
                </div>
              )
            ) : (
              <OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} branches={branches} onAddBranch={() => setShowAddBranch(true)} activities={activities} user={user} />
            )
          )}
        </div>
      {showAddBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Building size={16} />
                </div>
                {t('Add New Branch')}
              </h3>
              <button onClick={() => setShowAddBranch(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Branch Name')}</label>
                <input type="text" value={addBranchForm.branchName} onChange={e => setAddBranchForm({ ...addBranchForm, branchName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" placeholder={t('e.g. Colombo Main Branch')} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Location')}</label>
                <input type="text" value={addBranchForm.location} onChange={e => setAddBranchForm({ ...addBranchForm, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" placeholder={t('e.g. Colombo 03')} />
              </div>
            </div>
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAddBranch(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors">
                {t('Cancel')}
              </button>
              <button onClick={handleCreateBranch} disabled={!addBranchForm.branchName || addingBranch}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2">
                {addingBranch ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                {t('Create Branch')}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
