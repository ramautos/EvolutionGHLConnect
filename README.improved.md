# EvolutionGHLConnect

> WhatsApp Integration Platform connecting Evolution API with GoHighLevel CRM

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.6-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Quick Start

Get up and running in less than 5 minutes:

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
npm run setup

# 3. Configure credentials
# Edit .env with your API keys

# 4. Verify configuration
npm run verify

# 5. Setup database
npm run db:push

# 6. Start development
npm run dev
```

Visit [http://localhost:5000](http://localhost:5000)

## What is EvolutionGHLConnect?

A complete SaaS platform that enables seamless WhatsApp integration for GoHighLevel agencies. Features include:

- **Multi-tenant Architecture** - Manage multiple WhatsApp instances per location
- **Real-time QR Connection** - Instant QR code generation with celebration animations
- **OAuth Integration** - Secure GoHighLevel marketplace app
- **Webhook Automation** - Direct Evolution API to n8n webhooks
- **Subscription Billing** - Stripe-powered subscription management

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- Shadcn UI (components)
- Tailwind CSS (styling)
- Socket.IO (real-time)

### Backend
- Express.js
- PostgreSQL + Drizzle ORM
- Passport.js (authentication)
- Stripe (billing)
- Socket.IO (WebSocket)

### Integrations
- Evolution API (WhatsApp)
- GoHighLevel CRM (OAuth)
- n8n (automation)
- Stripe (payments)

## Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and flows
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Contributing Guide](./CONTRIBUTING.md) - Development guidelines
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Evolution API instance
- GoHighLevel OAuth credentials
- Stripe account

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your_api_key
STRIPE_SECRET_KEY=sk_test_xxxxx
SESSION_SECRET=random_secret_string

# Frontend (must match GHL_CLIENT_ID)
VITE_GHL_CLIENT_ID=your_ghl_client_id
```

See `.env.example` for all variables.

### Available Scripts

**Development:**
```bash
npm run dev          # Start full stack
npm run dev:client   # Frontend only (Vite)
npm run dev:server   # Backend only (tsx watch)
npm run dev:db       # Drizzle Studio (DB GUI)
```

**Build & Production:**
```bash
npm run build        # Build frontend + backend
npm start            # Start production server
npm run clean        # Clean build artifacts
```

**Code Quality:**
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format with Prettier
npm run check        # TypeScript type check
npm run validate     # Run all checks
```

**Testing:**
```bash
npm test             # Run tests
npm run test:ui      # Interactive test UI
npm run test:coverage # Coverage report
```

**Database:**
```bash
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations
npm run db:studio    # Open Drizzle Studio
```

### Project Structure

```
EvolutionGHLConnect/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication
│   ├── evolution-api.ts # Evolution client
│   └── index.ts         # Server entry
├── shared/              # Shared code
│   └── schema.ts        # Database schema
├── scripts/             # Dev scripts
│   ├── setup.js         # Setup automation
│   └── verify-env.js    # Env validation
└── docs/                # Documentation
```

## Key Features

### 1. OAuth Integration
Secure installation via GoHighLevel marketplace with popup-based OAuth flow.

### 2. QR Code Generation
Real-time QR code display with automatic connection detection and celebration animations.

### 3. Multi-Instance Management
Support for multiple WhatsApp instances per location with independent configurations.

### 4. Webhook Automation
Direct webhook routing from Evolution API to n8n for automated message processing.

### 5. Subscription Billing
Stripe-powered subscription management with trial periods and plan upgrades.

## Deployment

### Replit (Recommended)

1. Import repository to Replit
2. Configure Secrets (environment variables)
3. Run deployment:
```bash
npm run build
npm start
```

### Docker

```bash
docker build -t evolution-ghl-connect .
docker run -p 5000:5000 --env-file .env evolution-ghl-connect
```

### Manual

1. Build the project:
```bash
npm run build
```

2. Set environment variables in production

3. Start the server:
```bash
NODE_ENV=production node dist/index.js
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Quick contribution steps:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Troubleshooting

### QR Code Not Disappearing
- Verify `N8N_WEBHOOK_URL` is configured
- Check Evolution API webhook settings
- Review [Troubleshooting Guide](./TROUBLESHOOTING.md)

### OAuth Popup Issues
- Ensure `VITE_GHL_CLIENT_ID` matches `GHL_CLIENT_ID`
- Check popup blockers
- Verify redirect URIs in GHL app settings

### Database Connection Errors
- Verify `DATABASE_URL` format
- Check PostgreSQL is running
- Run `npm run db:push` to sync schema

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Support

- Documentation: [./docs/](./docs/)
- Issues: [GitHub Issues](../../issues)
- Email: [support@example.com](mailto:support@example.com)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- GoHighLevel for CRM integration
- Evolution API for WhatsApp connectivity
- n8n for automation capabilities
- Stripe for payment processing

---

**Built with** by Ray Alvarado + Claude Code

**Last Updated:** 2025-11-29
