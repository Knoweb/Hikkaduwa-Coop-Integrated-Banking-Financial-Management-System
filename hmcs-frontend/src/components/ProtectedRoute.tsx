import { Navigate, Outlet } from 'react-router-dom';
import * as AuthService from '../services/auth.service';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const user = AuthService.getCurrentUser();

  // If user is not logged in at all, kick them to login screen
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, but their role is not authorized for this route
  if (!allowedRoles.includes(user.role)) {
    // We seamlessly redirect them to their specific role dashboard
    switch (user.role) {
      case 'SYSTEM_ADMIN': return <Navigate to="/dashboard" replace />;
      case 'GENERAL_MANAGER': return <Navigate to="/manager/dashboard" replace />;
      case 'BRANCH_MANAGER': return <Navigate to="/branch/dashboard" replace />;
      case 'TELLER': return <Navigate to="/teller/dashboard" replace />;
      case 'VALUER': return <Navigate to="/valuer/dashboard" replace />;
      case 'FIELD_OFFICER': return <Navigate to="/officer/dashboard" replace />;
      case 'LOAN_COMMITTEE': return <Navigate to="/committee/dashboard" replace />;
      case 'BANK_SERVICE_MANAGER': return <Navigate to="/bsm/dashboard" replace />;
      case 'SENIOR_OFFICER': return <Navigate to="/cs/dashboard" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  // If they have the correct role, allow access to the requested route
  return <Outlet />;
};
