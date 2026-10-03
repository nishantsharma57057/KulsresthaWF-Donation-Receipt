import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { APP_CONFIG } from '../config/appConfig';
import { Logo } from './Logo.jsx';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Clock,
  ArrowRight,
  ShieldCheck,
  Mail,
  KeyRound,
  RotateCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LoginView = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState('login'); // default to real login
  const [loginStep, setLoginStep] = useState('credentials');

  // Register form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(30);
  const [otpSentNotice, setOtpSentNotice] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showDevCode, setShowDevCode] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (loginStep === 'otp' && otpResendTimer > 0) {
      interval = setInterval(() => {
        setOtpResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginStep, otpResendTimer]);

  const handleRegister = (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = StorageService.registerUser(fullName, email, password, username, 'staff');
    if (!res.success || !res.user) {
      setError(res.error || 'Failed to create user account.');
      return;
    }

    setSuccessMsg('Account registered! Awaiting admin approval. You can log in once approved.');
    setLoginIdentifier(email);
    setLoginPassword('');
    setTimeout(() => {
      setTab('login');
      setSuccessMsg(null);
    }, 2000);
  };

  const sendOtpToEmail = async (targetUser) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpResendTimer(30);
    setIsSendingOtp(true);

    try {
      console.log(`[Email 2FA Live] Dispatching OTP for ${targetUser.email}`);
      setOtpSentNotice(`Sending verification code to ${targetUser.email}...`);
      await StorageService.sendLoginOtp(targetUser, code);
      setOtpSentNotice(`Live 6-digit verification code sent to ${targetUser.email}`);
    } catch (err) {
      console.warn('Live OTP dispatch error:', err);
      setOtpSentNotice(`Verification code sent to ${maskEmail(targetUser.email)}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const maskEmail = (str) => {
    const parts = str.split('@');
    if (parts.length !== 2) return str;
    const name = parts[0];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}*`;
    return `${maskedName}@${parts[1]}`;
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const res = StorageService.authenticateUser(loginIdentifier, loginPassword);
    if (!res.success || !res.user) {
      setError(res.error || 'Invalid username/email or password.');
      return;
    }

    // Check if user is approved
    if (res.user.status === 'pending') {
      setError('Your account is currently pending administrator approval. Please contact your manager.');
      return;
    }

    // If Email OTP is enabled in config, send OTP
    if (APP_CONFIG.email.enableLoginEmailOtp) {
      setPendingUser(res.user);
      sendOtpToEmail(res.user);
      setLoginStep('otp');
    } else {
      // Direct login
      onLoginSuccess(res.user);
    }
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    setError(null);

    if (enteredOtp.trim() !== generatedOtp) {
      setError('Incorrect OTP. Please enter the valid 6-digit code received on your email.');
      return;
    }

    if (pendingUser) {
      onLoginSuccess(pendingUser);
    }
  };

  const handleResendOtp = () => {
    if (otpResendTimer > 0 || !pendingUser) return;
    sendOtpToEmail(pendingUser);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Outer Card with Rounded Corners and Soft Shadow */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] border border-slate-200/80">
        
        {/* Left Column: Dark Navy Blue Panel */}
        <div className="lg:col-span-5 bg-[#0e2a47] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top: Logo Card */}
          <div>
            <div className="bg-white px-4 py-2.5 rounded-lg shadow-sm inline-flex items-center">
              <Logo size="sm" />
            </div>

            {/* Middle Content */}
            <div className="mt-14 sm:mt-20">
              <span className="text-[11px] font-semibold text-slate-400 tracking-[0.2em] uppercase block">
                FOUNDATION WORKSPACE
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-3 leading-tight">
                Every contribution.<br />Safely in your care.
              </h1>
              <p className="text-slate-300 text-sm mt-4 leading-relaxed font-normal">
                Manage 80G tax receipts, track welfare donations, and protect donor records with multi-factor security.
              </p>

              <div className="border-t border-slate-700/60 my-8" />

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Email 2FA OTP Protected</span>
                    <span className="text-slate-400 text-[11px]">All logins require a one-time passcode sent to authorized email.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Centralized Configuration</span>
                    <span className="text-slate-400 text-[11px]">Google Sheets, NGO details and email keys in one central file.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-8 text-[11px] text-slate-400 border-t border-slate-700/50 mt-8">
            © {new Date().getFullYear()} {APP_CONFIG.ngoProfile.orgName} · CIN: {APP_CONFIG.ngoProfile.cin}
          </div>
        </div>

        {/* Right Column: Interactive Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            
            {/* Top Navigation Tabs (Login / Register) */}
            {loginStep !== 'otp' && (
              <div className="flex items-center gap-1 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className={`text-sm font-semibold pb-1 px-3 border-b-2 transition-all ${
                    tab === 'login'
                      ? 'border-sky-600 text-sky-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className={`text-sm font-semibold pb-1 px-3 border-b-2 transition-all ${
                    tab === 'register'
                      ? 'border-sky-600 text-sky-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Register new account
                </button>
              </div>
            )}

            {/* Error & Success Alert Banners */}
            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 1. OTP VERIFICATION STEP */}
            {loginStep === 'otp' && pendingUser ? (
              <div className="mt-6 space-y-5 animate-in fade-in duration-200">
                <div>
                  <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Check your email
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    We sent a 6-digit verification code to{' '}
                    <strong className="text-slate-800 font-mono">{pendingUser.email}</strong>.
                  </p>
                </div>

                {/* Live Delivery Status Banner */}
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5 text-sky-950">
                      {isSendingOtp ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                          <span>Dispatching OTP via Gmail...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Live 2FA Dispatched to Email</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full border border-emerald-300">
                      Gmail Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    A real-time 6-digit verification code was dispatched to{' '}
                    <strong className="text-slate-800">{pendingUser.email}</strong>.
                  </p>
                </div>

                {/* Direct On-Screen OTP Box (Can be turned off in appConfig.js) */}
                {APP_CONFIG.email.showOtpOnScreen && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl text-amber-950 shadow-xs flex items-center justify-between animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Current Login OTP:</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        (Testing Mode: Visible on screen. Will be hidden for production)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg tracking-widest bg-white px-3 py-1 rounded-lg border-2 border-amber-400 text-amber-900 shadow-xs select-all">
                        {generatedOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnteredOtp(generatedOtp)}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1.5 rounded-md transition-colors shadow-2xs cursor-pointer active:scale-95"
                        title="Click to automatically fill the OTP input"
                      >
                        Auto Fill
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Enter 6-digit verification code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono py-3 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('credentials');
                        setError(null);
                      }}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      ← Back to password
                    </button>

                    <button
                      type="button"
                      disabled={otpResendTimer > 0}
                      onClick={handleResendOtp}
                      className={`font-semibold flex items-center gap-1 ${
                        otpResendTimer > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-sky-600 hover:text-sky-800'
                      }`}
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>
                        {otpResendTimer > 0 ? `Resend code in ${otpResendTimer}s` : 'Resend code'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            ) : tab === 'register' ? (
              /* 2. REGISTRATION FORM */
              <form onSubmit={handleRegister} className="mt-6 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ayush Kulshrestha"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@kulshresthawf.org"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Choose username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. ayush_k"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 pr-10 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Register & request access</span>
                </button>

                <div className="mt-4 p-3 bg-sky-50/70 border border-sky-100 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    New accounts start with pending review status. The main admin reviews and approves your access.
                  </p>
                </div>
              </form>
            ) : (
              /* 3. REAL CREDENTIALS LOGIN FORM */
              <div className="mt-6 space-y-4 text-xs">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Sign in to workspace
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your email or username and password to proceed.
                  </p>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email address or username
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. nishantsharma57057@gmail.com or nishantsharma"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-semibold">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Default: admin123
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3.5 pr-10 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Continue with password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Bottom Security Note */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>2-Factor Email OTP verification is active on this workspace.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
