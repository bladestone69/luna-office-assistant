# Luna EVI Dispatch Console

Slim admin console for one job:
- Dispatch outbound call instructions to EVI.
- Monitor call outcomes on a dedicated results screen.

## Product Flow

1. User opens `/admin` and pastes one or many phone numbers.
2. User enters the pitch prompt EVI should use on those calls.
3. App writes one instruction row per phone number to `Instructions` in Google Sheets.
4. AI caller worker pulls instructions from `GET /api/ai/instructions`.
5. Worker posts outcomes to `POST /api/ai/feedback`.
6. User opens `/admin/results` to track statuses and summaries.

## UI Routes

- `/admin` - Dispatch screen
- `/admin/results` - Results screen

## API Routes

Admin:
- `POST /api/admin/instructions`
- `GET /api/admin/export?tab=instructions|ai_feedback|bookings`

AI worker:
- `GET /api/ai/instructions` (header `x-ai-ingest-token`)
- `POST /api/ai/feedback` (header `x-ai-ingest-token`)

## Google Sheets Tabs

Create these tabs in your spreadsheet:

### `Instructions`
- `createdAt`
- `instructionId`
- `clientName` (campaign label)
- `clientPhone`
- `preferredCallTime`
- `instructionText` (pitch prompt)
- `priority`
- `status`
- `createdBy`
- `source`

### `AI_Feedback`
- `createdAt`
- `instructionId`
- `status`
- `summary`
- `nextAction`
- `scheduledStartDateTime`
- `scheduledEndDateTime`
- `bookingEventId`
- `rawPayload`

## Environment Variables

Use `.env.example` as a starting point.

Required for dispatch/results:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `AI_INGEST_TOKEN`

If Sheets env is missing, the UI still loads but dispatch and exports return `503` until configured.

## AI Worker Contract

### Pull queue

`GET /api/ai/instructions`

Headers:
- `x-ai-ingest-token: <AI_INGEST_TOKEN>`

Query params:
- `limit` (default `50`, max `200`)
- `includeClosed=true|false`

### Push outcome

`POST /api/ai/feedback`

Headers:
- `x-ai-ingest-token: <AI_INGEST_TOKEN>`
- `content-type: application/json`

Body (example):

```json
{
  "instructionId": "8fd62713-1d8a-4f4d-9a67-8bde4e7af419",
  "status": "completed",
  "summary": "Client agreed to a follow-up meeting next week.",
  "nextAction": "Send reminder 24h before the meeting.",
  "scheduledStartDateTime": "2026-02-23T10:00:00+02:00",
  "scheduledEndDateTime": "2026-02-23T10:30:00+02:00",
  "bookingEventId": "hume-call-evt-12345",
  "clientName": "Mr. Gouws",
  "clientPhone": "011 255 2323",
  "clientEmail": "",
  "meetingType": "Review Meeting (30m)"
}
```

## Local Development

```bash
npm install
npm run dev
```
