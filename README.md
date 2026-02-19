# Luna Office Assistant

Privacy-first web app for a South African financial adviser (Ernest).  
Built for office administration only: booking meetings, capturing leads, and taking callback messages.

## What This App Does
- Public booking flow with privacy-safe Google Calendar availability checks (`freeBusy` only).
- Public lead form stored in Google Sheets (`Leads` tab).
- Public message form stored in Google Sheets (`Messages` tab) with urgent flagging.
- Admin-only dashboard for recent leads/messages/bookings (from Sheets) and CSV export.
- Admin-only Hume EVI voice assistant panel inside dashboard (`/admin`).
- Email notifications via SMTP to requester and/or Ernest.

## Hard Privacy Rules Enforced
- No policy/account operations are performed.
- No policy lookup, balance lookup, withdrawal processing, switch requests, or status retrieval.
- Calendar integration never reads event titles/descriptions/attendees for availability.
- Only free/busy slots are used for schedule checks.
- Minimal data storage only.
- ID-like number redaction is applied before saving free text and callback context fields.
- POPIA-style consent is required and consent timestamp is stored.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Google APIs (`googleapis`) for Calendar + Sheets
- Hume EVI Web SDK (`@humeai/voice-react`) + secure token generation (`hume`)
- Nodemailer SMTP for email
- Zod validation

## Project Structure
- `app/` pages + API routes
- `components/` form and admin UI
- `lib/` Google integrations, auth, privacy, validation, rate limit, CSV
- `docs/usage-guide.md` quick usage/run-through

## Local Setup
1. Ensure Node.js 18+ is installed.
2. Copy `.env.example` to `.env.local`.
3. Fill all environment variables.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run dev server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`.

## Google Cloud Setup (Service Account)
1. Create a Google Cloud project.
2. Enable:
   - Google Calendar API
   - Google Sheets API
3. Create a Service Account.
4. Create a JSON key for the service account.
5. Set:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` from `client_email`
   - `GOOGLE_PRIVATE_KEY` from `private_key` (keep `\n` escaped in env)

### Calendar Access
1. Use or create the office calendar Ernest wants this app to manage.
2. Share the calendar with the service account email.
3. Permission required: **Make changes to events**.
4. Put the calendar ID into `GOOGLE_CALENDAR_ID`.

### Sheets Access
1. Create one Google Spreadsheet.
2. Share the spreadsheet with the service account email (Editor).
3. Put spreadsheet ID in `GOOGLE_SHEETS_SPREADSHEET_ID`.
4. Create tabs exactly:
   - `Leads`
   - `Messages`
   - `Bookings`
5. Add header row exactly as below.

`Leads` columns:
- `createdAt`
- `name`
- `phone`
- `email`
- `topic`
- `preferredCallbackTime`
- `consent`
- `consentAt`
- `source`
- `notes`

`Messages` columns:
- `createdAt`
- `name`
- `phone`
- `email`
- `reason`
- `urgency`
- `preferredCallbackTime`
- `consent`
- `consentAt`
- `flaggedUrgent`

`Bookings` columns:
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

## SMTP Setup
Set:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Set Ernest target inbox:
- `ERNEST_EMAIL`

## Admin Access
- Login page: `/admin/login`
- Username: `ADMIN_USERNAME` (default `ernest`)
- Password: `ADMIN_PASSWORD`
- Session signing key: `ADMIN_SESSION_SECRET`

## Hume EVI Setup (Admin Assistant)
1. In Hume, create your EVI configuration with strict instructions:
   - This assistant records/schedules only.
   - It must refuse policy/account operations.
2. Copy your EVI `configId`.
3. Set env vars:
   - `HUME_API_KEY`
   - `HUME_SECRET_KEY`
   - `HUME_CONFIG_ID`
   - Optional: `HUME_CONFIG_VERSION`, `HUME_API_HOST`
4. Open `/admin` and use **Hume AI Assistant (Admin)** to start a voice session.

How it works:
- Client requests `/api/hume/access-token` (admin session required).
- Server creates short-lived Hume access token.
- Browser connects to EVI with your `configId`.

## Vercel Deployment
1. Push repository to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Framework preset: Next.js.
4. Add all environment variables from `.env.example`.
5. Deploy.
6. After deploy, test:
   - `/book`
   - `/become-client`
   - `/leave-message`
   - `/admin/login`

## Anti-Spam + Abuse Controls
- Hidden honeypot field (`website`) on public forms.
- Basic per-IP in-memory rate limiting on API endpoints.
- Validation on all incoming payloads.

## Booking Behavior
- Timezone: `Africa/Johannesburg`.
- Meeting types:
  - Intro Call (15m)
  - Review Meeting (30m)
  - Full Consultation (60m)
- Event summary format:
  - `Meeting - <FirstName> - <Phone>`
- Confirmation email sent to requester.
- Notification email sent to Ernest.

## Verification Checklist
- [ ] Public forms submit with valid data.
- [ ] Invalid payloads are rejected.
- [ ] Honeypot submissions are blocked.
- [ ] Rate limit returns `429` after threshold.
- [ ] Calendar availability uses free/busy only.
- [ ] Booking creates calendar event + row in `Bookings`.
- [ ] Leads append into `Leads`.
- [ ] Messages append into `Messages`.
- [ ] Urgent message triggers `URGENT:` subject.
- [ ] Admin dashboard requires login.
- [ ] Hume assistant connects from `/admin` with your configured `HUME_CONFIG_ID`.
- [ ] CSV export works for leads/messages/bookings.

## Notes
- Current rate limiting is in-memory (sufficient for v1, basic bot resistance).
- For higher scale, replace with Upstash Redis or another shared store.
