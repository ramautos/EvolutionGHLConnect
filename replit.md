# WhatsApp-GoHighLevel AI Integration Platform

## Overview
Production-ready multi-tenant SaaS platform connecting WhatsApp Business with GoHighLevel CRM. Features complete user authentication (email/password + Google OAuth), role-based access control, automated WhatsApp instance management, and real-time connection monitoring. Deployed at `https://whatsapp.cloude.es`.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture (Updated October 26, 2025)

### Frontend
- **Framework**: React 19 (TypeScript, Vite)
- **UI/UX**: Radix UI primitives, shadcn/ui ("New York" style), Material Design influences
- **Styling**: Tailwind CSS with HSL-based theming, light/dark mode, elevation system
- **Typography**: Inter (body/UI), Space Grotesk (headings/accent)
- **State Management**: 
  - React Query v5 for server state (`staleTime: Infinity`)
  - UserContext for authentication state
  - `useState` for local UI state
- **Routing**: Wouter
  - `/` - Landing page
  - `/login` - Login form (email/password + Google OAuth)
  - `/register` - Registration form
  - `/dashboard` - Main dashboard (protected route)
  - `/auth/success` - OAuth callback handler with confetti
  - `/locations` - Legacy locations view
- **Real-time**: Socket.io client for live WhatsApp status
- **Protection**: ProtectedRoute component wraps authenticated pages

### Backend
- **Runtime**: Node.js with Express.js
- **Authentication**: Passport.js with dual strategies:
  - **Local Strategy**: bcrypt password hashing
  - **Google OAuth 2.0**: Automatic account creation
- **Session Management**: 
  - PostgreSQL session store (connect-pg-simple)
  - HttpOnly cookies, 1 week TTL
  - Required: `SESSION_SECRET` environment variable
- **Authorization**: Role-based middleware
  - `isAuthenticated`: Protects all user routes
  - `isAdmin`: Restricts admin-only endpoints
- **API Design**: 70+ RESTful endpoints
  - Auth routes: register, login, logout, Google OAuth
  - User routes: profile management (protected)
  - Subaccount routes: CRUD operations (protected)
  - WhatsApp Instance routes: lifecycle management (protected)
  - Admin routes: user/subaccount oversight (admin-only)
  - GHL integration: location fetching, token management

### Database Architecture
**Dual Database System**:

1. **Replit PostgreSQL** (Neon - `DATABASE_URL`):
   - `users`: Authentication, profiles, roles
     - id (serial primary key)
     - email (unique, required)
     - name (required)
     - passwordHash (nullable - for OAuth users)
     - googleId (nullable - for OAuth users)
     - role (enum: "user" | "admin")
     - isActive (boolean)
     - lastLogin (timestamp)
     - createdAt, updatedAt (timestamps)
   
   - `subaccounts`: GoHighLevel locations
     - id (serial primary key)
     - userId (foreign key → users.id)
     - locationId (GHL location ID, required)
     - companyId (GHL company ID, required)
     - name (location name)
     - email, phone, city, state, country, address
     - website, timezone
     - createdAt, updatedAt (timestamps)
   
   - `whatsappInstances`: WhatsApp connections
     - id (serial primary key)
     - subaccountId (foreign key → subaccounts.id)
     - evolutionInstanceName (Evolution API instance name, e.g., "wa-locationId")
     - customName (user-defined display name, nullable)
     - phoneNumber (connected number, nullable)
     - status (enum: "created" | "qr_generated" | "connected" | "disconnected" | "error")
     - qrCode (Base64 QR code, nullable)
     - createdAt, updatedAt (timestamps)
   
   - `sessions`: Express session storage (auto-created by connect-pg-simple)

2. **External GHL PostgreSQL** (147.93.180.187:5432):
   - `ghl_clientes`: OAuth tokens (managed by n8n webhook)
     - company_id (GHL company ID)
     - access_token, refresh_token
     - expiry timestamps

**Data Flow**: Replit DB manages users/subaccounts/instances. GHL DB stores OAuth tokens for API calls.

### Authentication Flow

**Registration (Email/Password)**:
1. User submits registration form (`/register`)
2. Backend validates, hashes password with bcrypt
3. Creates user record with role="user", isActive=true
4. Auto-login via Passport session
5. Redirects to `/dashboard`

**Login (Email/Password)**:
1. User submits login form (`/login`)
2. Passport Local Strategy verifies credentials
3. Updates lastLogin timestamp
4. Creates session, sets cookie
5. Redirects to `/dashboard`

**Google OAuth**:
1. User clicks "Continue with Google"
2. Redirects to `/api/auth/google` (Passport initiates OAuth)
3. User authorizes in Google
4. Callback to `/api/auth/google/callback`
5. Passport Google Strategy:
   - Finds user by googleId OR email
   - Creates new user if not exists
   - Sets role="user", isActive=true
6. Redirects to `/dashboard`

**Session Validation**:
- Every protected route checks `req.isAuthenticated()`
- Unauthenticated requests → 401 error or redirect to `/login`
- Frontend `UserContext` queries `/api/auth/me` on mount
- Failed validation → shows login page

### Subaccount Management Flow (GHL OAuth)

**Adding a Subaccount** (Updated October 27, 2025):
1. User clicks "Add Subaccount" in Dashboard
2. `AddSubaccountModal` opens
3. User clicks "Connect with GoHighLevel"
4. **Full page redirects** to GHL OAuth (NOT popup - changed from popup to full redirect for Replit compatibility):
   ```
   https://marketplace.gohighlevel.com/oauth/chooselocation
   ?response_type=code
   &redirect_uri=https://ray.cloude.es/webhook/registrocuenta
   &client_id={GHL_CLIENT_ID}
   &scope=locations.readonly contacts.readonly
   ```
5. User authorizes in GoHighLevel
6. GHL redirects to n8n webhook (`https://ray.cloude.es/webhook/registrocuenta`)
7. n8n webhook:
   - Exchanges authorization code for tokens
   - Stores tokens in External GHL DB (`ghl_clientes`)
   - Extracts company_id and location_id
   - Redirects to app: `https://whatsapp.cloude.es/auth/success?company_id=XXX&location_id=YYY`
8. `AuthSuccess` page:
   - Calls `/api/subaccounts/from-ghl` with user_id, company_id, location_id
   - Backend fetches location details from GHL API
   - Creates subaccount record in Replit DB
   - Fires confetti celebration
   - Redirects to `/dashboard`
9. Dashboard loads with new subaccount visible

**Why n8n Intermediary?**
GoHighLevel blocks redirect URIs containing "ghl", "highlevel", or "gohighlevel" in domain or path. Using n8n webhook as intermediary bypasses this restriction while maintaining security (tokens never exposed to client).

**Why Full Redirect instead of Popup?**
Popups have communication issues in Replit's iframe environment due to cross-origin restrictions. Full page redirect is more reliable and works consistently across all environments.

### WhatsApp Instance Management

**Creating an Instance**:
1. User navigates to subaccount details
2. Clicks "Connect WhatsApp"
3. Backend creates instance record:
   - evolutionInstanceName = `wa-{locationId}`
   - status = "created"
   - Calls Evolution API to create instance
4. Frontend displays QR modal
5. User scans QR with WhatsApp mobile
6. Evolution API sends webhook → status = "connected", phoneNumber populated
7. Socket.io broadcasts update to frontend

**Multiple Instances per Subaccount**:
- Each subaccount can have unlimited WhatsApp instances
- Use `customName` field for user-friendly labels
- phoneNumber is readonly (set by Evolution API)

### Real-time Features
- **Socket.io**: Bidirectional event streaming
- **Room-based subscriptions**: Clients subscribe to `instance-{instanceId}`
- **Events**: QR code updates, connection status changes
- **Broadcast**: Backend emits to specific rooms when Evolution webhook fires

### Design System
- **Elevation**: CSS utilities (`hover-elevate`, `active-elevate-2`)
- **Colors**: HSL variables for light/dark mode consistency
- **Spacing**: Tailwind 4px base unit
- **Layout**: Responsive containers (max-w-7xl, max-w-screen-2xl, max-w-4xl)
- **Components**: shadcn/ui primitives, customized for brand

## External Dependencies

### Third-Party APIs
- **Evolution API**: WhatsApp Business API (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`)
- **GoHighLevel**: CRM platform OAuth 2.0 (`GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`)

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL for Replit (`DATABASE_URL`)
- **External GHL PostgreSQL**: OAuth token storage (`GHL_DB_*`)

### UI Libraries
- Radix UI, shadcn/ui, React Hook Form, Zod, QRCode.react, canvas-confetti

### Build Tools
- Vite, TypeScript (strict mode), Tailwind, PostCSS, esbuild

### Environment Variables (Required)
- `DATABASE_URL` - Replit PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (REQUIRED for production)
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
- `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`
- `GHL_DB_HOST`, `GHL_DB_PORT`, `GHL_DB_NAME`, `GHL_DB_USER`, `GHL_DB_PASSWORD`
- `NODE_ENV` (development | production)
- Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for Google OAuth)

## Production Deployment

### Status: ✅ DEPLOYED
- **Production URL**: `https://whatsapp.cloude.es`
- **n8n Webhook**: `https://ray.cloude.es/webhook/registrocuenta`
- **GHL OAuth Redirect**: `https://ray.cloude.es/webhook/registrocuenta`

### Security Measures
- ✅ All API routes protected with authentication middleware
- ✅ Admin routes require role="admin"
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ SESSION_SECRET required (fails fast if missing)
- ✅ HttpOnly cookies prevent XSS
- ✅ Secure cookies in production (HTTPS)
- ✅ No privilege escalation vectors (removed POST /api/users)
- ✅ OAuth tokens stored server-side only
- ✅ CSRF protection via session middleware

## Key Files (October 26, 2025)

### Authentication System
- `server/auth.ts` - Passport strategies, session config, middleware
- `client/src/contexts/UserContext.tsx` - Authentication state management
- `client/src/pages/Login.tsx` - Login form (email/password + Google)
- `client/src/pages/Register.tsx` - Registration form
- `client/src/components/ProtectedRoute.tsx` - Route protection HOC

### Database & Storage
- `shared/schema.ts` - Drizzle ORM models (users, subaccounts, whatsappInstances)
- `server/storage.ts` - Data access layer with auth methods
- `server/ghl-storage.ts` - External GHL database operations
- `server/ghl-api.ts` - GoHighLevel API client with token refresh

### Main Application
- `client/src/pages/Dashboard.tsx` - Main user dashboard (subaccount grid)
- `client/src/components/AddSubaccountModal.tsx` - GHL OAuth flow modal
- `client/src/pages/AuthSuccess.tsx` - OAuth callback handler with confetti
- `server/routes.ts` - All API endpoints (70+)
- `server/index.ts` - Express server with session middleware

### Legacy (To be refactored)
- `client/src/pages/LocationsDashboard.tsx` - Old location view
- `client/src/pages/DashboardGHL.tsx` - Old dashboard

## Recent Changes (October 26, 2025)

1. **Complete Authentication System**:
   - Passport.js with Local + Google OAuth strategies
   - PostgreSQL session store with sameSite: "lax" for production
   - Protected routes with middleware
   - Login/Register pages with validation
   - UserContext for global auth state with robust 401 handling

2. **New Database Schema**:
   - Redesigned users table with auth fields
   - subaccounts table with GHL location mapping
   - whatsappInstances with customName support
   - Foreign key relationships enforced

3. **Subaccount Management**:
   - Modal-based GHL OAuth flow
   - Popup window for authorization
   - Automatic subaccount creation from GHL data
   - Confetti celebration on success
   - localStorage-based success detection

4. **Admin Panel** (October 26, 2025):
   - Complete admin dashboard at `/admin`
   - View all WhatsApp instances with user/subaccount details
   - Management actions: View details, Delete instances
   - Protected route requiring role="admin"
   - SPA navigation with wouter (no hard redirects)

5. **Security Hardening**:
   - Removed privilege escalation vector
   - Mandatory SESSION_SECRET
   - All routes authenticated
   - Admin-only endpoints
   - Bcrypt password hashing
   - Secure cookies in production (HTTPS)

6. **Production Fixes** (October 26, 2025):
   - Fixed DOM nesting error in AdminPanel (Badge in <div> not <p>)
   - Added sameSite: "lax" to session cookies for cross-origin compatibility
   - Resolved race condition: login/register await refetchQueries before redirect
   - UserContext queryFn handles 401 gracefully (returns null instead of throwing)
   - No more blank dashboards or "Invalid hook call" errors

## Architecture Decisions

- **Why Passport.js?** Industry-standard, supports multiple strategies, session management
- **Why dual DB?** Separation of concerns - user data vs OAuth tokens
- **Why n8n webhook?** GHL OAuth redirect restrictions bypass
- **Why Socket.io?** Real-time WhatsApp status without polling
- **Why React Query?** Declarative server state, automatic cache invalidation
- **Why PostgreSQL sessions?** Scalable, persistent sessions across deployments
