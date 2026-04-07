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
    "I've reviewed the patient's chart. Based on current vitals, labs, and pending items, the primary discharge blockers are documented above. I recommend prioritising lab result review and ensuring all medication reconciliation is completed before discharge.",
  blocker:
    'The main barrier to discharge appears to be a pending lab result. Once that resolves, the patient meets clinical criteria. I suggest flagging the attending now so discharge orders can be written proactively.',
  transport_action:
    `Transport request #TR-{ref} submitted to the care coordinator. Estimated pickup window: 2–4 PM today. The transport team will call the family using the contact number on file. A copy of the request has been logged in the patient's record.`,
  transport_generic:
    'Transportation arrangements are the outstanding blocker. I can draft a transport request to the care coordinator. The patient is otherwise clinically ready for discharge today.',
  md_order_action:
    'Page sent to the attending physician (beeper on record). Message reads: "Discharge order requested — patient is clinically cleared and awaiting only your order. Please review and sign at your earliest convenience." A follow-up reminder will be sent in 30 minutes if no response is received.',
  medication_action:
    'Pharmacy notified via task queue. A medication reconciliation draft has been created and assigned to the on-duty clinical pharmacist. All home medications have been pre-populated from the MAR. Expected review time: 15–20 minutes.',
  lab_stat_action:
    'Lab order escalated to STAT priority. The laboratory supervisor and the charge nurse have both been notified. Expected turnaround time is now ≤45 minutes. Results will auto-populate in the chart when available.',
  family_advisory:
    '1. Locate the family contact in the chart (Contacts tab) and confirm the best phone number.\n2. Call or page the bedside social worker (ext. 4200) — they can facilitate and document the meeting.\n3. Ask the charge nurse to block a 20-minute slot in the family lounge.\n4. Prepare a brief discharge summary handout the family can take home.\n5. Document the meeting outcome in the Discharge Planning note.',
  placement_advisory:
    '1. Contact the case manager (ext. 4200) to confirm the SNF search is active and escalate urgency.\n2. Pull up available beds in the Care Management portal — filter by payer and clinical needs.\n3. Fax clinical summary to the top-two SNFs and request a callback within 2 hours.\n4. If no bed is found by 3 PM, escalate to the Bed Coordinator for a broader regional search.\n5. Document all contacts and responses in the Discharge Planning note.',
  lab_wait_advisory:
    'While waiting for the result:\n1. Ensure the order is visible in the queue and not on hold.\n2. Call the lab desk (ext. 5050) to confirm it is in process and get an ETA.\n3. Pre-complete all other discharge tasks so the patient can leave as soon as the result clears.\n4. Notify the attending that the result is the sole remaining blocker.',
  edd: "Based on the patient's current trajectory, the estimated discharge date appears achievable. Clinical milestones are trending favourably. Consider placing a discharge order now to prevent delays.",
  checklist:
    'The discharge checklist is approximately 70% complete. Outstanding items are mostly in the Education and Logistics categories. I recommend assigning these to the case manager and bedside nurse respectively.',
};

function getMockResponse(userMessage: string, patient: Patient | null): string {
  const msg = userMessage.toLowerCase();

  // Action responses (agent did something concrete)
  if (msg.includes('submit a transport') || (msg.includes('transport') && msg.includes('confirm what was sent')))
    return MOCK_RESPONSES.transport_action.replace('{ref}', String(2000 + Math.floor(Math.random() * 999)));
  if (msg.includes('page') && (msg.includes('discharge order') || msg.includes('urgent')))
    return MOCK_RESPONSES.md_order_action;
  if (msg.includes('notify pharmacy') || (msg.includes('medication') && msg.includes('reconciliation')))
    return MOCK_RESPONSES.medication_action;
  if (msg.includes('escalate') && (msg.includes('stat') || msg.includes('lab')))
    return MOCK_RESPONSES.lab_stat_action;

  // Advisory responses (guidance only)
  if (msg.includes('family') && (msg.includes('step') || msg.includes('next action')))
    return MOCK_RESPONSES.family_advisory;
  if (msg.includes('placement') && (msg.includes('step') || msg.includes('next action')))
    return MOCK_RESPONSES.placement_advisory;
  if (msg.includes('waiting for this lab') || (msg.includes('lab') && msg.includes('guidance')))
    return MOCK_RESPONSES.lab_wait_advisory;

  // General fallbacks
  if (msg.includes('transport') || msg.includes('transfer')) return MOCK_RESPONSES.transport_generic;
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

/** One-shot ask — used by inline AI buttons in the worklist */
export async function askAgent(patient: Patient, prompt: string): Promise<string> {
  return sendChatMessage([{ role: 'user', content: prompt }], patient);
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
