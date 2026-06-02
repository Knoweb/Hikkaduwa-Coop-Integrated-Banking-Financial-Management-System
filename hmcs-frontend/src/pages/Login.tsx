import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import * as AuthService from '../services/auth.service';
import logo from '../assets/logo.jpg';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.login(username, password);
      
      // Redirect based on user role
      const role = response.role;
      if (role === 'SYSTEM_ADMIN') {
        navigate('/dashboard');
      } else if (role === 'GENERAL_MANAGER') {
        navigate('/manager/dashboard');
      } else if (role === 'BRANCH_MANAGER') {
        navigate('/branch/dashboard');
      } else if (role === 'BANK_SERVICE_MANAGER') {
        navigate('/bsm/dashboard');
      } else if (role === 'LOAN_COMMITTEE') {
        navigate('/committee/dashboard');
      } else if (role === 'FIELD_OFFICER') {
        navigate('/officer/dashboard');
      } else if (role === 'TELLER') {
        navigate('/teller/dashboard');
      } else if (role === 'VALUER') {
        navigate('/valuer/dashboard');
      } else {
        navigate('/branch/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 overflow-hidden border-2 border-white/10">
              <img src={logo} alt="HMCS Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">HMCS Banking</h1>
            <p className="text-red-200/80 text-sm">Sign in to your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-200/90 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-300 group-focus-within:text-yellow-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-red-200/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-red-200/90 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-red-300 group-focus-within:text-yellow-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-red-200/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-red-300 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 px-4 bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-yellow-500/25 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
              
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-red-200/50">
            <p>Hikkaduwa Multi-Purpose Co-operative Society Ltd.</p>
            <p className="mt-1">© 2026 Integrated Banking System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
