import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowUpRight, HeartHandshake, LayoutDashboard, LogOut, Menu, X, Radio } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const dashboard = !user ? '/login'
    : user.role?.toLowerCase() === 'admin' ? '/admin'
    : ['ngo', 'recipient'].includes(user.role?.toLowerCase()) ? '/ngo' : '/donor';

  const signOut = async () => { setOpen(false); await logout(); navigate('/login'); };
  const navigation = [
    { to: '/', label: 'Home', end: true },
    { to: '/feed', label: 'Find food' },
    { to: '/track', label: 'Live Tracking' },
    ...(isAuthenticated ? [{ to: dashboard, label: 'Dashboard' }] : []),
  ];

  return (
    <header className="site-header">
      <div className="site-container header-content">
        <Link to="/" className="brand" aria-label="Food Rescue Intelligence home">
          <span className="brand-symbol"><HeartHandshake size={23} strokeWidth={2} /></span>
          <span className="brand-wordmark">food<span>rescue</span><small>INTELLIGENCE</small></span>
        </Link>
        <nav className="desktop-navigation" aria-label="Main navigation">
          {navigation.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{label}</NavLink>)}
          <a href="/#how-it-works" className="nav-link">How it works</a>
        </nav>
        <div className="header-actions">
          {isConnected ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs" title="Connected to Real-time Food Rescue Mesh">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Mesh</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200" title="Offline / Reconnecting...">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Offline</span>
            </span>
          )}
          {isAuthenticated ? <>
            <Link to="/profile" className="header-account" title="View your profile"><span className="account-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</span><span className="account-name">{user?.name || 'My account'}</span></Link>
            <button className="header-logout" type="button" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
          </> : <>
            <Link to="/login" className="header-signin">Sign in</Link>
            <Link to="/register" className="header-join">Join the network <ArrowUpRight size={16} /></Link>
          </>}
        </div>
        <button className="mobile-menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(v => !v)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
      {open && <div id="mobile-navigation" className="mobile-navigation"><nav aria-label="Mobile navigation">{navigation.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>{label}</NavLink>)}<a className="mobile-nav-link" href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a></nav>{isAuthenticated ? <><Link className="mobile-nav-link" to="/profile">My profile</Link><button className="mobile-signout" onClick={signOut}><LogOut size={17} /> Sign out</button></> : <div className="mobile-auth-actions"><Link to="/login" className="btn btn-outline">Sign in</Link><Link to="/register" className="btn btn-primary">Join the network <ArrowUpRight size={17} /></Link></div>}</div>}
    </header>
  );
}
