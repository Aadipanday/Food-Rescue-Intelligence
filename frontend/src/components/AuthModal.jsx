import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Mail, Lock, Phone, User, Building, Heart, CheckCircle2 } from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, verifyEmailOtp, resendOtp } = useAuth();

  const [mode, setMode] = useState("LOGIN"); // "LOGIN" | "REGISTER" | "OTP"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("FOOD_PROVIDER");
  const [otp, setOtp] = useState("");

  if (!isOpen) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await register({ name, email, password, phone, role });
      setSuccessMsg(res.message || "OTP sent to your email!");
      setMode("OTP");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.requiresEmailVerification || res.requiresOtp) {
        setSuccessMsg(res.message || "Please enter the OTP sent to your email.");
        setMode("OTP");
      } else {
        onClose();
      }
    } catch (err) {
      if (err.response?.data?.requiresEmailVerification) {
        setSuccessMsg("Account unverified. A new OTP has been sent to your email.");
        setMode("OTP");
      } else {
        setError(err.response?.data?.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyEmailOtp(otp);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccessMsg("");
    try {
      await resendOtp(email);
      setSuccessMsg("A fresh OTP has been sent to your email!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>
            {mode === "LOGIN"
              ? "Welcome Back"
              : mode === "REGISTER"
              ? "Join FoodRescue Intelligence"
              : "Verify Your Email"}
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
            {mode === "LOGIN"
              ? "Sign in to manage your food donations or rescue missions"
              : mode === "REGISTER"
              ? "Select your role to rescue surplus food or receive donations"
              : `Enter the 6-digit OTP code sent to ${email || "your email"}`}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* Mode: REGISTER */}
        {mode === "REGISTER" && (
          <form onSubmit={handleRegister}>
            {/* Role selector */}
            <div className="form-group">
              <label className="form-label">I want to:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div
                  onClick={() => setRole("FOOD_PROVIDER")}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: `2px solid ${role === "FOOD_PROVIDER" ? "#16a34a" : "#e2e8f0"}`,
                    background: role === "FOOD_PROVIDER" ? "#f0fdf4" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <Building size={20} color={role === "FOOD_PROVIDER" ? "#16a34a" : "#64748b"} />
                  <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px" }}>
                    Donate Food
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Food Provider</div>
                </div>

                <div
                  onClick={() => setRole("NGO")}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: `2px solid ${role === "NGO" ? "#16a34a" : "#e2e8f0"}`,
                    background: role === "NGO" ? "#f0fdf4" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <Heart size={20} color={role === "NGO" ? "#16a34a" : "#64748b"} />
                  <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "4px" }}>
                    Receive Food
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>NGO / Charity</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
              {loading ? "Registering..." : "Create Account"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px" }}>
              Already registered?{" "}
              <span
                style={{ color: "#16a34a", fontWeight: "600", cursor: "pointer" }}
                onClick={() => setMode("LOGIN")}
              >
                Sign In
              </span>
            </div>
          </form>
        )}

        {/* Mode: LOGIN */}
        {mode === "LOGIN" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px" }}>
              Don't have an account?{" "}
              <span
                style={{ color: "#16a34a", fontWeight: "600", cursor: "pointer" }}
                onClick={() => setMode("REGISTER")}
              >
                Register
              </span>
            </div>
          </form>
        )}

        {/* Mode: OTP VERIFICATION */}
        {mode === "OTP" && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter 6-Digit Email OTP</label>
              <input
                className="form-input"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
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
              {loading ? "Verifying..." : "Verify & Complete"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px" }}>
              Didn't receive the code?{" "}
              <span
                style={{ color: "#16a34a", fontWeight: "600", cursor: "pointer" }}
                onClick={handleResend}
              >
                Resend OTP
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
