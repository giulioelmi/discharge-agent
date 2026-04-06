import { Bed, Patient, BedStatus } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Loader2 } from 'lucide-react';
import MetricsBar from './MetricsBar';
import { MouseEvent, useState } from 'react';
import type { Department } from './layout/TopBar';

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
  const { selectPatient, expediteCleaning } = useAppStore();
  const [expediting, setExpediting] = useState(false);

  const handleClick = () => {
    if (patient) selectPatient(patient.id);
  };

  const isCleaning = bed.status === 'cleaning';
  const mutedClass = isCleaning ? 'opacity-60 grayscale' : '';

  const handleExpedite = async (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (expediting) return;
    setExpediting(true);
    try {
      await expediteCleaning(bed.id);
    } finally {
      setExpediting(false);
    }
  };

  if (!patient) {
    return (
      <div
        className={`border-l-4 rounded p-2 min-h-[90px] flex flex-col justify-between ${bedStatusStyle(bed.status)} ${mutedClass}`}
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
        {isCleaning && (
          <button
            type="button"
            onClick={handleExpedite}
            disabled={expediting}
            className="mt-1 text-[10px] px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-60"
          >
            {expediting ? 'Expediting…' : 'Expedite cleaning'}
          </button>
        )}
      </div>
    );
  }

  const { color, textColor } = readinessBar(patient.dischargeReadiness);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      className={`border-l-4 rounded p-2 min-h-[90px] flex flex-col text-left w-full transition-shadow hover:shadow-md cursor-pointer ${bedStatusStyle(bed.status)} ${mutedClass}`}
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

      {isCleaning && (
        <button
          type="button"
          onClick={handleExpedite}
          disabled={expediting}
          className="mt-1 text-[10px] px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-60"
        >
          {expediting ? 'Expediting…' : 'Expedite cleaning'}
        </button>
      )}
    </div>
  );
}

export default function BedBoard({ department }: { department?: Department }) {
  const deptLabel = department?.label ?? '4-North';
  const { beds, patients, loading } = useAppStore();
  const [filter, setFilter] = useState<BedStatus | null>(null);

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const legendItems: Array<{ label: string; status: BedStatus; dotClass: string }> = [
    { label: 'Available', status: 'available', dotClass: 'bg-green-400' },
    { label: 'DC Ready', status: 'discharge-ready', dotClass: 'bg-teal-500' },
    { label: 'Pending DC', status: 'pending-discharge', dotClass: 'bg-amber-500' },
    { label: 'Blocked', status: 'blocked', dotClass: 'bg-red-500' },
  ];

  // Filter to current department first, then by status
  const deptBeds = department
    ? beds.filter((b) => b.unit === department.label)
    : beds;
  const filteredBeds = filter ? deptBeds.filter((b) => b.status === filter) : deptBeds;
  const sortedBeds = [...filteredBeds].sort((a, b) => {
    const aIsCleaning = a.status === 'cleaning' ? 1 : 0;
    const bIsCleaning = b.status === 'cleaning' ? 1 : 0;
    return aIsCleaning - bIsCleaning;
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <MetricsBar department={department} />
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Bed Board — {deptLabel} ({filteredBeds.length} beds)
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {legendItems.map((it) => {
            const active = filter === it.status;
            return (
              <button
                key={it.status}
                type="button"
                onClick={() => setFilter((cur) => (cur === it.status ? null : it.status))}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-slate-100 ${
                  active ? 'bg-slate-200 text-slate-700 font-semibold' : ''
                }`}
                title={active ? 'Clear filter' : `Filter: ${it.label}`}
              >
                <span className={`w-2 h-2 rounded-full inline-block ${it.dotClass}`} />
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {sortedBeds.map((bed) => (
          <BedCard
            key={bed.id}
            bed={bed}
            patient={bed.patientId ? patientMap[bed.patientId] : undefined}
          />
        ))}
      </div>
    </div>
    </div>
  );
}
