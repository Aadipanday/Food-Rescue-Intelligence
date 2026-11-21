import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { X, Building2, MapPin, CheckCircle } from "lucide-react";

export default function OrgModal({ isOpen, onClose }) {
  const { user, fetchMe } = useAuth();

  const [name, setName] = useState("");
  const [type, setType] = useState(
    (user?.role || "").toUpperCase() === "NGO" ? "NGO" : "FOOD_PROVIDER"
  );
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Delhi");
  const [state, setState] = useState("Delhi");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [capacityPerDay, setCapacityPerDay] = useState(100);
  const [lat, setLat] = useState(28.6139);
  const [lon, setLon] = useState(77.2090);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Math.round(pos.coords.latitude * 10000) / 10000);
          setLon(Math.round(pos.coords.longitude * 10000) / 10000);
        },
        (err) => {
          console.warn("Geolocation denied or unavailable:", err.message);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/organizations/register", {
        name,
        type,
        description,
        address: { street, city, state, pincode },
        location: { latitude: Number(lat), longitude: Number(lon) },
        phone,
        capacityPerDay: Number(capacityPerDay),
      });

      if (res.data?.success) {
        setSuccess(true);
        await fetchMe();
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register organization");
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
            <Building2 size={24} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Register Organization</h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Set up your organization profile to begin food rescue activities
          </p>
        </div>

        {error && (
          <div style={{ padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircle size={48} color="#16a34a" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#16a34a" }}>
              Organization Registered!
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              Your profile is now active and ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Organization Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="FOOD_PROVIDER">Food Provider (Restaurant, Caterer, Hotel, Store)</option>
                <option value="NGO">NGO (Charity, Food Bank, Shelter, Community Kitchen)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Robin Hood Army / Marriott Hotel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">About / Description</label>
              <input
                className="form-input"
                type="text"
                placeholder="Brief description of operations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="110001" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input className="form-input" type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Building, Area, Landmark" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Daily Capacity (Meals/day)</label>
                <input className="form-input" type="number" min="1" value={capacityPerDay} onChange={(e) => setCapacityPerDay(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 16px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Location: {lat}, {lon}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleGetLocation}>
                <MapPin size={14} />
                <span>Use Current GPS</span>
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Registering..." : "Submit Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
