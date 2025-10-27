# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform that integrates WhatsApp Business with GoHighLevel CRM. It provides comprehensive user authentication (email/password + Google OAuth), role-based access control, automated WhatsApp instance management, and real-time connection monitoring. WhatsApp instances are named using the GoHighLevel locationId with sequential numbering (e.g., `12334455_1`, `12334455_2`) for easy identification and n8n routing. The platform aims to streamline communication and CRM processes for businesses, offering significant market potential by bridging two critical business tools.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 19 (TypeScript, Vite)
- **UI/UX**: Radix UI primitives, shadcn/ui ("New York" style) with Material Design influences.
- **Styling**: Tailwind CSS with HSL-based theming, light/dark mode, and an elevation system.
- **Typography**: Inter (body/UI), Space Grotesk (headings/accent).
- **State Management**: React Query v5 for server state, UserContext for authentication, and `useState` for local UI state.
- **Routing**: Wouter for navigation, including protected routes.
- **Real-time**: Socket.io client for live WhatsApp status updates.

### Backend
- **Runtime**: Node.js with Express.js.
- **Authentication**: Passport.js with Local (bcrypt) and Google OAuth 2.0 strategies.
- **Session Management**: PostgreSQL session store (connect-pg-simple) using HttpOnly cookies with a 1-week TTL.
- **Authorization**: Role-based middleware (`isAuthenticated`, `isAdmin`).
- **API Design**: RESTful API with over 70 endpoints for authentication, user management, subaccount operations, WhatsApp instance lifecycle, and GoHighLevel integration.

### Database Architecture
**Dual Database System**:
1.  **Replit PostgreSQL (Neon)**: Stores application-specific data including `users` (authentication, profiles, roles), `subaccounts` (GoHighLevel locations mapped to users), `whatsappInstances` (WhatsApp connection details), and `sessions`.
2.  **External GHL PostgreSQL**: Dedicated to storing GoHighLevel OAuth tokens (`ghl_clientes`) managed via an n8n webhook.

### Authentication Flow
Supports email/password registration and login, as well as Google OAuth. All flows establish a Passport session, redirect to the dashboard, and utilize `UserContext` for client-side authentication state. Protected routes enforce authentication via `req.isAuthenticated()`.

### Subaccount Management Flow (GoHighLevel OAuth)
Users add subaccounts by initiating a full-page redirect to GoHighLevel OAuth. An n8n webhook (`https://ray.cloude.es/webhook/registrocuenta`) acts as an intermediary to exchange authorization codes for tokens, storing them in the External GHL DB, and redirecting back to the application with relevant IDs. The backend then fetches location details from the GHL API and creates a subaccount record. This full-page redirect approach is used due to Replit's iframe environment limitations.

### WhatsApp Instance Management
Allows users to create and manage multiple WhatsApp instances per subaccount. The backend integrates with the Evolution API to create instances, generate QR codes for connection, and manage their status (e.g., connected, disconnected). Real-time status updates are pushed to the frontend via Socket.io.

### Design System
Employs a consistent design system with CSS utilities for elevation, HSL color variables for theme consistency (light/dark mode), 4px base unit spacing, responsive layouts, and customized shadcn/ui components.

## External Dependencies

### Third-Party APIs
-   **Evolution API**: For WhatsApp Business API integration (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`).
-   **GoHighLevel**: CRM platform OAuth 2.0 for integration (`GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`).

### Database Services
-   **Neon PostgreSQL**: Primary database for application data (`DATABASE_URL`).
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens (`GHL_DB_*`).

### UI Libraries
-   Radix UI, shadcn/ui, React Hook Form, Zod, QRCode.react, canvas-confetti.

### Build Tools
-   Vite, TypeScript, Tailwind CSS, PostCSS, esbuild.

### Environment Variables (Required)
-   `DATABASE_URL`
-   `SESSION_SECRET`
-   `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
-   `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`
-   `GHL_DB_HOST`, `GHL_DB_PORT`, `GHL_DB_NAME`, `GHL_DB_USER`, `GHL_DB_PASSWORD`
-   `NODE_ENV` (development | production)
-   Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
## Recent Updates (October 27, 2025)

### Instance Naming Convention Change (October 27, 2025)
**Feature**: Changed instance naming from `wa-locationId` to sequential numbering format

**Implementation**:
- WhatsApp instances now use format: `{locationId}_{number}`
  - First instance: `12334455_1`
  - Second instance: `12334455_2`
  - Third instance: `12334455_3`, etc.
- Auto-counts existing instances for the locationId before creating new ones
- Makes routing and identification easier in n8n workflows
- Evolution API instances maintain consistent naming with application database

**Technical Details**:
- Modified `createWhatsappInstance()` in `server/storage.ts`
- Uses `getWhatsappInstancesByLocationId()` to count existing instances
- Sequential numbering: `${locationId}_${existingCount + 1}`
- Production build: `dist/index.js` (71.5kb)

## Recent Updates (October 27, 2025)

### Phone Number Registration & Profile Management (October 27, 2025)
**Feature**: Mandatory phone registration on first login + user profile management page

**Implementation**:
1. **Database Schema**:
   - Added `phoneNumber` field to `users` table (nullable text with country code)
   - Created validation schemas: `updateUserProfileSchema`, `updateUserPasswordSchema`

2. **Phone Registration Dialog**:
   - Mandatory popup on first login using `react-phone-input-2` library
   - Auto-detects country based on phone number format
   - Shows country flags automatically
   - Cannot be closed until phone number is registered
   - Integrated in Dashboard - shows when `!user?.phoneNumber`

3. **API Endpoints**:
   - `PATCH /api/user/profile` - Update name and phone number
   - `PATCH /api/user/password` - Change password (email/password users only)
   - `/api/auth/me` returns `hasPassword` flag to distinguish Google vs email/password users

4. **Profile Page** (`/profile`):
   - Update personal info: name, phone number (with country flags)
   - Change password form (only for email/password users)
   - Email display (read-only)
   - Accessible via user name button in Dashboard header

**Technical Details**:
- Uses `react-phone-input-2` for phone input with flags and country detection
- Preferred countries: DO, US, MX, CO, VE
- Phone numbers stored with `+` prefix (e.g., `+18094973030`)
- Password changes use bcrypt for hashing
- User context automatically refreshes after profile updates via `refetch()`

**User Flow**:
1. New user logs in → Phone registration dialog appears
2. User enters phone number → Country flag auto-detects
3. Submit → Dialog closes, dashboard accessible
4. User can update profile anytime via user name button → `/profile`

### Phone Number Display Fix
**Issue**: WhatsApp phone numbers weren't displaying after QR code scan
**Root Cause**: Evolution API returns phone numbers in WhatsApp JID format (`phoneNumber@s.whatsapp.net`)  
**Solution**: 
- Created `extractPhoneNumber()` helper function to parse JID format
- Updated webhook handler and polling mechanism to extract clean phone numbers
- Polling now detects connected instances without phone numbers and updates them
- Production build ready: `dist/index.js` (60.3kb)

### Subaccount Management Page
- Complete `/subaccount/:id` page for managing WhatsApp instances
- Features: create instances, generate QR codes, delete instances, view phone numbers
- Real-time status badges (connected, disconnected, qr_generated)
- Dashboard buttons ("Gestionar", "WhatsApp") navigate to subaccount details

**Next Step**: Publish to production for changes to take effect at whatsapp.cloude.es

### Disconnection Tracking Feature
**Feature**: Track when WhatsApp instances disconnect and display the information to users
**Implementation**:
- Added `disconnectedAt` timestamp field to `whatsapp_instances` table
- Updated webhook handler to set `disconnectedAt` when Evolution API sends "close" state
- Updated polling (every 5s) to detect disconnections and set timestamp
- UI displays "Desconectado hace X tiempo" with human-readable relative time (using date-fns)
- Schema validation (`updateWhatsappInstanceSchema`) permits `disconnectedAt` field

**Technical Details**:
- Database: PostgreSQL timestamp column `disconnected_at`
- Backend: Sets timestamp when `state === "close"` in webhook or polling
- Frontend: Uses `formatDistanceToNow` from date-fns with Spanish locale
- Real-time: Socket.io emits `instance-disconnected` event with timestamp

### Bidirectional Synchronization System (October 27, 2025)
**Feature**: Complete bidirectional sync between WhatsApp App ↔ Evolution API ↔ Web Application
**Problems Solved**:
1. ❌ Deleting instance from web app didn't remove it from Evolution API (showed "connected")
2. ❌ Phone numbers not displaying after QR scan despite being in Evolution API
3. ❌ Evolution API creating instances with `_1`, `_2` suffixes
4. ❌ Disconnecting/deleting from WhatsApp app didn't sync to Evolution API

**Implementation**:
1. **Enhanced DELETE endpoint** (`/api/instances/:id`)
   - Now deletes from both Evolution API AND database
   - Gracefully handles cases where instance already deleted from Evolution API
   - Logs: `✅ Deleted instance from Evolution API`, `🗑️ Instance deleted from database`

2. **Improved extractPhoneNumber() helper**
   - Handles WhatsApp JID format: `phoneNumber@s.whatsapp.net`
   - Handles plain numbers with/without `+` prefix
   - Removes whitespace and common separators: `()-`
   - Validates numeric format and length (10-15 digits)
   - Comprehensive logging for debugging

3. **Smart instance creation** (`/api/instances/:id/generate-qr`)
   - Checks if instance exists in Evolution API before creating
   - Deletes old instance first to prevent `_1`, `_2` suffixes
   - Creates fresh instance with exact name: `wa-{locationId}`
   - Logs: `🔍 Checking...`, `🗑️ Deleting old...`, `🆕 Creating fresh...`

4. **Enhanced webhook handler** (`/api/webhooks/evolution`)
   - Tries multiple sources for phone number:
     - `event.data.phoneNumber`
     - `event.data.owner`
     - Fallback: fetch from Evolution API via `getInstanceInfo()`
   - Uses improved `extractPhoneNumber()` for all sources
   - Logs: `📞 Webhook didn't provide phone number, fetching from Evolution API...`

5. **Intelligent polling system** (every 5s)
   - Detects disconnections (`state === "close"`)
   - Detects instances deleted from WhatsApp (404/not found errors)
   - Auto-deletes orphaned instances from database
   - Backfills missing phone numbers for connected instances
   - Emits Socket.io events: `instance-deleted`, `instance-disconnected`, `instance-connected`
   - Logs: `🗑️ Instance no longer exists in Evolution API - deleting from database`

6. **Manual sync endpoint** (`POST /api/instances/:id/sync`)
   - Force sync single instance with Evolution API
   - Returns current state, phone number, and status
   - Handles missing instances gracefully
   - Frontend: RefreshCw button with loading spinner

7. **Frontend improvements** (`SubaccountDetails.tsx`)
   - Added sync button with RefreshCw icon (animated when loading)
   - Toast notifications for sync results
   - Shows phone number immediately after sync
   - Better status indicators

**Technical Details**:
- Backend: Enhanced error detection (404 errors indicate deleted instances)
- Logs: Emoji-prefixed for easy debugging (📱 phone, 🔄 sync, 🗑️ delete, ✅ success)
- Real-time: Socket.io events keep frontend in sync
- Build: `dist/index.js` (68.6kb), `index-NOm6XC9M.js` (477.66kb)

**Latest Update**: Fixed Evolution API Response Format (October 27, 2025)
**Critical Bug Found & Fixed**:
- Evolution API `/instance/fetchInstances` returns **array** `[{...}]` not object `{instance: {...}}`
- Field is `ownerJid` (not `owner`): `"ownerJid": "18094973030@s.whatsapp.net"`
- Updated `InstanceInfoResponse` interface to match actual Evolution API response
- Fixed all 3 locations that extract phone numbers: sync endpoint, webhook, polling
- Polling now checks disconnected instances too (not just connected/qr)
- Automatically detects connected instances without phone numbers
- Auto-fetches phone numbers from Evolution API every 5 seconds
- Improved logging with "Auto-sync:" prefix for debugging
- No manual sync button click needed - everything is automatic

**Next Step**: Publish to production at whatsapp.cloude.es
