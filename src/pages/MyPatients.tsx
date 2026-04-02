import { useAppStore } from '../store/useAppStore';
import PatientPanel from '../components/PatientPanel';
import { User, ArrowRight } from 'lucide-react';

// "My Patients" shows only patients assigned to Sarah Chen's physician team
// In a real system this would filter by the logged-in user's provider ID.
const MY_PHYSICIANS = ['Dr. Priya Anand', 'Dr. Mark Sullivan'];

function readinessColor(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function eddBadge(edd: string) {
  const today = new Date('2026-04-02');
  const diff = Math.floor((new Date(edd).getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'bg-red-100 text-red-700';
  if (diff === 0) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function eddText(edd: string) {
  const today = new Date('2026-04-02');
  const diff = Math.floor((new Date(edd).getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(edd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MyPatients() {
  const { patients, beds, loading, selectPatient } = useAppStore();

  const myPatients = patients
    .filter((p) => MY_PHYSICIANS.includes(p.physician))
    .sort((a, b) => b.dischargeReadiness - a.dischargeReadiness);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center gap-2">
          <User size={16} className="text-slate-500" />
          <h1 className="text-base font-bold text-slate-800">My Patients</h1>
          <span className="text-xs text-slate-400 ml-1">
            {MY_PHYSICIANS.join(', ')} teams
          </span>
          {!loading && (
            <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              {myPatients.length} patients
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            Loading…
          </div>
        ) : (
          <div className="space-y-2">
            {myPatients.map((patient) => {
              const bed = beds.find((b) => b.patientId === patient.id);
              const completedItems = patient.dischecklistItems.filter((i) => i.completed).length;
              const totalItems = patient.dischecklistItems.length;
              return (
                <div
                  key={patient.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-800">{patient.name}</h3>
                        <span className="text-[10px] text-slate-500">
                          Rm {bed?.room ?? '—'} · MRN {patient.mrn}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-2">{patient.diagnosis}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="text-slate-500">Physician: {patient.physician}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">LOS: {patient.losActual}d / {patient.losPredicted}d predicted</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">Checklist: {completedItems}/{totalItems}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className={`text-xl font-bold ${readinessColor(patient.dischargeReadiness)}`}>
                        {patient.dischargeReadiness}
                      </div>
                      <div className="text-[10px] text-slate-400 mb-1">readiness</div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${eddBadge(patient.edd)}`}>
                        {eddText(patient.edd)}
                      </span>
                    </div>
                  </div>

                  {patient.blockers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {patient.blockers.map((b, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          {b.description.length > 40 ? b.description.slice(0, 40) + '…' : b.description}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={() => selectPatient(patient.id)}
                      className="flex items-center gap-1 text-[10px] font-medium text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      Open patient panel <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PatientPanel />
    </>
  );
}
