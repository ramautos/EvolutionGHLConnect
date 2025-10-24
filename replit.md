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

**Routing**: Wouter for client-side routing with three main routes: Landing (`/`), Onboarding (`/onboarding`), and Dashboard (`/dashboard`)

**Real-time Updates**: Socket.io client for WebSocket connections to receive live WhatsApp instance status updates

### Backend Architecture

**Runtime & Framework**: Node.js with Express.js server

**API Design**: RESTful API with 62+ endpoints organized by resource type:
- User management (`/api/users/*`)
- Subaccount operations (`/api/subaccounts/*`)
- WhatsApp instance lifecycle (`/api/instances/*`)

**Database Layer**: 
- PostgreSQL as primary database (via Neon serverless)
- Drizzle ORM for type-safe database queries and migrations
- Three core tables: `users`, `subaccounts`, `whatsappInstances`

**Schema Design**:
```
users (id, email, name, createdAt)
subaccounts (id, userId, ghlId, name, selected, createdAt)
whatsappInstances (id, subaccountId, instanceName, phoneNumber, status, qrCode, webhookUrl, createdAt, connectedAt)
```

**Real-time Communication**: Socket.io server for bidirectional event streaming, enabling instant QR code updates and connection status changes

**Build Process**: 
- Frontend: Vite bundler producing static assets
- Backend: esbuild bundling server code to ESM format for production
- Separate development and production modes with different serving strategies

### Data Flow Patterns

**Onboarding Flow**:
1. User creates account or uses existing demo account
2. Connects GoHighLevel OAuth (simulated in current implementation)
3. Selects subaccounts to manage
4. Generates WhatsApp QR code → Scans → Auto-detects phone number
5. Webhook fires to send connection data to configured endpoint

**Instance Management**:
- Create instance → Evolution API generates QR → Socket emits QR to frontend
- User scans QR → Evolution API detects connection → Updates instance status
- Frontend polls or receives Socket events for status changes
- Disconnect/Delete operations update database and trigger Evolution API cleanup

**Query Strategy**: React Query with path-based keys (e.g., `["/api/instances/user", userId]`) and manual invalidation after mutations

### Authentication & Authorization

**Current Implementation**: Demo mode with localStorage-based user identification. System creates or retrieves demo user (`demo@whatsappai.com`) on first visit.

**Intended Architecture** (based on attached docs): JWT-based authentication with Google OAuth 2.0 for GoHighLevel integration, role-based access control (Super Admin, Agency, User, Reseller), and impersonation capabilities.

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

**GoHighLevel (Planned)**: CRM integration for OAuth authentication and subaccount management. Current implementation uses simulated data structures.

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

Required variables:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `EVOLUTION_API_URL`: Evolution API base URL
- `EVOLUTION_API_KEY`: Evolution API authentication key
- `NODE_ENV`: Development/production mode switch

Optional/Future:
- GoHighLevel OAuth credentials
- Webhook configuration URLs
- JWT secrets for authentication