import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, ArrowUpRight, Building2, Check, ChevronRight, Clock3,
  Droplets, HeartHandshake, Leaf, MapPin, PackageCheck, ShieldCheck,
  Sprout, Utensils, Users, HandHeart
} from 'lucide-react';
import api from '../api/axios';
import { UrgencyBadge } from '../components/UrgencyBadge';

const STEPS = [
  { number: '01', icon: PackageCheck, title: 'Share what you have', text: 'Food providers post available meals, quantities and the best time for collection.' },
  { number: '02', icon: MapPin, title: 'Find the right people', text: 'Nearby NGO partners can see suitable donations and arrange a pickup.' },
  { number: '03', icon: ShieldCheck, title: 'Complete the handover', text: 'A one-time code confirms collection so everyone has a reliable record.' },
];

const showMetric = (value, suffix = '') => value === null || value === undefined
  ? '—'
  : `${Number(value).toLocaleString('en-IN')}${suffix}`;

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [kg, setKg] = useState(25);

  const userRole = (user?.role || '').toLowerCase();
  const dashboard = !user
    ? '/login'
    : userRole === 'admin'
    ? '/admin'
    : ['ngo', 'recipient'].includes(userRole)
    ? '/ngo'
    : '/donor';

  useEffect(() => {
    let active = true;
    api.get('/analytics/impact').then(({ data }) => {
      if (active && data?.success && data?.data) setStats(data.data);
    }).catch(() => {});
    api.get('/listings?status=AVAILABLE').then(({ data }) => {
      const rows = data?.listings || data?.data || [];
      if (active && Array.isArray(rows)) setListings(rows.slice(0, 3));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const estimatedMeals = Math.round(kg * 2.5);
  const estimatedCarbon = (kg * 2.5).toLocaleString('en-IN', { maximumFractionDigits: 1 });
  const estimatedWater = (kg * 1000).toLocaleString('en-IN');

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="site-container hero-layout">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A more thoughtful way to share food</div>
            <h1>Good food deserves <em>a better ending.</em></h1>
            <p className="hero-description">Surplus food from local kitchens can make a real difference nearby. We help food providers and community organisations find each other, arrange collections and share more meals.</p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to={dashboard} className="btn btn-primary">Go to your dashboard <ArrowUpRight size={18} /></Link>
              ) : (
                <Link to="/register" className="btn btn-primary">Start sharing food <ArrowUpRight size={18} /></Link>
              )}
              <Link to="/feed" className="btn btn-outline">Explore available food <ArrowRight size={18} /></Link>
            </div>
            <div className="hero-footnote"><span className="hero-footnote-icon"><Check size={15} /></span> Built for local kitchens, shelters and communities in Lucknow</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo" role="img" aria-label="Community volunteers preparing food packages for sharing">
              <img
                src="https://images.unsplash.com/photo-1593113616828-6f22bca04804?auto=format&fit=crop&w=1500&q=82"
                alt="Volunteers packing food for community distribution"
                loading="eager"
                onError={(e) => { if (!e.currentTarget.src.endsWith('food-sharing-illustration.svg')) e.currentTarget.src = '/images/food-sharing-illustration.svg'; }}
              />
              <div className="hero-photo-tint" />
              <div className="hero-photo-caption"><span className="caption-icon"><HandHeart size={23} /></span><span><strong>From surplus to support.</strong><small>Small actions. Meaningful impact.</small></span></div>
            </div>
            <div className="hero-side-tag"><span className="tag-line" /> Food has a purpose. Let's share it.</div>
          </div>
        </div>
      </section>

      <section className="impact-strip" aria-label="Platform impact statistics">
        <div className="site-container impact-inner">
          <div className="impact-intro"><span className="section-kicker">OUR IMPACT</span><p>Every rescued meal counts.</p></div>
          <div className="impact-stat"><strong>{showMetric(stats?.totalMealsRescued)}</strong><span>Meals rescued</span></div>
          <div className="impact-stat"><strong>{showMetric(stats?.totalKgSaved, stats?.totalKgSaved == null ? '' : ' kg')}</strong><span>Food saved</span></div>
          <div className="impact-stat"><strong>{showMetric(stats?.totalCo2SavedKg, stats?.totalCo2SavedKg == null ? '' : ' kg')}</strong><span>CO₂e avoided</span></div>
        </div>
      </section>

      <section className="home-section process-section" id="how-it-works">
        <div className="site-container">
          <div className="section-heading section-heading-split">
            <div><span className="section-kicker">SIMPLE BY DESIGN</span><h2>A simpler way to make<br className="hidden sm:block" /> good food go further.</h2></div>
            <p>Whether you have extra food or people to feed, getting started should be the easy part.</p>
          </div>
          <div className="process-grid">
            {STEPS.map(({ number, icon: Icon, title, text }) => (
              <article className="process-card" key={number}>
                <div className="process-top"><span className="process-icon"><Icon size={23} strokeWidth={1.8} /></span><span className="process-number">{number}</span></div>
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
          <div className="community-banner">
            <div className="community-banner-icon"><Users size={26} /></div>
            <div><strong>One neighbourhood. Two ways to help.</strong><p>Join as a food provider to share surplus, or as an NGO to collect it for your community.</p></div>
            {isAuthenticated ? (
              <Link to={dashboard}>View your dashboard <ArrowRight size={17} /></Link>
            ) : (
              <Link to="/register">Join the network <ArrowRight size={17} /></Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-section available-section">
        <div className="site-container">
          <div className="section-heading section-heading-split">
            <div><span className="section-kicker">AVAILABLE TO COLLECT</span><h2>Fresh opportunities<br /> to do some good.</h2></div>
            <div className="section-heading-action"><p>See what local food providers are sharing, and help it reach the right people.</p><Link to="/feed" className="text-link">Browse all listings <ArrowUpRight size={17} /></Link></div>
          </div>
          {listings.length > 0 ? (
            <div className="listings-preview-grid">
              {listings.map((item) => (
                <article className="preview-card" key={item._id}>
                  <div className="preview-card-top"><span className="small-label">{(item.category || 'Cooked meals').replace(/_/g, ' ')}</span><UrgencyBadge level={item.urgencyLevel || item.aiUrgency?.level || 'MEDIUM'} /></div>
                  <h3>{item.title}</h3><p className="preview-description">{item.description || 'Food available for collection from a community food provider.'}</p>
                  <div className="preview-meta"><span><Utensils size={16} /> {item.quantity} {item.unit}</span><span><MapPin size={16} /> {item.pickupLocation?.city || 'Lucknow'}</span></div>
                  <Link className="preview-footer" to="/feed"><span>View food details</span><ArrowUpRight size={18} /></Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-preview"><div className="empty-preview-icon"><Sprout size={29} /></div><div><h3>Nothing waiting for collection right now.</h3><p>New donations appear here when providers add them. You can also be the first to share.</p></div><Link to="/donor" className="btn btn-outline">Share a donation <ArrowRight size={17} /></Link></div>
          )}
        </div>
      </section>

      <section className="home-section calculator-section">
        <div className="site-container">
          <div className="calculator-panel">
            <div className="calculator-copy"><span className="section-kicker">THE DIFFERENCE IT MAKES</span><h2>A little less waste.<br /><em>A lot more good.</em></h2><p>Wondering what your extra food could mean? Move the slider to explore an illustrative estimate of the difference a donation can make.</p><label htmlFor="impact-kg">Amount of food <strong>{kg} kg</strong></label><input id="impact-kg" type="range" min="5" max="200" step="5" value={kg} onChange={(e) => setKg(Number(e.target.value))} /><div className="range-labels"><span>5 kg</span><span>200 kg</span></div></div>
            <div className="calculator-results">
              <div className="calc-result"><div className="calc-result-icon"><Utensils size={23} /></div><div><strong>{estimatedMeals}</strong><span>Estimated meals</span></div></div>
              <div className="calc-result"><div className="calc-result-icon"><Leaf size={23} /></div><div><strong>{estimatedCarbon} kg</strong><span>Potential CO₂e avoided</span></div></div>
              <div className="calc-result"><div className="calc-result-icon"><Droplets size={23} /></div><div><strong>{estimatedWater} L</strong><span>Estimated water footprint</span></div></div>
              <p className="calc-disclaimer">Illustrative estimates based on 2.5 meals, 2.5 kg CO₂e and 1,000 L embedded water per kg of food. Actual outcomes vary.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="site-container final-cta-layout">
          <div>
            <span className="section-kicker">BE PART OF THE CHANGE</span>
            <h2>Make room for<br /><em>more good.</em></h2>
            <p>It starts with a simple connection between those who have food to share and those who can put it to good use.</p>
          </div>
          <div className="final-cta-actions">
            {isAuthenticated ? (
              <Link to={dashboard} className="btn btn-light">Go to your dashboard <ArrowUpRight size={18} /></Link>
            ) : (
              <Link to="/register" className="btn btn-light">Join our community <ArrowUpRight size={18} /></Link>
            )}
            <Link to="/feed" className="final-cta-secondary">See available food <ChevronRight size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
