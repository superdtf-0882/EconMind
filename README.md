# EconMind

A shareable, AI-native learning app that teaches 7th grade economics through Socratic conversation. This prototype covers one complete lesson — **Incentives** — as the second concept in a spine that eventually reaches Externalities.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Anthropic Claude API (`claude-sonnet-4-6`) for the Socratic chat
- Upstash Redis for learner progress (`learner:{uuid}` keys)
- No auth — learner identified by a UUID generated client-side and stored in `localStorage`

## Local setup

1. Copy `.env.local.example` to `.env.local` and fill in:
   - `ANTHROPIC_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000), complete onboarding, and you'll land in the Incentives lesson.

## Structure

- `app/page.tsx` — onboarding (name + interests, seeds learner record)
- `app/learn/page.tsx` — dashboard (concept map + progress)
- `app/learn/[concept]/page.tsx` — lesson shell; only `incentives` has full content in this prototype
- `app/api/chat/route.ts` — server-side Claude API proxy
- `app/api/progress/route.ts` — read/write learner progress in Redis
- `lib/lessons/incentives.ts` — scenario text and system prompts for the 4-beat lesson
- `lib/concepts.ts` — the full 9-concept spine shown on the concept map

## Deploy

Push to GitHub, import into Vercel, and set the same three environment variables in the Vercel project settings.
