import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { UrgencyBadge, StatusBadge } from '../components/UrgencyBadge';
import ImpactCertificateModal from '../components/ImpactCertificateModal';
import {
  Truck,
  Clock,
  Phone,
  Building2,
  Heart,
  KeyRound,
  ShieldCheck,
  Search,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Utensils,
  Award,
  Sparkles,
  Radio,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Calendar,
  Printer,
  Box,
  User,
  Lock,
  FileText,
  Check,
} from 'lucide-react';

export default function RescueTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const { socket, isConnected, joinRescueRoom, leaveRescueRoom } = useSocket();
  const [driverGps, setDriverGps] = useState(null);

  // Search input state
  const [searchId, setSearchId] = useState(id || '');

  // User's own items list (for Donors: their posted listings; for NGOs: their claims)
  const [myItems, setMyItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Items filter: 'ACTIVE' vs 'COMPLETED'
  const [itemsFilter, setItemsFilter] = useState('ACTIVE');

  // Active item tracking state
  const [activeTracking, setActiveTracking] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Handover OTP verification state (for Donor)
  const [handoverOtpInput, setHandoverOtpInput] = useState('');
  const [verifyingHandover, setVerifyingHandover] = useState(false);

  // Status updating state (for NGO)
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Impact Certificate Modal
  const [certListing, setCertListing] = useState(null);

  const userRole = user?.role?.toLowerCase();
  const isDonorRole = userRole === 'donor' || userRole === 'food_provider';
  const isNgoRole = ['ngo', 'recipient'].includes(userRole);

  const isDonor =
    isDonorRole ||
    Boolean(activeTracking?.isDonor) ||
    userRole === 'admin';
  const isNgo =
    isNgoRole ||
    Boolean(activeTracking?.isRecipient) ||
    userRole === 'admin';

  // 1. Fetch user's own items if logged in
  const fetchUserItems = async () => {
    if (!isAuthenticated || !user) return;
    setLoadingItems(true);

    try {
      if (isDonorRole) {
        const res = await api.get('/listings/my');
        const list = res.data?.listings || res.data?.data || [];
        setMyItems(Array.isArray(list) ? list : []);
      } else if (isNgoRole) {
        const res = await api.get('/claims/my');
        const list = res.data?.claims || [];
        setMyItems(Array.isArray(list) ? list : []);
      } else if (userRole === 'admin') {
        const res = await api.get('/listings/my');
        const list = res.data?.listings || res.data?.data || [];
        setMyItems(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.warn('Could not fetch user items:', err.message);
      setMyItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
  }, [user, isAuthenticated]);

  // 2. Fetch specific tracking record by ID (or Listing ID)
  const fetchTrackingDetails = async (targetId) => {
    if (!targetId?.trim()) return;
    setLoadingTracking(true);
    setTrackingError('');

    try {
      const res = await api.get(`/claims/track/${targetId.trim()}`);
      if (res.data?.success) {
        if (res.data.isListingOnly && res.data.listing) {
          setActiveTracking({
            type: 'LISTING',
            status: res.data.listing.status || 'AVAILABLE',
            listing: res.data.listing,
            claim: null,
            _id: res.data.listing._id,
            createdAt: res.data.listing.createdAt,
            isDonor: res.data.isDonor || false,
          });
        } else if (res.data.claim) {
          setActiveTracking({
            type: 'CLAIM',
            status: res.data.claim.status,
            listing: res.data.claim.listing,
            claim: res.data.claim,
            _id: res.data.claim._id,
            createdAt: res.data.claim.createdAt,
            isDonor: res.data.isDonor || false,
            isRecipient: res.data.isRecipient || false,
          });
        }
      } else {
        throw new Error(res.data?.message || 'Tracking record not found');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'No active food rescue or delivery record found.';
      setTrackingError(msg);
      setActiveTracking(null);
    } finally {
      setLoadingTracking(false);
    }
  };

  // 3. Coordinate initial selection when URL ID changes or user items load
  useEffect(() => {
    if (id) {
      setSearchId(id);
      fetchTrackingDetails(id);
    } else if (isAuthenticated && myItems.length > 0) {
      const activeOne = myItems.find(
        (item) => item.status === 'CLAIMED' || item.status === 'IN_TRANSIT' || item.status === 'AVAILABLE'
      ) || myItems[0];

      if (activeOne) {
        const targetId = activeOne._id;
        setSearchId(targetId);
        fetchTrackingDetails(targetId);
      }
    } else if (isAuthenticated && !loadingItems && myItems.length === 0) {
      setActiveTracking(null);
      setTrackingError('');
    }
  }, [id, myItems, isAuthenticated]);

  // Real-time WebSocket Listeners for Live Consignment Tracking
  useEffect(() => {
    if (!socket || !activeTracking?._id) return;

    const targetRescueId = String(activeTracking.listing?._id || activeTracking._id);
    joinRescueRoom(targetRescueId);

    const onDriverLocation = (data) => {
      if (data?.coordinates) {
        setDriverGps(data.coordinates);
      }
    };

    const onVanDispatched = () => {
      toast.success('🚚 Pickup van dispatched by shelter! Van is now en route to counter.');
      fetchTrackingDetails(targetRescueId);
    };

    const onStatusUpdated = (data) => {
      toast.info(`Rescue status updated to: ${data.status}`);
      fetchTrackingDetails(targetRescueId);
    };

    const onHandoverVerified = () => {
      toast.success('🎉 Handover authenticated via OTP! Food rescue mission certified.');
      fetchTrackingDetails(targetRescueId);
    };

    const onRescueCancelled = () => {
      toast.info('This rescue was cancelled and restored to available network.');
      fetchTrackingDetails(targetRescueId);
    };

    socket.on('driver_location_updated', onDriverLocation);
    socket.on('VAN_DISPATCHED', onVanDispatched);
    socket.on('STATUS_UPDATED', onStatusUpdated);
    socket.on('HANDOVER_VERIFIED', onHandoverVerified);
    socket.on('RESCUE_CANCELLED', onRescueCancelled);

    return () => {
      leaveRescueRoom(targetRescueId);
      socket.off('driver_location_updated', onDriverLocation);
      socket.off('VAN_DISPATCHED', onVanDispatched);
      socket.off('STATUS_UPDATED', onStatusUpdated);
      socket.off('HANDOVER_VERIFIED', onHandoverVerified);
      socket.off('RESCUE_CANCELLED', onRescueCancelled);
    };
  }, [socket, activeTracking?._id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    navigate(`/track/${searchId.trim()}`);
    fetchTrackingDetails(searchId.trim());
  };

  const handleSelectItem = (item) => {
    const targetId = item._id;
    setSearchId(targetId);
    navigate(`/track/${targetId}`);
    fetchTrackingDetails(targetId);
  };

  const handleVerifyHandover = async (e) => {
    e.preventDefault();
    if (!handoverOtpInput.trim() || !activeTracking) return;

    setVerifyingHandover(true);
    try {
      const listingId = activeTracking.listing?._id || activeTracking.listing || activeTracking._id;
      const res = await api.post(`/listings/${listingId}/verify-handover`, {
        handoverOtp: handoverOtpInput.trim(),
        otp: handoverOtpInput.trim(),
      });

      if (res.data?.success) {
        toast.success('Food handover authenticated & verified! Delivery completed.');
        setHandoverOtpInput('');
        await fetchTrackingDetails(activeTracking._id);
        await fetchUserItems();
      } else {
        toast.error(res.data?.message || 'Invalid handover OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid handover PIN. Please verify with driver.');
    } finally {
      setVerifyingHandover(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    const targetClaimId = activeTracking?.claim?._id || activeTracking?._id;
    if (!targetClaimId) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/claims/${targetClaimId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Rescue status updated to ${newStatus}`);
        await fetchTrackingDetails(activeTracking._id);
        await fetchUserItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update rescue status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Direct tracking link copied to clipboard!');
  };

  const handleCancelRescue = async (actionType = 'CANCEL') => {
    const isReject = actionType === 'REJECT';
    const confirmMsg = isReject
      ? 'Are you sure you want to decline this shelter request? The food will remain available.'
      : 'Are you sure you want to cancel this pickup? The food will be returned to the feed.';
    if (!window.confirm(confirmMsg)) return;

    const targetClaimId = activeTracking?.claim?._id || activeTracking?._id;
    if (!targetClaimId) return;

    setUpdatingStatus(true);
    try {
      const res = await api.post(`/claims/${targetClaimId}/cancel`, { action: actionType });
      if (res.data?.success) {
        toast.info(res.data.message || 'Rescue updated.');
        await fetchTrackingDetails(activeTracking._id);
        await fetchUserItems();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel rescue');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Status progression calculations
  const claimStatus = activeTracking?.claim?.status || activeTracking?.status;
  const isCompleted = claimStatus === 'COMPLETED';
  const isAvailableOnly = activeTracking?.type === 'LISTING' && activeTracking?.status === 'AVAILABLE';

  const activeItems = myItems.filter(
    (i) => i.status !== 'COMPLETED' && i.status !== 'CANCELLED'
  );
  const completedItems = myItems.filter((i) => i.status === 'COMPLETED');

  const handleTabChange = (newTab) => {
    setItemsFilter(newTab);
    if (newTab === 'ACTIVE') {
      const live = myItems.filter((i) => i.status !== 'COMPLETED' && i.status !== 'CANCELLED');
      if (live.length > 0) {
        handleSelectItem(live[0]);
      } else {
        setActiveTracking(null);
      }
    } else if (newTab === 'COMPLETED') {
      const past = myItems.filter((i) => i.status === 'COMPLETED');
      if (past.length > 0) {
        handleSelectItem(past[0]);
      } else {
        setActiveTracking(null);
      }
    }
  };

  const listingData = activeTracking?.listing;
  const claimData = activeTracking?.claim;

  const canManageTransit =
    isNgo ||
    activeTracking?.isRecipient ||
    (claimData && String(claimData.recipientUser?._id || claimData.recipientUser) === String(user?._id)) ||
    user?.role?.toLowerCase() === 'admin';

  return (
    <div className="site-container py-6 max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Food Rescue Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
              Food Delivery & Rescue Status
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-0.5">
              Check where the food is, who is transporting it, and delivery confirmation.
            </p>
          </div>

          {isAuthenticated && (
            <div className="shrink-0">
              <Link
                to={isDonor ? '/donor' : '/feed'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                {isDonor ? (
                  <>
                    <PlusCircle className="w-4 h-4 text-emerald-300" />
                    <span>Post Donation</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-4 h-4 text-emerald-300" />
                    <span>Find Food</span>
                  </>
                )}
              </Link>
            </div>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by 24-character ID or Order ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button
            type="submit"
            disabled={loadingTracking}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all shrink-0 disabled:opacity-60"
          >
            {loadingTracking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* User's Own Items Tabs / Switcher */}
        {isAuthenticated && myItems.length > 0 && (
          <div className="pt-3 border-t border-emerald-800/60 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Your Food Donations & Pickups:
              </span>
              
              <div className="flex items-center gap-1 bg-emerald-950/70 p-1 rounded-xl border border-emerald-700/50 text-xs">
                <button
                  type="button"
                  onClick={() => handleTabChange('ACTIVE')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    itemsFilter === 'ACTIVE'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>In-Progress ({activeItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('COMPLETED')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    itemsFilter === 'COMPLETED'
                      ? 'bg-teal-400 text-slate-950 shadow-sm'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Delivered & Closed ({completedItems.length})</span>
                </button>
              </div>
            </div>

            {/* List of items */}
            {(itemsFilter === 'ACTIVE' ? activeItems : completedItems).length === 0 ? (
              <p className="text-xs text-emerald-300/80 italic py-1">
                {itemsFilter === 'ACTIVE'
                  ? 'No active orders in transit. Check "Delivered & Closed" to view past completed rescues.'
                  : 'No completed deliveries yet. Once food is picked up and verified with PIN, it will appear here.'}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {(itemsFilter === 'ACTIVE' ? activeItems : completedItems).map((item) => {
                  const isCurrent = activeTracking?._id === item._id || (activeTracking?.listing?._id === item._id);
                  const isDone = item.status === 'COMPLETED';

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className={`text-left px-3.5 py-2 rounded-xl text-xs transition-all shrink-0 border flex items-center gap-2.5 ${
                        isCurrent
                          ? 'bg-white text-emerald-950 border-white shadow font-bold'
                          : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100 border-emerald-700/60 font-medium'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isDone ? 'bg-teal-300' : 'bg-emerald-400 animate-pulse'
                      }`} />
                      <div className="max-w-[180px] truncate">
                        <p className="truncate font-bold leading-tight">
                          {item.title || item.listing?.title || 'Surplus Food'}
                        </p>
                        <p className={`text-[10px] uppercase font-mono ${isCurrent ? 'text-emerald-700' : 'text-emerald-300/80'}`}>
                          {item.status?.replace('_', ' ')} • #{item._id.slice(-6)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingTracking && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Loading food delivery status...</h3>
          <p className="text-slate-500 text-xs">Fetching pickup details, vehicle coordinates, and handover confirmation.</p>
        </div>
      )}

      {/* Error state */}
      {!loadingTracking && trackingError && (
        <div className="p-10 text-center bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Record Not Found</h3>
            <p className="text-slate-600 text-xs max-w-md mx-auto mt-1 leading-relaxed">
              {trackingError}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Link to="/feed" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
              Browse Available Food
            </Link>
          </div>
        </div>
      )}

      {/* Empty State when logged-in user has 0 postings or claims */}
      {!loadingTracking && !trackingError && !activeTracking && isAuthenticated && myItems.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Utensils className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {isDonor ? 'No Food Donations Posted Yet' : 'No Food Rescues Claimed Yet'}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {isDonor
                ? 'Whenever you have extra edible meals, post them to alert local shelters and track the van pickup live.'
                : 'Browse available food batches in your city and claim them to serve your shelter community.'}
            </p>
          </div>
          <Link
            to={isDonor ? '/donor' : '/feed'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all"
          >
            {isDonor ? <PlusCircle className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            <span>{isDonor ? 'Post Food Batch' : 'Explore Food Feed'}</span>
          </Link>
        </div>
      )}

      {/* TRACKING CONTENT */}
      {!loadingTracking && activeTracking && (
        itemsFilter === 'ACTIVE' && isCompleted ? (
          activeItems.length > 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading active in-progress order...</p>
            </div>
          ) : (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <Truck className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  No In-Progress Pickups Right Now
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  All your food batches have been successfully rescued and delivered!
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-1">
                {completedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleTabChange('COMPLETED')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>View Delivered History ({completedItems.length})</span>
                  </button>
                )}
                <Link
                  to={isDonor ? '/donor' : '/feed'}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {isDonor ? 'Post New Donation' : 'Browse Available Food'}
                </Link>
              </div>
            </div>
          )
        ) : itemsFilter === 'COMPLETED' && !isCompleted ? (
          completedItems.length > 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading delivered order history...</p>
            </div>
          ) : (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-slate-900">
                  No Delivered Orders Yet
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Once active food rescues are completed with PIN verification, completed delivery receipts will appear here.
                </p>
              </div>
              {activeItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('ACTIVE')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  View In-Progress Pickups ({activeItems.length})
                </button>
              )}
            </div>
          )
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* ======================================================== */}
          {/* 1. HERO STATUS & JOURNEY CARD (The Core Story!)          */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Top Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : claimStatus === 'IN_TRANSIT'
                    ? 'bg-amber-100 text-amber-700'
                    : claimStatus === 'PICKED_UP'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : claimStatus === 'IN_TRANSIT' ? (
                    <Truck className="w-7 h-7 animate-pulse" />
                  ) : claimStatus === 'PICKED_UP' ? (
                    <MapPin className="w-7 h-7" />
                  ) : (
                    <Clock className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : claimStatus === 'IN_TRANSIT'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-teal-100 text-teal-900 border border-teal-300'
                    }`}>
                      {isCompleted
                        ? 'Delivered & Closed'
                        : claimStatus === 'IN_TRANSIT'
                        ? 'Van In Transit'
                        : claimStatus === 'PICKED_UP'
                        ? 'At Donor Counter'
                        : claimStatus === 'ACCEPTED'
                        ? 'Accepted by Donor'
                        : claimStatus === 'REQUESTED'
                        ? 'Requested by Shelter'
                        : 'Available for Rescue'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      #{activeTracking._id.slice(-6)}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {isCompleted
                      ? 'Food Delivered & Verified!'
                      : claimStatus === 'IN_TRANSIT'
                      ? 'Pickup Van is on the way!'
                      : claimStatus === 'PICKED_UP'
                      ? 'Van arrived at pickup location!'
                      : claimStatus === 'ACCEPTED'
                      ? 'Pickup confirmed by donor'
                      : claimStatus === 'REQUESTED'
                      ? 'Shelter requested pickup'
                      : 'Food available for rescue'}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {isCompleted
                      ? `Delivered on ${new Date(claimData?.completedAt || activeTracking.createdAt || Date.now()).toLocaleString()}`
                      : claimStatus === 'IN_TRANSIT'
                      ? 'Driver is currently traveling to the pickup location.'
                      : claimStatus === 'PICKED_UP'
                      ? 'Driver is at the counter. Verify the 6-digit PIN below to release the food.'
                      : claimStatus === 'ACCEPTED'
                      ? 'Donor has approved the pickup. Shelter van is preparing for departure.'
                      : claimStatus === 'REQUESTED'
                      ? 'Waiting for donor to review and accept the pickup request.'
                      : 'Notifying verified nearby charities and food shelters.'}
                  </p>
                </div>
              </div>

              {/* Action buttons (Certificate / Refresh / Share) */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {isCompleted && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCertListing(listingData || activeTracking)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Award className="w-4 h-4" />
                      <span>Certificate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Print Delivery Slip"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => fetchTrackingDetails(activeTracking._id)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Refresh Status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Copy Tracking Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simple 4-Step Progress Journey */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { step: '1. Food Posted', done: true, current: isAvailableOnly },
                  { step: '2. Shelter Claimed', done: !isAvailableOnly, current: claimStatus === 'REQUESTED' || claimStatus === 'ACCEPTED' },
                  { step: '3. Van In-Transit', done: ['IN_TRANSIT', 'PICKED_UP', 'COMPLETED'].includes(claimStatus), current: claimStatus === 'IN_TRANSIT' || claimStatus === 'PICKED_UP' },
                  { step: '4. Delivered', done: isCompleted, current: isCompleted },
                ].map((s) => (
                  <div key={s.step} className="space-y-1.5">
                    <div className={`h-2 rounded-full transition-all ${
                      s.done ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                    <span className={`text-[11px] font-bold block ${
                      s.done ? 'text-emerald-950' : 'text-slate-400'
                    }`}>
                      {s.step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Transit ETA Ticker (if actively in transit) */}
            {!isCompleted && !isAvailableOnly && claimData?.pickupEta && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Estimated Arrival:</span>
                </div>
                <div className="flex items-center gap-2">
                  <CountdownTimer expiryTime={claimData.pickupEta} />
                  <span className="text-amber-800 font-mono">
                    ({new Date(claimData.pickupEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. THE ACTION BOX (What do I do right now?)              */}
            {/* ======================================================== */}
            
            {/* If In-Progress: Show Handover PIN or Action Controls */}
            {!isCompleted && !isAvailableOnly && (
              <div className="space-y-3 pt-2">
                
                {/* 1. When status is REQUESTED: Donor decides to Accept / Decline */}
                {claimStatus === 'REQUESTED' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-amber-950">
                        {isDonor ? 'Action Needed: Approve Shelter Request' : 'Waiting for Donor Approval'}
                      </h4>
                      <p className="text-xs text-amber-800">
                        {isDonor
                          ? `${claimData?.recipientOrganization?.name || 'A local shelter'} wants to collect this food for ~${claimData?.beneficiariesTarget || 25} people.`
                          : 'The donor is reviewing your request. Pickup van can be dispatched once they accept.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDonor ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCancelRescue('REJECT')}
                            disabled={updatingStatus}
                            className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus('ACCEPTED')}
                            disabled={updatingStatus}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                          >
                            Accept Request
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCancelRescue('CANCEL')}
                          disabled={updatingStatus}
                          className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. When status is ACCEPTED: NGO dispatches van */}
                {claimStatus === 'ACCEPTED' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-emerald-950">
                        {canManageTransit ? 'Ready to Dispatch Pickup Van!' : 'Donation Confirmed • Van Preparing'}
                      </h4>
                      <p className="text-xs text-emerald-800">
                        {canManageTransit
                          ? 'Donor confirmed! When your driver departs for the canteen, click Dispatch below.'
                          : 'The shelter pickup vehicle will be departing shortly.'}
                      </p>
                    </div>

                    {canManageTransit && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('IN_TRANSIT')}
                        disabled={updatingStatus}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Dispatch Van (Start Trip)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 3. When status is IN_TRANSIT: Driver marks arrived */}
                {claimStatus === 'IN_TRANSIT' && canManageTransit && (
                  <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-teal-950">Van is On The Road</h4>
                      <p className="text-xs text-teal-800">
                        When driver reaches the pickup counter, click below to start PIN verification.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('PICKED_UP')}
                      disabled={updatingStatus}
                      className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Mark Arrived at Counter</span>
                    </button>
                  </div>
                )}

                {/* 4. PIN Handshake Verification Box */}
                {['PICKED_UP', 'IN_TRANSIT', 'ACCEPTED'].includes(claimStatus) && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          Physical Handover PIN (6-Digits)
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Secure Handshake
                      </span>
                    </div>

                    {/* Driver's PIN display */}
                    {(isNgo || claimData?.handoverOtp) && (
                      <div className="bg-white rounded-xl p-3 border border-emerald-200 text-center space-y-1 shadow-inner">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Driver's Pickup PIN (Show this to donor)
                        </span>
                        <div className="text-2xl font-mono font-black text-emerald-800 tracking-widest">
                          {claimData?.handoverOtp || '••••••'}
                        </div>
                      </div>
                    )}

                    {/* Donor's PIN input form */}
                    {(isDonor || user?.role === 'admin') && (
                      <form onSubmit={handleVerifyHandover} className="space-y-2 pt-1">
                        <label htmlFor="donor-otp-input" className="block text-xs font-bold text-slate-700">
                          Driver at your counter? Enter their 6-digit PIN to release food:
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="donor-otp-input"
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit PIN"
                            value={handoverOtpInput}
                            onChange={(e) => setHandoverOtpInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center border border-slate-300 rounded-xl bg-white font-bold focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={verifyingHandover || handoverOtpInput.length < 4}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all shrink-0 disabled:opacity-50"
                          >
                            {verifyingHandover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Handover'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* If Completed: Reassuring Confirmation Stamp */}
            {isCompleted && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Handover Complete & Sealed</h4>
                    <p className="text-emerald-700">Verified at counter via 6-digit PIN match.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCertListing(listingData || activeTracking)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm self-start sm:self-auto"
                >
                  View Certificate
                </button>
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* 3. WHO & WHAT: ROUTE & FOOD DETAILS (Crystal Clear!)     */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Route (From -> To) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pickup & Delivery Route
              </h3>

              {/* Pickup location */}
              <div className="space-y-1.5 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  📍 Pickup From (Food Donor):
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {listingData?.organization?.name || listingData?.donor?.name || 'Canteen / Food Provider'}
                </h4>
                <p className="text-xs text-slate-500">
                  {listingData?.pickupLocation?.street || listingData?.organization?.address?.street || 'Canteen Hub'}, Lucknow
                </p>
                {(listingData?.contactPhone || listingData?.organization?.phone) && (
                  <a
                    href={`tel:${listingData?.contactPhone || listingData?.organization?.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:underline pt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Donor: {listingData?.contactPhone || listingData?.organization?.phone}
                  </a>
                )}
              </div>

              {/* Delivery destination */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                  🏁 Delivering To (Shelter Partner):
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {claimData?.recipientOrganization?.name || 'Local Food Shelter / NGO'}
                </h4>
                <p className="text-xs text-slate-500">
                  {claimData?.recipientOrganization?.address?.street || 'Community Shelter Center'}, Lucknow
                </p>
                {claimData?.recipientOrganization?.phone && (
                  <a
                    href={`tel:${claimData.recipientOrganization.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:underline pt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Shelter: {claimData.recipientOrganization.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Food Details & Community Impact */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Food Consignment Details
                </h3>

                <h4 className="text-base font-extrabold text-slate-900">
                  {listingData?.title || 'Surplus Food Batch'}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {listingData?.description || 'Fresh edible meals rescued from going to waste.'}
                </p>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Quantity</span>
                    <strong className="text-slate-900 font-bold">{listingData?.quantity} {listingData?.unit || 'MEALS'}</strong>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Meals Fed</span>
                    <strong className="text-emerald-700 font-bold">~{claimData?.beneficiariesTarget || Math.round((listingData?.quantity || 1) * 2.5)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Dietary</span>
                    <strong className="text-emerald-700 font-bold">{listingData?.dietaryType || listingData?.foodType || 'VEG'}</strong>
                  </div>
                </div>

                {/* Packaging & Preparation Metadata */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-2">
                  <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    <Box className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span>{listingData?.packagingType === 'INDIVIDUAL_BOXES' ? '🍱 Bento Boxes (Ready)' : listingData?.packagingType === 'SEALED_PACKETS' ? '📦 Sealed Packets' : listingData?.packagingType === 'DRY_SACKS' ? '🌾 Dry Sacks' : '🍲 Bulk Vessels (Bring Containers)'}</span>
                  </span>
                  {listingData?.cookedTime && (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Cooked: {new Date(listingData.cookedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                  {listingData?.pickupPoint && (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{listingData.pickupPoint}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Environmental impact tag */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  CO₂ emissions saved:
                </span>
                <span className="font-bold text-emerald-900">
                  {listingData?.aiAnalysis?.co2eSavedKg || ((listingData?.quantity || 1) * 2.5).toFixed(1)} kg CO₂
                </span>
              </div>
            </div>

          </div>

        </div>
        )
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
}
