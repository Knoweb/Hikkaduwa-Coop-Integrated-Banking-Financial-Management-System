import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, CreditCard, FileText } from 'lucide-react';
import * as AuthService from '../services/auth.service';
import logo from '../assets/logo.jpg';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <img src={logo} alt="HMCS Logo" className="w-8 h-8 rounded-lg object-cover mr-3 border border-slate-200" />
          <span className="font-bold text-slate-800 text-lg">HMCS Bank</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <a href="#" className="flex items-center px-3 py-2.5 bg-red-50 text-red-700 rounded-lg font-medium group">
              <LayoutDashboard size={20} className="mr-3 text-red-600" />
              Dashboard
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium group transition-colors">
              <Users size={20} className="mr-3 text-slate-400 group-hover:text-slate-600" />
              Members
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium group transition-colors">
              <CreditCard size={20} className="mr-3 text-slate-400 group-hover:text-slate-600" />
              Accounts
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium group transition-colors">
              <FileText size={20} className="mr-3 text-slate-400 group-hover:text-slate-600" />
              Loans
            </a>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-slate-800">Welcome back, {user.username}!</h1>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Branch ID: {user.branchId}
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Cards */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
        </div>
      </main>
    </div>
  );
}
