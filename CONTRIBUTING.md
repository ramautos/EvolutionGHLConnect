# Contributing to EvolutionGHLConnect

Thank you for your interest in contributing! This guide will help you get started.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Evolution API instance
- GoHighLevel OAuth credentials

### Setup (< 5 minutes)

1. Clone the repository
```bash
git clone <repository-url>
cd EvolutionGHLConnect
```

2. Run setup script
```bash
npm install
npm run setup
```

3. Configure environment
```bash
# Edit .env with your credentials
nano .env
```

4. Verify configuration
```bash
npm run verify
```

5. Setup database
```bash
npm run db:push
```

6. Start development server
```bash
npm run dev
```

Visit http://localhost:5000

## Development Workflow

### Code Style

We use ESLint and Prettier for code consistency.

**Before committing:**
```bash
npm run format      # Format code
npm run lint:fix    # Fix linting issues
npm run check       # TypeScript check
```

**Pre-commit hooks** will automatically run these checks.

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add QR auto-close functionality
fix: resolve webhook connection issue
docs: update API documentation
refactor: split routes.ts into modules
test: add instance creation tests
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Testing

**Run tests:**
```bash
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

**Write tests for:**
- New features
- Bug fixes
- Critical paths (OAuth, webhooks, QR generation)

**Example test:**
```typescript
import { describe, it, expect } from 'vitest';

describe('Instance Creation', () => {
  it('should generate QR code', async () => {
    const result = await generateQR('test-instance');
    expect(result.qrCode).toBeDefined();
  });
});
```

### Pull Request Process

1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes
```bash
# Write code
# Write tests
# Update documentation
```

3. Run validation
```bash
npm run validate  # Runs type-check, lint, and format check
npm test          # Run tests
```

4. Commit and push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

5. Create Pull Request
- Use descriptive title
- Fill out PR template
- Link related issues
- Request review

### PR Requirements

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.logs (use logger instead)
- [ ] TypeScript checks pass
- [ ] Reviewed by at least one person

## Project Structure

```
EvolutionGHLConnect/
├── client/          # Frontend React app
├── server/          # Backend Express app
├── shared/          # Shared types and schemas
├── scripts/         # Development scripts
├── tests/           # Test files
└── docs/            # Documentation
```

### Key Files

- `server/routes.ts` - API routes (being refactored)
- `server/auth.ts` - Authentication logic
- `server/evolution-api.ts` - Evolution API client
- `client/src/App.tsx` - React app entry
- `shared/schema.ts` - Database schema

## Common Tasks

### Adding a New API Endpoint

1. Add route in `server/routes.ts` (or appropriate module)
```typescript
app.post('/api/your-endpoint', async (req, res) => {
  // Implementation
});
```

2. Add frontend API call in `client/src/lib/api.ts`
```typescript
export async function yourEndpoint(data: YourType) {
  return apiRequest('POST', '/api/your-endpoint', data);
}
```

3. Write tests
```typescript
describe('Your Endpoint', () => {
  it('should work correctly', async () => {
    // Test
  });
});
```

### Adding a New Component

1. Create component in `client/src/components/`
2. Add TypeScript types
3. Use existing UI components from `client/src/components/ui/`
4. Follow naming conventions (PascalCase)

### Database Changes

1. Update `shared/schema.ts`
2. Generate migration
```bash
npm run db:generate
```
3. Push to database
```bash
npm run db:push
```

## Debugging

### VS Code Debugging

Press F5 or use the Debug panel:
- "Debug Server" - Debug backend
- "Debug Client" - Debug frontend in Chrome
- "Debug Full Stack" - Debug both

### Logging

Use structured logging:
```typescript
import { logger } from './utils/logger';

logger.info({ userId, action }, 'User action');
logger.error({ error, context }, 'Error occurred');
```

**Don't use `console.log`** - use logger instead.

## Environment Variables

See `.env.example` for all required variables.

**Required:**
- `DATABASE_URL`
- `GHL_CLIENT_ID` / `GHL_CLIENT_SECRET`
- `EVOLUTION_API_URL` / `EVOLUTION_API_KEY`
- `STRIPE_SECRET_KEY`
- `SESSION_SECRET`

**Optional:**
- `N8N_API_URL` / `N8N_API_KEY`
- `LOG_LEVEL` (debug, info, warn, error)

## Resources

### Documentation
- [Architecture](./ARCHITECTURE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Documentation](./API_DOCUMENTATION.md)

### External
- [GoHighLevel API](https://highlevel.stoplight.io/)
- [Evolution API](https://doc.evolution-api.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [React Query](https://tanstack.com/query/latest)

## Getting Help

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review existing issues
- Ask in discussions
- Contact maintainers

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project guidelines

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to EvolutionGHLConnect!
