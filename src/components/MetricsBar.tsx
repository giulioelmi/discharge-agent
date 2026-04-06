import { useAppStore } from '../store/useAppStore';
import { CheckCircle, Bed, LogOut } from 'lucide-react';
import type { Department } from './layout/TopBar';

export default function MetricsBar({ department }: { department?: Department }) {
  const { metrics, beds, patients, loading } = useAppStore();

  if (loading || !metrics) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  // When a department is selected, compute metrics from filtered data.
  const deptBeds = department ? beds.filter((b) => b.unit === department.label) : beds;
  const deptPatients = department ? patients.filter((p) => p.unit === department.label) : patients;

  const bedsAvailable = deptBeds.filter((b) => b.status === 'available').length;
  const bedsTotal = deptBeds.length;
  const pendingDischarges = deptPatients.filter((p) =>
    p.blockers.length > 0 ||
    p.dischecklistItems.some((i) => !i.completed) ||
    p.labs.some((l) => l.status === 'pending' || l.status === 'stat')
  ).length;
  // Discharge completions stay global (daily unit total from EHR)
  const { dischargesCompleted, dischargesTarget } = metrics;

  return (
    <div className="flex items-center gap-0 px-2 bg-slate-50 border-b border-slate-200 flex-shrink-0 overflow-x-auto">
      <MetricTile
        icon={<CheckCircle size={13} className="text-teal-600" />}
        label="Discharges"
        value={`${dischargesCompleted}/${dischargesTarget}`}
        sub="today"
        valueClass={
          dischargesCompleted >= dischargesTarget
            ? 'text-teal-700'
            : 'text-slate-700'
        }
      />
      <Divider />
      <MetricTile
        icon={<Bed size={13} className="text-blue-600" />}
        label="Beds Available"
        value={`${bedsAvailable}/${bedsTotal}`}
        sub={department?.label ?? 'unit'}
        valueClass="text-slate-700"
      />
      <Divider />
      <MetricTile
        icon={<LogOut size={13} className="text-amber-600" />}
        label="Pending DC"
        value={`${pendingDischarges}`}
        sub="patients"
        valueClass={pendingDischarges > 3 ? 'text-amber-700 font-semibold' : 'text-slate-700'}
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
