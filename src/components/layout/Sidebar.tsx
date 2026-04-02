import { NavLink } from 'react-router-dom';
import { Activity, BarChart2, User, Settings, Zap } from 'lucide-react';

const navItems = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/capacity', icon: BarChart2, label: 'Capacity' },
  { to: '/my-patients', icon: User, label: 'My Patients' },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-16 lg:w-56 bg-navy-900 text-slate-300 flex-shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-navy-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500 flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <span className="hidden lg:block font-bold text-white text-base tracking-tight">
          FlowBoard
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-700 text-white'
                  : 'text-slate-400 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-navy-700">
        <button className="flex items-center gap-3 px-2 py-2 w-full rounded-md text-sm font-medium text-slate-400 hover:bg-navy-800 hover:text-white transition-colors">
          <Settings size={18} className="flex-shrink-0" />
          <span className="hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  );
}
