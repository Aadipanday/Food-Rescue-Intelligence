import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  UtensilsCrossed, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Building2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  LayoutGrid,
  Compass,
  Navigation,
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';
import { UrgencyBadge, StatusBadge } from '../components/UrgencyBadge';
import CountdownTimer from '../components/CountdownTimer';
import RescueMap from '../components/RescueMap';

// Realistic Lucknow Campus & City initial listings for seamless demo experience
const DEMO_LUCKNOW_LISTINGS = [
  {
    _id: 'demo-listing-1',
    title: 'Fresh Dal Makhani, Shahi Paneer & Jeera Rice',
    description: 'Surplus afternoon lunch buffet, hygienically packed in insulated warm containers.',
    category: 'COOKED_MEALS',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 45,
    unit: 'MEALS',
    urgencyLevel: 'CRITICAL',
    expiryTime: new Date(Date.now() + 1.5 * 3600 * 1000).toISOString(),
    idealPickupTime: new Date(Date.now() + 1.5 * 3600 * 1000).toISOString(),
    organization: {
      name: 'IET Central Canteen',
    },
    pickupLocation: {
      street: 'Canteen Block A, IET Campus, Sitapur Road',
      city: 'Lucknow',
      latitude: 26.9148,
      longitude: 80.9424,
    },
    aiAnalysis: {
      urgencyScore: 92,
      estimatedMeals: 45,
      co2eSavedKg: 112.5,
      waterSavedLiters: 45000,
    },
    status: 'AVAILABLE',
  },
  {
    _id: 'demo-listing-2',
    title: 'Artisan Bread Loaves, Buns & Veg Sandwiches',
    description: 'Fresh bakery batch prepared this morning, individually wrapped in food-safe foil.',
    category: 'BAKERY',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 30,
    unit: 'PACKETS',
    urgencyLevel: 'HIGH',
    expiryTime: new Date(Date.now() + 4.5 * 3600 * 1000).toISOString(),
    idealPickupTime: new Date(Date.now() + 4.5 * 3600 * 1000).toISOString(),
    organization: {
      name: 'Campus Cafeteria Counter 2',
    },
    pickupLocation: {
      street: 'Student Activity Centre, IET Lucknow',
      city: 'Lucknow',
      latitude: 26.9160,
      longitude: 80.9430,
    },
    aiAnalysis: {
      urgencyScore: 78,
      estimatedMeals: 30,
      co2eSavedKg: 75.0,
      waterSavedLiters: 30000,
    },
    status: 'AVAILABLE',
  },
  {
    _id: 'demo-listing-3',
    title: 'Steamed Idli, Medu Vada & Coconut Chutney',
    description: 'Breakfast surplus from hostel mess kitchen. Chutney packed separately on ice.',
    category: 'COOKED_MEALS',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 60,
    unit: 'MEALS',
    urgencyLevel: 'HIGH',
    expiryTime: new Date(Date.now() + 3.0 * 3600 * 1000).toISOString(),
    idealPickupTime: new Date(Date.now() + 3.0 * 3600 * 1000).toISOString(),
    organization: {
      name: 'Ramanujan Hostel Mess',
    },
    pickupLocation: {
      street: 'Hostel Block 3, Jankipuram',
      city: 'Lucknow',
      latitude: 26.9135,
      longitude: 80.9410,
    },
    aiAnalysis: {
      urgencyScore: 84,
      estimatedMeals: 60,
      co2eSavedKg: 150.0,
      waterSavedLiters: 60000,
    },
    status: 'AVAILABLE',
  },
  {
    _id: 'demo-listing-4',
    title: 'Seasonal Apples, Bananas & Citrus Oranges',
    description: 'Catering event surplus crate of unpeeled, fresh fruits ready for immediate distribution.',
    category: 'RAW_PRODUCE',
    foodType: 'VEGAN',
    dietaryType: 'VEGAN',
    quantity: 20,
    unit: 'KG',
    urgencyLevel: 'MEDIUM',
    expiryTime: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    idealPickupTime: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    organization: {
      name: 'Aliganj Community Hall',
    },
    pickupLocation: {
      street: 'Sector C, Aliganj',
      city: 'Lucknow',
      latitude: 26.8921,
      longitude: 80.9412,
    },
    aiAnalysis: {
      urgencyScore: 55,
      estimatedMeals: 50,
      co2eSavedKg: 50.0,
      waterSavedLiters: 20000,
    },
    status: 'AVAILABLE',
  },
];

const PublicFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemoData, setIsDemoData] = useState(false);
  
  // View mode: 'grid' or 'radar'
  const [viewMode, setViewMode] = useState('grid');

  // Filters
  const [search, setSearch] = useState('');
  const [dietary, setDietary] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  // Claim modal state
  const [selectedListing, setSelectedListing] = useState(null);
  const [claimEta, setClaimEta] = useState(30);
  const [beneficiaries, setBeneficiaries] = useState(25);
  const [claimNotes, setClaimNotes] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/listings?status=AVAILABLE');
      const list = res.data?.listings || res.data?.data || [];
      if (Array.isArray(list)) {
        setListings(list);
        setIsDemoData(false);
      } else {
        setListings([]);
        setIsDemoData(false);
      }
    } catch (err) {
      console.warn('Backend unavailable, showing clearly labelled sample food listings:', err.message);
      setListings(DEMO_LUCKNOW_LISTINGS);
      setIsDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleClaimClick = (listing) => {
    if (!isAuthenticated) {
      toast.info('Please sign in with an NGO shelter account to claim food donations.');
      navigate('/login');
      return;
    }
    const role = (user.role || '').toLowerCase();
    if (!['ngo', 'recipient'].includes(role)) {
      toast.error('Only registered NGO shelters can claim food donations. Sign in with an NGO account.');
      return;
    }
    setSelectedListing(listing);
    setBeneficiaries(Math.round(listing.quantity * 2.5) || 25);
    setClaimSuccess(null);
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;

    // Handle mock demo item claim
    if (selectedListing._id?.startsWith('demo-')) {
      const mockOtp = String(Math.floor(1000 + Math.random() * 9000));
      toast.success('Food donation claimed successfully! Handover OTP generated.');
      setClaimSuccess({
        message: 'Donation claimed successfully!',
        otp: mockOtp,
      });
      // Remove from active view
      setListings((prev) => prev.filter((l) => l._id !== selectedListing._id));
      return;
    }

    setClaimLoading(true);
    try {
      const res = await api.post(`/listings/${selectedListing._id}/claim`, {
        estimatedPickupMinutes: claimEta,
        beneficiaryCount: beneficiaries,
        notes: claimNotes,
      });

      setClaimLoading(false);
      if (res.data?.success) {
        toast.success('Food donation claimed successfully! Handover OTP generated.');
        setClaimSuccess({
          message: 'Donation claimed successfully!',
          otp: res.data.handoverOtp || res.data.otp || res.data.claim?.handoverOtp || 'Generated',
        });
        // Refresh feed list
        fetchListings();
      }
    } catch (err) {
      setClaimLoading(false);
      toast.error(err.response?.data?.message || 'Failed to claim listing. It may have already been claimed.');
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const titleMatch = item.title?.toLowerCase().includes(search.toLowerCase());
    const descMatch = item.description?.toLowerCase().includes(search.toLowerCase());
    const locationMatch = 
      item.pickupLocation?.street?.toLowerCase().includes(search.toLowerCase()) ||
      item.pickupLocation?.city?.toLowerCase().includes(search.toLowerCase()) ||
      item.pickupLocation?.address?.toLowerCase().includes(search.toLowerCase()) ||
      item.organization?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesSearch = search === '' || titleMatch || descMatch || locationMatch;

    const currentDietary = (item.dietaryType || item.foodType || '').toUpperCase();
    const matchesDietary =
      dietary === 'ALL' || currentDietary === dietary;

    const matchesCategory =
      category === 'ALL' || item.category?.toUpperCase() === category;

    return matchesSearch && matchesDietary && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 app-page-frame">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 app-page-heading">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>FOOD AVAILABLE NEAR YOU</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find food to rescue
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl">
            Explore food donations from nearby providers. Filter by food type, check pickup details and arrange a collection.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-emerald-600" />
            <span>Listings</span>
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'radar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
            <span>Map view</span>
          </button>
        </div>
      </div>

      {/* Demo notice pill if running in presentation fallback */}
      {isDemoData && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Sample listings:</strong> You’re viewing example listings for a preview. These are not live donations; claims on sample listings are simulated.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search box */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by food name, campus canteen, area (e.g. Jankipuram, Aliganj)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Dietary Filter */}
          <div>
            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="ALL">All Dietary Types</option>
              <option value="VEG">Vegetarian Only</option>
              <option value="NON_VEG">Non-Vegetarian</option>
              <option value="VEGAN">Vegan</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="ALL">All Food Categories</option>
              <option value="COOKED_MEALS">Cooked Meals / Buffet</option>
              <option value="BAKERY">Bakery & Breads</option>
              <option value="RAW_PRODUCE">Raw Fruits / Veggies</option>
              <option value="PACKAGED_FOOD">Packaged / Canned</option>
            </select>
          </div>

        </div>
      </div>

      {/* Render Mode: Map view Map OR Listings */}
      {viewMode === 'radar' ? (
        <RescueMap 
          listings={filteredListings} 
          onClaim={handleClaimClick}
          userRole={user?.role}
        />
      ) : (
        /* Listings View */
        loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-slate-500 text-sm">Refreshing surplus listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-lg">No Surplus Listings Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {search || dietary !== 'ALL' || category !== 'ALL'
                ? 'No active food batches match your selected search or filters. Try adjusting your criteria.'
                : 'All food batches have been claimed. Check back shortly for fresh surplus listings!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              const urgencyLevel = listing.urgencyLevel || (listing.aiAnalysis?.urgencyScore >= 75 ? 'CRITICAL' : 'HIGH');
              const urgencyScore = listing.aiAnalysis?.urgencyScore || 80;
              const donorName = listing.organization?.name || listing.donor?.name || 'Verified Food Provider';
              const mealsCount = listing.aiAnalysis?.estimatedMeals || (listing.unit === 'MEALS' ? listing.quantity : Math.round(listing.quantity * 2.5));
              const lat = listing.pickupLocation?.latitude || 26.9148;
              const lng = listing.pickupLocation?.longitude || 80.9424;

              return (
                <div
                  key={listing._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 food-listing-card"
                >
                  <div className="space-y-3">
                    {/* Photo if available */}
                    {listing.images && listing.images.length > 0 && (
                      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Gemini AI Inspected</span>
                        </span>
                      </div>
                    )}

                    {/* Top Bar with Category & Urgency */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-700">
                        {listing.category?.replace(/_/g, ' ') || 'Cooked Meals'}
                      </span>
                      <UrgencyBadge level={urgencyLevel} score={urgencyScore} />
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {listing.description || 'Nutritious freshly prepared surplus food packaged hygienically.'}
                      </p>
                    </div>

                    {/* Real-time Ticking Shelf-Life Countdown */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Pickup Window:
                      </span>
                      <CountdownTimer 
                        expiryTime={listing.expiryTime} 
                        idealPickupTime={listing.idealPickupTime || listing.pickupWindow?.endTime} 
                      />
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="bg-slate-50/70 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Quantity</span>
                        <strong className="text-slate-800 font-semibold">
                          {listing.quantity} {listing.unit}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Dietary</span>
                        <strong className="text-emerald-700 font-semibold">
                          {listing.foodType || listing.dietaryType || 'VEG'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Meals</span>
                        <strong className="text-slate-800 font-semibold">
                          ~{mealsCount}
                        </strong>
                      </div>
                    </div>

                    {/* Organization and Street Location */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{donorName}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {listing.pickupLocation?.street || listing.pickupLocation?.address || 'IET Campus, Sitapur Road, Lucknow'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Google Maps Turn-by-Turn Navigation */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                        title="Open turn-by-turn navigation in Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span>Navigate</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>

                      {/* Claim Button */}
                      <button
                        onClick={() => handleClaimClick(listing)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
                      >
                        <span>Claim Food</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Claim Modal Dialog */}
      {selectedListing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Secure NGO Rescue Claim
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedListing.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  From: {selectedListing.organization?.name || selectedListing.donor?.name || 'Campus Provider'}
                </p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* If claim was successful, show 4-digit OTP */}
            {claimSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-base">
                    Donation Successfully Claimed!
                  </h4>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Your pickup team has been assigned. Please show the 4-digit verification code below to the donor during physical food handover.
                  </p>
                  
                  <div className="py-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 block mb-1">
                      Handover Verification OTP
                    </span>
                    <div className="inline-block px-6 py-2.5 bg-white border-2 border-dashed border-emerald-500 rounded-xl font-mono font-extrabold text-2xl tracking-widest text-emerald-700 shadow-sm">
                      {claimSuccess.otp}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedListing(null);
                      navigate('/ngo');
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                  >
                    Go to NGO Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* Claim Input Form */
              <form onSubmit={submitClaim} className="space-y-4">
                
                {/* Beneficiary count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beneficiaries Target (People to feed)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={beneficiaries}
                    onChange={(e) => setBeneficiaries(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Approx {selectedListing.quantity} {selectedListing.unit} provides ~{Math.round(selectedListing.quantity * 2.5)} wholesome meals.
                  </p>
                </div>

                {/* Estimated Pickup ETA */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Vehicle ETA (Minutes)
                  </label>
                  <select
                    value={claimEta}
                    onChange={(e) => setClaimEta(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value={15}>15 Minutes (Immediate Dispatch)</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (Max recommended)</option>
                  </select>
                </div>

                {/* Pickup vehicle & volunteer notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Driver / Vehicle Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Driver Ramesh (UP32 AB 1234), van with insulated hot boxes."
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Safety Guarantee Statement */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    By confirming, you agree to inspect food temperature and transport it in food-safe containers for immediate distribution.
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
                  >
                    {claimLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming Dispatch...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Generate Handover OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default PublicFeed;
