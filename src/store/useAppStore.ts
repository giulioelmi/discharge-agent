import { createContext, useContext, useState, useEffect, useCallback, ReactNode, createElement } from 'react';
import { Bed, Patient, Alert, DailyMetrics } from '../types';
import { fetchBeds, fetchPatients, fetchAlerts, fetchMetrics, updateChecklist as apiUpdateChecklist, snoozeAlert as apiSnoozeAlert, updateEDD as apiUpdateEDD } from '../api/cerner';

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

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
          return {
            ...p,
            dischecklistItems: p.dischecklistItems.map((item) =>
              item.id === itemId ? { ...item, completed } : item
            ),
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

  return {
    ...state,
    selectPatient,
    updateChecklist: updateChecklistItem,
    snoozeAlert: snoozeAlertItem,
    updateEDD: updatePatientEDD,
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
