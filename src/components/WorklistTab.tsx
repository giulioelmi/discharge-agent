import { useState } from 'react';
import {
  FlaskConical, Truck, ClipboardList, Users, Package, Pill,
  Bot, ChevronDown, ChevronUp, Clock, CheckCircle2, Loader2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Blocker, Lab, Patient } from '../types';
import { askAgent } from '../api/agent';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date('2026-04-02');

function diffDays(edd: string) {
  return Math.floor((new Date(edd).getTime() - TODAY.getTime()) / 86400000);
}

function eddLabel(edd: string) {
  const d = diffDays(edd);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return new Date(edd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function eddClass(edd: string) {
  const d = diffDays(edd);
  if (d < 0) return 'bg-red-100 text-red-700 font-semibold';
  if (d === 0) return 'bg-amber-100 text-amber-700 font-semibold';
  return 'bg-slate-100 text-slate-500';
}

function readinessClass(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-600';
}

function readinessBg(score: number) {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-500';
}

function blockerIcon(type: Blocker['type']) {
  const cls = 'w-3.5 h-3.5 flex-shrink-0';
  switch (type) {
    case 'lab-pending':  return <FlaskConical className={cls} />;
    case 'transport':    return <Truck className={cls} />;
    case 'md-order':     return <ClipboardList className={cls} />;
    case 'family':       return <Users className={cls} />;
    case 'placement':    return <Package className={cls} />;
    case 'medication':   return <Pill className={cls} />;
    default:             return null;
  }
}

function minutesAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function labWaitClass(iso: string) {
  const hrs = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (hrs >= 2) return 'text-red-600 font-semibold';
  if (hrs >= 1) return 'text-amber-600';
  return 'text-slate-500';
}

// ---------------------------------------------------------------------------
// AI inline response per blocker
// ---------------------------------------------------------------------------

function AskAIButton({ patient, blocker }: { patient: Patient; blocker: Blocker }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleClick = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (response) return; // already fetched
    setLoading(true);
    const prompt = `How do I resolve this discharge blocker for ${patient.name} (${patient.diagnosis})? Blocker: "${blocker.description}"`;
    const res = await askAgent(patient, prompt);
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="mt-1.5">
      <button
        onClick={handleClick}
        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-violet-300 text-violet-600 hover:bg-violet-50 font-medium transition-colors"
      >
        <Bot size={10} />
        {open ? 'Hide AI' : 'Ask AI'}
      </button>
      {open && (
        <div className="mt-1.5 p-2 rounded bg-violet-50 border border-violet-200 text-[10px] text-slate-700 leading-relaxed">
          {loading ? (
            <span className="flex items-center gap-1 text-slate-400">
              <Loader2 size={10} className="animate-spin" /> Thinking…
            </span>
          ) : (
            response
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient row
// ---------------------------------------------------------------------------

function PatientRow({ patient, rank }: { patient: Patient; rank: number }) {
  const { selectPatient, beds } = useAppStore();
  const [expanded, setExpanded] = useState(rank <= 3); // top 3 auto-expanded

  const bed = beds.find((b) => b.patientId === patient.id);
  const incompleteItems = patient.dischecklistItems.filter((i) => !i.completed).length;
  const totalItems = patient.dischecklistItems.length;
  const completedItems = totalItems - incompleteItems;

  const isReady = patient.blockers.length === 0 && incompleteItems === 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Row header — always visible */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Rank */}
        <span className="text-sm font-bold text-slate-400 w-5 text-center flex-shrink-0">
          {rank}
        </span>

        {/* Readiness score */}
        <div className="flex flex-col items-center w-10 flex-shrink-0">
          <span className={`text-lg font-bold leading-none ${readinessClass(patient.dischargeReadiness)}`}>
            {patient.dischargeReadiness}
          </span>
          <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full rounded-full ${readinessBg(patient.dischargeReadiness)}`}
              style={{ width: `${patient.dischargeReadiness}%` }}
            />
          </div>
        </div>

        {/* Patient info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); selectPatient(patient.id); }}
              className="text-sm font-semibold text-slate-800 hover:text-teal-600 transition-colors truncate"
            >
              {patient.name}
            </button>
            <span className="text-xs text-slate-400">{bed?.room ?? '—'}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${eddClass(patient.edd)}`}>
              {eddLabel(patient.edd)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            {patient.diagnosis} · {patient.physician}
          </div>
        </div>

        {/* Status summary */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isReady ? (
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              <CheckCircle2 size={10} /> Ready
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">
              {patient.blockers.length > 0 && (
                <span className="text-amber-600 font-semibold mr-1">
                  {patient.blockers.length} blocker{patient.blockers.length > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-slate-400">{completedItems}/{totalItems} tasks</span>
            </span>
          )}
          {expanded
            ? <ChevronUp size={14} className="text-slate-400" />
            : <ChevronDown size={14} className="text-slate-400" />
          }
        </div>
      </div>

      {/* Expanded action items */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60 space-y-2">
          {isReady && (
            <div className="flex items-center gap-2 text-xs text-green-700 py-1">
              <CheckCircle2 size={13} />
              All discharge tasks complete — patient is ready to go home.
            </div>
          )}

          {/* Blockers */}
          {patient.blockers.map((b, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200">
              <span className="text-amber-500 mt-0.5">{blockerIcon(b.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-700">{b.description}</div>
                {b.resolvable && <AskAIButton patient={patient} blocker={b} />}
              </div>
            </div>
          ))}

          {/* Incomplete checklist items (top 3) */}
          {incompleteItems > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pending tasks ({incompleteItems})
              </div>
              {patient.dischecklistItems
                .filter((i) => !i.completed)
                .slice(0, 3)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-3 h-3 rounded border border-slate-300 flex-shrink-0" />
                    {item.label}
                  </div>
                ))}
              {incompleteItems > 3 && (
                <button
                  onClick={() => selectPatient(patient.id)}
                  className="text-[10px] text-teal-600 hover:underline"
                >
                  +{incompleteItems - 3} more — open full checklist
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lab priority queue (right panel)
// ---------------------------------------------------------------------------

interface LabEntry {
  patient: Patient;
  room: string;
  lab: Lab;
}

function LabPriorityQueue({ entries }: { entries: LabEntry[] }) {
  const { selectPatient } = useAppStore();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs">
        <FlaskConical size={20} className="mb-2 opacity-40" />
        No pending labs
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((e, i) => {
        const isOverdue = (Date.now() - new Date(e.lab.orderedAt).getTime()) / 3600000 >= 2;
        return (
          <div
            key={i}
            className={`rounded border p-2.5 ${
              e.lab.status === 'stat'
                ? 'bg-red-50 border-red-200'
                : isOverdue
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  {e.lab.status === 'stat' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold uppercase tracking-wide">
                      STAT
                    </span>
                  )}
                  {e.lab.name}
                </div>
                <button
                  onClick={() => selectPatient(e.patient.id)}
                  className="text-[10px] text-teal-600 hover:underline font-medium"
                >
                  {e.patient.name}
                </button>
                <span className="text-[10px] text-slate-400 ml-1">· {e.room}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-[10px] flex items-center gap-0.5 ${labWaitClass(e.lab.orderedAt)}`}>
                  <Clock size={9} />
                  {minutesAgo(e.lab.orderedAt)}
                </div>
                <div className={`text-[9px] font-bold mt-0.5 ${readinessClass(e.patient.dischargeReadiness)}`}>
                  DC {e.patient.dischargeReadiness}
                </div>
              </div>
            </div>
            {isOverdue && e.lab.status !== 'stat' && (
              <div className="mt-1.5 text-[9px] text-amber-700 font-semibold">
                ⚠ Over 2hr TAT target
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main WorklistTab
// ---------------------------------------------------------------------------

export default function WorklistTab() {
  const { patients, beds, loading } = useAppStore();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // Sort patients by discharge readiness descending
  const sorted = [...patients].sort((a, b) => b.dischargeReadiness - a.dischargeReadiness);

  // Build lab priority queue: all pending/stat labs, sorted STAT first then by patient readiness desc
  const labEntries: LabEntry[] = [];
  for (const patient of patients) {
    const bed = beds.find((b) => b.patientId === patient.id);
    const room = bed?.room ?? '—';
    for (const lab of patient.labs) {
      if (lab.status === 'pending' || lab.status === 'stat') {
        labEntries.push({ patient, room, lab });
      }
    }
  }
  labEntries.sort((a, b) => {
    // STAT always first
    if (a.lab.status === 'stat' && b.lab.status !== 'stat') return -1;
    if (b.lab.status === 'stat' && a.lab.status !== 'stat') return 1;
    // Then by patient discharge readiness desc (higher readiness = closer to discharge = more urgent to unblock)
    return b.patient.dischargeReadiness - a.patient.dischargeReadiness;
  });

  return (
    <div className="flex-1 overflow-hidden flex gap-4 p-4 min-h-0">
      {/* Left: patient worklist */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Patient Worklist</h2>
            <p className="text-[11px] text-slate-400">Ordered by discharge readiness · {sorted.length} patients</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥70 Ready
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />40–69
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{'<'}40
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {sorted.map((patient, i) => (
            <PatientRow key={patient.id} patient={patient} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* Right: lab priority queue */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        <div className="flex-shrink-0">
          <h2 className="text-sm font-bold text-slate-800">Lab Priority Queue</h2>
          <p className="text-[11px] text-slate-400">
            Pending labs blocking discharge · {labEntries.length} active
          </p>
        </div>

        {/* TAT warning if over target */}
        {labEntries.some((e) => (Date.now() - new Date(e.lab.orderedAt).getTime()) / 3600000 >= 2) && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-[10px] text-red-700 font-medium flex-shrink-0">
            ⚠ Some labs exceed the 2hr TAT target. Consider escalating to lab.
          </div>
        )}

        <LabPriorityQueue entries={labEntries} />
      </div>
    </div>
  );
}
