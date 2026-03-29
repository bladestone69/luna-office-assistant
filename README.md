# Luna — AI Receptionist SaaS

> **24/7 AI-powered virtual receptionist for South African SMEs.** Handles calls, qualifies leads, books appointments, and sends WhatsApp confirmations — in English, Afrikaans, Zulu, and Xhosa.

**Live:** [luna-office-assistant.vercel.app](https://luna-office-assistant.vercel.app)

---

## What Luna Does

- **Answers calls** via Twilio + Hume EVI voice AI — no human receptionist needed
- **Qualifies leads** in real-time, captures contact details and intent
- **Books appointments** directly into Google Calendar, with SMS/WhatsApp confirmations
- **Multilingual** — English, Afrikaans, Zulu, Xhosa with code-switching support
- **Multi-tenant** — each client (law firm, medical practice, real estate agency) gets their own isolated dashboard
- **Lead notification** — new leads automatically create Trello cards for your sales team
- **After-hours coverage** — works during load shedding hours via mobile data fallback

---

## Architecture

```
Twilio (voice call) ──► /api/webhooks/twilio/voice
                              │
                              ▼
Hume EVI (AI voice) ──► /api/webhooks/hume (tool calls)
                              │
                              ▼
                    Vercel Postgres (Drizzle ORM)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Contacts         Leads           Calls
        Hume Agents      Tasks           Phone Numbers
                                          Client Users
```

### Key Routes

| Route | Description |
|-------|-------------|
| `/` | Client mobile dashboard (Home / Calls / AI / Menu tabs) |
| `/admin` | Admin dispatch console |
| `/admin/results` | AI call outcomes + meeting summaries |
| `/login` | Client (tenant) login |
| `/admin/login` | Admin login |
| `/become-client` | Public lead capture form |
| `/book` | Public appointment booking page |
| `/leave-message` | Voicemail capture |

### API Routes

**Admin:**
- `POST /api/admin/instructions` — dispatch a new call instruction
- `GET /api/admin/export?tab=contacts|leads|calls|bookings` — export data as CSV

**AI Worker Contract (external callers):**
- `GET /api/ai/instructions` — pull pending call instructions
  - Header: `x-ai-ingest-token`
  - Query: `?limit=50&includeClosed=false`
- `POST /api/ai/feedback` — push call outcome
  - Header: `x-ai-ingest-token`
  - Body: `{ instructionId, status, summary, nextAction, scheduledStartDateTime, ... }`

**Webhooks:**
- `POST /api/webhooks/twilio/voice` — Twilio inbound voice
- `POST /api/webhooks/twilio/status` — Twilio call status callbacks
- `POST /api/webhooks/twilio/twiml-outbound` — TwiML for outbound calls
- `POST /api/webhooks/hume` — Hume EVI tool calls (create lead, create booking, etc.)

**Client:**
- `GET/POST /api/leads` — manage leads
- `GET/POST /api/contacts` — manage contacts
- `GET/POST /api/calls` — manage calls
- `GET/POST /api/bookings` — manage bookings + availability
- `POST /api/messages` — send SMS/WhatsApp

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Vercel Postgres (Drizzle ORM) |
| Voice AI | Hume EVI |
| Telephony | Twilio |
| Calendar | Google Calendar API |
| Notifications | Trello API |
| Email | SMTP |
| Deployment | Vercel |

---

## Database Schema

**Core entities:**
- `clients` — tenant organisations (law firms, medical practices, etc.)
- `client_users` — staff logins per client
- `hume_agents` — per-client AI agent configurations
- `phone_numbers` — Twilio numbers assigned to clients
- `contacts` — people the client has interacted with
- `leads` — captured from calls, web forms, or manual entry
- `calls` — call log with transcript, outcome, duration
- `tasks` — follow-up tasks generated from calls
- `admin_credentials` — admin panel access

---

## Environment Variables

```bash
# App
ADMIN_USERNAME=ernest
ADMIN_PASSWORD=change-me-to-a-strong-password
ADMIN_SESSION_SECRET=change-me-to-a-long-random-secret
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=12
AI_INGEST_TOKEN=replace-with-long-random-shared-secret

# Database
DATABASE_URL=postgres://user:password@host:5432/luna

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Hume EVI
HUME_API_KEY=your-hume-api-key
HUME_SECRET_KEY=your-hume-secret-key
HUME_CONFIG_ID=your-hume-evi-config-id
HUME_API_HOST=api.hume.ai

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# Trello (lead cards)
TRELLO_API_KEY=your-trello-api-key
TRELLO_ACCESS_TOKEN=your-trello-access-token
TRELLO_BOARD_ID=your-board-id
TRELLO_LEADS_LIST_ID=your-leads-list-id

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Luna Office Assistant <noreply@example.com>"
ERNEST_EMAIL=ernest@example.com
```

---

## Getting Started (Local)

```bash
git clone https://github.com/bladestone69/luna-office-assistant.git
cd luna-office-assistant
npm install

# Copy and fill in env vars
cp .env.example .env.local

# Push schema to local Postgres
npm run db:push

# Seed demo data (optional)
npx tsx scripts/seed.ts

# Start dev server
npm run dev
```

Visit `http://localhost:3000/admin/login` to access the admin panel.

---

## Deployment

Deployed automatically via Vercel on push to `main`.

Set environment variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

Required env vars for production:
- `DATABASE_URL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `HUME_API_KEY`, `HUME_SECRET_KEY`, `HUME_CONFIG_ID`
- `AI_INGEST_TOKEN`
- `GOOGLE_CALENDAR_ID`
- `TRELLO_*`
- `SMTP_*`

---

## Product Roadmap

- [ ] SMS reminders via Twilio (before appointments)
- [ ] WhatsApp Business API integration (confirmations + reminders)
- [ ] Zapier / Make.com no-code integrations
- [ ] POPIA-compliant data export + deletion flows
- [ ] Usage analytics dashboard per client
- [ ] Multi-language voice model fine-tuning (SA accents)
- [ ] Inbound call routing rules per client
