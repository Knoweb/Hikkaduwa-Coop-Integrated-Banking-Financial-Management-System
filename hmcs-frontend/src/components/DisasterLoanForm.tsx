import React, { useState, useEffect } from 'react';
import { applyForLoan } from '../services/loan.service';
import { searchMembers } from '../services/account.service';

interface DisasterLoanFormProps {
  loanTypeId: string;
  onClose: () => void;
}

export default function DisasterLoanForm({ loanTypeId, onClose }: DisasterLoanFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    memberId: '',
    shareAmount: '',
    designation: '',
    address: '',
    requestedAmount: '',
    termMonths: '10',
    date: '',
    agreedAmount: '',
    
    // Guarantors
    guarantor1Name: '',
    guarantor1Address: '',
    guarantor2Name: '',
    guarantor2Address: '',
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const payload = {
            memberId: formData.memberId || '00000000-0000-0000-0000-000000000000',
            requestedAmount: parseFloat(formData.requestedAmount),
            termMonths: parseInt(formData.termMonths),
            
            applicationData: {
                name: formData.name,
                shareAmount: formData.shareAmount,
                designation: formData.designation,
                address: formData.address,
                date: formData.date,
                agreedAmount: formData.agreedAmount,
                
                guarantor1Name: formData.guarantor1Name,
                guarantor1Address: formData.guarantor1Address,
                guarantor2Name: formData.guarantor2Name,
                guarantor2Address: formData.guarantor2Address,
                
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
        alert('ආකෘති පත්‍රය සාර්ථකව ඇතුළත් කළා! (Application Submitted Successfully)');
        onClose();
    } catch (error) {
        console.error("Error submitting loan application", error);
        alert("දෝෂයක්! කරුණාකර නැවත උත්සාහ කරන්න.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl flex flex-col h-[90vh] mx-auto">
      
      {/* Header */}
      <div className="bg-[#025a4e] text-white p-5 border-b-4 border-teal-500 rounded-t-2xl shrink-0">
        <h1 className="text-xl font-bold tracking-wide text-center">සීමාසහිත හික්කඩුව විවිධ සේවා සමූපකාර සමිතිය</h1>
        <h2 className="text-sm text-teal-100 mt-1 text-center">සේවක ආපදා ණය ඉල්ලුම්පත</h2>
      </div>

      {/* Form Details with Scroll */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
          
          {/* Search Section */}
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-100 flex flex-col items-start shadow-sm relative">
            <label className="block text-sm font-bold text-teal-900 mb-2">සාමාජික අංකය හෝ ජා.හැ.ප අංකය (Member No / NIC) ලබා දී සොයන්න</label>
            <div className="w-full relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Enter ID to auto-fill details..."
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">දිනය</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none" required />
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
                </div>
              </div>

              {/* Guarantor 2 */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                <span className="font-bold text-sm text-gray-700 block mb-3">6.2 දෙවන ඇපකරු</span>
                <div className="space-y-3">
                  <input type="text" name="guarantor2Name" placeholder="නම" value={formData.guarantor2Name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                  <textarea name="guarantor2Address" placeholder="ලිපිනය" value={formData.guarantor2Address} onChange={handleChange} rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Office Use Only */}
          <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-200 shadow-sm">
            <h3 className="text-lg font-bold text-amber-800 mb-4 border-l-4 border-amber-600 pl-3">3. කාර්යාලීය ප්‍රයෝජනයට පමණි</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1. සාමාජික අංකය (කාර්යාලීය සත්‍යාපනය)</label>
                  <input type="text" name="officeMemberNo" value={formData.officeMemberNo} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2. අයවීමට ඇති බඩු අඩුවීමේ විස්තර</label>
                  <input type="text" name="stockShortages" value={formData.stockShortages} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">3. වැටුප් රහිත නිවාඩු ගැනීම්</label>
                  <input type="text" name="noPayLeave" value={formData.noPayLeave} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">4. වැටුපින් අඩුකිරීම් 40% ඉක්මවන්නේද?</label>
                  <select name="exceeds40Percent" value={formData.exceeds40Percent} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500">
                    <option value="">තෝරන්න</option>
                    <option value="ඔව්">ඔව්</option>
                    <option value="නැත">නැත</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">5. ග්‍රාමීය බැංකුවෙන් ගත් ණය තිබේද?</label>
                  <input type="text" name="ruralBankLoans" value={formData.ruralBankLoans} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6. කල් පසු වූ ණය කරුවෙක්ද?</label>
                <select name="isOverdueDebtor" value={formData.isOverdueDebtor} onChange={handleChange} className="w-full md:w-1/3 border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500">
                  <option value="">තෝරන්න</option>
                  <option value="ඔව්">ඔව්</option>
                  <option value="නැත">නැත</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Approvals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">බැංකු සේවා කළමණාකරුගේ නිර්දේශය</label>
              <select name="managerRecommendation" value={formData.managerRecommendation} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 mb-2 focus:ring-2 focus:ring-indigo-500">
                <option value="">තෝරන්න</option>
                <option value="නිර්දේශ කරමි">නිර්දේශ කරමි</option>
                <option value="නිර්දේශ නොකරමි">නිර්දේශ නොකරමි</option>
              </select>
              <span className="text-xs text-gray-400 block text-right mt-1">කළමණාකරුගේ විද්‍යුත් අත්සන</span>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">සාමාන්‍යාධිකාරීගේ තීරණය</label>
              <select name="generalManagerApproval" value={formData.generalManagerApproval} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 mb-2 focus:ring-2 focus:ring-indigo-500">
                <option value="">තෝරන්න</option>
                <option value="අනුමත කරමි">අනුමත කරමි</option>
                <option value="ප්‍රතික්ෂේප කරමි">ප්‍රතික්ෂේප කරමි</option>
              </select>
              <span className="text-xs text-gray-400 block text-right mt-1">සාමාන්‍යාධිකාරීගේ විද්‍යුත් අත්සන</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 pb-8">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#025a4e] hover:bg-[#01443b] text-white font-bold rounded-xl shadow-lg transition duration-200 disabled:opacity-50 text-base"
            >
              {loading ? 'Processing...' : 'ඉල්ලුම්පත ඇතුළත් කරන්න (Submit)'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
