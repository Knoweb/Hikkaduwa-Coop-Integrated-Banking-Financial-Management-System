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
      
      // Clear any previous session state to prevent tab leakage between different users
      sessionStorage.clear();
      
      // Redirect based on user role
      const role = response.role;
      if (role === 'SYSTEM_ADMIN' || role === 'PLATFORM_ADMIN') {
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
      } else if (role === 'SENIOR_OFFICER') {
        navigate('/cs/dashboard');
      } else {
        navigate('/branch/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'පිවිසීම අසාර්ථකයි. කරුණාකර ඔබගේ පරිශීලක නාමය සහ මුරපදය පරීක්ෂා කරන්න.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: "url('/images/banking_bg.png')" }}
    >
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[4px]"></div>
      
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col items-center">
          
          {/* Logo Section */}
          <div className="relative mb-8 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm p-1">
              <img src={logo} alt="HMCS Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
          </div>
          
          <div className="text-center mb-10 w-full">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2 tracking-tight">
              සමුපකාර බැංකු පද්ධතිය
            </h1>
            <p className="text-yellow-500/80 text-sm font-medium tracking-wide uppercase">සුරක්ෂිත පිවිසුම</p>
          </div>

          {error && (
            <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium backdrop-blur-md">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">පරිශීලක නාමය</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/50 transition-all backdrop-blur-md font-medium"
                  placeholder="පරිශීලක නාමය ඇතුළත් කරන්න"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">මුරපදය</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-black/20 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/50 transition-all backdrop-blur-md font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-yellow-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-slate-900 font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group bg-[length:200%_auto] hover:bg-right"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>තහවුරු කරමින්...</span>
                  </>
                ) : (
                  <span>පද්ධතියට ඇතුළු වන්න</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs font-medium">සමුපකාර බැංකු පද්ධතිය</p>
            <p className="text-slate-600 text-[10px] mt-1">© 2026 එනොවිටිව් බැංකු පද්ධතිය</p>
          </div>
        </div>
      </div>
    </div>
  );
}
