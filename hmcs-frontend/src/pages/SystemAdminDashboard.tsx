import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Building, Plus, Edit, Trash2,
  CheckCircle, Server, Database, Clock, Shield, Key, Users,
  Settings, ChevronRight, ChevronDown, ChevronUp, Save, ArrowLeft, X, Eye, EyeOff, Percent, PiggyBank,
  Lock, Briefcase, Scale, AlertTriangle
} from 'lucide-react';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';
import * as LoanService from '../services/loan.service';
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

// ROLES will be fetched from backend dynamically


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
function BranchDetail({ branch, allUsers, onRefresh, onBack, innerTab }: {
  branch: typeof BRANCHES[0];
  allUsers: AuthService.UserDTO[];
  onRefresh: () => void;
  onBack: () => void;
  innerTab: string;
}) {
  const { t, language } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [rateCategory, setRateCategory] = useState<'savings'|'fd'|'loans'|'pawning'>('savings');
  const [accountCategory, setAccountCategory] = useState<'savings'|'fd'|'loans'|'pawning'>('savings');
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<string | number>(0);
  const [editRateValueMaturity, setEditRateValueMaturity] = useState<string | number>(0);
  const [editRateValueMonthly, setEditRateValueMonthly] = useState<string | number>(0);
  const [confirmRateChange, setConfirmRateChange] = useState<{ category: string, id: string, name: string, oldVal: number, newVal: number, unit: string } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    AuthService.getRoles()
      .then(data => setRoles(data.map(r => r.roleName)))
      .catch(() => setRoles(['GENERAL_MANAGER','BRANCH_MANAGER','BANK_SERVICE_MANAGER','LOAN_COMMITTEE','FIELD_OFFICER','TELLER','VALUER','SENIOR_OFFICER']));
  }, []);
  
  const [ratesData, setRatesData] = useState({
    fd: [
      { id: 'fd_3m', label: '3 Months', value: 7.0, unit: '%' },
      { id: 'fd_6m', label: '6 Months', value: 7.5, unit: '%' },
      { id: 'fd_1y', label: '1 Year', value: 8.0, unit: '%' },
      { id: 'fd_snr', label: 'Senior Citizen (1 Year)', value: 8.5, unit: '%' },
    ],
    loans: [
      { id: 'ln_per', label: 'Personal Loan', value: 14.0, unit: '%' },
      { id: 'ln_hou', label: 'Housing Loan', value: 12.0, unit: '%' },
      { id: 'ln_bus', label: 'Business Loan', value: 15.0, unit: '%' },
    ],
    pawning: [
      { id: 'pw_int', label: 'Pawning Interest Rate (% p.a.)', value: 13.0, unit: '%' },
      { id: 'pw_adv', label: 'Advance per Gold Sovereign', value: 120000, unit: 'Rs.' },
    ]
  });
  const handleConfirmRateUpdate = async () => {
    if (!confirmRateChange) return;
    const { category, id, newVal, rateType, fullObj } = confirmRateChange as any;
    
    try {
      if (category === 'savings') {
        const numericId = parseInt(id.replace('sav_', ''), 10);
        await AccountService.updateSavingsAccountTypeRate(numericId, newVal / 100);
        setSavingsRatesData(prev => prev.map(s => s.id === id ? { ...s, value: newVal } : s));
        fetchSavingsTypes();
      } else if (category === 'fd') {
        const payload = { ...fullObj };
        payload.interestRateMaturity = newVal.maturity;
        payload.interestRateMonthly = newVal.monthly;
        await AccountService.updateFixedDepositType(payload.id, payload);
        await fetchFdTypes();
      } else {
        setRatesData(prev => ({
          ...prev,
          [category]: (prev[category as keyof typeof prev] as any[]).map(item => item.id === id ? { ...item, value: newVal } : item)
        }));
      }
      setConfirmRateChange(null);
      setEditingRateId(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update rate');
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthService.UserDTO | null>(null);
  const [form, setForm] = useState({ username: '', fullName: '', password: '', role: 'TELLER' });
  const [error, setError] = useState('');
  const [savingsTypes, setSavingsTypes] = useState<AccountService.SavingsAccountType[]>([]);
  const [savingsRatesData, setSavingsRatesData] = useState<{id: string, value: number}[]>([]);
  const [fdTypes, setFdTypes] = useState<any[]>([]);

  useEffect(() => {
    setSavingsRatesData(savingsTypes.map(st => ({ id: `sav_${st.id}`, value: (st.interestRate != null ? st.interestRate : (st.isChildAccount ? 0.055 : 0.04)) * 100 })));
  }, [savingsTypes]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newType, setNewType] = useState({ code: '', nameEn: '', nameSi: '', isChildAccount: false });


  const [showFdTypeForm, setShowFdTypeForm] = useState(false);
  const [newFdType, setNewFdType] = useState({ category: 'NORMAL', termMonths: 12 });
  const [expandedFdCategories, setExpandedFdCategories] = useState<string[]>(['NORMAL', 'SENIOR', 'CHILD']);

  const toggleFdCategory = (cat: string) => {
    setExpandedFdCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  // ── Loan Types state (inside Account Types → Loans tab) ──
  const [loanTypes, setLoanTypes] = useState<LoanService.LoanType[]>([]);
  const [loanTypesLoading, setLoanTypesLoading] = useState(false);
  const [showLoanTypeForm, setShowLoanTypeForm] = useState(false);
  const [editingLoanType, setEditingLoanType] = useState<LoanService.LoanType | null>(null);
  const [loanTypeForm, setLoanTypeForm] = useState({
    code: '', nameEn: '', nameSi: '', description: '',
    maxAmount: '', maxTermMonths: '', category: 'SOCIETY',
    eligibilityCriteria: '', isActive: true
  });
  const [loanTypeError, setLoanTypeError] = useState('');
  const [loanTypeSaving, setLoanTypeSaving] = useState(false);
  // Loan rates editing (Interest Rates tab)
  const [editingLoanRateId, setEditingLoanRateId] = useState<string | null>(null);
  const [editLoanRateValue, setEditLoanRateValue] = useState<string | number>(0);

  const fetchLoanTypes = async () => {
    setLoanTypesLoading(true);
    try {
      const data = await LoanService.getAllLoanTypes();
      setLoanTypes(data);
    } catch { /* silent */ } finally { setLoanTypesLoading(false); }
  };

  useEffect(() => { fetchLoanTypes(); }, []);

  const openCreateLoanType = () => {
    setEditingLoanType(null);
    setLoanTypeForm({ code: '', nameEn: '', nameSi: '', description: '', maxAmount: '', maxTermMonths: '', category: 'SOCIETY', eligibilityCriteria: '', isActive: true });
    setLoanTypeError('');
    setShowLoanTypeForm(true);
  };

  const openEditLoanType = (lt: LoanService.LoanType) => {
    const { code, nameSi, nameEn, category, cleanDesc } = parseLoanMeta(lt);
    setEditingLoanType(lt);
    setLoanTypeForm({
      code: code || '',
      nameEn: nameEn || '',
      nameSi: nameSi || '',
      description: cleanDesc || '',
      maxAmount: String(lt.maxAmount || ''),
      maxTermMonths: String(lt.maxTermMonths || ''),
      category: category || 'SOCIETY',
      eligibilityCriteria: lt.eligibilityCriteria || '',
      isActive: lt.isActive,
    });
    setLoanTypeError('');
    setShowLoanTypeForm(true);
  };

  const handleSaveLoanType = async () => {
    if (!loanTypeForm.nameEn || !loanTypeForm.maxAmount) { setLoanTypeError('Name (English) and Max Amount are required.'); return; }
    setLoanTypeSaving(true); setLoanTypeError('');
    try {
      const payload: Partial<LoanService.LoanType> = {
        name: loanTypeForm.nameEn,
        description: loanTypeForm.description,
        maxAmount: Number(loanTypeForm.maxAmount),
        maxTermMonths: Number(loanTypeForm.maxTermMonths),
        // interest rate set from Interest Rates tab; default 14%
        interestRate: editingLoanType?.interestRate || 14,
        eligibilityCriteria: loanTypeForm.eligibilityCriteria,
        isActive: loanTypeForm.isActive,
        ...(loanTypeForm.code && { name: loanTypeForm.nameEn }),
      };
      // Attach extra fields via applicationData workaround (stored in description)
      (payload as any).description = [
        loanTypeForm.description,
        loanTypeForm.nameSi ? `[SI:${loanTypeForm.nameSi}]` : '',
        loanTypeForm.code ? `[CODE:${loanTypeForm.code}]` : '',
        loanTypeForm.category ? `[CAT:${loanTypeForm.category}]` : '',
      ].filter(Boolean).join(' | ');

      if (editingLoanType) { await LoanService.updateLoanType(editingLoanType.loanTypeId, payload); }
      else { await LoanService.createLoanType(payload); }
      setShowLoanTypeForm(false);
      fetchLoanTypes();
    } catch (err: any) { setLoanTypeError(err.response?.data || 'Save failed'); } finally { setLoanTypeSaving(false); }
  };

  // Parse embedded metadata from description
  // Also detects old records where lt.name contains Sinhala text
  const isSinhala = (str: string) => /[\u0D80-\u0DFF]/.test(str);

  const parseLoanMeta = (lt: LoanService.LoanType) => {
    const desc = lt.description || '';
    const hasMetadata = desc.includes('[CODE:') || desc.includes('[SI:');
    const cleanDesc = desc.replace(/\s*\|?\s*\[(SI|CODE|CAT):[^\]]+\]/g, '').trim();

    // For old records (no metadata), detect if name is Sinhala
    const nameIsSinhala = isSinhala(lt.name || '');

    const code = desc.match(/\[CODE:([^\]]+)\]/)?.[1]
      || (hasMetadata ? '' : (nameIsSinhala ? cleanDesc.replace(/\s+/g, '_').toUpperCase().substring(0, 15) : lt.name?.replace(/\s+/g, '_').toUpperCase().substring(0, 15) || ''));
      
    const nameSi = desc.match(/\[SI:([^\]]+)\]/)?.[1]
      || (nameIsSinhala && !hasMetadata ? lt.name : '');
      
    const nameEn = hasMetadata ? lt.name : (nameIsSinhala ? cleanDesc : lt.name);
    
    return { code, nameSi, nameEn, cleanDesc };
  };

  const handleUpdateLoanRate = async (lt: LoanService.LoanType, newRate: number) => {
    try {
      await LoanService.updateLoanType(lt.loanTypeId, { ...lt, interestRate: newRate });
      fetchLoanTypes();
      setEditingLoanRateId(null);
    } catch { alert('Failed to update rate.'); }
  };

  const handleDeleteLoanType = async (id: string) => {
    if (!confirm('Delete this loan type?')) return;
    try { await LoanService.deleteLoanType(id); fetchLoanTypes(); } catch { alert('Failed to delete.'); }
  };

  const handleToggleLoanTypeActive = async (lt: LoanService.LoanType) => {
    try { await LoanService.updateLoanType(lt.loanTypeId, { ...lt, isActive: !lt.isActive }); fetchLoanTypes(); } catch { alert('Failed.'); }

  };

  const fetchSavingsTypes = async () => {
    try {
      const types = await AccountService.getSavingsAccountTypes();
      setSavingsTypes(types);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFdTypes = async () => {
    try {
      const types = await AccountService.getFixedDepositTypes();
      setFdTypes(types);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSavingsTypes();
    fetchFdTypes();
  }, []);

  const handleAddSavingsType = async () => {
    try {
      await AccountService.createSavingsAccountType(newType as any);
      setShowTypeForm(false);
      setNewType({ code: '', nameEn: '', nameSi: '', isChildAccount: false });
      fetchSavingsTypes();
    } catch (err) {
      console.error(err);
      setError("Failed to create savings type");
    }
  };

  const handleAddFdType = async () => {
    try {
      const catCode = newFdType.category === 'NORMAL' ? 'NRM' : newFdType.category === 'SENIOR' ? 'SNR' : 'CHD';
      const catName = newFdType.category === 'NORMAL' ? 'සාමාන්‍ය ස්ථාවර තැන්පතු' : newFdType.category === 'SENIOR' ? 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු' : 'ළමා ස්ථාවර තැන්පතු';
      
      const payload = {
        code: `FD_${catCode}_${newFdType.termMonths}M`,
        name: `${catName} - මාස ${newFdType.termMonths}`,
        termMonths: newFdType.termMonths,
        interestRateMaturity: 0.0,
        interestRateMonthly: 0.0,
        isSeniorCitizen: newFdType.category === 'SENIOR'
      };

      await AccountService.createFixedDepositType(payload);
      setShowFdTypeForm(false);
      setNewFdType({ category: 'NORMAL', termMonths: 12 });
      fetchFdTypes();
    } catch (err: any) {
      console.error(err);
      alert("මෙම කාල සීමාව දැනටමත් ඇතුළත් කර ඇත! වෙනත් මාස ගණනක් ලබා දෙන්න. (This time period already exists!)");
    }
  };

  const handleDeleteFdType = async (id: string) => {
    if (confirm("Are you sure you want to delete this FD type?")) {
      try {
        await AccountService.deleteFixedDepositType(id);
        fetchFdTypes();
      } catch (err) {
        console.error(err);
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
          <ArrowLeft size={14} /> {t('Overview')}
        </button>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-semibold text-slate-800">{t(branch.name)}</span>
      </div>

      {/* Branch Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-bold text-xl">B{branch.id}</div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t(branch.name)}</h2>
            <p className="text-sm text-slate-400">{t(branch.location)} · {branchUsers.length} {t('staff accounts')}</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('Active')}
        </span>
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
                    {editingUser ? t('Edit User Profile') : `${t('New User —')} ${t(branch.name)}`}
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
                      ) : roles.map(r => <option key={r} value={r}>{t(r.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase()))))}</option>)}
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

      {/* ── Rates Tab ── */}
      {innerTab === 'rates' && (
        <div className="space-y-6 max-w-5xl">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
            {/* Tabs Header */}
            <div className="flex items-center gap-3 p-4 bg-slate-50/80 border-b border-slate-200 overflow-x-auto custom-scrollbar">
              {[
                { id: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-blue-600', activeBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border-blue-600' },
                { id: 'fd', label: 'Fixed Deposits', icon: Lock, color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border-emerald-600' },
                { id: 'loans', label: 'Loans', icon: Briefcase, color: 'text-amber-600', activeBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border-amber-500' },
                { id: 'pawning', label: 'Pawning', icon: Scale, color: 'text-purple-600', activeBg: 'bg-purple-600 text-white shadow-md shadow-purple-500/20 border-purple-600' },
              ].map(tab => {
                const isActive = rateCategory === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setRateCategory(tab.id as any); setEditingRateId(null); }}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${isActive ? tab.activeBg : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <tab.icon size={18} className={isActive ? 'text-white/90' : tab.color} />
                    {t(tab.label)}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                  {rateCategory === 'fd' ? (
                    <tr>
                      <th className="px-8 py-5 w-2/5">{t('Product / Type')}</th>
                      <th className="px-8 py-5 w-1/5 text-center">{t('Maturity Rate')} (කල් පිරුණම)</th>
                      <th className="px-8 py-5 w-1/5 text-center">{t('Monthly Rate')} (මාසිකව)</th>
                      <th className="px-8 py-5 w-1/5 text-right">{t('Actions')}</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-8 py-5 w-2/5">{t('Product / Type')}</th>
                      <th className="px-8 py-5 w-1/5">{t('Target')}</th>
                      <th className="px-8 py-5 w-1/5 text-right">{t('Current Rate')}</th>
                      <th className="px-8 py-5 w-1/5 text-right">{t('Actions')}</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rateCategory === 'savings' && savingsTypes.map(st => {
                    const id = `sav_${st.id}`;
                    const name = st.nameSi || st.nameEn; // Force Sinhala name for Hikkaduwa branches
                    const currentValue = savingsRatesData.find(s => s.id === id)?.value || 0;
                    const isEditing = editingRateId === id;
                    
                    return (
                      <tr key={id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800">{name}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${st.isChildAccount ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {st.isChildAccount ? 'ළමා' : 'වැඩිහිටි'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <input type="number" value={editRateValue} onChange={e => setEditRateValue(e.target.value)} step="0.1" autoFocus
                                className="w-24 border-2 border-blue-400 rounded-lg px-3 py-1.5 text-sm font-bold text-right focus:outline-none focus:ring-4 focus:ring-blue-400/20 shadow-sm" />
                              <span className="text-slate-400 font-bold">%</span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-slate-700 text-base">{Number(Number(currentValue).toFixed(4))} %</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <button onClick={() => setEditingRateId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                              <button onClick={() => setConfirmRateChange({ category: 'savings', id, name, oldVal: currentValue, newVal: Number(editRateValue), unit: '%' })} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingRateId(id); setEditRateValue(currentValue); }} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition">
                              <Edit size={14} /> {t('Edit')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {rateCategory === 'savings' && savingsTypes.length === 0 && (
                    <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">{t('No savings account types found.')}</td></tr>
                  )}


                  {rateCategory === 'fd' ? (
                    <>
                      {['NORMAL', 'SENIOR', 'CHILD'].map(cat => {
                        const catPrefix = cat === 'NORMAL' ? 'FD_NRM' : cat === 'SENIOR' ? 'FD_SNR' : 'FD_CHD';
                        const catName = cat === 'NORMAL' ? 'සාමාන්‍ය ස්ථාවර තැන්පතු' : cat === 'SENIOR' ? 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු' : 'ළමා ස්ථාවර තැන්පතු';
                        const items = fdTypes.filter((t: any) => t.code.startsWith(catPrefix)).sort((a: any, b: any) => a.termMonths - b.termMonths);
                        const isExpanded = expandedFdCategories.includes(cat);

                        return (
                          <React.Fragment key={cat}>
                            {/* Category Header Row */}
                            <tr 
                              className="bg-slate-50/50 hover:bg-slate-50/80 cursor-pointer transition-colors border-b border-slate-100"
                              onClick={() => toggleFdCategory(cat)}
                            >
                              <td colSpan={4} className="px-6 py-4">
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                  {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                  <Lock size={16} className="text-emerald-500 ml-1" />
                                  {catName}
                                </div>
                              </td>
                            </tr>
                            
                            {/* Items Rows */}
                            {isExpanded && (
                              items.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-8 py-4 text-xs font-semibold text-slate-400 text-center">
                                    මෙම වර්ගය සඳහා කාල සීමාවන් ඇතුළත් කර නොමැත. (No time periods added)
                                  </td>
                                </tr>
                              ) : (
                                items.map((st: any) => {
                                  const isEditing = editingRateId === st.id;

                                  return (
                                    <tr key={st.id} className="hover:bg-emerald-50/10 transition-colors border-b border-slate-50 last:border-0">
                                      <td className="px-8 py-4">
                                        <div className="flex flex-col gap-1">
                                          <div className="font-bold text-slate-700 text-sm">
                                            {st.termMonths >= 12 && st.termMonths % 12 === 0 ? `අවුරුදු ${st.termMonths / 12}` : `මාස ${st.termMonths}`}
                                          </div>
                                          <div className="font-mono text-[11px] text-slate-400 font-bold">{st.code}</div>
                                        </div>
                                      </td>
                                      <td className="px-8 py-4 text-center">
                                        {isEditing ? (
                                          <div className="flex justify-center items-center gap-1">
                                            <input type="number" value={editRateValueMaturity} onChange={e => setEditRateValueMaturity(e.target.value)} step="0.1" autoFocus
                                              className="w-20 border-2 border-emerald-400 rounded-lg px-2 py-1 text-sm font-bold text-center focus:outline-none focus:ring-4 focus:ring-emerald-400/20 shadow-sm" />
                                            <span className="text-slate-400 font-bold">%</span>
                                          </div>
                                        ) : (
                                          <span className="font-mono font-bold text-slate-700 text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-100/50">{Number(Number(st.interestRateMaturity).toFixed(4))} %</span>
                                        )}
                                      </td>
                                      <td className="px-8 py-4 text-center">
                                        {isEditing ? (
                                          <div className="flex justify-center items-center gap-1">
                                            <input type="number" value={editRateValueMonthly} onChange={e => setEditRateValueMonthly(e.target.value)} step="0.1"
                                              className="w-20 border-2 border-emerald-400 rounded-lg px-2 py-1 text-sm font-bold text-center focus:outline-none focus:ring-4 focus:ring-emerald-400/20 shadow-sm" />
                                            <span className="text-slate-400 font-bold">%</span>
                                          </div>
                                        ) : (
                                          <span className="font-mono font-bold text-slate-700 text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-100/50">{Number(Number(st.interestRateMonthly).toFixed(4))} %</span>
                                        )}
                                      </td>
                                      <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {isEditing ? (
                                            <>
                                              <button onClick={() => setEditingRateId(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                                              <button onClick={() => setConfirmRateChange({ category: 'fd', id: st.id, name: st.name, oldVal: st.interestRateMaturity, newVal: { maturity: Number(editRateValueMaturity), monthly: Number(editRateValueMonthly) }, unit: '%', fullObj: st })} className="p-1.5 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                                            </>
                                          ) : (
                                            <button onClick={() => { setEditingRateId(st.id); setEditRateValueMaturity(st.interestRateMaturity); setEditRateValueMonthly(st.interestRateMonthly); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition">
                                              <Edit size={14} /> {t('Edit')}
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  ) : null}
                  

                  {/* Interest Rates → Loans: load from backend loan types */}
                  {rateCategory === 'loans' && (
                    loanTypesLoading ? (
                      <tr><td colSpan={4} className="py-12 text-center"><div className="w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                    ) : loanTypes.length === 0 ? (
                      <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">No loan types found. Add them from Account Types → Loans.</td></tr>
                    ) : (
                      loanTypes.map(lt => {
                        const isEditing = editingLoanRateId === lt.loanTypeId;
                        const { code, nameSi, category } = parseLoanMeta(lt);
                        return (
                          <tr key={lt.loanTypeId} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <p className="font-bold text-slate-800">{lt.name}</p>
                              {nameSi && <p className="text-xs text-slate-400 mt-0.5">{nameSi}</p>}
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
                                category === 'SOCIETY' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {category === 'SOCIETY' ? 'සමාජ' : 'සමාජ නොවන'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              {isEditing ? (
                                <div className="flex justify-end items-center gap-2">
                                  <input type="number" value={editLoanRateValue} onChange={e => setEditLoanRateValue(e.target.value)}
                                    step="0.1" autoFocus
                                    className="w-24 border-2 border-amber-400 rounded-lg px-3 py-1.5 text-sm font-bold text-right focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-sm" />
                                  <span className="text-slate-400 font-bold">%</span>
                                </div>
                              ) : (
                                <span className="font-mono font-bold text-slate-700 text-base">{lt.interestRate} %</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              {isEditing ? (
                                <div className="flex justify-end items-center gap-2">
                                  <button onClick={() => setEditingLoanRateId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                                  <button onClick={() => handleUpdateLoanRate(lt, Number(editLoanRateValue))} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingLoanRateId(lt.loanTypeId); setEditLoanRateValue(lt.interestRate); }}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition">
                                  <Edit size={14} /> {t('Edit')}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                  

                  {rateCategory !== 'savings' && rateCategory !== 'fd' && rateCategory !== 'loans' && (ratesData[rateCategory as keyof typeof ratesData] || []).map((item: any) => {
                    const isEditing = editingRateId === item.id;
                    const name = t(item.label);
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800">{name}</td>
                        <td className="px-8 py-5 text-slate-400 text-xs uppercase tracking-widest font-extrabold">{t('All')}</td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <input type="number" value={editRateValue} onChange={e => setEditRateValue(e.target.value)} step={item.value > 100 ? "1000" : "0.1"} autoFocus
                                className="w-28 border-2 border-amber-400 rounded-lg px-3 py-1.5 text-sm font-bold text-right focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-sm" />
                              <span className="text-slate-400 font-bold whitespace-nowrap">{item.unit === '%' ? '%' : t(item.unit)}</span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-slate-700 text-base">{Number(Number(item.value).toFixed(4))} <span className="text-sm font-sans">{item.unit === '%' ? '%' : t(item.unit)}</span></span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <button onClick={() => setEditingRateId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                              <button onClick={() => setConfirmRateChange({ category: rateCategory, id: item.id, name, oldVal: item.value, newVal: Number(editRateValue), unit: item.unit })} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingRateId(item.id); setEditRateValue(item.value); }} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 shadow-sm rounded-xl transition">
                              <Edit size={14} /> {t('Edit')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmRateChange && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden scale-in-center">
            <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0 shadow-inner">
                <Shield size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 leading-tight">පොලී අනුපාතය යාවත්කාලීන කිරීම (Confirm Rate Update)</h3>
                <p className="text-amber-700/80 text-sm mt-1.5 font-medium leading-snug">ඔබ විසින් තීරණාත්මක මූල්‍ය පරාමිතියක් වෙනස් කිරීමට යයි. කරුණාකර මෙය තහවුරු කරන්න. (You are about to change a critical financial parameter.)</p>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">ගිණුම් වර්ගය (Product / Type)</p>
                <p className="text-slate-800 font-bold text-lg mb-4">{confirmRateChange.name}</p>
                
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">පෙර අනුපාතය (Previous)</p>
                    <p className="text-slate-500 font-mono font-semibold text-lg line-through decoration-slate-300 decoration-2">{Number(Number(confirmRateChange.oldVal).toFixed(4))} <span className="text-sm font-sans">{confirmRateChange.unit === '%' ? '%' : t(confirmRateChange.unit)}</span></p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <ChevronRight size={16} className="text-blue-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-1.5">නව අනුපාතය (New Rate)</p>
                    <p className="text-blue-600 font-mono font-black text-2xl">{Number(Number(confirmRateChange.newVal).toFixed(4))} <span className="text-sm font-sans">{confirmRateChange.unit === '%' ? '%' : t(confirmRateChange.unit)}</span></p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmRateChange(null)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">අවලංගු කරන්න (Cancel)</button>
                <button onClick={handleConfirmRateUpdate} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/30 transition transform hover:-translate-y-0.5">
                  තහවුරු කරන්න (Confirm)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Account Types Tab ── */}
      {innerTab === 'account_types' && (
        <div className="space-y-6 max-w-5xl">
          {showTypeForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-md w-full">
                <h4 className="font-bold text-slate-800 mb-4">{t('Add Savings Type')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t('Code')}</label>
                    <input value={newType.code} onChange={e => setNewType(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t('Account Target')}</label>
                    <select value={newType.isChildAccount ? 'child' : 'adult'} onChange={e => setNewType(p => ({ ...p, isChildAccount: e.target.value === 'child' }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                      <option value="adult">{t('Adult')}</option>
                      <option value="child">{t('Child')}</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('English Name')}</label>
                      <input value={newType.nameEn} onChange={e => setNewType(p => ({ ...p, nameEn: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t('Sinhala Name')}</label>
                      <input value={newType.nameSi} onChange={e => setNewType(p => ({ ...p, nameSi: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowTypeForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">{t('Cancel')}</button>
                  <button onClick={handleAddSavingsType} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">{t('Save Type')}</button>
                </div>
              </div>
            </div>
          )}

          {showFdTypeForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-md w-full">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock size={18} /> {t('Add FD Time Period')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ප්‍රධාන වර්ගය (Main Category)</label>
                    <select value={newFdType.category} onChange={e => setNewFdType(p => ({ ...p, category: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium">
                      <option value="NORMAL">සාමාන්‍ය ස්ථාවර තැන්පතු</option>
                      <option value="SENIOR">ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු</option>
                      <option value="CHILD">ළමා ස්ථාවර තැන්පතු</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">කාල සීමාව (Term in Months)</label>
                    <input type="number" value={newFdType.termMonths} onChange={e => setNewFdType(p => ({ ...p, termMonths: parseInt(e.target.value) }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowFdTypeForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">{t('Cancel')}</button>
                  <button onClick={handleAddFdType} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">{t('Save Time Period')}</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
            {/* Tabs Header */}
            <div className="flex items-center gap-3 p-4 bg-slate-50/80 border-b border-slate-200 overflow-x-auto custom-scrollbar">
              {[
                { id: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-blue-600', activeBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border-blue-600' },
                { id: 'fd', label: 'Fixed Deposits', icon: Lock, color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border-emerald-600' },
                { id: 'loans', label: 'Loans', icon: Briefcase, color: 'text-amber-600', activeBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border-amber-500' },
                { id: 'pawning', label: 'Pawning', icon: Scale, color: 'text-purple-600', activeBg: 'bg-purple-600 text-white shadow-md shadow-purple-500/20 border-purple-600' },
              ].map(tab => {
                const isActive = accountCategory === tab.id;
                return (
                  <button key={tab.id} onClick={() => setAccountCategory(tab.id as any)}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${isActive ? tab.activeBg : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <tab.icon size={18} className={isActive ? 'text-white/90' : tab.color} />
                    {t(tab.label)}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-0">

              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Database size={16} className="text-slate-400" />
                  {t('Manage')} {t(accountCategory === 'savings' ? 'Savings' : accountCategory === 'fd' ? 'Fixed Deposits' : accountCategory === 'loans' ? 'Loans' : 'Pawning')} {t('Account Types')}
                </h3>
                {accountCategory === 'savings' && (
                  <button 
                    onClick={() => setShowTypeForm(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 shadow-sm">
                    <Plus size={14} /> {t('Add Type')}
                  </button>
                )}
              </div>
              
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('Code')}</th>
                    <th className="px-6 py-4">{t('Target')}</th>
                    <th className="px-6 py-4">{t('English')}</th>
                    <th className="px-6 py-4">{t('Sinhala')}</th>
                    <th className="px-6 py-4 text-right">{t('Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {accountCategory === 'savings' ? (
                    savingsTypes.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">{t('No savings account types found.')}</td></tr>
                    ) : (
                      savingsTypes.map(st => (
                        <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">{st.code}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${st.isChildAccount ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {st.isChildAccount ? 'ළමා' : 'වැඩිහිටි'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">{st.nameEn}</td>
                          <td className="px-6 py-4 text-slate-600">{st.nameSi}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteSavingsType(st.id!)} className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title={t('Delete')}>
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : accountCategory === 'fd' ? (
                    fdTypes.length === 0 && false ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">{t('No fixed deposit types found.')}</td></tr>
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-0">
                          {['NORMAL', 'SENIOR', 'CHILD'].map(cat => {
                            const catPrefix = cat === 'NORMAL' ? 'FD_NRM' : cat === 'SENIOR' ? 'FD_SNR' : 'FD_CHD';
                            const catName = cat === 'NORMAL' ? 'සාමාන්‍ය ස්ථාවර තැන්පතු' : cat === 'SENIOR' ? 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු' : 'ළමා ස්ථාවර තැන්පතු';
                            const items = fdTypes.filter((t: any) => t.code.startsWith(catPrefix)).sort((a: any, b: any) => a.termMonths - b.termMonths);
                            
                            return (
                              <div key={cat} className="border-b border-slate-100 last:border-0 bg-white">
                                <div 
                                  className="px-6 py-4 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                                  onClick={() => toggleFdCategory(cat)}
                                >
                                  <div className="font-bold text-slate-800 flex items-center gap-2">
                                    {expandedFdCategories.includes(cat) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                    <Lock size={16} className="text-blue-500 ml-1" />
                                    {catName}
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewFdType(p => ({ ...p, category: cat }));
                                      setShowFdTypeForm(true);
                                    }}
                                    className="text-xs bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                                    <Plus size={14} /> {t('Add')}
                                  </button>
                                </div>
                                {expandedFdCategories.includes(cat) && (
                                  <div className="divide-y divide-slate-50">
                                    {items.length === 0 ? (
                                      <div className="px-8 py-4 text-xs font-semibold text-slate-400">
                                        මෙම වර්ගය සඳහා කාල සීමාවන් ඇතුළත් කර නොමැත. (No time periods added)
                                      </div>
                                    ) : (
                                      items.map((st: any) => (
                                        <div key={st.id} className="flex items-center justify-between px-8 py-3 hover:bg-slate-50 transition-colors">
                                          <div className="flex items-center gap-6">
                                            <div className="font-mono text-xs text-slate-400 font-bold w-24">{st.code}</div>
                                            <div className="font-semibold text-slate-700">
                                              {st.termMonths >= 12 && st.termMonths % 12 === 0 ? `අවුරුදු ${st.termMonths / 12}` : `මාස ${st.termMonths}`}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-8">
                                            <button onClick={() => handleDeleteFdType(st.id)} className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition" title={t('Delete')}>
                                              <Trash2 size={16}/>
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center">
                        <Database size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium text-lg">{t('Global Category Types')} - {t('Read Only')}</p>
                        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                          {t('This banking product relies on standard static categories across the network. Dynamic custom account types are not enabled for this product module.')}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Hide general header for loans — loans section has its own header with Add button */}
              {accountCategory !== 'loans' && (
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Database size={16} className="text-slate-400" />
                    {t('Manage')} {t(accountCategory === 'savings' ? 'Savings' : accountCategory === 'fd' ? 'Fixed Deposits' : 'Pawning')} {t('Account Types')}
                  </h3>
                  {accountCategory === 'savings' && (
                    <button
                      onClick={() => setShowTypeForm(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 shadow-sm">
                      <Plus size={14} /> {t('Add Type')}
                    </button>

                  )}
                </div>
              )}
              
              {accountCategory !== 'loans' && (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">{t('Code')}</th>
                      <th className="px-6 py-4">{t('Target')}</th>
                      <th className="px-6 py-4">{t('English')}</th>
                      <th className="px-6 py-4">{t('Sinhala')}</th>
                      <th className="px-6 py-4 text-right">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {accountCategory === 'savings' ? (
                      savingsTypes.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">{t('No savings account types found.')}</td></tr>
                      ) : (
                        savingsTypes.map(st => (
                          <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">{st.code}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${st.isChildAccount ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {st.isChildAccount ? 'ළමා' : 'වැඩිහිටි'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{st.nameEn}</td>
                            <td className="px-6 py-4 text-slate-600">{st.nameSi}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteSavingsType(st.id!)} className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title={t('Delete')}>
                                <Trash2 size={16}/>
                              </button>
                            </td>
                          </tr>
                        ))
                      )
                    ) : null}
                  </tbody>
                </table>
              )}

              {/* Account Types → Loans tab: savings-style CODE|TARGET|ENGLISH|SINHALA|ACTION table */}
              {accountCategory === 'loans' && (
                <div>
                  {/* Add/Edit Loan Type Modal */}
                  {showLoanTypeForm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5 text-white">
                          <h3 className="text-lg font-black">{editingLoanType ? t('Edit Loan Type') : t('New Loan Type')}</h3>
                          <p className="text-amber-100 text-xs mt-0.5">{t('Add a loan product — interest rates are set under Interest Rates → Loans')}</p>
                        </div>
                        <div className="p-6 space-y-4">
                          {loanTypeError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
                              <AlertTriangle size={14} /> {loanTypeError}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Code')} *</label>
                              <input value={loanTypeForm.code} onChange={e => setLoanTypeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="e.g. NORMAL_LOAN" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('English Name')} *</label>
                              <input value={loanTypeForm.nameEn} onChange={e => setLoanTypeForm(p => ({ ...p, nameEn: e.target.value }))}
                                placeholder="e.g. Normal Loan" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Sinhala Name')}</label>
                              <input value={loanTypeForm.nameSi} onChange={e => setLoanTypeForm(p => ({ ...p, nameSi: e.target.value }))}
                                placeholder="e.g. සාමාන්‍ය ණය" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Max Amount')} (Rs.) *</label>
                              <input type="number" value={loanTypeForm.maxAmount} onChange={e => setLoanTypeForm(p => ({ ...p, maxAmount: e.target.value }))}
                                placeholder="500000" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Max Term')} ({t('Months')})</label>
                              <input type="number" value={loanTypeForm.maxTermMonths} onChange={e => setLoanTypeForm(p => ({ ...p, maxTermMonths: e.target.value }))}
                                placeholder="60" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t('Description')}</label>
                              <textarea value={loanTypeForm.description} onChange={e => setLoanTypeForm(p => ({ ...p, description: e.target.value }))}
                                rows={2} placeholder="Short description..."
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                            </div>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" id="lt_isActive" checked={loanTypeForm.isActive} onChange={e => setLoanTypeForm(p => ({ ...p, isActive: e.target.checked }))}
                                className="w-4 h-4 text-amber-600 rounded" />
                              <label htmlFor="lt_isActive" className="text-sm font-semibold text-slate-700">{t('Active')}</label>
                            </div>
                            <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                              💡 Interest rate is configured separately under <strong>Interest Rates → Loans</strong> tab.
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50">
                          <button onClick={() => setShowLoanTypeForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">{t('Cancel')}</button>
                          <button onClick={handleSaveLoanType} disabled={loanTypeSaving}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60 shadow-md shadow-amber-200">
                            {loanTypeSaving ? `${t('Saving')}...` : editingLoanType ? t('Save Changes') : t('Create Type')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Header bar with Add button */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Database size={15} className="text-slate-400" /> {t('Manage Loans Account Types')}
                    </h3>
                    <button onClick={openCreateLoanType}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 shadow-sm">
                      <Plus size={14} /> {t('Add Type')}
                    </button>
                  </div>

                  {/* Savings-style table */}
                  {loanTypesLoading ? (
                    <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">{t('Code')}</th>
                          <th className="px-6 py-4">{t('English')}</th>
                          <th className="px-6 py-4">{t('Sinhala')}</th>
                          <th className="px-6 py-4 text-right">{t('Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {loanTypes.length === 0 ? (
                          <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">
                            {t('No loan types configured.')} Click "Add Type" to create one.
                          </td></tr>
                        ) : loanTypes.map(lt => {
                          const { code, nameSi, nameEn, cleanDesc } = parseLoanMeta(lt);
                          return (
                            <tr key={lt.loanTypeId} className="hover:bg-amber-50/20 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">{code}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{nameEn || '—'}</td>
                              <td className="px-6 py-4 text-slate-600">{nameSi || '—'}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => openEditLoanType(lt)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition">
                                    <Edit size={12} className="text-slate-500" /> {t('Edit')}
                                  </button>
                                  <button onClick={() => handleDeleteLoanType(lt.loanTypeId)}
                                    className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title={t('Delete')}>
                                    <Trash2 size={15}/>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── Branch Config Tab ── */}
      {innerTab === 'config' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Building size={16} /> {t('Branch Information')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Branch Name', value: branch.name }, { label: 'Location', value: branch.location }].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t(f.label)}</label>
                  <input defaultValue={t(f.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={16} /> {t('Branch Status')}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{t('Mark branch as Active / Inactive')}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('Inactive branches cannot process transactions.')}</p>
              </div>
              <select defaultValue="ACTIVE" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="ACTIVE">{t('Active')}</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition">
              <Save size={16} /> {t('Save Config')}
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
  const [activeTab, setActiveTab] = useState('users');

  const handleSelectBranch = (branch: typeof BRANCHES[0]) => {
    setActiveBranch(branch);
    setActiveTab('users');
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
      fetchUsers();
    }
  }, [user]);

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col fixed h-full z-10 border-r border-slate-800">
        <div className="h-20 flex items-center px-6">
          <img src={logo} alt="HMCS" className="w-8 h-8 rounded-lg object-cover mr-3 shadow-sm ring-1 ring-white/10" />
          <div>
            <p className="font-bold text-white text-sm tracking-wide">{t('HMCS Bank')}</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-0.5">{t('System Administration')}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <button onClick={() => { setActiveBranch(null); }}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${!activeBranch ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
            <LayoutDashboard size={18} className="mr-3" />{t('Overview')}
          </button>
          
          {activeBranch && (
            <div className="mt-8 mb-2">
              <div className="px-4 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse shrink-0"></div>
                <p className="text-xs font-bold text-white uppercase tracking-wider line-clamp-1">{t(activeBranch.name)}</p>
              </div>
              <div className="space-y-2.5 px-2">
                {[
                  ['users', Users, 'Staff & Users'], 
                  ['rates', Percent, 'Interest Rates'],
                  ['account_types', PiggyBank, 'Account Types'],
                  ['config', Settings, 'Branch Config']
                ].map(([key, Icon, label]) => (
                  <button key={key as string} onClick={() => setActiveTab(key as string)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      activeTab === key 
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm' 
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-600'
                    }`}>
                    <Icon size={18} className={`mr-3 shrink-0 ${activeTab === key ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="text-left leading-tight">{t(label as string)}</span>
                  </button>
                ))}
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
                <p className="text-slate-500 text-[10px] uppercase tracking-wider truncate mt-0.5">{t('System Admin')}</p>
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
          {activeBranch ? (
            <BranchDetail branch={activeBranch} allUsers={allUsers} onRefresh={fetchUsers} onBack={() => setActiveBranch(null)} innerTab={activeTab} />
          ) : (
            <OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} />
          )}
        </div>
      </main>
    </div>
  );
}
