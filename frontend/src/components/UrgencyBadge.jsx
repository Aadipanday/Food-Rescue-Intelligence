import React from 'react';
import { Clock, AlertTriangle, Flame, CheckCircle2 } from 'lucide-react';

export const UrgencyBadge = ({ level = 'LOW', score }) => {
  const normalizedLevel = (level || 'LOW').toUpperCase();

  const configs = {
    CRITICAL: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500 animate-pulse',
      icon: Flame,
      label: 'Critical Urgency',
    },
    HIGH: {
      bg: 'bg-orange-50 border-orange-200 text-orange-700',
      dot: 'bg-orange-500 animate-pulse',
      icon: AlertTriangle,
      label: 'High Priority',
    },
    MEDIUM: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500',
      icon: Clock,
      label: 'Medium Priority',
    },
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'Low Priority',
    },
  };

  const config = configs[normalizedLevel] || configs.LOW;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
      title={score ? `Urgency Score: ${score}/100` : config.label}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="text-[10px] font-mono opacity-80">({score})</span>
      )}
    </span>
  );
};

export const StatusBadge = ({ status = 'AVAILABLE' }) => {
  const norm = (status || 'AVAILABLE').toUpperCase();

  const configs = {
    AVAILABLE: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      label: 'Available for Rescue',
    },
    CLAIMED: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      label: 'Claimed (In Transit)',
    },
    COMPLETED: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      label: 'Handover Completed',
    },
    EXPIRED: {
      bg: 'bg-slate-100 border-slate-200 text-slate-500',
      label: 'Expired',
    },
    CANCELLED: {
      bg: 'bg-rose-50 border-rose-200 text-rose-600',
      label: 'Cancelled',
    },
  };

  const config = configs[norm] || {
    bg: 'bg-slate-100 border-slate-200 text-slate-700',
    label: norm,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      {config.label}
    </span>
  );
};
