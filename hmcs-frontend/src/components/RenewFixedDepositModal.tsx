import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import * as AccountService from '../services/account.service';
import { useLanguage } from '../context/LanguageContext';


interface Props {
  fd: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewFixedDepositModal({ fd, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [fdTypes, setFdTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    category: '', // will be initialized after fdTypes load
    termMonths: fd.termMonths?.toString() || '12',
    fdTypeId: fd.typeId || '',
    interestPayoutMethod: fd.interestPayoutMethod || 'AT_MATURITY',
    maturityInstruction: fd.maturityInstruction || 'REINVEST_PRINCIPAL_AND_INTEREST'
  });

  useEffect(() => {
    AccountService.getFixedDepositTypes().then(setFdTypes).catch(() => {});
  }, []);

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
    if (!formData.category) return [];
    const terms = fdTypes
      .filter(t => t.code.startsWith(formData.category))
      .map(t => t.termMonths);
    return Array.from(new Set(terms)).sort((a, b) => a - b);
  }, [formData.category, fdTypes]);

  // Set initial category from fd.typeId if possible
  useEffect(() => {
    if (fdTypes.length > 0 && !formData.category && fd.typeId) {
      const currentType = fdTypes.find(t => t.id === fd.typeId);
      if (currentType) {
        const parts = currentType.code.split('_');
        if (parts.length >= 2) {
          const prefix = parts[0] + '_' + parts[1];
          setFormData(prev => ({ ...prev, category: prefix }));
        }
      } else if (uniqueCategories.length > 0) {
        setFormData(prev => ({ ...prev, category: uniqueCategories[0].code }));
      }
    }
  }, [fdTypes, fd.typeId, formData.category, uniqueCategories]);

  useEffect(() => {
    if (fdTypes.length > 0 && formData.category && formData.termMonths) {
      const type = fdTypes.find(t => 
        t.code.startsWith(formData.category) && t.termMonths.toString() === formData.termMonths
      );
      if (type) {
        setFormData(prev => ({ ...prev, fdTypeId: type.id }));
      } else {
        setFormData(prev => ({ ...prev, fdTypeId: '' }));
      }
    }
  }, [formData.category, formData.termMonths, fdTypes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInterestRate = () => {
  
    if (!formData.fdTypeId || fdTypes.length === 0) return '0';
    const type = fdTypes.find(t => t.id === formData.fdTypeId);
    if (!type) return '0';
    return formData.interestPayoutMethod === 'MONTHLY' ? type.interestRateMonthly : type.interestRateMaturity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.fdTypeId) {
      setError('Selected fixed deposit type/term is currently unavailable.');
      return;
    }

    setLoading(true);
    try {
      await AccountService.renewFixedDeposit(fd.fdId, {
        typeId: formData.fdTypeId,
        termMonths: parseInt(formData.termMonths),
        interestPayoutMethod: formData.interestPayoutMethod,
        maturityInstruction: formData.maturityInstruction
      });
      onSuccess();
    } catch (err: any) {
      let errorMsg = 'Failed to renew fixed deposit. Please try again.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#01443b] text-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold">{t(`ස්ථාවර තැන්පතුව අලුත් කිරීම`)}</h2>
            <p className="text-emerald-100 text-sm">Renew Fixed Deposit</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t(`ගිණුම් අංකය`)}</label>
                <div className="text-sm font-bold text-slate-800">{fd.accountNumber}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t(`මුල් මුදල (Principal)`)}</label>
                <div className="text-sm font-bold text-slate-800">Rs. {Number(fd.principalAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`ගිණුම් වර්ගය (Category) *`)}</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                >
                  <option value="">{t(`-- තෝරන්න --`)}</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{t(`කාල සීමාව (Term) *`)}</label>
                <select
                  name="termMonths"
                  required
                  value={formData.termMonths}
                  onChange={handleInputChange}
                  disabled={!formData.category}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm disabled:opacity-50"
                >
                  <option value="">{t(`-- තෝරන්න --`)}</option>
                  {availableTerms.map(term => (
                    <option key={term} value={term.toString()}>මාස {term} ({term} Months)</option>
                  ))}
                </select>
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
                  <option value="AT_MATURITY">{t(`කල් පිරුණම එකවර ගැනීම (At Maturity)`)}</option>
                  <option value="MONTHLY">{t(`මාසිකව ගැනීම (Monthly)`)}</option>
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
                  <option value="REINVEST_PRINCIPAL_AND_INTEREST">{t(`1. මුල් මුදල සහ පොළිය නැවත ආයෝජනය කිරීම`)}</option>
                  <option value="REINVEST_PRINCIPAL_PAY_INTEREST">{t(`2. මුල් මුදල නැවත ආයෝජනය කර, පොළිය ඉතුරුම් ගිණුමට`)}</option>
                  <option value="CLOSE_ACCOUNT">{t(`3. ගිණුම වසා සියලු මුදල් ඉතුරුම් ගිණුමට`)}</option>
                </select>
              </div>
            </div>

            <div className="bg-[#025a4e]/5 p-4 rounded-xl border border-[#025a4e]/20 flex justify-between items-center mt-6">
              <span className="text-sm font-bold text-[#01443b]">{t(`අදාළ වන පොලී අනුපාතය (Applicable Interest Rate):`)}</span>
              <span className="text-xl font-black text-[#01443b]">{getInterestRate()}%</span>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t(`අවලංගු කරන්න`)}</button>
              <button
                type="submit"
                disabled={loading || !formData.fdTypeId}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-[#01443b] hover:bg-[#025a4e] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'කරුණාකර රැඳී සිටින්න...' : 'අලුත් කරන්න (Renew)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
