import { useAppStore } from '../store/useAppStore';
import { Patient } from '../types';
import { LogOut, ArrowRight, Loader2 } from 'lucide-react';

function readinessColor(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function blockerTag(patient: Patient) {
  if (patient.blockers.length === 0) return null;
  const b = patient.blockers[0];
  const labels: Record<string, { label: string; style: string }> = {
    'lab-pending': { label: 'Lab Pending', style: 'bg-purple-100 text-purple-700' },
    transport: { label: 'Transport', style: 'bg-blue-100 text-blue-700' },
    'md-order': { label: 'MD Order', style: 'bg-orange-100 text-orange-700' },
    family: { label: 'Family', style: 'bg-pink-100 text-pink-700' },
    placement: { label: 'Placement', style: 'bg-indigo-100 text-indigo-700' },
    medication: { label: 'Medication', style: 'bg-yellow-100 text-yellow-700' },
    none: { label: 'None', style: 'bg-green-100 text-green-700' },
  };
  const cfg = labels[b.type] ?? labels.none;
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${cfg.style}`}>
      {cfg.label}
    </span>
  );
}

function eddLabel(edd: string) {
  const today = new Date('2026-04-02');
  const eddDate = new Date(edd);
  const diff = Math.floor((eddDate.getTime() - today.getTime()) / 86400000);
  if (diff < 0)
    return <span className="text-red-600 font-semibold text-[10px]">{Math.abs(diff)}d overdue</span>;
  if (diff === 0)
    return <span className="text-amber-600 font-semibold text-[10px]">Today</span>;
  if (diff === 1)
    return <span className="text-slate-500 text-[10px]">Tomorrow</span>;
  return (
    <span className="text-slate-400 text-[10px]">
      {eddDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </span>
  );
}

function getRoomForPatient(patientId: string, beds: ReturnType<typeof useAppStore>['beds']) {
  return beds.find((b) => b.patientId === patientId)?.room ?? '—';
}

export default function DischargeQueue() {
  const { patients, beds, loading, selectPatient } = useAppStore();

  const sorted = [...patients].sort((a, b) => b.dischargeReadiness - a.dischargeReadiness);

  return (
    <div className="w-64 xl:w-72 flex flex-col border-l border-slate-200 bg-white flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <LogOut size={13} className="text-teal-600" />
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Discharge Queue
        </h2>
        <span className="ml-auto text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
          {patients.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        ) : (
          sorted.map((patient) => {
            const room = getRoomForPatient(patient.id, beds);
            return (
              <div
                key={patient.id}
                className="flex flex-col gap-1.5 px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                      {patient.name}
                    </div>
                    <div className="text-[10px] text-slate-500">Room {room}</div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${readinessColor(patient.dischargeReadiness)}`}>
                    {patient.dischargeReadiness}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {eddLabel(patient.edd)}
                    {blockerTag(patient)}
                  </div>
                </div>

                <button
                  onClick={() => selectPatient(patient.id)}
                  className="flex items-center gap-1 text-[10px] font-medium text-teal-600 hover:text-teal-800 transition-colors mt-0.5"
                >
                  Open <ArrowRight size={10} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
