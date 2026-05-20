import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, XCircle, FileText, BarChart3, Landmark } from 'lucide-react';
import Layout from '../components/Layout';
import * as AccountService from '../services/account.service';

export default function GeneralManagerDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock approval queue data
  const [approvals] = useState([
    { id: 'L-1024', member: 'Aruni Wijesinghe', amount: 250000, type: 'Personal Loan', branch: 'Hikkaduwa Main', date: '2026-05-14' },
    { id: 'L-1025', member: 'Sunil Perera', amount: 1500000, type: 'Housing Loan', branch: 'Galle Road', date: '2026-05-15' },
    { id: 'L-1026', member: 'Kamal Gunawardena', amount: 500000, type: 'Business Loan', branch: 'Pitiwella', date: '2026-05-15' },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await AccountService.getAdminSummary();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load admin summary", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-full">Loading Global Intelligence...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1">Consolidated view across all 8 branches of Hikkaduwa Co-operative Society.</p>
        </div>

        {/* Global Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-3xl shadow-xl shadow-red-200 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Landmark size={80} />
            </div>
            <p className="text-red-100 text-sm font-medium mb-1">Consolidated Net Cash</p>
            <h3 className="text-3xl font-bold">Rs. {summary?.totalSavings?.toLocaleString() || '0'}</h3>
            <div className="mt-4 flex items-center text-red-100 text-xs">
              <TrendingUp size={14} className="mr-1" />
              <span>+4.2% from yesterday</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BarChart3 size={80} />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Loan Portfolio</p>
            <h3 className="text-3xl font-bold">Rs. {summary?.totalLoans?.toLocaleString() || '0'}</h3>
            <div className="mt-4 flex items-center text-slate-400 text-xs">
              <TrendingUp size={14} className="mr-1" />
              <span>Active across all branches</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden group">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Society Members</p>
            <h3 className="text-3xl font-bold text-slate-900">{summary?.totalMembers || '0'}</h3>
            <div className="mt-4 flex items-center text-emerald-600 text-xs font-bold">
              <CheckCircle2 size={14} className="mr-1" />
              <span>98% Active Status</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden group">
            <p className="text-slate-500 text-sm font-medium mb-1">Pending Approvals</p>
            <h3 className="text-3xl font-bold text-red-600">{approvals.length}</h3>
            <div className="mt-4 flex items-center text-red-500 text-xs font-bold">
              <AlertCircle size={14} className="mr-1" />
              <span>Requires immediate signature</span>
            </div>
          </div>
        </div>

        {/* Approval Queue */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Final Approval Queue</h3>
              <p className="text-sm text-slate-500">Loan applications requiring General Manager's final signature.</p>
            </div>
            <button className="text-red-600 text-sm font-bold hover:underline">View All Requests</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Application</th>
                  <th className="px-6 py-4 font-semibold">Member</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold">Branch</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.id}</p>
                          <p className="text-xs text-slate-500">{item.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-700">{item.member}</p>
                      <p className="text-xs text-slate-400">Applied on {item.date}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">
                        {item.branch}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                          <CheckCircle2 size={20} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
