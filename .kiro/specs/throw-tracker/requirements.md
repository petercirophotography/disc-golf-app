# Requirements Document

## Introduction

The Throw Tracker is a personal web application that replaces an Excel-based disc golf practice throw tracking workflow. The tool allows a single user to log practice sessions on a marked football field, record throw distances for each disc (3 throws per disc per session), manage a disc inventory, import historical data from Excel/CSV, and visualize performance trends over time. The application also supports putting practice tracking, allowing the user to log make/miss results from Circle 1 (C1) and Circle 2 (C2) distances during backyard practice sessions and monitor putting accuracy improvement over time. The application is designed mobile-first for on-site data entry at the football field or backyard, with touch-friendly inputs optimized for quick recording on a phone. It is installable as a Progressive Web App (PWA) with offline support for use in areas with spotty connectivity. The application prioritizes simplicity and lightweight architecture using React + Vite with RDS PostgreSQL for persistent storage, with offline-first PWA caching that syncs to the database when online.

## Glossary

- **App**: The Throw Tracker web application
- **Session**: A single practice outing on a specific date at a specific location, containing throws for one or more discs
- **Throw**: A single recorded throw of a disc, measured in yards and converted to feet
- **Throw_Set**: A group of 3 throws for a single disc within a single session
- **Disc**: A disc golf disc in the user's inventory, characterized by name, type, stability, brand, and flight numbers
- **Disc_Type**: The category of a disc: Driver, Fairway, Midrange, or Putter
- **Stability**: The flight stability category of a disc: VOS (Very Overstable), OS (Overstable), ST (Stable), US (Understable), or VUS (Very Understable)
- **Flight_Numbers**: A set of four numeric ratings for a disc: Speed, Glide, Turn, and Fade
- **In_Bag**: A boolean flag indicating whether a disc is currently carried in the user's bag
- **Throw_Flag**: A tag applied to a throw indicating it was a roller, skip, or outlier
- **Conditions**: Weather and environmental details for a session including temperature, cloud cover, and wind speed/direction
- **Importer**: The component responsible for parsing Excel/CSV files into session and disc data
- **Analytics_Engine**: The component responsible for computing statistics and generating chart data from session history
- **Session_Store**: The PostgreSQL database tables storing all application data, accessed via the Express backend API
- **Backend_API**: The Express server providing REST endpoints for data storage and retrieval, reusing the existing photography-portfolio backend infrastructure
- **Database**: The existing RDS PostgreSQL instance (shared with the photography-portfolio project) storing discs, sessions, throws, and putting data
- **Putting_Session**: A practice session focused on putting, recording makes and attempts at various distances
- **C1**: Circle 1, the area within 33 feet of the basket where putts are expected to be made at a high percentage
- **C2**: Circle 2, the area between 33 and 66 feet from the basket where putts are more difficult
- **Putting_Percentage**: The ratio of successful putts (makes) to total attempts, expressed as a percentage
- **PWA**: Progressive Web App, a web application that can be installed on a device and function like a native app with offline support

## Requirements

### Requirement 1: Session Creation

**User Story:** As a user, I want to create a new practice session with date, location, and conditions, so that I can organize my throws by outing.

#### Acceptance Criteria

1. WHEN the user creates a new session, THE App SHALL record the session date, location name, and conditions text
2. THE App SHALL default the session date to the current date
3. WHEN a session is saved, THE Session_Store SHALL persist the session data to the Database via the Backend_API
4. IF the user attempts to create a session without a location, THEN THE App SHALL display a validation error indicating location is required

### Requirement 2: Throw Data Entry

**User Story:** As a user, I want to log 3 throws per disc per session in yards and see them automatically converted to feet, so that I can record my practice results without manual conversion.

#### Acceptance Criteria

1. WHEN the user enters a throw distance in yards, THE App SHALL convert the value to feet by multiplying by 3
2. THE App SHALL accept exactly 3 throw entries per disc per session as a Throw_Set
3. WHEN all 3 throws in a Throw_Set are recorded, THE App SHALL calculate and display the average distance in feet
4. WHEN all 3 throws in a Throw_Set are recorded, THE App SHALL identify and display the maximum distance in feet
5. IF the user enters a non-numeric or negative value for a throw distance, THEN THE App SHALL display a validation error
6. WHEN a Throw_Set is saved, THE Session_Store SHALL persist the throw data to the Database via the Backend_API

### Requirement 3: Throw Flagging

**User Story:** As a user, I want to flag individual throws as rollers, skips, or outliers, so that unusual throws do not skew my distance averages.

#### Acceptance Criteria

1. THE App SHALL allow the user to assign a Throw_Flag of "roller", "skip", or "outlier" to any individual throw
2. WHEN a throw is flagged, THE Analytics_Engine SHALL exclude that throw from average distance calculations by default
3. THE App SHALL visually distinguish flagged throws from normal throws in the session view
4. THE App SHALL allow the user to remove a Throw_Flag from a previously flagged throw

### Requirement 4: Disc Inventory Management

**User Story:** As a user, I want to maintain a list of my discs with their properties, so that I can select discs when logging throws and track performance per disc.

#### Acceptance Criteria

1. THE App SHALL store each Disc with the following properties: name, Disc_Type, Stability, brand, Flight_Numbers (speed, glide, turn, fade), and In_Bag status
2. WHEN the user adds a new disc, THE App SHALL require at minimum a disc name and Disc_Type
3. THE App SHALL allow the user to edit any property of an existing Disc
4. THE App SHALL allow the user to toggle the In_Bag status of any Disc
5. THE App SHALL display discs grouped by Stability category in the order: VOS, OS, ST, US, VUS, then Putters
6. WHEN a disc is saved or updated, THE Session_Store SHALL persist the disc data to the Database via the Backend_API
7. THE App SHALL allow the user to filter the disc list to show only In_Bag discs

### Requirement 5: Excel/CSV Import

**User Story:** As a user, I want to import my existing Excel spreadsheet data, so that I retain my historical session and throw records.

#### Acceptance Criteria

1. WHEN the user uploads an Excel (.xlsx) or CSV file, THE Importer SHALL parse the file and extract session, disc, and throw data
2. THE Importer SHALL map spreadsheet columns to the corresponding App data fields: location, conditions, disc name, Disc_Type, Stability, In_Bag, brand, Flight_Numbers, and throw distances
3. WHEN the Importer encounters a sheet/tab name matching a date pattern, THE Importer SHALL create a session with that date
4. IF the Importer encounters rows with missing required fields, THEN THE Importer SHALL skip those rows and report the count of skipped rows to the user
5. WHEN import completes successfully, THE App SHALL display a summary showing the number of sessions, discs, and throws imported
6. THE Importer SHALL not overwrite existing session data in the Database; imported sessions SHALL be added alongside existing data
7. IF the uploaded file format is not recognized, THEN THE App SHALL display an error indicating supported formats

### Requirement 6: Distance Trend Analytics

**User Story:** As a user, I want to see how my throw distances change over time per disc, so that I can track my improvement.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL compute average distance per disc per session across all sessions
2. WHEN the user views distance trends, THE App SHALL display a line chart showing average distance over time for a selected disc
3. THE Analytics_Engine SHALL exclude flagged throws from trend calculations
4. THE App SHALL allow the user to select one or more discs to compare on the same trend chart

### Requirement 7: Category-Based Analytics

**User Story:** As a user, I want to see my average distances grouped by disc type and stability category, so that I can understand my strengths across disc categories.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL compute average distance grouped by Disc_Type across all sessions
2. THE Analytics_Engine SHALL compute average distance grouped by Stability category across all sessions
3. WHEN the user views category analytics, THE App SHALL display bar charts for both Disc_Type and Stability groupings
4. THE Analytics_Engine SHALL exclude flagged throws from category calculations

### Requirement 8: Consistency Analysis

**User Story:** As a user, I want to see the spread between my throws for each disc, so that I can identify which discs I throw most consistently.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL compute the standard deviation of throw distances per disc across all Throw_Sets
2. THE Analytics_Engine SHALL compute the range (max minus min) of throw distances per disc per session
3. WHEN the user views consistency analysis, THE App SHALL display a chart ranking discs by consistency (lowest spread first)
4. THE Analytics_Engine SHALL exclude flagged throws from consistency calculations

### Requirement 9: Session Comparison

**User Story:** As a user, I want to compare my performance across sessions, so that I can see session-over-session improvement.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL compute overall average distance per session across all discs thrown
2. WHEN the user views session comparison, THE App SHALL display a chart showing overall average distance per session over time
3. THE App SHALL identify and display the longest and shortest throws within each session
4. THE Analytics_Engine SHALL exclude flagged throws from session comparison calculations

### Requirement 10: Best and Worst Performing Discs

**User Story:** As a user, I want to see which discs I throw the farthest and shortest on average, so that I can make informed decisions about my bag.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL rank all discs by overall average distance across all sessions
2. WHEN the user views disc performance rankings, THE App SHALL display a sorted list or chart showing each disc's average distance
3. THE App SHALL allow the user to filter rankings by Disc_Type
4. THE Analytics_Engine SHALL exclude flagged throws from ranking calculations

### Requirement 11: Conditions Correlation

**User Story:** As a user, I want to see how weather and wind conditions affect my throw distances, so that I can understand environmental impacts on my performance.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL group session averages by conditions text for comparison
2. WHEN the user views conditions analysis, THE App SHALL display session performance alongside recorded conditions
3. THE App SHALL allow the user to filter sessions by conditions containing specific keywords (e.g., "Wind")

### Requirement 12: Data Persistence

**User Story:** As a user, I want my data to persist reliably in a server-side database with offline support, so that I do not lose my throw history.

#### Acceptance Criteria

1. THE Backend_API SHALL store all session, disc, throw, and putting data in PostgreSQL tables
2. THE Backend_API SHALL use the existing RDS PostgreSQL connection pool (same as photography-portfolio)
3. THE App SHALL cache data locally for offline use and sync with the Backend_API when online
4. THE App SHALL use the Backend_API as the source of truth for all data
5. IF the Backend_API is unreachable, THEN THE App SHALL continue functioning with locally cached data and queue changes for sync
6. WHEN connectivity is restored, THE App SHALL sync queued changes to the Backend_API

### Requirement 13: Data Export

**User Story:** As a user, I want to export my data as a portable backup, so that I have a local copy and can migrate to another system if needed.

#### Acceptance Criteria

1. WHEN the user triggers a data export, THE App SHALL generate a JSON file containing all sessions, discs, and throws retrieved from the Backend_API
2. THE App SHALL trigger a browser download of the exported JSON file
3. WHEN the user uploads a previously exported JSON file, THE App SHALL restore the data from that file into the Database via the Backend_API

### Requirement 14: Putting Practice Tracking

**User Story:** As a user, I want to track my putting practice results from Circle 1 and Circle 2 distances, so that I can monitor my putting accuracy improvement over time.

#### Acceptance Criteria

1. WHEN the user creates a new Putting_Session, THE App SHALL record the session date, location (e.g., "Backyard"), and optional conditions
2. THE App SHALL keep Putting_Sessions separate from throwing Sessions in navigation and listing views while remaining within the same application
3. WHEN the user records putts, THE App SHALL allow entry of a specific distance in feet (e.g., 15, 20, 25, 30 for C1; 35, 40, 50, 60 for C2) along with the number of attempts and makes at that distance
4. THE App SHALL classify each recorded distance as C1 (inside 33 feet) or C2 (33-66 feet) based on the entered distance value
5. WHEN a Putting_Session contains recorded putts, THE Analytics_Engine SHALL calculate the C1 Putting_Percentage by dividing total makes by total attempts across all distances within 33 feet
6. WHEN a Putting_Session contains recorded putts, THE Analytics_Engine SHALL calculate the C2 Putting_Percentage by dividing total makes by total attempts across all distances between 33 and 66 feet
7. WHEN the user views putting trends, THE App SHALL display a line chart showing C1 Putting_Percentage and C2 Putting_Percentage over time across Putting_Sessions
8. THE App SHALL allow the user to filter putting results by specific distance to view accuracy at that range over time
9. WHEN a Putting_Session is saved, THE Session_Store SHALL persist the putting data to the Database via the Backend_API
10. IF the user enters attempts less than makes or a negative value for either, THEN THE App SHALL display a validation error
11. THE App SHALL allow the user to define custom distances to practice from, in addition to the default distance options
12. THE Analytics_Engine SHALL compute an overall C1 Putting_Percentage and an overall C2 Putting_Percentage across all Putting_Sessions
13. WHEN the user views putting analytics, THE App SHALL display the overall C1 Putting_Percentage and overall C2 Putting_Percentage as summary statistics

### Requirement 15: Mobile-First Responsive Design

**User Story:** As a user, I want to use the app on my mobile device at the football field or in my backyard to record data in real-time, so that I can log throws and putts immediately without needing a computer.

#### Acceptance Criteria

1. THE App SHALL use a mobile-first responsive layout with touch-friendly inputs and large tap targets (minimum 44x44 pixels)
2. THE App SHALL minimize scrolling required for throw and putt data entry on mobile viewports
3. WHEN the user enters throw distances on a mobile device, THE App SHALL present a numeric keypad input for distance values
4. WHEN the user enters throw data on a mobile device, THE App SHALL provide tap or swipe interactions for disc selection
5. WHEN the user records putts on a mobile device, THE App SHALL provide large make and miss buttons for quick tap input
6. WHILE the user is viewing charts and analytics, THE App SHALL optimize the layout for desktop viewports with larger chart dimensions and additional detail
7. THE App SHALL be installable as a PWA by providing a valid web app manifest and service worker, allowing the user to add the app to the device home screen
8. WHILE the device is offline, THE App SHALL allow the user to continue recording throws and putts using locally cached data and queue changes for synchronization
9. WHEN the device regains network connectivity, THE App SHALL synchronize any queued changes with the Backend_API
10. THE App SHALL function without browser chrome when launched from the home screen as an installed PWA

### Requirement 16: Backend API for Data Storage

**User Story:** As a user, I want my throw tracker data stored in a reliable server-side database, so that my data is durable and accessible from any device.

#### Acceptance Criteria

1. THE Backend_API SHALL expose REST endpoints for CRUD operations on discs, sessions, throws, and putting sessions
2. THE Backend_API SHALL use the existing PostgreSQL connection pool from the photography-portfolio project
3. THE Backend_API SHALL use raw SQL queries via the pg package (matching photography-portfolio patterns)
4. THE Backend_API SHALL organize routes in a separate file (e.g., routes/throw-tracker.ts) within the existing photography-portfolio backend
5. THE Backend_API SHALL not require authentication (single personal user tool)
6. THE Database SHALL store tables for: discs, throwing_sessions, throws, putting_sessions, and putts
