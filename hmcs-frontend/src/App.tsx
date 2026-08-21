import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import Members from './pages/Members';
import Accounts from './pages/Accounts';
import BranchDashboard from './pages/BranchDashboard';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import './utils/toast';
import { useEffect, useState } from 'react';
import { logout, getCurrentUser } from './services/auth.service';
import { AlertTriangle } from 'lucide-react';

function IdleTimer() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let warningTimeoutId: number;
    let logoutTimeoutId: number;
    let countdownIntervalId: number;

    const timeoutDuration = 60 * 60 * 1000; // 60 mins
    const warningDuration = 55 * 60 * 1000; // Show warning at 55 mins

    const clearTimers = () => {
      window.clearTimeout(warningTimeoutId);
      window.clearTimeout(logoutTimeoutId);
      window.clearInterval(countdownIntervalId);
    };

    const resetTimer = () => {
      if (!getCurrentUser()) return; // Don't run timers if not logged in
      
      setShowWarning(false);
      clearTimers();

      warningTimeoutId = window.setTimeout(() => {
        if (!getCurrentUser()) return;
        setShowWarning(true);
        setTimeLeft(5 * 60); // 5 mins in seconds

        countdownIntervalId = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              window.clearInterval(countdownIntervalId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningDuration);

      logoutTimeoutId = window.setTimeout(async () => {
        if (!getCurrentUser()) return;
        await logout();
        window.location.href = '/login?expired=true';
      }, timeoutDuration);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      clearTimers();
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4 text-amber-500">
          <AlertTriangle size={48} />
        </div>
        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Session Expiring Soon</h3>
        <p className="text-center text-slate-600 mb-6">
          You have been inactive. Your session will expire and you will be logged out in <strong className="text-red-600">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong> minutes to protect your data.
        </p>
        <button 
          onClick={() => {
            setShowWarning(false);
            window.dispatchEvent(new Event('mousemove')); // Hack to trigger reset
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Keep Me Logged In
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <IdleTimer />
      <ToastContainer />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          {/* System Admin & Auditor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'AUDITOR']} />}>
            <Route path="/dashboard" element={<SystemAdminDashboard />} />
            <Route path="/admin/branch/:id" element={<BranchDashboard />} />
          </Route>

          {/* Shared Branch Roles Routes */}
          <Route element={<ProtectedRoute allowedRoles={['BRANCH_MANAGER', 'TELLER', 'VALUER', 'FIELD_OFFICER', 'LOAN_COMMITTEE', 'BANK_SERVICE_MANAGER', 'SENIOR_OFFICER', 'ORGANIZATION_ADMIN']} />}>
            <Route path="/members" element={<Members />} />
            <Route path="/accounts" element={<Accounts />} />
          </Route>

          {/* Branch role dashboards — all use the same smart component */}
          <Route element={<ProtectedRoute allowedRoles={['BRANCH_MANAGER']} />}>
            <Route path="/branch/dashboard" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['TELLER']} />}>
            <Route path="/teller/dashboard" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['VALUER']} />}>
            <Route path="/valuer/dashboard" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['FIELD_OFFICER']} />}>
            <Route path="/officer/dashboard" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['LOAN_COMMITTEE']} />}>
            <Route path="/committee/dashboard" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['BANK_SERVICE_MANAGER']} />}>
            <Route path="/bsm/dashboard" element={<BranchDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['SENIOR_OFFICER']} />}>
            <Route path="/cs/dashboard" element={<BranchDashboard />} />
          </Route>
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
