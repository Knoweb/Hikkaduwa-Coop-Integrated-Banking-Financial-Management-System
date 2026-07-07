import React, { useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import * as AccountService from '../services/account.service';

const OpenAccountForm = ({ isSocietyMember = true, onClose }: { isSocietyMember?: boolean, onClose?: () => void }) => {
  const [step, setStep] = useState(1);
  const [accountMode, setAccountMode] = useState('single');
  const [clientType, setClientType] = useState('adult');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AccountService.MemberData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live search with debounce
  React.useEffect(() => {
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

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const selectApplicant = async (member: AccountService.MemberData, applicantNum: number) => {
    const fullName = member.fullName || member.fullNameSinhala || '';
    const nic = member.nic || member.birthCertificateNumber || '';
    
    let calculatedAge = '';
    if (member.dateOfBirth) {
      const dob = new Date(member.dateOfBirth);
      const today = new Date(formData.date);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      calculatedAge = age.toString();
    }
    
    setFormData(prev => ({
      ...prev,
      [`memberId${applicantNum}`]: member.memberId || '',
      [`fullName${applicantNum}`]: fullName,
      [`address${applicantNum}`]: member.address || '',
      [`idNumber${applicantNum}`]: nic,
      [`dob${applicantNum}`]: member.dateOfBirth || '',
      [`age${applicantNum}`]: calculatedAge,
    }));
    setSearchResults([]);
    setSearchQuery('');

    // Auto-fill Guardian Details for Children
    if (applicantNum === 1 && clientType === 'child') {
      const guardianQuery = member.guardianNic || member.guardianMemberNo;
      
      // At minimum, fill what we know from the child's profile
      if (member.guardianNic) {
        setFormData(prev => ({ ...prev, idNumber2: member.guardianNic || '' }));
      }

      if (guardianQuery) {
        try {
          const results = await AccountService.searchMembers(guardianQuery);
          if (results && results.length > 0) {
            const guardian = results[0];
            const gFullName = guardian.fullName || guardian.fullNameSinhala || '';
            const gNic = guardian.nic || guardian.birthCertificateNumber || '';
            
            let gCalculatedAge = '';
            if (guardian.dateOfBirth) {
              const dob = new Date(guardian.dateOfBirth);
              const today = new Date(formData.date);
              let age = today.getFullYear() - dob.getFullYear();
              const m = today.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
              }
              gCalculatedAge = age.toString();
            }

            setFormData(prev => ({
              ...prev,
              memberId2: guardian.memberId || '',
              fullName2: gFullName,
              address2: guardian.address || prev.address2, // keep existing if not found
              idNumber2: gNic || prev.idNumber2,
              dob2: guardian.dateOfBirth || '',
              age2: gCalculatedAge,
            }));
          }
        } catch (e) {
          console.error('Failed to auto-fetch guardian details', e);
        }
      }
    }
  };

  const [formData, setFormData] = useState({
    // පද්ධති සහ ආයතනික තොරතුරු (Institutional Fields)
    branchName: 'හික්කඩුව', // පද්ධතියෙන් ස්වයංක්රීයව පිරේ [cite: 71, 72]
    societyName: 'හික්කඩුව විවිධ සේවා සමුපකාර සමිතිය', // [cite: 76, 78]
    // ගිණුම් සැකසුම්
    date: new Date().toISOString().split('T')[0], // [cite: 75]
    openedDate: new Date().toISOString().split('T')[0],
    accountNumber: '', // පද්ධතියෙන් ජනනය වේ [cite: 74]
    officerSignature: 'senior_hkw', // [cite: 74]

    // ගිණුම් සැකසුම්
    accountType: 'samanaya',
    accountMode: 'single', // [cite: 80]
    modeOfOperation: 'self', // [cite: 92, 93]

    // පළමුවන අයදුම්කරු (Primary Applicant / Minor)
    fullName1: '', // [cite: 81]
    address1: '', // [cite: 82]
    idNumber1: '', // NIC හෝ උප්පැන්න සහතික අංකය [cite: 83]
    occupation1: '', // [cite: 87]
    age1: '', // [cite: 87]
    dob1: '',

    // දෙවන අයදුම්කරු (Second Applicant / Guardian)
    fullName2: '', // [cite: 84]
    address2: '', // [cite: 85]
    idNumber2: '', // [cite: 86]
    occupation2: '', // [cite: 87]
    age2: '', // [cite: 87]

    // තෙවන අයදුම්කරු (Third Applicant)
    fullName3: '', // [cite: 88]
    address3: '', // [cite: 89]
    idNumber3: '', // [cite: 90]
    occupation3: '', // [cite: 91]
    age3: '', // [cite: 91]

    // මූල්ය සහ සාක්ෂි
    initialDeposit: '' // [cite: 118]
  });

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (name === 'clientType') {
      setClientType(value);
      setAccountMode('single');
      setFormData(prev => ({
        ...prev,
        accountMode: 'single',
        accountType: value === 'adult' ? 'samanaya' : 'arunalu'
      }));
    }
  };

  const formRef = React.useRef<HTMLFormElement>(null);
  const [alertConfig, setAlertConfig] = useState<{message: string, isSuccess?: boolean, onCloseAction?: () => void} | null>(null);

  const nextStep = () => {
    if (formRef.current && !formRef.current.reportValidity()) {
      return;
    }
    if (step === 2 && !formData.memberId1) {
      setAlertConfig({ message: 'කරුණාකර ඉහළින් ඇති සෙවුම භාවිතයෙන් සාමාජිකයෙකු තෝරන්න (Please search and select a member first).' });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignaturePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.memberId1) {
      setAlertConfig({ message: 'කරුණාකර පළමුව අයදුම්කරු තෝරන්න (Please search and select the applicant first).' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const accountData = {
        memberId: formData.memberId1,
        accountNumber: formData.accountNumber, // Submitted by user
        openedDate: formData.openedDate,
        accountType: formData.accountType,
        initialDeposit: parseFloat(formData.initialDeposit) || 0,
        childName: clientType === 'child' ? formData.fullName1 : undefined,
        childBirthCertificate: clientType === 'child' ? formData.idNumber1 : undefined,
        childDateOfBirth: clientType === 'child' ? formData.dob1 : undefined,
        memberId2: formData.memberId2 || undefined,
        memberId3: formData.memberId3 || undefined,
        accountMode: formData.accountMode,
        modeOfOperation: formData.modeOfOperation,
        occupation1: formData.occupation1 || undefined,
        occupation2: formData.occupation2 || undefined,
        occupation3: formData.occupation3 || undefined,
        witnessName: formData.witnessName,
        witnessAddress: formData.witnessAddress,
        specimenSignature: signaturePreview || undefined
      };

      const res = await AccountService.openAccount(accountData);
      console.log('Account created:', res);
      
      const accountTypeNames: Record<string, string> = {
        samanaya: 'සාමාන්ය ඉතුරුම් (Normal Savings)',
        janasetha: 'ජනසෙත (Janasetha)',
        dhana_yojana: 'ධන යෝජනා (Dhana Yojana)',
        vandana: 'වන්දනා (Vandana)',
        arunalu: 'අරුණලු (Arunalu Minor Savings)',
        ranthilina: 'රන්තිලින (Ranthilina Minor Savings)'
      };
      const schemeName = accountTypeNames[formData.accountType] || formData.accountType;

      setAlertConfig({ 
        message: `ගිණුම සාර්ථකව පද්ධතියට ඇතුළත් කරන ලදී! ගිණුම් අංකය: ${formData.accountNumber} | ගිණුම් වර්ගය (Scheme): ${schemeName}`, 
        isSuccess: true, 
        onCloseAction: () => { if (onClose) onClose(); } 
      });
      
    } catch (err: any) {
      console.error(err);
      setAlertConfig({ message: 'ගිණුම විවෘත කිරීමේදී දෝෂයක් මතු විය (Error creating account): ' + (err.response?.data || err.message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white overflow-hidden border-0 mt-0 font-sans rounded-2xl flex flex-col min-h-[85vh] max-h-[90vh]">
      
      {/* Header */}
      <div className="bg-[#025a4e] text-white p-5 border-b-4 border-amber-500 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-emerald-200/80 mb-1 font-semibold">විවිධ සේවා සමුපකාර සමිතිය</p>
            <h2 className="text-xl font-bold tracking-wide flex items-center gap-4">
              මුදල් ඉතිරිකිරීමේ තැන්පත් ගිණුම් පෝරමය
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${isSocietyMember ? 'bg-emerald-500 text-white border border-emerald-400' : 'bg-amber-500 text-[#01443b] border border-amber-400'}`}>
                {isSocietyMember ? 'සමාජික ගිණුමක්' : 'සමාජික නොවන ගිණුමක්'}
              </span>
            </h2>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-right bg-[#01443b] p-2 rounded-lg border border-emerald-700 text-xs shadow-inner">
              <div className="font-mono font-bold text-amber-400 text-[13px]">ආ. ප. 1108</div>
              <div>දිනය: {formData.date}</div>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full transition-colors group">
                <X size={20} className="text-white group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0 shadow-sm z-10 relative">
        <div className={`flex items-center whitespace-nowrap ${step >= 1 ? 'text-[#025a4e]' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 1 ? 'border-[#025a4e] bg-[#025a4e] text-white shadow-md' : 'border-gray-300'}`}>1</span>
          ආයතනික
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-2 hidden sm:block">
          <div className="h-full bg-[#025a4e] transition-all duration-500" style={{ width: step > 1 ? '100%' : '0%' }}></div>
        </div>
        <div className={`flex items-center whitespace-nowrap ${step >= 2 ? 'text-[#025a4e]' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 2 ? 'border-[#025a4e] bg-[#025a4e] text-white shadow-md' : 'border-gray-300'}`}>2</span>
          අයදුම්කරු
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-2 hidden sm:block">
          <div className="h-full bg-[#025a4e] transition-all duration-500" style={{ width: step > 2 ? '100%' : '0%' }}></div>
        </div>
        <div className={`flex items-center whitespace-nowrap ${step >= 3 ? 'text-[#025a4e]' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 3 ? 'border-[#025a4e] bg-[#025a4e] text-white shadow-md' : 'border-gray-300'}`}>3</span>
          සාක්ෂි
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-2 hidden sm:block">
          <div className="h-full bg-[#025a4e] transition-all duration-500" style={{ width: step > 3 ? '100%' : '0%' }}></div>
        </div>
        <div className={`flex items-center whitespace-nowrap ${step >= 4 ? 'text-[#025a4e]' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mr-2 ${step >= 4 ? 'border-[#025a4e] bg-[#025a4e] text-white shadow-md' : 'border-gray-300'}`}>4</span>
          තැන්පතු
        </div>
      </div>

      {/* Form Details with Scroll */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <form ref={formRef} onSubmit={handleSubmit} className="p-8 max-w-5xl mx-auto">
        
        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-gray-700 border-b pb-1.5">ගිණුම් වර්ගීකරණය</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">අයදුම්කරුගේ වර්ගය (Client Type)</label>
                <div className="flex gap-4">
                  <label className="flex items-center bg-gray-50 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-100">
                    <input type="radio" name="clientType" value="adult" checked={clientType === 'adult'} onChange={handleInputChange} className="text-[#025a4e] focus:ring-[#025a4e]" />
                    <span className="ml-2 text-sm text-gray-700 font-medium">වැඩිහිටි (Adult)</span>
                  </label>
                  <label className="flex items-center bg-gray-50 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-100">
                    <input type="radio" name="clientType" value="child" checked={clientType === 'child'} onChange={handleInputChange} className="text-[#025a4e] focus:ring-[#025a4e]" />
                    <span className="ml-2 text-sm text-gray-700 font-medium">ළමා (Child)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ගිණුම් ස්වභාවය (Account Mode)</label>
                <select name="accountMode" value={formData.accountMode} onChange={(e) => { handleInputChange(e); setAccountMode(e.target.value); }} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" disabled={clientType === 'child'}>
                  <option value="single">තනි ගිණුමක් (Single Account)</option>
                  <option value="joint">හවුල් ගිණුමක් (Joint Account)</option>
                </select>
                {clientType === 'child' && <p className="text-xs text-amber-600 mt-1">ළමා ගිණුම් හවුල් ගිණුම් ලෙස විවෘත කළ නොහැක.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ගිණුම් අංකය (Account Number)</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} placeholder="උදා: ACC-123456" className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ගිණුම ආරම්භ කළ දිනය (Opened Date)</label>
                <input type="date" name="openedDate" value={formData.openedDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
              </div>


            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Search Applicant Top Bar */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 shadow-sm relative">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Search size={16} /> 
                {isSocietyMember ? 'සාමාජිකයෙකු සොයන්න (Search Member)' : 'පුද්ගලයෙකු සොයන්න (Search Non-Member)'}
              </h3>
              <div className="flex gap-3 relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder={clientType === 'child' ? "උප්පැන්න සහතික අංකය / නම / සාමාජික අංකය..." : "ජා.හැ.අ (NIC) / නම / සාමාජික අංකය..."} 

                  className="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                <button 
                  type="button" 
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  සොයන්න
                </button>
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-blue-100 z-50 max-h-60 overflow-y-auto overflow-hidden">
                  <div className="p-2 bg-slate-50 border-b border-gray-100 text-xs font-semibold text-gray-500 flex justify-between">
                    <span>ප්‍රතිඵල {searchResults.filter(m => clientType === 'child' ? m.ageCategory === 'CHILD' : m.ageCategory !== 'CHILD').length} ක් හමුවිය</span>
                    <button type="button" onClick={() => setSearchResults([])} className="text-red-500 hover:underline">වසන්න</button>
                  </div>
                  {searchResults.filter(m => clientType === 'child' ? m.ageCategory === 'CHILD' : m.ageCategory !== 'CHILD').map((result) => (
                    <button 
                      key={result.memberId}
                      type="button"
                      onClick={() => selectApplicant(result, 1)}
                      className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="font-semibold text-sm text-gray-800">{result.fullName || result.fullNameSinhala}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">NIC/BC: {result.nic}</span>
                        {result.membershipNumber && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Mem No: {result.membershipNumber}</span>}
                        <span className="truncate flex-1">{result.address}</span>
                      </div>
                    </button>
                  ))}
                  {searchResults.filter(m => clientType === 'child' ? m.ageCategory === 'CHILD' : m.ageCategory !== 'CHILD').length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {clientType === 'child' ? 'ළමා ගිණුම් සඳහා ගැලපෙන ප්‍රතිඵල නොමැත.' : 'වැඩිහිටි ගිණුම් සඳහා ගැලපෙන ප්‍රතිඵල නොමැත.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 1 වන අයදුම්කරු */}
            <div className="border border-gray-200 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-[#025a4e] border-b pb-1 uppercase tracking-wider">
                {clientType === 'adult' ? '1. පළමුවන අයදුම්කරුගේ විස්තර' : '1. දරුවාගේ (Minor) මූලික විස්තර'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">නම සම්පූර්ණයෙන් (Full Name)</label>
                  <input type="text" name="fullName1" value={formData.fullName1} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                </div>
                {clientType === 'child' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">උපන් දිනය (DOB)</label>
                    <input type="date" name="dob1" value={formData.dob1} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">වයස (Age)</label>
                  <input type="number" name="age1" value={formData.age1} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {clientType === 'adult' ? 'පුරවැසි හැඳුනුම්පත් අංකය (NIC No)' : 'උප්පැන්න සහතිකයේ ලියාපදිංචි අංකය'}
                  </label>
                  <input type="text" name="idNumber1" value={formData.idNumber1} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">රක්ෂාව (Occupation)</label>
                  <input type="text" name="occupation1" value={formData.occupation1} onChange={handleInputChange} placeholder={clientType === 'child' ? 'ඉගෙනුම ලබයි' : ''} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ලිපිනය (Address)</label>
                  <input type="text" name="address1" value={formData.address1} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                </div>
              </div>
            </div>

            {/* 2 වන අයදුම්කරු (පෙන්වන්නේ Joint නම් හෝ Child Account එකක් නම් පමණි) */}
            {(accountMode === 'joint' || clientType === 'child') && (
              <div className="border border-gray-200 p-4 rounded-xl space-y-4 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-700 border-b pb-1 uppercase tracking-wider">
                  {clientType === 'child' ? '2. මව/පිය හෝ නීත්යානුකූල භාරකරුගේ විස්තර (Guardian)' : '2. දෙවන අයදුම්කරුගේ විස්තර'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">නම සම්පූර්ණයෙන්</label>
                    <input type="text" name="fullName2" value={formData.fullName2} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">පුරවැසි හැඳුනුම්පත් අංකය (NIC)</label>
                    <input type="text" name="idNumber2" value={formData.idNumber2} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">රක්ෂාව සහ වයස</label>
                    <div className="flex gap-2">
                      <input type="text" name="occupation2" placeholder="රක්ෂාව" value={formData.occupation2} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                      <input type="number" name="age2" placeholder="වයස" value={formData.age2} onChange={handleInputChange} className="w-24 border border-gray-300 rounded-lg p-2 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">ලිපිනය</label>
                    <input type="text" name="address2" value={formData.address2} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                  </div>
                </div>
              </div>
            )}

            {/* 3 වන අයදුම්කරු (පෙන්වන්නේ Joint නම් පමණි) */}
            {accountMode === 'joint' && (
              <div className="border border-gray-200 p-4 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-600 border-b pb-1 uppercase tracking-wider">3. තෙවන අයදුම්කරුගේ විස්තර (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">නම සම්පූර්ණයෙන්</label>
                    <input type="text" name="fullName3" value={formData.fullName3} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">පුරවැසි හැඳුනුම්පත් අංකය (NIC)</label>
                    <input type="text" name="idNumber3" value={formData.idNumber3} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">රක්ෂාව සහ වයස</label>
                    <div className="flex gap-2">
                      <input type="text" name="occupation3" placeholder="රක්ෂාව" value={formData.occupation3} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" />
                      <input type="number" name="age3" placeholder="වයස" value={formData.age3} onChange={handleInputChange} className="w-24 border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">ලිපිනය</label>
                    <input type="text" name="address3" value={formData.address3} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-[#025a4e] focus:border-[#025a4e]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="space-y-6">
            {/* මුදල් ආපසු ගැනීමේ කොන්දේසි */}
            <div className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">මුදල් ආපසු ලබාගැනීමේ රීති (Mode of Operation)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">මුදල් ආපසු ලබාගන්නේ කවුරුන් විසින්ද?</label>
                <select name="modeOfOperation" value={formData.modeOfOperation} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]">
                  {accountMode === 'single' ? (
                    <option value="self">තනිවම (ගිණුම්හිමියා / භාරකරු විසින් පමණි)</option>
                  ) : (
                    <>
                      <option value="any_one">අපෙන් එක්කෙනෙකු (Anyone)</option>
                      <option value="all_joint">අප (සියලු දෙනාම එක්ව අත්සන් තබා)</option>
                      <option value="joint_three">අපෙන් තිදෙනෙකු (All Three Signatures)</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-tight">
                  * අපෙන් කවරෙකු වුවද මිය ගිය විට ඒ මියගිය තැනැත්තාගේ නියෝජිතයන්ගෙන් කරුණු නොවිමසා ගිණුමෙහි ශේෂව ඇති මුදල ජීවත්ව සිටින අයට ගෙවීමට මෙයින් එකඟ වේ.
                </p>
              </div>
            </div>

            {/* සාක්ෂිකරු සහ අත්සන් (Witness & Signatures) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* සාක්ෂිකරුගේ කොටස (Witness Section) */}
              <div className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">සාක්ෂිකරුගේ විස්තර (Witness)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">සාක්ෂිකරුගේ නම</label>
                    <input type="text" name="witnessName" value={formData.witnessName || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">ලිපිනය (හෝ සාමාජික අංකය)</label>
                    <input type="text" name="witnessAddress" value={formData.witnessAddress || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic leading-tight">
                  * (සාමදාන විනිශ්චයකාර / ශ්‍රේෂ්ඨාධිකරණයේ පෙරකදෝරු / ප්‍රසිද්ධ නොතාරිස් හෝ සමිතියේ සාමාජිකයෙක් විය යුතුය)
                </p>
              </div>

              {/* අයදුම්කරුගේ අත්සන (Specimen Signature Section) */}
              <div className="border border-gray-200 p-4 rounded-xl bg-gray-50/50 flex flex-col space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider w-full text-left">අයදුම්කරුගේ අත්සන (Specimen Signature)</h3>
                
                <div className="w-full flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white p-3 relative overflow-hidden">
                  {signaturePreview ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative group">
                      <img src={signaturePreview} alt="Signature Preview" className="max-h-24 max-w-full object-contain" />
                      <button 
                        type="button" 
                        onClick={() => setSignaturePreview(null)}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Remove Signature"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mt-1">
                        <button type="button" className="px-3 py-1.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded hover:bg-gray-300 transition-colors">
                          ස්කෑන් (Scan)
                        </button>
                        <label className="cursor-pointer px-3 py-1.5 bg-[#025a4e]/10 text-[#025a4e] text-[10px] font-bold rounded border border-[#025a4e]/20 hover:bg-[#025a4e]/20 transition-colors inline-block text-center">
                          පින්තූරයක් (Upload)
                          <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                        </label>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* බදු ආකෘති පත්‍රය (Tax Form) */}
            <div className="border border-amber-100 p-4 rounded-xl bg-amber-50/50 mt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="hasSubmittedTaxForm"
                  checked={formData.hasSubmittedTaxForm}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" 
                />
                <span className="text-sm font-bold text-amber-900">බදු ආකෘති පත්‍රය ලබා දී ඇත (Tax form submitted) - <i>නොමැති නම් 10% ක WHT බද්දක් අය කෙරේ</i></span>
              </label>
            </div>
          </div>
        )}

        {/* ================= STEP 4 ================= */}
        {step === 4 && (
          <div className="space-y-6">
            {/* මූල්ය තැන්පතු */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-200 p-4 rounded-xl bg-gray-50">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ප්‍රථම තැන්පතු මුදල (Initial Deposit - LKR)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-600 font-bold sm:text-sm">රු.</span>
                  </div>
                  <input type="number" name="initialDeposit" value={formData.initialDeposit} onChange={handleInputChange} placeholder="0.00" className="w-full border border-gray-300 rounded-lg pl-9 p-2 text-sm font-bold text-gray-900 focus:ring-[#025a4e] focus:border-[#025a4e]" required />
                </div>
              </div>
            </div>

            {/* ඉතුරුම් ගිණුම් වර්ගය */}
            <div className="border border-gray-200 p-4 rounded-xl space-y-2 bg-emerald-50/30">
              <label className="block text-sm font-medium text-gray-700 mb-2">ඉතුරුම් ගිණුම් වර්ගය (Savings Account Type)</label>
              <select name="accountType" value={formData.accountType} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-[#025a4e] focus:border-[#025a4e]">
                {clientType === 'adult' ? (
                  <>
                    <option value="samanaya">සාමාන්ය ඉතුරුම් (Normal Savings)</option>
                    <option value="janasetha">ජනසෙත (Janasetha)</option>
                    <option value="dhana_yojana">ධන යෝජනා (Dhana Yojana)</option>
                    <option value="vandana">වන්දනා (Vandana)</option>
                  </>
                ) : (
                  <>
                    <option value="arunalu">අරුණලු (Arunalu Minor Savings)</option>
                    <option value="ranthilina">රන්තිලින (Ranthilina Minor Savings)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-5 mt-6">
          <button type="button" onClick={prevStep} disabled={step === 1} className={`px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}>
            පසුපසට (Back)
          </button>

          {step < 4 ? (
            <button type="button" onClick={nextStep} className="px-5 py-2 text-xs font-semibold rounded-lg text-white bg-[#025a4e] hover:bg-[#01443b] transition">
              ඉදිරියට (Next)
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:bg-emerald-400">
              {isSubmitting ? 'ගිණුම සකසමින් පවතී...' : 'ගිණුම විවෘත කරන්න (Open Account)'}
            </button>
          )}
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
                හරි (OK)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAccountForm;
