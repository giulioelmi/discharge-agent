export type BedStatus = 'available' | 'occupied' | 'discharge-ready' | 'pending-discharge' | 'blocked' | 'cleaning';

export type AlertSeverity = 'critical' | 'advisory' | 'info';

export type BlockerType = 'lab-pending' | 'transport' | 'md-order' | 'family' | 'placement' | 'medication' | 'none';

export interface Lab {
  name: string;
  orderedAt: string;
  status: 'pending' | 'resulted' | 'stat';
  result?: string;
}

export interface Blocker {
  type: BlockerType;
  description: string;
  resolvable: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: 'clinical' | 'logistics' | 'education' | 'orders';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  mrn: string;
  bedId: string;
  unit: string;
  physician: string;
  admitDate: string;
  edd: string; // Estimated Discharge Date in ISO format
  losActual: number; // length of stay in days so far
  losPredicted: number; // ML predicted total LOS
  dischargeReadiness: number; // 0-100 ML score
  diagnosis: string;
  blockers: Blocker[];
  labs: Lab[];
  dischecklistItems: ChecklistItem[];
}

export interface Bed {
  id: string;
  room: string;
  unit: string;
  status: BedStatus;
  patientId?: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  patientId?: string;
  bedId?: string;
  timestamp: string;
  snoozed: boolean;
  actionLabel?: string;
}

export interface DailyMetrics {
  dischargesCompleted: number;
  dischargesTarget: number;
  bedsAvailable: number;
  bedsTotal: number;
  avgLabTat: number; // in minutes
  labTatTarget: number;
  pendingDischarges: number;
}
