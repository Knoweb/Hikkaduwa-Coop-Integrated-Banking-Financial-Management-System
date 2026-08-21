import React, { useState, useEffect } from 'react';
import { Download, Search, ShieldCheck } from 'lucide-react';
import type { Loan } from '../services/loan.service';
import * as LoanService from '../services/loan.service';
import type { MemberData } from '../services/account.service';
import { getMembers } from '../services/account.service';
import { getCurrentUser } from '../services/auth.service';
import { useLanguage } from '../context/LanguageContext';


export default function InsuranceReport() {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const branchId = currentUser?.branchId;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  
  // Custom inputs keyed by loanId
  const [customData, setCustomData] = useState<Record<string, { lifeCover: string, premium: string }>>({});

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedLoans, fetchedMembers] = await Promise.all([
        LoanService.getInsuranceReportLoans(selectedMonth, branchId),
        getMembers()
      ]);
      setLoans(fetchedLoans);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDataChange = (loanId: string, field: 'lifeCover' | 'premium', value: string) => {
  
    setCustomData(prev => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        [field]: value
      }
    }));
  };

  // Loans are already filtered by the backend
  const reportLoans = loans;

  const getMemberData = (memberId: string) => members.find(m => m.memberId === memberId);

  const calculateTotal = (field: 'lifeCover' | 'premium') => {
  
    return reportLoans.reduce((sum, l) => {
      const val = parseFloat(customData[l.loanId]?.[field] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const handleDownloadWord = () => {
  
    const tableHTML = document.getElementById('insurance-table-container')?.innerHTML;
    if (!tableHTML) return;

    // Replace inputs with their values for the exported Word file
    const cleanHTML = tableHTML.replace(/<input[^>]*value="([^"]*)"[^>]*>/g, '$1').replace(/<input[^>]*>/g, '');

    const [year, month] = selectedMonth.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const dateRangeStr = `( ${year}.${month}.01 - ${year}.${month}.${lastDay} )`;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Insurance Report</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11pt; }
        th, td { border: 1px solid black; padding: 4px; text-align: left; vertical-align: middle; }
        th { font-weight: bold; }
        h3 { text-align: center; font-family: Arial, sans-serif; margin: 2px 0; font-size: 14pt; }
        h4 { text-align: center; font-family: Arial, sans-serif; margin: 2px 0 15px 0; font-size: 12pt; font-weight: normal; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
      </head>
      <body>
        <h3>Life Insurance Name List</h3>
        <br/>
        <h4>${dateRangeStr}</h4>
        ${cleanHTML} 
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Insurance_Report_${selectedMonth}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">{t(`රක්ෂණ වාර්තාව (Insurance Report)`)}</h3>
            <p className="text-emerald-100 text-sm font-medium mt-1">{t(`ණය මුදාහැරීම් සඳහා මාසික රක්ෂණ වාර්තාව`)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
          <label className="text-sm font-bold text-emerald-50 whitespace-nowrap">{t(`මාසය (Month):`)}</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-md text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button 
            onClick={handleDownloadWord}
            disabled={reportLoans.length === 0}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-white text-emerald-800 px-4 py-2 rounded-md font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
          >
            <Download size={16} /> Download (.doc)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500 font-medium animate-pulse">{t(`Loading data...`)}</div>
        ) : reportLoans.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <ShieldCheck size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
            <p className="font-semibold text-lg">{t(`කිසිදු දත්තයක් හමු නොවීය`)}</p>
            <p className="text-sm mt-1">{selectedMonth} {t(`මාසය සඳහා මුදාහැර ඇති ණය නොමැත.`)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-1">
            <div id="insurance-table-container">
              <table className="w-full text-sm text-left border-collapse border border-slate-300">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 border border-slate-300 w-10 text-center">{t(`No`)}</th>
                    <th className="px-4 py-2 border border-slate-300">{t(`Member Full Name`)}</th>
                    <th className="px-3 py-2 border border-slate-300">{t(`Loan Period`)}</th>
                    <th className="px-3 py-2 border border-slate-300">{t(`Member Gender`)}</th>
                    <th className="px-3 py-2 border border-slate-300">{t(`Member NIC No`)}</th>
                    <th className="px-4 py-2 border border-slate-300 w-32 text-right">{t(`Life Cover`)}</th>
                    <th className="px-4 py-2 border border-slate-300 w-32 text-right">{t(`Premium`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportLoans.map((l, index) => {
                    const m = getMemberData(l.memberId);
                    
                    // Format Loan Period
                    let periodStr = `${l.termMonths} Months`;
                    if (l.termMonths >= 12) {
                      const y = Math.floor(l.termMonths / 12);
                      periodStr = `${y} Year${y>1?'s':''}`;
                    }

                    // Format Gender
                    let gender = 'N/A';
                    if (m?.gender) {
                       const g = m.gender.toLowerCase();
                       gender = (g.startsWith('m') || g === 'පුරුෂ') ? 'Male' : (g.startsWith('f') || g === 'ස්ත්‍රී') ? 'Female' : m.gender;
                    }

                    return (
                      <tr key={l.loanId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 border border-slate-300 text-center text-slate-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-2 border border-slate-300 font-medium text-slate-800">{m?.fullName || m?.fullNameSinhala || 'Unknown'}</td>
                        <td className="px-3 py-2 border border-slate-300 text-slate-600">{periodStr}</td>
                        <td className="px-3 py-2 border border-slate-300 text-slate-600">{gender}</td>
                        <td className="px-3 py-2 border border-slate-300 text-slate-600 font-mono text-xs">{m?.nic || 'N/A'}</td>
                        <td className="border border-slate-300 bg-emerald-50/30 p-0">
                          <input 
                            type="number"
                            value={customData[l.loanId]?.lifeCover || ''}
                            onChange={(e) => handleCustomDataChange(l.loanId, 'lifeCover', e.target.value)}
                            className="w-full h-full min-h-[38px] px-3 py-2 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-semibold text-slate-800"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border border-slate-300 bg-emerald-50/30 p-0">
                          <input 
                            type="number"
                            value={customData[l.loanId]?.premium || ''}
                            onChange={(e) => handleCustomDataChange(l.loanId, 'premium', e.target.value)}
                            className="w-full h-full min-h-[38px] px-3 py-2 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right font-semibold text-slate-800"
                            placeholder="0.00"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <td colSpan={5} className="px-4 py-3 border border-slate-300"></td>
                    <td className="px-4 py-3 border border-slate-300 text-right">{calculateTotal('lifeCover').toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 border border-slate-300 text-right">{calculateTotal('premium').toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <p className="text-xs font-medium text-amber-800 mt-0.5 leading-relaxed">
                <strong>{t(`උපදෙස (Tip):`)}</strong> {t(`Life Cover සහ Premium අගයන් හිස් කොටුවල (Input boxes) Type කරන්න. ඊටපස්සේ "Download (.doc)" බටන් එක එබුවම, ඔයා Type කරපු අගයන් සහ එකතුව (Total) එක්කම Report එක Word File එකක් විදිහට Download වෙයි.`)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
