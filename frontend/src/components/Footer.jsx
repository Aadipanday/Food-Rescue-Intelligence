import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, HeartHandshake, Leaf, MapPin } from 'lucide-react';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();

  const userRole = (user?.role || '').toLowerCase();
  const dashboard = !user
    ? '/login'
    : userRole === 'admin'
    ? '/admin'
    : ['ngo', 'recipient'].includes(userRole)
    ? '/ngo'
    : '/donor';

  return (
    <footer className="site-footer">
      <div className="site-container footer-main">
        <div className="footer-about">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">
              <HeartHandshake size={22} />
            </span>
            <span>food<strong>rescue</strong></span>
          </Link>
          <p>
            Making it easier for good food to find its way to the people who need it. Less waste, more community.
          </p>
          <span className="footer-location">
            <MapPin size={15} /> Made in Lucknow, India
          </span>
        </div>

        <div className="footer-links">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/feed">Available food</Link>
          <Link to="/track">Live tracking</Link>
          {!isAuthenticated && <Link to="/register">Join the network</Link>}
        </div>

        <div className="footer-links">
          <h3>{isAuthenticated ? 'My Account' : 'Get involved'}</h3>
          {isAuthenticated ? (
            <>
              <Link to={dashboard}>My Dashboard</Link>
              <Link to="/profile">Profile Settings</Link>
              {['donor', 'food_provider'].includes(userRole) ? (
                <Link to="/donor">Post Surplus Batch</Link>
              ) : (
                <Link to="/feed">Claim Donations</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/donor">Share surplus food</Link>
              <Link to="/ngo">NGO dashboard</Link>
              <Link to="/login">Sign in</Link>
            </>
          )}
        </div>

        <div className="footer-note">
          <div className="footer-leaf">
            <Leaf size={22} />
          </div>
          <h3>Good food. Greater impact.</h3>
          <p>
            Supporting the mission of zero hunger and responsible consumption, one meal at a time.
          </p>
          {isAuthenticated ? (
            <Link to={dashboard}>
              Go to your dashboard <ArrowUpRight size={16} />
            </Link>
          ) : (
            <Link to="/register">
              Get started <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <div className="site-container footer-bottom">
        <span>© {new Date().getFullYear()} Food Rescue Intelligence. All rights reserved.</span>
        <span>Created at Institute of Engineering & Technology, Lucknow · Group 15</span>
      </div>
    </footer>
  );
}
