import React, { useState } from "react";
import api from "../api";
import { X, CheckCircle, ShieldCheck } from "lucide-react";

export default function HandoverModal({ listing, isOpen, onClose, onVerified }) {
  const [handoverOtp, setHandoverOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [impactResult, setImpactResult] = useState(null);

  if (!isOpen || !listing) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post(`/api/listings/${listing._id}/verify-handover`, {
        handoverOtp,
      });

      if (res.data?.success) {
        setImpactResult(res.data.impact);
        if (onVerified) onVerified(res.data.listing);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Handover OTP code");
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

        {!impactResult ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <ShieldCheck size={26} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Verify Handover Code</h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Ask the NGO representative for the 6-digit verification code to complete pickup.
              </p>
            </div>

            {error && (
              <div style={{ padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label">6-Digit Handover Code</label>
                <input
                  className="form-input"
                  type="text"
                  maxLength={6}
                  placeholder="355115"
                  value={handoverOtp}
                  onChange={(e) => setHandoverOtp(e.target.value)}
                  style={{
                    fontSize: "24px",
                    letterSpacing: "8px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Complete Rescue"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <CheckCircle size={54} color="#16a34a" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#166534" }}>
              Food Rescue Completed!
            </h2>
            <p style={{ fontSize: "14px", color: "#475569", marginTop: "4px" }}>
              The food has been safely handed over to the NGO.
            </p>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "16px",
                margin: "18px 0",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#166534" }}>
                Verified Rescue Impact:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <div style={{ background: "white", padding: "10px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>
                    {impactResult.mealsDelivered || impactResult.estimatedMeals || listing.quantity}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Meals Rescued</div>
                </div>
                <div style={{ background: "white", padding: "10px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669" }}>
                    {impactResult.co2DivertedKg || impactResult.co2eSavedKg || 0} kg
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>CO₂e Prevented</div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
