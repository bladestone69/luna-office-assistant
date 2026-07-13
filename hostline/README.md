# Hostline

**AI front desk powered by Grok Voice Agent.** Separate from Aura (Hume). Answers calls, qualifies leads, and books meetings for South African SMEs.

Aura at the repo root is untouched. This app lives only under `hostline/`.

## Name

**Hostline** = the host on the phone line.

Other strong options if you want to rename later:
- **Portico** (entrance / reception metaphor)
- **Deskline**
- **Firstline**
- **Ringdesk**

## Stack

- Next.js 14 + TypeScript + Tailwind
- xAI Grok Voice Agent (Builder + API)
- Admin desk for agent config, leads, calls
- Webhook: `POST /api/webhooks/xai` for Grok tool calls

## Run locally

```bash
cd hostline
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Default admin password: `change-me` (set `HOSTLINE_ADMIN_PASSWORD`).

## Connect Grok

1. Create an agent in [Voice Agent Builder](https://console.x.ai/voice/agents).
2. Add `XAI_API_KEY`, `XAI_AGENT_ID`, optional `XAI_PHONE_NUMBER`.
3. Set `XAI_WEBHOOK_SECRET`.
4. Point a REST tool named `create_lead` at `https://your-host/api/webhooks/xai` with header `x-hostline-secret`.

Optional tool: `record_call` for call summaries.

## Deploy

Deploy the `hostline/` directory as its own Vercel (or similar) project. Do not deploy from the Aura root.

## Status

MVP desk + marketing site + Grok webhook contract. Persistence is in-memory for the warm process (fine for demos). Next step: Postgres and outbound dialing via Voice Agent API / SIP.
