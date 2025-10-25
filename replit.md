# WhatsApp-GoHighLevel AI Integration Platform

## Overview

A multi-tenant SaaS platform that bridges WhatsApp Business with GoHighLevel CRM through intelligent automation. The application enables businesses to generate QR codes, manage multiple WhatsApp instances, and automatically sync connection data with their GoHighLevel accounts. Built with a modern React frontend and Express backend, the platform serves agencies managing multiple client locations through a streamlined three-step onboarding flow.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 19 with TypeScript and Vite as the build tool

**UI Component System**: Radix UI primitives with shadcn/ui component library following the "New York" style variant. Custom design system inspired by modern SaaS products (Linear, Vercel, Notion) with Material Design influences for dashboard components.

**Styling Approach**: Tailwind CSS with extensive CSS variable theming for light/dark mode support. Custom design tokens include elevation states (`--elevate-1`, `--elevate-2`), border variants for different contexts (cards, popovers, buttons), and a comprehensive color system with HSL-based colors for alpha channel support.

**Typography**: Inter for body text and UI elements, Space Grotesk for headings and accent typography (loaded via Google Fonts).

**State Management**: 
- React Query (TanStack Query) for server state with automatic caching and refetching disabled by default (staleTime: Infinity)
- React Context (`UserContext`) for global user authentication state
- Local component state with useState for UI interactions

**Routing**: Wouter for client-side routing with four main routes: Landing (`/`), Onboarding (`/onboarding`), Dashboard (`/dashboard`), and Locations Dashboard (`/locations`)

**Real-time Updates**: Socket.io client for WebSocket connections to receive live WhatsApp instance status updates

### Backend Architecture

**Runtime & Framework**: Node.js with Express.js server

**API Design**: RESTful API with 62+ endpoints organized by resource type:
- User management (`/api/users/*`)
- Subaccount operations (`/api/subaccounts/*`)
- WhatsApp instance lifecycle (`/api/instances/*`)

**Database Layer**: 
- **Dual Database Architecture**:
  - **Replit PostgreSQL** (via Neon): User accounts, WhatsApp instances (`DATABASE_URL`)
  - **External GHL PostgreSQL** (147.93.180.187:5432): OAuth tokens and company data (`GHL_DB_*` secrets)
- Drizzle ORM for type-safe database queries and migrations
- **Replit DB Tables**: `users`, `subaccounts`, `whatsappInstances`
- **External GHL DB Tables**: `ghl_clientes` (OAuth tokens, refresh tokens, expiry timestamps)

**Schema Design**:
```
# Replit Database
users (id, email, name, createdAt)
subaccounts (id, userId, ghlId, name, selected, createdAt)
whatsappInstances (id, userId [NOT NULL], subaccountId, locationId, instanceName, evolutionInstanceName, phoneNumber, status, qrCode, webhookUrl, createdAt, connectedAt)

# External GHL Database  
ghl_clientes (id, locationid, companyid, accesstoken, refreshtoken, expiresat, installedat)
```

**Critical Bug Fixes** (October 2025):
- Fixed instance persistence: `whatsappInstances.userId` is now NOT NULL and required for all instances
- Fixed instance retrieval: `getAllUserInstances()` now properly filters by userId instead of subaccount
- Fixed React Query cache: All mutations now use `['/api/instances/user', userId]` key for proper invalidation
- Fixed instance creation: Both onboarding and dashboard flows now require userId, preventing orphaned records
- Result: Instances created through UI now immediately appear in dashboard and update correctly after mutations

**Real-time Communication**: Socket.io server for bidirectional event streaming, enabling instant QR code updates and connection status changes

**Build Process**: 
- Frontend: Vite bundler producing static assets
- Backend: esbuild bundling server code to ESM format for production
- Separate development and production modes with different serving strategies

### Data Flow Patterns

**Onboarding Flow**:
1. User creates account or uses existing demo account
2. **Clicks "Install GoHighLevel App"** → Redirected to GHL OAuth consent screen
3. **OAuth Callback** → Receives authorization code → Exchanges for access/refresh tokens → Stores in external GHL database
4. User redirected to dashboard showing all GHL locations
5. **Per-Location Setup**: User clicks "Activate WhatsApp" on any location → Creates instance with `location_id` as identifier
6. Generates WhatsApp QR code → User scans → Evolution API detects phone number
7. Webhook fires with `location_id` embedded in instance name → Updates instance status to "connected"

**Locations Dashboard Flow** (Primary User Interface):
1. Master user accesses `/locations` page
2. System retrieves `companyId` from localStorage (set during OAuth callback)
3. Dashboard fetches all subcuentas via `/api/ghl/locations/:companyId` (from external PostgreSQL)
4. Each subcuenta card displays:
   - Name, city, state, contact info
   - WhatsApp connection status (connected ✅ / pending ⏳ / not connected ❌)
   - Phone number if connected
   - "Conectar WhatsApp" or "Ver QR" button
5. User clicks button → Creates WhatsApp instance with `wa-${locationId}` as Evolution API identifier
6. QR Modal opens → User scans with WhatsApp → Socket.io broadcasts connection event
7. Dashboard updates in real-time showing phone number and "Conectado" badge
8. n8n backend can route messages by matching `locationId` from Evolution API instance name

**Instance Management**:
- Create instance → Evolution API generates QR → Socket emits QR to frontend
- User scans QR → Evolution API detects connection → Updates instance status
- Frontend polls or receives Socket events for status changes
- Disconnect/Delete operations update database and trigger Evolution API cleanup

**Query Strategy**: React Query with path-based keys (e.g., `["/api/instances/user", userId]`) and manual invalidation after mutations. All create/update/delete operations invalidate the user instances cache to ensure immediate UI updates.

### Authentication & Authorization

**Current Implementation**: Demo mode with localStorage-based user identification. System creates or retrieves demo user (`demo@whatsappai.com`) on first visit.

**GoHighLevel OAuth Integration**: Fully implemented OAuth 2.0 flow with external PostgreSQL database for token persistence. Users authenticate via GoHighLevel OAuth consent screen, tokens are stored server-side only (never exposed to client), automatic refresh before expiry ensures uninterrupted access.

**Future Enhancement Roadmap**: JWT-based authentication for platform users, role-based access control (Super Admin, Agency, User, Reseller), impersonation capabilities for agency management.

### Design System Decisions

**Component Elevation**: Three-tier elevation system using CSS utility classes (`hover-elevate`, `active-elevate-2`) that apply semi-transparent black overlays for depth perception.

**Border Strategy**: Context-aware borders using CSS variables (`--card-border`, `--popover-border`, `--button-outline`) allowing consistent styling across light/dark themes.

**Spacing Scale**: Tailwind default scale (4px base unit) with emphasis on 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm.

**Layout Containers**: 
- Landing sections: `max-w-7xl` with responsive padding
- Dashboard: `max-w-screen-2xl` for wide layouts
- Content areas: `max-w-4xl` for readability
- Cards: `p-6` standard internal padding

**Responsive Grid Patterns**:
- Features/Stats: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Instances: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- Onboarding: Single column `max-w-2xl` centered

## External Dependencies

### Third-Party APIs

**Evolution API**: WhatsApp Business API provider for QR code generation, instance management, and message handling. Configured via `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` environment variables. Core operations include:
- Create instance
- Generate QR code
- Fetch instance state
- Logout/disconnect instance

**GoHighLevel**: **Fully Integrated** CRM platform with OAuth 2.0 authentication flow. Key capabilities:
- OAuth 2.0 authorization code flow with PKCE
- Automatic token refresh (30-day expiry cycle)
- Fetch all locations/subaccounts per company
- Location-based instance management (one WhatsApp instance per GHL location)
- Configured via `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET` (OAuth credentials)
- External database connection for token persistence: `GHL_DB_HOST`, `GHL_DB_NAME`, `GHL_DB_USER`, `GHL_DB_PASSWORD`, `GHL_DB_PORT`
- **Security**: Access tokens NEVER exposed to frontend, all OAuth operations server-side only

### Database Services

**Neon PostgreSQL**: Serverless PostgreSQL database with WebSocket support (configured with `ws` package for Drizzle compatibility). Connection string in `DATABASE_URL` environment variable.

**Migration Strategy**: Drizzle Kit with migrations output to `/migrations` directory, schema defined in `shared/schema.ts`.

### UI & Component Libraries

**Core UI**: 
- Radix UI primitives (20+ components: Dialog, Dropdown, Tooltip, etc.)
- shadcn/ui configuration for consistent styling
- QRCode.react for QR code SVG rendering

**Form Handling**: React Hook Form with Zod resolvers for validation

**Notifications**: React Hot Toast for user feedback

**Date Utilities**: date-fns for timestamp formatting

### Build & Development Tools

**Vite Plugins**:
- `@vitejs/plugin-react` for Fast Refresh
- `@replit/vite-plugin-runtime-error-modal` for dev error handling
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` (Replit-specific, dev only)

**TypeScript**: Strict mode enabled with ESNext module resolution and bundler mode for import extensions

**Tailwind**: PostCSS with autoprefixer for vendor prefixing

### Socket Communication

**Socket.io**: Both client and server implementations for real-time features. Room-based subscriptions (`instance-${instanceId}`) for targeted event delivery.

### Environment Configuration

**Required Variables**:
- `DATABASE_URL`: Neon PostgreSQL connection string (Replit user data)
- `EVOLUTION_API_URL`: Evolution API base URL
- `EVOLUTION_API_KEY`: Evolution API authentication key
- `GHL_CLIENT_ID`: GoHighLevel OAuth client ID
- `GHL_CLIENT_SECRET`: GoHighLevel OAuth client secret
- `GHL_DB_HOST`: External PostgreSQL host for GHL tokens (147.93.180.187)
- `GHL_DB_PORT`: External PostgreSQL port (5432)
- `GHL_DB_NAME`: External database name
- `GHL_DB_USER`: External database username
- `GHL_DB_PASSWORD`: External database password
- `NODE_ENV`: Development/production mode switch

**Optional/Future**:
- Webhook configuration URLs
- JWT secrets for platform authentication
- `SESSION_SECRET`: Express session encryption key

## Production Deployment

### Status: ✅ DEPLOYED IN PRODUCTION

**Production URL:** `https://whatsapp.cloude.es`
**OAuth Callback URL:** `https://whatsapp.cloude.es/api/auth/oauth/callback`

**GoHighLevel App Credentials:**
- Client ID: `68a94abebdd32d0a7010600e-mgpykfcm`
- Client Secret: `5ea04303-187e-4dea-a390-6ed7ce165993`

The application is fully deployed and operational:

**Completed Features**:
- ✅ Full user authentication flow (demo mode)
- ✅ **GoHighLevel OAuth 2.0 integration** with real API connection
- ✅ **Dual database architecture** (Replit DB + External GHL DB)
- ✅ **Location-based WhatsApp instance management** (one instance per GHL location)
- ✅ Complete onboarding wizard with OAuth flow
- ✅ **Dashboard showing all GHL locations** with per-location QR generation
- ✅ Real-time QR code generation and status updates via WebSocket
- ✅ Evolution API integration with `location_id` as instance identifier
- ✅ Webhook system for connection events (includes `location_id` in instance name)
- ✅ **Automatic token refresh** for GHL OAuth tokens
- ✅ PostgreSQL persistence with proper foreign key relationships
- ✅ React Query cache management with proper invalidation
- ✅ Responsive design with light/dark mode support
- ✅ **Server-side only OAuth token handling** (security best practice)

**Deployment Configuration**:
1. ✅ **Domain:** `whatsapp.cloude.es` configured via Cloudflare DNS
2. ✅ **OAuth Endpoint:** `/api/auth/oauth/callback` (renamed from `/api/auth/ghl/callback` to avoid GoHighLevel URL restrictions)
3. ✅ **All secrets configured** in Replit deployment (DATABASE_URL, GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_DB_*, EVOLUTION_API_*)
4. ✅ **Autoscale deployment** with single port configuration (5000 → 80)
5. ✅ **NODE_ENV=production** set for deployment environment
6. ✅ **External PostgreSQL connection** verified for GHL token storage
7. ✅ **Build process** optimized (Vite + esbuild)

**Current Architecture**:
- Demo user mode for platform login (`demo@whatsappai.com`)
- **Production GoHighLevel OAuth** with real credentials and external token storage
- Instance names: `wa-${locationId}` for Evolution API tracking
- Location-based setup: Each GHL location can have ONE WhatsApp instance
- WebSocket for real-time updates, fallback polling every 5 seconds

**System Behavior Without Evolution API Credentials**:
- Landing page and navigation work normally
- Onboarding flow completes but QR generation shows error toast
- Dashboard displays instances but QR generation fails gracefully
- No crashes or data corruption - system handles missing credentials properly
- Clear error messages guide users to configure credentials