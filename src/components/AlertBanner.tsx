import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Alert } from '../types';

function severityConfig(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-600',
        text: 'text-white',
        icon: <AlertCircle size={14} className="flex-shrink-0" />,
        label: 'CRITICAL',
        labelClass: 'bg-red-800 text-red-100',
      };
    case 'advisory':
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        icon: <AlertTriangle size={14} className="flex-shrink-0" />,
        label: 'ADVISORY',
        labelClass: 'bg-amber-700 text-amber-100',
      };
    case 'info':
      return {
        bg: 'bg-blue-600',
        text: 'text-white',
        icon: <Info size={14} className="flex-shrink-0" />,
        label: 'INFO',
        labelClass: 'bg-blue-800 text-blue-100',
      };
  }
}

export default function AlertBanner() {
  const { alerts, snoozeAlert, selectPatient } = useAppStore();
  const [idx, setIdx] = useState(0);

  const active = alerts.filter((a) => !a.snoozed);

  // Reset index if current one is snoozed
  useEffect(() => {
    if (active.length > 0 && idx >= active.length) {
      setIdx(0);
    }
  }, [active.length, idx]);

  if (active.length === 0) return null;

  const alert = active[idx % active.length];
  const cfg = severityConfig(alert.severity);

  const handleSnooze = () => {
    snoozeAlert(alert.id);
    setIdx((i) => (i > 0 ? i - 1 : 0));
  };

  const handleAction = () => {
    if (alert.patientId) selectPatient(alert.patientId);
  };

  return (
    <div className={`${cfg.bg} ${cfg.text} flex items-center gap-2 px-4 py-1.5 text-xs flex-shrink-0`}>
      {cfg.icon}
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.labelClass}`}>
        {cfg.label}
      </span>
      <span className="flex-1 min-w-0 truncate font-medium">{alert.message}</span>

      {active.length > 1 && (
        <span className="flex-shrink-0 text-xs opacity-75">
          {idx + 1}/{active.length}
        </span>
      )}

      {alert.actionLabel && alert.patientId && (
        <button
          onClick={handleAction}
          className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors"
        >
          {alert.actionLabel}
          <ChevronRight size={11} />
        </button>
      )}

      {active.length > 1 && (
        <button
          onClick={() => setIdx((i) => (i + 1) % active.length)}
          className="flex-shrink-0 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors"
        >
          Next
        </button>
      )}

      <button
        onClick={handleSnooze}
        className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
        title="Snooze this alert"
      >
        <X size={13} />
      </button>
    </div>
  );
}
