import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/useAppStore';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import AlertBanner from './components/AlertBanner';
import MetricsBar from './components/MetricsBar';
import Dashboard from './pages/Dashboard';
import CapacityPage from './pages/CapacityPage';
import MyPatients from './pages/MyPatients';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
          {/* Left sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Top bar */}
            <TopBar />

            {/* Alert banner (below top bar) */}
            <AlertBanner />

            {/* Metrics strip */}
            <MetricsBar />

            {/* Page content */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/capacity" element={<CapacityPage />} />
              <Route path="/my-patients" element={<MyPatients />} />
            </Routes>
          </div>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
