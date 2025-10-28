# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It streamlines communication and CRM processes by offering user authentication, role-based access control, automated WhatsApp instance management, and real-time connection monitoring. The platform supports storing and managing OpenAI API keys per GoHighLevel location for transcription services. It includes a hierarchical company management system with Stripe integration for billing, a free trial period, and automatic plan assignment based on WhatsApp instance usage.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
-   **Framework**: React 19 (TypeScript, Vite)
-   **UI/UX**: Radix UI primitives, shadcn/ui ("New York" style) with Material Design influences.
-   **Styling**: Tailwind CSS with HSL-based theming, light/dark mode, and an elevation system.
-   **State Management**: React Query v5, UserContext for authentication, `useState`.
-   **Routing**: Wouter for navigation, including protected routes.
-   **Real-time**: Socket.io client for live WhatsApp status updates.

### Backend
-   **Runtime**: Node.js with Express.js.
-   **Authentication**: Passport.js with Local (bcrypt) and Google OAuth 2.0; HttpOnly cookies for session management. Mandatory phone number registration on first login.
-   **Authorization**: Role-based middleware (`isAuthenticated`, `isAdmin`).
-   **API Design**: RESTful API for authentication, user management, subaccount operations, WhatsApp instance lifecycle, GoHighLevel integration, and admin functionalities.
-   **Subaccount Management**: Integrates with GoHighLevel OAuth for subaccount creation. An n8n webhook intermediates token exchange and stores them in a dedicated GHL DB.
-   **WhatsApp Instance Management**: Uses Evolution API for instance creation, QR code generation, and status management. Instances are named `{locationId}_{number}`. Real-time status updates via Socket.io. Includes bidirectional synchronization and detection/deletion of orphaned instances.
-   **Billing and Subscription**: 15-day free trial, automatic plan assignment (Starter, Basic, Pro) based on instance count. Subaccount-level billing with admin controls (`billingEnabled`, `manuallyActivated`).
-   **CRM Settings & Webhook**: Per-subaccount CRM configuration including `calendarId` and OpenAI API Key. Global webhook configuration (admin-controlled) for forwarding messages from Evolution API with `locationId` for n8n routing.
-   **Admin Control System**: Admin panel with hierarchical company management, user and subaccount oversight, manual billing and activation controls, and global webhook configuration.

### Database Architecture
-   **Replit PostgreSQL (Neon)**: Primary application data storage (`companies`, `subaccounts`, `whatsappInstances`, `subscriptions`, `sessions`). The `subaccounts` table unifies CRM locations and authenticated users, containing authentication fields (`email`, `passwordHash`, `googleId`, `role`, `lastLoginAt`), CRM data (`locationId`, `ghlCompanyId`), and settings (`openaiApiKey`, `calendarId`).
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens (`ghl_clientes`).

## External Dependencies

### Third-Party APIs
-   **Evolution API**: WhatsApp Business API integration.
-   **GoHighLevel**: CRM platform OAuth 2.0.
-   **OpenAI**: AI services (e.g., transcription).
-   **Stripe**: Subscription management and billing.

### Database Services
-   **Neon PostgreSQL**: Primary database for application data.
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens.