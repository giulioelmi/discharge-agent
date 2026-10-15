# FlowBoard: Discharge Optimization Dashboard

A hackathon prototype that helps hospital staff get patients discharged sooner and free up beds.
It shows which patients are close to going home, what is holding each one up (a pending lab,
a missing order, transport, medication reconciliation), and lets an AI assistant take the next
step on each blocker.

## Features

- **Worklist**: patients by department with their discharge blockers and a readiness score.
  One click asks the AI assistant to act on a blocker (page the attending, escalate a lab to
  STAT, request transport, notify pharmacy).
- **Capacity Management**: expected discharges vs. incoming demand, with an AI-written capacity summary.
- **Bed Dashboard**: live bed board by unit, filterable by status.
- **AI chat**: ask about any patient's chart.

Runs on mock patient data by default. `src/api/cerner.ts` is the only file that talks to the
EHR and is ready to swap to Cerner FHIR; `src/api/agent.ts` is the only file that talks to the AI.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS

## Run it

```bash
npm install
npm run dev
```

To use real services, copy `.env.example` to `.env` and set `VITE_MOCK_MODE=false`,
`VITE_CERNER_BASE_URL` and `VITE_AI_AGENT_URL`.

## Team

Giulio Elmi, Devesh Bhatla
