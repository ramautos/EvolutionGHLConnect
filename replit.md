# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It provides user authentication, role-based access control, automated WhatsApp instance management with a `locationId_number` naming convention for n8n routing, and real-time connection monitoring. The platform aims to streamline communication and CRM processes for businesses, offering significant market potential by bridging these two critical business tools. It also supports storing and managing OpenAI API keys per GoHighLevel location for transcription services.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 27, 2025)

### Billing Architecture Refactor - Subaccount-Level Billing ✅ BACKEND COMPLETE
**Major Change**: Billing model migrated from user-level to subaccount-level for granular control.

1. **New Billing Model**: Per-subaccount subscriptions instead of per-user
   - **Plan "none"**: Default (no instances allowed until plan selected)
   - **Plan "basic_1_instance"**: $8/month (1 WhatsApp instance included)
   - **Plan "pro_5_instances"**: $25/month (5 WhatsApp instances included)
   - **Extra Slots**: $5/month per additional instance beyond plan limits
   
2. **Database Schema Updates**:
   - `subscriptions` table: FK changed from `userId` to `subaccountId`
   - `invoices` table: FK changed from `userId` to `subaccountId`
   - New fields: `includedInstances`, `extraSlots`, `basePrice`, `extraPrice`
   - Automatic subscription creation: Empty subscription (plan="none") created with each subaccount

3. **API Endpoints (Backend Complete)**:
   - `GET /api/subaccounts/:subaccountId/subscription` - Get subaccount's plan
   - `PATCH /api/subaccounts/:subaccountId/subscription` - Change plan (creates invoice)
   - `GET /api/subaccounts/:subaccountId/invoices` - Get subaccount's invoices
   - `POST /api/instances` - Enhanced with plan verification and quota enforcement

4. **Business Logic**:
   - **Unlimited subaccounts**: Users can create unlimited subaccounts (no restrictions)
   - **Instance quotas**: WhatsApp instance creation gated by subaccount's plan
   - **Quota enforcement**: Cannot create instance if no plan or quota exceeded
   - **Smart error handling**: API returns `needsPlan` or `needsUpgrade` flags for frontend

5. **Frontend Integration (PENDING)**:
   - [ ] SubaccountDetails: Move OpenAI config to Dialog, add plan section
   - [ ] Create PlanSelector component for elegant plan selection
   - [ ] Update Billing/Invoices pages to use new subaccount-scoped API

### Previous UI/UX Improvements
1. **Dashboard Header**: DropdownMenu with "Mi Cuenta" showing user details and navigation
2. **OpenAI Configuration**: Stored at subaccount level for independent AI config per location
3. **Admin Panel**: Tabs interface with Users, Subcuentas, and Instancias overview
4. **Profile Page**: Simplified to personal info and password change only

## System Architecture

### Frontend
- **Framework**: React 19 (TypeScript, Vite)
- **UI/UX**: Radix UI primitives, shadcn/ui ("New York" style) with Material Design influences.
- **Styling**: Tailwind CSS with HSL-based theming, light/dark mode, and an elevation system.
- **State Management**: React Query v5, UserContext for authentication, `useState` for local UI state.
- **Routing**: Wouter for navigation, including protected routes.
- **Real-time**: Socket.io client for live WhatsApp status updates.

### Backend
- **Runtime**: Node.js with Express.js.
- **Authentication**: Passport.js with Local (bcrypt) and Google OAuth 2.0.
- **Session Management**: PostgreSQL session store (connect-pg-simple) using HttpOnly cookies.
- **Authorization**: Role-based middleware (`isAuthenticated`, `isAdmin`).
- **API Design**: RESTful API for authentication, user management, subaccount operations, WhatsApp instance lifecycle, and GoHighLevel integration.

### Database Architecture
-   **Replit PostgreSQL (Neon)**: Stores application data including `users`, `subaccounts`, `whatsappInstances`, and `sessions`. `subaccounts` also store `openaiApiKey`.
-   **External GHL PostgreSQL**: Dedicated to storing GoHighLevel OAuth tokens (`ghl_clientes`).

### Authentication Flow
Supports email/password and Google OAuth, establishing a Passport session, redirecting to the dashboard, and utilizing `UserContext` for client-side authentication. Protected routes enforce authentication. Mandatory phone number registration on first login.

### Subaccount Management Flow (GoHighLevel OAuth)
Users add subaccounts via a full-page redirect to GoHighLevel OAuth. An n8n webhook intermediates the token exchange, storing them in the External GHL DB, and redirecting back to the application to create a subaccount record.

### WhatsApp Instance Management
Allows creation and management of multiple WhatsApp instances per subaccount, integrating with the Evolution API for instance creation, QR code generation, and status management. Real-time status updates are pushed via Socket.io. Instances are named using the pattern `{locationId}_{number}`. The system also tracks instance disconnections and provides bidirectional synchronization between the WhatsApp application, Evolution API, and the web application, including automatic phone number extraction and orphaned instance detection/deletion.

### Design System
Consistent design system with CSS utilities for elevation, HSL color variables, 4px base unit spacing, responsive layouts, and customized shadcn/ui components.

## External Dependencies

### Third-Party APIs
-   **Evolution API**: For WhatsApp Business API integration.
-   **GoHighLevel**: CRM platform OAuth 2.0 for integration.
-   **OpenAI**: For AI services (e.g., transcription), API keys stored per subaccount.

### Database Services
-   **Neon PostgreSQL**: Primary database for application data.
-   **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens.

### UI Libraries
-   Radix UI, shadcn/ui, React Hook Form, Zod, QRCode.react, canvas-confetti, react-phone-input-2.

### Build Tools
-   Vite, TypeScript, Tailwind CSS, PostCSS, esbuild.