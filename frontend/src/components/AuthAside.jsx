import React from 'react';
import { HeartHandshake, MapPin, ShieldCheck, Sprout } from 'lucide-react';

export default function AuthAside({ joining = false }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-mark"><HeartHandshake size={25} /></div>
      <div className="auth-aside-content">
        <span className="auth-aside-eyebrow">ANNASETU INTELLIGENCE</span>
        <h2>{joining ? <>Your community<br />starts <em>here.</em></> : <>Good things<br />grow when we<br /><em>share.</em></>}</h2>
        <p>{joining ? 'Join a local network connecting generous kitchens with the community organisations who need them.' : 'A shared meal starts with a connection. Welcome back to the people making it happen.'}</p>
        <div className="auth-aside-points"><div><span><MapPin size={17} /></span> Local food connections</div><div><span><ShieldCheck size={17} /></span> Verified handovers</div><div><span><Sprout size={17} /></span> Less waste, more impact</div></div>
      </div>
      <div className="auth-aside-bottom"><span className="auth-aside-line" /> GROWING GOOD IN LUCKNOW</div>
    </aside>
  );
}
