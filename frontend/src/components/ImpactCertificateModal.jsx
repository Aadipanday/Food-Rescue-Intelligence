import React from 'react';
import { Award, ShieldCheck, Printer, X, Sparkles, HeartHandshake, Leaf, Droplet } from 'lucide-react';

const ImpactCertificateModal = ({ listing, onClose }) => {
  if (!listing) return null;

  const handlePrint = () => {
    window.print();
  };

  const donorName = listing.organization?.name || listing.donor?.name || 'Verified Food Provider';
  const ngoName = listing.claimedBy?.organization?.name || 'Community Shelter & Orphanage';
  const meals = listing.servingsEstimated || Math.round(listing.quantity * 2.5);
  const co2 = (listing.quantity * 2.5).toFixed(1);
  const water = listing.quantity * 1000;
  const certificateId = `FRI-${listing._id ? listing._id.slice(-8).toUpperCase() : '2026-CERT'}`;
  const completionDate = listing.claimedBy?.claimedAt
    ? new Date(listing.claimedBy.claimedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative space-y-6 my-8 animate-in fade-in zoom-in-95 border-4 border-emerald-500/30">
        
        {/* Modal Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2 text-emerald-700">
            <Award className="w-5 h-5" />
            <span className="font-bold text-sm">Official AnnaSetu Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="border-2 border-emerald-600/40 rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 text-center space-y-6 relative overflow-hidden">
          
          {/* Watermark Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
            <HeartHandshake className="w-96 h-96 text-emerald-900" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-widest font-mono text-emerald-800 uppercase font-bold">
              Certificate of Verified Food Rescue & Redistribution
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AnnaSetu Intelligence
            </h2>
            <p className="text-xs text-slate-500">IET Lucknow CSE Group No. 15 • Zero Waste Protocol</p>
          </div>

          <div className="py-2">
            <p className="text-xs text-slate-600 italic">This certifies that on {completionDate}, a total of</p>
            <div className="my-3 inline-block px-6 py-2 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl font-mono shadow-md shadow-emerald-600/20">
              {listing.quantity} {listing.unit} (~{meals} Nutritious Meals)
            </div>
            <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
              of freshly prepared surplus food (<strong>{listing.title}</strong>) was successfully rescued from 
              {' '}<strong>{donorName}</strong> and safely delivered to <strong>{ngoName}</strong> for vulnerable community members.
            </p>
          </div>

          {/* Environmental Savings Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
            <div className="p-3 bg-white/90 border border-emerald-200 rounded-xl flex items-center gap-3 text-left">
              <Leaf className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Carbon Mitigated</p>
                <strong className="text-sm font-bold text-slate-800 font-mono">~{co2} kg CO₂e</strong>
              </div>
            </div>
            <div className="p-3 bg-white/90 border border-teal-200 rounded-xl flex items-center gap-3 text-left">
              <Droplet className="w-6 h-6 text-teal-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Water Conserved</p>
                <strong className="text-sm font-bold text-slate-800 font-mono">~{water.toLocaleString()} L</strong>
              </div>
            </div>
          </div>

          {/* Verification Stamps */}
          <div className="pt-6 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">Digital Handshake Protocol</p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>VERIFIED VIA OTP: {listing.handoverOtp || '7492'}</span>
              </div>
            </div>

            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-400 block text-[9px]">Certificate Ref Number</span>
              <strong className="text-slate-800 font-bold">{certificateId}</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ImpactCertificateModal;
