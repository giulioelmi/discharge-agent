import { useState } from 'react';
import { AppProvider } from './store/useAppStore';
import LoginGate from './components/LoginGate';
import TopBar, { DEPARTMENTS } from './components/layout/TopBar';
import PatientPanel from './components/PatientPanel';
import WorklistTab from './components/WorklistTab';
import CapacityView from './components/CapacityView';
import BedBoard from './components/BedBoard';
import { ClipboardList, BarChart2, LayoutGrid } from 'lucide-react';

type Tab = 'worklist' | 'capacity' | 'beds';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'worklist',  label: 'Worklist',            icon: <ClipboardList size={15} /> },
  { id: 'capacity',  label: 'Capacity Management', icon: <BarChart2 size={15} /> },
  { id: 'beds',      label: 'Bed Dashboard',        icon: <LayoutGrid size={15} /> },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? 'border-teal-500 text-teal-600 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('worklist');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      <TopBar selectedDept={department} onDeptChange={setDepartment} />
      <TabBar active={tab} onChange={setTab} />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === 'worklist'  && <WorklistTab department={department} />}
        {tab === 'capacity'  && <CapacityView department={department} />}
        {tab === 'beds'      && <BedBoard department={department} />}
      </div>

      {/* Patient panel is global — floats over any tab */}
      <PatientPanel />
    </div>
  );
}

export default function App() {
  return (
    <LoginGate>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </LoginGate>
  );
}
