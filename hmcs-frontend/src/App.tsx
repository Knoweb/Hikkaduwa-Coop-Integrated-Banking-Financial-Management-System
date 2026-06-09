import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import Members from './pages/Members';
import Accounts from './pages/Accounts';
import GeneralManagerDashboard from './pages/GeneralManagerDashboard';
import BranchDashboard from './pages/BranchDashboard';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          {/* System Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
            <Route path="/dashboard" element={<SystemAdminDashboard />} />
          </Route>

          {/* General Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['GENERAL_MANAGER']} />}>
            <Route path="/manager/dashboard" element={<GeneralManagerDashboard />} />
          </Route>

          {/* Shared Branch Roles Routes */}
          <Route element={<ProtectedRoute allowedRoles={['BRANCH_MANAGER', 'TELLER', 'VALUER', 'FIELD_OFFICER', 'LOAN_COMMITTEE', 'BANK_SERVICE_MANAGER', 'SENIOR_OFFICER', 'SYSTEM_ADMIN']} />}>
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
