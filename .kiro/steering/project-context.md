# Disc Golf App — Project Context

## Overview

This workspace contains two related features within a single React + Vite application:

1. **Course Walkthroughs** — A video-based disc golf course walkthrough marketplace (browse, preview, purchase)
2. **Throw Tracker** — A personal practice tracking tool (field sessions, putting practice, analytics)

## Architecture

- **Frontend**: React 18 + Vite + React Router 6 (plain JSX, no TypeScript)
- **Backend**: Express server at `server/index.js` (ES modules, port 3001)
- **Database**: AWS RDS PostgreSQL (shared with photography-portfolio project)
  - Endpoint: `photography-portfolio-db.cheqwuyuye7a.us-east-2.rds.amazonaws.com`
  - Database: `photography_portfolio`
  - Connection: `server/db.js` with `pg` package, raw SQL (no ORM)
- **Styling**: Plain CSS (no Tailwind), mobile-first for tracker section
- **Charts**: Recharts
- **Excel Import**: SheetJS (xlsx)
- **PWA**: vite-plugin-pwa with Workbox

## Key Patterns

- Backend routes in `server/routes/throw-tracker.js` (single file for all tracker endpoints)
- Frontend hooks in `src/hooks/useTrackerApi.js` provide data access with offline fallback
- IndexedDB cache in `src/services/trackerCache.js` for offline support
- Sync queue in `src/services/syncQueue.js` (only queues when offline)
- Analytics computations in `src/services/analytics.js` (all values from PostgreSQL come as strings — always use `parseFloat()`)
- Disc ordering: grouped by stability (VOS, OS, ST, US, VUS, then Putters), sorted by speed DESC within each group

## Database Tables (Throw Tracker)

- `discs` — disc inventory with flight numbers
- `throwing_sessions` — field practice sessions
- `throws` — individual throws (3 per disc per session), has `distance_feet` as generated column
- `putting_sessions` — putting practice sessions
- `putts` — putt records with distance, attempts, makes, disc_id (optional)

## Specs

- `.kiro/specs/stripe-payment-integration/` — Course walkthrough app (requirements done, design + tasks pending)
- `.kiro/specs/throw-tracker/` — Throw tracker (requirements, design, tasks all done, implementation complete)

## Deployment (Not Yet Done)

- Frontend: Deploy to Vercel
- Backend: Add throw-tracker routes to existing EC2 Express server (same as photography-portfolio)
- The app needs deployment so it can be used on mobile at the football field

## Related Project

- `photography-portfolio` at `~/Documents/Projects/photography-portfolio` — shares the same RDS instance, EC2 server, and AWS infrastructure. Patterns from that project (Express routes, pg raw SQL, JWT auth, S3 service) are reused here.

## Known Issues / TODO

- Analytics parseFloat: PostgreSQL numeric columns return strings via `pg` driver — all analytics functions must use `parseFloat()`
- Putting rework needed: Currently tracks batch totals (attempts/makes). Should track individual putt attempts (make/miss per throw) for better granularity
- Distance Trends chart: Too many lines when showing all discs — use the filter buttons (by type or stability)
- Import: Only works for the Template tab layout. Older session tabs (10-26, 11-16) have different column layouts
- Offline sync: Only queues when offline now (fixed). Clear IndexedDB if stale data appears
