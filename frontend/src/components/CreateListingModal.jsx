import React, { useState, useEffect } from "react";
import api from "../api";
import { X, Sparkles, AlertTriangle, Leaf, Droplet, Clock } from "lucide-react";

export default function CreateListingModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("COOKED_MEALS");
  const [foodType, setFoodType] = useState("VEG");
  const [quantity, setQuantity] = useState(50);
  const [unit, setUnit] = useState("MEALS");
  const [storageCondition, setStorageCondition] = useState("REFRIGERATED");
  const [hoursUntilExpiry, setHoursUntilExpiry] = useState(4);
  const [contactPhone, setContactPhone] = useState("");

  const [aiPreview, setAiPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live preview AI calculation whenever food params change
  useEffect(() => {
    if (quantity && hoursUntilExpiry) {
      const expiry = new Date(Date.now() + Number(hoursUntilExpiry) * 3600 * 1000);
      api
        .post("/api/ai/analyze", {
          category,
          foodType,
          quantity: Number(quantity),
          unit,
          storageCondition,
          expiryTime: expiry.toISOString(),
        })
        .then((res) => {
          if (res.data?.analysis) {
            setAiPreview(res.data.analysis);
          }
        })
        .catch(() => {});
    }
  }, [category, foodType, quantity, unit, storageCondition, hoursUntilExpiry]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const expiryDate = new Date(Date.now() + Number(hoursUntilExpiry) * 3600 * 1000);

      const res = await api.post("/api/listings", {
        title,
        description,
        category,
        foodType,
        quantity: Number(quantity),
        unit,
        storageCondition,
        expiryTime: expiryDate.toISOString(),
        contactPhone,
      });

      if (res.data?.success) {
        if (onCreated) onCreated(res.data.listing);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create food listing");
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

        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Post Surplus Food for Rescue</h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            List available food to notify nearby NGOs and prevent waste
          </p>
        </div>

        {error && (
          <div style={{ padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Food Title</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. 50 Packed Dal Makhani & Roti Meals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Food Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="COOKED_MEALS">Cooked Meals</option>
                <option value="BAKERY">Bakery & Bread</option>
                <option value="RAW_GROCERY">Raw Grocery / Grains</option>
                <option value="FRUITS_VEGETABLES">Fruits & Vegetables</option>
                <option value="DAIRY">Dairy Products</option>
                <option value="PACKAGED_FOOD">Packaged Goods</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Type</label>
              <select className="form-select" value={foodType} onChange={(e) => setFoodType(e.target.value)}>
                <option value="VEG">Vegetarian (Veg)</option>
                <option value="NON_VEG">Non-Vegetarian</option>
                <option value="VEGAN">Vegan</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="MEALS">Meals / Portions</option>
                <option value="KG">Kilograms (kg)</option>
                <option value="PACKETS">Packets / Boxes</option>
                <option value="LITERS">Liters</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Storage Condition</label>
              <select className="form-select" value={storageCondition} onChange={(e) => setStorageCondition(e.target.value)}>
                <option value="ROOM_TEMPERATURE">Room Temperature</option>
                <option value="REFRIGERATED">Refrigerated (Chilled)</option>
                <option value="FROZEN">Frozen</option>
                <option value="HEATED">Heated / Hot</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Safe to Consume For (Hours)</label>
              <input
                className="form-input"
                type="number"
                step="0.5"
                min="0.5"
                max="72"
                value={hoursUntilExpiry}
                onChange={(e) => setHoursUntilExpiry(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Instructions</label>
            <input
              className="form-input"
              type="text"
              placeholder="Freshly cooked at 8 PM, neatly boxed in containers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* AI Intelligence Live Preview Box */}
          {aiPreview && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "14px",
                margin: "12px 0 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: "700", fontSize: "13px" }}>
                <Sparkles size={16} color="#16a34a" />
                <span>AI Urgency & Impact Analysis</span>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                <span className={`badge badge-urgent-${aiPreview.urgencyLevel?.toLowerCase()}`}>
                  <AlertTriangle size={12} /> Urgency: {aiPreview.urgencyLevel}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#047857" }}>
                  <Leaf size={14} /> {aiPreview.co2eSavedKg} kg CO₂ Saved
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0284c7" }}>
                  <Droplet size={14} /> {aiPreview.waterSavedLiters} L Water Saved
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>
                <strong>Safety Guideline:</strong> {aiPreview.safetyRecommendation}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Publishing Listing..." : "Publish Food Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
