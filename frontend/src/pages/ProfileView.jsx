import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import {
  Mail,
  Phone,
  Building2,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Edit3,
  Save,
  LogOut,
  MapPin,
} from "lucide-react";

export default function ProfileView({ openOrgModal, openLogoutModal }) {
  const { user, role, organization, isFoodProvider, isNgo, fetchMe } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await api.put("/api/auth/profile", { name, phone });
      if (res.data?.success) {
        setSuccessMsg("Profile updated successfully!");
        setIsEditing(false);
        await fetchMe();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (str) => {
    if (!str) return "A";
    return str
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container" style={{ padding: "36px 20px 80px", maxWidth: "960px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
          My Account & Profile
        </h1>
        <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
          Manage your personal details, verified organization, and security preferences on Anansetu.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            padding: "12px 16px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "10px",
            fontSize: "14px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "10px",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", alignItems: "start" }}>
        {/* Left Column: User Card & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main User Card */}
          <div className="card" style={{ padding: "28px", textAlign: "center" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
                color: "white",
                fontSize: "28px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 8px 16px -4px rgba(22, 163, 74, 0.3)",
              }}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
              {user?.name || "Anansetu User"}
            </h2>

            <div style={{ margin: "8px 0 16px" }}>
              <span
                className="badge"
                style={{
                  background: isFoodProvider ? "#f0fdf4" : "#fef2f2",
                  color: isFoodProvider ? "#166534" : "#991b1b",
                  border: `1px solid ${isFoodProvider ? "#bbf7d0" : "#fecaca"}`,
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {isFoodProvider ? "Food Provider / Donor" : isNgo ? "NGO / Charity Receiver" : "Registered User"}
              </span>
            </div>

            <div
              style={{
                borderTop: "1px solid #f1f5f9",
                paddingTop: "16px",
                textAlign: "left",
                fontSize: "13px",
                color: "#475569",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={15} color="#64748b" />
                <span style={{ wordBreak: "break-all" }}>{user?.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={15} color="#64748b" />
                <span>{user?.phone || "No phone added"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={15} color="#64748b" />
                <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "2026"}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                className="btn btn-outline"
                style={{ width: "100%", fontSize: "13px" }}
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 size={15} />
                <span>{isEditing ? "Close Edit Mode" : "Edit Personal Info"}</span>
              </button>
            </div>
          </div>

          {/* Account Security Card */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
              Account Security
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Email Status:</span>
                <span style={{ color: "#16a34a", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={16} /> Verified
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Login Protection:</span>
                <span style={{ color: "#0284c7", fontWeight: "600" }}>2-Step OTP Enabled</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Google Account:</span>
                <span style={{ color: user?.googleId ? "#16a34a" : "#64748b", fontWeight: "600" }}>
                  {user?.googleId ? "Linked" : "Not Linked"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
              <button
                className="btn btn-danger"
                style={{ width: "100%", fontSize: "13px" }}
                onClick={openLogoutModal}
              >
                <LogOut size={15} />
                <span>Sign Out of Anansetu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Organization Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Edit Profile Form */}
          {isEditing && (
            <div className="card" style={{ padding: "24px", border: "2px solid #16a34a" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
                Edit Personal Information
              </h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Read-only)</label>
                  <input
                    className="form-input"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    style={{ background: "#f8fafc", cursor: "not-allowed", color: "#64748b" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={16} />
                    <span>{loading ? "Saving..." : "Save Changes"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Organization Profile Details */}
          <div className="card" style={{ padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#f0fdf4",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isNgo ? <Heart size={22} /> : <Building2 size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                    Registered Organization
                  </h3>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    {organization ? "Active rescue entity on Anansetu" : "No organization registered yet"}
                  </div>
                </div>
              </div>

              {organization && (
                <span className="badge badge-urgent-low" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={13} /> Active
                </span>
              )}
            </div>

            {organization ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Organization Name</div>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{organization.name}</strong>
                  </div>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Category</div>
                    <strong style={{ fontSize: "15px", color: "#16a34a" }}>
                      {organization.type === "FOOD_PROVIDER" ? "Food Provider (Donor)" : "NGO (Charity Receiver)"}
                    </strong>
                  </div>
                </div>

                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Operating Location</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", color: "#334155" }}>
                    <MapPin size={15} color="#0284c7" />
                    <span>
                      {organization.address?.street || ""}, {organization.address?.city || ""}{" "}
                      {organization.address?.pincode ? `(${organization.address.pincode})` : ""}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Official Contact Phone</div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                      {organization.phone || user?.phone || "N/A"}
                    </strong>
                  </div>
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Daily Capacity</div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                      {organization.capacityPerDay || 100} Meals/day
                    </strong>
                  </div>
                </div>

                {organization.description && (
                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>About Organization</div>
                    <p style={{ marginTop: "4px", color: "#475569", fontSize: "13px" }}>
                      {organization.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px" }}>
                  Register your NGO or food business to unlock food rescue posting and claiming capabilities.
                </p>
                <button className="btn btn-primary" onClick={openOrgModal}>
                  <Building2 size={16} />
                  <span>Register Organization Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
