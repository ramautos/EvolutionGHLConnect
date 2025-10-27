# WhatsApp-GoHighLevel AI Integration Platform

## Overview
A production-ready multi-tenant SaaS platform integrating WhatsApp Business with GoHighLevel CRM. It provides user authentication, role-based access control, automated WhatsApp instance management with a `locationId_number` naming convention for n8n routing, and real-time connection monitoring. The platform aims to streamline communication and CRM processes for businesses, offering significant market potential by bridging these two critical business tools. It also supports storing and managing OpenAI API keys per GoHighLevel location for transcription services.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (October 27, 2025)

### UI/UX Improvements
1. **Dashboard Header**: Replaced simple name display with professional DropdownMenu showing "Mi Cuenta" with user details (name/email) and navigation options (Perfil, Panel de Admin, Cerrar Sesión)
2. **OpenAI Configuration Location**: Moved from user Profile page to individual Subaccount Details page - each subcuenta now manages its own OpenAI API key
3. **Admin Panel Enhancement**: Completely redesigned with Tabs interface showing:
   - **Usuarios Tab**: All system users with role badges and subaccount counts
   - **Subcuentas Tab**: All subaccounts with OpenAI configuration status
   - **Instancias Tab**: All WhatsApp instances with connection status
   - Statistics cards showing: Total users, subaccounts, instances, and connection rate

### Architecture Changes
- **OpenAI API Key**: Stored at subcuenta level (not user level), allowing independent AI configuration per GoHighLevel location
- **Admin Access**: API endpoints `/api/admin/users`, `/api/admin/subaccounts`, `/api/admin/instances` provide complete system visibility for administrators
- **Profile Page**: Simplified to only show personal information (name, phone, email) and password change functionality

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