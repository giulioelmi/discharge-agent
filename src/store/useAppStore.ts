import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  createElement,
} from 'react';
import { Bed, Patient, Alert, DailyMetrics, Blocker } from '../types';
import {
  fetchBeds,
  fetchPatients,
  fetchAlerts,
  fetchMetrics,
  updateChecklist as apiUpdateChecklist,
  snoozeAlert as apiSnoozeAlert,
  updateEDD as apiUpdateEDD,
  startMockCernerStream,
  applyResolveOutcome,
  expediteCleaning as apiExpediteCleaning,
} from '../api/cerner';

interface AppState {
  beds: Bed[];
  patients: Patient[];
  alerts: Alert[];
  metrics: DailyMetrics | null;
  selectedPatientId: string | null;
  loading: boolean;
  error: string | null;
}

interface AppActions {
  selectPatient: (id: string | null) => void;
  updateChecklist: (patientId: string, itemId: string, completed: boolean) => Promise<void>;
  snoozeAlert: (alertId: string) => Promise<void>;
  updateEDD: (patientId: string, edd: string) => Promise<void>;
  resolveBlocker: (patientId: string, blocker: Blocker) => Promise<void>;
  expediteCleaning: (bedId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

function useAppStoreInternal(): AppContextType {
  const [state, setState] = useState<AppState>({
    beds: [],
    patients: [],
    alerts: [],
    metrics: null,
    selectedPatientId: null,
    loading: true,
    error: null,
  });

  const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false';

  const loadAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [beds, patients, alerts, metrics] = await Promise.all([
        fetchBeds(),
        fetchPatients(),
        fetchAlerts(),
        fetchMetrics(),
      ]);
      setState((s) => ({ ...s, beds, patients, alerts, metrics, loading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, []);

  // Silent sync (used for background polling so the UI looks “live”)
  const syncAll = useCallback(async () => {
    try {
      const [beds, patients, alerts, metrics] = await Promise.all([
        fetchBeds(),
        fetchPatients(),
        fetchAlerts(),
        fetchMetrics(),
      ]);
      setState((s) => ({ ...s, beds, patients, alerts, metrics }));
    } catch {
      // ignore transient sync errors
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // In mock mode, start the simulated stream and poll quietly.
  useEffect(() => {
    if (!MOCK_MODE) return;
    startMockCernerStream();
    const id = window.setInterval(() => {
      syncAll();
    }, 2500);
    return () => window.clearInterval(id);
  }, [MOCK_MODE, syncAll]);

  const selectPatient = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedPatientId: id }));
  }, []);

  const updateChecklistItem = useCallback(
    async (patientId: string, itemId: string, completed: boolean) => {
      // Optimistic update
      setState((s) => ({
        ...s,
        patients: s.patients.map((p) => {
          if (p.id !== patientId) return p;
          const nextItems = p.dischecklistItems.map((item) =>
            item.id === itemId ? { ...item, completed } : item
          );
          const hasBlockers = p.blockers.length > 0;
          const hasIncompleteChecklist = nextItems.some((i) => !i.completed);
          const hasPendingLabs = p.labs.some((l) => l.status === 'pending' || l.status === 'stat');
          const fullyReady = !hasBlockers && !hasIncompleteChecklist && !hasPendingLabs;

          return {
            ...p,
            dischecklistItems: nextItems,
            dischargeReadiness: fullyReady ? 100 : Math.min(p.dischargeReadiness, 99),
          };
        }),
      }));
      await apiUpdateChecklist(patientId, itemId, completed);
    },
    []
  );

  const snoozeAlertItem = useCallback(async (alertId: string) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, snoozed: true } : a)),
    }));
    await apiSnoozeAlert(alertId);
  }, []);

  const updatePatientEDD = useCallback(async (patientId: string, edd: string) => {
    setState((s) => ({
      ...s,
      patients: s.patients.map((p) => (p.id === patientId ? { ...p, edd } : p)),
    }));
    await apiUpdateEDD(patientId, edd);
  }, []);

  const resolveBlocker = useCallback(async (patientId: string, blocker: Blocker) => {
    // Optimistic: bump readiness and (if resolvable) remove the blocker + auto-complete some checklist
    setState((s) => ({
      ...s,
      patients: s.patients.map((p) => {
        if (p.id !== patientId) return p;
        const nextBlockers = blocker.resolvable
          ? p.blockers.filter((b) => !(b.type === blocker.type && b.description === blocker.description))
          : p.blockers;

        // Complete up to 1 remaining checklist item to simulate downstream completion.
        let completedOne = false;
        const nextItems = p.dischecklistItems.map((it) => {
          if (completedOne || it.completed) return it;
          completedOne = true;
          return { ...it, completed: true };
        });

        const hasBlockers = nextBlockers.length > 0;
        const hasIncompleteChecklist = nextItems.some((i) => !i.completed);
        const hasPendingLabs = p.labs.some((l) => l.status === 'pending' || l.status === 'stat');
        const fullyReady = !hasBlockers && !hasIncompleteChecklist && !hasPendingLabs;
        const nextReadiness = fullyReady
          ? 100
          : Math.min(99, p.dischargeReadiness + 8);

        return {
          ...p,
          dischargeReadiness: nextReadiness,
          blockers: nextBlockers,
          dischecklistItems: nextItems,
        };
      }),
    }));

    await applyResolveOutcome(patientId, blocker);
    // Pull fresh data so the UI reflects the same source of truth as other tabs.
    syncAll();
  }, [syncAll]);

  const expediteCleaning = useCallback(
    async (bedId: string) => {
      // Optimistic: free the bed immediately and remove the discharged patient.
      setState((s) => {
        const bed = s.beds.find((b) => b.id === bedId);
        const dischargedPatientId = bed?.patientId;
        return {
          ...s,
          beds: s.beds.map((b) =>
            b.id === bedId ? { ...b, status: 'available', patientId: undefined } : b
          ),
          patients: dischargedPatientId
            ? s.patients.filter((p) => p.id !== dischargedPatientId)
            : s.patients,
        };
      });

      await apiExpediteCleaning(bedId);
      syncAll();
    },
    [syncAll]
  );

  return {
    ...state,
    selectPatient,
    updateChecklist: updateChecklistItem,
    snoozeAlert: snoozeAlertItem,
    updateEDD: updatePatientEDD,
    resolveBlocker,
    expediteCleaning,
    refresh: loadAll,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useAppStoreInternal();
  return createElement(AppContext.Provider, { value: store }, children);
}

export function useAppStore(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
