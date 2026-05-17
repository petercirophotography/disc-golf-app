# Implementation Plan: Throw Tracker

## Overview

This plan implements the Throw Tracker PWA feature incrementally, starting with the database and backend API, then building the frontend services layer (offline support, caching, API client), followed by UI pages and components, analytics/charting, import/export, and finally PWA configuration. Each phase builds on the previous one so there is no orphaned code.

## Tasks

- [x] 1. Database schema and backend setup
  - [x] 1.1 Create the shared database connection module (`server/db.js`)
    - Create a PostgreSQL connection pool using the `pg` package
    - Read connection string from `DATABASE_URL` environment variable
    - Configure SSL for production
    - _Requirements: 16.2, 16.3_

  - [x] 1.2 Create the database migration file (`server/migrations/001_throw_tracker.sql`)
    - Define tables: discs, throwing_sessions, throws, putting_sessions, putts
    - Include CHECK constraints, generated columns (distance_feet, circle), indexes
    - Include uuid-ossp extension for UUID generation
    - _Requirements: 16.6, 12.1_

  - [x] 1.3 Implement disc CRUD endpoints in `server/routes/throw-tracker.js`
    - GET /api/throw-tracker/discs — list all discs
    - POST /api/throw-tracker/discs — create a disc (validate name and disc_type required)
    - PUT /api/throw-tracker/discs/:id — update a disc
    - DELETE /api/throw-tracker/discs/:id — delete a disc
    - Mount the router in `server/index.js`
    - _Requirements: 16.1, 16.3, 16.4, 16.5, 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 1.4 Implement throwing session and throw endpoints
    - GET/POST/PUT/DELETE for /api/throw-tracker/sessions
    - GET/POST for /api/throw-tracker/sessions/:id/throws (batch create)
    - PUT/DELETE for /api/throw-tracker/throws/:id (flag/unflag, delete)
    - Validate location required on session creation, default date to today
    - Validate throw_number between 1-3, distance_yards >= 0
    - _Requirements: 16.1, 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.6, 3.1, 3.4_

  - [x] 1.5 Implement putting session and putt endpoints
    - GET/POST/PUT/DELETE for /api/throw-tracker/putting-sessions
    - GET/POST for /api/throw-tracker/putting-sessions/:id/putts (batch create)
    - PUT/DELETE for /api/throw-tracker/putts/:id
    - Validate makes <= attempts, no negative values
    - _Requirements: 16.1, 14.1, 14.3, 14.9, 14.10_

  - [x] 1.6 Implement import, export, and restore endpoints
    - POST /api/throw-tracker/import — bulk import sessions/discs/throws
    - GET /api/throw-tracker/export — export all data as JSON
    - POST /api/throw-tracker/restore — restore from exported JSON
    - Import must not overwrite existing data
    - _Requirements: 16.1, 5.6, 13.1, 13.3_

  - [x] 1.7 Implement batch sync endpoint
    - POST /api/throw-tracker/sync — process array of queued operations in order
    - Handle create/update/delete for all entity types
    - Return results for each operation
    - _Requirements: 12.1, 12.6_

- [x] 2. Checkpoint — Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Frontend services layer (offline support)
  - [x] 3.1 Create the tracker API client (`src/services/trackerApi.js`)
    - HTTP client wrapping fetch for all throw-tracker endpoints
    - Base URL configuration
    - Error handling and response parsing
    - _Requirements: 12.4_

  - [x] 3.2 Create the IndexedDB cache service (`src/services/trackerCache.js`)
    - Open/create IndexedDB database with object stores: discs, throwingSessions, throws, puttingSessions, putts, syncQueue
    - CRUD operations for each store
    - Index creation for session_date, session_id, disc_id, putting_session_id
    - _Requirements: 12.3, 12.5_

  - [x] 3.3 Create the sync queue service (`src/services/syncQueue.js`)
    - Enqueue operations (entity_type, operation, entity_id, payload)
    - Drain queue in FIFO order when online
    - Exponential backoff on network errors (1s, 2s, 4s, max 30s)
    - Mark failed 4xx operations and surface to user
    - Trigger drain on: app startup, `online` event, every 30 seconds
    - _Requirements: 12.3, 12.5, 12.6, 15.8, 15.9_

  - [x] 3.4 Create the online status hook (`src/hooks/useOnlineStatus.js`)
    - Track `navigator.onLine` state
    - Listen for `online`/`offline` events
    - _Requirements: 12.5, 15.8_

  - [x] 3.5 Create the sync queue hook (`src/hooks/useSyncQueue.js`)
    - Expose pending count, failed operations, and manual retry
    - Trigger sync on online status change
    - _Requirements: 12.6, 15.9_

  - [x] 3.6 Create the tracker API hook (`src/hooks/useTrackerApi.js`)
    - Combine trackerApi + trackerCache + syncQueue
    - Reads: fetch from API when online (update cache), fall back to cache when offline
    - Writes: write to cache immediately, enqueue sync operation
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

- [x] 4. Checkpoint — Services layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Core UI components and routing
  - [x] 5.1 Set up React Router routes for the tracker section
    - Add `/tracker` route prefix with nested routes for all pages
    - Dashboard, Sessions, SessionDetail, PuttingSessions, PuttingDetail, Discs, Analytics, Import, Export
    - Add navigation component for tracker section
    - _Requirements: 14.2, 15.1_

  - [x] 5.2 Create the NumericInput component (`src/components/tracker/NumericInput.jsx`)
    - Mobile-optimized input with `inputMode="decimal"` for numeric keypad
    - Minimum 44x44px tap target
    - Inline validation for non-numeric/negative values
    - _Requirements: 15.1, 15.3, 2.5_

  - [x] 5.3 Create the OfflineIndicator component (`src/components/tracker/OfflineIndicator.jsx`)
    - Display sync status (online/offline, pending operations count)
    - Show when operations are queued or failed
    - _Requirements: 12.5, 15.8_

  - [x] 5.4 Create the DiscForm and DiscCard components
    - DiscForm: add/edit disc with name (required), disc_type (required), stability, brand, flight numbers, in_bag toggle
    - DiscCard: display disc properties with visual distinction by type/stability
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 15.1_

  - [x] 5.5 Create the SessionForm component (`src/components/tracker/SessionForm.jsx`)
    - Create/edit throwing session with date (default today), location (required), conditions
    - Validation error for missing location
    - _Requirements: 1.1, 1.2, 1.4, 15.1_

  - [x] 5.6 Create the ThrowEntry component (`src/components/tracker/ThrowEntry.jsx`)
    - 3-throw input form for a single disc within a session
    - Display computed average and max in feet
    - Flag toggle (roller/skip/outlier) per throw
    - Visual distinction for flagged throws
    - Disc selection via tap/swipe interaction
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4, 15.4_

  - [x] 5.7 Create the PuttEntry component (`src/components/tracker/PuttEntry.jsx`)
    - Distance input, attempts, makes entry
    - Large make/miss buttons for quick tap input on mobile
    - Validation: makes <= attempts, no negatives
    - Display C1/C2 classification based on distance
    - Support custom distances
    - _Requirements: 14.3, 14.4, 14.10, 14.11, 15.5_

- [x] 6. Page implementations
  - [x] 6.1 Implement the Dashboard page (`src/pages/tracker/Dashboard.jsx`)
    - Show recent throwing sessions and putting sessions
    - Quick stats: total sessions, total throws, recent averages
    - Navigation to all other tracker pages
    - _Requirements: 15.1_

  - [x] 6.2 Implement the Discs page (`src/pages/tracker/Discs.jsx`)
    - List all discs grouped by stability (VOS, OS, ST, US, VUS, then Putters)
    - Filter toggle for in_bag only
    - Add/edit disc via DiscForm
    - Toggle in_bag status
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 6.3 Implement the Sessions page (`src/pages/tracker/Sessions.jsx`)
    - List throwing sessions sorted by date (newest first)
    - Create new session button
    - Navigate to SessionDetail on tap
    - _Requirements: 1.1, 1.3_

  - [x] 6.4 Implement the SessionDetail page (`src/pages/tracker/SessionDetail.jsx`)
    - Display session info (date, location, conditions)
    - List throw sets per disc with averages and max
    - Add throws for a disc using ThrowEntry component
    - Flag/unflag individual throws
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.3, 3.4_

  - [x] 6.5 Implement the PuttingSessions page (`src/pages/tracker/PuttingSessions.jsx`)
    - List putting sessions sorted by date
    - Create new putting session
    - Navigate to PuttingDetail on tap
    - Separate from throwing sessions in navigation
    - _Requirements: 14.1, 14.2, 14.9_

  - [x] 6.6 Implement the PuttingDetail page (`src/pages/tracker/PuttingDetail.jsx`)
    - Display putting session info
    - List putts with distance, attempts, makes, percentage, C1/C2 classification
    - Add putts using PuttEntry component
    - Show per-session C1 and C2 percentages
    - _Requirements: 14.3, 14.4, 14.5, 14.6, 14.9_

- [x] 7. Checkpoint — Core UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Analytics engine and charts
  - [x] 8.1 Implement the analytics service (`src/services/analytics.js`)
    - computeAveragePerDiscPerSession(throws, discs) — exclude flagged
    - computeAverageByCategory(throws, discs, groupBy) — group by disc_type or stability
    - computeConsistency(throws, discs) — std dev and range per disc, exclude flagged
    - computeSessionComparison(sessions, throws) — overall avg per session, exclude flagged
    - computeDiscRankings(throws, discs) — sorted by avg distance descending, exclude flagged
    - computePuttingPercentages(putts) — C1 and C2 per session and overall
    - identifySessionExtremes(throws) — longest and shortest unflagged throws per session
    - groupByConditions(sessions, throws) — group session averages by conditions text
    - _Requirements: 6.1, 6.3, 7.1, 7.2, 7.4, 8.1, 8.2, 8.4, 9.1, 9.4, 10.1, 10.4, 11.1, 14.5, 14.6, 14.12_

  - [ ]* 8.2 Write property tests for analytics computations
    - **Property 1: Yards-to-feet conversion**
    - **Property 2: Throw set average and max computation**
    - **Property 4: Flagged throw exclusion from analytics**
    - **Property 13: Analytics average computation correctness**
    - **Property 14: Analytics spread computation correctness**
    - **Property 15: Session max/min identification**
    - **Property 16: Disc ranking sort order**
    - **Property 17: C1/C2 classification threshold**
    - **Property 18: Putting percentage computation**
    - **Validates: Requirements 2.1, 2.3, 2.4, 3.2, 6.1, 6.3, 7.1, 7.2, 7.4, 8.1, 8.2, 8.4, 9.1, 9.3, 9.4, 10.1, 10.4, 14.4, 14.5, 14.6, 14.12**

  - [x] 8.3 Create chart components
    - ChartDistanceTrend.jsx — line chart for avg distance over time per disc (multi-disc comparison)
    - ChartCategoryBar.jsx — bar chart for disc_type and stability averages
    - ChartConsistency.jsx — chart ranking discs by consistency (lowest spread first)
    - ChartPuttingTrend.jsx — line chart for C1% and C2% over time
    - Use Recharts library for all charts
    - Optimize chart layout for desktop viewports
    - _Requirements: 6.2, 6.4, 7.3, 8.3, 9.2, 14.7, 15.6_

  - [x] 8.4 Implement the Analytics page (`src/pages/tracker/Analytics.jsx`)
    - Tabbed interface: Distance Trends, Category, Consistency, Session Comparison, Disc Rankings, Putting, Conditions
    - Disc selector for trend charts (one or more discs)
    - Disc_type filter for rankings
    - Conditions keyword filter
    - Putting filter by specific distance
    - Display overall C1 and C2 putting percentages as summary stats
    - Display session longest/shortest throws
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 14.7, 14.8, 14.12, 14.13_

- [x] 9. Checkpoint — Analytics complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Import and export
  - [x] 10.1 Implement the importer service (`src/services/importer.js`)
    - Parse .xlsx files using SheetJS (xlsx package)
    - Parse .csv files
    - Map sheet/tab names matching date patterns to session dates
    - Map columns to disc fields (name, disc_type, stability, brand, flight_numbers, in_bag) and throw distances
    - Skip rows with missing required fields, count skipped rows
    - Return structured data ready for API import endpoint
    - Reject unsupported file formats with error
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ]* 10.2 Write property tests for importer
    - **Property 10: Import parse round-trip**
    - **Property 11: Import summary accuracy**
    - **Property 12: Import non-destructive invariant**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  - [x] 10.3 Implement the Import page (`src/pages/tracker/Import.jsx`)
    - File upload input accepting .xlsx and .csv
    - Preview parsed data before confirming import
    - Display import summary (sessions, discs, throws imported + skipped rows)
    - Error display for unsupported formats
    - _Requirements: 5.1, 5.4, 5.5, 5.7_

  - [x] 10.4 Implement the Export page (`src/pages/tracker/Export.jsx`)
    - Export button that fetches all data from API and triggers JSON download
    - Restore section: upload previously exported JSON file to restore data
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ]* 10.5 Write property tests for export/restore
    - **Property 20: Export/restore round-trip**
    - **Validates: Requirements 13.1, 13.3**

- [x] 11. Checkpoint — Import/Export complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Validation and data integrity
  - [x] 12.1 Implement client-side validation utilities
    - validateThrowDistance(value) — reject non-numeric, negative, NaN
    - validatePutt(attempts, makes) — reject makes > attempts, negatives
    - validateSession(session) — require location
    - validateDisc(disc) — require name and disc_type
    - yardsToFeet(yards) — multiply by 3
    - computeThrowSetStats(distances) — average and max in feet
    - classifyCircle(distanceFeet) — return 'C1' or 'C2'
    - groupDiscsByStability(discs) — return ordered groups
    - toggleInBag(disc) — flip in_bag boolean
    - _Requirements: 1.4, 2.1, 2.3, 2.4, 2.5, 4.2, 4.5, 14.4, 14.10_

  - [ ]* 12.2 Write property tests for validation and data utilities
    - **Property 1: Yards-to-feet conversion**
    - **Property 2: Throw set average and max computation**
    - **Property 3: Invalid throw input rejection**
    - **Property 5: Flag assignment round-trip**
    - **Property 6: Disc data round-trip**
    - **Property 7: In_bag toggle idempotence**
    - **Property 8: Disc stability grouping order**
    - **Property 9: Filter correctness**
    - **Property 17: C1/C2 classification threshold**
    - **Property 19: Putt validation — makes cannot exceed attempts**
    - **Validates: Requirements 1.4, 2.1, 2.3, 2.4, 2.5, 3.1, 3.4, 4.1, 4.3, 4.4, 4.5, 4.7, 14.4, 14.10**

- [x] 13. PWA configuration
  - [x] 13.1 Install and configure vite-plugin-pwa
    - Add vite-plugin-pwa to vite.config.js
    - Configure Workbox: precache app shell, NetworkFirst for API routes, CacheFirst for images/fonts
    - Set registerType to 'autoUpdate'
    - _Requirements: 15.7, 15.10_

  - [x] 13.2 Create the web app manifest (`public/manifest.json`)
    - App name, short name, description, start_url, display: standalone
    - Theme color, background color
    - Icon references (192x192, 512x512)
    - _Requirements: 15.7, 15.10_

  - [x] 13.3 Create PWA icons
    - Generate/create icon-192.png and icon-512.png in public/icons/
    - _Requirements: 15.7_

  - [ ]* 13.4 Write integration tests for offline behavior
    - Verify sync queue persists to IndexedDB and drains on reconnect
    - Verify app functions with cached data when offline
    - **Property 21: Sync queue drain completeness**
    - **Validates: Requirements 12.3, 12.5, 12.6, 15.8, 15.9**

- [x] 14. Final checkpoint — All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between phases
- Property tests validate universal correctness properties from the design document
- The backend uses raw SQL via `pg` (no ORM) matching the existing photography-portfolio patterns
- All frontend code uses JSX (not TypeScript) matching the existing project
- Recharts is used for all chart components
- SheetJS (xlsx) is used for Excel/CSV parsing
- fast-check is used for property-based tests with Vitest as the test runner
