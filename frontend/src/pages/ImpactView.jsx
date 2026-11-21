import React, { useState, useEffect } from "react";
import api from "../api";
import { Leaf, Droplet, Users, ShieldCheck, Heart, Award, ArrowUpRight } from "lucide-react";

export default function ImpactView() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/analytics/impact")
      .then((res) => {
        if (res.data?.impact) setImpact(res.data.impact);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ padding: "40px 20px 80px" }}>
      <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 36px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            marginBottom: "12px",
          }}
        >
          REAL-TIME SUSTAINABILITY INDEX
        </span>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a" }}>
          Platform Environmental & Social Impact
        </h1>
        <p style={{ color: "#64748b", marginTop: "8px", fontSize: "16px" }}>
          Every meal rescued diverts organic waste from methane-emitting landfills and conserves precious freshwater resources.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
          Loading real-time platform impact...
        </div>
      ) : (
        <>
          {/* Main 4 Metric Cards */}
          <div className="grid-stats">
            {/* Meals */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Meals Rescued</span>
                <div style={{ background: "#dcfce7", color: "#16a34a", padding: "8px", borderRadius: "8px" }}>
                  <Users size={20} />
                </div>
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginTop: "12px" }}>
                {impact?.totalMealsRescued?.toLocaleString() || "0"}
              </div>
              <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600", marginTop: "6px" }}>
                Direct human hunger relief
              </div>
            </div>

            {/* CO2 Saved */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>CO₂e Landfill Avoided</span>
                <div style={{ background: "#dcfce7", color: "#16a34a", padding: "8px", borderRadius: "8px" }}>
                  <Leaf size={20} />
                </div>
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginTop: "12px" }}>
                {impact?.totalCo2eSavedKg?.toLocaleString() || "0"} <span style={{ fontSize: "16px" }}>kg</span>
              </div>
              <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600", marginTop: "6px" }}>
                ≈ {impact?.totalCo2eSavedTonnes || "0"} Metric Tonnes CO₂
              </div>
            </div>

            {/* Water Saved */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Water Conserved</span>
                <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "8px", borderRadius: "8px" }}>
                  <Droplet size={20} />
                </div>
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginTop: "12px" }}>
                {impact?.totalWaterSavedLiters?.toLocaleString() || "0"} <span style={{ fontSize: "16px" }}>L</span>
              </div>
              <div style={{ fontSize: "13px", color: "#0284c7", fontWeight: "600", marginTop: "6px" }}>
                Embedded agricultural water
              </div>
            </div>

            {/* Rescues Completed */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Completed Missions</span>
                <div style={{ background: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "8px" }}>
                  <Award size={20} />
                </div>
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginTop: "12px" }}>
                {impact?.completedRescuesCount || "0"}
              </div>
              <div style={{ fontSize: "13px", color: "#d97706", fontWeight: "600", marginTop: "6px" }}>
                Secure OTP verified rescues
              </div>
            </div>
          </div>

          {/* Network Scale */}
          <div
            className="card"
            style={{
              marginTop: "32px",
              padding: "32px",
              background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
              color: "white",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "800" }}>Active Rescue Network</h2>
            <p style={{ opacity: 0.9, marginTop: "6px", maxWidth: "600px", fontSize: "14px" }}>
              Empowering local food providers and NGOs to eliminate zero-waste gaps and build climate resilience.
            </p>

            <div style={{ display: "flex", gap: "36px", marginTop: "24px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "36px", fontWeight: "800" }}>
                  {impact?.registeredFoodProvidersCount || "1"}
                </div>
                <div style={{ fontSize: "13px", opacity: "0.85" }}>Registered Food Providers</div>
              </div>

              <div>
                <div style={{ fontSize: "36px", fontWeight: "800" }}>
                  {impact?.registeredNgosCount || "1"}
                </div>
                <div style={{ fontSize: "13px", opacity: "0.85" }}>Partnered Charities & NGOs</div>
              </div>

              <div>
                <div style={{ fontSize: "36px", fontWeight: "800" }}>
                  {impact?.activeListingsCount || "0"}
                </div>
                <div style={{ fontSize: "13px", opacity: "0.85" }}>Live Surplus Available Now</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
