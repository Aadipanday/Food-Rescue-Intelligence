import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  Navigation, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Utensils
} from 'lucide-react';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [locating, setLocating] = useState(false);

  // User form
  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
  });

  // Organization form
  const [org, setOrg] = useState(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    street: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226021',
    latitude: 26.9148,
    longitude: 80.9424,
    phone: '',
    email: '',
    capacityPerDay: 100,
    openHour: '08:00',
    closeHour: '22:00',
  });

  useEffect(() => {
    const fetchProfileAndOrg = async () => {
      try {
        setLoading(true);
        if (user) {
          setUserForm({
            name: user.name || '',
            phone: user.phone || '',
          });
        }

        const orgRes = await api.get('/organizations/my');
        if (orgRes.data?.success && orgRes.data?.organization) {
          const o = orgRes.data.organization;
          setOrg(o);
          setOrgForm({
            name: o.name || '',
            street: o.address?.street || '',
            city: o.address?.city || 'Lucknow',
            state: o.address?.state || 'Uttar Pradesh',
            pincode: o.address?.pincode || '226021',
            latitude: o.location?.latitude || 26.9148,
            longitude: o.location?.longitude || 80.9424,
            phone: o.phone || '',
            email: o.email || '',
            capacityPerDay: o.capacityPerDay || 100,
            openHour: o.operatingHours?.open || '08:00',
            closeHour: o.operatingHours?.close || '22:00',
          });
        }
      } catch (err) {
        console.warn('Organization profile not yet created or failed to load:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndOrg();
  }, [user]);

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const res = await api.put('/auth/profile', userForm);
      setSavingUser(false);
      if (res.data?.success) {
        toast.success('Personal profile updated successfully!');
        refreshUser();
      }
    } catch (err) {
      setSavingUser(false);
      toast.error(err.response?.data?.message || 'Failed to update user profile');
    }
  };

  const handleOrgUpdate = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      const payload = {
        name: orgForm.name,
        address: {
          street: orgForm.street,
          city: orgForm.city,
          state: orgForm.state,
          pincode: orgForm.pincode,
        },
        location: {
          latitude: Number(orgForm.latitude),
          longitude: Number(orgForm.longitude),
        },
        phone: orgForm.phone,
        email: orgForm.email,
        capacityPerDay: Number(orgForm.capacityPerDay),
        operatingHours: {
          open: orgForm.openHour,
          close: orgForm.closeHour,
        },
      };

      const res = await api.put('/organizations/update', payload);
      setSavingOrg(false);
      if (res.data?.success) {
        setOrg(res.data.organization);
        toast.success('Facility details updated successfully!');
      }
    } catch (err) {
      setSavingOrg(false);
      toast.error(err.response?.data?.message || 'Failed to update facility profile');
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrgForm((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }));
        setLocating(false);
        toast.success('Coordinates refreshed from GPS device!');
      },
      (err) => {
        setLocating(false);
        toast.error('Could not detect location: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-slate-500 text-xs">Loading facility profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 app-page-frame">
      
      {/* Title */}
      <div className="app-page-heading">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          YOUR ACCOUNT
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Profile & settings
        </h1>
        <p className="text-slate-500 text-sm">
          Keep your organisation and contact details up to date so collections run smoothly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: User Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 text-base">{user?.name}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {user?.role}
              </span>
            </div>

            {org && (
              <div className="pt-4 border-t border-slate-100 text-xs text-left space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{org.name}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    org.verificationStatus === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {org.verificationStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Contact Person Edit */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Contact Person</h4>
            <form onSubmit={handleUserUpdate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Direct Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingUser}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Person Info</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Facility Details */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Facility & Dispatch Profile</h3>
                <p className="text-xs text-slate-500">
                  {org?.type === 'FOOD_PROVIDER' ? 'Canteen / Hotel Kitchen Profile' : 'Shelter / Orphanage Profile'}
                </p>
              </div>
            </div>

            <form onSubmit={handleOrgUpdate} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Facility Name
                </label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={orgForm.street}
                    onChange={(e) => setOrgForm({ ...orgForm, street: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={orgForm.city}
                    onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Daily Capacity (Meals)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={orgForm.capacityPerDay}
                    onChange={(e) => setOrgForm({ ...orgForm, capacityPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={orgForm.openHour}
                    onChange={(e) => setOrgForm({ ...orgForm, openHour: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={orgForm.closeHour}
                    onChange={(e) => setOrgForm({ ...orgForm, closeHour: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Coordinates Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>GPS Coordinates (AI Proximity Matching)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                    <span>Auto-detect GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={orgForm.latitude}
                      onChange={(e) => setOrgForm({ ...orgForm, latitude: e.target.value })}
                      className="w-full px-2.5 py-1.5 font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={orgForm.longitude}
                      onChange={(e) => setOrgForm({ ...orgForm, longitude: e.target.value })}
                      className="w-full px-2.5 py-1.5 font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingOrg}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {savingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Facility Profile</span>
              </button>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;
