# Luna Office Assistant

Admin-only operations console for Ernest.

This app is where you:
- Dispatch instructions to your EVI outbound calling workflow.
- Track instruction status and AI feedback.
- See meetings/bookings after AI completes calls.

This app is **not** a public booking/lead/message site anymore.

## Product Model

1. Ernest enters instruction in `/admin`.
2. External AI caller workflow (Hume EVI + telephony layer) pulls queued instructions.
3. AI calls the client and attempts booking.
4. AI posts feedback and booking outcome back to this app.
5. Dashboard shows queue status, feedback feed, and booking outcomes.

## Current Scope

Implemented:
- Admin auth and protected dashboard.
- Instruction composer (admin UI).
- Hume voice assistant panel in admin.
- API for AI worker to fetch queued instructions.
- API for AI worker to post status feedback.
- Booking outcomes table driven by AI feedback payload.
- CSV export for instructions/feedback/bookings.

Not implemented in this repository:
- Direct outbound phone dialing provider integration (Twilio/SIP/etc).
- Autonomous background worker loop.

## Key Routes

UI:
- `/admin/login`
- `/admin`

Admin API:
- `POST /api/admin/instructions`
- `GET /api/admin/export?tab=instructions|ai_feedback|bookings`

AI Integration API:
- `GET /api/ai/instructions` (header `x-ai-ingest-token`)
- `POST /api/ai/feedback` (header `x-ai-ingest-token`)

Hume:
- `POST /api/hume/access-token` (admin session required)

## Google Sheets Tabs

Create these tabs in your spreadsheet:

### `Instructions`
- `createdAt`
- `instructionId`
- `clientName`
- `clientPhone`
- `preferredCallTime`
- `instructionText`
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

### `Bookings`
- `createdAt`
- `name`
- `phone`
- `email`
- `meetingType`
- `startDateTime`
- `endDateTime`
- `calendarEventId`
- `consent`
- `consentAt`

## Environment Variables

Use `.env.example` as template.

Required core:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

Required AI workflow auth:
- `AI_INGEST_TOKEN` (shared secret for AI integration endpoints)

Required Hume:
- `HUME_API_KEY`
- `HUME_SECRET_KEY`
- `HUME_CONFIG_ID`

Optional:
- `HUME_CONFIG_VERSION`
- `HUME_API_HOST` (default `api.hume.ai`)

Other integrations already present:
- Calendar + SMTP envs remain supported if you still use them.

## AI Worker Contract

### Fetch instruction queue

`GET /api/ai/instructions`

Headers:
- `x-ai-ingest-token: <AI_INGEST_TOKEN>`

Query options:
- `limit` (default 50, max 200)
- `includeClosed=true|false`

### Post feedback/outcome

`POST /api/ai/feedback`

Headers:
- `x-ai-ingest-token: <AI_INGEST_TOKEN>`
- `content-type: application/json`

Body example:

```json
{
  "instructionId": "8fd62713-1d8a-4f4d-9a67-8bde4e7af419",
  "status": "completed",
  "summary": "Client confirmed review meeting for Monday 10:00.",
  "nextAction": "Send reminder 24h before meeting.",
  "scheduledStartDateTime": "2026-02-23T10:00:00+02:00",
  "scheduledEndDateTime": "2026-02-23T10:30:00+02:00",
  "bookingEventId": "hume-call-evt-12345",
  "clientName": "Mr. Gouws",
  "clientPhone": "011 255 2323",
  "clientEmail": "",
  "meetingType": "Review Meeting (30m)"
}
```

If `status=completed` and both scheduled datetimes are provided, a row is appended to `Bookings`.

## Local Development

```bash
npm install
npm run dev
```

## Deploy (Vercel)

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add all required env vars.
4. Deploy.

## Verification Checklist

- [ ] `/` redirects to `/admin/login`
- [ ] Admin login works
- [ ] Instruction submit creates row in `Instructions`
- [ ] `GET /api/ai/instructions` returns queued work with token
- [ ] `POST /api/ai/feedback` writes row in `AI_Feedback`
- [ ] Completed feedback with scheduled times creates row in `Bookings`
- [ ] Dashboard shows queue + feedback + booking outcomes
- [ ] Hume assistant panel connects with configured `HUME_CONFIG_ID`
