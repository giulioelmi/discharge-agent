import { BarChart2, Users, Stethoscope } from 'lucide-react';
import MetricsBar from './MetricsBar';
import type { Department } from './layout/TopBar';
import { useState } from 'react';

type HourPoint = { hour: string; available: number; incoming: number };
type OrCase = {
  id: string;
  patient: string;
  procedure: string;
  orTime: string;
  expectedFloor: string;
  bed: string;
  status: 'confirmed' | 'pending-bed';
};
type StaffingRow = { shift: string; rns: number; target: number; pcts: number; targetPcts: number };

const DATA_4NORTH = {
  maxBeds: 12,
  hourly: [
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
  ] satisfies HourPoint[],
  orCases: [
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
  ] satisfies OrCase[],
  staffing: [
    { shift: 'Day (7a–7p)', rns: 6, target: 6, pcts: 2, targetPcts: 2 },
    { shift: 'Eve (3p–11p)', rns: 5, target: 6, pcts: 2, targetPcts: 2 },
    { shift: 'Night (7p–7a)', rns: 4, target: 5, pcts: 1, targetPcts: 2 },
  ] satisfies StaffingRow[],
};

const CAPACITY_BY_DEPT: Record<string, { maxBeds: number; hourly: HourPoint[]; orCases: OrCase[]; staffing: StaffingRow[]; note?: string }> = {
  '4-north': {
    ...DATA_4NORTH,
    note: '⚠ 2 surgical cases need bed assignments. Consider expediting discharges in rooms 410A and 412A.',
  },
  icu: {
    maxBeds: 18,
    hourly: DATA_4NORTH.hourly.map((p) => ({
      ...p,
      available: Math.max(0, Math.min(18, p.available - 2)),
      incoming: Math.min(4, p.incoming + (p.hour === '2pm' || p.hour === '3pm' ? 1 : 0)),
    })),
    orCases: [
      {
        id: 'icu-001',
        patient: 'Samuel Greer',
        procedure: 'Post-op monitoring (CABG)',
        orTime: '08:15',
        expectedFloor: '12:30',
        bed: 'ICU-03',
        status: 'confirmed',
      },
      {
        id: 'icu-002',
        patient: 'Emily Zhao',
        procedure: 'Neuro ICU admit (ICH)',
        orTime: '—',
        expectedFloor: '13:10',
        bed: 'TBD',
        status: 'pending-bed',
      },
    ],
    staffing: [
      { shift: 'Day (7a–7p)', rns: 9, target: 10, pcts: 3, targetPcts: 3 },
      { shift: 'Eve (3p–11p)', rns: 8, target: 9, pcts: 3, targetPcts: 3 },
      { shift: 'Night (7p–7a)', rns: 7, target: 8, pcts: 2, targetPcts: 3 },
    ],
    note: '⚠ ICU surge expected 2–4pm. Monitor incoming transfers.',
  },
  pacu: {
    maxBeds: 10,
    hourly: DATA_4NORTH.hourly.map((p) => ({
      ...p,
      available: Math.max(0, Math.min(10, Math.round(p.available * 0.6))),
      incoming: Math.min(5, p.incoming + (p.hour === '12pm' || p.hour === '1pm' ? 2 : 0)),
    })),
    orCases: [
      {
        id: 'pacu-001',
        patient: 'Alicia Romero',
        procedure: 'Total knee arthroplasty',
        orTime: '10:30',
        expectedFloor: '13:00',
        bed: 'PACU-06',
        status: 'confirmed',
      },
      {
        id: 'pacu-002',
        patient: 'Glen Matthews',
        procedure: 'Hernia repair',
        orTime: '11:45',
        expectedFloor: '14:15',
        bed: 'TBD',
        status: 'pending-bed',
      },
    ],
    staffing: [
      { shift: 'Day (7a–7p)', rns: 5, target: 5, pcts: 2, targetPcts: 2 },
      { shift: 'Eve (3p–11p)', rns: 4, target: 5, pcts: 1, targetPcts: 2 },
      { shift: 'Night (7p–7a)', rns: 2, target: 3, pcts: 0, targetPcts: 1 },
    ],
    note: '⚠ PACU peak throughput 12–2pm. Ensure floor bed assignments are ready.',
  },
};

export default function CapacityView({ department }: { department?: Department }) {
  const deptLabel = department?.label ?? '4-North';
  const deptId = department?.id ?? '4-north';
  const data = CAPACITY_BY_DEPT[deptId] ?? CAPACITY_BY_DEPT['4-north'];
  const [showAvailable, setShowAvailable] = useState(true);
  const [showIncoming, setShowIncoming] = useState(true);
  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <MetricsBar />
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-base font-bold text-slate-800 mb-1">Capacity Planning</h1>
        <p className="text-xs text-slate-500">{deptLabel} · Updated as of 10:05 AM</p>
      </div>

      {/* Projected Bed Availability Chart */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-700">Projected Bed Availability – Next 24h</h2>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-1">
            {data.hourly.map((d, i) => {
              const availH = (d.available / data.maxBeds) * 100;
              const incomingH = (d.incoming / data.maxBeds) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-shrink-0 w-8 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    {/* available bar */}
                    {showAvailable && (
                      <div
                        className="w-full bg-teal-400 rounded-sm transition-all"
                        style={{ height: `${availH}%` }}
                        title={`${d.available} available`}
                      />
                    )}
                    {/* incoming overlay */}
                    {showIncoming && d.incoming > 0 && (
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
            <button
              type="button"
              onClick={() => setShowAvailable((v) => !v)}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-slate-100 ${
                showAvailable ? 'bg-slate-200 text-slate-700 font-semibold' : ''
              }`}
              title={showAvailable ? 'Hide Available beds' : 'Show Available beds'}
            >
              <span className="w-3 h-2 bg-teal-400 rounded-sm inline-block" />
              Available beds
            </button>
            <button
              type="button"
              onClick={() => setShowIncoming((v) => !v)}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-slate-100 ${
                showIncoming ? 'bg-slate-200 text-slate-700 font-semibold' : ''
              }`}
              title={showIncoming ? 'Hide Incoming patients' : 'Show Incoming patients'}
            >
              <span className="w-3 h-2 bg-amber-400 rounded-sm inline-block" />
              Incoming patients
            </button>
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
              {data.orCases.map((c) => (
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
        {data.note && (
          <p className="text-[10px] text-amber-600 mt-2 font-medium">
            {data.note}
          </p>
        )}
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
              {data.staffing.map((s) => {
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
    </div>
  );
}
