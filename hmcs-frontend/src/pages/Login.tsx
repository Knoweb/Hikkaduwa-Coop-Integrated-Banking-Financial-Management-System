import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, User, Loader2, Eye, EyeOff, Smartphone, Mail, Shield, ChevronRight } from 'lucide-react';
import * as AuthService from '../services/auth.service';
import logo from '../assets/logo.jpg';
import { useLanguage } from '../context/LanguageContext';


export default function Login() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [otpError, setOtpError] = useState('');
  const [mfaType, setMfaType] = useState('');
  const [showSetupMfaModal, setShowSetupMfaModal] = useState(false);
  const [setupQrCode, setSetupQrCode] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (lockoutRemaining === null || lockoutRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setLockoutRemaining(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
      window.history.replaceState({}, '', '/login');
    }
  }, [location]);

  const redirectBasedOnRole = (role: string) => {
    if (role === 'ORGANIZATION_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'AUDITOR') {
      navigate('/dashboard');
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
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate CAPTCHA if it's shown (failedAttempts >= 3)
    if (failedAttempts >= 3 && parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
      setError('ආරක්ෂිත තහවුරුව වැරදියි. (Invalid CAPTCHA)');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.login(username, password);
      
      // Clear any previous session state to prevent tab leakage between different users
      sessionStorage.clear();
      
      if (response.requireOtp) {
        setTempToken(response.tempToken);
        setMfaType(response.mfaType);
        if (response.mfaType === 'CHOOSE_METHOD' || response.mfaType === 'PENDING_SETUP' || response.mfaType === 'ENABLED') {
          setShowSetupMfaModal(true);
        } else {
          setShowOtpModal(true);
        }
        setLoading(false);
        return;
      }
      
      redirectBasedOnRole(response.role);
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(
        (typeof errorData === 'string' ? errorData : errorData?.message) || 'පිවිසීම අසාර්ථකයි. කරුණාකර ඔබගේ පරිශීලක නාමය සහ මුරපදය පරීක්ෂා කරන්න.'
      );
      if (errorData?.lockoutRemainingSeconds) {
        setLockoutRemaining(errorData.lockoutRemainingSeconds);
      }
      setFailedAttempts(prev => prev + 1);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || otpValue.length < 6) return;
    
    setOtpError('');
    setLoading(true);
    try {
      const response = await AuthService.verifyOtp(tempToken, otpValue);
      setShowOtpModal(false);
      setShowSetupMfaModal(false);
      redirectBasedOnRole(response.role);
    } catch (err: any) {
      const errorData = err.response?.data;
      setOtpError((typeof errorData === 'string' ? errorData : errorData?.message) || 'Invalid Code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otpValue.length === 6 && (showOtpModal || showSetupMfaModal)) {
      handleVerifyOtp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]);

  const handleSetupMfa = async (method: string) => {
    setLoading(true);
    setLoadingMethod(method);
    try {
      const response = await AuthService.setupMfa(tempToken, method);
      if (method === 'TOTP') {
        if (response.status === 'SETUP_REQUIRED') {
          setSetupQrCode(response.totpSecret);
        } else {
          setShowSetupMfaModal(false);
          setMfaType('TOTP');
          setShowOtpModal(true);
        }
      } else {
        setShowSetupMfaModal(false);
        setMfaType('EMAIL');
        setShowOtpModal(true);
        setResendCooldown(60);
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setError((typeof errorData === 'string' ? errorData : errorData?.message) || 'MFA setup failed');
      setShowSetupMfaModal(false);
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
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2 tracking-tight leading-tight">
              {t(`සමුපකාර බැංකු පද්ධතිය`)}<br />
              <span className="text-lg font-bold text-slate-400">Cooperative Banking System</span>
            </h1>
            <p className="text-yellow-500/80 text-xs font-semibold tracking-wide uppercase">{t(`සුරක්ෂිත පිවිසුම / Secure Login`)}</p>
          </div>

          {lockoutRemaining !== null && lockoutRemaining > 0 && (
            <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium backdrop-blur-md">
              ගිණුම තාවකාලිකව අගුළු දමා ඇත.<br/>නැවත උත්සාහ කිරීමට පෙර <span className="font-bold text-lg">{Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}</span> ක් රැඳී සිටින්න.
            </div>
          )}
          {error && (!lockoutRemaining || lockoutRemaining <= 0) && (
            <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium backdrop-blur-md">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t(`පරිශීලක නාමය (Username)`)}</label>
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
                  placeholder={t(`Enter Username / පරිශීලක නාමය`)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t(`මුරපදය (Password)`)}</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {failedAttempts >= 3 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">ආරක්ෂිත තහවුරුව (SECURITY CHECK)</label>
                <div className="flex gap-3">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center font-bold text-yellow-500 text-lg tracking-wider">
                    {captchaNum1} + {captchaNum2} =
                  </div>
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white text-center font-bold text-lg focus:ring-2 focus:ring-yellow-500/50"
                    placeholder="?"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-slate-900 font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group bg-[length:200%_auto] hover:bg-right"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{t(`තහවුරු කරමින්... / Authenticating...`)}</span>
                  </>
                ) : (
                  <span>{t(`පද්ධතියට ඇතුළු වන්න (Sign In)`)}</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 text-center space-y-1">
            <p className="text-slate-500 text-xs font-medium">{t(`සමුපකාර බැංකු පද්ධතිය / HMCS Bank`)}</p>
            <p className="text-slate-600 text-[10px]">© 2026 All Rights Reserved Knoweb (Pvt) Ltd</p>
          </div>
        </div>
      </div>
      
      {/* MFA Setup Modal */}
      {showSetupMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Decorative Top Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-[50px]"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[50px]"></div>

            <div className="relative z-10">
            {!setupQrCode ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(234,179,8,0.15)] relative group">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl animate-ping opacity-20"></div>
                    <Shield className="text-yellow-500" size={36} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 text-xl tracking-tight mb-2">
                    {t(`කරුණාකර පහතින් එක් ක්‍රමයක් තෝරන්න`)}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Please choose a Two-Factor Authentication method
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-2">
                  <button 
                    type="button"
                    onClick={() => handleSetupMfa('TOTP')}
                    disabled={loading}
                    className="flex items-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-yellow-500/30 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:via-yellow-500/5 group-hover:to-transparent transition-all duration-500"></div>
                    <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center mr-4 border border-white/5 group-hover:border-yellow-500/30 transition-colors relative z-10">
                      <Smartphone size={24} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
                    </div>
                    <div className="flex-1 relative z-10">
                      <h4 className="font-bold text-slate-200 text-sm mb-1 group-hover:text-white transition-colors">{t(`Authenticator App`)}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t(`Google Authenticator හෝ Authy මගින් ආරක්ෂිතව පිවිසෙන්න.`)}<br/>
                        <span className="text-[10px] opacity-75 mt-0.5 inline-block">Login securely using Google Authenticator or Authy.</span>
                      </p>
                    </div>
                    {loading && loadingMethod === 'TOTP' ? (
                      <Loader2 size={20} className="text-yellow-500 animate-spin relative z-10" />
                    ) : (
                      <ChevronRight size={20} className="text-slate-600 group-hover:text-yellow-500 relative z-10 transition-colors transform group-hover:translate-x-1" />
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => handleSetupMfa('EMAIL')}
                    disabled={loading}
                    className="flex items-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-blue-500/5 group-hover:to-transparent transition-all duration-500"></div>
                    <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center mr-4 border border-white/5 group-hover:border-blue-500/30 transition-colors relative z-10">
                      <Mail size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex-1 relative z-10">
                      <h4 className="font-bold text-slate-200 text-sm mb-1 group-hover:text-white transition-colors">{t(`Email Verification`)}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t(`ඔබගේ ලියාපදිංචි ඊමේල් ලිපිනයට කේතයක් ලබාගන්න.`)}<br/>
                        <span className="text-[10px] opacity-75 mt-0.5 inline-block">Receive a verification code to your registered email address.</span>
                      </p>
                    </div>
                    {loading && loadingMethod === 'EMAIL' ? (
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="text-xs text-blue-400 font-medium">Please wait...</span>
                        <Loader2 size={20} className="text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-500 relative z-10 transition-colors transform group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 text-2xl tracking-tight mb-2">Setup Authenticator</h3>
                
                <div className="bg-yellow-500/10 text-yellow-200/90 text-xs text-left p-4 rounded-2xl border border-yellow-500/20 mb-6 space-y-3 backdrop-blur-sm">
                  <div>
                    <p className="font-bold text-sm text-yellow-500">1. Google Authenticator ඇප් එක විවෘත කරන්න.</p>
                    <p className="text-yellow-500/60 mt-1">Open the Google Authenticator app on your phone.</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-yellow-500">2. යට ඇති '+' ලකුණ ඔබා "Scan a QR code" තෝරන්න.</p>
                    <p className="text-yellow-500/60 mt-1">Tap the '+' icon at the bottom and select "Scan a QR code".</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-3xl inline-block border-[6px] border-white/10 mb-6 shadow-2xl relative">
                  <QRCodeSVG 
                    value={`otpauth://totp/HMCS:${username}?secret=${setupQrCode}&issuer=HMCS_Bank`} 
                    size={200} 
                  />
                </div>
                
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 mb-8 text-center flex flex-col items-center justify-center">
                   <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Secret Key</span>
                   <span className="font-mono text-slate-300 text-sm tracking-wider select-all">{setupQrCode}</span>
                </div>
                
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {otpError && (
                    <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-bold backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                      {otpError}
                    </div>
                  )}
                  <div>
                    <input
                      type="text"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      required
                      className="w-full text-center text-3xl tracking-[0.5em] px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-mono shadow-inner mb-2"
                      placeholder="------"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otpValue.length < 6}
                    className="w-full py-4 px-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-slate-900 font-black rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all bg-[length:200%_auto] hover:bg-right focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Verify & Finish Setup</span>}
                  </button>
                </form>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] w-full max-w-sm transform transition-all animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Decorative Top Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-[50px]"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-[50px]"></div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(234,179,8,0.15)] relative group">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl animate-ping opacity-20"></div>
                  <Lock className="text-yellow-500" size={36} strokeWidth={1.5} />
                </div>
                <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 text-2xl tracking-tight mb-2">Two-Factor Auth</h3>
                <p className="text-slate-400 text-sm font-medium">
                  {mfaType === 'EMAIL' ? 'Please enter the verification code sent to your email.' : 'Please enter the 6-digit code from your Authenticator app.'}
                </p>
              </div>
              
              {otpError && (
                <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-bold backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  {otpError}
                </div>
              )}
              
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Verification Code</label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    required
                    className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-mono shadow-inner"
                    placeholder="------"
                    maxLength={6}
                  />
                  {mfaType === 'EMAIL' && (
                    <div className="flex justify-center mt-4 mb-2">
                      <button 
                        type="button" 
                        onClick={() => handleSetupMfa('EMAIL')} 
                        disabled={resendCooldown > 0}
                        className={`text-sm font-bold flex flex-col items-center gap-1 transition-colors px-4 py-2 rounded-xl ${resendCooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                      >
                        <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send Code Again'}</span>
                        {resendCooldown === 0 && <span className="text-[10px] text-slate-500 font-normal tracking-wide">නැවත කේතය යවන්න</span>}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowOtpModal(false); setTempToken(''); setOtpValue(''); }}
                    className="w-1/3 py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpValue.length < 6}
                    className="flex-1 py-4 px-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-slate-900 font-black rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all bg-[length:200%_auto] hover:bg-right focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Verify Account</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
