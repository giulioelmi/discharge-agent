import { Bed, Patient, BedStatus } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Loader2 } from 'lucide-react';

function bedStatusStyle(status: BedStatus) {
  switch (status) {
    case 'available':
      return 'bg-green-50 border-green-400';
    case 'discharge-ready':
      return 'bg-teal-50 border-teal-500';
    case 'pending-discharge':
      return 'bg-amber-50 border-amber-500';
    case 'blocked':
      return 'bg-red-50 border-red-500';
    case 'cleaning':
      return 'bg-gray-100 border-gray-400';
    case 'occupied':
      return 'bg-blue-50 border-blue-300';
  }
}

function bedStatusLabel(status: BedStatus) {
  switch (status) {
    case 'available': return 'Available';
    case 'discharge-ready': return 'DC Ready';
    case 'pending-discharge': return 'Pending DC';
    case 'blocked': return 'Blocked';
    case 'cleaning': return 'Cleaning';
    case 'occupied': return 'Occupied';
  }
}

function bedStatusBadgeStyle(status: BedStatus) {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-700';
    case 'discharge-ready': return 'bg-teal-100 text-teal-700';
    case 'pending-discharge': return 'bg-amber-100 text-amber-700';
    case 'blocked': return 'bg-red-100 text-red-700';
    case 'cleaning': return 'bg-gray-100 text-gray-600';
    case 'occupied': return 'bg-blue-100 text-blue-700';
  }
}

function readinessBar(score: number) {
  const color =
    score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-500';
  const textColor =
    score >= 70 ? 'text-green-700' : score >= 40 ? 'text-amber-700' : 'text-red-700';
  return { color, textColor };
}

function eddBadgeStyle(edd: string) {
  const today = new Date('2026-04-02');
  const eddDate = new Date(edd);
  const diffDays = Math.floor((eddDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'bg-red-100 text-red-700 font-semibold';
  if (diffDays === 0) return 'bg-amber-100 text-amber-700 font-semibold';
  return 'bg-slate-100 text-slate-600';
}

function formatEDD(edd: string) {
  const today = new Date('2026-04-02');
  const eddDate = new Date(edd);
  const diffDays = Math.floor((eddDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return eddDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function BedCard({ bed, patient }: { bed: Bed; patient?: Patient }) {
  const { selectPatient } = useAppStore();

  const handleClick = () => {
    if (patient) selectPatient(patient.id);
  };

  if (!patient) {
    return (
      <div
        className={`border-l-4 rounded p-2 min-h-[90px] flex flex-col justify-between ${bedStatusStyle(bed.status)}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-700">{bed.room}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${bedStatusBadgeStyle(bed.status)}`}>
            {bedStatusLabel(bed.status)}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-slate-400 italic">{bedStatusLabel(bed.status)}</span>
        </div>
      </div>
    );
  }

  const { color, textColor } = readinessBar(patient.dischargeReadiness);

  return (
    <button
      onClick={handleClick}
      className={`border-l-4 rounded p-2 min-h-[90px] flex flex-col text-left w-full transition-shadow hover:shadow-md cursor-pointer ${bedStatusStyle(bed.status)}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-slate-700">{bed.room}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${bedStatusBadgeStyle(bed.status)}`}>
          {bedStatusLabel(bed.status)}
        </span>
      </div>

      <div className="text-xs font-semibold text-slate-800 truncate leading-tight mb-0.5">
        {patient.name}
      </div>
      <div className="text-[10px] text-slate-500 truncate leading-tight mb-1">
        {patient.diagnosis}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[9px] px-1 py-0.5 rounded ${eddBadgeStyle(patient.edd)}`}>
          {formatEDD(patient.edd)}
        </span>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold ${textColor}`}>{patient.dischargeReadiness}</span>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${patient.dischargeReadiness}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function BedBoard() {
  const { beds, patients, loading } = useAppStore();

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Bed Board — 4-North ({beds.length} beds)
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Available
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />DC Ready
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Pending DC
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Blocked
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {beds.map((bed) => (
          <BedCard
            key={bed.id}
            bed={bed}
            patient={bed.patientId ? patientMap[bed.patientId] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
