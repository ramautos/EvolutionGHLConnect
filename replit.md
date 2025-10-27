# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It provides user authentication, role-based access control, automated WhatsApp instance management with a `locationId_number` naming convention for n8n routing, and real-time connection monitoring. The platform aims to streamline communication and CRM processes for businesses, offering significant market potential by bridging these two critical business tools. It also supports storing and managing OpenAI API keys per GoHighLevel location for transcription services.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 27, 2025)

### Admin Control System ✅ COMPLETE
**New Feature**: Admin role with manual control over subaccount billing and activation.

1. **Admin-Only Access**:
   - Admins automatically redirected to `/admin` panel when accessing dashboard
   - Admins cannot create subaccounts (restricted to admin panel only)
   - Admin panel includes tabs: Users, Subcuentas, Instancias, Webhook

2. **Manual Billing & Activation Controls**:
   - Added `billingEnabled` field to `subaccounts` - controls if billing applies to subaccount
   - Added `manuallyActivated` field to `subaccounts` - controls if subaccount is active
   - Both default to `true` for backwards compatibility
   - Admin can toggle both flags via switches in Subcuentas tab

3. **Instance Creation Validation**:
   - VALIDATION 1: `manuallyActivated` must be true (always checked)
   - VALIDATION 2: `billingEnabled` must be true (only checked after trial period)
   - Users receive clear error messages when validation fails

4. **API Endpoints**:
   - `PATCH /api/admin/subaccounts/:id/billing` - Toggle billing enabled/disabled (admin only)
   - `PATCH /api/admin/subaccounts/:id/activation` - Toggle manual activation (admin only)

5. **UX Changes**:
   - Dashboard redirects admins to `/admin` via useEffect (prevents render loop)
   - Admin panel shows billing/activation switches with status labels
   - Queries disabled for admins on dashboard (performance optimization)

### CRM Settings & Webhook Configuration ✅ COMPLETE
**New Feature**: Per-subaccount CRM configuration and admin-controlled webhook forwarding.

1. **CRM Settings per Subaccount**:
   - Added `calendarId` field to `subaccounts` table for GoHighLevel calendar integration
   - Users configure Calendar ID and OpenAI API Key via "Ajustes del CRM" dialog in SubaccountDetails
   - Dialog shows Location ID (read-only), Calendar ID (editable), and OpenAI Key (editable)
   - Replaced standalone OpenAI card with unified CRM Settings interface

2. **Admin Webhook Configuration**:
   - New `webhookConfig` table stores global webhook URL and activation state
   - Admin Panel includes "Webhook" tab for complete webhook management
   - Admin can configure webhook URL and toggle activation (users cannot see this)
   - Messages forwarded to configured URL with locationId, message, from, instanceName, timestamp

3. **API Endpoints**:
   - `PATCH /api/subaccounts/:locationId/crm-settings` - Update Calendar ID and OpenAI Key (authenticated)
   - `GET /api/admin/webhook-config` - Get webhook configuration (admin only)
   - `PATCH /api/admin/webhook-config` - Update webhook URL and activation (admin only)
   - `POST /api/webhook/message` - Receive messages and forward to configured webhook (public)

4. **Business Logic**:
   - Webhook forwarding only active when admin enables it
   - Each subaccount has independent CRM configuration (Calendar ID + OpenAI Key)
   - Messages include locationId for proper n8n routing
   - Automatic webhook creation on first admin access

### FREE TRIAL & Automatic Billing System ✅ COMPLETE
**Major Features**: 15-day free trial + automatic plan assignment + subaccount-level billing.

1. **FREE TRIAL Period**:
   - **15-day trial**: Every new subaccount automatically gets a 15-day free trial
   - **Unlimited instances during trial**: Create unlimited WhatsApp instances without billing
   - **Automatic activation**: Trial starts immediately upon subaccount creation
   - **Auto-expiration**: When trial expires, automatic billing kicks in
   - **Legacy protection**: Automatic backfill for existing subscriptions without trial data

2. **Automatic Billing (Post-Trial)** - Updated Pricing Model:
   - **1 instance**: Auto-assign "starter" plan ($10/month)
   - **2-3 instances**: Auto-upgrade to "basic" plan ($19/month)
   - **4-5 instances**: Auto-upgrade to "pro" plan ($29/month)
   - **6+ instances**: Add extra slots ($5 each) on top of Pro plan
   - **Smart detection**: System calculates needed plan based on instance count
   
3. **Database Schema**:
   - `subscriptions.trialEndsAt`: Timestamp when trial expires (15 days from creation)
   - `subscriptions.inTrial`: Boolean flag for active trial status
   - Automatic backfill: Legacy subscriptions (inTrial=true, trialEndsAt=null) auto-disabled on first access
   - Auto-update: When trial expires, `inTrial` automatically set to `false`

4. **Business Logic Flow**:
   - New subaccount → subscription created with trialEndsAt = now + 15 days
   - During trial → unlimited instance creation, no billing logic
   - Trial expires → `inTrial` set to false, billing logic activates
   - Instance creation post-trial → automatic plan assignment + invoice generation
   - **Unlimited subaccounts**: Users can create unlimited subaccounts (no restrictions)

5. **API Endpoints**:
   - `GET /api/subaccounts/:subaccountId/subscription` - Get plan + trial status
   - `PATCH /api/subaccounts/:subaccountId/subscription` - Change plan (creates invoice)
   - `GET /api/subaccounts/:subaccountId/invoices` - Get invoices
   - `POST /api/instances` - Creates instance with trial check + automatic billing

6. **Frontend Integration** ✅ COMPLETE:
   - ✅ Trial Banner with 3-state countdown (active >3 days, warning last 3 days, expired ≤0)
   - ✅ Planes y Facturación section with current plan status and plan selector cards
   - ✅ Additional Accounts Calculator (conditional for Pro plan with >5 instances)
   - ✅ Instance creation validation blocks when trial expires or billing disabled
   - [ ] Update Billing/Invoices pages to use new subaccount-scoped API

### UI/UX Improvements ✅ COMPLETE
1. **Dashboard Header**: DropdownMenu with "Mi Cuenta" showing user details and navigation
2. **CRM Settings Dialog**: Unified interface for Calendar ID and OpenAI API Key configuration
3. **Admin Panel**: Tabs interface with Users, Subcuentas, Instancias, and Webhook configuration
4. **Profile Page**: Simplified to personal info and password change only
5. **Trial Banner** (SubaccountDetails): 
   - 3-state visual countdown with gradient backgrounds
   - Active state (>3 days): Blue/purple gradient with unlimited instances message
   - Warning state (last 3 days): Yellow/orange/red gradient with animated pulse
   - Expired state (≤0 days): Gray/red gradient with activation CTA
6. **Planes y Facturación Section** (SubaccountDetails):
   - Left column: Current plan status card with metrics (instances used, price, extras)
   - Right column: 3 interactive plan cards (Starter $10, Básico $19, Pro $29)
   - Visual hierarchy with badges, borders, and recommended labels
   - Progress bar showing instance usage vs plan limits
7. **Additional Accounts Calculator** (SubaccountDetails):
   - Conditional display for Pro plan users with >5 instances
   - Real-time cost simulator with input field
   - Breakdown showing base plan + additional slots = total monthly cost

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