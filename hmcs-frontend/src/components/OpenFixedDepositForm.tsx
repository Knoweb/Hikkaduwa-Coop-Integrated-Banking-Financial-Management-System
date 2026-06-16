import React, { useState, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import * as AccountService from '../services/account.service';
import { getCurrentUser } from '../services/auth.service';

const OpenFixedDepositForm = ({ onClose }: { onClose?: () => void }) => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AccountService.MemberData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fdTypes, setFdTypes] = useState<any[]>([]);

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
      idNumber: nic,
      address: member.address || '',
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const [formData, setFormData] = useState({
    memberId: '',
    fullName: '',
    idNumber: '',
    address: '',
    fdTypeId: '',
    principalAmount: '',
    interestPayoutMethod: 'AT_MATURITY',
    maturityInstruction: 'REINVEST_PRINCIPAL_AND_INTEREST',
    linkedSavingsAccountId: ''
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formRef = React.useRef<HTMLFormElement>(null);
  const [alertConfig, setAlertConfig] = useState<{message: string, isSuccess?: boolean} | null>(null);
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
      // NOTE: We should ideally have an AccountService method for this,
      // but for now we'll just fix the URL and auth header to use API_URL and auth token
      const user = getCurrentUser();
      const token = user?.token;
      const response = await fetch(`${AccountService.API_URL}fixed-deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memberId: formData.memberId,
          typeId: formData.fdTypeId,
          principalAmount: parseFloat(formData.principalAmount),
          interestPayoutMethod: formData.interestPayoutMethod,
          maturityInstruction: formData.maturityInstruction,
          linkedSavingsAccountId: formData.linkedSavingsAccountId || null
        })
      });

      if (response.ok) {
        setAlertConfig({ message: 'ස්ථාවර තැන්පතුව සාර්ථකව විවෘත කරන ලදි!', isSuccess: true });
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setAlertConfig({ message: 'Failed to open Fixed Deposit' });
      }
    } catch (error) {
      setAlertConfig({ message: 'System error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl max-w-4xl mx-auto border border-slate-100 shadow-sm relative">
      {onClose && (
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition">
          <X size={24} />
        </button>
      )}

      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">නව ස්ථාවර තැන්පතුව (New Fixed Deposit)</h2>
        <div className="flex justify-center items-center gap-2 mt-6">
          <div className={`h-2 flex-1 rounded-l-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-100'}`}></div>
          <div className={`h-2 flex-1 rounded-r-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-100'}`}></div>
        </div>
      </div>

      {alertConfig && (
        <div className={`p-4 rounded-xl mb-6 flex justify-between items-start ${alertConfig.isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium text-sm">{alertConfig.message}</p>
          <button onClick={() => setAlertConfig(null)}><X size={16} /></button>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                1. සාමාජික තොරතුරු (Member Details)
              </h3>
              
              <div className="mb-6 relative">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">සාමාජිකයා සොයන්න (Search Member)</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="NIC අංකය හෝ නම ඇතුලත් කරන්න..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                  {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
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
                        <p className="text-xs text-slate-500">NIC: {member.nic} | Member No: {member.memberNo}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formData.memberId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">සම්පූර්ණ නම</label>
                    <input type="text" readOnly value={formData.fullName} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">හැඳුනුම්පත් අංකය</label>
                    <input type="text" readOnly value={formData.idNumber} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                2. තැන්පතු තොරතුරු (Deposit Details)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">තැන්පතු වර්ගය (FD Type) *</label>
                  <select
                    name="fdTypeId"
                    required
                    value={formData.fdTypeId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- තෝරන්න --</option>
                    {['NORMAL', 'SENIOR', 'CHILD'].map(cat => {
                      const catPrefix = cat === 'NORMAL' ? 'FD_NRM' : cat === 'SENIOR' ? 'FD_SNR' : 'FD_CHD';
                      const catName = cat === 'NORMAL' ? 'සාමාන්‍ය ස්ථාවර තැන්පතු' : cat === 'SENIOR' ? 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු' : 'ළමා ස්ථාවර තැන්පතු';
                      const items = fdTypes.filter((t: any) => t.code.startsWith(catPrefix)).sort((a: any, b: any) => a.termMonths - b.termMonths);
                      if (items.length === 0) return null;
                      return (
                        <optgroup key={cat} label={catName}>
                          {items.map((type: any) => (
                            <option key={type.id} value={type.id}>
                              මාස {type.termMonths} (Rate: {type.interestRateMaturity}%)
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">තැන්පතු මුදල (Principal Amount) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rs.</span>
                    <input
                      type="number"
                      name="principalAmount"
                      required
                      min="5000"
                      value={formData.principalAmount}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">පොළිය ලබාගන්නා ක්‍රමය (Interest Payout) *</label>
                  <select
                    name="interestPayoutMethod"
                    required
                    value={formData.interestPayoutMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="AT_MATURITY">කල් පිරුණම එකවර ගැනීම (At Maturity - Higher Rate)</option>
                    <option value="MONTHLY">මාසිකව ගැනීම (Monthly - Rate -2%)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">කල් පිරීමේ උපදෙස් (Maturity Instructions) *</label>
                  <select
                    name="maturityInstruction"
                    required
                    value={formData.maturityInstruction}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="REINVEST_PRINCIPAL_AND_INTEREST">1. මුල් මුදල සහ පොළිය නැවත ආයෝජනය කිරීම (Reinvest Principal & Interest)</option>
                    <option value="REINVEST_PRINCIPAL_PAY_INTEREST">2. මුල් මුදල නැවත ආයෝජනය කර, පොළිය ඉතුරුම් ගිණුමට (Reinvest Principal, Pay Interest)</option>
                    <option value="CLOSE_ACCOUNT">3. ගිණුම වසා සියලු මුදල් ඉතුරුම් ගිණුමට (Close Account)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between items-center border-t border-slate-100 pt-6">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-700">අවලංගු කරන්න (Cancel)</button>
          
          <div className="flex gap-3">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                පෙර (Back)
              </button>
            )}
            
            {step < 2 ? (
              <button type="button" onClick={nextStep} className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
                ඊළඟ (Next)
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition shadow-md shadow-green-500/20 flex items-center gap-2 disabled:opacity-70">
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                තැන්පතුව ආරම්භ කරන්න (Open FD)
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default OpenFixedDepositForm;
