import React, { useState, useEffect } from 'react';
import { User, Shield, Landmark, ClipboardCheck, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { applyForLoan } from '../services/loan.service';
import { searchMembers, getAccounts } from '../services/account.service';
import * as AuthService from '../services/auth.service';

interface NormalLoanFormProps {
  loanTypeId: string;
  onClose: () => void;
}

export default function NormalLoanForm({ loanTypeId, onClose }: NormalLoanFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [memberId, setMemberId] = useState('00000000-0000-0000-0000-000000000000');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: මූලික තොරතුරු
    accountNumber: '',
    appliedDate: new Date().toISOString().split('T')[0],
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
        alert('කරුණාකර සියලුම අත්‍යවශ්‍ය මූලික තොරතුරු සහ අයදුම් කළ දිනය පුරවන්න. (Please fill all essential basic details including Applied Date)');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.requiredLoanCash && !formData.requiredLoanGoods) {
        alert('කරුණාකර ණය මුදල ඇතුළත් කරන්න. (Please enter the required loan amount)');
        return false;
      }
      if (!formData.repaymentPeriodMonths) {
        alert('කරුණාකර ආපසු ගෙවීමේ කාලය ඇතුළත් කරන්න. (Please enter the repayment period)');
        return false;
      }
      if (!formData.loanPurpose) {
        alert('කරුණාකර ණය ලබාගන්නා අරමුණ ඇතුළත් කරන්න. (Please enter loan purpose)');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.annualIncomePrimary && !formData.annualIncomeOther) {
        alert('කරුණාකර වාර්ෂික ආදායම ඇතුළත් කරන්න. (Please enter at least one annual income source)');
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
      gender: member.gender === 'M' ? 'පුරුෂ' : member.gender === 'F' ? 'ස්ත්‍රී' : '',
      civilStatus: member.maritalStatus === 'Married' ? 'විවාහක' : 'අවිවාහක',
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
        alert('කරුණාකර ඇපකරුවන් දෙදෙනාගේම අත්‍යවශ්‍ය විස්තර පුරවන්න. (Please fill essential details for both guarantors)');
        return;
    }
    
    setLoading(true);
    try {
        const totalAmount = Number(formData.requiredLoanCash || 0) + Number(formData.requiredLoanGoods || 0);
        const currentUser = AuthService.getCurrentUser();
        const payload = {
            memberId: memberId,
            requestedAmount: totalAmount,
            termMonths: parseInt(formData.repaymentPeriodMonths || '12'),
            branchId: currentUser?.branchId || 1,
            appliedDate: formData.appliedDate,
            accountNumber: formData.accountNumber || undefined,
            repaymentMethod: formData.repaymentMethod,
            applicationData: formData
        };

        await applyForLoan(loanTypeId, payload);
        alert('ණය ඉල්ලුම් පත්රය සාර්ථකව පද්ධතියට ඇතුළත් කරන ලදී!');
        onClose();
    } catch (error: any) {
        console.error("Error submitting loan application", error);
        if (error.response && error.response.data) {
            const errorMsg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
            alert(`දෝෂයක්! ${errorMsg}`);
        } else {
            alert("දෝෂයක්! කරුණාකර නැවත උත්සාහ කරන්න.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
      
      {/* Form Header */}
      <div className="bg-gradient-to-r border-b border-emerald-600 bg-emerald-700 p-6 text-white text-center shrink-0">
        <p className="text-sm font-semibold tracking-wider uppercase opacity-90">සී/ස විවිධ සේවා සමුපකාර සමිතිය | ග්රාමීය බැංකුව</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">ණය යෝජනා ඉල්ලුම් පත්රය</h1>
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

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div onKeyDown={handleKeyDown} className="p-6 sm:p-10 space-y-8 max-w-5xl mx-auto">
          
          {/* STEP 1: මූලික තොරතුරු */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-100/50 shadow-sm relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-yellow-900 mb-2">ගිණුම් අංකය (Account Number)</label>
                  <input 
                    type="text" 
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    className="w-full rounded-lg border-yellow-200 p-3 border focus:ring-2 focus:ring-yellow-500 bg-white shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-yellow-900 mb-2">ගිණුම ආරම්භ කළ දිනය / අයදුම් කළ දිනය (Applied Date) *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                    className="w-full rounded-lg border-yellow-200 p-3 border focus:ring-2 focus:ring-yellow-500 bg-white shadow-sm" 
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><User size={22}/> 01. ඉල්ලුම්කරුගේ මූලික තොරතුරු</h2>
              
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col items-start shadow-sm relative">
                <label className="block text-sm font-bold text-emerald-900 mb-2">සාමාජික අංකය හෝ ජා.හැ.ප අංකය (Member No / NIC) ලබා දී සොයන්න</label>
                <div className="w-full relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Enter ID to auto-fill details..."
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
                      සාමාජිකයෙකු සොයාගත නොහැකි විය. (Member not found)
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">01. ඉල්ලුම්කරුගේ සම්පූර්ණ නම / නම්</label>
                  <input type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">02. ලිපිනය</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ලබාගත් කොටස් ප්‍රමාණය</label>
                  <input type="number" name="sharesObtained" value={formData.sharesObtained} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">03. උපන් දිනය</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">04. ස්ත්රී / පුරුෂ භාවය</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500">
                    <option value="">තෝරන්න</option>
                    <option value="පුරුෂ">පුරුෂ</option>
                    <option value="ස්ත්රී">ස්ත්රී</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">05. විවාහක / අවිවාහක බව</label>
                  <select name="civilStatus" value={formData.civilStatus} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500">
                    <option value="">තෝරන්න</option>
                    <option value="විවාහක">විවාහක</option>
                    <option value="අවිවාහක">අවිවාහක</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">06. ජාතික හැඳුනුම්පත් අංකය (NIC)</label>
                  <input type="text" name="nic" value={formData.nic} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">07. දුරකථන අංකය</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">08. සාමාජික අංකය</label>
                  <input type="text" name="memberNo" value={formData.memberNo} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">09. සමිති බල ප්රදේශයේ පදිංචි කාලය (වසර)</label>
                  <input type="number" name="residencePeriod" value={formData.residencePeriod} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">10. වෙනත් සමූපකාර සමිතියක සාමාජිකයෙක්ද?</label>
                  <select name="isMemberOfOtherCoop" value={formData.isMemberOfOtherCoop} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500">
                    <option value="">තෝරන්න</option>
                    <option value="ඔව්">ඔව්</option>
                    <option value="නැත">නැත</option>
                  </select>
                </div>
                {formData.isMemberOfOtherCoop === 'ඔව්' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">එසේ නම් එහි නම සහ ලිපිනය</label>
                    <textarea name="otherCoopDetails" value={formData.otherCoopDetails} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" rows={2}></textarea>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ණය මුදල සහ ආර්ථික තොරතුරු */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><Landmark size={22}/> 02. ණය මුදල සහ ආර්ථික තොරතුරු</h2>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-700">11. වෙනත් ණය වෙනුවෙන් ඇපවීම් (ඇත්නම් ණයකරුගේ නම)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" name="guarantorOfOtherLoan1" placeholder="ණයකරු 01 නම" value={formData.guarantorOfOtherLoan1} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                  <input type="text" name="guarantorOfOtherLoan2" placeholder="ණයකරු 02 නම" value={formData.guarantorOfOtherLoan2} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-700">12. ණය මුදල පිළිබඳ විස්තර</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">(අ) අවශ්ය ණය මුදලින් (රු.)</label>
                    <input type="number" name="requiredLoanCash" value={formData.requiredLoanCash} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">(ආ) අවශ්ය ණය ද්රව්ය වලින් (රු.)</label>
                    <input type="number" name="requiredLoanGoods" value={formData.requiredLoanGoods} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">එකතුව (රු.)</label>
                    <div className="w-full rounded-lg border border-slate-300 p-2.5 bg-slate-200 font-bold">
                      {Number(formData.requiredLoanCash || 0) + Number(formData.requiredLoanGoods || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">13. ණය අවශ්ය කාරණය</label>
                  <input type="text" name="loanPurpose" value={formData.loanPurpose} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">14. ණය ආපසු ගෙවීමේ කාලය (මාසික වාරික සංඛ්යාව)</label>
                  <input type="number" name="repaymentPeriodMonths" value={formData.repaymentPeriodMonths} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-emerald-800 mb-1">15. වාරික ගෙවීමේ ක්‍රමය (Repayment Method)</label>
                  <select name="repaymentMethod" value={formData.repaymentMethod} onChange={handleInputChange} className="w-full rounded-lg border-emerald-300 p-2.5 border-2 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50 font-semibold text-emerald-900">
                    <option value="FIELD_COLLECTION">ක්ෂේත්‍ර නිලධාරී හරහා නිවසට පැමිණ (Field Collection)</option>
                    <option value="BRANCH_TELLER">ශාඛාවට පැමිණ (Branch Visit)</option>
                    <option value="SAVINGS_STANDING_ORDER">ඉතුරුම් ගිණුමෙන් මාසිකව කැපීම (Standing Order)</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-700 border-b pb-1 mt-6">ණයකරුගේ ආර්ථික තොරතුරු</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">01. ප්රධාන රැකියාව</label>
                  <input type="text" name="primaryJob" value={formData.primaryJob} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">02. රැකියාව කරන ආයතනයේ නම හා ලිපිනය</label>
                  <input type="text" name="employerDetails" value={formData.employerDetails} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">03. බිරිඳ/ස්වාමිපුරුෂයා රැකියාවක් කරන්නේ නම් තනතුර</label>
                  <input type="text" name="spouseJobTitle" value={formData.spouseJobTitle} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ආයතනයේ නම හා ලිපිනය (බිරිඳ/ස්වාමිපුරුෂයා)</label>
                  <input type="text" name="spouseEmployerDetails" value={formData.spouseEmployerDetails} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ගෘහ මූලිකයාගේ නම</label>
                  <input type="text" name="headOfHouseholdName" value={formData.headOfHouseholdName} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">යැපෙන්නන්ගේ සංඛ්යාව</label>
                  <input type="number" name="dependentsCount" value={formData.dependentsCount} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: වත්කම්, වියදම් සහ පවුලේ විස්තර */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><ClipboardCheck size={22}/> 03. වත්කම්, මූල්ය සහ වියදම් විස්තර</h2>
              
              {/* 05. ස්ථිර වත්කම් */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">05. ස්ථිර වත්කම් (ණය ඉල්ලුම්කරු සතු ප්රමාණය හා වටිනාකම)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                  {['landGoda', 'landMada', 'vehicles', 'animals', 'other'].map((assetKey, idx) => {
                    const labels = ['ගොඩ ඉඩම්', 'මඩ ඉඩම්', 'රථ වාහන', 'සතුන්', 'වෙනත් වත්කම්'];
                    return (
                      <div key={assetKey} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">{labels[idx]}</label>
                        <input type="text" name={assetKey} placeholder="ප්රමාණය සහ ඇස්තමේන්තුගත වටිනාකම" value={(formData.assets as any)[assetKey]} onChange={(e) => handleInputChange(e, 'assets')} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* බැංකු ගිණුම් විස්තර */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">මූල්ය වත්කම් (බැංකු සහ ආයතන ගිණුම් විස්තර)</h3>
                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full text-left border-collapse bg-white text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                        <th className="p-3 border-r border-slate-300">ගිණුම් වර්ගය</th>
                        <th className="p-3 border-r border-slate-300">ආයතනය</th>
                        <th className="p-3 border-r border-slate-300">ගිණුම් අංකය</th>
                        <th className="p-3">ශේෂය (රු.)</th>
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
                          <td className="p-2"><input type="number" name="balance" value={(formData.bankAccounts as any)[acc.key]?.balance || ''} onChange={(e) => handleInputChange(e, 'bankAccounts', acc.key)} className="w-full border border-slate-400 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* වාර්ෂික ආදායම හා වියදම */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <label className="block text-sm font-medium mb-1">වාර්ෂික ප්රධාන රැකියා ආදායම (රු.)</label>
                  <input type="number" name="annualIncomePrimary" value={formData.annualIncomePrimary} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">වෙනත් වාර්ෂික ආදායම් මාර්ග (රු.)</label>
                  <input type="number" name="annualIncomeOther" value={formData.annualIncomeOther} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">මුළු වාර්ෂික වියදම් එකතුව (රු.)</label>
                  <input type="number" name="annualExpense" value={formData.annualExpense} disabled className="w-full rounded-lg border-slate-300 p-2.5 border bg-slate-100 font-bold cursor-not-allowed" />
                </div>
              </div>

              {/* ගෙවීමට ඇති ණය */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">07. දැනට ගෙවීමට ඇති ණය සහ පොළී විස්තර</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">1. මෙම සමිතියට ගෙවීමට ඇති හිඟ මුදල (රු.)</label>
                    <input type="number" name="existingLoansCoop" value={formData.existingLoansCoop} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">2. වෙනත් මූල්ය ආයතනවලට ඇති ණය (රු.)</label>
                    <input type="number" name="existingLoansOther" value={formData.existingLoansOther} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 p-2.5 border" />
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">08. අතිරේක ලියකියවිලි (Supporting Documents)</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-medium mb-2 text-slate-600">ණය ඉල්ලුම්පත, වත්කම් ඔප්පු ආදියෙහි ස්කෑන් පිටපත් හෝ ඡායාරූප උඩුගත කරන්න</label>
                  <input type="file" multiple className="w-full rounded-lg border-slate-300 p-2 bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ඇපකරුවන්ගේ විස්තර */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-emerald-800 border-b pb-2 flex items-center gap-2"><Shield size={22}/> 04. ඇපකරුවන්ගේ ප්රකාශ සහ විස්තර</h2>
              
              {/* Guarantor 1 & 2 Loop Container */}
              {['guarantor1', 'guarantor2'].map((gKey, index) => (
                <div key={gKey} className="p-6 border border-slate-200 rounded-2xl bg-slate-50 space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center">{index + 1}</span> 
                    {index === 0 ? 'පළමු වැනි ඇපකරුගේ විස්තර' : 'දෙවැනි ඇපකරුගේ විස්තර'}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium mb-1">සම්පූර්ණ නම</label>
                      <input type="text" value={(formData as any)[gKey].name} onChange={(e) => handleGuarantorChange(gKey, 'name', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">ලිපිනය</label>
                      <input type="text" value={(formData as any)[gKey].address} onChange={(e) => handleGuarantorChange(gKey, 'address', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">ජාතික හැඳුනුම්පත් අංකය</label>
                      <input type="text" value={(formData as any)[gKey].nic} onChange={(e) => handleGuarantorChange(gKey, 'nic', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">උපන් දිනය</label>
                      <input type="date" value={(formData as any)[gKey].dob} onChange={(e) => handleGuarantorChange(gKey, 'dob', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">සාමාජික අංකය</label>
                      <input type="text" value={(formData as any)[gKey].memberNo} onChange={(e) => handleGuarantorChange(gKey, 'memberNo', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">රැකියාව</label>
                      <input type="text" value={(formData as any)[gKey].job} onChange={(e) => handleGuarantorChange(gKey, 'job', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">දුරකථන අංකය</label>
                      <input type="tel" value={(formData as any)[gKey].phone} onChange={(e) => handleGuarantorChange(gKey, 'phone', e.target.value)} className="w-full rounded-lg border-slate-300 p-2 border bg-white sm:w-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
                    <div>
                      <label className="font-medium text-slate-600">ඉඩම්/ගොඩනැගිලි වටිනාකම</label>
                      <input type="number" placeholder="රු." value={(formData as any)[gKey]?.assets?.land || ''} onChange={(e) => handleGuarantorChange(gKey, 'land', e.target.value, 'assets')} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600">රථ වාහන වටිනාකම</label>
                      <input type="number" placeholder="රු." value={(formData as any)[gKey]?.assets?.vehicles || ''} onChange={(e) => handleGuarantorChange(gKey, 'vehicles', e.target.value, 'assets')} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600">ඉතිරි කිරීම් ශේෂය</label>
                      <input type="number" placeholder="රු." value={(formData as any)[gKey]?.bank?.savings || ''} onChange={(e) => handleGuarantorChange(gKey, 'savings', e.target.value, 'bank')} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="font-medium text-slate-600">වාර්ෂික මුළු ආදායම</label>
                      <input type="number" placeholder="රු." value={(formData as any)[gKey]?.incomePrimary || ''} onChange={(e) => handleGuarantorChange(gKey, 'incomePrimary', e.target.value)} className="w-full border border-slate-400 rounded p-1.5 mt-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white" />
                    </div>
                  </div>

                  <div className="pt-3 border-t text-sm mt-3">
                    <label className="block font-medium text-slate-600 mb-2">ඇපකරුගේ ඩිජිටල් අත්සන (Digital Signature Placeholder)</label>
                    <input type="text" placeholder="Pending Touchpad Integration - Enter URL or ID manually" value={(formData as any)[gKey]?.digitalSignatureUrl || ''} onChange={(e) => handleGuarantorChange(gKey, 'digitalSignatureUrl', e.target.value)} className="w-full rounded-lg border-slate-400 p-2 border bg-white focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              ))}

              {/* නීතිමය කොන්දේසි ප්රකාශය */}
              <div className="p-4 bg-amber-50 border border-amber-200 text-slate-700 text-xs rounded-xl space-y-2 leading-relaxed">
                <p className="font-bold text-amber-900">🔔 ඇපකරුවන් සහ ණයකරුගේ පොදු ප්රකාශය :</p>
                <p>• ඉහත සඳහන් කරුණු අප දන්නා තරමින් නිවැරදි හා සත්ය බවත්, ණයකරු මෙම මුදල පැහැර හැරියහොත් පොළියද ඇතුළුව සම්පූර්ණ මුදල ගෙවීමට තනි තනිව සහ සාමූහිකව අප බැඳී සිටින බව ප්රකාශ කරමු.</p>
                <p>• වාරික මුදලක් නිසි පරිදි නොගෙවා හැරියහොත් සමිතියේ ඇති අපගේ ඕනෑම ගිණුම් ශේෂයක් හිලව් කර ගැනීමට අපගේ විරුද්ධත්වයක් නොමැත.</p>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex justify-between items-center py-6 mt-4 border-t border-slate-200">
            <button type="button" onClick={prevStep} disabled={currentStep === 1} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm">
              <ChevronLeft size={16}/> පෙර පියවර (Back)
            </button>
            
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="flex items-center gap-1 px-5 py-2.5 rounded-lg bg-emerald-600 font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm text-sm ml-auto">
                මීළඟ පියවර (Next) <ChevronRight size={16}/>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-700 font-bold text-white hover:bg-emerald-800 transition-all shadow-md ml-auto text-sm disabled:opacity-70">
                {loading ? 'Processing...' : <><Save size={18}/> කළමනාකරුගේ අනුමැතිය සඳහා ඉදිරිපත් කරන්න (Submit for Approval)</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
