import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import * as AccountService from '../services/account.service';
import * as LoanService from '../services/loan.service';
import * as PawningService from '../services/pawning.service';
import { Percent, PiggyBank, Plus, Key, X, Eye, EyeOff, Edit, CheckCircle, Shield, ChevronDown, ChevronRight, Lock, Briefcase, Scale, Database, Trash2 } from 'lucide-react';

export default function GlobalSettings({ currentTab, readOnly = false }: { currentTab: 'rates' | 'account_types' | 'settings', readOnly?: boolean }) {
  const { t, language } = useLanguage();

  const [rateCategory, setRateCategory] = useState<'savings'|'fd'|'loans'|'pawning'|'general'>('savings');
  const [accountCategory, setAccountCategory] = useState<'savings'|'fd'|'loans'|'pawning'>('savings');
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<string | number>(0);
  const [editRateValueMaturity, setEditRateValueMaturity] = useState<string | number>(0);
  const [editRateValueMonthly, setEditRateValueMonthly] = useState<string | number>(0);
  const [confirmRateChange, setConfirmRateChange] = useState<{ category: string, id: string, name: string, oldVal: number, newVal: number, unit: string } | null>(null);

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
    ],
    general: [
      { id: 'gen_share_price', label: 'Share Price (Rs.)', value: Number(localStorage.getItem('SYS_SHARE_PRICE')) || 100.0, unit: 'Rs.' }
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
      } else if (category === 'settings') {
        if (id === 'share_price') {
          localStorage.setItem('SYS_SHARE_PRICE', newVal.toString());
          setSharePrice(newVal); // Add this hook below if missing, or we assume it is updated by effect
        }
      } else {
        if (category === 'general' && id === 'gen_share_price') {
          localStorage.setItem('SYS_SHARE_PRICE', newVal.toString());
        }
        if (category === 'pawning') {
          await PawningService.updateSetting(id, newVal.toString());
        }
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


  const [savingsTypes, setSavingsTypes] = useState<AccountService.SavingsAccountType[]>([]);
  const [savingsRatesData, setSavingsRatesData] = useState<{id: string, value: number}[]>([]);
  const [fdTypes, setFdTypes] = useState<any[]>([]);

  useEffect(() => {
    setSavingsRatesData(savingsTypes.map(st => ({ id: `sav_${st.id}`, value: (st.interestRate != null ? st.interestRate : (st.isChildAccount ? 0.055 : 0.04)) * 100 })));
  }, [savingsTypes]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newType, setNewType] = useState({ code: '', nameEn: '', nameSi: '', isChildAccount: false });


  const [showFdTypeForm, setShowFdTypeForm] = useState(false);
  const [newFdType, setNewFdType] = useState({ category: 'FD_NRM', termMonths: 12 });
  const [expandedFdCategories, setExpandedFdCategories] = useState<string[]>([]);

  const toggleFdCategory = (cat: string) => {
    setExpandedFdCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

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
      
      // Auto-expand the first few categories if not already set
      const uniquePrefixes = Array.from(new Set(types.map((t: any) => t.code.split('_').slice(0, 2).join('_'))));
      if (expandedFdCategories.length === 0 && uniquePrefixes.length > 0) {
        setExpandedFdCategories(uniquePrefixes.slice(0, 3) as string[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const uniqueFdCategories = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    fdTypes.forEach(t => {
      const parts = t.code.split('_');
      if (parts.length >= 2) {
        const prefix = `${parts[0]}_${parts[1]}`;
        const baseName = t.name.split(' - ')[0].trim();
        if (!map.has(prefix)) {
          map.set(prefix, { code: prefix, name: baseName });
        }
      }
    });
    return Array.from(map.values());
  }, [fdTypes]);

  const fetchPawningSettings = async () => {
    try {
      const settings = await PawningService.getAllSettings();
      const interestRate = settings.find((s: any) => s.settingKey === 'pw_int')?.settingValue || '13.0';
      const advanceAmount = settings.find((s: any) => s.settingKey === 'pw_adv')?.settingValue || '120000';
      
      setRatesData(prev => ({
        ...prev,
        pawning: [
          { id: 'pw_int', label: 'Pawning Interest Rate (% p.a.)', value: Number(interestRate), unit: '%' },
          { id: 'pw_adv', label: 'Advance per Gold Sovereign', value: Number(advanceAmount), unit: 'Rs.' },
        ]
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSavingsTypes();
    fetchFdTypes();
    fetchPawningSettings();
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
      const catInfo = uniqueFdCategories.find(c => c.code === newFdType.category);
      const catCode = catInfo ? catInfo.code.replace('FD_', '') : 'NRM';
      const catName = catInfo ? catInfo.name : 'සාමාන්‍ය ස්ථාවර තැන්පතු';
      
      const payload = {
        code: `FD_${catCode}_${newFdType.termMonths >= 12 ? (newFdType.termMonths/12) + 'Y' : newFdType.termMonths + 'M'}`,
        name: `${catName} - ${newFdType.termMonths >= 12 ? (newFdType.termMonths/12) + ' අවුරුදු' : newFdType.termMonths + ' මාස'}`,
        termMonths: newFdType.termMonths,
        interestRateMaturity: 0.0,
        interestRateMonthly: 0.0,
        isSeniorCitizen: newFdType.category === 'SENIOR'
      };

      await AccountService.createFixedDepositType(payload);
      setShowFdTypeForm(false);
      setNewFdType({ category: uniqueFdCategories.length > 0 ? uniqueFdCategories[0].code : 'FD_NRM', termMonths: 12 });
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


  const [sharePrice, setSharePrice] = useState(Number(localStorage.getItem('SYS_SHARE_PRICE')) || 100.0);

  if (currentTab === 'settings') {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5 p-8">
           <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">
             <Database size={20} className="text-blue-500" />
             {t('General / Shares')}
           </h3>
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center justify-between">
             <div>
               <p className="font-bold text-slate-700 text-sm">{t('Share Price (Rs.)')}</p>
               <p className="text-xs text-slate-500 mt-1">{t('Price of a single share for members')}</p>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-slate-500 font-bold text-sm">Rs.</span>
               {editingRateId === 'share_price' ? (
                 <>
                   <input type="number" 
                     value={editRateValue} 
                     onChange={e => setEditRateValue(e.target.value)} 
                     className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                   />
                   <button 
                     onClick={() => setConfirmRateChange({ category: 'settings', id: 'share_price', name: 'Share Price', oldVal: sharePrice, newVal: Number(editRateValue), unit: 'Rs.' })}
                     className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition" title={t('Save')}>
                     <CheckCircle size={16} />
                   </button>
                   <button 
                     onClick={() => setEditingRateId(null)}
                     className="p-2 text-slate-400 bg-white hover:bg-slate-50 hover:text-slate-600 border border-slate-200 shadow-sm rounded-lg transition" title={t('Cancel')}>
                     <X size={16} />
                   </button>
                 </>
               ) : (
                 <>
                   <span className="w-24 px-3 py-2 text-sm font-bold text-slate-800 bg-white border border-transparent rounded-lg">{sharePrice.toFixed(2)}</span>
                   <button 
                     onClick={() => { setEditRateValue(sharePrice); setEditingRateId('share_price'); }}
                     className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title={t('Edit')}>
                     <Edit size={16} />
                   </button>
                 </>
               )}
             </div>
           </div>
        </div>
      </div>
    );
  }

  return currentTab === 'rates' ? (
    <div className="space-y-6 max-w-5xl">
      {true && (
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
                      <th className="px-8 py-5 w-1/2">{t('Product / Type')}</th>
                      <th className="px-8 py-5 w-1/4 text-right">{t('Current Rate')}</th>
                      <th className="px-8 py-5 w-1/4 text-right">{t('Actions')}</th>
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
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">{name}</span>
                            <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${st.isChildAccount ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {st.isChildAccount ? 'ළමා' : 'වැඩිහිටි'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <input type="number" value={editRateValue} onChange={e => setEditRateValue(e.target.value)} step="0.1" autoFocus
                                className="w-24 border-2 border-blue-400 rounded-lg px-3 py-1.5 text-sm font-bold text-right focus:outline-none focus:ring-4 focus:ring-blue-400/20 shadow-sm" />
                              <span className="text-slate-400 font-bold">%</span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-slate-700 text-base">{Number(Number(currentValue).toFixed(4))}% (වා.පො.)</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-2">
                              <button onClick={() => setEditingRateId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                              <button onClick={() => setConfirmRateChange({ category: 'savings', id, name, oldVal: currentValue, newVal: Number(editRateValue), unit: '%' })} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                            </div>
                          ) : (
                            !readOnly && (
                              <button onClick={() => { setEditingRateId(id); setEditRateValue(currentValue); }} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition">
                                <Edit size={14} /> {t('Edit')}
                              </button>
                            )
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
                      {uniqueFdCategories.map(cat => {
                        const catPrefix = cat.code;
                        const catName = cat.name;
                        const items = fdTypes.filter((t: any) => t.code.startsWith(catPrefix)).sort((a: any, b: any) => a.termMonths - b.termMonths);
                        const isExpanded = expandedFdCategories.includes(cat.code);

                        return (
                          <React.Fragment key={cat.code}>
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
                                          <span className="font-mono font-bold text-slate-700 text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-100/50">{Number(Number(st.interestRateMaturity).toFixed(4))}% (වා.පො.)</span>
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
                                          <span className="font-mono font-bold text-slate-700 text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-100/50">{Number(Number(st.interestRateMonthly).toFixed(4))}% (වා.පො.)</span>
                                        )}
                                      </td>
                                      <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {isEditing ? (
                                            <>
                                              <button onClick={() => setEditingRateId(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                                              <button onClick={() => setConfirmRateChange({ category: 'fd', id: st.id, name: st.name, oldVal: st.interestRateMaturity, newVal: { maturity: Number(editRateValueMaturity), monthly: Number(editRateValueMonthly) }, unit: '%', fullObj: st })} className="p-1.5 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                                            </>
                                          ) : !readOnly && (
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
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-bold text-slate-800">{lt.name}</p>
                                  {nameSi && <p className="text-xs text-slate-400 mt-0.5">{nameSi}</p>}
                                </div>
                              </div>
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
                                <span className="font-mono font-bold text-slate-700 text-base">{lt.interestRate}% (වා.පො.)</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              {isEditing ? (
                                <div className="flex justify-end items-center gap-2">
                                  <button onClick={() => setEditingLoanRateId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"><X size={16}/></button>
                                  <button onClick={() => handleUpdateLoanRate(lt, Number(editLoanRateValue))} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 rounded-lg transition"><CheckCircle size={16}/></button>
                                </div>
                              ) : !readOnly && (
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
                          ) : !readOnly && (
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
                      <p className="text-blue-600 font-mono font-black text-2xl">
                        {confirmRateChange.category === 'fd' 
                          ? Number(Number((confirmRateChange.newVal as any).maturity).toFixed(4))
                          : Number(Number(confirmRateChange.newVal).toFixed(4))} 
                        <span className="text-sm font-sans">{confirmRateChange.unit === '%' ? '%' : t(confirmRateChange.unit)}</span>
                      </p>
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
    </div>
  ) : (
    <div className="space-y-6 max-w-5xl">
      {true && (
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
                      {uniqueFdCategories.map(cat => (
                        <option key={cat.code} value={cat.code}>{cat.name}</option>
                      ))}
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

              {accountCategory !== 'loans' && (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Database size={16} className="text-slate-400" />
                      {t('Manage')} {t(accountCategory === 'savings' ? 'Savings' : accountCategory === 'fd' ? 'Fixed Deposits' : 'Pawning')} {t('Account Types')}
                    </h3>
                    {!readOnly && accountCategory === 'savings' && (
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
                            {!readOnly && (
                              <button onClick={() => handleDeleteSavingsType(st.id!)} className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title={t('Delete')}>
                                <Trash2 size={16}/>
                              </button>
                            )}
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
                          {uniqueFdCategories.map(cat => {
                            const catPrefix = cat.code;
                            const catName = cat.name;
                            const items = fdTypes.filter((t: any) => t.code.startsWith(catPrefix)).sort((a: any, b: any) => a.termMonths - b.termMonths);
                            
                            return (
                              <div key={cat.code} className="border-b border-slate-100 last:border-0 bg-white">
                                <div 
                                  className="px-6 py-4 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                                  onClick={() => toggleFdCategory(cat.code)}
                                >
                                  <div className="font-bold text-slate-800 flex items-center gap-2">
                                    {expandedFdCategories.includes(cat.code) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                    <Lock size={16} className="text-blue-500 ml-1" />
                                    {catName}
                                  </div>
                                  {!readOnly && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNewFdType(p => ({ ...p, category: cat.code }));
                                        setShowFdTypeForm(true);
                                      }}
                                      className="text-xs bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                                      <Plus size={14} /> {t('Add')}
                                    </button>
                                  )}
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
                                            {!readOnly && (
                                              <button onClick={() => handleDeleteFdType(st.id)} className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition" title={t('Delete')}>
                                                <Trash2 size={16}/>
                                              </button>
                                            )}
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
              </>
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
                    {!readOnly && (
                      <button onClick={openCreateLoanType}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-2 shadow-sm">
                        <Plus size={14} /> {t('Add Type')}
                      </button>
                    )}
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
                          const { code, nameSi, nameEn } = parseLoanMeta(lt);
                          return (
                            <tr key={lt.loanTypeId} className="hover:bg-amber-50/20 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-xs text-slate-600">{code}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{nameEn || '—'}</td>
                              <td className="px-6 py-4 text-slate-600">{nameSi || '—'}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                {!readOnly && (
                                  <>
                                    <button onClick={() => openEditLoanType(lt)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition">
                                      <Edit size={12} className="text-slate-500" /> {t('Edit')}
                                    </button>
                                    <button onClick={() => handleDeleteLoanType(lt.loanTypeId)}
                                      className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition" title={t('Delete')}>
                                      <Trash2 size={15}/>
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
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
