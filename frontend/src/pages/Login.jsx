import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AuthAside from '../components/AuthAside';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { 
  HeartHandshake, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const Login = () => {
  const { login, loginWithGoogle, verify2FA, requires2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Auto-fill demo credentials
  const fillDemo = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
    setInfoMessage(`Filled credentials for ${demoRole}. Click "Sign In" below.`);
  };

  const redirectByRole = (role) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    const r = (role || '').toLowerCase();
    if (r === 'admin') navigate('/admin');
    else if (['ngo', 'recipient'].includes(r)) navigate('/ngo');
    else navigate('/donor'); // covers 'donor', 'food_provider'
  };

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setInfoMessage('');
    setLoading(true);

    const res = await loginWithGoogle(credential);
    setLoading(false);

    if (res.success && res.user) {
      redirectByRole(res.user.role);
    } else {
      setError(res.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.requires2FA) {
      setInfoMessage(res.message || 'Please enter the 6-digit verification code.');
      if (res.devOtp) {
        setOtp(String(res.devOtp));
      }
      return;
    }

    if (res.success && res.user) {
      redirectByRole(res.user.role);
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await verify2FA(otp);
    setLoading(false);

    if (res.success && res.user) {
      redirectByRole(res.user.role);
    } else {
      setError(res.message || 'Invalid or expired OTP.');
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please provide your email address to resend OTP.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email });
      setResending(false);
      setInfoMessage(res.data?.message || 'A fresh OTP has been sent to your email.');
      if (res.data?.devOtp) {
        setOtp(String(res.data.devOtp));
      }
    } catch (err) {
      setResending(false);
      setError(err.response?.data?.message || 'Could not resend OTP. Please try again.');
    }
  };

  return (
    <div className="auth-page-frame">
      <div className="auth-layout site-container">
      <AuthAside />
      <div className="auth-panel w-full space-y-8 bg-white p-7 sm:p-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 mb-2">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {requires2FA ? 'Account Verification' : 'Welcome back'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {requires2FA
              ? 'Enter the 6-digit OTP code sent to your registered email to continue.'
              : 'Sign in to manage your donations, collections and community impact.'}
          </p>
        </div>

        {/* Demo Fast-fill Buttons */}
        {!requires2FA && (
          <div className="bg-[#f6f7f2] border border-[#e5e9df] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Fill a sample account</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('canteen@ietlucknow.ac.in', 'Donor (IET Canteen)')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg font-medium text-slate-700 hover:text-emerald-700 transition-colors truncate"
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => fillDemo('helpinghands@ngo.org', 'NGO 1 (Helping Hands)')}
                className="py-1.5 px-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg font-medium text-slate-700 hover:text-teal-700 transition-colors truncate"
              >
                NGO 1
              </button>
              <button
                type="button"
                onClick={() => fillDemo('rotibank@ngo.org', 'NGO 2 (Roti Bank)')}
                className="py-1.5 px-2 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 rounded-lg font-medium text-slate-700 hover:text-cyan-700 transition-colors truncate"
              >
                NGO 2
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@foodrescue.org', 'System Admin')}
                className="py-1.5 px-2 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg font-medium text-slate-700 hover:text-purple-700 transition-colors truncate"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Standard Email & Password Form */}
        {!requires2FA && (
          <div className="space-y-4">
            <GoogleAuthButton
              text="signin_with"
              disabled={loading}
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError('Google sign-in was interrupted. Please try again.')}
            />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative">
                Or sign in with email
              </span>
            </div>
          </div>
        )}

        {/* 2FA / Verification Form */}
        {requires2FA ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                6-Digit Security OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="pl-10 w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center tracking-widest text-lg font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Authenticate'}
            </button>
          </form>
        ) : (
          /* Standard Email & Password Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="e.g. canteen@ietlucknow.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Need to register your organization? </span>
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create an Account
          </Link>
        </div>

      </div>
      </div>
    </div>
  );
};

export default Login;
