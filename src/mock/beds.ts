import { Bed } from '../types';

export const MOCK_BEDS: Bed[] = [
  // Occupied beds (18 patients in bed-101 through bed-118)
  { id: 'bed-101', room: '401A', unit: '4-North', status: 'pending-discharge', patientId: 'pt-001' },
  { id: 'bed-102', room: '401B', unit: '4-North', status: 'occupied', patientId: 'pt-002' },
  { id: 'bed-103', room: '402A', unit: '4-North', status: 'occupied', patientId: 'pt-003' },
  { id: 'bed-104', room: '402B', unit: '4-North', status: 'pending-discharge', patientId: 'pt-004' },
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
];
