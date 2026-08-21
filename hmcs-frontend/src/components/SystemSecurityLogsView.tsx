import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import * as AuthService from '../services/auth.service';
import { X, ExternalLink } from 'lucide-react';
import axios from 'axios';

const defaultBranchMap: Record<number, string> = {
  1: 'Main Branch - Hikkaduwa',
  2: 'Dodanduwa Branch',
  3: 'Rathgama Branch',
  4: 'Seenigama Branch',
  5: 'Thiranagama Branch',
  6: 'Peraliya Branch',
  7: 'Kalupe Branch',
  8: 'Gonapinuwala Branch',
  9: 'Baddegama Main Branch',
  10: 'Sandarawala Branch',
  11: 'Galle Main Branch',
  12: 'Dodangoda Branch',
};

const defaultTenantMap: Record<number, string> = {
  0: 'Global Admin',
  1: 'Hikkaduwa Cooperative Society',
  2: 'Baddegama Cooperative Society',
  3: 'Galle Cooperative Society'
};

export default function SystemSecurityLogsView({ branchId }: { branchId?: number | null } = {}) {
  const { t } = useLanguage();
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [tenantMap, setTenantMap] = useState<Record<number, string>>(defaultTenantMap);
  const [branchMap, setBranchMap] = useState<Record<number, string>>(defaultBranchMap);

  useEffect(() => {
    fetchSystemLogs();
  }, []);

  const fetchSystemLogs = async () => {
    setLoadingSystem(true);
    try {
      const user = AuthService.getCurrentUser();
      let tid = user?.tenantId;
      if (tid === undefined || tid === null) {
          tid = 1;
      }
      
      const authHeader: Record<string, string> = {
        'X-Tenant-ID': tid.toString(),
      };
      
      const token = user?.token;
      if (token) {
        authHeader['Authorization'] = 'Bearer ' + token;
      }

      const baseUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth` : '/api/v1/auth';
      const res = await axios.get(`${baseUrl}/system-logs`, { 
          headers: authHeader,
          withCredentials: true
      });
      
      const filteredLogs = branchId ? res.data.filter((log: any) => log.branchId === branchId) : res.data;
      setSystemLogs(filteredLogs);

      try {
        if (!branchId) {
          const orgRes = await axios.get(`${baseUrl}/organizations`, { headers: authHeader, withCredentials: true });
          if (orgRes.data && Array.isArray(orgRes.data)) {
            const newTMap: Record<number, string> = { 0: 'Global Admin' };
            orgRes.data.forEach((o: any) => { newTMap[o.organizationId] = o.name; });
            setTenantMap(prev => ({ ...prev, ...newTMap }));
          }

          const branchRes = await axios.get(`${baseUrl}/branches`, { headers: authHeader, withCredentials: true });
          if (branchRes.data && Array.isArray(branchRes.data)) {
            const newBMap: Record<number, string> = {};
            branchRes.data.forEach((b: any) => { newBMap[b.branchId] = b.branchName; });
            setBranchMap(prev => ({ ...prev, ...newBMap }));
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic maps, using defaults", err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSystem(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {branchId ? t('ශාඛා ක්‍රියාකාරකම් වාර්තා (Branch Activity Logs)') : t('පද්ධති ආරක්ෂක වාර්තා (System Security Logs)')}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {branchId ? t('ශාඛාවේ සියලුම පරිශීලක ක්‍රියාකාරකම් මෙතැනින් බලාගන්න.') : t('පද්ධතියේ සියලුම ආරක්ෂක වාර්තා මෙතැනින් බලාගන්න.')}
        </p>
      </div>
      
      {loadingSystem ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">Loading Security Logs...</div>
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
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Username</th>
                  {!branchId && <th className="px-4 py-3">Organization</th>}
                  {!branchId && <th className="px-4 py-3">Branch</th>}
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {systemLogs.length === 0 ? (
                  <tr><td colSpan={!branchId ? 7 : 5} className="text-center py-8 text-slate-400">No security logs found.</td></tr>
                ) : (
                  systemLogs
                    .map(log => {
                      let tsStr = '';
                      if (Array.isArray(log.timestamp)) {
                        const pad = (n: number) => (n||0).toString().padStart(2, '0');
                        tsStr = `${log.timestamp[0]}-${pad(log.timestamp[1])}-${pad(log.timestamp[2])}T${pad(log.timestamp[3])}:${pad(log.timestamp[4])}:${pad(log.timestamp[5])}`;
                      } else {
                        tsStr = String(log.timestamp || '');
                      }
                      return { ...log, tsStr };
                    })
                    .filter(log => filterDate ? log.tsStr.startsWith(filterDate) : true)
                    .map((log, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {new Date(log.tsStr).toLocaleString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm inline-block ${(log.eventType||'').includes('SUCCESS') ? 'bg-emerald-50 text-emerald-700' : (log.eventType||'').includes('FAIL') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                          {log.eventType || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">
                        {log.username || 'System'}
                      </td>
                      {!branchId && (
                        <td className="px-4 py-3 text-slate-600 text-[11px] font-medium">
                          {tenantMap[log.tenantId] || (log.tenantId === 0 ? 'Global Admin' : `Tenant ${log.tenantId}`)}
                        </td>
                      )}
                      {!branchId && (
                        <td className="px-4 py-3 text-slate-600 text-[11px] font-medium">
                          {log.branchId ? (branchMap[log.branchId] || `Branch ${log.branchId}`) : '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600">
                        {log.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {log.ipAddress || 'Unknown'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
