# Requirements Document

## Introduction

This feature transforms the disc golf course walkthrough app from a client-side prototype into a full-service web application for browsing, previewing, and purchasing disc golf course walkthrough videos. The current app uses hardcoded course data in a JavaScript file, localStorage-based authentication, static video files served from the public folder, and an unverified Stripe Checkout flow that grants purchases based on URL query parameters. The goal is to introduce a database-driven course catalog (RDS PostgreSQL), secure video storage and delivery (S3 + CloudFront with signed URLs), JWT-based authentication, and server-side Stripe webhook verification — following the same Express + PostgreSQL + S3 patterns used in the photography-portfolio project. The frontend remains React + Vite (not Next.js) but adopts a typed API client and React Query for server state management.

## Glossary

- **App**: The disc golf course walkthrough React single-page application built with Vite
- **Backend_API**: The Express server providing REST endpoints for authentication, course catalog, purchases, and video access
- **Database**: The RDS PostgreSQL instance storing users, courses, layouts, holes, and purchase records (raw SQL via `pg`, no ORM)
- **Video_Store**: AWS S3 bucket storing course walkthrough video files (previews and full videos)
- **CDN**: AWS CloudFront distribution serving video content from the Video_Store
- **Auth_Service**: The backend JWT authentication module using bcrypt for password hashing and JWT for token management
- **Stripe_Service**: The Stripe payment platform used for checkout session creation and payment processing
- **Webhook_Handler**: The Express route that receives and processes Stripe webhook events with signature verification
- **Checkout_Session**: A Stripe-hosted payment page session created for a specific course purchase
- **Course**: A disc golf course walkthrough product stored in the Database, containing metadata, layouts, hole data, and references to video files in the Video_Store
- **Signed_URL**: A time-limited CloudFront URL granting temporary access to a protected video file in the Video_Store
- **API_Client**: The frontend service module that handles all HTTP communication with the Backend_API, including JWT token management

## Requirements

### Requirement 1: Database-Driven Course Catalog

**User Story:** As a content manager, I want courses stored in a PostgreSQL database, so that new courses can be added without code changes.

#### Acceptance Criteria

1. THE Database SHALL store each Course with an id, name, location, hole count, difficulty, price, description, preview video S3 key, full video S3 key, and thumbnail S3 key
2. THE Database SHALL store course layouts with a layout id, course id, name, description, and difficulty
3. THE Database SHALL store hole data with a hole id, layout id, hole number, distance, and par
4. WHEN the Backend_API receives a request to list courses, THE Backend_API SHALL query the Database and return all published courses with their metadata
5. WHEN the Backend_API receives a request for a single course by id, THE Backend_API SHALL return the course metadata, all associated layouts, and all hole data for each layout
6. THE Backend_API SHALL serve course thumbnail URLs as public CDN URLs from the CDN
7. IF the Database is unreachable, THEN THE Backend_API SHALL return a 503 status code with a descriptive error message

### Requirement 2: S3 Video Storage with Signed URL Delivery

**User Story:** As a content owner, I want full walkthrough videos protected behind signed URLs, so that only paying customers can access the complete content.

#### Acceptance Criteria

1. THE Video_Store SHALL store preview videos and full walkthrough videos as separate objects in S3, keyed by course identifier
2. THE CDN SHALL serve preview video files as publicly accessible URLs without authentication
3. WHEN an authenticated user with a verified purchase requests a full video, THE Backend_API SHALL generate a Signed_URL with a time-limited expiration and return the Signed_URL to the App
4. THE Backend_API SHALL set the Signed_URL expiration to a configurable duration stored in an environment variable
5. IF an unauthenticated user requests a full video URL, THEN THE Backend_API SHALL return a 401 status code
6. IF an authenticated user without a purchase requests a full video URL, THEN THE Backend_API SHALL return a 403 status code
7. THE Backend_API SHALL use the AWS SDK CloudFront signer to generate Signed_URLs for full video content

### Requirement 3: User Authentication via JWT

**User Story:** As a user, I want to sign up and log in with a secure authentication system, so that my account and purchases persist across devices and sessions.

#### Acceptance Criteria

1. WHEN a user submits a valid email and password for sign-up, THE Auth_Service SHALL hash the password with bcrypt, store the user record in the Database, and return a JWT access token
2. WHEN a user submits valid login credentials, THE Auth_Service SHALL verify the password against the stored bcrypt hash and return a JWT access token
3. THE Auth_Service SHALL include the user id and email in the JWT payload and sign the token with a secret stored in an environment variable
4. WHEN the App sends a request with a valid JWT in the Authorization header, THE Backend_API SHALL extract the user identity and authorize the request
5. IF a request includes an expired or invalid JWT, THEN THE Backend_API SHALL return a 401 status code with a descriptive error message
6. WHEN a user submits sign-up credentials with an email that already exists in the Database, THE Auth_Service SHALL return a 409 status code with a descriptive error message
7. THE Database SHALL store user records with an id, email, hashed password, and created-at timestamp

### Requirement 4: Course Browsing Experience

**User Story:** As a visitor, I want to browse available course walkthroughs in a grid layout, so that I can discover courses and decide which to purchase.

#### Acceptance Criteria

1. WHEN the App loads the course listing page, THE App SHALL fetch the course catalog from the Backend_API and display courses in a responsive grid
2. THE App SHALL display each course card with the thumbnail image, course name, location, difficulty badge, hole count, and price
3. WHEN a user clicks a course card, THE App SHALL navigate to the course detail page for that course
4. WHEN a user clicks the "View Details" button on a course card, THE App SHALL display a modal with the hole-by-hole scorecard, layout selector tabs, and course statistics
5. IF the Backend_API returns an error when fetching courses, THEN THE App SHALL display an error message with a retry option

### Requirement 5: Course Detail and Video Preview

**User Story:** As a user, I want to view course details and preview walkthrough videos, so that I can evaluate the content before purchasing.

#### Acceptance Criteria

1. WHEN a user navigates to a course detail page, THE App SHALL fetch the course data from the Backend_API and display the course name, location, difficulty, hole count, price, and description
2. WHEN a user views a course detail page, THE App SHALL load the public preview video URL from the CDN and begin playback
3. WHILE a user has not purchased the Course, THE App SHALL pause the preview video at 10 seconds and display a paywall overlay with the course price and a purchase button
4. WHEN a user has a verified purchase for the Course, THE App SHALL request a Signed_URL from the Backend_API and play the full walkthrough video without restrictions
5. THE App SHALL display the hole-by-hole scorecard with layout selector tabs below the video player on the course detail page

### Requirement 6: Stripe Checkout Session Creation

**User Story:** As a user, I want to purchase a course walkthrough through a secure checkout flow, so that I can unlock the full video content.

#### Acceptance Criteria

1. WHEN an authenticated user clicks the purchase button for a Course, THE Backend_API SHALL create a Checkout_Session via the Stripe_Service with the server-side course price, course id, and user id in the session metadata
2. WHEN the Checkout_Session is created, THE Backend_API SHALL return the Stripe checkout URL to the App
3. THE Backend_API SHALL use the course price stored in the Database when creating the Checkout_Session, ignoring any client-provided price
4. IF the Stripe_Service fails to create a Checkout_Session, THEN THE Backend_API SHALL return a 500 status code with a descriptive error message
5. IF an unauthenticated user attempts to initiate a purchase, THEN THE App SHALL redirect the user to the login screen before proceeding

### Requirement 7: Stripe Webhook Payment Verification

**User Story:** As the system operator, I want payments verified server-side via Stripe webhooks, so that purchases are only granted after confirmed payment.

#### Acceptance Criteria

1. WHEN the Stripe_Service sends a `checkout.session.completed` webhook event, THE Webhook_Handler SHALL verify the event signature using the Stripe webhook secret
2. WHEN a verified `checkout.session.completed` event is received, THE Webhook_Handler SHALL extract the user id and course id from the session metadata and create a purchase record in the Database
3. IF the webhook signature verification fails, THEN THE Webhook_Handler SHALL reject the event with a 400 status code and log the failure
4. IF a purchase record already exists for the same user and course, THEN THE Webhook_Handler SHALL skip duplicate creation and return a success response
5. THE Webhook_Handler SHALL process the raw request body for signature verification by using an Express raw body parser on the webhook route
6. THE Webhook_Handler SHALL be accessible via a public endpoint without JWT authentication, as Stripe cannot authenticate with JWT

### Requirement 8: Purchase Record Storage and Retrieval

**User Story:** As a user, I want my purchases stored persistently, so that I can access my purchased course walkthroughs from any device.

#### Acceptance Criteria

1. THE Database SHALL store each purchase record with the user id, course id, purchase timestamp, Stripe session id, and amount paid
2. THE Database SHALL enforce a unique constraint on the combination of user id and course id to prevent duplicate purchase records
3. WHEN an authenticated user requests their purchases, THE Backend_API SHALL return all purchase records associated with that user from the Database
4. WHEN an authenticated user views a Course detail page, THE App SHALL check the Backend_API to determine if the user has purchased that Course
5. IF the Database is unreachable when retrieving purchases, THEN THE Backend_API SHALL return a 503 status code with a descriptive error message

### Requirement 9: Frontend Purchase Flow and State Management

**User Story:** As a user, I want the app to reflect my purchase status after payment, so that I can immediately access purchased content.

#### Acceptance Criteria

1. WHEN the App loads after user authentication, THE App SHALL fetch the user's purchase list from the Backend_API and cache the result using React Query
2. WHEN a user returns from a successful Stripe checkout redirect, THE App SHALL poll the Backend_API for the new purchase record for up to 10 seconds at 2-second intervals
3. WHILE the App is polling for a purchase confirmation, THE App SHALL display a loading indicator on the course detail page
4. WHEN a purchase is confirmed via the Backend_API, THE App SHALL invalidate the purchases query cache and unlock the full video without requiring a page refresh
5. IF polling for a purchase exceeds 10 seconds without confirmation, THEN THE App SHALL display a message instructing the user to refresh the page

### Requirement 10: User Profile and Purchase History

**User Story:** As a user, I want to view my purchased courses in my profile, so that I can easily access content I have already bought.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the profile page, THE App SHALL fetch the user's purchase records from the Backend_API and display the associated course details
2. THE App SHALL display each purchased course with the thumbnail, course name, location, difficulty, hole count, and a link to watch the full walkthrough
3. WHILE the user has no purchases, THE App SHALL display an empty state message with a link to browse courses
4. THE App SHALL display the user's email address and account creation date on the profile page

### Requirement 11: Frontend API Client and Server State

**User Story:** As a developer, I want a centralized API client with React Query integration, so that server state is managed consistently across the application.

#### Acceptance Criteria

1. THE API_Client SHALL provide methods for authentication (login, signup, logout), course listing, course detail retrieval, purchase retrieval, and signed video URL requests
2. THE API_Client SHALL attach the JWT token from local storage to the Authorization header of every authenticated request
3. THE API_Client SHALL store the JWT token in local storage upon successful login and clear the token upon logout
4. WHEN the API_Client receives a 401 response, THE API_Client SHALL clear the stored JWT token and redirect the user to the login screen
5. THE App SHALL use React Query hooks to manage server state for courses, purchases, and user authentication

### Requirement 12: Backend Express Server Structure

**User Story:** As a developer, I want the backend organized with separate route files and service modules, so that the codebase is maintainable and follows the photography-portfolio patterns.

#### Acceptance Criteria

1. THE Backend_API SHALL organize routes into separate files for authentication, courses, purchases, video access, and Stripe webhooks
2. THE Backend_API SHALL use a PostgreSQL connection pool via the `pg` package with configuration from environment variables
3. THE Backend_API SHALL use environment variables for the Stripe secret key, Stripe webhook secret, JWT secret, database connection parameters, AWS credentials, S3 bucket name, and CloudFront distribution details
4. THE Backend_API SHALL use a JWT authentication middleware that verifies the Bearer token from the Authorization header before processing protected routes
5. THE Backend_API SHALL use raw SQL queries via the `pg` package without an ORM, following the photography-portfolio pattern
