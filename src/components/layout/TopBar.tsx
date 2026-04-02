import { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TopBar() {
  const { alerts, refresh, loading } = useAppStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const unread = alerts.filter((a) => !a.snoozed).length;

  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
      {/* Left: app identity */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-800">FlowBoard</h1>
        <span className="hidden sm:block text-xs text-slate-500">Discharge Optimization</span>
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
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">RN</span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-700 uppercase tracking-wide">
                4-North
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
