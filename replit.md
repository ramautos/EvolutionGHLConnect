# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A multi-tenant SaaS platform connecting WhatsApp Business with GoHighLevel CRM. It automates QR code generation, manages multiple WhatsApp instances, and syncs connection data with GoHighLevel accounts. The platform enables agencies to manage client locations via a React frontend and Express backend, featuring a streamlined three-step onboarding process. The business vision is to provide intelligent automation for WhatsApp communication within the GoHighLevel ecosystem, targeting agencies and businesses seeking to enhance customer engagement and operational efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 19 (TypeScript, Vite).
- **UI/UX**: Radix UI primitives, shadcn/ui ("New York" style), inspired by modern SaaS (Linear, Vercel, Notion) with Material Design influences.
- **Styling**: Tailwind CSS with extensive CSS variable theming (light/dark mode, elevation states, border variants, HSL-based color system).
- **Typography**: Inter (body/UI), Space Grotesk (headings/accent).
- **State Management**: React Query (server state, `staleTime: Infinity`), React Context (`UserContext` for auth), `useState` for local UI state.
- **Routing**: Wouter (Landing, Onboarding, Dashboard, Locations).
- **Real-time**: Socket.io client for live WhatsApp status updates.

### Backend
- **Runtime**: Node.js with Express.js.
- **API Design**: RESTful, 62+ endpoints (User, Subaccount, WhatsApp Instance management).
- **Database**:
    - **Dual Database Architecture**: Replit PostgreSQL (Neon) for users/instances, External GHL PostgreSQL (147.93.180.187:5432) for OAuth tokens/company data.
    - Drizzle ORM for type-safe queries.
    - **Replit DB Tables**: `users`, `subaccounts`, `whatsappInstances`.
    - **External GHL DB Tables**: `ghl_clientes` (OAuth tokens).
- **Real-time**: Socket.io server for bidirectional event streaming (QR code, connection status).
- **Build**: Frontend (Vite), Backend (esbuild to ESM).

### Data Flow & Features
- **Onboarding (n8n OAuth Intermediary)**: GHL OAuth → n8n webhook (token exchange, store in GHL DB) → Redirect to app → Locations dashboard.
- **Locations Dashboard**: Displays GHL locations, WhatsApp connection status, phone number. Allows per-location WhatsApp instance activation.
- **Instance Management**: Create instance (generates QR via Evolution API), user scans QR, Socket.io updates status. Disconnect/Delete operations supported.
- **Query Strategy**: React Query with path-based keys (`["/api/instances/user", userId]`), manual invalidation on mutations for immediate UI updates.

### Authentication & Authorization
- **Current**: Demo mode with localStorage-based user ID.
- **GoHighLevel OAuth**: OAuth 2.0 via n8n intermediary; tokens stored in external PostgreSQL (`ghl_clientes`), never exposed to client. Automatic token refresh.
- **Future**: JWT-based auth, role-based access control.

### Design System
- **Elevation**: Three-tier system (`hover-elevate`, `active-elevate-2`).
- **Borders**: Context-aware (`--card-border`, etc.) using CSS variables.
- **Spacing**: Tailwind default scale (4px base unit).
- **Layout**: `max-w-7xl` (landing), `max-w-screen-2xl` (dashboard), `max-w-4xl` (content).
- **Grids**: Responsive patterns (e.g., `grid-cols-1 md:grid-cols-2`).

## External Dependencies

### Third-Party APIs
- **Evolution API**: WhatsApp Business API for QR codes, instance management, message handling. (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`).
- **GoHighLevel**: CRM platform, OAuth 2.0, token refresh, location/subaccount fetching. (`GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`).

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL for Replit user data (`DATABASE_URL`).
- **External GHL PostgreSQL**: Stores GoHighLevel OAuth tokens (`GHL_DB_*` secrets).

### UI & Component Libraries
- **Core UI**: Radix UI primitives, shadcn/ui, QRCode.react.
- **Form Handling**: React Hook Form with Zod for validation.
- **Notifications**: React Hot Toast.
- **Date Utilities**: date-fns.

### Build & Development Tools
- **Vite Plugins**: `@vitejs/plugin-react`, Replit-specific plugins.
- **TypeScript**: Strict mode enabled.
- **Tailwind**: PostCSS with autoprefixer.

### Socket Communication
- **Socket.io**: Client and server for real-time features, room-based subscriptions.

### Environment Variables
- `DATABASE_URL`
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
- `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_DB_HOST`, `GHL_DB_PORT`, `GHL_DB_NAME`, `GHL_DB_USER`, `GHL_DB_PASSWORD`
- `NODE_ENV`

## Production Deployment (Plan B: n8n OAuth Intermediary)

### Status: ✅ DEPLOYED
- **Production URL**: `https://whatsapp.cloude.es`
- **n8n Webhook**: `https://ray.cloude.es/webhook/registrocuenta`
- **GHL OAuth Redirect URI**: `https://ray.cloude.es/webhook/registrocuenta` (configured in GoHighLevel app)
- **Success Redirect**: `https://whatsapp.cloude.es/auth/success?company_id=XXX&location_id=YYY`

### OAuth Flow (Plan B)
1. User clicks "Instalar GoHighLevel App" → Redirects to GHL OAuth with `redirect_uri=https://ray.cloude.es/webhook/registrocuenta`
2. User authorizes in GoHighLevel
3. GHL redirects to n8n webhook with authorization code
4. n8n webhook:
   - Exchanges code for access_token + refresh_token
   - Stores tokens in external PostgreSQL (`ghl_clientes` table)
   - Extracts company_id and location_id from installer details
   - Redirects user to `https://whatsapp.cloude.es/auth/success?company_id=XXX&location_id=YYY`
5. AuthSuccess page (new route at `/auth/success`):
   - Saves company_id and location_id to localStorage
   - Redirects to `/locations` dashboard
6. LocationsDashboard loads all GHL locations using company_id from localStorage

### Why Plan B?
GoHighLevel blocks redirect URIs containing "ghl", "highlevel", or "gohighlevel" in domain OR path. Using n8n as intermediary avoids this restriction while maintaining security (tokens stored server-side only).

### Key Files Modified (October 2025)
- `client/src/components/Step1InstallGHL.tsx`: Changed OAuth redirect to point to n8n webhook
- `client/src/pages/AuthSuccess.tsx`: New page to receive n8n redirect and save company_id to localStorage
- `client/src/App.tsx`: Added `/auth/success` route
- `replit.md`: Updated OAuth flow documentation