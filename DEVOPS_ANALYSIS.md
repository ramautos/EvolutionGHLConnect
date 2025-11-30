# Análisis DevOps - EvolutionGHLConnect

**Fecha:** 2025-11-29
**Proyecto:** EvolutionGHLConnect
**Entorno de Producción:**
- Frontend: https://whatsapp.cloude.es
- Backend: whatsapp.cloude.es (mismo servidor)
- n8n Webhook: https://ray.cloude.es

---

## 1. ESTADO ACTUAL

### 1.1 Infraestructura Existente

#### Build System
- **Frontend:** Vite 5.4.20 con React
- **Backend:** esbuild (bundling Node.js)
- **TypeScript:** 5.6.3 con configuración strict
- **Scripts de build:**
  ```json
  {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
  ```

#### Seguridad Implementada ✅
```typescript
// server/security.ts
- Rate Limiting:
  - Endpoints públicos: 100 req/15min
  - Autenticación: 10 req/15min (anti brute-force)
  - WhatsApp: 60 req/min

- Helmet.js con CSP configurado
- Cookie Parser
- Trust Proxy habilitado (para Cloudflare)
```

#### Base de Datos
- **ORM:** Drizzle ORM 0.39.1
- **Migraciones:** drizzle-kit 0.31.4
- **Pool:** PostgreSQL con @neondatabase/serverless

#### Variables de Entorno (.env.example)
```bash
# Configuradas:
DATABASE_URL=postgresql://...
GHL_CLIENT_ID/SECRET
STRIPE_SECRET_KEY/WEBHOOK_SECRET
EVOLUTION_API_URL/KEY
N8N_API_URL/KEY/WEBHOOK_URL
APP_URL=https://whatsapp.cloude.es
SESSION_SECRET
```

### 1.2 Puntos Críticos Identificados

#### ❌ AUSENCIAS CRÍTICAS

1. **Sin Docker/Containerización**
   - No existe Dockerfile
   - No hay docker-compose.yml
   - Deployment manual sin reproducibilidad

2. **Sin CI/CD Pipeline**
   - No hay `.github/workflows/`
   - No GitLab CI, ni Jenkins
   - Deployments manuales propensos a errores

3. **Sin Monitoreo/Observabilidad**
   - No hay logging estructurado (Winston/Pino)
   - Sin métricas (Prometheus)
   - Sin APM (Application Performance Monitoring)
   - Sin alertas automáticas

4. **Sin Healthchecks Robustos**
   - Healthcheck básico en `/` (solo status)
   - No valida conexiones críticas:
     - PostgreSQL
     - Evolution API
     - n8n
     - Stripe

5. **Sin Backup Automatizado**
   - No hay scripts de backup de PostgreSQL
   - Sin disaster recovery plan

6. **Gestión de Secrets Insegura**
   - `.env` en producción (riesgo de leak)
   - No usa gestores de secrets (AWS Secrets Manager, Vault)

7. **Sin Tests Automatizados**
   - No hay tests unitarios
   - No hay tests de integración
   - No hay tests E2E
   - Sin coverage reports

---

## 2. VULNERABILIDADES DE SEGURIDAD

### 2.1 Dependencias con CVEs Detectados

```bash
npm audit (producción):
- brace-expansion: ReDoS vulnerability (LOW)
- glob: Command injection (HIGH) ⚠️
- on-headers: HTTP header manipulation (LOW)
- express-session: Vulnerable dependency (LOW)

Total: 4 vulnerabilities (3 low, 1 high)
```

**Acción Requerida:** Ejecutar `npm audit fix` inmediatamente

### 2.2 Configuración de Seguridad

#### ✅ Implementado Correctamente
- Rate limiting por endpoint
- Helmet.js con CSP
- Trust proxy para reverse proxy
- Cookie parser
- CSRF protection (csrf-csrf)

#### ⚠️ Mejoras Necesarias
- **CSP demasiado permisivo:**
  ```typescript
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
  // 'unsafe-eval' permite ejecución de código arbitrario
  ```

- **Sin validación de origen CORS:**
  ```typescript
  // No hay configuración explícita de CORS
  // Vulnerabilidad a cross-origin attacks
  ```

- **Secrets en logs:**
  ```typescript
  // server/index.ts línea 60
  logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
  // Potencial leak de tokens/passwords en respuestas API
  ```

- **Sin autenticación API Key para webhooks:**
  ```typescript
  // Evolution API webhooks no validan firma/API key
  // Cualquiera puede enviar webhooks falsos
  ```

---

## 3. MEJORAS PROPUESTAS

### 3.1 PRIORITY 1: Containerización con Docker

#### Dockerfile Multi-Stage Optimizado
```dockerfile
# /Users/rayalvarado/.../EvolutionGHLConnect/Dockerfile
# Build stage - Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY client ./client
COPY vite.config.ts tsconfig.json ./
RUN npm run build

# Build stage - Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY server ./server
COPY shared ./shared
COPY tsconfig.json ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built artifacts
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist/public ./dist/public
COPY --from=backend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/index.js"]
```

#### .dockerignore
```
node_modules
dist
.git
.env
.env.local
*.md
client/src
server
shared
vite.config.ts
tsconfig.json
.DS_Store
npm-debug.log
```

#### docker-compose.yml (Desarrollo Local)
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@db:5432/evolutionghl
      SESSION_SECRET: dev-secret-change-in-prod
      GHL_CLIENT_ID: ${GHL_CLIENT_ID}
      GHL_CLIENT_SECRET: ${GHL_CLIENT_SECRET}
      EVOLUTION_API_URL: ${EVOLUTION_API_URL}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
      N8N_API_URL: ${N8N_API_URL}
      N8N_API_KEY: ${N8N_API_KEY}
      APP_URL: http://localhost:5000
      SERVER_URL: http://localhost:5000
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: evolutionghl
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### 3.2 PRIORITY 2: Pipeline CI/CD con GitHub Actions

#### .github/workflows/ci-cd.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ========================================
  # JOB 1: Security Audit & Linting
  # ========================================
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: |
          npm audit --production --audit-level=high
          npx audit-ci --high

      - name: TypeScript type check
        run: npm run check

      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  # ========================================
  # JOB 2: Build & Test
  # ========================================
  build-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  # ========================================
  # JOB 3: Build & Push Docker Image
  # ========================================
  docker-build:
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    needs: [security-audit, build-test]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64

  # ========================================
  # JOB 4: Deploy to Production
  # ========================================
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: docker-build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://whatsapp.cloude.es

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /var/www/evolutionghl
            docker-compose pull
            docker-compose up -d --remove-orphans
            docker-compose exec -T app npm run db:push
            docker system prune -f

      - name: Health check
        run: |
          sleep 10
          curl -f https://whatsapp.cloude.es/health || exit 1

      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3.3 PRIORITY 3: Healthcheck Robusto

#### server/health.ts (NUEVO)
```typescript
import { type Request, type Response } from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: string; latency?: number; error?: string };
    evolutionAPI: { status: string; latency?: number; error?: string };
    n8n: { status: string; latency?: number; error?: string };
    memory: { status: string; usage: number; total: number };
    disk: { status: string; usage?: number };
  };
}

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkEvolutionAPI(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': process.env.EVOLUTION_API_KEY || '' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'degraded', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkN8N(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch(`${process.env.N8N_API_URL}/healthz`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'degraded', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function checkMemory(): { status: string; usage: number; total: number } {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;
  const percentUsed = (heapUsedMB / heapTotalMB) * 100;

  return {
    status: percentUsed > 90 ? 'degraded' : 'healthy',
    usage: Math.round(heapUsedMB),
    total: Math.round(heapTotalMB),
  };
}

export async function healthCheckHandler(req: Request, res: Response) {
  const startTime = Date.now();

  // Parallel health checks (non-blocking)
  const [database, evolutionAPI, n8n, memory] = await Promise.allSettled([
    checkDatabase(),
    checkEvolutionAPI(),
    checkN8N(),
    Promise.resolve(checkMemory()),
  ]);

  const checks = {
    database: database.status === 'fulfilled' ? database.value : { status: 'error', error: 'Check failed' },
    evolutionAPI: evolutionAPI.status === 'fulfilled' ? evolutionAPI.value : { status: 'error', error: 'Check failed' },
    n8n: n8n.status === 'fulfilled' ? n8n.value : { status: 'error', error: 'Check failed' },
    memory: memory.status === 'fulfilled' ? memory.value : { status: 'error', usage: 0, total: 0 },
    disk: { status: 'not_implemented' },
  };

  // Determine overall status
  const hasUnhealthy = Object.values(checks).some((check) => check.status === 'unhealthy');
  const hasDegraded = Object.values(checks).some((check) => check.status === 'degraded');

  const status: HealthStatus['status'] = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthStatus);
  console.log(`Health check completed in ${Date.now() - startTime}ms - Status: ${status}`);
}
```

**Integrar en server/index.ts:**
```typescript
import { healthCheckHandler } from './health';

// Reemplazar health check simple por:
app.get('/health', healthCheckHandler);
```

### 3.4 PRIORITY 4: Logging Estructurado

#### server/logger.ts (NUEVO)
```typescript
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'evolutionghl-connect' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      ),
    }),

    // File output (errors)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // File output (combined)
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

// Redact sensitive data
logger.addFilter((info) => {
  const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'authorization'];
  const redact = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in redacted) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redact(redacted[key]);
      }
    }

    return redacted;
  };

  info = redact(info);
  return info;
});

export default logger;
```

**Dependencia requerida:**
```bash
npm install winston
npm install --save-dev @types/winston
```

### 3.5 PRIORITY 5: Monitoreo con Prometheus

#### server/metrics.ts (NUEVO)
```typescript
import promClient from 'prom-client';

// Initialize Prometheus registry
export const register = new promClient.Registry();

// Default metrics (CPU, memory, event loop lag)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const whatsappMessagesSent = new promClient.Counter({
  name: 'whatsapp_messages_sent_total',
  help: 'Total WhatsApp messages sent',
  labelNames: ['locationId', 'status'],
});

export const activeConnections = new promClient.Gauge({
  name: 'active_whatsapp_connections',
  help: 'Number of active WhatsApp connections',
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(whatsappMessagesSent);
register.registerMetric(activeConnections);

// Middleware para capturar métricas HTTP
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
}
```

**Endpoint de métricas en server/index.ts:**
```typescript
import { register, metricsMiddleware } from './metrics';

app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Dependencia:**
```bash
npm install prom-client
```

### 3.6 PRIORITY 6: Gestión de Secrets

#### Migrar a Variables de Entorno del Sistema

**docker-compose.production.yml:**
```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/tu-usuario/evolutionghlconnect:latest
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
      GHL_CLIENT_ID: ${GHL_CLIENT_ID}
      GHL_CLIENT_SECRET: ${GHL_CLIENT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      EVOLUTION_API_URL: ${EVOLUTION_API_URL}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
      N8N_API_URL: ${N8N_API_URL}
      N8N_API_KEY: ${N8N_API_KEY}
      N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL}
      APP_URL: https://whatsapp.cloude.es
      SERVER_URL: https://whatsapp.cloude.es
    secrets:
      - db_password
      - session_secret
      - stripe_key
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

secrets:
  db_password:
    external: true
  session_secret:
    external: true
  stripe_key:
    external: true
```

**Crear secrets en Docker:**
```bash
echo "your-db-password" | docker secret create db_password -
echo "your-session-secret" | docker secret create session_secret -
echo "sk_live_xxx" | docker secret create stripe_key -
```

### 3.7 PRIORITY 7: Backup Automatizado

#### scripts/backup-db.sh (NUEVO)
```bash
#!/bin/bash
# Backup script for PostgreSQL database

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/evolutionghl"
DB_NAME="evolutionghl"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Perform backup
echo "Starting backup of $DB_NAME..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup completed: $BACKUP_FILE ($SIZE)"
else
  echo "ERROR: Backup failed!"
  exit 1
fi

# Remove old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
if [ -n "${AWS_S3_BUCKET:-}" ]; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BUCKET}/backups/$(basename $BACKUP_FILE)"
fi

echo "Backup process completed successfully!"
```

**Cron job (ejecutar diariamente a las 2 AM):**
```bash
crontab -e
# Agregar:
0 2 * * * /var/www/evolutionghl/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1
```

### 3.8 PRIORITY 8: Mejoras de Seguridad

#### Validar Webhooks de Evolution API

**server/middleware/webhook-auth.ts (NUEVO):**
```typescript
import crypto from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';

export function validateEvolutionWebhook(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-evolution-signature'];
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!signature || !apiKey) {
    return res.status(401).json({ error: 'Unauthorized webhook' });
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}
```

#### CORS Estricto

**server/index.ts:**
```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://whatsapp.cloude.es',
  'https://marketplace.gohighlevel.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### CSP Mejorado

**server/security.ts:**
```typescript
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"], // ❌ REMOVED 'unsafe-eval'
      scriptSrcAttr: ["'none'"],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://evolution.cloude.es",
        "wss://whatsapp.cloude.es"
      ],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

---

## 4. PLAN DE IMPLEMENTACIÓN

### Fase 1: Fundamentos (Semana 1)
- [ ] Crear Dockerfile multi-stage
- [ ] Crear docker-compose.yml
- [ ] Ejecutar `npm audit fix`
- [ ] Implementar healthcheck robusto
- [ ] Configurar logging estructurado (Winston)

### Fase 2: CI/CD (Semana 2)
- [ ] Crear pipeline GitHub Actions
- [ ] Configurar GitHub Container Registry
- [ ] Configurar secrets en GitHub
- [ ] Test deployment automático a staging

### Fase 3: Monitoreo (Semana 3)
- [ ] Implementar Prometheus metrics
- [ ] Configurar Grafana dashboards
- [ ] Configurar alertas (PagerDuty/Slack)
- [ ] Implementar APM básico

### Fase 4: Seguridad (Semana 4)
- [ ] Validación de webhooks con firma
- [ ] CORS estricto
- [ ] CSP sin unsafe-eval
- [ ] Migrar secrets a gestor externo
- [ ] Penetration testing

### Fase 5: Backup & DR (Semana 5)
- [ ] Script de backup PostgreSQL
- [ ] Automatización con cron
- [ ] Upload a S3/Cloud Storage
- [ ] Documentar disaster recovery plan
- [ ] Test de restore

---

## 5. MÉTRICAS DE ÉXITO

### DevOps Maturity
- **Deployment Frequency:** De manual → 10+ deploys/día
- **Lead Time for Changes:** De horas → <30 minutos
- **Mean Time to Recovery:** De horas → <15 minutos
- **Change Failure Rate:** De 15% → <5%

### Seguridad
- **CVEs:** 0 vulnerabilidades HIGH/CRITICAL
- **Secret Leaks:** 0 secrets en código
- **HTTPS Grade:** A+ en SSL Labs
- **Security Headers:** A+ en securityheaders.com

### Observabilidad
- **Uptime:** 99.9% SLA
- **Response Time (p95):** <200ms
- **Error Rate:** <0.1%
- **Log Coverage:** 100% de errores loggeados

---

## 6. COSTOS ESTIMADOS

### Infraestructura
- **GitHub Actions:** $0 (free tier - 2000 min/mes)
- **Container Registry:** $0 (GHCR free tier)
- **Monitoring (Grafana Cloud):** $0-$49/mes
- **Backups (S3):** ~$5/mes (50GB)

### Tiempo de Desarrollo
- **Fase 1-2:** 40 horas (DevOps engineer)
- **Fase 3-5:** 60 horas (DevOps engineer)
- **Total:** ~100 horas

---

## 7. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Downtime durante migración a Docker | Media | Alto | Blue-green deployment con rollback |
| Secrets leak en CI/CD | Baja | Crítico | GitHub secrets + git-secrets hook |
| Performance degradation con logging | Media | Medio | Async logging + log sampling |
| Backup corruption | Baja | Alto | Automated restore testing mensual |
| CI/CD pipeline failure | Media | Medio | Manual deployment fallback documented |

---

## 8. PRÓXIMOS PASOS INMEDIATOS

1. **HOY:**
   - Ejecutar `npm audit fix`
   - Crear Dockerfile básico
   - Test build local con Docker

2. **ESTA SEMANA:**
   - Implementar healthcheck robusto
   - Configurar Winston logging
   - Crear docker-compose.yml

3. **PRÓXIMA SEMANA:**
   - Setup GitHub Actions pipeline
   - Configurar staging environment
   - Primera automatic deployment

---

**Archivos de Configuración Incluidos:**
- `/Dockerfile` - Containerización optimizada
- `/.dockerignore` - Exclusiones de build
- `/docker-compose.yml` - Orquestación local
- `/docker-compose.production.yml` - Producción
- `/.github/workflows/ci-cd.yml` - Pipeline CI/CD
- `/server/health.ts` - Healthchecks avanzados
- `/server/logger.ts` - Logging estructurado
- `/server/metrics.ts` - Prometheus metrics
- `/scripts/backup-db.sh` - Backup automatizado

**Documentación de Referencia:**
- https://docs.docker.com/build/building/multi-stage/
- https://docs.github.com/en/actions
- https://prometheus.io/docs/introduction/overview/
- https://12factor.net/
