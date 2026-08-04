import React, { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import * as AuthService from '../services/auth.service';
import * as AccountService from '../services/account.service';

const formatModuleType = (log: any) => {
  const mod = (log.moduleType || 'UNKNOWN').toUpperCase();
  const txType = (log.transactionType || '').toUpperCase();

  // Loans
  if (mod.includes('LOAN')) {
    if (mod.includes('DISBURSEMENT') || txType.includes('DISBURSEMENT')) return 'Loan Disbursement (ණය ලබාදීම්)';
    if (mod.includes('REPAYMENT') || txType.includes('REPAYMENT')) return 'Loan Repayment (ණය වාරික ගෙවීම්)';
    return 'Loan Repayment (ණය වාරික ගෙවීම්)';
  }

  // Savings
  if (mod.includes('SAVING')) {
    if (mod.includes('DEPOSIT') || txType === 'DEPOSIT') return 'Savings Deposit (තැන්පතුව)';
    if (mod.includes('WITHDRAW') || txType === 'WITHDRAWAL') return 'Savings Withdrawal (ආපසු ගැනීම)';
    if (mod.includes('INITIAL') || txType === 'INITIAL_DEPOSIT') return 'Initial Deposit (මූලික තැන්පතුව)';
    return 'Savings (ඉතිරිකිරීම්)';
  }

  // Fixed Deposit
  if (mod.includes('FIXED_DEPOSIT_OPEN') || mod === 'FIXED_DEPOSIT' || mod.includes('FIXED')) {
    return 'Fixed Deposit Open (නව ස්ථාවර තැන්පතුවක්)';
  }

  // Pawning
  if (mod.includes('PAWN')) {
    if (mod.includes('GRANT') || mod.includes('ADVANCE') || txType.includes('ADVANCE')) return 'Pawning Advance (නව උකස් ණය)';
    if (mod.includes('REDEMP') || mod.includes('PAYMENT') || txType.includes('PAYMENT')) return 'Pawning Redemption (උකස් බේරා ගැනීම)';
    return 'Pawning (උකස් ගනුදෙනු)';
  }

  return mod;
};

const getModuleBadgeStyle = (log: any) => {
  const mod = (log.moduleType || '').toUpperCase();
  const txType = (log.transactionType || '').toUpperCase();
  if (mod.includes('SAVING')) {
    if (mod.includes('DEPOSIT') || txType === 'DEPOSIT' || txType === 'INITIAL_DEPOSIT') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (mod.includes('WITHDRAW') || txType === 'WITHDRAWAL') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (mod.includes('FIXED')) return 'bg-purple-50 text-purple-700 border border-purple-200';
  if (mod.includes('PAWN')) return 'bg-orange-50 text-orange-700 border border-orange-200';
  return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
};

export default function AuditLogsView() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [membersMap, setMembersMap] = useState<Record<string, { memberNo: string, name: string }>>({});

  useEffect(() => {
    fetchLogs();
    AccountService.getBranchMembers().then(members => {
      const map: Record<string, { memberNo: string, name: string }> = {};
      members.forEach(m => {
        if (m.memberId) {
          map[String(m.memberId)] = {
            memberNo: m.membershipNumber || m.memberNumber || String(m.id || m.memberId),
            name: m.fullName || m.nameWithInitials || 'සාමාජික (Member)'
          };
        }
      });
      setMembersMap(map);
    }).catch(() => {});
  }, []);

  const formatDescription = (ref: string) => {
    if (!ref) return '';
    const parts = ref.split(/—|\|/).map(s => s.trim()).filter(Boolean);
    if (parts.length <= 1) return ref;

    let res = parts[0];
    for (let i = 1; i < parts.length; i++) {
      let detail = parts[i];
      if (detail.startsWith('Member:')) {
        const uuid = detail.replace('Member:', '').trim();
        const memberInfo = membersMap[uuid];
        if (memberInfo) {
          if (memberInfo.memberNo) res += ` | සාමාජික අංකය: ${memberInfo.memberNo}`;
          if (memberInfo.name) res += ` | සාමාජික නාමය: ${memberInfo.name}`;
          continue;
        }
      } else if (detail.startsWith('Method:')) {
        detail = detail.replace('Method:', 'ක්‍රමය:');
      }
      res += ` | ${detail}`;
    }
    return res;
  };

  const fetchLogs = async () => {
    try {
      const userObjStr = localStorage.getItem('user');
      const userObj = userObjStr ? JSON.parse(userObjStr) : {};
      const token = userObj.token || '';
      const authHeader: Record<string, string> = {
        'Authorization': 'Bearer ' + token,
      };
      
      const user = AuthService.getCurrentUser();
      let tid = user?.branchId || user?.tenantId || 1;
      
      const overrideBranchId = localStorage.getItem('overrideBranchId');
      if (overrideBranchId && (user?.role === 'ORGANIZATION_ADMIN' || user?.role === 'AUDITOR')) {
         tid = overrideBranchId.includes(':') ? parseInt(overrideBranchId.split(':').pop() || '1', 10) : parseInt(overrideBranchId, 10);
      } else if (typeof user?.branchId === 'string' && user.branchId.includes(':')) {
         tid = parseInt(user.branchId.split(':').pop() || '1', 10);
      }
      
      authHeader['X-Tenant-ID'] = tid.toString();

      const res = await fetch('http://localhost:8080/api/v1/audit/corrections', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">{t('ගනුදෙනු සංශෝධන වාර්තා (Transaction Corrections Audit)')}</h2>
        <p className="text-slate-500 text-sm mt-1">මෙම පද්ධතිය හරහා මකාදමන ලද හෝ සංශෝධනය කරන ලද සියලුම ගනුදෙනු වල සවිස්තරාත්මක වාර්තාව.</p>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">Loading Audit Logs...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-600">Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-slate-400 hover:text-red-500 p-1">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3 text-right">Old Amount</th>
                <th className="px-4 py-3 text-right">New Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Manager ID</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.filter(log => filterDate ? log.timestamp.startsWith(filterDate) : true).length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">No correction logs found.</td></tr>
              ) : (
                logs.filter(log => filterDate ? log.timestamp.startsWith(filterDate) : true).map((log, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm inline-block ${getModuleBadgeStyle(log)}`}>
                        {formatModuleType(log)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs truncate max-w-[120px]" title={log.transactionId}>
                      {log.transactionId}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-mono line-through">
                      Rs. {Number(log.oldAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-mono font-bold">
                      Rs. {Number(log.newAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs truncate max-w-[100px]" title={log.managerId}>
                      {log.managerId || 'SYSTEM'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedLog(log)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">ගනුදෙනු සංශෝධන විස්තර (Transaction Correction Details)</h3>
              <button onClick={() => setSelectedLog(null)} className="text-blue-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">මුල් ගනුදෙනුව ඇතුළත් කළ නිලධාරියා (Original Creator)</p>
                  <p className="font-semibold text-slate-800">{selectedLog.originalCreatorFullName || selectedLog.originalCreatorUsername || 'Unknown'}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">සංශෝධනය කළ ශාඛා කළමනාකරු (Edited By Branch Manager)</p>
                  <p className="font-semibold text-slate-800">{selectedLog.managerFullName || selectedLog.managerId || 'SYSTEM'}</p>
                </div>
              </div>

              <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">පැරණි මුදල (Old Amount)</p>
                  <p className="font-bold text-red-600 font-mono text-lg line-through">Rs. {Number(selectedLog.oldAmount).toFixed(2)}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-lg">→</span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">නව මුදල (New Amount)</p>
                  <p className="font-bold text-emerald-600 font-mono text-lg">Rs. {Number(selectedLog.newAmount).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ගනුදෙනු අංකය (Transaction ID)</p>
                  <p className="text-sm font-mono text-slate-600 truncate">{selectedLog.transactionId}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ගනුදෙනු වර්ගය (Transaction Type)</p>
                  <p className="text-sm font-semibold text-slate-700">{formatModuleType(selectedLog)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">මුල් ගනුදෙනුව ඇතුළත් කළ දිනය සහ වේලාව</p>
                  <p className="text-sm font-mono text-slate-600">{selectedLog.originalTimestamp ? new Date(selectedLog.originalTimestamp).toLocaleString('en-GB') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ගනුදෙනුව සංශෝධනය කළ දිනය සහ වේලාව</p>
                  <p className="text-sm font-mono text-slate-600">{new Date(selectedLog.timestamp).toLocaleString('en-GB')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">සංශෝධනය කිරීමට හේතුව (Reason for Change)</p>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-700 text-sm italic">
                  "{selectedLog.reason}"
                </div>
              </div>

              {selectedLog.transactionReference && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ගනුදෙනුව පිළිබඳ විස්තරය / යොමුව (Description)</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-700 text-sm">
                    {formatDescription(selectedLog.transactionReference)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
