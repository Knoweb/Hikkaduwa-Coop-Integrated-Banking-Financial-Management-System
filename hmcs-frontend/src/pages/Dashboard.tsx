import { Users, CreditCard, FileText, Clock, Database, Building, Settings, Save } from 'lucide-react';
import * as AuthService from '../services/auth.service';
import Layout from '../components/Layout';

export default function Dashboard() {
  const user = AuthService.getCurrentUser();
  if (!user) return null;

  const isSystemAdmin = user.role === 'ROLE_SYSTEM_ADMIN';

  return (
    <Layout>
      {isSystemAdmin ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* System Admin Summary Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Active Users</p>
                  <h3 className="text-3xl font-bold text-slate-800">42</h3>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <Users size={24} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-emerald-500 font-medium">Healthy</span>
                <span className="text-slate-500 ml-2">across all branches</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">System Uptime</p>
                  <h3 className="text-3xl font-bold text-slate-800">99.9%</h3>
                </div>
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                  <Clock size={24} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-emerald-500 font-medium">Online</span>
                <span className="text-slate-500 ml-2">for 45 days</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Daily Backup</p>
                  <h3 className="text-3xl font-bold text-slate-800">Success</h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Database size={24} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-slate-500">Last backup: </span>
                <span className="text-slate-700 font-medium ml-1">02:00 AM</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Active Branches</p>
                  <h3 className="text-3xl font-bold text-slate-800">8 / 8</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Building size={24} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-emerald-500 font-medium">All Online</span>
                <span className="text-slate-500 ml-2">connected sync</span>
              </div>
            </div>
          </div>

          {/* System Administrator Configuration Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-800">Global System Parameters</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Configure interest rates and rules across all 8 branches.</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Fixed Deposit Configuration */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800 border-b border-slate-100 pb-2">Fixed Deposit (FD) Setup</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Base Interest Rate (%)</label>
                      <input type="number" defaultValue={8.00} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Bonus Rate (%)</label>
                      <input type="number" defaultValue={2.50} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-1">Max Loan Against FD (%)</label>
                      <input type="number" defaultValue={85} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Pawning & Insurance Configuration */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800 border-b border-slate-100 pb-2">Pawning & Insurance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Pawning Rate (% p.a.)</label>
                      <input type="number" defaultValue={13.00} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Max Term (Months)</label>
                      <input type="number" defaultValue={12} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-1">Life Insurance Premium Deduction (%)</label>
                      <input type="number" defaultValue={2.00} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end pt-4 border-t border-slate-100">
                <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                  <Save size={18} />
                  Save Global Configurations
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stat Cards for Branch Managers / Tellers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Members</p>
                <h3 className="text-3xl font-bold text-slate-800">1,248</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Users size={24} />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-emerald-500 font-medium">+12</span>
              <span className="text-slate-500 ml-2">this week</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Loans</p>
                <h3 className="text-3xl font-bold text-slate-800">Rs. 4.2M</h3>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <FileText size={24} />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-emerald-500 font-medium">+Rs. 500K</span>
              <span className="text-slate-500 ml-2">this month</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Deposits</p>
                <h3 className="text-3xl font-bold text-slate-800">Rs. 8.5M</h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <CreditCard size={24} />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-emerald-500 font-medium">+2.4%</span>
              <span className="text-slate-500 ml-2">vs last month</span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
