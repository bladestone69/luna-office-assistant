# Usage Guide

## 1. Dispatch Outbound Instruction
1. Login at `/admin/login`.
2. Open `/admin`.
3. In **Dispatch Instruction to EVI**, enter client name, phone, instruction text, and priority.
4. Submit.

Result:
- New row in `Instructions` with status `pending`.

## 2. AI Worker Picks Up Instructions
Your external AI worker calls:
- `GET /api/ai/instructions`
- Header: `x-ai-ingest-token`

Result:
- Receives queue items with `instructionId`.

## 3. AI Worker Reports Outcome
After call attempt, worker posts:
- `POST /api/ai/feedback`
- Header: `x-ai-ingest-token`
- Include `instructionId`, `status`, `summary`, and optionally scheduled datetime fields.

Result:
- New row in `AI_Feedback`.
- If completed with schedule window, row also appears in `Bookings`.

## 4. Monitor on Dashboard
`/admin` shows:
- Instruction Queue (with latest status/summary)
- AI Feedback Feed
- Meetings Captured From AI Outcomes
- Hume voice panel for manual admin interactions

## Notes
- Public pages now redirect to admin login.
- This app tracks operations and outcomes; outbound telephony is handled by your external AI calling workflow.
