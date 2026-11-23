import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Sparkles, MapPin, Phone, Building2, ShieldCheck, Loader2, X, Navigation } from 'lucide-react';

const AiRecommendationsModal = ({ listing, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!listing?._id) return;
      try {
        setLoading(true);
        const res = await api.get(`/ai/recommend-ngos/${listing._id}`);
        if (res.data?.success && Array.isArray(res.data?.recommendations)) {
          setRecommendations(res.data.recommendations);
        }
      } catch (err) {
        setError('Could not compute AI match rankings.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [listing]);

  if (!listing) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>AI Weighted Matchmaking Engine</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Optimal Shelters for "{listing.title}"
            </h3>
            <p className="text-xs text-slate-500">
              Ranked using: Match Score = (0.55 × Proximity) + (0.35 × Capacity) + (0.10 × Verification)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Calculating Haversine distance matrix and shelter intake capacity...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
            {error}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No nearby NGOs found in Lucknow registry.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.ngoId || idx}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{rec.name}</h4>
                    {rec.verificationStatus === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Verified NGO
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-snug">
                    {rec.matchReason}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    {rec.distanceKm !== null && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        {rec.distanceKm} km away
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Capacity: {rec.capacityPerDay} meals/day
                    </span>
                    {rec.phone && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {rec.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="inline-block sm:block px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-mono font-bold text-sm text-center shadow-sm">
                    {rec.matchScore}% Match
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Compatibility Index
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Close Recommendations
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiRecommendationsModal;
