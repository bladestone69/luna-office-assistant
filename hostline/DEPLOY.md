# Deploy Hostline to Vercel

Aura already deploys from this repo root. **Hostline needs its own Vercel project** with Root Directory set to `hostline`.

## Fast path (dashboard)

1. Open [vercel.com/new](https://vercel.com/new)
2. Import `bladestone69/luna-office-assistant`
3. Set **Root Directory** to `hostline`
4. Framework: Next.js (auto)
5. Add env vars (you can add keys later and redeploy):

```
HOSTLINE_OWNER_PASSWORD=...
HOSTLINE_SESSION_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-hostline-url.vercel.app
XAI_API_KEY=
XAI_WEBHOOK_SECRET=
```

6. Deploy

## CLI path (if you have a token)

```bash
cd hostline
npx vercel link --yes --project hostline
npx vercel env add HOSTLINE_OWNER_PASSWORD
npx vercel --prod
```

Or from this agent: paste a `VERCEL_TOKEN` and we finish the deploy for you.
