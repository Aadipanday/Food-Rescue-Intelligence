import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Filter,
  Clock,
  MapPin,
  Utensils,
  Leaf,
  Droplet,
  Sparkles,
  AlertTriangle,
  Building,
  CheckCircle,
} from "lucide-react";

export default function ListingsView({ openAuthModal, openClaimModal, openCreateModal }) {
  const { user, isNgo, isFoodProvider, organization } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDiet, setSelectedDiet] = useState("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState("ALL");

  const [impactStats, setImpactStats] = useState(null);

  // Fetch listings
  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== "ALL") params.category = selectedCategory;
      if (selectedDiet !== "ALL") params.foodType = selectedDiet;
      if (selectedUrgency !== "ALL") params.urgencyLevel = selectedUrgency;
      if (search) params.search = search;

      const res = await api.get("/api/listings", { params });
      if (res.data?.listings) {
        setListings(res.data.listings);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch platform headline impact
  const fetchImpact = async () => {
    try {
      const res = await api.get("/api/analytics/impact");
      if (res.data?.impact) {
        setImpactStats(res.data.impact);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchListings();
    fetchImpact();
  }, [selectedCategory, selectedDiet, selectedUrgency]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const getUrgencyBadge = (level) => {
    switch (level) {
      case "CRITICAL":
        return <span className="badge badge-urgent-critical"><AlertTriangle size={12} /> Critical Urgency</span>;
      case "HIGH":
        return <span className="badge badge-urgent-high"><Clock size={12} /> High Priority</span>;
      case "MEDIUM":
        return <span className="badge badge-urgent-medium"><Clock size={12} /> Medium</span>;
      default:
        return <span className="badge badge-urgent-low"><CheckCircle size={12} /> Safe Window</span>;
    }
  };

  return (
    <div>
      {/* Hero Banner with Impact Highlights */}
      <section className="hero-banner">
        <div className="container">
          <div style={{ maxWidth: "680px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}
            >
              AI-POWERED SURPLUS RESCUE
            </span>
            <h1 style={{ fontSize: "36px", fontWeight: "800", lineHeight: "1.2" }}>
              Rescuing Surplus Food. Feeding Communities.
            </h1>
            <p style={{ marginTop: "12px", fontSize: "16px", opacity: 0.9 }}>
              Connecting food providers (restaurants, caterers, hotels) with verified NGOs and shelters in real-time with AI-driven matching and carbon offset tracking.
            </p>

            <div className="hero-stats-row">
              <div className="hero-stat-box">
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {impactStats?.totalMealsRescued || "50+"}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.85 }}>Meals Rescued</div>
              </div>

              <div className="hero-stat-box">
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {impactStats?.totalCo2eSavedKg || "50"} kg
                </div>
                <div style={{ fontSize: "12px", opacity: 0.85 }}>CO₂e Landfill Avoided</div>
              </div>

              <div className="hero-stat-box">
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {impactStats?.registeredNgosCount || "10+"}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.85 }}>Verified NGOs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ paddingBottom: "60px" }}>
        {/* Filter & Search Bar */}
        <div
          style={{
            background: "white",
            padding: "16px 20px",
            borderRadius: "16px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)",
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: "1 1 280px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "11px" }} />
              <input
                className="form-input"
                style={{ paddingLeft: "38px" }}
                type="text"
                placeholder="Search food title, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          {/* Filter dropdowns */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="COOKED_MEALS">Cooked Meals</option>
              <option value="BAKERY">Bakery</option>
              <option value="RAW_GROCERY">Raw Grocery</option>
              <option value="FRUITS_VEGETABLES">Fruits/Vegetables</option>
              <option value="DAIRY">Dairy</option>
            </select>

            <select
              className="form-select"
              style={{ width: "auto" }}
              value={selectedDiet}
              onChange={(e) => setSelectedDiet(e.target.value)}
            >
              <option value="ALL">All Diets</option>
              <option value="VEG">Vegetarian</option>
              <option value="NON_VEG">Non-Veg</option>
              <option value="VEGAN">Vegan</option>
            </select>

            <select
              className="form-select"
              style={{ width: "auto" }}
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
            >
              <option value="ALL">All Urgencies</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700" }}>
              Available Food Rescue Postings ({listings.length})
            </h2>
            {isFoodProvider && (
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                + Post Food Listing
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
              Loading food listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "64px 20px" }}>
              <Utensils size={44} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>No Food Listings Found</h3>
              <p style={{ color: "#64748b", marginTop: "6px", fontSize: "14px" }}>
                There are no active food donations matching your filters.
              </p>
              {isFoodProvider && (
                <button className="btn btn-primary" style={{ marginTop: "16px" }} onClick={openCreateModal}>
                  Post the First Food Listing
                </button>
              )}
            </div>
          ) : (
            <div className="grid-listings">
              {listings.map((item) => {
                const expiryDate = new Date(item.expiryTime);
                const hoursLeft = Math.max(
                  0,
                  Math.round(((expiryDate.getTime() - Date.now()) / (1000 * 3600)) * 10) / 10
                );

                return (
                  <div key={item._id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                    {/* Card header */}
                    <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <span className={`badge ${item.foodType === "VEG" ? "badge-veg" : "badge-nonveg"}`}>
                          ● {item.foodType}
                        </span>
                        {getUrgencyBadge(item.urgencyLevel)}
                      </div>

                      <h3 style={{ fontSize: "17px", fontWeight: "700", marginTop: "10px", color: "#0f172a" }}>
                        {item.title}
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                        <Building size={14} />
                        <span>{item.organization?.name || "Verified Provider"}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "14px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                        <span style={{ color: "#64748b" }}>Quantity Available:</span>
                        <strong style={{ fontSize: "16px", color: "#16a34a" }}>
                          {item.quantity} {item.unit}
                        </strong>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569" }}>
                        <Clock size={15} color="#ea580c" />
                        <span>
                          Best before: <strong>{hoursLeft} hrs remaining</strong>
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569" }}>
                        <MapPin size={15} color="#0284c7" />
                        <span>
                          {item.pickupLocation?.city || "Local City"}, {item.pickupLocation?.street || "Verified Address"}
                        </span>
                      </div>

                      {/* AI Impact pill */}
                      {item.aiAnalysis && (
                        <div
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #dcfce7",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "#166534",
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "6px",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Leaf size={13} /> {item.aiAnalysis.co2eSavedKg} kg CO₂ saved
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Droplet size={13} /> {item.aiAnalysis.waterSavedLiters} L water
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer / Action */}
                    <div style={{ padding: "12px 20px 18px", borderTop: "1px solid #f1f5f9" }}>
                      {user ? (
                        <button
                          className="btn btn-primary"
                          style={{ width: "100%" }}
                          onClick={() => openClaimModal(item)}
                        >
                          Claim for Rescue
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline"
                          style={{ width: "100%" }}
                          onClick={openAuthModal}
                        >
                          Sign In to Claim
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
