import React from "react";
import { X, LogOut, AlertTriangle } from "lucide-react";

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "420px", textAlign: "center", padding: "28px 24px" }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div
          style={{
            width: "52px",
            height: "52px",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <LogOut size={26} />
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
          Confirm Sign Out
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "8px", lineHeight: "1.5" }}>
          Are you sure you want to log out of <strong>Anansetu</strong>? You will need to verify with an email OTP when logging in again.
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: "11px" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            style={{ flex: 1, padding: "11px" }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
