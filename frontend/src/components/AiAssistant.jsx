import React, { useState } from "react";
import api from "../api";
import { Sparkles, Leaf, Droplet, Users, ShieldAlert, Cpu } from "lucide-react";

export default function AiAssistant() {
  const [category, setCategory] = useState("COOKED_MEALS");
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("MEALS");
  const [storage, setStorage] = useState("ROOM_TEMPERATURE");
  const [hoursRemaining, setHoursRemaining] = useState(3);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expiry = new Date(Date.now() + Number(hoursRemaining) * 3600 * 1000);
      const res = await api.post("/api/ai/analyze", {
        category,
        quantity: Number(quantity),
        unit,
        storageCondition: storage,
        expiryTime: expiry.toISOString(),
      });

      if (res.data?.analysis) {
        setResult(res.data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "32px 20px" }}>
      <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#fef9c3",
            color: "#a16207",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "12px",
          }}
        >
          <Sparkles size={16} /> FoodRescue Intelligence AI Engine
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
          AI Urgency & Carbon Impact Predictor
        </h1>
        <p style={{ color: "#64748b", marginTop: "8px", fontSize: "15px" }}>
          Simulate how our machine intelligence algorithms evaluate surplus food perishability, priority ranking, and environmental savings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", maxWidth: "1000px", margin: "0 auto" }}>
        {/* Form Card */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={18} color="#16a34a" /> Enter Food Attributes
          </h3>

          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label">Food Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="COOKED_MEALS">Cooked Meals / Buffet</option>
                <option value="BAKERY">Bakery & Breads</option>
                <option value="RAW_GROCERY">Raw Grocery / Staples</option>
                <option value="DAIRY">Dairy & Milk Products</option>
                <option value="FRUITS_VEGETABLES">Fruits & Vegetables</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="MEALS">Meals</option>
                  <option value="KG">Kilograms (kg)</option>
                  <option value="PACKETS">Packets</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Storage Condition</label>
              <select className="form-select" value={storage} onChange={(e) => setStorage(e.target.value)}>
                <option value="ROOM_TEMPERATURE">Room Temperature (Ambient)</option>
                <option value="REFRIGERATED">Refrigerated (Chilled &lt; 4°C)</option>
                <option value="FROZEN">Frozen</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Hours Remaining to Expiry</label>
              <input
                className="form-input"
                type="range"
                min="0.5"
                max="24"
                step="0.5"
                value={hoursRemaining}
                onChange={(e) => setHoursRemaining(e.target.value)}
              />
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#16a34a", marginTop: "4px" }}>
                {hoursRemaining} Hours
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Analyzing with AI..." : "Run AI Prediction"}
            </button>
          </form>
        </div>

        {/* Prediction Results Card */}
        <div className="card" style={{ padding: "24px", background: result ? "#ffffff" : "#f8fafc" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="#eab308" /> AI Analysis Output
          </h3>

          {result ? (
            <div>
              {/* Urgency Badge & Score */}
              <div style={{ padding: "16px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Urgency Priority</span>
                  <span className={`badge badge-urgent-${result.urgencyLevel?.toLowerCase()}`} style={{ fontSize: "13px" }}>
                    {result.urgencyLevel} PRIORITY
                  </span>
                </div>
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Urgency Score</span>
                    <strong>{result.urgencyScore} / 100</strong>
                  </div>
                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${result.urgencyScore}%`,
                        background: result.urgencyScore > 75 ? "#ef4444" : result.urgencyScore > 40 ? "#f59e0b" : "#16a34a",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Impact stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontSize: "12px", fontWeight: "600" }}>
                    <Users size={14} /> Estimated People Fed
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
                    {result.estimatedMeals}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontSize: "12px", fontWeight: "600" }}>
                    <Leaf size={14} /> CO₂e Landfill Avoided
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                    {result.co2eSavedKg} kg
                  </div>
                </div>
              </div>

              <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: "10px", border: "1px solid #bae6fd", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0369a1", fontSize: "12px", fontWeight: "600" }}>
                  <Droplet size={14} /> Agricultural Water Conserved
                </div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#0284c7", marginTop: "4px" }}>
                  {result.waterSavedLiters?.toLocaleString()} Liters
                </div>
              </div>

              <div style={{ fontSize: "13px", color: "#334155", background: "#f1f5f9", padding: "12px", borderRadius: "8px" }}>
                <strong>Safety & Redistribution Directive:</strong>
                <p style={{ marginTop: "4px", color: "#475569" }}>{result.safetyRecommendation}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
              <Cpu size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p>Adjust parameters on the left and click "Run AI Prediction" to see intelligence output.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
