import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicFeed from './pages/PublicFeed';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import RescueTracker from './pages/RescueTracker';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <div className="min-h-screen flex flex-col bg-[#fbfaf6] text-[#22352d]">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/feed" element={<PublicFeed />} />
                <Route path="/track" element={<RescueTracker />} />
                <Route path="/track/:id" element={<RescueTracker />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Role-Protected Routes */}
                <Route
                  path="/donor"
                  element={
                    <ProtectedRoute allowedRoles={['donor', 'food_provider', 'admin']}>
                      <DonorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ngo"
                  element={
                    <ProtectedRoute allowedRoles={['ngo', 'recipient', 'admin']}>
                      <NgoDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
