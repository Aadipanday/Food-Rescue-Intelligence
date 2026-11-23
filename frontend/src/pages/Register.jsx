import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AuthAside from '../components/AuthAside';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { 
  Building2, 
  Heart, 
  MapPin, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Navigation,
  KeyRound,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const Register = () => {
  const { setAuthSession, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('donor'); // 'donor' or 'ngo'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    orgName: '',
    orgType: 'COLLEGE_CANTEEN',
    street: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226021',
    latitude: 26.9148,
    longitude: 80.9424,
  });

  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Verification stage
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Browser Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }));
        setLocating(false);
        setSuccessMsg('Coordinates detected successfully!');
      },
      (err) => {
        setLocating(false);
        setError('Could not detect location: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  const handleGoogleSignUp = async (credential) => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await loginWithGoogle(credential, role);
      setLoading(false);

      if (res.success && res.user) {
        const token = localStorage.getItem('token');
        if (token && !res.user.organization) {
          await createOrgProfile(token);
        }
        navigate(role === 'ngo' ? '/ngo' : '/donor');
      } else {
        setError(res.message || 'Google registration failed.');
      }
    } catch (err) {
      setLoading(false);
      setError('Google registration could not be completed. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // 1. Register User
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
      });

      setLoading(false);

      if (res.data.requiresEmailVerification) {
        setVerifyingOtp(true);
        setTempToken(res.data.tempToken);
        if (res.data.devOtp) {
          setOtp(String(res.data.devOtp));
          setSuccessMsg(`Account created! (Dev Mode: OTP auto-filled: ${res.data.devOtp})`);
        } else {
          setSuccessMsg(res.data.message || 'OTP sent to your email! Please enter it to complete registration.');
        }
        return;
      }

      if (res.data.success) {
        if (res.data.token) {
          setAuthSession(res.data.token, res.data.user);
          await createOrgProfile(res.data.token);
        }
        navigate(role === 'ngo' ? '/ngo' : '/donor');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    }
  };

  const createOrgProfile = async (jwtToken) => {
    try {
      await api.post(
        '/organizations/register',
        {
          name: formData.orgName || (role === 'donor' ? `${formData.name}'s Canteen` : `${formData.name}'s Shelter`),
          type: role === 'ngo' ? 'NGO' : 'FOOD_PROVIDER',
          address: {
            street: formData.street || 'Campus Street',
            city: formData.city || 'Lucknow',
            state: formData.state || 'Uttar Pradesh',
            pincode: formData.pincode || '226021',
          },
          location: {
            latitude: formData.latitude,
            longitude: formData.longitude,
          },
          phone: formData.phone,
          email: formData.email,
          capacityPerDay: role === 'ngo' ? 100 : 300,
        },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
    } catch (orgErr) {
      console.warn('Organization auto-setup note:', orgErr.response?.data?.message || orgErr.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post(
        '/auth/verify-email-otp',
        { otp },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      setLoading(false);
      if (res.data.success && res.data.token) {
        setAuthSession(res.data.token, res.data.user);
        await createOrgProfile(res.data.token);
        navigate(role === 'ngo' ? '/ngo' : '/donor');
      } else {
        setError(res.data.message || 'OTP verification failed');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email) return;
    setResending(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email: formData.email });
      setResending(false);
      setSuccessMsg(res.data?.message || 'Fresh OTP sent to your email.');
      if (res.data?.devOtp) {
        setOtp(String(res.data.devOtp));
      }
      if (res.data?.tempToken) {
        setTempToken(res.data.tempToken);
      }
    } catch (err) {
      setResending(false);
      setError(err.response?.data?.message || 'Could not resend OTP');
    }
  };

  return (
    <div className="auth-page-frame">
      <div className="auth-layout auth-layout-wide site-container">
      <AuthAside joining />
      <div className="auth-panel w-full bg-white p-7 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">
            {verifyingOtp ? 'Verify Email Address' : 'Join the food rescue community'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {verifyingOtp
              ? 'Enter the 6-digit verification code sent to your email to activate your account.'
              : 'Create an account to share surplus food or collect donations for your community.'}
          </p>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {verifyingOtp ? (
          /* OTP Verification Step */
          <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
            <div>
              <label htmlFor="verify-otp-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  id="verify-otp-input"
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
                onClick={() => setVerifyingOtp(false)}
                className="flex items-center gap-1 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Launch Portal'}
            </button>
          </form>
        ) : (
          /* Full Registration Form */
          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* Role Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('donor')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'donor'
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-5 h-5 ${role === 'donor' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-900 text-sm">Food Donor</span>
                  </div>
                  <p className="text-xs text-slate-500">Canteen, Restaurant, Mess, Hostel or Caterer</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ngo')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'ngo'
                      ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className={`w-5 h-5 ${role === 'ngo' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-900 text-sm">NGO Shelter</span>
                  </div>
                  <p className="text-xs text-slate-500">Orphanage, Food Bank, Community Kitchen</p>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Google Sign Up */}
            <div className="space-y-3 pt-1">
              <GoogleAuthButton
                text="signup_with"
                disabled={loading}
                onSuccess={handleGoogleSignUp}
                onError={(err) => setError('Google sign-up interrupted. Please try again.')}
              />
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative">
                  Or register with email & organization
                </span>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Person Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-9 w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    placeholder="ramesh@organization.org"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9 w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-9 w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-9 w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Organization & Location Details */}
            <div className="pt-2 border-t border-slate-200/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Facility & Dispatch Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="reg-orgname" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Organization / Facility Name
                  </label>
                  <input
                    id="reg-orgname"
                    name="orgName"
                    type="text"
                    required
                    placeholder={role === 'donor' ? 'e.g. IET Central Canteen' : 'e.g. Samarpan Child Care Shelter'}
                    value={formData.orgName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="reg-street" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    id="reg-street"
                    name="street"
                    type="text"
                    placeholder="Sitapur Road, Sector F"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="reg-city" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    id="reg-city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Coordinates & Geolocation Button */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      GPS Coordinates (Used for AI Distance Ranking)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {locating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>{locating ? 'Detecting GPS...' : 'Auto-detect My GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-lat" className="block text-[11px] text-slate-500 font-medium mb-1">Latitude</label>
                    <input
                      id="reg-lat"
                      name="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-lng" className="block text-[11px] text-slate-500 font-medium mb-1">Longitude</label>
                    <input
                      id="reg-lng"
                      name="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Organization Account...</span>
                </>
              ) : (
                <span>Complete Registration & Launch</span>
              )}
            </button>

          </form>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Already registered with Food Rescue Intelligence? </span>
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign In Here
          </Link>
        </div>

      </div>
      </div>
    </div>
  );
};

export default Register;
