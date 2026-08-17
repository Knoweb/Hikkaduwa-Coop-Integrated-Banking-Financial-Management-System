import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import Members from './pages/Members';
import Accounts from './pages/Accounts';
import BranchDashboard from './pages/BranchDashboard';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ToastContainer';
import './utils/toast';
import { useEffect } from 'react';
import { logout } from './services/auth.service';

function IdleTimer() {
  useEffect(() => {
    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        await logout();
        window.location.href = '/login?expired=true';
      }, 15 * 60 * 1000); // 15 minutes
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  return null;
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
