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

import { Bed, Patient, Alert, DailyMetrics } from '../types';
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
    const pending = _beds.filter(
      (b) => b.status === 'discharge-ready' || b.status === 'pending-discharge'
    ).length;
    return {
      dischargesCompleted: 4,
      dischargesTarget: 10,
      bedsAvailable: available,
      bedsTotal: _beds.length,
      avgLabTat: 148,
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
      return {
        ...p,
        dischecklistItems: p.dischecklistItems.map((item) =>
          item.id === itemId ? { ...item, completed } : item
        ),
      };
    });
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
