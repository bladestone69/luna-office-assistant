# Hostline

**AI front desk powered by Grok Voice Agent.** Two doors, one product:

| Path | Who | What they see |
|------|-----|----------------|
| `/owner` | You (platform owner) | Clients, Grok studio, billing, platform keys |
| `/desk` | Your clients | Calm desk only: line status, people, calls |

Aura at the repo root is untouched. This app lives under `hostline/`.

## Run

```bash
cd hostline
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Demo logins

**Owner atelier**  
Password: `change-me` (or `HOSTLINE_OWNER_PASSWORD`)

**Client desks**
- `desk@greenbank.clinic` / `clinic-desk`
- `desk@mokoena.law` / `law-desk`
- `desk@harbourview.co.za` / `estate-desk`

## Owner capabilities

- Onboard clients with desk login + plan
- Grok studio per client (agent id, phone, voice, prompt, live/pause)
- Billing in ZAR (Starter / Practice / Firm), invoices, minute usage
- Platform webhook + key checklist

## Client desk

- Plain-language line status
- People who need a callback
- Call summaries
- Plan usage without technical setup

## Grok webhook

`POST /api/webhooks/xai` with header `x-hostline-secret`

Tools: `create_lead`, `record_call` (resolves client by `clientId` or `toNumber`)

## Deploy

Deploy `hostline/` as its own Vercel project.
