import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Flame, CheckCircle } from 'lucide-react';

/**
 * Live Countdown Timer for Food Rescues
 * Shows real-time ticking remaining shelf-life with visual urgency color coding
 */
export const CountdownTimer = ({ expiryTime, idealPickupTime }) => {
  const targetTime = new Date(expiryTime || idealPickupTime || Date.now() + 3600000).getTime();

  const calculateTimeLeft = () => {
    const difference = targetTime - Date.now();
    if (difference <= 0) {
      return { total: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { total: difference, hours, minutes, seconds, expired: false };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  if (timeLeft.expired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span>Window Expired</span>
      </div>
    );
  }

  // < 1 hour remaining => Critical
  const isCritical = timeLeft.hours === 0 && timeLeft.minutes < 60;
  // < 3 hours remaining => High priority
  const isHigh = timeLeft.hours < 3;

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
        isCritical
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          : isHigh
          ? 'bg-amber-50 text-amber-700 border-amber-300'
          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
      }`}
      title="Remaining shelf life window before quality degradation"
    >
      {isCritical ? (
        <Flame className="w-3.5 h-3.5 text-rose-600" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-slate-500" />
      )}
      <span>
        {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s left
      </span>
    </div>
  );
};

export default CountdownTimer;
