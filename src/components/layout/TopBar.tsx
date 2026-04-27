import { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const DEPARTMENTS = [
  { id: 'icu',      label: 'ICU',              sub: 'Intensive Care Unit' },
  { id: '4-north',  label: '4-North',          sub: 'Medical/Surgical' },
  { id: '3-south',  label: '3-South',          sub: 'Medical/Surgical' },
  { id: 'pacu',     label: 'PACU',             sub: 'Post-Anesthesia Care' },
  { id: 'ed',       label: 'Emergency Dept',   sub: 'Emergency' },
  { id: '5-east',   label: '5-East',           sub: 'Oncology' },
  { id: 'ccu',      label: 'Cardiac Care',     sub: 'Cardiac Care Unit' },
];

export type Department = (typeof DEPARTMENTS)[number];

export default function TopBar({
  selectedDept,
  onDeptChange,
}: {
  selectedDept: Department;
  onDeptChange: (dept: Department) => void;
}) {
  const { alerts, refresh, loading } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [deptOpen, setDeptOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = alerts.filter((a) => !a.snoozed).length;
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200 flex-shrink-0">

      {/* Left: department switcher */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDeptOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
        >
          <div className="w-6 h-6 rounded bg-red-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">USC</span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
              {selectedDept.label}
            </div>
            <div className="text-[10px] text-slate-400">{selectedDept.sub}</div>
          </div>
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform ml-1 ${deptOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {deptOpen && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Keck Medicine of USC
            </div>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => { onDeptChange(dept); setDeptOpen(false); }}
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-700">{dept.label}</div>
                  <div className="text-[10px] text-slate-400">{dept.sub}</div>
                </div>
                {selectedDept.id === dept.id && (
                  <Check size={13} className="text-teal-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: date/time */}
      <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
        <span>{formatted}</span>
        <span className="mx-1">·</span>
        <span className="font-medium text-slate-700">{time}</span>
      </div>

      {/* Right: user + notifications */}
      <div className="flex items-center gap-3">
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>

        <button className="relative p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full">
              {unread}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            SC
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-semibold text-slate-700">Sarah Chen</div>
            <div className="text-[10px] text-slate-500">RN</div>
          </div>
        </div>
      </div>
    </header>
  );
}
