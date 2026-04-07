import { useState } from 'react';
import {
  X, FlaskConical, CheckSquare, AlertTriangle, Clock,
  Truck, ClipboardList, Users, Package, Pill, Ban,
  ChevronDown, ChevronUp, Edit3, Check, CheckCircle2, Circle,
  Zap, Loader2, CheckCheck,
} from 'lucide-react';
// ExternalLink removed — app icon tiles no longer use it
import { useAppStore } from '../store/useAppStore';
import { Blocker, ChecklistItem, Lab, Patient } from '../types';
import { askAgent } from '../api/agent';
import AIChat from './AIChat';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readinessColor(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-600';
}

function readinessBg(score: number) {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-500';
}

function eddStyle(edd: string) {
  const today = new Date('2026-04-02');
  const d = new Date(edd);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff === 0) return 'text-amber-600 font-semibold';
  return 'text-slate-700';
}

function blockerIcon(type: Blocker['type']) {
  const cls = 'w-4 h-4 flex-shrink-0';
  switch (type) {
    case 'lab-pending': return <FlaskConical className={cls} />;
    case 'transport': return <Truck className={cls} />;
    case 'md-order': return <ClipboardList className={cls} />;
    case 'family': return <Users className={cls} />;
    case 'placement': return <Package className={cls} />;
    case 'medication': return <Pill className={cls} />;
    default: return <Ban className={cls} />;
  }
}

function labStatusBadge(status: Lab['status']) {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'resulted': return 'bg-green-100 text-green-700';
    case 'stat': return 'bg-red-100 text-red-700';
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// App shortcuts — SVG icons for the three most-used Cerner / Oracle Health apps
// ---------------------------------------------------------------------------

interface AppShortcut {
  name: string;
  icon: React.ReactNode;
  bg: string;
  href: string;
  tooltip: string;
}

const PowerChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <polyline
      points="1,12 4,12 6,4 8,20 10,12 14,12 15.5,8 17,16 19,12 23,12"
      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const PharmNetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <rect x="3" y="8" width="18" height="8" rx="4" stroke="white" strokeWidth="2.2"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2.2"/>
  </svg>
);

const FirstNetIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
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
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 shadow-sm transition-transform group-hover:scale-105 active:scale-95 ${shortcut.bg}`}>
        {shortcut.icon}
      </div>
      <span className="text-[9px] font-medium text-slate-500 group-hover:text-slate-700 leading-none text-center w-10 truncate">
        {shortcut.name}
      </span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type BlockerAgentState = 'idle' | 'loading' | 'done';
type BlockerResolveMode = 'action' | 'advisory';

function blockerResolveMode(b: Blocker): BlockerResolveMode {
  if (['transport', 'md-order', 'medication'].includes(b.type)) return 'action';
  if (b.type === 'lab-pending' && b.resolvable) return 'action';
  return 'advisory';
}

function blockerActionPrompt(patient: Patient, b: Blocker): string {
  switch (b.type) {
    case 'transport':
      return `Submit a transport request for ${patient.name} (${patient.diagnosis}). Blocker: "${b.description}". Confirm what was sent.`;
    case 'md-order':
      return `Page ${patient.physician} with an urgent discharge order request for ${patient.name} (${patient.diagnosis}). Blocker: "${b.description}". Confirm what was sent.`;
    case 'medication':
      return `Notify pharmacy and draft a medication reconciliation order for ${patient.name} (${patient.diagnosis}). Blocker: "${b.description}". Confirm what was done.`;
    case 'lab-pending':
      return `Escalate the pending lab to STAT for ${patient.name} (${patient.diagnosis}). Blocker: "${b.description}". Confirm escalation.`;
    default:
      return `Resolve this discharge blocker for ${patient.name}: "${b.description}"`;
  }
}

function blockerAdvisoryPrompt(patient: Patient, b: Blocker): string {
  switch (b.type) {
    case 'family':
      return `Provide brief step-by-step next actions for a nurse to resolve this family blocker for ${patient.name}: "${b.description}"`;
    case 'placement':
      return `Provide brief step-by-step next actions to resolve this placement blocker for ${patient.name}: "${b.description}"`;
    case 'lab-pending':
      return `Provide brief guidance on what to do while waiting for this lab result for ${patient.name}: "${b.description}"`;
    default:
      return `Provide brief next steps to resolve this discharge blocker for ${patient.name}: "${b.description}"`;
  }
}

function BlockerCard({ patient, blocker }: { patient: Patient; blocker: Blocker }) {
  const { resolveBlocker } = useAppStore();
  const [agentState, setAgentState] = useState<BlockerAgentState>('idle');
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const mode = blockerResolveMode(blocker);
  const appShortcut = BLOCKER_APP[blocker.type];

  const handleAskAgent = async () => {
    if (agentState !== 'idle') return;
    setAgentState('loading');
    const prompt = mode === 'action'
      ? blockerActionPrompt(patient, blocker)
      : blockerAdvisoryPrompt(patient, blocker);
    const res = await askAgent(patient, prompt);
    setAgentResult(res);
    await resolveBlocker(patient.id, blocker);
    setAgentState('done');
  };

  return (
    <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">{blockerIcon(blocker.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-700 leading-tight mb-2">
            {blocker.description}
          </div>

          <div className="flex items-end gap-3">
            {/* App icon tile */}
            {appShortcut && <AppShortcutButton shortcut={appShortcut} />}

            {/* Agent button */}
            {(blocker.resolvable || mode === 'advisory') && (
              <button
                onClick={handleAskAgent}
                disabled={agentState !== 'idle'}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded font-semibold transition-colors ${
                  agentState === 'done'
                    ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                    : mode === 'action'
                    ? 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60'
                    : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 disabled:opacity-60'
                }`}
              >
                {agentState === 'loading' && <Loader2 size={9} className="animate-spin" />}
                {agentState === 'done'    && <CheckCheck size={9} />}
                {agentState === 'idle' && mode === 'action' && <Zap size={9} />}
                {agentState === 'loading' ? 'Working…'
                  : agentState === 'done'  ? 'Done'
                  : mode === 'action'       ? 'Ask agent'
                  :                          'Get guidance'}
              </button>
            )}
          </div>

          {/* Agent response */}
          {agentResult && (
            <div className={`mt-2 p-2.5 rounded text-[10px] leading-relaxed border ${
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
              <p className="whitespace-pre-wrap text-slate-700">{agentResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockersSection({ patient }: { patient: Patient }) {
  if (patient.blockers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-xs py-1">
        <Check size={13} />
        No active discharge blockers
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {patient.blockers.map((b, i) => (
        <BlockerCard key={i} patient={patient} blocker={b} />
      ))}
    </div>
  );
}

function ChecklistSection({ patient }: { patient: Patient }) {
  const items = patient.dischecklistItems;
  const completed = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  const categories: ChecklistItem['category'][] = ['clinical', 'orders', 'logistics', 'education'];
  const catLabels: Record<ChecklistItem['category'], string> = {
    clinical: 'Clinical',
    orders: 'Orders',
    logistics: 'Logistics',
    education: 'Education',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-medium">
            {completed}/{items.length} complete
          </span>
          <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            Auto-synced from Cerner
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${readinessBg(pct)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-bold ${readinessColor(pct)}`}>{pct}%</span>
        </div>
      </div>
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} className="mb-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {catLabels[cat]}
            </div>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2"
                >
                  {item.completed ? (
                    <CheckCircle2 size={13} className="text-teal-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={13} className="text-slate-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs leading-tight ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LabsSection({ patient }: { patient: Patient }) {
  if (patient.labs.length === 0) {
    return <div className="text-xs text-slate-400 py-1">No labs ordered.</div>;
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="text-left text-[10px] font-semibold text-slate-400 pb-1 pr-2">Test</th>
          <th className="text-left text-[10px] font-semibold text-slate-400 pb-1 pr-2">Status</th>
          <th className="text-left text-[10px] font-semibold text-slate-400 pb-1 pr-2">Ordered</th>
          <th className="text-left text-[10px] font-semibold text-slate-400 pb-1">Result</th>
        </tr>
      </thead>
      <tbody>
        {patient.labs.map((lab, i) => (
          <tr key={i} className="border-b border-slate-50">
            <td className="py-1 pr-2 font-medium text-slate-700">{lab.name}</td>
            <td className="py-1 pr-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${labStatusBadge(lab.status)}`}>
                {lab.status}
              </span>
            </td>
            <td className="py-1 pr-2 text-slate-500">
              {formatDate(lab.orderedAt)} {formatTime(lab.orderedAt)}
            </td>
            <td className="py-1 text-slate-500 max-w-[120px] truncate" title={lab.result}>
              {lab.result ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type SectionKey = 'blockers' | 'checklist' | 'labs' | 'ai';

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export default function PatientPanel() {
  const { patients, beds, selectedPatientId, selectPatient, updateEDD } = useAppStore();
  const [editingEDD, setEditingEDD] = useState(false);
  const [eddDraft, setEddDraft] = useState('');
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    blockers: false,
    checklist: false,
    labs: false,
    ai: false,
  });

  if (!selectedPatientId) return null;

  const patient = patients.find((p) => p.id === selectedPatientId);
  if (!patient) return null;

  const bed = beds.find((b) => b.patientId === patient.id);

  const toggleSection = (key: SectionKey) =>
    setCollapsed((s) => ({ ...s, [key]: !s[key] }));

  const handleEDDSave = async () => {
    if (eddDraft) await updateEDD(patient.id, eddDraft);
    setEditingEDD(false);
  };

  const startEditEDD = () => {
    setEddDraft(patient.edd);
    setEditingEDD(true);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => selectPatient(null)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 bg-slate-800 text-white flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold leading-tight">{patient.name}</h2>
            <div className="text-xs text-slate-300 mt-0.5 space-x-2">
              <span>MRN: {patient.mrn}</span>
              <span>·</span>
              <span>Bed: {bed?.room ?? '—'}</span>
              <span>·</span>
              <span>{patient.physician}</span>
            </div>
          </div>
          <button
            onClick={() => selectPatient(null)}
            className="p-1 rounded hover:bg-slate-700 transition-colors ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Key metrics row */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3">
            {/* Discharge Readiness */}
            <div className="text-center">
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">
                DC Readiness
              </div>
              <div className={`text-2xl font-bold ${readinessColor(patient.dischargeReadiness)}`}>
                {patient.dischargeReadiness}
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full ${readinessBg(patient.dischargeReadiness)}`}
                  style={{ width: `${patient.dischargeReadiness}%` }}
                />
              </div>
            </div>

            {/* LOS */}
            <div className="text-center border-x border-slate-200">
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">
                LOS
              </div>
              <div className="text-sm font-bold text-slate-700">
                {patient.losActual}d actual
              </div>
              <div className="text-[10px] text-slate-400">{patient.losPredicted}d predicted</div>
            </div>

            {/* EDD */}
            <div className="text-center">
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1">
                EDD
              </div>
              {editingEDD ? (
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="date"
                    value={eddDraft}
                    onChange={(e) => setEddDraft(e.target.value)}
                    className="text-[10px] border border-teal-400 rounded px-1 py-0.5 w-full text-center"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleEDDSave}
                      className="text-[9px] px-1.5 py-0.5 bg-teal-600 text-white rounded font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingEDD(false)}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startEditEDD}
                  className="flex flex-col items-center gap-0.5 group w-full"
                >
                  <span className={`text-sm font-bold ${eddStyle(patient.edd)}`}>
                    {new Date(patient.edd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] text-slate-400 group-hover:text-teal-600">
                    <Edit3 size={9} />
                    Edit
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Patient info */}
          <div className="px-4 py-2 border-b border-slate-200 bg-white">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-slate-400">Diagnosis: </span>
                <span className="text-slate-700 font-medium">{patient.diagnosis}</span>
              </div>
              <div>
                <span className="text-slate-400">Age: </span>
                <span className="text-slate-700">{patient.age} yrs</span>
              </div>
              <div>
                <span className="text-slate-400">Unit: </span>
                <span className="text-slate-700">{patient.unit}</span>
              </div>
              <div>
                <span className="text-slate-400">Admit: </span>
                <span className="text-slate-700">
                  {new Date(patient.admitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="divide-y divide-slate-100">
            {/* Blockers */}
            <Section
              icon={<AlertTriangle size={12} className="text-amber-500" />}
              title="Discharge Blockers"
              count={patient.blockers.length}
              collapsed={collapsed.blockers}
              onToggle={() => toggleSection('blockers')}
            >
              <BlockersSection patient={patient} />
            </Section>

            {/* Checklist */}
            <Section
              icon={<CheckSquare size={12} className="text-teal-600" />}
              title="Discharge Checklist"
              count={patient.dischecklistItems.filter((i) => i.completed).length}
              total={patient.dischecklistItems.length}
              collapsed={collapsed.checklist}
              onToggle={() => toggleSection('checklist')}
            >
              <ChecklistSection patient={patient} />
            </Section>

            {/* Labs */}
            <Section
              icon={<FlaskConical size={12} className="text-purple-600" />}
              title="Labs"
              count={patient.labs.filter((l) => l.status === 'pending' || l.status === 'stat').length}
              countLabel="pending"
              collapsed={collapsed.labs}
              onToggle={() => toggleSection('labs')}
            >
              <LabsSection patient={patient} />
            </Section>

            {/* AI Chat */}
            <Section
              icon={<Clock size={12} className="text-slate-600" />}
              title="AI Assistant"
              collapsed={collapsed.ai}
              onToggle={() => toggleSection('ai')}
            >
              <AIChat patient={patient} />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  icon,
  title,
  count,
  total,
  countLabel,
  collapsed,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  total?: number;
  countLabel?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {icon}
        <span className="text-xs font-bold text-slate-700 flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
            {total !== undefined ? `${count}/${total}` : `${count}${countLabel ? ' ' + countLabel : ''}`}
          </span>
        )}
        {collapsed ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronUp size={12} className="text-slate-400" />}
      </button>
      {!collapsed && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
