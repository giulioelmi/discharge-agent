import { Bed } from '../types';

export const MOCK_BEDS: Bed[] = [
  // Occupied beds (18 patients in bed-101 through bed-118)
  { id: 'bed-101', room: '401A', unit: '4-North', status: 'pending-discharge', patientId: 'pt-001' },
  { id: 'bed-102', room: '401B', unit: '4-North', status: 'occupied', patientId: 'pt-002' },
  { id: 'bed-103', room: '402A', unit: '4-North', status: 'occupied', patientId: 'pt-003' },
  { id: 'bed-104', room: '402B', unit: 'ICU', status: 'pending-discharge', patientId: 'pt-004' },
  { id: 'bed-105', room: '403A', unit: '4-North', status: 'occupied', patientId: 'pt-005' },
  { id: 'bed-106', room: '403B', unit: '4-North', status: 'discharge-ready', patientId: 'pt-006' },
  { id: 'bed-107', room: '404A', unit: '4-North', status: 'occupied', patientId: 'pt-007' },
  { id: 'bed-108', room: '404B', unit: '4-North', status: 'blocked', patientId: 'pt-008' },
  { id: 'bed-109', room: '405A', unit: '4-North', status: 'occupied', patientId: 'pt-009' },
  { id: 'bed-110', room: '405B', unit: '4-North', status: 'discharge-ready', patientId: 'pt-010' },
  { id: 'bed-111', room: '406A', unit: '4-North', status: 'occupied', patientId: 'pt-011' },
  { id: 'bed-112', room: '406B', unit: '4-North', status: 'occupied', patientId: 'pt-012' },
  { id: 'bed-113', room: '407A', unit: '4-North', status: 'discharge-ready', patientId: 'pt-013' },
  { id: 'bed-114', room: '407B', unit: '4-North', status: 'occupied', patientId: 'pt-014' },
  { id: 'bed-115', room: '408A', unit: '4-North', status: 'occupied', patientId: 'pt-015' },
  { id: 'bed-116', room: '408B', unit: '4-North', status: 'occupied', patientId: 'pt-016' },
  { id: 'bed-117', room: '409A', unit: '4-North', status: 'occupied', patientId: 'pt-017' },
  { id: 'bed-118', room: '409B', unit: '4-North', status: 'occupied', patientId: 'pt-018' },

  // Available beds
  { id: 'bed-119', room: '410A', unit: '4-North', status: 'available' },
  { id: 'bed-120', room: '410B', unit: '4-North', status: 'available' },

  // Cleaning
  { id: 'bed-121', room: '411A', unit: '4-North', status: 'cleaning' },

  // Blocked (maintenance)
  { id: 'bed-122', room: '411B', unit: '4-North', status: 'blocked' },

  // Additional occupied / available for a 30-bed unit
  { id: 'bed-123', room: '412A', unit: '4-North', status: 'available' },
  { id: 'bed-124', room: '412B', unit: '4-North', status: 'cleaning' },
  { id: 'bed-125', room: '413A', unit: '4-North', status: 'available' },
  { id: 'bed-126', room: '413B', unit: '4-North', status: 'available' },
  { id: 'bed-127', room: '414A', unit: '4-North', status: 'available' },
  { id: 'bed-128', room: '414B', unit: '4-North', status: 'available' },
  { id: 'bed-129', room: '415A', unit: '4-North', status: 'available' },
  { id: 'bed-130', room: '415B', unit: '4-North', status: 'available' },

  // ── ICU ──────────────────────────────────────────────────────────────────
  { id: 'bed-201', room: 'ICU-1', unit: 'ICU', status: 'occupied',          patientId: 'pt-019' },
  { id: 'bed-202', room: 'ICU-2', unit: 'ICU', status: 'occupied',          patientId: 'pt-020' },
  { id: 'bed-203', room: 'ICU-3', unit: 'ICU', status: 'available' },
  { id: 'bed-204', room: 'ICU-4', unit: 'ICU', status: 'available' },
  { id: 'bed-205', room: 'ICU-5', unit: 'ICU', status: 'blocked' },

  // ── 3-South ───────────────────────────────────────────────────────────────
  { id: 'bed-301', room: '3S-101', unit: '3-South', status: 'discharge-ready', patientId: 'pt-021' },
  { id: 'bed-302', room: '3S-102', unit: '3-South', status: 'occupied',        patientId: 'pt-022' },
  { id: 'bed-303', room: '3S-103', unit: '3-South', status: 'pending-discharge', patientId: 'pt-023' },
  { id: 'bed-304', room: '3S-104', unit: '3-South', status: 'available' },
  { id: 'bed-305', room: '3S-105', unit: '3-South', status: 'available' },
  { id: 'bed-306', room: '3S-106', unit: '3-South', status: 'cleaning' },
  { id: 'bed-307', room: '3S-107', unit: '3-South', status: 'available' },
  { id: 'bed-308', room: '3S-108', unit: '3-South', status: 'available' },

  // ── PACU ──────────────────────────────────────────────────────────────────
  { id: 'bed-401', room: 'PACU-1', unit: 'PACU', status: 'occupied',          patientId: 'pt-024' },
  { id: 'bed-402', room: 'PACU-2', unit: 'PACU', status: 'discharge-ready',   patientId: 'pt-025' },
  { id: 'bed-403', room: 'PACU-3', unit: 'PACU', status: 'occupied',          patientId: 'pt-026' },
  { id: 'bed-404', room: 'PACU-4', unit: 'PACU', status: 'available' },
  { id: 'bed-405', room: 'PACU-5', unit: 'PACU', status: 'available' },
  { id: 'bed-406', room: 'PACU-6', unit: 'PACU', status: 'cleaning' },

  // ── Emergency Dept ────────────────────────────────────────────────────────
  { id: 'bed-501', room: 'ED-Bay 4',  unit: 'Emergency Dept', status: 'occupied',        patientId: 'pt-027' },
  { id: 'bed-502', room: 'ED-Bay 7',  unit: 'Emergency Dept', status: 'discharge-ready', patientId: 'pt-028' },
  { id: 'bed-503', room: 'ED-Bay 11', unit: 'Emergency Dept', status: 'occupied',        patientId: 'pt-029' },
  { id: 'bed-504', room: 'ED-Bay 1',  unit: 'Emergency Dept', status: 'available' },
  { id: 'bed-505', room: 'ED-Bay 2',  unit: 'Emergency Dept', status: 'available' },
  { id: 'bed-506', room: 'ED-Bay 3',  unit: 'Emergency Dept', status: 'available' },
  { id: 'bed-507', room: 'ED-Bay 5',  unit: 'Emergency Dept', status: 'cleaning' },
  { id: 'bed-508', room: 'ED-Bay 6',  unit: 'Emergency Dept', status: 'blocked' },

  // ── 5-East (Oncology) ─────────────────────────────────────────────────────
  { id: 'bed-601', room: '5E-201', unit: '5-East', status: 'occupied',        patientId: 'pt-030' },
  { id: 'bed-602', room: '5E-202', unit: '5-East', status: 'discharge-ready', patientId: 'pt-031' },
  { id: 'bed-603', room: '5E-203', unit: '5-East', status: 'pending-discharge', patientId: 'pt-032' },
  { id: 'bed-604', room: '5E-204', unit: '5-East', status: 'available' },
  { id: 'bed-605', room: '5E-205', unit: '5-East', status: 'available' },
  { id: 'bed-606', room: '5E-206', unit: '5-East', status: 'available' },
  { id: 'bed-607', room: '5E-207', unit: '5-East', status: 'cleaning' },

  // ── Cardiac Care (CCU) ────────────────────────────────────────────────────
  { id: 'bed-701', room: 'CCU-1', unit: 'Cardiac Care', status: 'discharge-ready', patientId: 'pt-033' },
  { id: 'bed-702', room: 'CCU-2', unit: 'Cardiac Care', status: 'occupied',        patientId: 'pt-034' },
  { id: 'bed-703', room: 'CCU-3', unit: 'Cardiac Care', status: 'occupied',        patientId: 'pt-035' },
  { id: 'bed-704', room: 'CCU-4', unit: 'Cardiac Care', status: 'available' },
  { id: 'bed-705', room: 'CCU-5', unit: 'Cardiac Care', status: 'available' },
  { id: 'bed-706', room: 'CCU-6', unit: 'Cardiac Care', status: 'cleaning' },
];
