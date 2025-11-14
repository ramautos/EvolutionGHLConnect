# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It streamlines communication and CRM by offering user authentication, role-based access, automated WhatsApp instance management, and real-time connection monitoring. The platform supports storing and managing OpenAI API keys per GoHighLevel location for transcription services. It includes a hierarchical company management system with Stripe integration for billing, a free trial, and automatic plan assignment based on WhatsApp instance usage, targeting significant market potential in business communication and CRM.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### November 14, 2025
- **Development Helper: Demo Data Seeder**: Added secure utility to create fake subaccounts for UI testing
  - New endpoint `/api/dev/seed-demo` creates demo subaccounts with WhatsApp instances
  - Creates 2 demo subaccounts: regular and "sold" subaccount
  - Generates 3 WhatsApp instances with different states (connected, disconnected, qr_generated)
  - Idempotent: automatically cleans existing demo data before creating new
  - Complete cleanup: deletes all related data (instances, triggers, subscriptions)
  - Security: Protected with `isAdmin` middleware - only admin/system_admin roles can access
  - Frontend buttons only visible to admins in development environment
  - Clean up with `/api/dev/clean-demo` endpoint removes all demo data and dependencies
  - Located in `server/dev/demoSeeder.ts` for reusability
  - Prevents accumulation of orphaned data in billing/subscription tables

### November 12, 2025
- **CRITICAL FIX: Server Crash Prevention**: Resolved infinite loop error that prevented all user logins
  - **Root Cause**: Auto-sync polling attempted to verify LOCAL_* WhatsApp instances that don't exist in Evolution API
  - **Solution**: Added filter in routes.ts (line 4046) to skip LOCAL_* instances in auto-sync polling loop
  - **Impact**: Server previously crashed with 404 errors from Evolution API, blocking all authentication
  - **Database Cleanup**: Deleted 1 orphaned LOCAL_* instance from whatsapp_instances table
  - **Verification**: E2E tests confirmed both normal and admin users can login successfully
  - **Architecture Note**: LOCAL_* instances are authentication markers only, never real WhatsApp connections

### November 10, 2025
- **Dashboard Onboarding Message**: Implemented comprehensive empty state guidance when no GoHighLevel subaccounts exist
  - Replaces confusing "No tienes subcuentas" with step-by-step installation guide
  - Three-step visual onboarding: Install app → Authorize access → Subaccounts appear
  - Dual CTAs: "Conectar con GoHighLevel" (OAuth flow) and "Ir al Marketplace de GHL" (direct marketplace link)
  - Highlights 7-day trial period to encourage adoption
  - Designed with clear hierarchy, numbered steps, and accessible language for non-technical users
  - Architect-approved implementation with proper data-testid attributes for testing
- **Architecture Confirmation**: Validated LOCAL_* subaccount filtering system is working correctly
  - LOCAL_* subaccounts (authentication only) correctly hidden from dashboard
  - Real GHL subaccounts (from webhook installation) correctly visible
  - Empty dashboard state indicates users haven't installed GHL app, not a system bug

### November 5, 2025
- **Unlimited Triggers System**: Migrated from single trigger per subaccount to unlimited triggers
  - New dedicated `triggers` table with FK cascade to subaccounts
  - Full CRUD infrastructure: storage methods (getTriggers, createTrigger, updateTrigger, deleteTrigger)
  - REST API endpoints: GET/POST /api/subaccounts/:id/triggers, PATCH/DELETE /api/subaccounts/:id/triggers/:id
  - Authorization: only subaccount owner or admin can manage triggers
  - Frontend: list view with Dialog for adding triggers, delete with confirmation
  - React Query integration with proper cache invalidation
  - Removed legacy `triggerName` and `triggerTag` columns from subaccounts table
  - Automatic data migration from old single trigger to new unlimited triggers system
- **Stripe Pricing Plans Update**: Updated billing system with correct pricing structure
  - Starter Plan: $8/mes, 1 WhatsApp instance (no additional instances allowed)
  - Profesional Plan: $15/mes, 3 WhatsApp instances (no additional instances allowed)
  - Business Plan: $25/mes, 5 WhatsApp instances + $5/mes per additional instance
  - Updated schema with `includedInstances`, `basePrice`, `extraPrice` fields
  - Stripe webhook properly updates subscription limits (`maxSubaccounts`, `includedInstances`)
  - BillingSuccess page updated to reflect 7-day trial period
- **Instance Limit Validation**: Implemented client-side validation for WhatsApp instance creation
  - Checks current instance count against plan limits before creation
  - Shows error toast and opens plan selection modal when limit reached (Starter/Profesional)
  - Prompts confirmation with additional cost for Business plan extra instances
  - Prevents unauthorized instance creation beyond plan limits
- **Subaccount Search Feature**: Added search functionality in Dashboard page
  - Real-time filtering by subaccount name, phone number, or Location ID
  - Clean UI with search icon and placeholder text
  - "No results" state with clear search button
  - Uses `useMemo` for optimized filtering performance

### November 2, 2025
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

### Performance Improvements
- **Database Optimization**: Added composite indexes to improve query performance
  - `subaccounts_access_token_idx` for OAuth token lookups
  - `subaccounts_is_sold_idx` for filtering sold subaccounts
  - `whatsapp_instances_subaccount_id_idx`, `whatsapp_instances_location_id_idx`, `whatsapp_instances_status_idx` for instance queries
  - `triggers_subaccount_id_idx` for trigger lookups
  - Reduced query times from 2-5 seconds to <1 second

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
-   **Replit PostgreSQL (Neon)**: Primary application data storage (`companies`, `subaccounts`, `triggers`, `whatsappInstances`, `subscriptions`, `sessions`, `system_config`). The `subaccounts` table unifies CRM locations and authenticated users. The `triggers` table stores unlimited trigger configurations per subaccount with cascade delete.
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens (`ghl_clientes`).
-   **Automatic Database Initialization**: Server automatically runs bootstrap on first startup to create default company, admin user, and system configuration using `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` environment variables.

### Deployment & Configuration
-   **Health Check**: Smart routing at `/` for quick health checks.
-   **Process Lifecycle Management**: Server runs indefinitely with safeguards for stability.
-   **Non-Blocking Startup**: Server starts immediately, bootstrap runs in background.
-   **Lazy Loading + Cache**: In-memory cache prevents repeated database queries for system configuration.
-   **Automatic Bootstrap Process**: On first startup, creates default company, admin user, and activates a 7-day trial.
-   **Webhook Integration with Subaccount Claim System**: Secure OAuth flow where subaccounts are "claimed" by the authenticated user after creation. This ensures one company per user, multiple subaccounts per company.

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