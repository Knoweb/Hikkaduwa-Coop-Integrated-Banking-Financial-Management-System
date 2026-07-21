import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, CreditCard, FileText, Settings } from 'lucide-react';
import * as AuthService from '../services/auth.service';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.jpg';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const isSystemAdmin = user.role === 'ROLE_ORGANIZATION_ADMIN';

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const { t } = useLanguage();
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center px-3 py-2.5 rounded-lg font-medium group transition-colors ${
          isActive
            ? 'bg-red-50 text-red-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Icon size={20} className={`mr-3 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        {t(label)}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <img src={logo} alt="HMCS Logo" className="w-8 h-8 rounded-lg object-cover mr-3 border border-slate-200" />
          <span className="font-bold text-slate-800 text-lg">{user.organizationName ? t(user.organizationName) : 'HMCS Bank'}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/members" icon={Users} label="Users & Members" />
            
            <NavItem to="/accounts" icon={CreditCard} label="Accounts" />
            <NavItem to="/loans" icon={FileText} label="Loans" />
            {isSystemAdmin && (
              <NavItem to="/settings" icon={Settings} label="Global Settings" />
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold shrink-0">
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
      <main className="flex-1 flex flex-col md:ml-64 relative min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800">Welcome back, {user.username}!</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Branch ID: {user.branchId}
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'en' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5"></div>
              <button onClick={() => setLanguage('si')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'si' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t(`සිංහල`)}</button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5"></div>
              <button onClick={() => setLanguage('ta')} className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${language === 'ta' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>தமிழ்</button>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
              title={t('Sign Out')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        
        <div className="p-8 pb-12 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
