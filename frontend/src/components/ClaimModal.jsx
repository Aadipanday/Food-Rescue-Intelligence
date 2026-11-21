import React, { useState } from "react";
import api from "../api";
import { X, ShieldCheck, CheckCircle2, Clock, Users } from "lucide-react";

export default function ClaimModal({ listing, isOpen, onClose, onClaimed }) {
  const [beneficiaries, setBeneficiaries] = useState(
    listing?.servingsEstimated || listing?.quantity || 25
  );
  const [pickupMins, setPickupMins] = useState(45);
  const [notes, setNotes] = useState("");
  const [handoverOtp, setHandoverOtp] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !listing) return null;

  const handleClaim = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const eta = new Date(Date.now() + Number(pickupMins) * 60 * 1000);

      const res = await api.post(`/api/listings/${listing._id}/claim`, {
        beneficiariesTarget: Number(beneficiaries),
        pickupEta: eta.toISOString(),
        pickupNotes: notes,
      });

      if (res.data?.success) {
        setHandoverOtp(res.data.handoverOtp);
        if (onClaimed) onClaimed(res.data.listing);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to claim listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {!handoverOtp ? (
          <>
            <div style={{ marginBottom: "18px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Claim Food for Distribution</h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Claiming: <strong>{listing.title}</strong> ({listing.quantity} {listing.unit})
              </p>
            </div>

            {error && (
              <div style={{ padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleClaim}>
              <div className="form-group">
                <label className="form-label">Beneficiaries to Feed (Count)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Pickup Arrival (Minutes)</label>
                <select className="form-select" value={pickupMins} onChange={(e) => setPickupMins(e.target.value)}>
                  <option value={30}>Within 30 minutes</option>
                  <option value={45}>Within 45 minutes</option>
                  <option value={60}>Within 1 hour</option>
                  <option value={90}>Within 1.5 hours</option>
                  <option value={120}>Within 2 hours</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Vehicle / Volunteer Note</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. NGO Van DL-01-AB-1234, Rahul driving"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div
                style={{
                  background: "#f1f5f9",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#475569",
                  marginBottom: "16px",
                }}
              >
                📍 <strong>Pickup Location:</strong> {listing.pickupLocation?.street || ""}, {listing.pickupLocation?.city}
                <br />
                📞 <strong>Provider Contact:</strong> {listing.contactPhone || listing.donor?.phone || "Available upon claim"}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Confirming Claim..." : "Confirm & Get Handover Code"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircle2 size={54} color="#16a34a" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#166534" }}>
              Listing Claimed Successfully!
            </h2>
            <p style={{ fontSize: "14px", color: "#475569", marginTop: "6px" }}>
              Share this secure verification code with the Food Provider when collecting:
            </p>

            <div className="otp-display">
              {handoverOtp}
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "13px",
                textAlign: "left",
                margin: "16px 0",
              }}
            >
              <div><strong>Donor:</strong> {listing.donor?.name || "Food Provider"}</div>
              <div><strong>Phone:</strong> {listing.contactPhone || "Check claim details"}</div>
              <div><strong>Address:</strong> {listing.pickupLocation?.street}, {listing.pickupLocation?.city}</div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={onClose}>
              Done / View My Claims
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
