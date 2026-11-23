import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import AiRecommendationsModal from '../components/AiRecommendationsModal';
import ImpactCertificateModal from '../components/ImpactCertificateModal';
import CountdownTimer from '../components/CountdownTimer';
import { 
  Utensils, 
  PlusCircle, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Building2, 
  KeyRound, 
  Trash2, 
  RefreshCw, 
  Award, 
  Zap, 
  CheckSquare, 
  Navigation,
  Truck,
  Radio,
  Camera,
  Flame,
  ThermometerSnowflake,
  Box,
  Package,
  Soup,
  Info,
  User,
  Phone,
  Wheat,
  Milk
} from 'lucide-react';
import { UrgencyBadge, StatusBadge } from '../components/UrgencyBadge';

// Initial donor demo batches for instant presentation readiness
const DEMO_DONOR_LISTINGS = [
  {
    _id: 'demo-donor-1',
    title: 'Fresh Dal Makhani, Paneer & Jeera Rice',
    description: 'Surplus lunch buffet, hygienically kept in insulated warm containers.',
    category: 'COOKED_MEALS',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 45,
    unit: 'MEALS',
    cookedTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    packagingType: 'BULK_VESSELS',
    pickupPoint: 'Kitchen Loading Dock, Gate 2',
    contactPerson: 'Chef Manoj (9876543210)',
    allergens: ['DAIRY'],
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 2.5 * 3600 * 1000).toISOString(),
    idealPickupTime: new Date(Date.now() + 2.5 * 3600 * 1000).toISOString(),
    status: 'AVAILABLE',
    storageCondition: 'Hot Food Warm (>65°C)',
    pickupLocation: {
      street: 'Canteen Block A, IET Lucknow',
      city: 'Lucknow',
    },
    aiUrgency: {
      level: 'HIGH',
      urgencyScore: 88,
      estimatedMeals: 45,
    },
  },
  {
    _id: 'demo-donor-2',
    title: 'Artisan Bread Loaves & Vegetable Cutlets',
    description: 'Breakfast service surplus, packed in food-grade eco containers.',
    category: 'BAKERY',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 30,
    unit: 'PACKETS',
    cookedTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    packagingType: 'INDIVIDUAL_BOXES',
    pickupPoint: 'Cafeteria Counter 2 Front Desk',
    contactPerson: 'Supervisor Ramesh (9450001122)',
    allergens: ['GLUTEN'],
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 1.2 * 3600 * 1000).toISOString(),
    idealPickupTime: new Date(Date.now() + 1.2 * 3600 * 1000).toISOString(),
    status: 'CLAIMED',
    storageCondition: 'Ambient Room Temp',
    pickupLocation: {
      street: 'Cafeteria Counter 2, IET Lucknow',
      city: 'Lucknow',
    },
    aiUrgency: {
      level: 'CRITICAL',
      urgencyScore: 94,
      estimatedMeals: 30,
    },
    claim: {
      shelterName: 'Helping Hands Orphanage (Aliganj)',
      driverEtaMinutes: 20,
    },
  },
  {
    _id: 'demo-donor-3',
    title: 'Executive Dinner Buffet Assorted Curries',
    description: 'Evening seminar banquet surplus collected and delivered to shelter.',
    category: 'COOKED_MEALS',
    foodType: 'VEG',
    dietaryType: 'VEG',
    quantity: 60,
    unit: 'MEALS',
    cookedTime: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    packagingType: 'BULK_VESSELS',
    pickupPoint: 'Guest House Service Alley, Gate 1',
    contactPerson: 'Chef Arvind (9839012345)',
    allergens: ['DAIRY', 'NUTS'],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'COMPLETED',
    storageCondition: 'Refrigerated (<4°C)',
    pickupLocation: {
      street: 'Guest House Dining, IET Lucknow',
      city: 'Lucknow',
    },
    aiUrgency: {
      level: 'LOW',
      urgencyScore: 20,
      estimatedMeals: 60,
    },
    impact: {
      co2eSavedKg: 150.0,
      waterSavedLiters: 60000,
    },
  },
];

const DonorDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { socket, isConnected } = useSocket();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [org, setOrg] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  
  // AI Rec & Certificate Modals
  const [aiRecListing, setAiRecListing] = useState(null);
  const [certListing, setCertListing] = useState(null);

  // Handover OTP Modal state
  const [verifyModalListing, setVerifyModalListing] = useState(null);
  const [handoverOtp, setHandoverOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  // Form State for New Donation
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'COOKED_MEALS',
    dietaryType: 'VEG',
    quantity: 50,
    unit: 'MEALS',
    idealPickupHours: 4,
    storageCondition: 'Hot Food Warm (>65°C)',
    cookedTimeMode: 'JUST_COOKED', // 'JUST_COOKED' | '2_HOURS_AGO' | '4_HOURS_AGO' | 'MORNING' | 'DRY_STAPLE' | 'CUSTOM'
    cookedTime: new Date(Date.now() - 30 * 60 * 1000).toISOString().slice(0, 16),
    packagingType: 'BULK_VESSELS', // 'BULK_VESSELS' | 'INDIVIDUAL_BOXES' | 'SEALED_PACKETS' | 'DRY_SACKS'
    pickupPoint: 'Kitchen Loading Dock, Gate 2',
    contactPerson: user?.name || 'Chef / Mess In-charge',
    contactPhone: user?.phone || '9876543210',
    handlingInstructions: 'Kept hot in food-grade insulated vessels. NGO should bring clean containers/drums.',
    allergens: ['DAIRY'],
    address: 'IET Lucknow Central Canteen, Sitapur Road',
    latitude: 26.9148,
    longitude: 80.9424,
    safetyVerified: true,
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Gemini AI Vision Multimodal State
  const [visionImage, setVisionImage] = useState(null);
  const [scanningImage, setScanningImage] = useState(false);
  const [aiVisionResult, setAiVisionResult] = useState(null);

  // Natural Language AI Prompt Assistant State
  const [aiPromptText, setAiPromptText] = useState('');
  const [parsingPrompt, setParsingPrompt] = useState(false);
  const [aiPromptSummary, setAiPromptSummary] = useState('');

  // Dynamic FSSAI Food Safety & Microbial Age Assessment
  const getFoodAgeInfo = () => {
    if (formData.category === 'RAW_GROCERY' || formData.cookedTimeMode === 'DRY_STAPLE') {
      return {
        text: '🌾 Non-perishable staple — Safe for extended storage in cool dry conditions. Zero bacterial hazard.',
        badge: 'Non-Perishable',
        color: 'bg-blue-50 text-blue-900 border-blue-200',
        dotColor: 'bg-blue-500',
      };
    }

    let ageHours = 0.5;
    if (formData.cookedTimeMode === 'JUST_COOKED') ageHours = 0.5;
    else if (formData.cookedTimeMode === '2_HOURS_AGO') ageHours = 2;
    else if (formData.cookedTimeMode === '4_HOURS_AGO') ageHours = 4;
    else if (formData.cookedTimeMode === 'MORNING') ageHours = 6;
    else if (formData.cookedTimeMode === 'CUSTOM' && formData.cookedTime) {
      const diffMs = Date.now() - new Date(formData.cookedTime).getTime();
      ageHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
    }

    if (formData.storageCondition.includes('Hot') || formData.storageCondition === 'HOT_HOLDING') {
      return {
        text: `🔥 Cooked ~${ageHours}h ago and maintained >65°C. Safe hot holding prevents bacterial growth. FSSAI compliant.`,
        badge: `Fresh & Hot (${ageHours}h ago)`,
        color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    } else if (
      formData.storageCondition.includes('Refrigerat') || 
      formData.storageCondition.includes('Chilled') || 
      formData.storageCondition === 'REFRIGERATED'
    ) {
      return {
        text: `❄️ Cooked ~${ageHours}h ago and chilled <4°C. Cold chain preserves freshness up to 24-48 hours.`,
        badge: `Chilled Safe (${ageHours}h ago)`,
        color: 'bg-cyan-50 text-cyan-900 border-cyan-200',
        dotColor: 'bg-cyan-500',
      };
    } else {
      // Room Temperature
      if (ageHours <= 2) {
        return {
          text: `⏱️ Cooked ~${ageHours}h ago at room temp. FSSAI 2-hr ambient safe window active. Dispatch within next 2 hours!`,
          badge: `Room Temp (${ageHours}h ago)`,
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          dotColor: 'bg-amber-500',
        };
      } else {
        return {
          text: `⚠️ Cooked ~${ageHours}h ago at ambient temp! Exceeds standard 2-hour window. Reheating to >75°C required before consumption.`,
          badge: `Elevated Urgency (${ageHours}h ago)`,
          color: 'bg-rose-50 text-rose-900 border-rose-200',
          dotColor: 'bg-rose-500',
        };
      }
    }
  };

  // Dynamic AI Urgency calculation based on pickup window & perishability
  const getUrgencyInfo = (hours) => {
    const h = Number(hours);
    if (h <= 2) {
      return {
        level: 'CRITICAL',
        description: '⚡ Marked Critical (<2 hrs): High perishability. Nearby NGOs are alerted immediately for rapid pickup.',
      };
    }
    if (h <= 4) {
      return {
        level: 'HIGH',
        description: '⚡ Marked High Priority (2-4 hrs): Standard safe window for cooked meals & warm buffet surplus.',
      };
    }
    if (h <= 8) {
      return {
        level: 'MEDIUM',
        description: '⏱ Marked Medium Urgency (4-8 hrs): Suitable for bakery, packaged food, and pantry items.',
      };
    }
    if (h <= 24) {
      return {
        level: 'LOW',
        description: '🌱 Marked Low Urgency (8-24 hrs): Extended shelf-life. Fresh produce & day-safe items.',
      };
    }
    return {
      level: 'LOW',
      description: '🌾 Non-Perishable Staples (>24 hrs): Dry raw grains, uncooked rice, pulses, flour & long shelf-life pantry items.',
    };
  };

  // Live AI Preview calculations
  const estimatedMeals = formData.unit === 'MEALS' 
    ? formData.quantity 
    : Math.round(formData.quantity * 2.5);
  const estimatedCo2 = (formData.quantity * 2.5).toFixed(1);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/listings/my');
      const list = res.data?.listings || res.data?.data || [];
      if (Array.isArray(list)) {
        setListings(list);
        setPreviewMode(false);
      } else {
        setListings([]);
        setPreviewMode(false);
      }
    } catch (err) {
      console.warn('Backend unavailable, using initial demo donor data:', err);
      setListings(DEMO_DONOR_LISTINGS);
      setPreviewMode(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgDetails = async () => {
    try {
      const res = await api.get('/organizations/my');
      if (res.data?.organization) {
        const orgData = res.data.organization;
        setOrg(orgData);
        if (orgData.address?.street || orgData.address?.city) {
          const street = orgData.address?.street || '';
          const city = orgData.address?.city || '';
          const combined = [street, city].filter(Boolean).join(', ');
          setFormData((prev) => ({
            ...prev,
            address: combined || prev.address,
            latitude: orgData.location?.latitude || prev.latitude,
            longitude: orgData.location?.longitude || prev.longitude,
          }));
        }
      }
    } catch (err) {
      console.warn('Could not load org profile:', err);
    }
  };

  useEffect(() => {
    fetchMyListings();
    fetchOrgDetails();
  }, []);

  // Real-time WebSocket Listeners for Instant Live Updates
  useEffect(() => {
    if (!socket) return;

    const onRescueRequested = (data) => {
      const shelterName = data.claim?.recipientOrganization?.name || 'NGO Partner';
      toast.info(`🔔 Incoming Rescue Request: ${shelterName} requested to rescue "${data.listing?.title || 'your batch'}"!`);
      fetchMyListings();
    };

    const onVanDispatched = (data) => {
      const shelterName = data.claim?.recipientOrganization?.name || 'Assigned Shelter';
      toast.success(`🚚 Pickup Van En Route: ${shelterName} has dispatched their vehicle to your counter!`);
      fetchMyListings();
    };

    const onHandoverVerified = () => {
      toast.success('🎉 Zero-Hunger Handover Verified! Food rescue mission completed.');
      fetchMyListings();
    };

    const onRescueCancelled = () => {
      toast.info('Rescue was cancelled. Food batch returned to available network.');
      fetchMyListings();
    };

    socket.on('RESCUE_REQUESTED', onRescueRequested);
    socket.on('VAN_DISPATCHED', onVanDispatched);
    socket.on('HANDOVER_VERIFIED', onHandoverVerified);
    socket.on('RESCUE_CANCELLED', onRescueCancelled);

    return () => {
      socket.off('RESCUE_REQUESTED', onRescueRequested);
      socket.off('VAN_DISPATCHED', onVanDispatched);
      socket.off('HANDOVER_VERIFIED', onHandoverVerified);
      socket.off('RESCUE_CANCELLED', onRescueCancelled);
    };
  }, [socket]);

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setDetectingGps(false);
        toast.success(`Current GPS coordinates locked (${lat}, ${lng})!`);
      },
      (err) => {
        setDetectingGps(false);
        toast.error('Could not detect location: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  const handleUseSavedOrgLocation = () => {
    if (!org) {
      toast.info('No saved facility profile found. You can set one in Profile.');
      return;
    }
    const street = org.address?.street || '';
    const city = org.address?.city || '';
    const full = [street, city].filter(Boolean).join(', ') || 'Facility Counter';
    setFormData((prev) => ({
      ...prev,
      address: full,
      latitude: org.location?.latitude || 26.9148,
      longitude: org.location?.longitude || 80.9424,
    }));
    toast.info('Applied saved facility address from your Profile.');
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const toggleAllergen = (allergen) => {
    setFormData((prev) => {
      const list = prev.allergens || [];
      if (allergen === 'NONE') {
        return { ...prev, allergens: [] };
      }
      if (list.includes(allergen)) {
        return { ...prev, allergens: list.filter((a) => a !== allergen) };
      } else {
        return { ...prev, allergens: [...list.filter((a) => a !== 'NONE'), allergen] };
      }
    });
  };

  // 1-Click Presentation Viva Presets
  const applyPreset = (presetKey) => {
    if (presetKey === 'COLLEGE_MESS') {
      setFormData({
        title: 'Fresh Dal Tadka, Jeera Rice & Phulkas (Hostel Mess #3)',
        description: 'Nutritious hot lunch surplus from student dining hall. Kept safely warm in insulated stainless steel vessels.',
        category: 'COOKED_MEALS',
        dietaryType: 'VEG',
        quantity: 80,
        unit: 'MEALS',
        idealPickupHours: 3,
        storageCondition: 'Hot Food Warm (>65°C)',
        cookedTimeMode: 'JUST_COOKED',
        cookedTime: new Date(Date.now() - 35 * 60 * 1000).toISOString().slice(0, 16),
        packagingType: 'BULK_VESSELS',
        pickupPoint: 'Hostel Mess #3 Kitchen Rear Dock, Gate 2',
        contactPerson: 'Manoj Verma (Mess Supervisor)',
        contactPhone: '9450001122',
        handlingInstructions: 'Hot food (>65°C). NGO van should carry 3-4 food-grade stainless steel buckets/drums.',
        allergens: ['DAIRY'],
        address: 'IET Lucknow Campus, Sitapur Road, Lucknow',
        latitude: 26.9148,
        longitude: 80.9424,
        safetyVerified: true,
      });
      toast.success('🎓 Loaded: College Mess Lunch Scenario!');
    } else if (presetKey === 'HOTEL_BANQUET') {
      setFormData({
        title: 'Shahi Paneer, Veg Biryani & Gulab Jamun (Conference Banquet)',
        description: 'Premium surplus from conference gala dinner, stored under rapid controlled refrigeration.',
        category: 'COOKED_MEALS',
        dietaryType: 'VEG',
        quantity: 120,
        unit: 'MEALS',
        idealPickupHours: 6,
        storageCondition: 'Refrigerated (<4°C)',
        cookedTimeMode: '2_HOURS_AGO',
        cookedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        packagingType: 'BULK_VESSELS',
        pickupPoint: 'Clarks Awadh Hotel, Service Ramp 1, Goods Receiving Area',
        contactPerson: 'Chef Arvind (Executive Sous Chef)',
        contactPhone: '9839012345',
        handlingInstructions: 'Refrigerated immediately after buffet. Cold chain transit vehicle recommended.',
        allergens: ['DAIRY', 'NUTS'],
        address: '8 MG Marg, Hazratganj, Lucknow',
        latitude: 26.8530,
        longitude: 80.9450,
        safetyVerified: true,
      });
      toast.success('🏨 Loaded: 5-Star Hotel Banquet Dinner Scenario!');
    } else if (presetKey === 'BAKERY_CAFE') {
      setFormData({
        title: 'Surplus Multigrain Breads, Buns & Artisanal Croissants',
        description: 'End-of-shift bakery surplus, hygienically packed in clean paper food bags. 100% fresh and ready to eat.',
        category: 'BAKERY',
        dietaryType: 'VEG',
        quantity: 45,
        unit: 'PACKETS',
        idealPickupHours: 18,
        storageCondition: 'Ambient Room Temp',
        cookedTimeMode: 'MORNING',
        cookedTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16),
        packagingType: 'INDIVIDUAL_BOXES',
        pickupPoint: 'Royal Cafe Bakery Counter, Front Gate',
        contactPerson: 'Priya Sharma (Store Manager)',
        contactPhone: '9919056789',
        handlingInstructions: 'Individually bagged in paper packets. Ready for direct distribution to children without extra vessels.',
        allergens: ['GLUTEN'],
        address: 'Hazratganj Market, Lucknow',
        latitude: 26.8480,
        longitude: 80.9470,
        safetyVerified: true,
      });
      toast.success('🥐 Loaded: Bakery & Cafe Surplus Scenario!');
    } else if (presetKey === 'DRY_GROCERY') {
      setFormData({
        title: 'Raw Basmati Rice & Toor Dal Grains (Surplus Inventory)',
        description: 'Surplus unpolished dry food grains from pantry inventory. Sealed bags, completely dry and non-perishable.',
        category: 'RAW_GROCERY',
        dietaryType: 'VEG',
        quantity: 50,
        unit: 'KG',
        idealPickupHours: 72,
        storageCondition: 'Ambient Room Temp',
        cookedTimeMode: 'DRY_STAPLE',
        cookedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        packagingType: 'DRY_SACKS',
        pickupPoint: 'Campus Central Ration Store, Gate 4',
        contactPerson: 'R. K. Mishra (Storekeeper)',
        contactPhone: '9721098765',
        handlingInstructions: 'Dry gunny sacks. Protect from rain or moisture during transit.',
        allergens: [],
        address: 'IET Lucknow Stores Dept, Sitapur Road',
        latitude: 26.9148,
        longitude: 80.9424,
        safetyVerified: true,
      });
      toast.success('🌾 Loaded: Dry Raw Grocery (Non-Perishable) Scenario!');
    }
  };

  // Backwards compatibility alias
  const handleQuickFill = () => applyPreset('COLLEGE_MESS');

  // Gemini AI Vision Scanner Handlers
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid food photo (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setVisionImage(uploadEvent.target.result);
      setAiVisionResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanImage = async () => {
    if (!visionImage) {
      toast.error('Please upload or select a food photo first.');
      return;
    }

    setScanningImage(true);
    try {
      const res = await api.post('/ai/scan-image', {
        image: visionImage,
        mimeType: 'image/jpeg',
      });

      if (res.data?.success && res.data?.analysis) {
        const a = res.data.analysis;
        setAiVisionResult(a);

        // Instantly auto-fill form inputs with AI Vision data
        setFormData((prev) => ({
          ...prev,
          title: a.title || prev.title,
          description: a.description || prev.description,
          category: a.category || prev.category,
          dietaryType: a.dietaryType || prev.dietaryType,
          quantity: a.estimatedQuantity || prev.quantity,
          unit: a.unit || prev.unit,
          storageCondition: a.recommendedStorage || prev.storageCondition,
          packagingType: a.packagingType || prev.packagingType,
          idealPickupHours: a.suggestedUrgencyHours || prev.idealPickupHours,
          cookedTimeMode: a.category === 'RAW_GROCERY' ? 'DRY_STAPLE' : 'JUST_COOKED',
        }));

        setAiPromptSummary(`📷 Vision AI Extracted: ${a.title} (~${a.estimatedQuantity} ${a.unit || 'Meals'}) • ${a.freshnessScore || 94}% Freshness Index`);
        toast.success(`✨ Gemini Vision analyzed photo & auto-filled details into form!`);
      } else {
        throw new Error(res.data?.message || 'Could not analyze image');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'AI Vision scan failed. Please check network.');
    } finally {
      setScanningImage(false);
    }
  };

  // Natural Language & Voice Prompt AI Parser
  const handleParseAiPrompt = async (sampleText) => {
    const textToRun = sampleText || aiPromptText;
    if (!textToRun || !textToRun.trim()) {
      toast.error('Please type a description (e.g. 5 kg daal aur 10kg chawal room me rakhe hai)');
      return;
    }

    setParsingPrompt(true);
    try {
      const res = await api.post('/ai/parse-prompt', { promptText: textToRun });
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setFormData((prev) => ({
          ...prev,
          title: d.title || prev.title,
          description: d.description || prev.description,
          category: d.category || prev.category,
          dietaryType: d.dietaryType || prev.dietaryType,
          quantity: d.quantity || prev.quantity,
          unit: d.unit || prev.unit,
          cookedTimeMode: d.cookedTimeMode || prev.cookedTimeMode,
          storageCondition: d.storageCondition || prev.storageCondition,
          packagingType: d.packagingType || prev.packagingType,
          idealPickupHours: d.idealPickupHours || prev.idealPickupHours,
          allergens: d.allergens || prev.allergens,
        }));
        setAiPromptSummary(`🪄 AI Extracted: ${d.title} (${d.quantity} ${d.unit}) • ${d.storageCondition} • ${d.cookedTimeMode}`);
        toast.success('✨ Gemini AI understood your prompt & auto-filled the form!');
      } else {
        throw new Error(res.data?.message || 'Could not parse text');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'AI Prompt extraction failed.');
    } finally {
      setParsingPrompt(false);
    }
  };

  const handleApplyAiData = () => {
    if (!aiVisionResult) return;

    setFormData((prev) => ({
      ...prev,
      title: aiVisionResult.title || prev.title,
      description: aiVisionResult.description || prev.description,
      category: aiVisionResult.category || prev.category,
      dietaryType: aiVisionResult.dietaryType || prev.dietaryType,
      quantity: aiVisionResult.estimatedQuantity || prev.quantity,
      unit: aiVisionResult.unit || prev.unit,
      storageCondition: aiVisionResult.recommendedStorage || prev.storageCondition,
      packagingType: aiVisionResult.packagingType || prev.packagingType,
      idealPickupHours: aiVisionResult.suggestedUrgencyHours || prev.idealPickupHours,
      cookedTimeMode: aiVisionResult.category === 'RAW_GROCERY' ? 'DRY_STAPLE' : 'JUST_COOKED',
    }));

    toast.success('Form auto-filled with Gemini AI Vision inspection data!');
  };

  const handlePostDonation = async (e) => {
    e.preventDefault();
    if (!formData.safetyVerified) {
      toast.error('Please confirm food safety & hygiene standards before posting.');
      return;
    }

    setPostError('');
    setPosting(true);

    try {
      const pickupDate = new Date(Date.now() + Number(formData.idealPickupHours) * 60 * 60 * 1000);
      
      // Compute cooked timestamp from cookedTimeMode or explicit input
      let resolvedCookedTime = new Date();
      if (formData.cookedTimeMode === 'JUST_COOKED') {
        resolvedCookedTime = new Date(Date.now() - 35 * 60 * 1000);
      } else if (formData.cookedTimeMode === '2_HOURS_AGO') {
        resolvedCookedTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
      } else if (formData.cookedTimeMode === '4_HOURS_AGO') {
        resolvedCookedTime = new Date(Date.now() - 4 * 60 * 60 * 1000);
      } else if (formData.cookedTimeMode === 'MORNING') {
        resolvedCookedTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
      } else if (formData.cookedTimeMode === 'DRY_STAPLE') {
        resolvedCookedTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      } else if (formData.cookedTimeMode === 'CUSTOM' && formData.cookedTime) {
        resolvedCookedTime = new Date(formData.cookedTime);
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        category: formData.category,
        foodType: formData.dietaryType,
        dietaryType: formData.dietaryType,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        cookedTime: resolvedCookedTime.toISOString(),
        idealPickupTime: pickupDate.toISOString(),
        expiryTime: pickupDate.toISOString(),
        storageCondition: formData.storageCondition,
        packagingType: formData.packagingType,
        handlingInstructions: formData.handlingInstructions || '',
        allergens: formData.allergens || [],
        pickupPoint: formData.pickupPoint || '',
        contactPerson: formData.contactPerson || user?.name || '',
        contactPhone: formData.contactPhone || user?.phone || '',
        notes: formData.handlingInstructions || '',
        images: visionImage ? [visionImage] : [],
        pickupLocation: {
          street: formData.address || 'Central Canteen Counter',
          city: 'Lucknow',
          latitude: Number(formData.latitude) || 26.9148,
          longitude: Number(formData.longitude) || 80.9424,
        },
      };

      const res = await api.post('/listings', payload);
      setPosting(false);

      if (res.data?.success) {
        setShowPostModal(false);
        setVisionImage(null);
        setAiVisionResult(null);
        toast.success('Food donation batch published successfully to the live network!');
        // Reset form to defaults
        setFormData({
          title: '',
          description: '',
          category: 'COOKED_MEALS',
          dietaryType: 'VEG',
          quantity: 50,
          unit: 'MEALS',
          idealPickupHours: 4,
          storageCondition: 'Hot Food Warm (>65°C)',
          cookedTimeMode: 'JUST_COOKED',
          cookedTime: new Date(Date.now() - 30 * 60 * 1000).toISOString().slice(0, 16),
          packagingType: 'BULK_VESSELS',
          pickupPoint: 'Kitchen Loading Dock, Gate 2',
          contactPerson: user?.name || 'Chef / Mess In-charge',
          contactPhone: user?.phone || '9876543210',
          handlingInstructions: 'Kept hot in food-grade insulated vessels. NGO should bring clean containers/drums.',
          allergens: ['DAIRY'],
          address: 'IET Lucknow Central Canteen, Sitapur Road',
          latitude: 26.9148,
          longitude: 80.9424,
          safetyVerified: true,
        });
        await fetchMyListings();
      } else {
        throw new Error(res.data?.message || 'Failed to create listing');
      }
    } catch (err) {
      setPosting(false);
      const errMsg = err.response?.data?.message || err.message || 'Could not post food donation. Please check details.';
      setPostError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleVerifyHandover = async (e) => {
    e.preventDefault();
    if (!verifyModalListing) return;

    setVerifyingOtp(true);
    setVerifyError('');
    setVerifySuccess('');

    // If it's a demo or local item, allow '7492' or any 4 digits
    if (verifyModalListing._id?.startsWith('demo-') || verifyModalListing._id?.startsWith('local-')) {
      setTimeout(() => {
        setVerifyingOtp(false);
        setVerifySuccess('Handover successfully authenticated and food delivery completed!');
        toast.success('Food rescue authenticated! Delivery completed.');
        setListings((prev) =>
          prev.map((item) =>
            item._id === verifyModalListing._id
              ? { ...item, status: 'COMPLETED' }
              : item
          )
        );
        setTimeout(() => {
          setVerifyModalListing(null);
          setHandoverOtp('');
          setVerifySuccess('');
        }, 1500);
      }, 600);
      return;
    }

    try {
      const res = await api.post(`/listings/${verifyModalListing._id}/verify-handover`, {
        handoverOtp: handoverOtp.trim(),
        otp: handoverOtp.trim(),
      });

      setVerifyingOtp(false);
      if (res.data?.success) {
        setVerifySuccess('Handover successfully authenticated and food delivery completed!');
        toast.success('Food rescue authenticated! Delivery completed.');
        setTimeout(() => {
          setVerifyModalListing(null);
          setHandoverOtp('');
          setVerifySuccess('');
          fetchMyListings();
        }, 1800);
      }
    } catch (err) {
      setVerifyingOtp(false);
      const msg = err.response?.data?.message || 'Incorrect OTP code. Please confirm with the NGO volunteer.';
      setVerifyError(msg);
      toast.error(msg);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to withdraw this donation listing?')) return;
    try {
      await api.delete(`/listings/${listingId}`);
      toast.info('Listing cancelled successfully');
      fetchMyListings();
    } catch (err) {
      // Local removal
      setListings((prev) => prev.filter((l) => l._id !== listingId));
      toast.info('Listing withdrawn');
    }
  };

  const handleAcceptRequest = async (claimId) => {
    try {
      const res = await api.patch(`/claims/${claimId}/status`, { status: 'ACCEPTED' });
      if (res.data?.success) {
        toast.success('Rescue request accepted! NGO can now dispatch their pickup vehicle.');
        fetchMyListings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept rescue request.');
    }
  };

  const handleDeclineRequest = async (claimId) => {
    if (!window.confirm('Are you sure you want to decline this NGO rescue request? The food will remain available for other shelters.')) return;
    try {
      const res = await api.post(`/claims/${claimId}/cancel`, { action: 'REJECT' });
      if (res.data?.success) {
        toast.info('Rescue request declined. Food listing restored to available network.');
        fetchMyListings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not decline rescue request.');
    }
  };

  const handleCancelRescue = async (claimId) => {
    if (!window.confirm('Are you sure you want to cancel this active rescue? The food listing will be restored to available status.')) return;
    try {
      const res = await api.post(`/claims/${claimId}/cancel`, { action: 'CANCEL' });
      if (res.data?.success) {
        toast.info('Rescue cancelled. Food listing restored to available network.');
        fetchMyListings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel rescue.');
    }
  };

  // Compute metrics
  const availableCount = listings.filter((l) => l.status === 'AVAILABLE').length;
  const activeCount = availableCount;
  const inTransitCount = listings.filter((l) => ['CLAIMED', 'ACCEPTED', 'IN_TRANSIT', 'PICKED_UP'].includes(l.status)).length;
  const completedCount = listings.filter((l) => l.status === 'COMPLETED').length;
  const totalActiveCount = availableCount + inTransitCount;

  const displayListings = listings.filter((item) => {
    if (activeTab === 'ACTIVE') {
      return ['AVAILABLE', 'CLAIMED', 'ACCEPTED', 'IN_TRANSIT', 'PICKED_UP'].includes(item.status);
    }
    if (activeTab === 'COMPLETED') {
      return item.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 app-page-frame">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 app-page-heading">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            YOUR FOOD DONATIONS
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {user?.name || 'Campus Canteen'} Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Share surplus food, track collections and confirm successful handovers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMyListings}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Batches"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-sm hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a donation</span>
          </button>
        </div>
      </div>

      {previewMode && (
        <div className="preview-notice" role="status">
          <span className="preview-notice-dot" /> Preview mode: these donations are examples because the server is unavailable. Sample actions are simulated.
        </div>
      )}

      {/* Stats Counter Bar - Clickable to switch tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-5 rounded-2xl border text-left shadow-sm flex items-center gap-4 transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
            {activeCount}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Available Batches</p>
            <h4 className="text-xl font-bold text-slate-800">Ready for Rescue</h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-5 rounded-2xl border text-left shadow-sm flex items-center gap-4 transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0">
            {inTransitCount}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Claimed by NGO Shelters</p>
            <h4 className="text-xl font-bold text-slate-800">Awaiting Handover OTP</h4>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`p-5 rounded-2xl border text-left shadow-sm flex items-center gap-4 transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
            {completedCount}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Verified Handovers</p>
            <h4 className="text-xl font-bold text-slate-800">Successfully Rescued</h4>
          </div>
        </button>
      </div>

      {/* Listings Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Food Donations</h3>
            <p className="text-xs text-slate-500">Manage live batches, incoming shelter claims, and verified zero-hunger certificates</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Batches ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active & In-Transit ({totalActiveCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-teal-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Completed ({completedCount})</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Loading your batches...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No Food Donations Posted Yet</h4>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Whenever your kitchen, canteen, or banquet has excess portions, click below to post and notify nearby shelters.
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Post First Surplus Batch
            </button>
          </div>
        ) : displayListings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            {activeTab === 'COMPLETED' ? (
              <>
                <Award className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">No Completed Rescues in this View</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  When a shelter completes food pickup and authenticates with the 6-digit OTP code, verified Zero-Hunger impact certificates will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  View All Batches
                </button>
              </>
            ) : (
              <>
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">No Active Batches Right Now</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  All posted batches have been rescued! Click below to publish a new surplus donation.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPostModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                >
                  Post Surplus Batch
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayListings.map((item) => {
              if (item.status === 'COMPLETED') {
                const mealsFed = item.aiAnalysis?.estimatedMeals || item.aiUrgency?.estimatedMeals || (item.unit === 'MEALS' ? item.quantity : Math.round(item.quantity * 2.5));
                const peopleFed = item.activeClaim?.beneficiariesTarget || item.claimedBy?.beneficiariesTarget || (item.unit === 'MEALS' ? item.quantity : Math.round(item.quantity * 2.5));
                const co2Saved = item.aiAnalysis?.co2eSavedKg || (item.quantity * 2.5).toFixed(1);
                const partnerOrg = item.activeClaim?.recipientOrganization?.name || item.claimedBy?.organization?.name || 'Authorized Shelter Partner';

                return (
                  <div key={item._id} className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-slate-50/70 transition-colors">
                    <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 space-y-4 shadow-xs">
                      
                      {/* Certified Header Banner */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                                Food Handover Complete
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                Handover Confirmed
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              PIN verified at counter • Completed on {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'}
                              {item.activeClaim?.completedAt && ` at ${new Date(item.activeClaim.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setCertListing(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02]"
                          >
                            <Award className="w-4 h-4" />
                            <span>Impact Certificate</span>
                          </button>
                          <Link
                            to={`/track/${item._id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors"
                          >
                            <Radio className="w-3.5 h-3.5 text-teal-600" />
                            <span>View Receipt & Status</span>
                          </Link>
                        </div>
                      </div>

                      {/* Food & Partner Details + Realized Impact Metrics */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                              <Utensils className="w-7 h-7" />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-base font-bold text-slate-900 truncate">{item.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span>
                                Delivered: <strong className="text-slate-900">{item.quantity} {item.unit}</strong>
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">{item.dietaryType || item.foodType || 'VEG'}</span>
                              <span>•</span>
                              <span>{item.category?.replace(/_/g, ' ') || 'Cooked Meals'}</span>
                              <span>•</span>
                              <span>{item.storageCondition || 'Safe Ambient'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
                              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>
                                Delivered to Shelter: <strong className="text-slate-900">{partnerOrg}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3-Column Realized Impact Grid */}
                        <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-white p-3 rounded-xl border border-emerald-200/80 shrink-0 text-center shadow-xs">
                          <div className="px-2">
                            <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">Meals Fed</span>
                            <span className="text-base font-extrabold text-emerald-950">
                              {mealsFed}
                            </span>
                          </div>
                          <div className="px-2 border-x border-emerald-200">
                            <span className="text-[10px] text-teal-800 font-bold block uppercase tracking-wider">People Reached</span>
                            <span className="text-base font-extrabold text-teal-950">
                              ~{peopleFed}
                            </span>
                          </div>
                          <div className="px-2">
                            <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">CO₂ Diverted</span>
                            <span className="text-base font-extrabold text-emerald-950">
                              {co2Saved} kg
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              }

              return (
              <div key={item._id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={item.status} />
                    <UrgencyBadge
                      level={item.aiUrgency?.level || item.urgencyLevel || 'MEDIUM'}
                      score={item.aiUrgency?.urgencyScore || item.aiAnalysis?.urgencyScore}
                    />
                    {item.status !== 'COMPLETED' && (
                      <CountdownTimer 
                        expiryTime={item.expiryTime} 
                        idealPickupTime={item.idealPickupTime} 
                      />
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    {item.images && item.images.length > 0 && (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm"
                      />
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                        <span>
                          Qty: <strong className="text-slate-900">{item.quantity} {item.unit}</strong> (~{item.aiUrgency?.estimatedMeals || item.aiAnalysis?.estimatedMeals || Math.round(item.quantity * 2.5)} meals)
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{item.dietaryType || item.foodType || 'VEG'}</span>
                        <span>•</span>
                        <span>Storage: <strong className="text-slate-800">{item.storageCondition || 'Ambient'}</strong></span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          <Box className="w-3 h-3 text-indigo-500" />
                          <span>{item.packagingType === 'INDIVIDUAL_BOXES' ? '🍱 Bento Boxes (Ready)' : item.packagingType === 'SEALED_PACKETS' ? '📦 Sealed Packets' : item.packagingType === 'DRY_SACKS' ? '🌾 Dry Sacks' : '🍲 Bulk Vessels (Bring Drums)'}</span>
                        </span>
                        {item.cookedTime && (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Prepared: {new Date(item.cookedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        )}
                      </div>

                      {(item.pickupPoint || item.contactPerson || (item.allergens && item.allergens.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          {item.pickupPoint && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Dock: <strong className="text-slate-700">{item.pickupPoint}</strong></span>
                            </span>
                          )}
                          {item.contactPerson && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>Contact: <strong className="text-slate-700">{item.contactPerson} {item.contactPhone && `(${item.contactPhone})`}</strong></span>
                            </span>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Allergens: <strong className="text-amber-800">{item.allergens.join(', ')}</strong></span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.status === 'CLAIMED' && (
                    <div className="mt-2.5 p-4 rounded-2xl border text-xs space-y-3 bg-white shadow-sm border-amber-200">
                      
                      {/* Sub-case 1: Status is REQUESTED (Awaiting Donor Acceptance) */}
                      {item.activeClaim?.status === 'REQUESTED' ? (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                              <h5 className="font-extrabold text-amber-950 text-sm">
                                🔔 Incoming Rescue Request: {item.activeClaim?.recipientOrganization?.name || 'NGO Partner'}
                              </h5>
                            </div>
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider self-start sm:self-auto">
                              Awaiting Your Acceptance
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                            <div>
                              <span className="text-[11px] text-amber-800/80 block">Beneficiaries</span>
                              <strong className="text-slate-900 font-bold">~{item.activeClaim?.beneficiariesTarget || item.quantity} People</strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-amber-800/80 block">Requested Pickup ETA</span>
                              <strong className="text-slate-900 font-bold">
                                {item.activeClaim?.pickupEta ? new Date(item.activeClaim.pickupEta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Within 30 mins'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-amber-800/80 block">Driver Notes</span>
                              <strong className="text-slate-900 truncate block">
                                {item.activeClaim?.pickupNotes || 'Insulated food pickup vehicle'}
                              </strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <p className="text-[11px] text-slate-500">
                              Accept to authorize the NGO driver to dispatch their pickup van.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeclineRequest(item.activeClaim._id)}
                                className="px-3.5 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                              >
                                ✕ Decline Request
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptRequest(item.activeClaim._id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                ✓ Accept & Confirm Pickup
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Sub-case 2: Status is ACCEPTED / IN_TRANSIT / PICKED_UP */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-bold flex items-center gap-1.5 text-amber-900">
                              <ShieldCheck className="w-4 h-4 text-amber-600" />
                              <span>
                                {item.activeClaim?.status === 'IN_TRANSIT'
                                  ? 'Pickup Van En Route'
                                  : item.activeClaim?.status === 'PICKED_UP'
                                  ? 'Driver Arrived at Counter'
                                  : 'Rescue Accepted • Awaiting Van Dispatch'}
                              </span>
                            </p>
                            <p className="text-amber-800 text-[11px] mt-0.5">
                              NGO Partner: <strong>{item.activeClaim?.recipientOrganization?.name || 'Assigned Shelter'}</strong>. Ask driver for their 6-digit OTP code to release food.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              to={`/track/${item._id}`}
                              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Live Track</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyModalListing(item);
                                setVerifyError('');
                                setVerifySuccess('');
                                setHandoverOtp('');
                              }}
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Verify OTP</span>
                            </button>
                            {item.activeClaim?._id && (
                              <button
                                type="button"
                                onClick={() => handleCancelRescue(item.activeClaim._id)}
                                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1"
                                title="Cancel this rescue and restore food to available mesh"
                              >
                                ✕ Cancel Rescue
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === 'AVAILABLE' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Link
                        to={`/track/${item._id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs flex items-center gap-1.5 border border-teal-200 transition-colors shadow-sm"
                      >
                        <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        <span>Live Track on Mesh</span>
                      </Link>
                      <button
                        onClick={() => setAiRecListing(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI Matched NGOs</span>
                      </button>
                    </div>
                  )}

                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'AVAILABLE' && (
                    <button
                      onClick={() => handleDeleteListing(item._id)}
                      title="Cancel / Delete Listing"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Donation Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 relative my-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Quick Food Dispatch
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Post Food Donation
                </h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Gemini AI Smart Auto-Extractor (Prompt + Photo Vision) */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-emerald-50/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>Gemini AI Auto-Extractor</span>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">NLP + Vision</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Type text or scan photo</span>
              </div>

              {/* Natural Language Prompt Input */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleParseAiPrompt();
                      }
                    }}
                    placeholder='e.g. "5 kg daal aur 10kg chawal room me rakhe hai 1 ghante pehle bne the"'
                    className="flex-1 px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleParseAiPrompt()}
                    disabled={parsingPrompt || !aiPromptText.trim()}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                  >
                    {parsingPrompt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>AI Fill</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sample Prompt Chips & Photo Scan Trigger */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Try sample:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = "5 kg daal aur 10kg chawal room me rakhe hai 1 ghante pehle bne the";
                        setAiPromptText(sample);
                        handleParseAiPrompt(sample);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/90 hover:bg-white text-[10px] font-semibold text-slate-700 border border-indigo-100 hover:border-indigo-300 transition-all shadow-2xs"
                    >
                      💬 5 kg daal + 10kg chawal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = "Hostel mess 80 meals veg pulao and dal fry hot warm 30 mins ago";
                        setAiPromptText(sample);
                        handleParseAiPrompt(sample);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/90 hover:bg-white text-[10px] font-semibold text-slate-700 border border-indigo-100 hover:border-indigo-300 transition-all shadow-2xs"
                    >
                      💬 80 Meals Mess Lunch
                    </button>
                  </div>

                  {/* Photo Scanner Trigger */}
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="food-photo-upload"
                      className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-900 text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      <input
                        id="food-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{visionImage ? 'Photo Attached ✓' : 'Upload Photo'}</span>
                    </label>

                    {visionImage && (
                      <button
                        type="button"
                        onClick={handleScanImage}
                        disabled={scanningImage}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {scanningImage ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Scan Image</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Live Feedback / Auto-Fill Confirmation Pill */}
              {aiPromptSummary && (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate font-semibold text-[11px]">{aiPromptSummary}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded shrink-0">
                    Form Populated ✓
                  </span>
                </div>
              )}
            </div>

            {/* 1-Click Fast Presets (Quick Fill) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                ⚡ 1-Click Presets:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('COLLEGE_MESS')}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all"
                >
                  🎓 Mess Lunch
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('HOTEL_BANQUET')}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold transition-all"
                >
                  🏨 Banquet Buffet
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('BAKERY_CAFE')}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold transition-all"
                >
                  🥐 Bakery
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('DRY_GROCERY')}
                  className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-semibold transition-all"
                >
                  🌾 Raw Rice / Dal
                </button>
              </div>
            </div>

            {postError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{postError}</span>
              </div>
            )}

            <form onSubmit={handlePostDonation} className="space-y-3.5">
              
              {/* 1. Food Name & Diet */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Food Name *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, dietaryType: 'VEG' }))}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                        formData.dietaryType === 'VEG'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      🟢 Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, dietaryType: 'NON_VEG' }))}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                        formData.dietaryType === 'NON_VEG'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      🔴 Non-Veg
                    </button>
                  </div>
                </div>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. 50 Servings Dal Makhani & Jeera Rice"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* 2. Quantity & Prep Time (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      required
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-1/2 px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-1/2 px-2 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="MEALS">Meals</option>
                      <option value="KG">Kilograms (kg)</option>
                      <option value="PACKETS">Packets</option>
                      <option value="BOXES">Boxes</option>
                    </select>
                  </div>
                </div>

                {/* When Prepared (3 Simple Pills) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cooked / Prepared When? *
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, cookedTimeMode: 'JUST_COOKED' }))}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        formData.cookedTimeMode === 'JUST_COOKED'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🟢 &lt;1h ago
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, cookedTimeMode: '2_HOURS_AGO' }))}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        formData.cookedTimeMode === '2_HOURS_AGO'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🟡 2-3h ago
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, cookedTimeMode: 'DRY_STAPLE' }))}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        formData.cookedTimeMode === 'DRY_STAPLE'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🌾 Dry / Raw
                    </button>
                  </div>
                </div>

              </div>

              {/* 3. Pickup Gate / Address */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Pickup Location / Gate *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGpsLocation}
                    disabled={detectingGps}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    <Navigation className="w-3 h-3 text-emerald-600" />
                    <span>{detectingGps ? 'Locating...' : 'Auto-detect GPS'}</span>
                  </button>
                </div>
                <input
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Canteen Gate 2, Sitapur Road Campus"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* 4. OPTIONAL ACCORDION: "More Options (Packaging, Temp, Contact)" */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span>⚙️ More Options (Packaging, Temp, Contact)</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {showAdvanced ? 'Hide' : 'Customize'}
                    </span>
                  </span>
                  <span className="text-slate-400 text-xs">{showAdvanced ? '▲' : '▼'}</span>
                </button>

                {showAdvanced && (
                  <div className="p-3.5 space-y-3 bg-white border-t border-slate-200 animate-in fade-in">
                    
                    {/* Packaging */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Packaging (Does NGO need to bring drums?):
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { key: 'BULK_VESSELS', label: '🍲 Bulk Vessels (Bring Drums)' },
                          { key: 'INDIVIDUAL_BOXES', label: '🍱 Bento Boxes (Ready)' },
                          { key: 'SEALED_PACKETS', label: '📦 Sealed Packets' },
                          { key: 'DRY_SACKS', label: '🌾 Gunny Sacks' },
                        ].map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, packagingType: p.key }))}
                            className={`p-2 rounded-xl text-left text-xs border transition-all ${
                              formData.packagingType === p.key
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Storage Temperature:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { key: 'Hot Food Warm (>65°C)', label: '🔥 Hot (>65°C)' },
                          { key: 'Refrigerated (<4°C)', label: '❄️ Chilled (<4°C)' },
                          { key: 'Ambient Room Temp', label: '🌡️ Room Temp' },
                        ].map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, storageCondition: t.key }))}
                            className={`p-1.5 rounded-xl text-center text-xs border transition-all ${
                              formData.storageCondition === t.key
                                ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contact Person Phone & Dock */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Specific Dock / Gate
                        </label>
                        <input
                          name="pickupPoint"
                          type="text"
                          placeholder="e.g. Loading Dock Gate 2"
                          value={formData.pickupPoint}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Contact Phone
                        </label>
                        <input
                          name="contactPhone"
                          type="tel"
                          placeholder="9876543210"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* FSSAI Quick Assurance & Submit */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>FSSAI Hygiene Certified</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  ~{estimatedMeals} meals saved
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Publish Food Batch</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Handover OTP Verification Modal */}
      {verifyModalListing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-auto animate-in fade-in zoom-in-95">
            
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Verify NGO Driver Handover
              </h3>
              <p className="text-xs text-slate-500">
                Enter the 4-digit OTP provided by the NGO driver picking up{' '}
                <strong>{verifyModalListing.title}</strong>.
              </p>
            </div>

            {verifyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyHandover} className="space-y-4">
              <div>
                <label htmlFor="verify-handover-otp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 text-center">
                  Driver's Handshake Security OTP (4-6 Digits)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    id="verify-handover-otp"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter OTP"
                    value={handoverOtp}
                    onChange={(e) => setHandoverOtp(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center tracking-widest text-2xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalListing(null)}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || handoverOtp.length < 4}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Release'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {aiRecListing && (
        <AiRecommendationsModal
          listing={aiRecListing}
          onClose={() => setAiRecListing(null)}
        />
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

export default DonorDashboard;
