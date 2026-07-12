import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { applyForLoan } from '../services/loan.service';
import { searchMembers } from '../services/account.service';
import * as AuthService from '../services/auth.service';
import { AlertTriangle } from 'lucide-react';
interface DisasterLoanFormProps {
  loanTypeId: string;
  onClose: () => void;
}

export default function DisasterLoanForm({ loanTypeId, onClose }: DisasterLoanFormProps) {
  const [formData, setFormData] = useState({
    applicationNumber: '',
    name: '',
    memberId: '',
    accountNumber: '',
    shareAmount: '',
    designation: '',
    address: '',
    requestedAmount: '',
    appliedDate: new Date().toISOString().split('T')[0],
    termMonths: '10',
    agreedAmount: '',
    
    // Guarantors
    guarantor1Name: '',
    guarantor1Address: '',
    guarantor1DigitalSignatureUrl: '',
    guarantor2Name: '',
    guarantor2Address: '',
    guarantor2DigitalSignatureUrl: '',
    
    // Office Use Fields
    officeMemberNo: '',
    stockShortages: '',
    noPayLeave: '',
    exceeds40Percent: '',
    ruralBankLoans: '',
    isOverdueDebtor: '',
    
    // Approvals
    managerRecommendation: '',
    generalManagerApproval: ''
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    // Generate application number on mount
    const user = AuthService.getCurrentUser();
    const tenantId = user?.tenantId || '1';
    const branchId = user?.branchId || '1';
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newAppNumber = `${tenantId}/${branchId}/LN${randomSuffix}`;
    setFormData(prev => ({ ...prev, applicationNumber: newAppNumber }));
  }, []);
  const showMessage = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const selectMember = (member: any) => {


    setSearchQuery(member.membershipNumber || member.nic || '');
    setShowDropdown(false);
    setFormData(prev => ({
      ...prev,
      name: member.fullName || '',
      memberId: member.memberId || '00000000-0000-0000-0000-000000000000',
      shareAmount: member.shareAmount?.toString() || '',
      address: member.address || '',
      officeMemberNo: member.membershipNumber || '',
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    if (!formData.appliedDate || !formData.name || !formData.requestedAmount || !formData.termMonths || !formData.guarantor1Name || !formData.guarantor2Name) {
      showMessage("කරුණාකර අයදුම් කළ දිනය ඇතුළු සියලුම අත්‍යවශ්‍ය තොරතුරු පුරවන්න. (Please fill all essential fields including Applied Date)", 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
        const payload = {
            memberId: formData.memberId || '00000000-0000-0000-0000-000000000000',
            requestedAmount: parseFloat(formData.requestedAmount),
            termMonths: parseInt(formData.termMonths),
            appliedDate: formData.appliedDate,
            applicationNumber: formData.applicationNumber,
            
            applicationData: {
                name: formData.name,
                shareAmount: formData.shareAmount,
                designation: formData.designation,
                address: formData.address,
                agreedAmount: formData.agreedAmount,
                
                guarantor1Name: formData.guarantor1Name,
                guarantor1Address: formData.guarantor1Address,
                guarantor1DigitalSignatureUrl: formData.guarantor1DigitalSignatureUrl,
                guarantor2Name: formData.guarantor2Name,
                guarantor2Address: formData.guarantor2Address,
                guarantor2DigitalSignatureUrl: formData.guarantor2DigitalSignatureUrl,
                
                officeMemberNo: formData.officeMemberNo,
                stockShortages: formData.stockShortages,
                noPayLeave: formData.noPayLeave,
                exceeds40Percent: formData.exceeds40Percent,
                ruralBankLoans: formData.ruralBankLoans,
                isOverdueDebtor: formData.isOverdueDebtor,
                
                managerRecommendation: formData.managerRecommendation,
                generalManagerApproval: formData.generalManagerApproval
            }
        };

        await applyForLoan(loanTypeId, payload);
        showMessage('ආකෘති පත්‍රය සාර්ථකව ඇතුළත් කළා! (Application Submitted Successfully)', 'success');
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
    <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl flex flex-col h-[90vh] mx-auto">
      
      {/* Header */}
      <div className="bg-[#025a4e] text-white p-5 border-b-4 border-teal-500 rounded-t-2xl shrink-0">
        <h1 className="text-xl font-bold tracking-wide text-center">සේවක ආපදා ණය ඉල්ලුම්පත</h1>
      </div>

      {/* Form Details with Scroll */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8">
        <div onKeyDown={handleKeyDown} className="space-y-8 max-w-4xl mx-auto">
          
          {/* Search Section */}
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-100 flex flex-col items-start shadow-sm relative">
            <label className="block text-sm font-bold text-teal-900 mb-2">සාමාජික අංකය, ජා.හැ.ප අංකය හෝ නම (Member No, NIC or Name) ලබා දී සොයන්න</label>
            <div className="w-full relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Enter ID or Name to auto-fill details..."
                className="w-full rounded-lg border-teal-200 p-3 border focus:ring-2 focus:ring-teal-500 bg-white shadow-sm" 
              />
              {isSearching && (
                <div className="absolute right-3 top-3 text-teal-500">
                   <span className="animate-spin inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full"></span>
                </div>
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {searchResults.map(member => (
                    <div 
                      key={member.memberId}
                      onClick={() => selectMember(member)}
                      className="px-4 py-3 border-b border-slate-100 hover:bg-teal-50 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-teal-800">{member.membershipNumber} - {member.fullName}</div>
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

          {/* Section 1: Applicant Details */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-100/50 shadow-sm relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-yellow-900 mb-2">අයදුම්පත් අංකය (Application No)</label>
                <input 
                  type="text" 
                  disabled
                  value={formData.applicationNumber}
                  className="w-full rounded-lg border-yellow-200 p-3 border bg-yellow-100/50 shadow-sm text-yellow-900 font-bold cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-yellow-900 mb-2">ගිණුම ආරම්භ කළ දිනය / අයදුම් කළ දිනය (Applied Date) *</label>
                <input 
                  type="date" 
                  required
                  name="appliedDate"
                  value={formData.appliedDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border-yellow-200 p-3 border focus:ring-2 focus:ring-yellow-500 bg-white shadow-sm" 
                />
                {formData.appliedDate && formData.appliedDate !== new Date().toISOString().split('T')[0] && (
                  <div className="mt-2 text-amber-700 bg-amber-50 p-2 rounded-lg text-xs font-semibold border border-amber-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
                    <span>ඔබ තෝරාගෙන ඇත්තේ අතීත දිනයකි. මෙය පැරණි දත්ත ඇතුලත් කිරීමක් බව තහවුරු කරගන්න.</span>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-700 mb-4 border-l-4 border-teal-600 pl-3">1. අයදුම්කරුගේ තොරතුරු</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1. නම</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2. සාමාජික අංකය (UUID)</label>
                  <input type="text" name="memberId" value={formData.memberId} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">කොටස් මුදල (රු.)</label>
                  <input type="number" name="shareAmount" value={formData.shareAmount} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3. තනතුර</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">4. ලිපිනය</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={1} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Loan & Guarantors */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-l-4 border-teal-600 pl-3">2. ණය සහ ඇපකරුවන්ගේ විස්තර</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">5. ඉල්ලන ණය මුදල (රු.)</label>
                <input type="number" name="requestedAmount" value={formData.requestedAmount} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">මාස ගණන (Term)</label>
                <input type="number" name="termMonths" value={formData.termMonths} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
              </div>
            </div>

            <div className="bg-teal-50 p-5 rounded-lg border border-teal-100 mb-5 text-sm text-gray-700 leading-relaxed font-medium">
              ඉහත සඳහන් මා හට මාසික වැටුපින් අයකර ගැනීමේ පදනම මත රුපියල් 
              <input type="number" name="agreedAmount" value={formData.agreedAmount} onChange={handleChange} className="mx-2 w-32 border-b-2 border-teal-400 focus:border-teal-600 focus:outline-none bg-transparent text-center font-bold text-teal-800" placeholder="..........." required /> 
              ආපදා ණය මුදලක් ලබාදෙන ලෙස ඉල්ලමි.
            </div>

            <p className="text-sm font-semibold text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              * ඉහත සඳහන් අයගේ ආපදා ණය මුදල සඳහා ඇපකරුවන් වශයෙන් බැඳීමට අප එකඟ වන බැව් ප්‍රකාශ කර සිටිමු.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Guarantor 1 */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                <span className="font-bold text-sm text-gray-700 block mb-3">6.1 පළමු ඇපකරු</span>
                <div className="space-y-3">
                  <input type="text" name="guarantor1Name" placeholder="නම" value={formData.guarantor1Name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                  <textarea name="guarantor1Address" placeholder="ලිපිනය" value={formData.guarantor1Address} onChange={handleChange} rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required></textarea>
                  <label className="block font-medium text-gray-600 text-xs mt-2 mb-1">ඇපකරුගේ ඩිජිටල් අත්සන (Digital Signature)</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({...prev, guarantor1DigitalSignatureUrl: reader.result as string}));
                        };
                        reader.readAsDataURL(file);
                      }
                  }} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  {formData.guarantor1DigitalSignatureUrl && (
                      <img src={formData.guarantor1DigitalSignatureUrl} alt="Signature Preview" className="mt-2 h-16 border rounded" />
                  )}
                </div>
              </div>

              {/* Guarantor 2 */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                <span className="font-bold text-sm text-gray-700 block mb-3">6.2 දෙවන ඇපකරු</span>
                <div className="space-y-3">
                  <input type="text" name="guarantor2Name" placeholder="නම" value={formData.guarantor2Name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                  <textarea name="guarantor2Address" placeholder="ලිපිනය" value={formData.guarantor2Address} onChange={handleChange} rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required></textarea>
                  <label className="block font-medium text-gray-600 text-xs mt-2 mb-1">ඇපකරුගේ ඩිජිටල් අත්සන (Digital Signature)</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({...prev, guarantor2DigitalSignatureUrl: reader.result as string}));
                        };
                        reader.readAsDataURL(file);
                      }
                  }} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  {formData.guarantor2DigitalSignatureUrl && (
                      <img src={formData.guarantor2DigitalSignatureUrl} alt="Signature Preview" className="mt-2 h-16 border rounded" />
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* Supporting Documents */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-l-4 border-teal-600 pl-3">අතිරේක ලියකියවිලි (Supporting Documents)</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">ණය ඉල්ලුම්පත, වත්කම් ඔප්පු ආදියෙහි ස්කෑන් පිටපත් හෝ ඡායාරූප උඩුගත කරන්න</label>
              <input type="file" multiple className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 pb-8">
            <button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#025a4e] hover:bg-[#01443b] text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50 text-base"
            >
              {loading ? 'Processing...' : 'ශාඛා කළමනාකරුගේ අනුමැතිය සඳහා ඉදිරිපත් කරන්න (Submit for Approval)'}
            </button>
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
