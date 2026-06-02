import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import Members from './pages/Members';
import Accounts from './pages/Accounts';
import GeneralManagerDashboard from './pages/GeneralManagerDashboard';
import BranchDashboard from './pages/BranchDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<SystemAdminDashboard />} />
        <Route path="/manager/dashboard" element={<GeneralManagerDashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/accounts" element={<Accounts />} />
        {/* Branch role dashboards — all use the same smart component */}
        <Route path="/branch/dashboard"    element={<BranchDashboard />} />
        <Route path="/teller/dashboard"    element={<BranchDashboard />} />
        <Route path="/valuer/dashboard"    element={<BranchDashboard />} />
        <Route path="/officer/dashboard"   element={<BranchDashboard />} />
        <Route path="/committee/dashboard" element={<BranchDashboard />} />
        <Route path="/bsm/dashboard"       element={<BranchDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
