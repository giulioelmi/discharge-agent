/**
 * src/api/agent.ts
 *
 * FlowBoard AI assistant integration.
 * Currently returns mock responses.
 * To connect to a real AI agent:
 *  1. Set VITE_AI_AGENT_URL in your .env
 *  2. Replace the mock implementation with a real fetch() call
 */

import { Patient } from '../types';

const MOCK_AGENT = import.meta.env.VITE_AI_AGENT_URL === undefined;
const AGENT_URL = import.meta.env.VITE_AI_AGENT_URL ?? '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const delay = (ms = 800) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "I've reviewed the patient's chart. Based on current vitals, labs, and pending items, the primary discharge blockers are documented above. I recommend prioritizing lab result review and ensuring all medication reconciliation is completed before discharge.",
  blocker:
    'The main barrier to discharge appears to be a pending lab result. Once that resolves, the patient meets clinical criteria. I suggest flagging the attending now so discharge orders can be written proactively.',
  transport:
    'Transportation arrangements are the outstanding blocker. I can draft a transport request to the care coordinator. The patient is otherwise clinically ready for discharge today.',
  edd: "Based on the patient's current trajectory, the estimated discharge date appears achievable. Clinical milestones are trending favorably. Consider placing a discharge order now to prevent delays.",
  checklist:
    'The discharge checklist is approximately 70% complete. Outstanding items are mostly in the Education and Logistics categories. I recommend assigning these to the case manager and bedside nurse respectively.',
};

function getMockResponse(userMessage: string, patient: Patient | null): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes('transport') || msg.includes('transfer')) return MOCK_RESPONSES.transport;
  if (msg.includes('blocker') || msg.includes('barrier') || msg.includes('holding'))
    return MOCK_RESPONSES.blocker;
  if (msg.includes('edd') || msg.includes('discharge date') || msg.includes('when'))
    return MOCK_RESPONSES.edd;
  if (msg.includes('checklist') || msg.includes('complete') || msg.includes('items'))
    return MOCK_RESPONSES.checklist;
  if (patient) {
    return `Reviewing ${patient.name}'s chart: ${patient.diagnosis}. Current discharge readiness score is ${patient.dischargeReadiness}/100. ${MOCK_RESPONSES.default}`;
  }
  return MOCK_RESPONSES.default;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  patient: Patient | null
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  if (MOCK_AGENT) {
    await delay(700 + Math.random() * 400);
    return getMockResponse(lastUserMsg, patient);
  }

  const res = await fetch(AGENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      patientContext: patient
        ? {
            name: patient.name,
            diagnosis: patient.diagnosis,
            dischargeReadiness: patient.dischargeReadiness,
            blockers: patient.blockers,
            edd: patient.edd,
          }
        : null,
    }),
  });

  if (!res.ok) throw new Error(`Agent API error: ${res.status}`);
  const data = await res.json();
  return data.content ?? data.message ?? 'No response from agent.';
}
