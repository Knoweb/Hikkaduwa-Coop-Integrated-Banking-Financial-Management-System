import React, { useState, useEffect, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { User, Shield, Landmark, ClipboardCheck, ChevronRight, ChevronLeft, Save, AlertTriangle } from 'lucide-react';
import { applyForLoan } from '../services/loan.service';
import { searchMembers, getAccounts } from '../services/account.service';
import * as AuthService from '../services/auth.service';
import { useLanguage } from '../context/LanguageContext';
const isValidNIC = (nic: string): boolean => {
  if (!nic) return false;
  const clean = nic.trim();
  return /^[0-9]{9}[vVxX]$/.test(clean) || /^[0-9]{12}$/.test(clean);
};


interface NormalLoanFormProps {
  loanTypeId: string;
  onClose: () => void;
}

export default function NormalLoanForm({ loanTypeId, onClose }: NormalLoanFormProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  useEffect(() => {
    // Generate application number on mount
    const user = AuthService.getCurrentUser();
    const tenantId = user?.tenantId || '1';
    const branchId = user?.branchId || '1';
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newAppNumber = `${tenantId}/${branchId}/LN${randomSuffix}`;
    setFormData(prev => ({ ...prev, applicationNumber: newAppNumber }));
  }, []);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' });
  
  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
  
    setSnackbar({ open: true, message, severity });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [memberId, setMemberId] = useState('00000000-0000-0000-0000-000000000000');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: මූලික තොරතුරු
    applicationNumber: '',
    accountNumber: '',
    appliedDate: new Date().toLocaleDateString('en-CA'),
    applicantName: '',
    addressLine1: '',
    addressLine2: '',
    branch: '',
    sharesObtained: '',
    dob: '',
    gender: '',
    civilStatus: '',
    nic: '',
    phone: '',
    memberNo: '',
    residencePeriod: '',
    isMemberOfOtherCoop: '',
    otherCoopDetails: '',
    
    // Step 2: ණය මුදල සහ ආර්ථික තොරතුරු
    guarantorOfOtherLoan1: '',
    guarantorOfOtherLoan2: '',
    requiredLoanCash: '',
    requiredLoanGoods: '',
    loanPurpose: '',
    repaymentPeriodMonths: '',
    repaymentMethod: 'FIELD_COLLECTION',
    primaryJob: '',
    employerDetails: '',
    spouseJobTitle: '',
    spouseEmployerDetails: '',
    headOfHouseholdName: '',
    dependentsCount: '',

    // Step 3: වත්කම්, වියදම් සහ පවුලේ විස්තර
    familyMembers: [{ name: '', age: '', relation: '', job: '' }],
    assets: { landGoda: '', landMada: '', vehicles: '', animals: '', other: '' },
    bankAccounts: {
      current: { branch: '', accNo: '', balance: '' },
      dhanaYojana: { branch: '', accNo: '', balance: '' },
      savings: { branch: '', accNo: '', balance: '' },
      fixed: { branch: '', accNo: '', balance: '' }
    },
    annualIncomePrimary: '',
    annualIncomeOther: '',
    annualExpense: '',
    existingLoansCoop: '',
    existingLoansOther: '',

    // Step 4: ඇපකරුවන්ගේ විස්තර
    guarantor1: { name: '', address: '', nic: '', dob: '', memberNo: '', job: '', phone: '', family: [{ name: '', age: '', relation: '', job: '' }], assets: { land: '', vehicles: '', animals: '', other: '' }, bank: { dhanaYojana: '', savings: '', fixed: '' }, incomePrimary: '', incomeOther: '', digitalSignatureUrl: '' },
    guarantor2: { name: '', address: '', nic: '', dob: '', memberNo: '', job: '', phone: '', family: [{ name: '', age: '', relation: '', job: '' }], assets: { land: '', vehicles: '', animals: '', other: '' }, bank: { dhanaYojana: '', savings: '', fixed: '' }, incomePrimary: '', incomeOther: '', digitalSignatureUrl: '' },
  });

  const handleInputChange = (e: any, section: string | null = null, subSection: string | null = null) => {
  
    const { name, value } = e.target;
    if (subSection) {
      setFormData((prev: any) => ({
        ...prev,
        [section as string]: { ...prev[section as string], [subSection]: { ...prev[section as string][subSection], [name]: value } }
      }));
    } else if (section) {
      setFormData((prev: any) => ({
        ...prev,
        [section]: { ...prev[section], [name]: value }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleGuarantorChange = (gKey: string, name: string, value: string, section: string | null = null) => {
  
    setFormData((prev: any) => {
      const updatedGuarantor = { ...prev[gKey] };
      if (section) {
        updatedGuarantor[section] = { ...updatedGuarantor[section], [name]: value };
      } else {
        updatedGuarantor[name] = value;
      }
      return { ...prev, [gKey]: updatedGuarantor };
    });
  };

  const validateStep = (step: number) => {
  
    if (step === 1) {
      if (!formData.appliedDate || !formData.applicantName || !formData.nic || !formData.phone || !formData.memberNo) {
        showMessage('කරුණාකර සියලුම අත්‍යවශ්‍ය මූලික තොරතුරු සහ අයදුම් කළ දිනය පුරවන්න. (Please fill all essential basic details including Applied Date)', 'warning');
        return false;
      }
      if (!isValidNIC(formData.nic)) {
        showMessage('ඉල්ලුම්කරුගේ ජාතික හැඳුනුම්පත් අංකය (NIC) වැරදියි. (අංක 9ක් සමග V/X හෝ අංක 12ක් විය යුතුය)', 'warning');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.requiredLoanCash && !formData.requiredLoanGoods) {
        showMessage('කරුණාකර ණය මුදල ඇතුළත් කරන්න. (Please enter the required loan amount)', 'warning');
        return false;
      }
      if (!formData.repaymentPeriodMonths) {
        showMessage('කරුණාකර ආපසු ගෙවීමේ කාලය ඇතුළත් කරන්න. (Please enter the repayment period)', 'warning');
        return false;
      }
      if (!formData.loanPurpose) {
        showMessage('කරුණාකර ණය ලබාගන්නා අරමුණ ඇතුළත් කරන්න. (Please enter loan purpose)', 'warning');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.annualIncomePrimary && !formData.annualIncomeOther) {
        showMessage('කරුණාකර වාර්ෂික ආදායම ඇතුළත් කරන්න. (Please enter at least one annual income source)', 'warning');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
  
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Live DB NIC lookup for Applicant
  const [applicantDbStatus, setApplicantDbStatus] = useState<{ checking: boolean; foundMember: any | null }>({ checking: false, foundMember: null });

  // Live DB NIC lookup for Guarantors
  const [guarantorDbStatus, setGuarantorDbStatus] = useState<{ [key: string]: { checking: boolean; foundMember: any | null } }>({
    guarantor1: { checking: false, foundMember: null },
    guarantor2: { checking: false, foundMember: null },
  });

  useEffect(() => {
    if (isValidNIC(formData.nic)) {
      setApplicantDbStatus(prev => ({ ...prev, checking: true }));
      const timer = setTimeout(async () => {
        try {
          const results = await searchMembers(formData.nic);
          const match = results?.find((m: any) => m.nic?.toLowerCase() === formData.nic.toLowerCase());
          setApplicantDbStatus({ checking: false, foundMember: match || null });
        } catch {
          setApplicantDbStatus({ checking: false, foundMember: null });
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setApplicantDbStatus({ checking: false, foundMember: null });
    }
  }, [formData.nic]);

  useEffect(() => {
    ['guarantor1', 'guarantor2'].forEach(gKey => {
      const gNic = (formData as any)[gKey]?.nic;
      if (isValidNIC(gNic)) {
        setGuarantorDbStatus(prev => ({ ...prev, [gKey]: { ...prev[gKey], checking: true } }));
        const timer = setTimeout(async () => {
          try {
            const results = await searchMembers(gNic);
            const match = results?.find((m: any) => m.nic?.toLowerCase() === gNic.toLowerCase());
            if (match) {
              setFormData((prev: any) => ({
                ...prev,
                [gKey]: {
                  ...prev[gKey],
                  name: prev[gKey].name || match.fullName || match.nameWithInitials || '',
                  address: prev[gKey].address || match.address || '',
                  memberNo: prev[gKey].memberNo || match.membershipNumber || '',
                  phone: prev[gKey].phone || match.contactNumber || '',
                  dob: prev[gKey].dob || match.dateOfBirth || '',
                  job: prev[gKey].job || match.occupation || '',
                }
              }));
            }
            setGuarantorDbStatus(prev => ({ ...prev, [gKey]: { checking: false, foundMember: match || null } }));
          } catch {
            setGuarantorDbStatus(prev => ({ ...prev, [gKey]: { checking: false, foundMember: null } }));
          }
        }, 400);
        return () => clearTimeout(timer);
      } else {
        setGuarantorDbStatus(prev => ({ ...prev, [gKey]: { checking: false, foundMember: null } }));
      }
    });
  }, [formData.guarantor1?.nic, formData.guarantor2?.nic]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0 && showDropdown) {
        setIsSearching(true);
        try {
          const results = await searchMembers(searchQuery);
          setSearchResults(results || []);
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showDropdown]);

  // Auto-calculate total annual expense when primary and other incomes change
  useEffect(() => {
    const primary = Number(formData.annualIncomePrimary || 0);
    const other = Number(formData.annualIncomeOther || 0);
    const total = primary + other;
    setFormData(prev => {
      if (Number(prev.annualExpense) !== total) {
        return { ...prev, annualExpense: total.toString() };
      }
      return prev;
    });
  }, [formData.annualIncomePrimary, formData.annualIncomeOther]);

  const selectMember = async (member: any) => {
    setSearchQuery(member.membershipNumber || member.nic || '');
    setShowDropdown(false);
    const mid = member.memberId || '00000000-0000-0000-0000-000000000000';
    setMemberId(mid);

    const baseUpdate: any = {
      applicantName: member.fullName || '',
      addressLine1: member.address || '',
      dob: member.dateOfBirth || '',
      gender: ['M', 'MALE'].includes(member.gender?.toUpperCase()) ? 'පුරුෂ' : ['F', 'FEMALE'].includes(member.gender?.toUpperCase()) ? 'ස්ත්‍රී' : '',
      civilStatus: ['MARRIED', 'විවාහක'].includes(member.maritalStatus?.toUpperCase()) ? 'විවාහක' : 'අවිවාහක',
      nic: member.nic || '',
      phone: member.contactNumber || '',
      memberNo: member.membershipNumber || '',
      isMemberOfOtherCoop: member.belongsToOtherSociety ? 'ඔව්' : 'නැත',
      otherCoopDetails: member.otherSocietyName || '',
    };

    // Auto-populate savings account details from savings-service
    try {
      const allAccounts = await getAccounts();
      const memberAccounts = allAccounts.filter(
        (acc: any) => acc.memberId === mid && acc.status === 'ACTIVE'
      );
      const savingsAcc = memberAccounts.find(
        (a: any) => ['NORMAL', 'JANASETHA', 'VANDANA', 'ARUNALU', 'RANTHILINA'].includes((a.accountType || '').toUpperCase())
      );
      const dyAcc = memberAccounts.find(
        (a: any) => (a.accountType || '').toUpperCase() === 'DHANA_YOJANA'
      );

      baseUpdate.bankAccounts = {
        current:     { branch: '', accNo: '', balance: '' },
        dhanaYojana: {
          branch:  dyAcc ? 'ශාඛාව' : '',
          accNo:   dyAcc?.accountNumber || '',
          balance: dyAcc ? String(dyAcc.balance) : ''
        },
        savings: {
          branch:  savingsAcc ? 'ශාඛාව' : '',
          accNo:   savingsAcc?.accountNumber || '',
          balance: savingsAcc ? String(savingsAcc.balance) : ''
        },
        fixed: { branch: '', accNo: '', balance: '' },
      };
    } catch {
      // silently skip if accounts fetch fails
    }

    setFormData(prev => ({ ...prev, ...baseUpdate }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
       return;
    }
    if (!formData.guarantor1.name || !formData.guarantor1.nic || !formData.guarantor2.name || !formData.guarantor2.nic) {
        showMessage('කරුණාකර ඇපකරුවන් දෙදෙනාගේම අත්‍යවශ්‍ය විස්තර පුරවන්න. (Please fill essential details for both guarantors)', 'warning');
        return;
    }
    if (!isValidNIC(formData.guarantor1.nic)) {
        showMessage('පළමු ඇපකරුගේ ජාතික හැඳුනුම්පත් අංකය (NIC) වැරදියි. (9 V/X හෝ ඉලක්කම් 12 විය යුතුය)', 'warning');
        return;
    }
    if (!isValidNIC(formData.guarantor2.nic)) {
        showMessage('දෙවන ඇපකරුගේ ජාතික හැඳුනුම්පත් අංකය (NIC) වැරදියි. (9 V/X හෝ ඉලක්කම් 12 විය යුතුය)', 'warning');
        return;
    }
    
    setLoading(true);
    try {
        const totalAmount = Number(formData.requiredLoanCash || 0) + Number(formData.requiredLoanGoods || 0);
        const currentUser = AuthService.getCurrentUser();
        const branchIdRaw = currentUser?.branchId;
        const parsedBranchId = typeof branchIdRaw === 'string' ? parseInt(branchIdRaw, 10) : branchIdRaw;

        const payload = {
            memberId: memberId,
            requestedAmount: totalAmount,
            termMonths: parseInt(formData.repaymentPeriodMonths || '12'),
            branchId: parsedBranchId || 1,
            appliedDate: formData.appliedDate,
            applicationNumber: formData.applicationNumber,
            repaymentMethod: formData.repaymentMethod,
            applicationData: formData
        };

        await applyForLoan(loanTypeId, payload);
        showMessage('ණය ඉල්ලුම් පත්රය සාර්ථකව පද්ධතියට ඇතුළත් කරන ලදී!', 'success');
        setTimeout(() => onClose(), 2000);
    } catch (error: any) {
        console.error("Error submitting loan application", error);
        if (error.response && error.response.data) {
            const errorMsg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
            showMessage(`දෝෂයක්! ${errorMsg}`, 'error');
        } else {
            showMessage("දෝෂයක්! කරුණාකර නැවත උත්සාහ කරන්න.", 'error');
        }
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
      
      {/* Form Header */}
      <div className="bg-gradient-to-r border-b border-emerald-600 bg-emerald-700 p-6 text-white text-center shrink-0">
        <p className="text-sm font-semibold tracking-wider uppercase opacity-90">{t(`සී/ස විවිධ සේවා සමුපකාර සමිතිය | ග්රාමීය බැංකුව`)}</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{t(`ණය යෝජනා ඉල්ලුම් පත්රය`)}</h1>
      </div>

      {/* Stepper Progress Bar */}
      <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 hidden sm:block shrink-0">
        <div className="flex justify-between items-center">
          {[
            { step: 1, label: 'මූලික තොරතුරු', icon: User },
            { step: 2, label: 'ණය සහ ආර්ථිකය', icon: Landmark },
            { step: 3, label: 'වත්කම් සහ වියදම්', icon: ClipboardCheck },
            { step: 4, label: 'ඇපකරුවන්ගේ විස්තර', icon: Shield }
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${currentStep === s.step ? 'bg-emerald-600 border-emerald-600 text-white' : currentStep > s.step ? 'bg-emerald-100 border-emerald-600 text-emerald-700' : 'bg-white border-slate-300 text-slate-400'}`}>
                    {s.step}
                  </div>
                  <span className={`text-xs font-medium ${currentStep === s.step ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>{s.label}</span>
                </div>
                {s.step < 4 && <div className={`flex-1 h-[2px] mx-4 ${currentStep > s.step ? 'bg-emerald-500' : 'bg-slate-300'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="sm:hidden p-4 bg-slate-100 text-center font-semibold text-emerald-700 text-sm border-b border-slate-200 shrink-0">
        පියවර {currentStep} න් 4 : {['මූලික තොරතුරු', 'ණය සහ ආර්ථිකය', 'වත්කම් සහ වියදම්', 'ඇපකරුවන්ගේ විස්තර'][currentStep - 1]}
      </div>

      {/* Form Content Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-6 sm:p-10 space-y-8 max-w-5xl mx-auto">
          
          {/* STEP 1: මූලික තොරතුරු */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-100/50 shadow-sm relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-yellow-900 mb-2">{t(`අයදුම්පත් අංකය (Application No)`)}</label>
                  <input 
                    type="text" 
                    disabled
                    value={formData.applicationNumber}
                    className="w-full rounded-lg border-yellow-200 p-3 border bg-yellow-100/50 shadow-sm text-yellow-900 font-bold cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-yellow-900 mb-2">{t(`ගිණුම ආරම්භ කළ දිනය / අයදුම් කළ දිනය (Applied Date)`)}<span className="text-red-500 font-bold">*</span></label>
                  <input 
                    type="date" 
                    required
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                    className="w-full rounded-lg border-yellow-200 p-3 border focus:ring-2 focus:ring-yellow-500 bg-white shadow-sm" 
                  />
                  {formData.appliedDate && formData.appliedDate !== new Date().toLocaleDateString('en-CA') && (
                    <div className="mt-2 text-amber-700 bg-amber-50 p-2 rounded-lg text-xs font-semibold border border-amber-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
                      <span>{t(`ඔබ තෝරාගෙන ඇත්තේ අතීත දිනයකි. මෙය පැරණි දත්ත ඇතුලත් කිරීමක් බව තහවුරු කරගන්න.`)}</span>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><User size={22}/> {t(`01. ඉල්ලුම්කරුගේ මූලික තොරතුරු`)}</h2>
              
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col items-start shadow-sm relative">
                <label className="block text-sm font-bold text-emerald-900 mb-2">{t(`සාමාජික අංකය, ජා.හැ.ප අංකය හෝ නම (Member No, NIC or Name) ලබා දී සොයන්න`)}</label>
                <div className="w-full relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Enter ID or Name to auto-fill details..."
                    className="w-full rounded-lg border-emerald-200 p-3 border focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm" 
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3 text-emerald-500">
                       <span className="animate-spin inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"></span>
                    </div>
                  )}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {searchResults.map(member => (
                        <div 
                          key={member.memberId}
                          onClick={() => selectMember(member)}
                          className="px-4 py-3 border-b border-slate-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                        >
                          <div className="font-bold text-emerald-800">{member.membershipNumber} - {member.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">NIC: {member.nic} | දුරකථන: {member.contactNumber}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdown && searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-center text-slate-500">
                      {t(`සාමාජිකයෙකු සොයාගත නොහැකි විය. (Member not found)`)}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">{t(`01. ඉල්ලුම්කරුගේ සම්පූර්ණ නම / නම්`)}<span className="text-red-500 font-bold">*</span></label>
                  <input type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`02. ලිපිනය`)}</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t(`03. උපන් දිනය`)}</label>
                  <input type="date" name="dob" value={formData.dob} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`04. ස්ත්රී / පුරුෂ භාවය`)}</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500">
                    <option value="">{t(`තෝරන්න`)}</option>
                    <option value="පුරුෂ">{t(`පුරුෂ`)}</option>
                    <option value="ස්ත්රී">{t(`ස්ත්රී`)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`05. විවාහක / අවිවාහක බව`)}</label>
                  <select name="civilStatus" value={formData.civilStatus} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500">
                    <option value="">{t(`තෝරන්න`)}</option>
                    <option value="විවාහක">{t(`විවාහක`)}</option>
                    <option value="අවිවාහක">{t(`අවිවාහක`)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`06. ජාතික හැඳුනුම්පත් අංකය (NIC)`)}<span className="text-red-500 font-bold">*</span></label>
                  <input
                    type="text"
                    maxLength={12}
                    name="nic"
                    placeholder="e.g. 912345678V / 199123456789"
                    value={formData.nic}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^0-9VX]/g, '');
                      handleInputChange({ target: { name: 'nic', value: val } } as any);
                    }}
                    className={`w-full rounded-lg p-2.5 border transition-all ${
                      !formData.nic
                        ? 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                        : isValidNIC(formData.nic)
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 focus:ring-2 focus:ring-emerald-500 font-bold'
                        : 'border-red-500 bg-red-50/20 text-red-900 focus:ring-2 focus:ring-red-500 font-semibold'
                    }`}
                  />
                  {formData.nic && isValidNIC(formData.nic) && (
                    <div className="mt-1">
                      {applicantDbStatus.checking ? (
                        <p className="text-[11px] font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                          <span className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full inline-block"></span>
                          පද්ධතියේ සාමාජික දත්ත පරීක්ෂා කරමින්... (Checking Live DB...)
                        </p>
                      ) : applicantDbStatus.foundMember ? (
                        <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 flex items-center gap-1 mt-1">
                          ✓ පද්ධතියේ සිටින සාමාජිකයෙකි: <span className="underline">{applicantDbStatus.foundMember.fullName || applicantDbStatus.foundMember.nameWithInitials}</span> (අංකය: {applicantDbStatus.foundMember.membershipNumber})
                        </p>
                      ) : (
                        <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-center gap-1 mt-1">
                          ℹ️ පද්ධතියේ නොමැති/නව සාමාජික NIC එකකි (Unregistered NIC in DB)
                        </p>
                      )}
                    </div>
                  )}
                  {formData.nic && !isValidNIC(formData.nic) && (
                    <p className="text-[11px] font-bold text-red-600 mt-1">❌ ජාතික හැඳුනුම්පත් අංකය වැරදියි (9 V/X හෝ ඉලක්කම් 12 විය යුතුය)</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`07. දුරකථන අංකය`)}<span className="text-red-500 font-bold">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`08. සාමාජික අංකය`)}<span className="text-red-500 font-bold">*</span></label>
                  <input type="text" name="memberNo" value={formData.memberNo} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`09. සමිති බල ප්රදේශයේ පදිංචි කාලය (වසර)`)}</label>
                  <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="residencePeriod" value={formData.residencePeriod} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`10. වෙනත් සමූපකාර සමිතියක සාමාජිකයෙක්ද?`)}</label>
                  <select name="isMemberOfOtherCoop" value={formData.isMemberOfOtherCoop} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500">
                    <option value="">{t(`තෝරන්න`)}</option>
                    <option value="ඔව්">{t(`ඔව්`)}</option>
                    <option value="නැත">{t(`නැත`)}</option>
                  </select>
                </div>
                {formData.isMemberOfOtherCoop === 'ඔව්' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">{t(`එසේ නම් එහි නම සහ ලිපිනය`)}</label>
                    <textarea name="otherCoopDetails" value={formData.otherCoopDetails} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" rows={2}></textarea>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ණය මුදල සහ ආර්ථික තොරතුරු */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><Landmark size={22}/> {t(`02. ණය මුදල සහ ආර්ථික තොරතුරු`)}</h2>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-700">{t(`11. වෙනත් ණය වෙනුවෙන් ඇපවීම් (ඇත්නම් ණයකරුගේ නම)`)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" name="guarantorOfOtherLoan1" placeholder={t(`ණයකරු 01 නම`)} value={formData.guarantorOfOtherLoan1} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white focus:ring-2 focus:ring-emerald-500 text-sm" />
                  <input type="text" name="guarantorOfOtherLoan2" placeholder={t(`ණයකරු 02 නම`)} value={formData.guarantorOfOtherLoan2} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
              </div>

              <div className="bg-emerald-50/70 p-5 rounded-2xl border-2 border-emerald-200 shadow-sm relative overflow-hidden my-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl -mr-10 -mt-10 opacity-40 pointer-events-none"></div>
                <h3 className="text-sm font-bold text-emerald-800 mb-5 pb-3 border-b border-emerald-200 flex items-center gap-2">
                  <Landmark size={18}/> {t(`12. ණය මුදල සහ ගෙවීමේ කාලය`)}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Amount Details */}
                  <div className="space-y-4 bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t(`(අ) අවශ්‍ය ණය මුදලින් (රු.)`)}<span className="text-red-500 font-bold">*</span></label>
                      <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" name="requiredLoanCash" value={formData.requiredLoanCash} onChange={handleInputChange} placeholder="e.g. 50000" className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t(`(ආ) අවශ්‍ය ණය ද්‍රව්‍ය වලින් (රු.)`)}</label>
                      <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" name="requiredLoanGoods" value={formData.requiredLoanGoods} onChange={handleInputChange} placeholder="e.g. 0" className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800" />
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t(`එකතුව (Total Loan Amount)`)}</label>
                      <div className="w-full rounded-xl border border-emerald-300 p-3 bg-emerald-600 text-white font-bold text-xl text-right shadow-inner">
                        Rs. {(Number(formData.requiredLoanCash || 0) + Number(formData.requiredLoanGoods || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Duration and Purpose */}
                  <div className="space-y-5 bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                      <label className="block text-sm font-bold text-emerald-900 mb-2">{t(`14. ණය ආපසු ගෙවීමේ කාලය`)}<span className="text-red-500 font-bold">*</span> <span className="text-xs font-medium text-emerald-700 block mt-0.5">{t(`(මාසික වාරික සංඛ්‍යාව)`)}</span></label>
                      <div className="flex items-center gap-3">
                        <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} min="1" max="120" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault(); }} name="repaymentPeriodMonths" value={formData.repaymentPeriodMonths} onChange={handleInputChange} className="flex-1 rounded-xl border-emerald-400 p-3.5 text-2xl font-bold text-emerald-900 border-2 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-600 text-center shadow-inner" placeholder="0" />
                        <span className="text-sm font-bold text-emerald-800 bg-emerald-200/50 px-5 py-4 rounded-xl border border-emerald-300 shadow-sm whitespace-nowrap">
                          {(() => {
                            const m = parseInt(formData.repaymentPeriodMonths || '0');
                            if (m >= 12) {
                              const y = Math.floor(m / 12);
                              const remM = m % 12;
                              return `අවුරුදු ${y}${remM > 0 ? ` මාස ${remM}` : ''} (${y} Yr${y>1?'s':''}${remM > 0 ? ` ${remM} Mo` : ''})`;
                            }
                            return 'මාස (Months)';
                          })()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t(`13. ණය අවශ්‍ය කාරණය`)}<span className="text-red-500 font-bold">*</span></label>
                      <input type="text" name="loanPurpose" value={formData.loanPurpose} onChange={handleInputChange} placeholder={t(`උදා: ව්‍යාපාරයක් ආරම්භ කිරීමට`)} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t(`15. වාරික ගෙවීමේ ක්‍රමය`)}</label>
                      <select name="repaymentMethod" value={formData.repaymentMethod} onChange={handleInputChange} className="w-full rounded-lg border-emerald-300 p-2.5 border-2 focus:ring-2 focus:ring-emerald-500 bg-emerald-50 font-semibold text-emerald-900 text-sm">
                        <option value="FIELD_COLLECTION">{t(`ක්ෂේත්‍ර නිලධාරී හරහා නිවසට පැමිණ`)}</option>
                        <option value="BRANCH_TELLER">{t(`ශාඛාවට පැමිණ (Branch Visit)`)}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-700 border-b pb-1 mt-6">{t(`ණයකරුගේ ආර්ථික තොරතුරු`)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`01. ප්රධාන රැකියාව`)}</label>
                  <input type="text" name="primaryJob" value={formData.primaryJob} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`02. රැකියාව කරන ආයතනයේ නම හා ලිපිනය`)}</label>
                  <input type="text" name="employerDetails" value={formData.employerDetails} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`03. බිරිඳ/ස්වාමිපුරුෂයා රැකියාවක් කරන්නේ නම් තනතුර`)}</label>
                  <input type="text" name="spouseJobTitle" value={formData.spouseJobTitle} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`ආයතනයේ නම හා ලිපිනය (බිරිඳ/ස්වාමිපුරුෂයා)`)}</label>
                  <input type="text" name="spouseEmployerDetails" value={formData.spouseEmployerDetails} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`ගෘහ මූලිකයාගේ නම`)}</label>
                  <input type="text" name="headOfHouseholdName" value={formData.headOfHouseholdName} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`යැපෙන්නන්ගේ සංඛ්යාව`)}</label>
                  <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="dependentsCount" value={formData.dependentsCount} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: වත්කම්, වියදම් සහ පවුලේ විස්තර */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><ClipboardCheck size={22}/> {t(`03. වත්කම්, මූල්ය සහ වියදම් විස්තර`)}</h2>
              
              {/* 05. ස්ථිර වත්කම් */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">{t(`05. ස්ථිර වත්කම් (ණය ඉල්ලුම්කරු සතු ප්රමාණය හා වටිනාකම)`)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                  {['landGoda', 'landMada', 'vehicles', 'animals', 'other'].map((assetKey, idx) => {
                    const labels = ['ගොඩ ඉඩම්', 'මඩ ඉඩම්', 'රථ වාහන', 'සතුන්', 'වෙනත් වත්කම්'];
                    return (
                      <div key={assetKey} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">{labels[idx]}</label>
                        <input type="text" name={assetKey} placeholder={t(`ප්රමාණය සහ ඇස්තමේන්තුගත වටිනාකම`)} value={(formData.assets as any)[assetKey]} onChange={(e) => handleInputChange(e, 'assets')} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* බැංකු ගිණුම් විස්තර */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">{t(`මූල්ය වත්කම් (බැංකු සහ ආයතන ගිණුම් විස්තර)`)}</h3>
                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full text-left border-collapse bg-white text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                        <th className="p-3 border-r border-slate-300">{t(`ගිණුම් වර්ගය`)}</th>
                        <th className="p-3 border-r border-slate-300">{t(`ආයතනය`)}</th>
                        <th className="p-3 border-r border-slate-300">{t(`ගිණුම් අංකය`)}</th>
                        <th className="p-3">{t(`ශේෂය (රු.)`)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {[
                        { key: 'current', label: 'ජංගම ගිණුම්' },
                        { key: 'dhanaYojana', label: 'ධන යෝජනා ගිණුම්' },
                        { key: 'savings', label: 'ඉතිරි කිරීමේ ගිණුම්' },
                        { key: 'fixed', label: 'ස්ථාවර තැන්පත්' }
                      ].map((acc) => (
                        <tr key={acc.key} className="border-b border-slate-300 last:border-b-0">
                          <td className="p-3 font-medium bg-slate-50 border-r border-slate-300">{acc.label}</td>
                          <td className="p-2 border-r border-slate-300"><input type="text" name="branch" value={(formData.bankAccounts as any)[acc.key]?.branch || ''} onChange={(e) => handleInputChange(e, 'bankAccounts', acc.key)} className="w-full border border-slate-400 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-sm" /></td>
                          <td className="p-2 border-r border-slate-300"><input type="text" name="accNo" value={(formData.bankAccounts as any)[acc.key]?.accNo || ''} onChange={(e) => handleInputChange(e, 'bankAccounts', acc.key)} className="w-full border border-slate-400 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-sm" /></td>
                          <td className="p-2"><input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="balance" value={(formData.bankAccounts as any)[acc.key]?.balance || ''} onChange={(e) => handleInputChange(e, 'bankAccounts', acc.key)} className="w-full border border-slate-400 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* වාර්ෂික ආදායම හා වියදම */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`වාර්ෂික ප්රධාන රැකියා ආදායම (රු.)`)} <span className="text-red-500 font-bold">*</span></label>
                  <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="annualIncomePrimary" value={formData.annualIncomePrimary} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`වෙනත් වාර්ෂික ආදායම් මාර්ග (රු.)`)}</label>
                  <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="annualIncomeOther" value={formData.annualIncomeOther} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(`මුළු වාර්ෂික වියදම් එකතුව (රු.)`)}</label>
                  <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="annualExpense" value={formData.annualExpense} disabled className="w-full rounded-lg border-slate-300 p-2.5 border bg-slate-100 font-bold cursor-not-allowed" />
                </div>
              </div>

              {/* ගෙවීමට ඇති ණය */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">{t(`07. දැනට ගෙවීමට ඇති ණය සහ පොළී විස්තර`)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t(`1. මෙම සමිතියට ගෙවීමට ඇති හිඟ මුදල (රු.)`)}</label>
                    <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="existingLoansCoop" value={formData.existingLoansCoop} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">{t(`2. වෙනත් මූල්ය ආයතනවලට ඇති ණය (රු.)`)}</label>
                    <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} name="existingLoansOther" value={formData.existingLoansOther} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border" />
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">{t(`08. අතිරේක ලියකියවිලි (Supporting Documents)`)}</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-medium mb-2 text-slate-600">{t(`ණය ඉල්ලුම්පත, වත්කම් ඔප්පු ආදියෙහි ස්කෑන් පිටපත් හෝ ඡායාරූප උඩුගත කරන්න`)}</label>
                  <input type="file" multiple accept=".pdf,image/jpeg,image/png" className="w-full rounded-lg border-slate-300 p-2 bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ඇපකරුවන්ගේ විස්තර */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><Shield size={22}/> {t(`04. ඇපකරුවන්ගේ ප්රකාශ සහ විස්තර`)}</h2>
              
              {/* Guarantor 1 & 2 Loop Container */}
              {['guarantor1', 'guarantor2'].map((gKey, index) => (
                <div key={gKey} className="p-6 border border-slate-200 rounded-2xl bg-slate-50 space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center">{index + 1}</span> 
                    {index === 0 ? 'පළමු වැනි ඇපකරුගේ විස්තර' : 'දෙවැනි ඇපකරුගේ විස්තර'}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(`සම්පූර්ණ නම`)}<span className="text-red-500 font-bold">*</span></label>
                      <input type="text" value={(formData as any)[gKey].name} onChange={(e) => handleGuarantorChange(gKey, 'name', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(`ලිපිනය`)}</label>
                      <input type="text" value={(formData as any)[gKey].address} onChange={(e) => handleGuarantorChange(gKey, 'address', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(`ජාතික හැඳුනුම්පත් අංකය`)}<span className="text-red-500 font-bold">*</span></label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="e.g. 912345678V / 199123456789"
                        value={(formData as any)[gKey].nic}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^0-9VX]/g, '');
                          handleGuarantorChange(gKey, 'nic', val);
                        }}
                        className={`w-full rounded-lg p-2 border bg-white transition-all ${
                          !(formData as any)[gKey].nic
                            ? 'border-slate-300'
                            : isValidNIC((formData as any)[gKey].nic)
                            ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-bold'
                            : 'border-red-500 bg-red-50/20 text-red-900 font-semibold'
                        }`}
                      />
                      {(formData as any)[gKey].nic && isValidNIC((formData as any)[gKey].nic) && (
                        <div className="mt-1">
                          {guarantorDbStatus[gKey]?.checking ? (
                            <p className="text-[11px] font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                              <span className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full inline-block"></span>
                              ඇපකරු පද්ධතියේ පරීක්ෂා කරමින්... (Checking Live DB...)
                            </p>
                          ) : guarantorDbStatus[gKey]?.foundMember ? (
                            <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 flex items-center gap-1 mt-1">
                              ✓ පද්ධතියේ සාමාජික ඇපකරුවෙකි: <span className="underline">{guarantorDbStatus[gKey].foundMember.fullName || guarantorDbStatus[gKey].foundMember.nameWithInitials}</span> (අංකය: {guarantorDbStatus[gKey].foundMember.membershipNumber})
                            </p>
                          ) : (
                            <p className="text-[11px] font-bold text-slate-700 bg-slate-100 p-1.5 rounded border border-slate-200 flex items-center gap-1 mt-1">
                              ℹ️ සාමාජික නොවන බාහිර ඇපකරුවෙකි (External Guarantor)
                            </p>
                          )}
                        </div>
                      )}
                      {(formData as any)[gKey].nic && !isValidNIC((formData as any)[gKey].nic) && (
                        <p className="text-[11px] font-bold text-red-600 mt-1">❌ ජාතික හැඳුනුම්පත් අංකය වැරදියි (9 V/X හෝ ඉලක්කම් 12 විය යුතුය)</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(`උපන් දිනය`)}</label>
                      <input type="date" value={(formData as any)[gKey].dob} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} onChange={(e) => handleGuarantorChange(gKey, 'dob', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(`සාමාජික අංකය`)}</label>
                      <input type="text" value={(formData as any)[gKey].memberNo} onChange={(e) => handleGuarantorChange(gKey, 'memberNo', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t(`රැකියාව`)}</label>
                      <input type="text" value={(formData as any)[gKey].job} onChange={(e) => handleGuarantorChange(gKey, 'job', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">{t(`දුරකථන අංකය`)}</label>
                      <input type="tel" value={(formData as any)[gKey].phone} onChange={(e) => handleGuarantorChange(gKey, 'phone', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white sm:w-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
                    <div>
                      <label className="font-medium text-slate-600">{t(`ඉඩම්/ගොඩනැගිලි වටිනාකම`)}</label>
                      <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder={t(`රු.`)} value={(formData as any)[gKey]?.assets?.land || ''} onChange={(e) => handleGuarantorChange(gKey, 'land', e.target.value, 'assets')} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600">{t(`රථ වාහන වටිනාකම`)}</label>
                      <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder={t(`රු.`)} value={(formData as any)[gKey]?.assets?.vehicles || ''} onChange={(e) => handleGuarantorChange(gKey, 'vehicles', e.target.value, 'assets')} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600">{t(`ඉතිරි කිරීම් ශේෂය`)}</label>
                      <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder={t(`රු.`)} value={(formData as any)[gKey]?.bank?.savings || ''} onChange={(e) => handleGuarantorChange(gKey, 'savings', e.target.value, 'bank')} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600">{t(`වාර්ෂික මුළු ආදායම`)}</label>
                      <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder={t(`රු.`)} value={(formData as any)[gKey]?.incomePrimary || ''} onChange={(e) => handleGuarantorChange(gKey, 'incomePrimary', e.target.value)} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                  </div>

                  <div className="pt-3 border-t text-sm mt-3">
                    <label className="block font-medium text-slate-600 mb-2">{t(`ඇපකරුගේ ඩිජිටල් අත්සන (Digital Signature)`)}</label>
                    <input type="file" accept="image/jpeg,image/png" onChange={(e) => {
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
                          handleGuarantorChange(gKey, 'digitalSignatureUrl', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} className="w-full rounded-lg border-slate-400 p-2 border bg-white focus:ring-2 focus:ring-emerald-500" />
                    {(formData as any)[gKey]?.digitalSignatureUrl && (
                      <img src={(formData as any)[gKey]?.digitalSignatureUrl} alt="Signature Preview" className="mt-2 h-16 border rounded" />
                    )}
                  </div>
                </div>
              ))}

              {/* නීතිමය කොන්දේසි ප්රකාශය */}
              <div className="p-4 bg-amber-50 border border-amber-200 text-slate-700 text-xs rounded-xl space-y-2 leading-relaxed">
                <p className="font-bold text-amber-900">{t(`🔔 ඇපකරුවන් සහ ණයකරුගේ පොදු ප්රකාශය :`)}</p>
                <p>{t(`• ඉහත සඳහන් කරුණු අප දන්නා තරමින් නිවැරදි හා සත්ය බවත්, ණයකරු මෙම මුදල පැහැර හැරියහොත් පොළියද ඇතුළුව සම්පූර්ණ මුදල ගෙවීමට තනි තනිව සහ සාමූහිකව අප බැඳී සිටින බව ප්රකාශ කරමු.`)}</p>
                <p>{t(`• වාරික මුදලක් නිසි පරිදි නොගෙවා හැරියහොත් සමිතියේ ඇති අපගේ ඕනෑම ගිණුම් ශේෂයක් හිලව් කර ගැනීමට අපගේ විරුද්ධත්වයක් නොමැත.`)}</p>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex justify-between items-center py-6 mt-4 border-t border-slate-200">
            <button type="button" onClick={prevStep} disabled={currentStep === 1} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm">
              <ChevronLeft size={16}/> {t(`පෙර පියවර (Back)`)}</button>
            
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="flex items-center gap-1 px-5 py-2.5 rounded-lg bg-emerald-600 font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm text-sm ml-auto">
                {t(`මීළඟ පියවර (Next)`)}<ChevronRight size={16}/>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-700 font-bold text-white hover:bg-emerald-800 transition-all shadow-md ml-auto text-sm disabled:opacity-70">
                {loading ? 'Processing...' : <><Save size={18}/> {t(`ශාඛා කළමනාකරුගේ අනුමැතිය සඳහා ඉදිරිපත් කරන්න (Submit for Approval)`)}</>}
              </button>
            )}
          </div>

        </div>
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem', fontWeight: 500, fontFamily: 'Noto Sans Sinhala, sans-serif' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
