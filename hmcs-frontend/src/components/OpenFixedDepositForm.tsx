
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Loader2, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import * as AccountService from '../services/account.service';
import { getCurrentUser } from '../services/auth.service';

const OpenFixedDepositForm = ({ onClose }: { onClose?: () => void }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);

  const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AccountService.MemberData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fdTypes, setFdTypes] = useState<any[]>([]);
  const [memberAccounts, setMemberAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch FD Types from Backend via Gateway
    AccountService.getFixedDepositTypes()
      .then(data => setFdTypes(data))
      .catch(err => console.error("Failed to fetch FD types", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await AccountService.searchMembers(query);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectApplicant = (member: AccountService.MemberData) => {
    const fullName = member.fullNameSinhala || member.fullName || '';
    const nic = member.nic || member.birthCertificateNumber || '';
    
    setFormData(prev => ({
      ...prev,
      memberId: member.memberId || '',
      fullName: fullName,
      nameWithInitials: member.nameWithInitials || member.fullName || '',
      idNumber: nic,
      address: member.address || '',
      dateOfBirth: member.dateOfBirth || '',
      phoneNumber: member.contactNumber || ''
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const [formData, setFormData] = useState({
    memberId: '',
    fdNumber: '',
    openedDate: new Date().toLocaleDateString('en-CA'),
    fullName: '',
    nameWithInitials: '',
    idNumber: '',
    address: '',
    dateOfBirth: '',
    phoneNumber: '',
    fdTypeId: '',
    principalAmount: '',
    interestPayoutMethod: 'AT_MATURITY',
    maturityInstruction: 'REINVEST_PRINCIPAL_AND_INTEREST',
    linkedSavingsAccountId: '',
    depositorSignature: '',
    receiptNumber: '',
    hasSubmittedTaxForm: false
  });

  useEffect(() => {
    if (formData.memberId) {
      AccountService.getAccounts()
        .then(data => {
          setMemberAccounts(data.filter(a => 
            a.memberId === formData.memberId || 
            a.memberId2 === formData.memberId || 
            a.memberId3 === formData.memberId
          ));
        })
        .catch(err => console.error("Failed to fetch member accounts", err));
    } else {
      setMemberAccounts([]);
    }
  }, [formData.memberId]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        (window as any).showToast('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        (window as any).showToast('Only JPG and PNG images are allowed');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, depositorSignature: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formRef = React.useRef<HTMLFormElement>(null);
  const [alertConfig, setAlertConfig] = useState<{message: string, isSuccess?: boolean, onCloseAction?: () => void} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => {
    if (formRef.current && !formRef.current.reportValidity()) return;
    if (step === 1 && !formData.memberId) {
      setAlertConfig({ message: 'කරුණාකර සාමාජිකයෙකු තෝරන්න (Please select a member first).' });
      return;
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    if (!formData.memberId) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${AccountService.API_URL}fixed-deposits`, {
        memberId: formData.memberId,
        typeId: formData.fdTypeId,
        principalAmount: parseFloat(formData.principalAmount),
        interestPayoutMethod: formData.interestPayoutMethod,
        maturityInstruction: formData.maturityInstruction,
        linkedSavingsAccountId: formData.linkedSavingsAccountId || null,
        depositorSignature: formData.depositorSignature || null,
        receiptNumber: formData.receiptNumber || null,
        openedDate: formData.openedDate || null,
        hasSubmittedTaxForm: formData.hasSubmittedTaxForm
      });

      setAlertConfig({ 
        message: 'ස්ථාවර තැන්පතුව සාර්ථකව විවෘත කරන ලදි!', 
        isSuccess: true,
        onCloseAction: () => { if (onClose) onClose(); }
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.response?.data || 'Failed to open Fixed Deposit';
      setAlertConfig({ message: typeof errMsg === 'string' ? errMsg : 'Failed to open Fixed Deposit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateMaturityDate = () => {
    if (!formData.fdTypeId || fdTypes.length === 0) return '';
    const type = fdTypes.find(t => t.id === formData.fdTypeId);
    if (!type || !type.termMonths) return '';
    const d = formData.openedDate ? new Date(formData.openedDate) : new Date();
    d.setMonth(d.getMonth() + type.termMonths);
    return d.toISOString().split('T')[0];
  };

  const getInterestRate = () => {
    if (!formData.fdTypeId || fdTypes.length === 0) return '0';
    const type = fdTypes.find(t => t.id === formData.fdTypeId);
    if (!type) return '0';
    return formData.interestPayoutMethod === 'MONTHLY' ? type.interestRateMonthly : type.interestRateMaturity;
  };

  const [formConfig, setFormConfig] = useState({ category: '', term: '', accountType: 'INDIVIDUAL' });

  // When category or term changes, find matching fdTypeId
  useEffect(() => {
    if (formConfig.category && formConfig.term) {
      const type = fdTypes.find(t => 
        t.code.startsWith(formConfig.category) && t.termMonths.toString() === formConfig.term
      );
      if (type) {
        setFormData(prev => ({ ...prev, fdTypeId: type.id }));
      }
    }
  }, [formConfig.category, formConfig.term, fdTypes]);

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    fdTypes.forEach(t => {
      const parts = t.code.split('_');
      if (parts.length >= 2) {
        const prefix = parts[0] + '_' + parts[1];
        if (!map.has(prefix)) {
          const baseName = t.name.split(' - ')[0].trim();
          map.set(prefix, baseName);
        }
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [fdTypes]);

  const availableTerms = useMemo(() => {
    if (!formConfig.category) return [];
    const terms = fdTypes
      .filter(t => t.code.startsWith(formConfig.category))
      .map(t => t.termMonths);
    return Array.from(new Set(terms)).sort((a, b) => a - b);
  }, [formConfig.category, fdTypes]);

  const [isOfficerApproved, setIsOfficerApproved] = useState(false);

  return (
    <div className="bg-white rounded-2xl max-w-5xl w-full mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
      {/* Header */}
      <div className="bg-[#01443b] text-white pt-6 pb-0 relative shrink-0">
        {onClose && (
          <button onClick={onClose} className="absolute right-4 top-4 text-emerald-200 hover:text-white transition">
            <X size={20} />
          </button>
        )}
        <div className="px-8 pb-4 flex justify-between items-start">
          <div>
            <p className="text-xs text-emerald-200/80 mb-1 font-semibold">{t(`විවිධ සේවා සමුපකාර සමිතිය`)}</p>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {t(`ස්ථාවර තැන්පතු ගිණුම් පෝරමය`)}<span className="bg-amber-500 text-amber-950 text-xs px-3 py-1 rounded-full font-bold">{t(`ස්ථාවර තැන්පතු`)}</span>
            </h2>
            <p className="text-xs text-emerald-200/70 mt-1">{t(`නව ස්ථාවර තැන්පතු ගිණුමක් ආරම්භ කිරීම`)}</p>
          </div>
        </div>

        {/* Progress Bar in Header */}
        <div className="grid grid-cols-3 gap-2 px-8 pb-3">
          <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-amber-400' : 'bg-[#002f29]'}`}></div>
          <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-amber-400' : 'bg-[#002f29]'}`}></div>
          <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-amber-400' : 'bg-[#002f29]'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-white">
        <form ref={formRef} onSubmit={handleSubmit} className="max-w-4xl mx-auto">

          {step === 1 && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">
                {t(`1. සාමාජික විස්තර (Member Details)`)}</h3>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`ගිණුම ආරම්භ කළ දිනය (OPENED DATE) *`)}</label>
                <input
                  type="date"
                  name="openedDate"
                  required
                  value={formData.openedDate}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                />
                {formData.openedDate && isPastDate(formData.openedDate) && (
                  <div className="mt-2 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 md:w-1/2 animate-in fade-in duration-200">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>
                      {language === 'si' 
                        ? 'අතීත දිනයක් තෝරා ඇත (පැරණි/සංක්‍රමණික ගිණුම් ඇතුළත් කිරීම් සඳහා).' 
                        : language === 'ta'
                        ? 'கடந்த தேதி தேர்ந்தெடுக்கப்பட்டது (பழைய/இடமாற்றம் செய்யப்பட்ட கணக்குகளுக்கு).'
                        : 'A past date is selected (For past/migrated account entries).'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`තැන්පතු කාණ්ඩය (CATEGORY) *`)}</label>
                  <select
                    required
                    value={formConfig.category}
                    onChange={(e) => setFormConfig({...formConfig, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                  >
                    <option value="">{t(`-- තෝරන්න --`)}</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat.code} value={cat.code}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`කාලය (TERM) *`)}</label>
                  <select
                    required
                    value={formConfig.term}
                    onChange={(e) => setFormConfig({...formConfig, term: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                    disabled={!formConfig.category}
                  >
                    <option value="">{t(`-- තෝරන්න --`)}</option>
                    {availableTerms.map(term => (
                      <option key={term} value={term}>{t(`මාස`)} {term}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`ගිණුම් වර්ගය (ACCOUNT TYPE) *`)}</label>
                <div className="flex gap-6 items-center h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="accType" checked={formConfig.accountType === 'INDIVIDUAL'} onChange={() => setFormConfig({...formConfig, accountType: 'INDIVIDUAL'})} className="w-4 h-4 text-[#01443b] focus:ring-[#01443b]" />
                    <span className="text-sm font-semibold text-slate-700">{t(`තනි ගිණුමක් (Individual)`)}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="accType" checked={formConfig.accountType === 'JOINT'} onChange={() => setFormConfig({...formConfig, accountType: 'JOINT'})} className="w-4 h-4 text-[#01443b] focus:ring-[#01443b]" />
                    <span className="text-sm font-semibold text-slate-700">{t(`හවුල් ගිණුමක් (Joint)`)}</span>
                  </label>
                </div>
              </div>

              {!formData.memberId ? (
                <div className="mb-6 relative">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`සාමාජිකයා සොයන්න (SEARCH MEMBER)`)}</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t(`NIC අංකය හෝ නම ටයිප් කරන්න...`)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#01443b] focus:outline-none"
                    />
                    {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#01443b] animate-spin" />}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map(member => (
                        <button
                          key={member.memberId}
                          type="button"
                          onClick={() => selectApplicant(member)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0"
                        >
                          <p className="font-semibold text-slate-800">{member.fullNameSinhala || member.fullName}</p>
                          <p className="text-xs text-slate-500">NIC: {member.nic} | Member No: {member.membershipNumber || 'නැත (Non-Member)'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl relative">
                  <button type="button" onClick={() => setFormData(prev => ({...prev, memberId: ''}))} className="absolute right-4 top-4 text-emerald-600 hover:text-emerald-800">
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">සම්පූර්ණ නම</label>
                      <div className="w-full px-3 py-2 bg-white border border-emerald-100 rounded text-sm text-slate-700">{formData.fullName || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">මුලකුරු සමඟ නම</label>
                      <div className="w-full px-3 py-2 bg-white border border-emerald-100 rounded text-sm text-slate-700">{formData.nameWithInitials || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">ජාතික හැඳුනුම්පත් අංකය</label>
                      <div className="w-full px-3 py-2 bg-white border border-emerald-100 rounded text-sm text-slate-700">{formData.idNumber || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">උපන් දිනය (DATE OF BIRTH)</label>
                      <div className="w-full px-3 py-2 bg-white border border-emerald-100 rounded text-sm text-slate-700">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : '-'}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">දුරකථන අංකය (PHONE NUMBER)</label>
                      <div className="w-full px-3 py-2 bg-white border border-emerald-100 rounded text-sm text-slate-700">{formData.phoneNumber || '-'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">ලිපිනය</label>
                      <div className="w-full px-3 py-2 bg-white border border-emerald-100 rounded text-sm text-slate-700">{formData.address || '-'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">
                {t(`2. තැන්පතු තොරතුරු (Deposit Details)`)}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`ස්ථාවර තැන්පතු අංකය (FD Number) *`)}</label>
                  <input
                    type="text"
                    name="fdNumber"
                    required
                    placeholder="e.g. FD-00123"
                    value={formData.fdNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`තැන්පතු මුදල (Principal Amount) *`)}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rs.</span>
                    <input
                      type="number"
                      name="principalAmount"
                      required
                      min="5000"
                      value={formData.principalAmount}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`පොළිය ලබාගන්නා ක්‍රමය (Interest Payout) *`)}</label>
                  <select
                    name="interestPayoutMethod"
                    required
                    value={formData.interestPayoutMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                  >
                    <option value="AT_MATURITY">{t(`කල් පිරුණම එකවර ගැනීම (At Maturity - Higher Rate)`)}</option>
                    <option value="MONTHLY">{t(`මාසිකව ගැනීම (Monthly - Rate -2%)`)}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`කල් පිරීමේ උපදෙස් (Maturity Instructions) *`)}</label>
                  <select
                    name="maturityInstruction"
                    required
                    value={formData.maturityInstruction}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                  >
                    <option value="REINVEST_PRINCIPAL_AND_INTEREST">{t(`1. මුල් මුදල සහ පොළිය නැවත ආයෝජනය කිරීම (Reinvest Principal & Interest)`)}</option>
                    <option value="REINVEST_PRINCIPAL_PAY_INTEREST">{t(`2. මුල් මුදල නැවත ආයෝජනය කර, පොළිය ඉතුරුම් ගිණුමට (Reinvest Principal, Pay Interest)`)}</option>
                    <option value="CLOSE_ACCOUNT">{t(`3. ගිණුම වසා සියලු මුදල් ඉතුරුම් ගිණුමට (Close Account)`)}</option>
                  </select>
                </div>

                {(formData.interestPayoutMethod === 'MONTHLY' || 
                  formData.maturityInstruction === 'REINVEST_PRINCIPAL_PAY_INTEREST' || 
                  formData.maturityInstruction === 'CLOSE_ACCOUNT') && (
                  <div className="md:col-span-2 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                      {language === 'si' 
                        ? 'පොළිය/මුදල් බැරවිය යුතු ඉතුරුම් ගිණුම (Linked Savings Account) *' 
                        : language === 'ta'
                        ? 'இணைக்கப்பட்ட சேமிப்புக் கணக்கு (Linked Savings Account) *'
                        : 'Linked Savings Account *'}
                    </label>
                    <select
                      name="linkedSavingsAccountId"
                      required
                      value={formData.linkedSavingsAccountId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm font-medium"
                    >
                      <option value="">{language === 'si' ? '-- ඉතුරුම් ගිණුමක් තෝරන්න --' : language === 'ta' ? '-- சேமிப்புக் கணக்கைத் தேர்ந்தெடுக்கவும் --' : '-- Select a Savings Account --'}</option>
                      {memberAccounts.map(acc => (
                        <option key={acc.accountId} value={acc.accountId}>
                          {acc.accountNumber} - {acc.accountType} (Rs. {Number(acc.balance).toLocaleString(undefined, {minimumFractionDigits: 2})})
                        </option>
                      ))}
                    </select>
                    {memberAccounts.length === 0 && (
                      <p className="text-xs text-red-500 font-bold mt-2 animate-pulse">
                        {language === 'si' 
                          ? 'මෙම සාමාජිකයාට සක්‍රීය ඉතුරුම් ගිණුම් කිසිවක් හමු නොවීය. කරුණාකර පළමුව ඉතුරුම් ගිණුමක් ආරම්භ කරන්න.' 
                          : 'No active savings accounts found for this member. Please open a savings account first.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-red-50 text-red-600 text-sm font-semibold py-3 px-4 rounded-lg mb-6 flex justify-between items-center border border-red-100">
                <span>{t(`කරුණාකර අනුමත නිලධාරි ලෙස තහවුරු කරන්න (Please approve as authorized officer).`)}</span>
                <X size={16} className="text-red-400" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">
                {t(`3. කාර්යාලීය ප්‍රයෝජනය සඳහා පමණි (Office Use Only)`)}</h3>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`කුවිතාන්සි අංකය (RECEIPT NO)`)}</label>
                    <input
                      type="text"
                      name="receiptNumber"
                      value={formData.receiptNumber}
                      onChange={handleInputChange}
                      placeholder="රිසිට්පත් අංකය"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`තැන්පත්කරුගේ අත්සන (DEPOSITOR SIGNATURE)`)}</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleSignatureUpload}
                      className="w-full px-4 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#01443b] hover:file:bg-emerald-100 text-sm"
                    />
                    {formData.depositorSignature && (
                      <div className="mt-2 p-2 bg-white border border-slate-200 rounded-lg inline-block">
                        <img src={formData.depositorSignature} alt="Signature Preview" className="h-12 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t(`තැන්පත් කළ දිනය (DEPOSIT DATE)`)}</p>
                    <p className="text-sm font-bold text-slate-800">{formData.openedDate || new Date().toLocaleDateString('en-CA')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t(`කල්පිරෙන දිනය (MATURITY DATE)`)}</p>
                    <p className="text-sm font-bold text-slate-800">{calculateMaturityDate() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t(`පොළී අනුපාතිකය (INTEREST RATE)`)}</p>
                    <p className="text-sm font-bold text-slate-800">{getInterestRate()}%</p>
                  </div>
                </div>

                <div className="mb-6 pt-4 border-t border-slate-200 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.hasSubmittedTaxForm || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasSubmittedTaxForm: e.target.checked }))}
                      className="w-5 h-5 text-[#01443b] rounded focus:ring-[#01443b]" 
                    />
                    <span className="text-sm font-bold text-slate-700">{t(`බදු ආකෘති පත්‍රය ලබා දී ඇත (Tax form submitted)`)}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isOfficerApproved}
                      onChange={(e) => setIsOfficerApproved(e.target.checked)}
                      className="w-5 h-5 text-[#01443b] rounded focus:ring-[#01443b]" 
                    />
                    <span className="text-sm font-bold text-slate-700">{t(`අනුමත කළ බලයලත් නිලධාරි අත්සන (Authorized Officer Approved)`)}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
              {t(`අවලංගු කරන්න (Cancel)`)}</button>
            
            <div className="flex gap-3">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition">
                  {t(`පෙර (Back)`)}</button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep} className="px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-[#01443b] hover:bg-[#002f29] transition shadow-md">
                  {t(`ඊළඟ (Next)`)}</button>
              ) : (
                <button type="submit" disabled={isSubmitting || !isOfficerApproved} className="px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-[#01443b] hover:bg-[#002f29] transition shadow-md flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />} {t(`තැන්පතුව ආරම්භ කරන්න (Open FD)`)}</button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Custom Alert Modal */}
      {alertConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200 border-l-4 ${alertConfig.isSuccess ? 'border-emerald-500' : 'border-amber-500'}`}>
            <div className="flex items-start gap-4">
              <div className={`${alertConfig.isSuccess ? 'bg-emerald-100' : 'bg-amber-100'} p-2 rounded-full shrink-0`}>
                {alertConfig.isSuccess ? (
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{alertConfig.isSuccess ? 'සාර්ථකයි (Success)' : 'අවධානයට (Attention)'}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{alertConfig.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button 
                onClick={() => {
                  alertConfig.onCloseAction?.();
                  setAlertConfig(null);
                }} 
                className={`px-5 py-2 text-white text-sm font-semibold rounded-lg transition shadow-sm ${alertConfig.isSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-900 hover:bg-gray-800'}`}
              >
                හරි (OK)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenFixedDepositForm;
