import { BarChart2, Users, Stethoscope } from 'lucide-react';

// Projected hourly bed availability for next 24h
const HOURLY_DATA = [
  { hour: '10am', available: 6, incoming: 0 },
  { hour: '11am', available: 5, incoming: 1 },
  { hour: '12pm', available: 4, incoming: 2 },
  { hour: '1pm', available: 5, incoming: 1 },
  { hour: '2pm', available: 3, incoming: 3 },
  { hour: '3pm', available: 6, incoming: 0 },
  { hour: '4pm', available: 7, incoming: 0 },
  { hour: '5pm', available: 8, incoming: 0 },
  { hour: '6pm', available: 8, incoming: 0 },
  { hour: '7pm', available: 9, incoming: 0 },
  { hour: '8pm', available: 8, incoming: 1 },
  { hour: '9pm', available: 7, incoming: 0 },
  { hour: '10pm', available: 7, incoming: 0 },
  { hour: '11pm', available: 7, incoming: 0 },
  { hour: '12am', available: 8, incoming: 0 },
  { hour: '1am', available: 8, incoming: 0 },
  { hour: '2am', available: 9, incoming: 0 },
  { hour: '3am', available: 9, incoming: 0 },
  { hour: '4am', available: 9, incoming: 0 },
  { hour: '5am', available: 9, incoming: 0 },
  { hour: '6am', available: 8, incoming: 1 },
  { hour: '7am', available: 8, incoming: 0 },
  { hour: '8am', available: 7, incoming: 0 },
  { hour: '9am', available: 6, incoming: 1 },
];

const MAX_BEDS = 12;

const OR_CASES = [
  {
    id: 'or-001',
    patient: 'John Abramowitz',
    procedure: 'Right hemicolectomy',
    orTime: '07:30',
    expectedFloor: '14:00',
    bed: '410A',
    status: 'confirmed',
  },
  {
    id: 'or-002',
    patient: 'Susan Mwangi',
    procedure: 'Laparoscopic cholecystectomy',
    orTime: '09:00',
    expectedFloor: '14:30',
    bed: '412A',
    status: 'confirmed',
  },
  {
    id: 'or-003',
    patient: 'David Thornton',
    procedure: 'TURP',
    orTime: '11:00',
    expectedFloor: '16:00',
    bed: 'TBD',
    status: 'pending-bed',
  },
  {
    id: 'or-004',
    patient: 'Amy Kowalski',
    procedure: 'Appendectomy',
    orTime: '13:00',
    expectedFloor: '17:30',
    bed: 'TBD',
    status: 'pending-bed',
  },
];

const STAFFING = [
  { shift: 'Day (7a–7p)', rns: 6, target: 6, pcts: 2, targetPcts: 2 },
  { shift: 'Eve (3p–11p)', rns: 5, target: 6, pcts: 2, targetPcts: 2 },
  { shift: 'Night (7p–7a)', rns: 4, target: 5, pcts: 1, targetPcts: 2 },
];

export default function CapacityView() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <div>
        <h1 className="text-base font-bold text-slate-800 mb-1">Capacity Planning</h1>
        <p className="text-xs text-slate-500">4-North · Updated as of 10:05 AM</p>
      </div>

      {/* Projected Bed Availability Chart */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-700">Projected Bed Availability – Next 24h</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-1">
            {HOURLY_DATA.map((d, i) => {
              const availH = (d.available / MAX_BEDS) * 100;
              const incomingH = (d.incoming / MAX_BEDS) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-shrink-0 w-8 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    {/* available bar */}
                    <div
                      className="w-full bg-teal-400 rounded-sm transition-all"
                      style={{ height: `${availH}%` }}
                      title={`${d.available} available`}
                    />
                    {/* incoming overlay */}
                    {d.incoming > 0 && (
                      <div
                        className="absolute bottom-0 left-0 w-full bg-amber-400 opacity-70 rounded-sm"
                        style={{ height: `${incomingH}%` }}
                        title={`${d.incoming} incoming`}
                      />
                    )}
                  </div>
                  <div className="text-[8px] text-slate-400 rotate-45 origin-left mt-1 whitespace-nowrap">
                    {d.hour}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-teal-400 rounded-sm inline-block" />
              Available beds
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-amber-400 rounded-sm inline-block" />
              Incoming patients
            </span>
          </div>
        </div>
      </section>

      {/* OR Sync */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope size={14} className="text-purple-600" />
          <h2 className="text-sm font-bold text-slate-700">OR Sync – Today's Surgical Cases</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Procedure</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">OR Time</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Exp. Floor</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Bed</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OR_CASES.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{c.patient}</td>
                  <td className="px-3 py-2 text-slate-600">{c.procedure}</td>
                  <td className="px-3 py-2 text-slate-600">{c.orTime}</td>
                  <td className="px-3 py-2 text-slate-600">{c.expectedFloor}</td>
                  <td className="px-3 py-2">
                    <span className={c.bed === 'TBD' ? 'text-red-600 font-semibold' : 'text-teal-700 font-semibold'}>
                      {c.bed}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
                        c.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.status === 'confirmed' ? 'Confirmed' : 'Needs Bed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-amber-600 mt-2 font-medium">
          ⚠ 2 surgical cases need bed assignments. Consider expediting discharges in rooms 410A and 412A.
        </p>
      </section>

      {/* Staffing Alignment */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-slate-600" />
          <h2 className="text-sm font-bold text-slate-700">Staffing Alignment</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Shift</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">RNs</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">PCTs</th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {STAFFING.map((s) => {
                const rnOk = s.rns >= s.target;
                const pctOk = s.pcts >= s.targetPcts;
                const allOk = rnOk && pctOk;
                return (
                  <tr key={s.shift} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{s.shift}</td>
                    <td className="px-3 py-2">
                      <span className={rnOk ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                        {s.rns}/{s.target}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={pctOk ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                        {s.pcts}/{s.targetPcts}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
                          allOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {allOk ? 'Fully Staffed' : 'Under Staffed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
