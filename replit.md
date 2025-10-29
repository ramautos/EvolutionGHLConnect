# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It aims to streamline communication and CRM processes by offering user authentication, role-based access control, automated WhatsApp instance management, and real-time connection monitoring. The platform supports storing and managing OpenAI API keys per GoHighLevel location for transcription services. It includes a hierarchical company management system with Stripe integration for billing, a free trial period, and automatic plan assignment based on WhatsApp instance usage, targeting significant market potential in business communication and CRM.

## User Preferences
Preferred communication style: Simple, everyday language.

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
-   **Billing and Subscription**: 15-day free trial, automatic plan assignment (Starter, Basic, Pro) based on instance count, with subaccount-level billing and admin controls.
-   **CRM Settings & Webhook**: Per-subaccount CRM configuration including `calendarId` and OpenAI API Key. Global webhook configuration for forwarding messages from Evolution API.
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

**Automatic Bootstrap Process**:
- On first server startup, the system automatically:
  1. Creates default company
  2. Creates admin user with provided credentials
  3. Activates 15-day trial subscription
  4. Marks database as initialized
- Subsequent deployments do not require admin credentials
- Server fails fast if bootstrap fails to ensure database integrity

### Webhook Integration
The n8n webhook at `/api/webhooks/register-subaccount` automatically creates:
- Company (if new `companyid`)
- Subaccount with user credentials
- WhatsApp instance with naming pattern `{locationId}_{sequential_number}`
- 15-day trial subscription

## External Dependencies

### Third-Party APIs
-   **Evolution API**: WhatsApp Business API integration.
-   **GoHighLevel**: CRM platform OAuth 2.0.
-   **OpenAI**: AI services.
-   **Stripe**: Subscription management and billing.

### Database Services
-   **Neon PostgreSQL**: Primary database.
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens.