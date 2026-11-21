import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Utensils,
  HeartHandshake,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Building,
} from "lucide-react";

export default function DashboardView({ openCreateModal, openHandoverModal }) {
  const { user, isFoodProvider, isNgo, organization } = useAuth();

  const [activeTab, setActiveTab] = useState(isFoodProvider ? "listings" : "claims");
  const [myListings, setMyListings] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [incomingClaims, setIncomingClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isFoodProvider) {
        const [listingsRes, claimsRes] = await Promise.all([
          api.get("/api/listings/my").catch(() => ({ data: {} })),
          api.get("/api/claims/incoming").catch(() => ({ data: {} })),
        ]);
        if (listingsRes.data?.listings) setMyListings(listingsRes.data.listings);
        if (claimsRes.data?.claims) setIncomingClaims(claimsRes.data.claims);
      } else {
        const claimsRes = await api.get("/api/claims/my").catch(() => ({ data: {} }));
        if (claimsRes.data?.claims) setMyClaims(claimsRes.data.claims);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isFoodProvider]);

  return (
    <div className="container" style={{ padding: "32px 20px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>
            {isFoodProvider ? "Food Provider Dashboard" : "NGO Rescue Dashboard"}
          </h1>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
            Managing organization: <strong>{organization?.name || "Personal Account"}</strong>
          </p>
        </div>

        {isFoodProvider && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Post New Food Donation
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
        {isFoodProvider ? (
          <>
            <button
              className={`btn ${activeTab === "listings" ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => setActiveTab("listings")}
            >
              My Food Postings ({myListings.length})
            </button>
            <button
              className={`btn ${activeTab === "incoming" ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => setActiveTab("incoming")}
            >
              Incoming NGO Claims ({incomingClaims.length})
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab("claims")}
          >
            My Claimed Rescues ({myClaims.length})
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
          Loading dashboard data...
        </div>
      ) : isFoodProvider ? (
        /* PROVIDER VIEW */
        activeTab === "listings" ? (
          myListings.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
              <Utensils size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <h3>No Food Listings Posted Yet</h3>
              <p style={{ color: "#64748b", marginTop: "6px" }}>Post your surplus food to start rescuing meals.</p>
              <button className="btn btn-primary" style={{ marginTop: "16px" }} onClick={openCreateModal}>
                Post Food Listing
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {myListings.map((listing) => (
                <div key={listing._id} className="card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={`badge ${listing.status === "COMPLETED" ? "badge-urgent-low" : listing.status === "CLAIMED" ? "badge-urgent-high" : "badge-provider"}`}>
                          {listing.status}
                        </span>
                        <span className="badge badge-veg">{listing.foodType}</span>
                      </div>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", marginTop: "8px" }}>
                        {listing.title}
                      </h3>
                      <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                        Quantity: <strong>{listing.quantity} {listing.unit}</strong> | Best before: {new Date(listing.expiryTime).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      {listing.status === "CLAIMED" && (
                        <button
                          className="btn btn-primary"
                          onClick={() => openHandoverModal(listing)}
                        >
                          <ShieldCheck size={16} />
                          <span>Verify Handover Code</span>
                        </button>
                      )}
                      {listing.status === "COMPLETED" && (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: "600", fontSize: "14px" }}>
                          <CheckCircle size={18} /> Rescue Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {listing.status === "CLAIMED" && listing.claimedBy && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px 16px",
                        background: "#fffbeb",
                        border: "1px solid #fef3c7",
                        borderRadius: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <strong style={{ color: "#b45309" }}>Claimed by:</strong> {listing.claimedBy.organization?.name || "Verified NGO Partner"}
                      <div style={{ color: "#78350f", marginTop: "2px" }}>
                        Estimated arrival: {new Date(listing.claimedBy.pickupEta).toLocaleTimeString()} | Beneficiaries: {listing.claimedBy.beneficiariesTarget} people
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Incoming Claims list */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {incomingClaims.map((claim) => (
              <div key={claim._id} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700" }}>{claim.listing?.title}</h3>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                      NGO: <strong>{claim.recipientOrganization?.name}</strong> | Contact: {claim.recipientUser?.phone}
                    </div>
                  </div>
                  <span className="badge badge-urgent-high">{claim.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* NGO CLAIMS VIEW */
        myClaims.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
            <HeartHandshake size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
            <h3>No Food Rescues Claimed Yet</h3>
            <p style={{ color: "#64748b", marginTop: "6px" }}>Browse the listings feed and claim available food for your charity.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {myClaims.map((claim) => (
              <div key={claim._id} className="card" style={{ padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span className={`badge ${claim.status === "COMPLETED" ? "badge-urgent-low" : "badge-urgent-high"}`}>
                      {claim.status}
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginTop: "8px" }}>
                      {claim.listing?.title || "Food Rescue Donation"}
                    </h3>
                    <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                      Donor: <strong>{claim.donorOrganization?.name || "Verified Provider"}</strong> | Contact: {claim.donorOrganization?.phone}
                    </div>
                  </div>

                  {/* Show Handover code */}
                  {claim.status !== "COMPLETED" && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Handover Code (Give to Donor):</div>
                      <div
                        style={{
                          fontSize: "26px",
                          fontWeight: "800",
                          letterSpacing: "4px",
                          color: "#16a34a",
                          background: "#f0fdf4",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "1px dashed #16a34a",
                          marginTop: "4px",
                        }}
                      >
                        {claim.handoverOtp}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "14px", fontSize: "13px", color: "#475569" }}>
                  📍 <strong>Pickup Address:</strong> {claim.donorOrganization?.address?.street}, {claim.donorOrganization?.address?.city}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
