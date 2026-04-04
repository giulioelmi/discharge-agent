import { useAppStore } from '../store/useAppStore';
import { CheckCircle, Bed, LogOut } from 'lucide-react';

export default function MetricsBar() {
  const { metrics, loading } = useAppStore();

  if (loading || !metrics) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  // Lab TAT temporarily hidden.

  return (
    <div className="flex items-center gap-0 px-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 overflow-x-auto">
      <MetricTile
        icon={<CheckCircle size={13} className="text-teal-600" />}
        label="Discharges"
        value={`${metrics.dischargesCompleted}/${metrics.dischargesTarget}`}
        sub="today"
        valueClass={
          metrics.dischargesCompleted >= metrics.dischargesTarget
            ? 'text-teal-700'
            : 'text-slate-700'
        }
      />
      <Divider />
      <MetricTile
        icon={<Bed size={13} className="text-blue-600" />}
        label="Beds Available"
        value={`${metrics.bedsAvailable}/${metrics.bedsTotal}`}
        sub="unit"
        valueClass="text-slate-700"
      />
      <Divider />
      {/* Lab TAT temporarily hidden */}
      <MetricTile
        icon={<LogOut size={13} className="text-amber-600" />}
        label="Pending DC"
        value={`${metrics.pendingDischarges}`}
        sub="patients"
        valueClass={metrics.pendingDischarges > 3 ? 'text-amber-700 font-semibold' : 'text-slate-700'}
      />
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-slate-200 flex-shrink-0" />;
}

function MetricTile({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
      {icon}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium leading-none mb-0.5">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-sm ${valueClass}`}>{value}</span>
          <span className="text-[10px] text-slate-400">{sub}</span>
        </div>
      </div>
    </div>
  );
}
