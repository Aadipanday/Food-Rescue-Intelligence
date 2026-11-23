import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import ImpactCertificateModal from '../components/ImpactCertificateModal';
import CountdownTimer from '../components/CountdownTimer';
import { 
  Heart, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UtensilsCrossed, 
  KeyRound, 
  Navigation, 
  Building2, 
  Calendar, 
  RefreshCw, 
  ArrowRight,
  Award,
  ExternalLink,
  Truck,
  Sparkles,
  Radio,
  Phone,
  Copy,
  Check,
  Search,
  Filter,
  CheckSquare,
  Utensils,
  ChevronRight,
  Box
} from 'lucide-react';
import { UrgencyBadge, StatusBadge } from '../components/UrgencyBadge';

// Initial NGO demo data for instant presentation readiness
const DEMO_ACTIVE_CLAIMS = [
  {
    _id: 'demo-claim-1',
    handoverOtp: '7492',
    status: 'IN_TRANSIT',
    beneficiariesTarget: 35,
    pickupEta: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    listing: {
      _id: 'demo-donor-2',
      title: 'Artisan Bread Loaves & Vegetable Cutlets',
      quantity: 30,
      unit: 'PACKETS',
      dietaryType: 'VEG',
      expiryTime: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
    },
    donorOrganization: {
      name: 'IET Central Canteen (Campus Dining)',
      phone: '+919876543211',
      address: {
        street: 'Canteen Block A, IET Campus, Sitapur Road',
        city: 'Lucknow',
      },
      location: {
        latitude: 26.9148,
        longitude: 80.9424,
      },
    },
    driverInfo: 'Volunteer Ramesh (UP32 AB 1234), Insulated Thermal Crates',
  },
];

const DEMO_PAST_CLAIMS = [
  {
    _id: 'demo-claim-past-1',
    status: 'COMPLETED',
    beneficiariesTarget: 50,
    completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    listing: {
      _id: 'demo-listing-past',
      title: 'Wholesome Rajma Masala & Jeera Rice Buffet',
      quantity: 50,
      unit: 'MEALS',
      dietaryType: 'VEG',
      impact: {
        co2eSavedKg: 125.0,
        waterSavedLiters: 50000,
      },
    },
    donorOrganization: {
      name: 'IET Lucknow Guest House',
    },
  },
];

const DEMO_NEARBY_LISTINGS = [
  {
    _id: 'demo-listing-1',
    title: 'Fresh Dal Makhani, Shahi Paneer & Jeera Rice',
    description: 'Surplus afternoon lunch buffet, hygienically packed in warm containers.',
    category: 'COOKED_MEALS',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 45,
    unit: 'MEALS',
    urgencyLevel: 'CRITICAL',
    expiryTime: new Date(Date.now() + 1.5 * 3600 * 1000).toISOString(),
    organization: {
      name: 'IET Central Canteen',
    },
    pickupLocation: {
      street: 'Canteen Block A, IET Campus',
      city: 'Lucknow',
      latitude: 26.9148,
      longitude: 80.9424,
    },
    aiUrgency: {
      level: 'CRITICAL',
      urgencyScore: 92,
    },
  },
  {
    _id: 'demo-listing-3',
    title: 'Steamed Idli, Medu Vada & Chutney',
    description: 'Hostel morning breakfast surplus ready for prompt distribution.',
    category: 'COOKED_MEALS',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 60,
    unit: 'MEALS',
    urgencyLevel: 'HIGH',
    expiryTime: new Date(Date.now() + 3.0 * 3600 * 1000).toISOString(),
    organization: {
      name: 'Ramanujan Hostel Mess',
    },
    pickupLocation: {
      street: 'Hostel Block 3, Jankipuram',
      city: 'Lucknow',
      latitude: 26.9135,
      longitude: 80.9410,
    },
    aiUrgency: {
      level: 'HIGH',
      urgencyScore: 84,
    },
  },
];

const NgoDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { socket, isConnected } = useSocket();

  const [activeTab, setActiveTab] = useState('RADAR'); // 'RADAR' | 'ACTIVE' | 'HISTORY'
  const [foodFilter, setFoodFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'CRITICAL' | 'COOKED'
  const [org, setOrg] = useState(null);
  const [copiedOtp, setCopiedOtp] = useState(null);

  const [claims, setClaims] = useState([]);
  const [nearbyListings, setNearbyListings] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [previewClaims, setPreviewClaims] = useState(false);
  const [previewListings, setPreviewListings] = useState(false);
  const [certListing, setCertListing] = useState(null);

  // Claim modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [claimEta, setClaimEta] = useState(30);
  const [beneficiaries, setBeneficiaries] = useState(35);
  const [claimNotes, setClaimNotes] = useState('');
  const [dispatchImmediately, setDispatchImmediately] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [updatingClaimId, setUpdatingClaimId] = useState(null);

  const handleUpdateClaimStatus = async (claimId, newStatus) => {
    setUpdatingClaimId(claimId);
    try {
      const res = await api.patch(`/claims/${claimId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(
          newStatus === 'IN_TRANSIT'
            ? 'Pickup van dispatched! Live tracker updated.'
            : 'Van marked arrived at donor counter! Provide your 6-digit OTP.'
        );
        fetchClaims();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingClaimId(null);
    }
  };

  const handleCancelClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to cancel this rescue request? The food will be released back to the community.')) return;
    try {
      const res = await api.post(`/claims/${claimId}/cancel`, { action: 'CANCEL' });
      if (res.data?.success) {
        toast.info('Rescue request cancelled successfully. Food restored to available network.');
        fetchClaims();
        fetchNearbyListings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel rescue request.');
    }
  };

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res = await api.get('/claims/my');
      if (res.data?.success && Array.isArray(res.data?.claims)) {
        setClaims(res.data.claims);
        setPreviewClaims(false);
      } else {
        setClaims([]);
        setPreviewClaims(false);
      }
    } catch (err) {
      console.warn('Backend unavailable, using demo NGO claims:', err.message);
      setClaims([...DEMO_ACTIVE_CLAIMS, ...DEMO_PAST_CLAIMS]);
      setPreviewClaims(true);
    } finally {
      setLoadingClaims(false);
    }
  };

  const fetchNearbyListings = async () => {
    try {
      setLoadingListings(true);
      const res = await api.get('/listings?status=AVAILABLE');
      const list = res.data?.listings || res.data?.data || [];
      if (Array.isArray(list)) {
        setNearbyListings(list);
        setPreviewListings(false);
      } else {
        setNearbyListings([]);
        setPreviewListings(false);
      }
    } catch (err) {
      console.warn('Backend unavailable, using demo nearby listings:', err.message);
      setNearbyListings(DEMO_NEARBY_LISTINGS);
      setPreviewListings(true);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchOrgDetails = async () => {
    try {
      const res = await api.get('/organizations/my');
      if (res.data?.organization) {
        setOrg(res.data.organization);
      }
    } catch (err) {
      console.warn('Could not load NGO org details:', err);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchNearbyListings();
    fetchOrgDetails();
  }, []);

  // Real-time WebSocket Listeners for Instant Live Updates
  useEffect(() => {
    if (!socket) return;

    const onListingCreated = (data) => {
      const title = data.listing?.title || 'Surplus Food Batch';
      toast.info(`🍲 New Food Batch Available: "${title}". Check your radar!`);
      fetchNearbyListings();
    };

    const onRescueAccepted = (data) => {
      toast.success(`🎉 Rescue Request Accepted! The donor accepted your claim for "${data.listing?.title || 'food batch'}". You can now dispatch your pickup van.`);
      fetchClaims();
      fetchNearbyListings();
    };

    const onHandoverVerified = () => {
      toast.success('🎉 Food Handover Verified! Impact Certificate is now available.');
      fetchClaims();
    };

    const onRescueCancelled = () => {
      toast.info('A rescue status was updated or cancelled.');
      fetchClaims();
      fetchNearbyListings();
    };

    socket.on('FOOD_LISTING_CREATED', onListingCreated);
    socket.on('RESCUE_ACCEPTED', onRescueAccepted);
    socket.on('HANDOVER_VERIFIED', onHandoverVerified);
    socket.on('RESCUE_CANCELLED', onRescueCancelled);

    return () => {
      socket.off('FOOD_LISTING_CREATED', onListingCreated);
      socket.off('RESCUE_ACCEPTED', onRescueAccepted);
      socket.off('HANDOVER_VERIFIED', onHandoverVerified);
      socket.off('RESCUE_CANCELLED', onRescueCancelled);
    };
  }, [socket]);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;

    setClaiming(true);
    try {
      // Check if it's a demo or local item
      if (selectedListing._id?.startsWith('demo-')) {
        const mockOtp = String(Math.floor(1000 + Math.random() * 9000));
        setClaiming(false);
        toast.success('Food donation claimed successfully! Driver OTP generated.');
        setClaimSuccess({ otp: mockOtp });
        
        // Add to active claims
        const newClaim = {
          _id: 'claim-' + Date.now(),
          handoverOtp: mockOtp,
          status: 'IN_TRANSIT',
          beneficiariesTarget: beneficiaries,
          pickupEta: new Date(Date.now() + claimEta * 60 * 1000).toISOString(),
          listing: selectedListing,
          donorOrganization: selectedListing.organization || { name: 'Campus Food Provider' },
          driverInfo: claimNotes || 'Dispatched pickup vehicle',
        };
        setClaims((prev) => [newClaim, ...prev]);
        setNearbyListings((prev) => prev.filter((l) => l._id !== selectedListing._id));
        return;
      }

      const res = await api.post(`/listings/${selectedListing._id}/claim`, {
        estimatedPickupMinutes: claimEta,
        beneficiaryCount: beneficiaries,
        notes: claimNotes,
        dispatchImmediately,
      });

      setClaiming(false);
      if (res.data?.success) {
        toast.success('Food donation claimed successfully! Driver OTP generated.');
        setClaimSuccess({
          otp: res.data.handoverOtp || res.data.otp || res.data.claim?.handoverOtp || 'Generated',
          claimId: res.data.claimId || res.data.claim?._id || '',
        });
        fetchClaims();
        fetchNearbyListings();
      }
    } catch (err) {
      setClaiming(false);
      toast.error(err.response?.data?.message || 'Could not claim food batch.');
    }
  };

  const getDistanceKm = (pickupLat, pickupLng) => {
    const shelterLat = org?.location?.latitude || 26.9148;
    const shelterLng = org?.location?.longitude || 80.9424;
    if (!pickupLat || !pickupLng) return null;
    const R = 6371; // km
    const dLat = ((pickupLat - shelterLat) * Math.PI) / 180;
    const dLon = ((pickupLng - shelterLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((shelterLat * Math.PI) / 180) *
        Math.cos((pickupLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const handleCopyOtp = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(String(otp));
    setCopiedOtp(otp);
    toast.success('Handshake OTP copied to clipboard!');
    setTimeout(() => setCopiedOtp(null), 2500);
  };

  const activeClaims = claims.filter((c) => c.status !== 'COMPLETED' && c.status !== 'CANCELLED');
  const pastClaims = claims.filter((c) => c.status === 'COMPLETED');
  const totalFedCount = claims.reduce((acc, c) => acc + (Number(c.beneficiariesTarget) || 0), 0);

  const filteredNearbyListings = nearbyListings.filter((item) => {
    if (foodFilter === 'VEG') {
      const type = (item.dietaryType || item.foodType || '').toUpperCase();
      return type === 'VEG' || type === 'VEGAN';
    }
    if (foodFilter === 'CRITICAL') {
      return (item.aiUrgency?.level || item.urgencyLevel) === 'CRITICAL';
    }
    if (foodFilter === 'COOKED') {
      return item.category === 'COOKED_MEALS';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 app-page-frame">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 app-page-heading">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              SHELTER RESCUE HQ
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Live Mesh Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {user?.name || org?.name || 'Helping Hands Shelter'} Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Surplus radar, van dispatch controls, and secure physical handover OTPs.
          </p>
        </div>

        <button
          onClick={() => {
            fetchClaims();
            fetchNearbyListings();
            toast.success('Radar refreshed with latest data');
          }}
          className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-center flex items-center gap-2 text-xs font-bold"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh Radar</span>
        </button>
      </div>

      {(previewClaims || previewListings) && (
        <div className="preview-notice" role="status">
          <span className="preview-notice-dot" /> Preview mode: some information is sample data because the server is unavailable. Sample claims are simulated.
        </div>
      )}

      {/* Top 4-Metric Operations Ribbon (Clickable Tab Shortcuts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Surplus on Radar */}
        <button
          type="button"
          onClick={() => setActiveTab('RADAR')}
          className={`text-left rounded-2xl p-4 transition-all border ${
            activeTab === 'RADAR'
              ? 'bg-teal-50/70 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surplus Radar</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{nearbyListings.length}</span>
            <span className="text-xs text-teal-600 font-semibold">batches nearby</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Available for immediate rescue</p>
        </button>

        {/* 2. Active Pickups */}
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`text-left rounded-2xl p-4 transition-all border relative ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          {activeClaims.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Missions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{activeClaims.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">in progress</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Van dispatch & OTP verification</p>
        </button>

        {/* 3. Community Fed */}
        <div className="rounded-2xl p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Community Fed</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">~{totalFedCount}</span>
            <span className="text-xs text-amber-600 font-semibold">meals served</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Shelter hunger relief impact</p>
        </div>

        {/* 4. Certified Rescues */}
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`text-left rounded-2xl p-4 transition-all border ${
            activeTab === 'HISTORY'
              ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified History</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{pastClaims.length}</span>
            <span className="text-xs text-blue-600 font-semibold">certified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Downloadable audit certificates</p>
        </button>
      </div>

      {/* Main Tabs Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'RADAR'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Surplus Food Radar</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'RADAR' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {nearbyListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Active Pickups & OTP</span>
            {activeClaims.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {activeClaims.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rescue History</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeTab === 'HISTORY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {pastClaims.length}
            </span>
          </button>
        </div>

        {activeTab === 'RADAR' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFoodFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                foodFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All ({nearbyListings.length})
            </button>
            <button
              type="button"
              onClick={() => setFoodFilter('VEG')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                foodFilter === 'VEG'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              🥦 Veg Only
            </button>
            <button
              type="button"
              onClick={() => setFoodFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                foodFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ⚡ Critical (&lt;2h)
            </button>
            <button
              type="button"
              onClick={() => setFoodFilter('COOKED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                foodFilter === 'COOKED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              🍲 Cooked Meals
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: SURPLUS FOOD RADAR */}
      {activeTab === 'RADAR' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Surplus Food Available in Lucknow
              </h2>
              <p className="text-xs text-slate-500">
                Live batches ready for pickup within your shelter's distribution perimeter.
              </p>
            </div>
            <Link
              to="/feed"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Explore Public Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingListings ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Scanning local food donors...</p>
            </div>
          ) : filteredNearbyListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Food Matching Your Filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No unclaimed food batches match "{foodFilter}". Try resetting your filter or checking back soon.
              </p>
              <button
                type="button"
                onClick={() => setFoodFilter('ALL')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNearbyListings.map((listing) => {
                const pickupLat = listing.location?.latitude || listing.organization?.location?.latitude;
                const pickupLng = listing.location?.longitude || listing.organization?.location?.longitude;
                const distanceKm = getDistanceKm(pickupLat, pickupLng);
                const approxMeals = Math.round(Number(listing.quantity) * 2.5) || 25;

                return (
                  <div
                    key={listing._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-teal-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {listing.category?.replace('_', ' ') || 'Cooked Meals'}
                        </span>
                        <UrgencyBadge
                          level={listing.aiUrgency?.level || listing.urgencyLevel || 'HIGH'}
                          score={listing.aiUrgency?.urgencyScore}
                        />
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-snug">{listing.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {listing.description || 'Nutritious surplus ready for distribution to community members.'}
                        </p>
                      </div>

                      {/* Distance & Shelf-life Banner */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Shelf-Life:
                          </span>
                          <CountdownTimer 
                            expiryTime={listing.expiryTime} 
                            idealPickupTime={listing.idealPickupTime} 
                          />
                        </div>

                        {distanceKm && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-teal-600" />
                              Shelter Distance:
                            </span>
                            <span className="font-bold text-teal-700 text-xs">
                              📍 {distanceKm} km away
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Food Specs Grid */}
                      <div className="bg-slate-50 rounded-xl p-2.5 text-xs grid grid-cols-3 gap-1 border border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Quantity</span>
                          <strong className="text-slate-800 font-bold">{listing.quantity} {listing.unit}</strong>
                        </div>
                        <div className="border-x border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Yield</span>
                          <strong className="text-teal-700 font-bold">~{approxMeals} Meals</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Dietary</span>
                          <strong className="text-emerald-700 font-bold">{listing.dietaryType || listing.foodType || 'VEG'}</strong>
                        </div>
                      </div>

                      {/* Packaging Logistics & Preparation Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          <Box className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{listing.packagingType === 'INDIVIDUAL_BOXES' ? '🍱 Bento Boxes (Ready)' : listing.packagingType === 'SEALED_PACKETS' ? '📦 Sealed Packets' : listing.packagingType === 'DRY_SACKS' ? '🌾 Dry Sacks' : '🍲 Bulk Vessels (Bring Containers)'}</span>
                        </span>
                        {listing.cookedTime && (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Cooked: {new Date(listing.cookedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center justify-between gap-1.5 pt-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{listing.organization?.name || 'Verified Food Donor'}</span>
                        </div>
                        {listing.pickupPoint && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            📍 {listing.pickupPoint}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedListing(listing);
                        setBeneficiaries(approxMeals);
                        setClaimSuccess(null);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim for Shelter</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: ACTIVE PICKUPS & VAN DISPATCHES */}
      {activeTab === 'ACTIVE' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Active Pickups & Van Dispatches
              </h2>
              <p className="text-xs text-slate-500">
                Follow your dispatch status and share the 6-digit Handshake OTP to verify physical handover.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {activeClaims.length} Active Dispatch
            </span>
          </div>

          {loadingClaims ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Checking active pickups...</p>
            </div>
          ) : activeClaims.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">No Pending Pickups</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your shelter has no active pickups right now. Scan the surplus radar to claim food batches in Lucknow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('RADAR')}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Surplus Food Radar</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeClaims.map((claim) => {
                const lat = claim.donorOrganization?.location?.latitude || 26.9148;
                const lng = claim.donorOrganization?.location?.longitude || 80.9424;
                const distance = getDistanceKm(lat, lng);
                const donorPhone = claim.donorOrganization?.contactPhone || claim.listing?.contactPhone;

                return (
                  <div
                    key={claim._id}
                    className="bg-white rounded-3xl border-2 border-emerald-500/40 p-6 shadow-md space-y-5 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Card Header & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 truncate">
                            {claim.listing?.title || 'Surplus Meal Batch'}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{claim.donorOrganization?.name || 'Verified Food Donor'}</span>
                            {distance && (
                              <span className="text-teal-600 font-semibold">• {distance} km away</span>
                            )}
                          </p>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                          claim.status === 'IN_TRANSIT'
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : claim.status === 'PICKED_UP'
                            ? 'bg-teal-600 text-white'
                            : claim.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {claim.status === 'IN_TRANSIT'
                            ? 'Van En Route'
                            : claim.status === 'PICKED_UP'
                            ? 'At Donor Counter'
                            : claim.status === 'ACCEPTED'
                            ? 'Donor Accepted'
                            : 'Pending Approval'}
                        </span>
                      </div>

                      {/* 4-Step Visual Mission Progress Bar */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          <span>Dispatch Progress</span>
                          <span className="text-emerald-700">
                            {claim.status === 'REQUESTED' ? 'Step 1 of 4' :
                             claim.status === 'ACCEPTED' ? 'Step 2 of 4' :
                             claim.status === 'IN_TRANSIT' ? 'Step 3 of 4' : 'Step 4 of 4'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div className={`h-1.5 rounded-full ${claim.status ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <div className={`h-1.5 rounded-full ${['ACCEPTED', 'IN_TRANSIT', 'PICKED_UP', 'COMPLETED'].includes(claim.status) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <div className={`h-1.5 rounded-full ${['IN_TRANSIT', 'PICKED_UP', 'COMPLETED'].includes(claim.status) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <div className={`h-1.5 rounded-full ${['PICKED_UP', 'COMPLETED'].includes(claim.status) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-500 pt-1.5 text-center font-medium">
                          <span className={claim.status === 'REQUESTED' ? 'text-amber-700 font-bold' : ''}>Requested</span>
                          <span className={claim.status === 'ACCEPTED' ? 'text-emerald-700 font-bold' : ''}>Approved</span>
                          <span className={claim.status === 'IN_TRANSIT' ? 'text-emerald-700 font-bold' : ''}>In Transit</span>
                          <span className={claim.status === 'PICKED_UP' ? 'text-teal-700 font-bold' : ''}>At Counter</span>
                        </div>
                      </div>

                      {/* Handover OTP Box with Copy Button */}
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 rounded-2xl p-4 text-center space-y-2 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Driver's Handshake OTP (Show to Donor):</span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-3xl font-mono font-extrabold text-emerald-800 tracking-widest bg-white/90 px-4 py-1.5 rounded-xl border border-emerald-300 shadow-inner">
                            {claim.handoverOtp || '••••••'}
                          </div>
                          {claim.handoverOtp && (
                            <button
                              type="button"
                              onClick={() => handleCopyOtp(claim.handoverOtp)}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                              title="Copy OTP to clipboard"
                            >
                              {copiedOtp === claim.handoverOtp ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-emerald-700 font-medium">
                          The donor enters this 6-digit code on their dashboard to release the food batch.
                        </p>
                      </div>

                      {/* Action Controls per status */}
                      {claim.status === 'REQUESTED' && (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                            <span className="font-semibold text-[11px]">Awaiting Food Donor Acceptance</span>
                            <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">Pending</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                              title="The food donor must accept your request before pickup vehicle can be dispatched"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch Locked (Wait for Donor)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelClaim(claim._id)}
                              className="py-2 px-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                              title="Cancel this rescue request"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {claim.status === 'ACCEPTED' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateClaimStatus(claim._id, 'IN_TRANSIT')}
                            disabled={updatingClaimId === claim._id}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            <span>{updatingClaimId === claim._id ? 'Dispatching...' : 'Dispatch Pickup Van (Mark In Transit)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelClaim(claim._id)}
                            className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors shrink-0"
                            title="Cancel Claim"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}

                      {claim.status === 'IN_TRANSIT' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateClaimStatus(claim._id, 'PICKED_UP')}
                            disabled={updatingClaimId === claim._id}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>{updatingClaimId === claim._id ? 'Updating...' : 'Arrived at Counter (Mark Picked Up)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelClaim(claim._id)}
                            className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors shrink-0"
                            title="Cancel Pickup"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}

                      {claim.status === 'PICKED_UP' && (
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs text-center font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                          <span>At pickup counter. Show OTP above to donor to complete handover.</span>
                        </div>
                      )}

                      {/* Beneficiaries & ETA Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Beneficiaries Fed</span>
                          <strong className="text-slate-800 font-extrabold text-sm">{claim.beneficiariesTarget} people</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Scheduled ETA</span>
                          <strong className="text-slate-800 font-extrabold text-sm">
                            {claim.pickupEta ? new Date(claim.pickupEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '30 mins'}
                          </strong>
                        </div>
                      </div>

                      {/* Pickup Address */}
                      <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">
                          {claim.donorOrganization?.address?.street || 'Canteen Block A, IET Campus, Sitapur Road'}, Lucknow
                        </span>
                      </div>
                    </div>

                    {/* Navigation, Tracker & Phone Action Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <Link
                        to={`/track/${claim._id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Live Track</span>
                      </Link>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300 shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span>Directions</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>

                      {donorPhone ? (
                        <a
                          href={`tel:${donorPhone}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-300 shadow-sm col-span-2 sm:col-span-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Donor</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast.info('Donor contact: +91 98765 43210 (Canteen Liaison)')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm col-span-2 sm:col-span-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Donor Phone</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: RESCUE HISTORY */}
      {activeTab === 'HISTORY' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Zero-Hunger Track Record</span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Verified Rescue History
              </h2>
              <p className="text-xs text-slate-500">
                Every completed handover with certified proof of hunger relief impact.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 self-start sm:self-auto">
              {pastClaims.length} Certified Deliveries
            </span>
          </div>

          {pastClaims.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Completed Rescues Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once your shelter team completes active pickups and handshakes with donors, verified certificates will be cataloged here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastClaims.map((claim) => (
                <div
                  key={claim._id}
                  className="bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white rounded-3xl border border-teal-200/90 p-5 shadow-xs hover:shadow transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-teal-100/80 pb-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Handover Verified
                        </span>
                        {claim.completedAt && (
                          <span className="text-[11px] text-slate-400">
                            {new Date(claim.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate pt-1">
                        {claim.listing?.title || 'Rescued Surplus Batch'}
                      </h4>
                    </div>
                    {claim.listing && (
                      <button
                        type="button"
                        onClick={() => setCertListing(claim.listing)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] shrink-0"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Certificate</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white/90 p-2.5 rounded-2xl border border-teal-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Beneficiaries</span>
                      <strong className="text-teal-900 font-extrabold">~{claim.beneficiariesTarget} Fed</strong>
                    </div>
                    <div className="border-x border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Quantity</span>
                      <strong className="text-slate-900 font-extrabold">{claim.listing?.quantity || claim.beneficiariesTarget} {claim.listing?.unit || 'MEALS'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Donor Source</span>
                      <strong className="text-slate-800 font-semibold truncate block" title={claim.donorOrganization?.name || 'Verified Donor'}>
                        {claim.donorOrganization?.name || 'Verified Donor'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Distributed to shelter residents
                    </span>
                    {claim.listing?._id && (
                      <Link
                        to={`/track/${claim.listing._id}`}
                        className="text-teal-700 hover:text-teal-900 font-semibold text-xs flex items-center gap-1 hover:underline"
                      >
                        <Radio className="w-3.5 h-3.5 text-teal-600" />
                        <span>View Receipt & Status</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Claim Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  Confirm Rescue Claim
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedListing.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedListing.quantity} {selectedListing.unit} • {selectedListing.dietaryType || selectedListing.foodType}
                </p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Claim Confirmed!</h4>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                  <p className="text-xs text-teal-800 font-semibold mb-1">Your 4-Digit Handshake OTP</p>
                  <span className="text-3xl font-mono font-extrabold tracking-widest text-teal-700">
                    {claimSuccess.otp}
                  </span>
                  <p className="text-[11px] text-teal-600 mt-1">
                    Show this OTP to the donor during physical food handover.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/track/${claimSuccess.claimId || ''}`}
                    onClick={() => {
                      setSelectedListing(null);
                      setClaimSuccess(null);
                    }}
                    className="w-1/2 py-2.5 px-3 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track Live</span>
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedListing(null);
                      setClaimSuccess(null);
                    }}
                    className="w-1/2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label htmlFor="claim-beneficiaries" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Beneficiary Target (Meals to serve)
                  </label>
                  <input
                    id="claim-beneficiaries"
                    type="number"
                    min="1"
                    required
                    value={beneficiaries}
                    onChange={(e) => setBeneficiaries(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label htmlFor="claim-eta" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pickup Vehicle ETA (Minutes)
                  </label>
                  <select
                    id="claim-eta"
                    value={claimEta}
                    onChange={(e) => setClaimEta(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value={15}>15 Minutes (Immediate Dispatch)</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="claim-notes" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Driver / Vehicle Details (Optional)
                  </label>
                  <textarea
                    id="claim-notes"
                    rows={2}
                    placeholder="e.g. Driver Ramesh (UP32 AB 1234), van with thermal insulated containers"
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchImmediately}
                      onChange={(e) => setDispatchImmediately(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Dispatch pickup van immediately (Mark In Transit)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 pl-6 leading-tight">
                    Check if your driver is ready to depart right now.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-1/2 py-2.5 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Dispatch'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Impact Certificate Modal */}
      {certListing && (
        <ImpactCertificateModal
          listing={certListing}
          onClose={() => setCertListing(null)}
        />
      )}

    </div>
  );
};

export default NgoDashboard;
