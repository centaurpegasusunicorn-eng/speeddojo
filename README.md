# SpeedDojo — Guitar Dojo

BPM-synced guitar practice: exercise video + app-generated click, belt ranks,
progress charts, practice-time tracking.

## Run it
```
npm install
npm run dev
```
Then open http://localhost:3000

## Setup
1. Copy `.env.local.example` to `.env.local` and add your Supabase Project URL
   (just `https://xxxx.supabase.co`, no `/rest/v1/`) and anon key.
2. In the Supabase SQL Editor:
   - New project: run `supabase/schema.sql`, then `supabase/exercises.sql`.
   - Existing project: just run `supabase/exercises.sql` (safe to re-run).
3. In Supabase > Authentication > URL Configuration:
   - Site URL: `http://localhost:3000` (your real domain once live)
   - Redirect URLs: add `http://localhost:3000/auth/callback`
     (and `https://YOUR-DOMAIN/auth/callback` once live)

## Accounts
- `proxy.ts` checks sign-in on the server before every page; signed-out
  visitors go to /login and come back to where they were heading.
- `/auth/callback` handles the links in Supabase emails (confirm email,
  reset password). `/reset-password` is where a student sets a new one.
- Videos in `public/` are still open to anyone with the link. Moving them to
  private storage comes with payments.

## Where things live
- `app/practice/[exerciseId]/page.tsx` — the practice screen
- `components/BpmGauge.tsx` — tempo dial + exercise progress ring
- `public/dial.svg` — dial artwork (replace with your own; ring geometry
  constants are at the top of `BpmGauge.tsx`)
- `lib/clickEngine.ts` — metronome click, accents, beat callback
- `lib/mockData.ts` — exercises (name, description, video file, original BPM)
- `lib/belts.ts` — belt thresholds and overall-belt averaging
- `public/` — put exercise videos here and point `videoUrl` at them
  (video must start exactly on beat 1, guitar only, no metronome)
- `?debug=1` on a practice URL shows a belt-up preview link
