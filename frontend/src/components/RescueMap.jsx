import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Utensils, 
  Building2, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';
import { UrgencyBadge } from './UrgencyBadge';
import CountdownTimer from './CountdownTimer';

/**
 * Interactive Proximity Radar & Geographic Rescue Map
 * Visualizes surplus food listings and NGO rescue hubs across Lucknow
 */
export const RescueMap = ({ listings = [], onClaim, userRole }) => {
  const [selectedItem, setSelectedItem] = useState(listings[0] || null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, CRITICAL, VEG, NON_VEG

  // Center point: IET Lucknow (26.9148° N, 80.9424° E)
  const centerLat = 26.9148;
  const centerLng = 80.9424;

  // Filter listings
  const filteredListings = listings.filter((item) => {
    if (filterType === 'CRITICAL') return item.urgencyLevel === 'CRITICAL' || item.aiAnalysis?.urgencyScore >= 75;
    if (filterType === 'VEG') return item.foodType === 'VEG' || item.dietaryType === 'VEG';
    if (filterType === 'NON_VEG') return item.foodType === 'NON_VEG' || item.dietaryType === 'NON_VEG';
    return true;
  });

  // Convert GPS Coordinates to SVG X, Y percentage relative to Lucknow bounds
  // Lat range: 26.83 to 26.95 (approx 13km North-South)
  // Lng range: 80.88 to 81.02 (approx 14km West-East)
  const getCoordinates = (lat, lng) => {
    const latMin = 26.83;
    const latMax = 26.95;
    const lngMin = 80.88;
    const lngMax = 81.02;

    const validLat = lat || centerLat;
    const validLng = lng || centerLng;

    // SVG Y is inverted (North is top = 0% Y)
    const x = Math.min(Math.max(((validLng - lngMin) / (lngMax - lngMin)) * 100, 10), 90);
    const y = Math.min(Math.max((1 - (validLat - latMin) / (latMax - latMin)) * 100, 10), 90);

    return { x, y };
  };

  // Haversine distance calculator in KM
  const calculateDistance = (lat1, lon1, lat2 = centerLat, lon2 = centerLng) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat1 - lat2) * Math.PI) / 180;
    const dLon = ((lon1 - lon2) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat2 * Math.PI) / 180) *
        Math.cos((lat1 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Map Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" />
            <h3 className="text-base font-bold text-slate-900">
              Live Proximity Rescue Radar (Lucknow Metro)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial distribution of active food surplus and nearby verified NGO shelters.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Active ({listings.length})
          </button>
          <button
            onClick={() => setFilterType('CRITICAL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔥 Critical
          </button>
          <button
            onClick={() => setFilterType('VEG')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterType === 'VEG'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌱 Veg Only
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        
        {/* Interactive Radar Visual Canvas (2 Cols) */}
        <div className="lg:col-span-2 relative h-[380px] sm:h-[440px] bg-slate-900 overflow-hidden select-none">
          {/* Radar Background Grid & Rings */}
          <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#radarGrid)" />
            {/* Concentric distance rings centered at IET Lucknow */}
            <circle cx="50%" cy="45%" r="18%" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50%" cy="45%" r="35%" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="45%" r="52%" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="5 5" />
          </svg>

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full bg-gradient-to-tr from-transparent via-emerald-500/10 to-emerald-400/30 animate-spin-slow origin-center" />
          </div>

          {/* Area Labels on Map */}
          <div className="absolute top-4 left-6 text-[10px] font-mono uppercase tracking-wider text-emerald-400/60 pointer-events-none">
            Sector F / Jankipuram (IET North Hub)
          </div>
          <div className="absolute top-1/2 left-8 text-[10px] font-mono uppercase tracking-wider text-slate-500 pointer-events-none">
            Aliganj / Kapoorthala
          </div>
          <div className="absolute bottom-6 right-8 text-[10px] font-mono uppercase tracking-wider text-slate-500 pointer-events-none">
            Gomti Nagar / Vibhuti Khand
          </div>
          <div className="absolute bottom-6 left-12 text-[10px] font-mono uppercase tracking-wider text-slate-500 pointer-events-none">
            Hazratganj / Old Lucknow
          </div>

          {/* Range indicators */}
          <div className="absolute bottom-3 right-4 bg-slate-800/80 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-300 border border-slate-700">
            Radius: 10 KM | GPS WGS84
          </div>

          {/* Center Marker: IET Lucknow Anchor */}
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ left: '50%', top: '45%' }}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-75" />
              <div className="absolute w-3 h-3 bg-white border-2 border-emerald-600 rounded-full shadow-lg" />
              <span className="absolute top-4 whitespace-nowrap text-[9px] font-bold text-white bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                🏫 IET Lucknow (Base Hub)
              </span>
            </div>
          </div>

          {/* Interactive Listing Markers */}
          {filteredListings.map((listing, index) => {
            const loc = listing.pickupLocation?.coordinates || listing.pickupLocation || {};
            const lat = loc.latitude || (loc.coordinates && loc.coordinates[1]) || centerLat + (index % 2 === 0 ? 0.02 : -0.03);
            const lng = loc.longitude || (loc.coordinates && loc.coordinates[0]) || centerLng + (index % 2 === 0 ? 0.015 : -0.02);
            const { x, y } = getCoordinates(lat, lng);
            const isSelected = selectedItem?._id === listing._id;
            const isCritical = listing.urgencyLevel === 'CRITICAL' || listing.aiAnalysis?.urgencyScore >= 75;

            return (
              <button
                key={listing._id || index}
                onClick={() => setSelectedItem(listing)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group transition-transform hover:scale-125 focus:outline-none z-20"
                style={{ left: `${x}%`, top: `${y}%` }}
                title={`${listing.title} (${listing.quantity} ${listing.unit})`}
              >
                <div className="relative flex items-center justify-center">
                  {/* Ping effect for critical or selected */}
                  {(isCritical || isSelected) && (
                    <div 
                      className={`absolute w-7 h-7 rounded-full animate-ping opacity-75 ${
                        isCritical ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                    />
                  )}

                  {/* Marker Pin */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-white border-emerald-400 text-slate-900 scale-110 ring-4 ring-emerald-500/30'
                        : isCritical
                        ? 'bg-rose-600 border-white text-white'
                        : 'bg-emerald-600 border-white text-white'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                  </div>

                  {/* Hover Tag */}
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-950/90 text-white text-[10px] px-2 py-1 rounded-md shadow-xl whitespace-nowrap border border-slate-700 pointer-events-none">
                    <span className="font-semibold">{listing.title}</span>
                    <span className="text-emerald-400 font-mono">({listing.quantity} {listing.unit})</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Listing Inspection Panel (1 Col) */}
        <div className="p-5 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-between bg-white">
          {selectedItem ? (
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <UrgencyBadge 
                  level={selectedItem.urgencyLevel} 
                  score={selectedItem.aiAnalysis?.urgencyScore} 
                />
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedItem.foodType || selectedItem.dietaryType || 'VEG'}
                </span>
              </div>

              {/* Title & Organization */}
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedItem.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedItem.organization?.name || selectedItem.donor?.name || 'IET Campus Dining'}</span>
                </p>
              </div>

              {/* Live Ticking Countdown */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Shelf Life Remaining</span>
                  <span className="text-emerald-600 font-semibold">Live Timer</span>
                </div>
                <CountdownTimer 
                  expiryTime={selectedItem.expiryTime} 
                  idealPickupTime={selectedItem.idealPickupTime || selectedItem.pickupWindow?.endTime} 
                />
              </div>

              {/* Key Food Attributes */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <span className="text-slate-500 text-[10px] block">Surplus Quantity</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {selectedItem.quantity} {selectedItem.unit}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-100">
                  <span className="text-slate-500 text-[10px] block">Proximity</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {calculateDistance(
                      selectedItem.pickupLocation?.latitude || 26.9148,
                      selectedItem.pickupLocation?.longitude || 80.9424
                    )} KM away
                  </span>
                </div>
              </div>

              {/* Address / Location snippet */}
              <div className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {selectedItem.pickupLocation?.street || selectedItem.address || 'Sitapur Road, Jankipuram, Lucknow'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs">Click any surplus marker on the radar to inspect details and route.</p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedItem && (
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
              {/* Google Maps Turn-by-Turn Navigation */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${
                  selectedItem.pickupLocation?.latitude || 26.9148
                },${selectedItem.pickupLocation?.longitude || 80.9424}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Navigate via Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {/* Claim Action for NGOs */}
              {onClaim && (
                <button
                  onClick={() => onClaim(selectedItem)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Claim & Dispatch Pickup</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RescueMap;
