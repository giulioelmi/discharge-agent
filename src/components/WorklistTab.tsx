import { useState } from 'react';
import {
  FlaskConical, Truck, ClipboardList, Users, Package, Pill,
  ChevronDown, ChevronUp, CheckCircle2, Loader2,
  ArrowUp, ArrowDown, Zap, CheckCheck,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Blocker, Lab, Patient } from '../types';
import { askAgent } from '../api/agent';
import type { Department } from './layout/TopBar';
import MetricsBar from './MetricsBar';

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
// App shortcuts — shown on blocker cards when an EHR app is the best next step
// ---------------------------------------------------------------------------

interface AppShortcut {
  name: string;
  icon: React.ReactNode;
  bg: string;
  href: string;
  tooltip: string;
}

// SVG icons for the three Cerner / Oracle Health apps most relevant to discharge
const PowerChartIcon = () => (
  // Faithful recreation of the Cerner / Oracle Health PowerChart app icon:
  // white PQRST cardiac trace on a blue background
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    {/* P wave → QRS complex → T wave, baseline at y=16 */}
    <polyline
      points="0,16 5,16 6.5,14 8,18 8.5,16 9.5,20 11,2 12.5,30 14,16 18,16 19.5,13 21,19 22.5,16 32,16"
      stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const PharmNetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    {/* Capsule shape split down the middle — universal pharmacy symbol */}
    <rect x="3" y="8" width="18" height="8" rx="4" stroke="white" strokeWidth="2.2"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2.2"/>
  </svg>
);

const FirstNetIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    {/* Lightning bolt — emergency / patient flow */}
    <path d="M13 2L5 13.5H11L10 22L19 10.5H13L13 2Z" fill="white"/>
  </svg>
);

const BLOCKER_APP: Partial<Record<Blocker['type'], AppShortcut>> = {
  'md-order': {
    name: 'PowerChart',
    icon: <PowerChartIcon />,
    bg: 'bg-[#0C6EAA]',
    href: 'powerchart://',
    tooltip: 'Open PowerChart to write or co-sign the discharge order',
  },
  'medication': {
    name: 'PharmNet',
    icon: <PharmNetIcon />,
    bg: 'bg-[#6A0DAD]',
    href: 'pharmnet://',
    tooltip: 'Open PharmNet to complete medication reconciliation',
  },
  'placement': {
    name: 'FirstNet',
    icon: <FirstNetIcon />,
    bg: 'bg-[#C94B00]',
    href: 'firstnet://',
    tooltip: 'Open FirstNet to manage patient placement and bed assignment',
  },
};

function AppShortcutButton({ shortcut }: { shortcut: AppShortcut }) {
  return (
    <a
      href={shortcut.href}
      onClick={(e) => e.preventDefault()}
      title={shortcut.tooltip}
      className="flex flex-col items-center gap-1 group cursor-pointer"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 shadow-sm transition-transform group-hover:scale-105 active:scale-95 ${shortcut.bg}`}
      >
        {shortcut.icon}
      </div>
      <span className="text-[9px] font-medium text-slate-500 group-hover:text-slate-700 leading-none text-center w-10 truncate">
        {shortcut.name}
      </span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Resolve logic — which blockers can the AI agent act on vs advise only
// ---------------------------------------------------------------------------

type ResolveMode = 'action' | 'advisory';

function resolveMode(blocker: Blocker): ResolveMode {
  // Agent can actively submit/trigger: transport requests, MD pages, medication orders
  if (['transport', 'md-order', 'medication'].includes(blocker.type)) return 'action';
  // lab-pending that is resolvable = can escalate to STAT
  if (blocker.type === 'lab-pending' && blocker.resolvable) return 'action';
  // family, placement, non-resolvable lab = advisory only
  return 'advisory';
}

function agentActionPrompt(patient: Patient, blocker: Blocker): string {
  const name = patient.name;
  const diag = patient.diagnosis;
  switch (blocker.type) {
    case 'transport':
      return `Submit a transport request for ${name} (${diag}). Blocker: "${blocker.description}". Confirm what was sent.`;
    case 'md-order':
      return `Page ${patient.physician} with an urgent discharge order request for ${name} (${diag}). Blocker: "${blocker.description}". Confirm what was sent.`;
    case 'medication':
      return `Notify pharmacy and draft a medication reconciliation order for ${name} (${diag}). Blocker: "${blocker.description}". Confirm what was done.`;
    case 'lab-pending':
      return `Escalate the pending lab to STAT for ${name} (${diag}). Blocker: "${blocker.description}". Confirm escalation.`;
    default:
      return `Resolve this discharge blocker for ${name} (${diag}): "${blocker.description}"`;
  }
}

function agentAdvisoryPrompt(patient: Patient, blocker: Blocker): string {
  const name = patient.name;
  switch (blocker.type) {
    case 'family':
      return `Provide brief step-by-step next actions for a nurse to resolve this family blocker for ${name}: "${blocker.description}"`;
    case 'placement':
      return `Provide brief step-by-step next actions to resolve this placement blocker for ${name}: "${blocker.description}"`;
    case 'lab-pending':
      return `Provide brief guidance on what to do while waiting for this lab result for ${name}: "${blocker.description}"`;
    default:
      return `Provide brief next steps to resolve this discharge blocker for ${name}: "${blocker.description}"`;
  }
}

// ---------------------------------------------------------------------------
// Resolve button — single button, handles both action and advisory modes
// ---------------------------------------------------------------------------

type ResolveState = 'idle' | 'loading' | 'done';

function ResolveButton({ patient, blocker }: { patient: Patient; blocker: Blocker }) {
  const [state, setState] = useState<ResolveState>('idle');
  const [result, setResult] = useState<string | null>(null);
  const mode = resolveMode(blocker);
  const { resolveBlocker } = useAppStore();

  const handleResolve = async () => {
    if (state !== 'idle') return;
    setState('loading');
    const prompt = mode === 'action'
      ? agentActionPrompt(patient, blocker)
      : agentAdvisoryPrompt(patient, blocker);
    const res = await askAgent(patient, prompt);
    setResult(res);
    await resolveBlocker(patient.id, blocker);
    setState('done');
  };

  const appShortcut = BLOCKER_APP[blocker.type];

  return (
    <div className="mt-2 space-y-2">
      {/* App shortcut tile — shown immediately when a native EHR app is the right tool */}
      {appShortcut && (
        <div className="flex items-start">
          <AppShortcutButton shortcut={appShortcut} />
        </div>
      )}

      {/* Agent button + result */}
      <div>
        <button
          onClick={handleResolve}
          disabled={state !== 'idle'}
          className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${
            state === 'done'
              ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
              : mode === 'action'
              ? 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60'
              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 disabled:opacity-60'
          }`}
        >
          {state === 'loading' && <Loader2 size={9} className="animate-spin" />}
          {state === 'done'    && <CheckCheck size={9} />}
          {state === 'idle' && mode === 'action' && <Zap size={9} />}
          {state === 'loading' ? 'Agent working…'
            : state === 'done'   ? 'Agent done'
            : mode === 'action'  ? 'Ask agent to resolve'
            :                      'Ask agent for guidance'}
        </button>

        {result && (
          <div className={`mt-1.5 p-2.5 rounded text-[10px] leading-relaxed border ${
            mode === 'action'
              ? 'bg-teal-50 border-teal-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`flex items-center gap-1 mb-1 font-semibold ${
              mode === 'action' ? 'text-teal-700' : 'text-blue-700'
            }`}>
              <CheckCheck size={10} />
              {mode === 'action' ? 'Action taken' : 'Guidance'}
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient row
// ---------------------------------------------------------------------------

function PatientRow({ patient, rank }: { patient: Patient; rank: number }) {
  const { selectPatient, beds, expediteCleaning } = useAppStore();
  const [expanded, setExpanded] = useState(rank <= 3);
  const [expediting, setExpediting] = useState(false);

  const bed = beds.find((b) => b.patientId === patient.id);
  const incompleteItems = patient.dischecklistItems.filter((i) => !i.completed).length;
  const totalItems = patient.dischecklistItems.length;
  const completedItems = totalItems - incompleteItems;
  const hasPendingLabs = patient.labs.some((l) => l.status === 'pending' || l.status === 'stat');
  const isReady = patient.blockers.length === 0 && incompleteItems === 0 && !hasPendingLabs;
  const isDischarged = isReady && patient.dischargeReadiness === 100;

  const handleExpediteCleaning = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bed?.id) return;
    if (expediting) return;
    setExpediting(true);
    try {
      await expediteCleaning(bed.id);
    } finally {
      setExpediting(false);
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${isReady ? 'opacity-60 grayscale' : ''}`}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-sm font-bold text-slate-300 w-5 text-center flex-shrink-0">
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
              className="text-sm font-semibold text-slate-800 hover:text-teal-600 transition-colors"
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

        {/* Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDischarged ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Cleaning
              </span>
              <button
                type="button"
                onClick={handleExpediteCleaning}
                disabled={!bed?.id || expediting}
                className="text-[10px] px-2 py-0.5 rounded border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-60"
              >
                {expediting ? 'Expediting…' : 'Expedite'}
              </button>
            </div>
          ) : isReady ? (
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

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60 space-y-2">
          {isReady && (
            <div className="flex items-center gap-2 text-xs text-green-700 py-1">
              <CheckCircle2 size={13} />
              All discharge tasks complete — patient is ready to go home.
            </div>
          )}

          {patient.blockers.map((b, i) => (
            <div key={i} className="p-2 rounded bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">{blockerIcon(b.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-700">{b.description}</div>
                  <ResolveButton patient={patient} blocker={b} />
                </div>
              </div>
            </div>
          ))}

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
// Actionable lab priority queue
// ---------------------------------------------------------------------------

interface LabEntry {
  patient: Patient;
  room: string;
  lab: Lab;
  isStatOverride?: boolean;   // nurse manually marked STAT
  expedited?: boolean;
}

type LabAction = 'stat' | 'expedite';
type LabActionState = 'idle' | 'loading' | 'done';

function LabCard({
  entry,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onMarkStat,
  onExpedite,
}: {
  entry: LabEntry;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMarkStat: () => void;
  onExpedite: () => void;
}) {
  const { selectPatient } = useAppStore();
  const [actionState, setActionState] = useState<Record<LabAction, LabActionState>>({
    stat: 'idle',
    expedite: 'idle',
  });

  const triggerAction = async (action: LabAction, fn: () => void) => {
    setActionState((s) => ({ ...s, [action]: 'loading' }));
    await new Promise((r) => setTimeout(r, 600));
    fn();
    setActionState((s) => ({ ...s, [action]: 'done' }));
  };

  const isStat = entry.lab.status === 'stat' || entry.isStatOverride;
  const isOverdue = (Date.now() - new Date(entry.lab.orderedAt).getTime()) / 3600000 >= 2;

  return (
    <div className={`rounded border p-2.5 ${
      isStat ? 'bg-red-50 border-red-200'
      : isOverdue ? 'bg-amber-50 border-amber-200'
      : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start gap-1.5">
        {/* Priority controls */}
        <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20 transition-colors"
            title="Increase priority"
          >
            <ArrowUp size={10} className="text-slate-500" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20 transition-colors"
            title="Decrease priority"
          >
            <ArrowDown size={10} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {isStat && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold uppercase tracking-wide flex-shrink-0">
                  STAT
                </span>
              )}
              <span className="text-xs font-semibold text-slate-800 truncate">{entry.lab.name}</span>
            </div>
            <div className={`text-[9px] font-bold flex-shrink-0 ${readinessClass(entry.patient.dischargeReadiness)}`}>
              DC {entry.patient.dischargeReadiness}
            </div>
          </div>

          <button
            onClick={() => selectPatient(entry.patient.id)}
            className="text-[10px] text-teal-600 hover:underline font-medium"
          >
            {entry.patient.name}
          </button>
          <span className="text-[10px] text-slate-400 ml-1">· {entry.room}</span>

          <div className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${labWaitClass(entry.lab.orderedAt)}`}>
            Ordered {minutesAgo(entry.lab.orderedAt)}
            {isOverdue && <span className="ml-1 font-semibold">· ⚠ Over 2hr TAT</span>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {!isStat && (
              <button
                onClick={() => triggerAction('stat', onMarkStat)}
                disabled={actionState.stat !== 'idle'}
                className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-semibold transition-colors ${
                  actionState.stat === 'done'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                }`}
              >
                {actionState.stat === 'loading' && <Loader2 size={8} className="animate-spin" />}
                {actionState.stat === 'done' ? '✓ Marked STAT' : 'Mark STAT'}
              </button>
            )}

            {!entry.expedited && (
              <button
                onClick={() => triggerAction('expedite', onExpedite)}
                disabled={actionState.expedite !== 'idle'}
                className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-semibold transition-colors ${
                  actionState.expedite === 'done'
                    ? 'bg-teal-100 text-teal-700 border border-teal-300'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {actionState.expedite === 'loading' && <Loader2 size={8} className="animate-spin" />}
                {actionState.expedite === 'done' ? '✓ Expedite sent' : 'Expedite'}
              </button>
            )}

            {entry.expedited && (
              <span className="text-[9px] text-teal-600 font-semibold">✓ Expedite requested</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LabPriorityQueue({ initialEntries }: { initialEntries: LabEntry[] }) {
  const [entries, setEntries] = useState<LabEntry[]>(initialEntries);

  const moveUp = (i: number) => {
    if (i === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveDown = (i: number) => {
    setEntries((prev) => {
      if (i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const markStat = (i: number) => {
    setEntries((prev) =>
      prev.map((e, idx) => idx === i ? { ...e, isStatOverride: true } : e)
    );
  };

  const markExpedited = (i: number) => {
    setEntries((prev) =>
      prev.map((e, idx) => idx === i ? { ...e, expedited: true } : e)
    );
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs">
        <FlaskConical size={20} className="mb-2 opacity-40" />
        No pending labs
      </div>
    );
  }

  const overdueCt = entries.filter(
    (e) => (Date.now() - new Date(e.lab.orderedAt).getTime()) / 3600000 >= 2
  ).length;

  return (
    <div className="space-y-1.5">
      {overdueCt > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-[10px] text-red-700 font-medium flex-shrink-0">
          ⚠ {overdueCt} lab{overdueCt > 1 ? 's' : ''} exceed the 2hr TAT target
        </div>
      )}
      {entries.map((e, i) => (
        <LabCard
          key={`${e.patient.id}-${e.lab.name}-${i}`}
          entry={e}
          index={i}
          total={entries.length}
          onMoveUp={() => moveUp(i)}
          onMoveDown={() => moveDown(i)}
          onMarkStat={() => markStat(i)}
          onExpedite={() => markExpedited(i)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main WorklistTab
// ---------------------------------------------------------------------------

export default function WorklistTab({ department }: { department?: Department }) {
  const { patients, beds, loading } = useAppStore();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // Filter patients to the selected department (match unit label)
  const deptPatients = department
    ? patients.filter((p) => p.unit === department.label)
    : patients;

  const isFullyReady = (p: Patient) =>
    p.blockers.length === 0 &&
    p.dischecklistItems.every((i) => i.completed) &&
    !p.labs.some((l) => l.status === 'pending' || l.status === 'stat');

  const sorted = [...deptPatients].sort((a, b) => {
    const ra = isFullyReady(a) ? 1 : 0;
    const rb = isFullyReady(b) ? 1 : 0;
    if (ra !== rb) return ra - rb; // ready goes last
    return b.dischargeReadiness - a.dischargeReadiness;
  });

  // Build initial lab queue: pending/stat labs sorted STAT first, then by patient readiness
  const labEntries: LabEntry[] = [];
  for (const patient of deptPatients) {
    const bed = beds.find((b) => b.patientId === patient.id);
    const room = bed?.room ?? '—';
    for (const lab of patient.labs) {
      if (lab.status === 'pending' || lab.status === 'stat') {
        labEntries.push({ patient, room, lab });
      }
    }
  }
  labEntries.sort((a, b) => {
    if (a.lab.status === 'stat' && b.lab.status !== 'stat') return -1;
    if (b.lab.status === 'stat' && a.lab.status !== 'stat') return 1;
    return b.patient.dischargeReadiness - a.patient.dischargeReadiness;
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <MetricsBar department={department} />

      {/* Sticky worklist header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Patient Worklist{department ? ` — ${department.label}` : ''}
          </h2>
          <p className="text-[11px] text-slate-400">
            Ordered by discharge readiness · {sorted.length} patients
          </p>
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

      {/* Scrollable patient list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {sorted.map((patient, i) => (
            <PatientRow key={patient.id} patient={patient} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
