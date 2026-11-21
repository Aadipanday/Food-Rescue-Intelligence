import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Utensils,
  HeartHandshake,
  Sparkles,
  BarChart3,
  PlusCircle,
  Building2,
  LogOut,
  User,
  ShieldAlert,
} from "lucide-react";

export default function Navbar({
  currentView,
  setCurrentView,
  openAuthModal,
  openOrgModal,
  openCreateModal,
}) {
  const { user, isFoodProvider, isNgo, role, organization, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand */}
        <div className="nav-brand" onClick={() => setCurrentView("listings")}>
          <div
            style={{
              background: "#16a34a",
              color: "white",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
            }}
          >
            <Utensils size={20} />
          </div>
          <span>
            FoodRescue <span style={{ color: "#0f172a" }}>Intelligence</span>
          </span>
        </div>

        {/* Navigation items */}
        <nav className="nav-links">
          <button
            className={`nav-link ${currentView === "listings" ? "active" : ""}`}
            onClick={() => setCurrentView("listings")}
          >
            <Utensils size={16} />
            <span>Available Food</span>
          </button>

          {user && (
            <button
              className={`nav-link ${currentView === "dashboard" ? "active" : ""}`}
              onClick={() => setCurrentView("dashboard")}
            >
              <HeartHandshake size={16} />
              <span>{isFoodProvider ? "My Postings" : "My Claims"}</span>
            </button>
          )}

          <button
            className={`nav-link ${currentView === "ai" ? "active" : ""}`}
            onClick={() => setCurrentView("ai")}
          >
            <Sparkles size={16} color="#eab308" />
            <span>AI Predictor</span>
          </button>

          <button
            className={`nav-link ${currentView === "impact" ? "active" : ""}`}
            onClick={() => setCurrentView("impact")}
          >
            <BarChart3 size={16} />
            <span>Live Impact</span>
          </button>
        </nav>

        {/* Actions / User Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <>
              {/* If user hasn't registered an organization yet */}
              {!organization ? (
                <button className="btn btn-outline btn-sm" onClick={openOrgModal}>
                  <Building2 size={15} />
                  <span>Register Org</span>
                </button>
              ) : isFoodProvider ? (
                <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <PlusCircle size={15} />
                  <span>Post Food</span>
                </button>
              ) : null}

              {/* User Role Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 10px",
                  background: "#f1f5f9",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <User size={15} color="#475569" />
                <span>{user.name}</span>
                <span
                  className={`badge ${
                    isFoodProvider
                      ? "badge-provider"
                      : isNgo
                      ? "badge-ngo"
                      : "badge-urgent-low"
                  }`}
                  style={{ padding: "2px 8px", fontSize: "11px" }}
                >
                  {isFoodProvider
                    ? "Provider"
                    : isNgo
                    ? "NGO"
                    : role || "User"}
                </span>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={openAuthModal}>
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
