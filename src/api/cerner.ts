/**
 * src/api/cerner.ts
 *
 * This is the ONLY file that talks to Cerner.
 * Currently returns mock data. To connect to real Cerner:
 *  1. Set VITE_MOCK_MODE=false in your .env
 *  2. Set VITE_CERNER_BASE_URL in .env (e.g. https://fhir.cerner.com/r4)
 *  3. Add SMART on FHIR auth token handling (see getAuthHeaders below)
 *  4. Replace the stub implementations below with real fetch() calls
 */

import { Bed, Patient, Alert, DailyMetrics, Blocker } from '../types';
import { MOCK_BEDS } from '../mock/beds';
import { MOCK_PATIENTS } from '../mock/patients';
import { MOCK_ALERTS } from '../mock/alerts';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false'; // default true
const BASE_URL = import.meta.env.VITE_CERNER_BASE_URL ?? '';

/** Simulates network latency in mock mode */
const delay = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Returns authorization headers for real Cerner SMART on FHIR calls.
 * In production, retrieve the access token from your SMART auth flow.
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cerner_access_token') ?? '';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/fhir+json',
    Accept: 'application/fhir+json',
  };
}

// ---------------------------------------------------------------------------
// In-memory mock state (mutated by update functions below)
// ---------------------------------------------------------------------------

let _beds: Bed[] = structuredClone(MOCK_BEDS);
let _patients: Patient[] = structuredClone(MOCK_PATIENTS);
let _alerts: Alert[] = structuredClone(MOCK_ALERTS);

// ---------------------------------------------------------------------------
// Mock live simulation (optional)
// ---------------------------------------------------------------------------

let _mockStreamId: number | null = null;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isFullyReady(patient: Patient) {
  const hasBlockers = patient.blockers.length > 0;
  const hasIncompleteChecklist = patient.dischecklistItems.some((i) => !i.completed);
  const hasPendingLabs = patient.labs.some((l) => l.status === 'pending' || l.status === 'stat');
  return !hasBlockers && !hasIncompleteChecklist && !hasPendingLabs;
}

function pickOne<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function nowIso() {
  return new Date().toISOString();
}

function addAlert(partial: Omit<Alert, 'id'>) {
  const id = `live-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  _alerts = [{ id, ...partial }, ..._alerts].slice(0, 50);
}

function autoCompleteChecklist(patient: Patient, count: number) {
  const incompleteIdx = patient.dischecklistItems
    .map((it, idx) => ({ it, idx }))
    .filter(({ it }) => !it.completed)
    .map(({ idx }) => idx);

  if (incompleteIdx.length === 0) return patient;

  const chosen = new Set<number>();
  while (chosen.size < Math.min(count, incompleteIdx.length)) {
    chosen.add(pickOne(incompleteIdx) as number);
  }

  return {
    ...patient,
    dischecklistItems: patient.dischecklistItems.map((it, idx) =>
      chosen.has(idx) ? { ...it, completed: true } : it
    ),
  };
}

function removeOneBlocker(patient: Patient, predicate: (b: Blocker) => boolean) {
  const idx = patient.blockers.findIndex(predicate);
  if (idx === -1) return patient;
  return { ...patient, blockers: patient.blockers.filter((_, i) => i !== idx) };
}

function bumpReadiness(patient: Patient, delta: number) {
  const next = clamp(patient.dischargeReadiness + delta, 0, 100);
  // Only allow 100 when all issues are resolved.
  if (isFullyReady(patient)) return { ...patient, dischargeReadiness: 100 };
  return { ...patient, dischargeReadiness: clamp(next, 0, 99) };
}

function normalizePatient(patient: Patient): Patient {
  // Keep readiness consistent with the underlying blockers/tasks/labs state.
  if (isFullyReady(patient)) return { ...patient, dischargeReadiness: 100 };
  return { ...patient, dischargeReadiness: clamp(patient.dischargeReadiness, 0, 99) };
}

function maybeUpdateBedForPatient(patientId: string) {
  const patient = _patients.find((p) => p.id === patientId);
  if (!patient) return;
  const bedIdx = _beds.findIndex((b) => b.patientId === patientId);
  if (bedIdx === -1) return;

  const fullyReady = isFullyReady(patient);

  const current = _beds[bedIdx];
  // Turnover behavior in mock mode:
  // - Once patient is truly fully-ready and has readiness=100, bed enters cleaning.
  // - Otherwise, no automatic status changes here.
  if (fullyReady && patient.dischargeReadiness === 100 && current.status !== 'cleaning') {
    _beds = _beds.map((b, i) => (i === bedIdx ? { ...b, status: 'cleaning' } : b));
    addAlert({
      severity: 'info',
      message: `Bed turnover: ${current.room} is now cleaning after discharge.`,
      patientId,
      bedId: current.id,
      timestamp: nowIso(),
      snoozed: false,
      actionLabel: 'View Capacity',
    });
  }
}

function simulateTick() {
  if (_patients.length === 0) return;

  // 1) Some pending labs turn into resulted
  const patientsWithPendingLabs = _patients.filter((p) =>
    p.labs.some((l) => l.status === 'pending' || l.status === 'stat')
  );
  const labPatient = pickOne(patientsWithPendingLabs);
  if (labPatient && Math.random() < 0.45) {
    _patients = _patients.map((p) => {
      if (p.id !== labPatient.id) return p;
      const labIdx = p.labs.findIndex((l) => l.status === 'pending' || l.status === 'stat');
      if (labIdx === -1) return p;
      const lab = p.labs[labIdx];
      const updatedLabs = p.labs.map((l, idx) =>
        idx === labIdx
          ? {
              ...l,
              status: 'resulted' as const,
              result: l.result ?? 'Resulted (within normal limits)',
            }
          : l
      );
      addAlert({
        severity: 'info',
        message: `Lab resulted: ${p.name} – ${lab.name} is now available.`,
        patientId: p.id,
        bedId: _beds.find((b) => b.patientId === p.id)?.id,
        timestamp: nowIso(),
        snoozed: false,
        actionLabel: 'View Patient',
      });
      return bumpReadiness({ ...p, labs: updatedLabs }, 2);
    });
    maybeUpdateBedForPatient(labPatient.id);
    return;
  }

  // 2) Occasionally a resolvable blocker clears and some checklist items complete
  const patientsWithResolvableBlocker = _patients.filter((p) => p.blockers.some((b) => b.resolvable));
  const blockerPatient = pickOne(patientsWithResolvableBlocker);
  if (blockerPatient && Math.random() < 0.35) {
    _patients = _patients.map((p) => {
      if (p.id !== blockerPatient.id) return p;
      const resolvedBlocker = p.blockers.find((b) => b.resolvable);
      if (!resolvedBlocker) return p;
      let next = removeOneBlocker(p, (b) => b === resolvedBlocker);
      next = autoCompleteChecklist(next, 1 + Math.floor(Math.random() * 2));
      next = bumpReadiness(next, 4 + Math.floor(Math.random() * 5));

      addAlert({
        severity: 'advisory',
        message: `Update: ${p.name} – resolved blocker: ${resolvedBlocker.description}.`,
        patientId: p.id,
        bedId: _beds.find((b) => b.patientId === p.id)?.id,
        timestamp: nowIso(),
        snoozed: false,
        actionLabel: 'View Patient',
      });

      return next;
    });
    maybeUpdateBedForPatient(blockerPatient.id);
  }
}

/**
 * Starts a lightweight mock “live updates” stream.
 * Safe to call multiple times; it only starts once.
 */
export function startMockCernerStream(): void {
  if (!MOCK_MODE) return;
  if (_mockStreamId !== null) return;
  _mockStreamId = window.setInterval(() => {
    try {
      simulateTick();
    } catch {
      // ignore simulation errors; keep UI stable
    }
  }, 4500);
}

/**
 * Applies a “resolve” outcome in mock mode so polling clients see changes.
 * This is intentionally simple and deterministic-ish.
 */
export async function applyResolveOutcome(patientId: string, blocker: Blocker): Promise<void> {
  if (MOCK_MODE) {
    await delay(250);
    _patients = _patients.map((p) => {
      if (p.id !== patientId) return p;

      let next = p;

      // If the blocker is resolvable, remove it first.
      if (blocker.resolvable) {
        next = removeOneBlocker(next, (b) => b.type === blocker.type && b.description === blocker.description);
      }

      // Automatically complete some checklist items to simulate downstream work being done.
      next = autoCompleteChecklist(next, 1 + Math.floor(Math.random() * 2));

      // Increase readiness a bit on resolve (but allow promotion to 100 if fully-ready now).
      next = bumpReadiness(next, 6 + Math.floor(Math.random() * 8));

      return normalizePatient(next);
    });

    maybeUpdateBedForPatient(patientId);

    addAlert({
      severity: 'info',
      message: `Flow update: discharge readiness increased for patient ${patientId}.`,
      patientId,
      bedId: _beds.find((b) => b.patientId === patientId)?.id,
      timestamp: nowIso(),
      snoozed: false,
      actionLabel: 'View Patient',
    });

    return;
  }

  // Real Cerner integration would live here.
  await Promise.resolve();
}

/**
 * Expedite cleaning for a bed:
 * - switches bed to available
 * - removes the discharged patient from the mock patient list
 */
export async function expediteCleaning(bedId: string): Promise<void> {
  if (MOCK_MODE) {
    await delay(350);
    const bed = _beds.find((b) => b.id === bedId);
    const dischargedPatientId = bed?.patientId;

    _beds = _beds.map((b) =>
      b.id === bedId
        ? {
            ...b,
            status: 'available',
            patientId: undefined,
          }
        : b
    );

    if (dischargedPatientId) {
      _patients = _patients.filter((p) => p.id !== dischargedPatientId);
    }

    addAlert({
      severity: 'info',
      message: `Environmental services update: ${bed?.room ?? bedId} cleaned and available.`,
      bedId,
      timestamp: nowIso(),
      snoozed: false,
      actionLabel: 'View Capacity',
    });

    return;
  }

  // Real integration would live here.
  await Promise.resolve();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchBeds(): Promise<Bed[]> {
  if (MOCK_MODE) {
    await delay(300 + Math.random() * 150);
    return structuredClone(_beds);
  }
  const res = await fetch(`${BASE_URL}/Bed?_count=100`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`fetchBeds failed: ${res.status}`);
  // TODO: transform FHIR Bundle<Location> → Bed[]
  return res.json();
}

export async function fetchPatients(): Promise<Patient[]> {
  if (MOCK_MODE) {
    await delay(300 + Math.random() * 150);
    // Ensure readiness values never drift from the underlying state.
    _patients = _patients.map(normalizePatient);

    // If any patient is now fully discharged, flip the bed into cleaning (one-time).
    for (const p of _patients) {
      if (p.dischargeReadiness === 100 && isFullyReady(p)) {
        maybeUpdateBedForPatient(p.id);
      }
    }

    return structuredClone(_patients);
  }
  const res = await fetch(`${BASE_URL}/Patient?_count=100&_include=Patient:encounter`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`fetchPatients failed: ${res.status}`);
  // TODO: transform FHIR Bundle<Patient + Encounter> → Patient[]
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  if (MOCK_MODE) {
    await delay(300 + Math.random() * 150);
    return structuredClone(_alerts);
  }
  const res = await fetch(`${BASE_URL}/Flag?status=active`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`fetchAlerts failed: ${res.status}`);
  // TODO: transform FHIR Bundle<Flag> → Alert[]
  return res.json();
}

export async function fetchMetrics(): Promise<DailyMetrics> {
  if (MOCK_MODE) {
    await delay(200);
    const available = _beds.filter((b) => b.status === 'available').length;
    const cleaning = _beds.filter((b) => b.status === 'cleaning').length;
    const pending = _beds.filter((b) => b.status === 'pending-discharge').length;

    // Average lab turnaround time for currently pending/stat labs.
    const pendingLabs = _patients.flatMap((p) =>
      p.labs
        .filter((l) => l.status === 'pending' || l.status === 'stat')
        .map((l) => ({ orderedAt: l.orderedAt }))
    );
    const avgLabTat =
      pendingLabs.length === 0
        ? 0
        : Math.round(
            pendingLabs.reduce((sum, l) => sum + (Date.now() - new Date(l.orderedAt).getTime()) / 60000, 0) /
              pendingLabs.length
          );

    return {
      // In this prototype, "Discharges" is derived from beds in turnover (cleaning).
      // (No discharge event history exists in mock mode.)
      dischargesCompleted: cleaning,
      dischargesTarget: 10,
      bedsAvailable: available,
      bedsTotal: _beds.length,
      avgLabTat,
      labTatTarget: 120,
      pendingDischarges: pending,
    };
  }
  const res = await fetch(`${BASE_URL}/MeasureReport?measure=discharge-metrics`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`fetchMetrics failed: ${res.status}`);
  // TODO: transform FHIR MeasureReport → DailyMetrics
  return res.json();
}

export async function updateChecklist(
  patientId: string,
  itemId: string,
  completed: boolean
): Promise<void> {
  if (MOCK_MODE) {
    await delay(150);
    _patients = _patients.map((p) => {
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
    });

    maybeUpdateBedForPatient(patientId);
    return;
  }
  // TODO: PATCH Cerner Task resource with updated status
  await fetch(`${BASE_URL}/Task/${itemId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: completed ? 'completed' : 'in-progress' }),
  });
}

export async function snoozeAlert(alertId: string): Promise<void> {
  if (MOCK_MODE) {
    await delay(100);
    _alerts = _alerts.map((a) => (a.id === alertId ? { ...a, snoozed: true } : a));
    return;
  }
  // TODO: PATCH Cerner Flag resource to snoozed extension
  await fetch(`${BASE_URL}/Flag/${alertId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ extension: [{ url: 'snoozed', valueBoolean: true }] }),
  });
}

export async function updateEDD(patientId: string, edd: string): Promise<void> {
  if (MOCK_MODE) {
    await delay(200);
    _patients = _patients.map((p) => (p.id === patientId ? { ...p, edd } : p));
    return;
  }
  // TODO: PATCH Cerner Encounter resource's expectedDischargeDate extension
  await fetch(`${BASE_URL}/Encounter?subject=${patientId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      extension: [{ url: 'expectedDischargeDate', valueDate: edd }],
    }),
  });
}
