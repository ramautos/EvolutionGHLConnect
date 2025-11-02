# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It aims to streamline communication and CRM processes by offering user authentication, role-based access control, automated WhatsApp instance management, and real-time connection monitoring. The platform supports storing and managing OpenAI API keys per GoHighLevel location for transcription services. It includes a hierarchical company management system with Stripe integration for billing, a free trial period, and automatic plan assignment based on WhatsApp instance usage, targeting significant market potential in business communication and CRM.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (November 2, 2025)
- **Trial Period Update**: Migrated from 15-day to 7-day free trial across entire codebase (storage.ts, auth.ts, bootstrap.ts, routes.ts, system_config)
- **API Integration Changes**: Replaced OpenAI/Calendar with ElevenLabs (voice services) and Gemini (transcriptions)
  - Removed: `openaiApiKey` and `calendarId` fields
  - Added: `elevenLabsApiKey` and `geminiApiKey` fields in subaccounts table
  - Backend strips API keys from all responses, only returns boolean flags (hasElevenLabsKey, hasGeminiKey)
  - Frontend uses write-only inputs for API keys (never displays existing values)
- **Dashboard Redesign**: Complete UI overhaul of SubaccountDetails page
  - WhatsApp instances moved to top in structured table format
  - Green "Conectado" badge for active instances (status: connected/open)
  - Color-coded trial countdown (red when ≤2 days remaining)
  - "Ver Planes" button with selectable plan options (Starter, Basic, Pro)
  - API configuration section shows ElevenLabs and Gemini logos with descriptive text
- **Security Enhancement**: API keys never exposed to client - write-only pattern with boolean status indicators
- **Stripe Integration**: Complete Stripe billing integration with 7-day free trial, checkout flow, webhooks, and BillingSuccess confirmation page
- **Favicon Update**: Changed favicon to use the official application logo (favicon.png, logo192.png, logo512.png)
- **Hero Spacing Fix**: Adjusted Hero section spacing from `min-h-screen` to `py-16 md:py-20 lg:py-24` to reduce excessive space between navbar and content

## System Architecture

### Frontend
-   **Framework**: React 19 (TypeScript, Vite)
-   **UI/UX**: Radix UI primitives, shadcn/ui ("New York" style) with Material Design influences, Tailwind CSS for styling with HSL-based theming, light/dark mode, and an elevation system.
-   **State Management**: React Query v5, UserContext, `useState`.
-   **Routing**: Wouter for navigation, including protected routes.
-   **Real-time**: Socket.io client for live WhatsApp status updates.

### Backend
-   **Runtime**: Node.js with Express.js.
-   **Authentication**: Passport.js with Local (bcrypt) and Google OAuth 2.0, using HttpOnly cookies for session management. Mandatory phone number registration on first login.
-   **Authorization**: Role-based middleware (`isAuthenticated`, `isAdmin`).
-   **API Design**: RESTful API for core functionalities including authentication, user management, subaccount operations, WhatsApp instance lifecycle, GoHighLevel integration, and admin features.
-   **Subaccount Management**: Integrates with GoHighLevel OAuth; n8n webhook intermediates token exchange and storage.
-   **WhatsApp Instance Management**: Uses Evolution API for instance creation, QR code generation, and status management, with real-time updates via Socket.io. Includes bidirectional synchronization and orphaned instance detection/deletion.
-   **Billing and Subscription**: 7-day free trial, automatic plan assignment (Starter, Basic, Pro) based on instance count, with subaccount-level billing and admin controls.
-   **CRM Settings & Webhook**: Per-subaccount API configuration including ElevenLabs API Key (voice services) and Gemini API Key (transcriptions). API keys never exposed to client - only boolean status flags returned. Global webhook configuration for forwarding messages from Evolution API.
-   **Admin Control System**: Comprehensive admin panel for hierarchical company management, user and subaccount oversight, manual billing/activation, and global webhook configuration.
-   **System Configuration**: Admin settings page (`/admin/settings`) with sections for Evolution API credentials, system info, trial period settings, and maintenance mode, persisted in the `system_config` table.

### Database Architecture
-   **Replit PostgreSQL (Neon)**: Primary application data storage (`companies`, `subaccounts`, `whatsappInstances`, `subscriptions`, `sessions`, `system_config`). The `subaccounts` table unifies CRM locations and authenticated users.
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens (`ghl_clientes`).
-   **Automatic Database Initialization**: Server automatically runs bootstrap on first startup to create default company, admin user, and system configuration using `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` environment variables.

## Deployment & Configuration

### First-Time Deployment
For the initial deployment to production, configure the following required environment secrets:

**Required Secrets**:
1. `DATABASE_URL` - Automatically configured by Replit PostgreSQL
2. `SESSION_SECRET` - Secure random string for session encryption
3. `ADMIN_INITIAL_EMAIL` - Email for the initial admin account (required on first boot only)
4. `ADMIN_INITIAL_PASSWORD` - Password for the initial admin account (required on first boot only)

**Production-Ready Bootstrap System**:
- **Health Check**: Smart routing at `/` responds in <1ms (no blocking operations, no database queries)
  - Health check probes (Accept: application/json) → JSON response
  - Browsers/crawlers (Accept: text/html) → React app
- **Process Lifecycle Management**: Server runs indefinitely with multiple safeguards
  - HTTP server listens on 0.0.0.0 (required for Autoscale)
  - setInterval keeps event loop active (redundant safety mechanism)
  - Comprehensive process event logging (beforeExit, exit, SIGTERM, SIGINT, uncaughtException, unhandledRejection)
- **Non-Blocking Startup**: Server starts immediately, bootstrap runs in background
  - Fire-and-forget pattern ensures health checks pass within timeout
  - Autoscale compatible (frequent restarts don't trigger unnecessary bootstraps)
- **Lazy Loading + Cache**: In-memory cache prevents repeated database queries
  - First startup checks `systemConfig.isInitialized` flag
  - Subsequent restarts use cached result (instant skip)
  - Concurrent bootstrap protection (single execution guarantee)
- **Automatic Bootstrap Process** (first time only):
  1. Creates default company
  2. Creates admin user with provided credentials (bcrypt hashed)
  3. Activates 7-day trial subscription
  4. Marks database as initialized
- **Graceful Degradation**: Server runs even if bootstrap fails (logged error only)

### Webhook Integration with Subaccount Claim System

#### Subaccount Claim System (Current - Production)
Secure OAuth flow where subaccounts are "claimed" by the authenticated user after creation.

**IMPORTANT ARCHITECTURAL CHANGE (2025-10-30)**:
- System NO LONGER creates companies automatically based on `ghlCompanyId`
- When user registers → Creates their OWN company
- When GHL subcuenta is installed → Created with `companyId = NULL` (pending claim)
- User claims subcuenta → Associates with their existing company
- This ensures: **One company per user, multiple subaccounts per company**

**Flow Overview:**
1. **User Registers**:
   - User creates account (email/password or Google OAuth)
   - System creates NEW company with user's email
   - Creates subaccount associated with that company

2. **User Initiates GHL OAuth**:
   - User clicks "Connect with GoHighLevel" button  
   - Frontend redirects to GoHighLevel OAuth

3. **OAuth Callback to N8N**:
   - GoHighLevel redirects to n8n with `code` (OAuth authorization code)
   - N8N exchanges code for access token
   - N8N fetches location data from GoHighLevel API

4. **N8N Webhook to Backend** (`POST /api/webhooks/register-subaccount`):
   - N8N sends webhook with complete client data
   - Backend creates subaccount with **companyId = NULL** (no owner yet)
   - Creates 7-day trial subscription
   - Does NOT create WhatsApp instance yet (pending claim)
   - Does NOT create company automatically

5. **N8N Redirects User**:
   - N8N responds with HTTP 302 redirect
   - Redirects to: `https://whatsapp.cloude.es/claim-subaccount?locationId={locationId}`

6. **Subaccount Claim** (`POST /api/subaccounts/claim`):
   - Frontend automatically calls claim endpoint with locationId
   - Backend validates:
     - User is authenticated
     - Subaccount has no company (companyId = NULL)
     - Subaccount was created <10 minutes ago (prevents old subaccount hijacking)
   - Associates subaccount with **authenticated user's company**
   - Creates WhatsApp instance with naming pattern `{locationId}_{sequential_number}`
   - Redirects to dashboard

**Required Webhook Payload:**
```json
{
  "email": "client@example.com",
  "name": "Client Name",
  "phone": "+1234567890",
  "locationId": "ghl_location_id",
  "locationName": "Subaccount Name",
  "ghlCompanyId": "ghl_company_id",
  "companyName": "Company Name"
}
```

**N8N Redirect Configuration:**
```javascript
// Respond to Webhook node:
{
  "status": 302,
  "headers": {
    "Location": "https://whatsapp.cloude.es/claim-subaccount?locationId={{locationId}}"
  }
}
```

**Security Features:**
- 10-minute claim window (prevents stale subaccount claims)
- User must be authenticated
- Subaccount automatically associated with authenticated user's company
- One-time claim per subaccount

**Legacy Support:**
If OAuth state validation is provided, subaccount is immediately associated with correct company (no claim needed).

## External Dependencies

### Third-Party APIs
-   **Evolution API**: WhatsApp Business API integration.
-   **GoHighLevel**: CRM platform OAuth 2.0.
-   **ElevenLabs**: Voice message services.
-   **Gemini**: AI transcription services.
-   **Stripe**: Subscription management and billing.

### Database Services
-   **Neon PostgreSQL**: Primary database.
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens.