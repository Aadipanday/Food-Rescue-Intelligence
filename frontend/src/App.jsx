import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ListingsView from "./pages/ListingsView";
import DashboardView from "./pages/DashboardView";
import ImpactView from "./pages/ImpactView";
import AiAssistant from "./components/AiAssistant";
import AuthModal from "./components/AuthModal";
import OrgModal from "./components/OrgModal";
import CreateListingModal from "./components/CreateListingModal";
import ClaimModal from "./components/ClaimModal";
import HandoverModal from "./components/HandoverModal";

function MainApp() {
  const [currentView, setCurrentView] = useState("listings"); // "listings" | "dashboard" | "ai" | "impact"

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClaimListing, setSelectedClaimListing] = useState(null);
  const [selectedHandoverListing, setSelectedHandoverListing] = useState(null);

  const handleOpenClaim = (listing) => {
    setSelectedClaimListing(listing);
  };

  const handleOpenHandover = (listing) => {
    setSelectedHandoverListing(listing);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openOrgModal={() => setIsOrgModalOpen(true)}
        openCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Pages */}
      <main style={{ flex: 1 }}>
        {currentView === "listings" && (
          <ListingsView
            openAuthModal={() => setIsAuthModalOpen(true)}
            openClaimModal={handleOpenClaim}
            openCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {currentView === "dashboard" && (
          <DashboardView
            openCreateModal={() => setIsCreateModalOpen(true)}
            openHandoverModal={handleOpenHandover}
          />
        )}

        {currentView === "ai" && <AiAssistant />}

        {currentView === "impact" && <ImpactView />}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <OrgModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => setCurrentView("dashboard")}
      />

      <ClaimModal
        listing={selectedClaimListing}
        isOpen={!!selectedClaimListing}
        onClose={() => setSelectedClaimListing(null)}
        onClaimed={() => setCurrentView("dashboard")}
      />

      <HandoverModal
        listing={selectedHandoverListing}
        isOpen={!!selectedHandoverListing}
        onClose={() => setSelectedHandoverListing(null)}
        onVerified={() => setCurrentView("dashboard")}
      />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 FoodRescue Intelligence Platform. Saving surplus meals, cutting emissions, and feeding communities.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
