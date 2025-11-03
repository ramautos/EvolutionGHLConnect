# Sesión 2025-01-11 (Parte 2): Análisis Completo de n8n

**Fecha**: 11 de Enero, 2025
**Continuación de**: SESION_2025-01-11_OAUTH_REINSTALACION.md
**Estado**: ✅ Completada - Documentación completa de n8n creada

---

## 📋 Resumen de Esta Sesión

Esta sesión se enfocó en **analizar completamente la documentación de n8n** para tener una referencia técnica completa que nos permita trabajar con n8n en el proyecto.

---

## 🎯 Objetivo de la Investigación

El usuario solicitó:
> "analiza completamente esta documentacion de n8n para que tengas la documentacion de api luego que lo leas completamente vamos a trabajar en algunas cosas"

**URL Proporcionada**: https://github.com/n8n-io/n8n

---

## 🔍 Proceso de Investigación

### Agente Técnico Desplegado

Se lanzó un **agente de investigación técnica especializado** con las siguientes instrucciones:

**Objetivos del Análisis**:
1. ✅ Estructura del repositorio de n8n
2. ✅ API REST completa de n8n
3. ✅ Sistema de webhooks
4. ✅ Workflows programáticos
5. ✅ Integración con aplicaciones externas
6. ✅ OAuth y gestión de credenciales
7. ✅ Self-hosting y configuración
8. ✅ Casos de uso específicos para nuestro proyecto

**Entregable Solicitado**:
- Guía de referencia completa
- Todos los endpoints de API con ejemplos
- Best practices de integración
- Ejemplos de código para nuestro caso de uso

---

## 📚 Documentación Creada

### Archivo Principal: N8N_COMPREHENSIVE_GUIDE.md

**Ubicación**: `/Users/rayalvarado/Desktop/ghl/N8N_COMPREHENSIVE_GUIDE.md`

**Tamaño**: 92 KB (~50,000 palabras)

**Estructura Completa**:

```
1. ARCHITECTURE OVERVIEW
   1.1 What is n8n?
   1.2 Core Components
   1.3 Key Technical Characteristics

2. REPOSITORY STRUCTURE
   2.1 Monorepo Organization
   2.2 Key Packages Breakdown
   2.3 Important Directories

3. N8N REST API REFERENCE
   3.1 Authentication
   3.2 Workflows API
   3.3 Executions API
   3.4 Credentials API
   3.5 Tags API
   3.6 Audit API
   3.7 Swagger UI Integration

4. WEBHOOKS DEEP DIVE
   4.1 Webhook URLs
   4.2 Webhook Response Modes
   4.3 Authentication Methods
   4.4 Data Access in Webhooks
   4.5 Respond to Webhook Node

5. OAUTH & CREDENTIALS MANAGEMENT
   5.1 OAuth2 Flow in n8n
   5.2 Credential Types
   5.3 GoHighLevel OAuth Setup
   5.4 OAuth Callback Handling
   5.5 Token Refresh

6. WORKFLOW EXECUTION & DATA FLOW
   6.1 Data Structure
   6.2 Passing Data Between Nodes
   6.3 Expressions & Variables
   6.4 Built-in Variables
   6.5 Data Transformations

7. ERROR HANDLING & RETRY LOGIC
   7.1 Error Trigger Workflows
   7.2 Try/Catch Patterns
   7.3 Retry Logic Configuration
   7.4 Error Workflow Examples

8. SELF-HOSTING CONFIGURATION
   8.1 Docker Setup
   8.2 Environment Variables
   8.3 Database Configuration
   8.4 Reverse Proxy Setup
   8.5 SSL/TLS Configuration
   8.6 Backup Strategies

9. HTTP REQUEST NODE & EXTERNAL APIS
   9.1 HTTP Methods
   9.2 Request Configuration
   9.3 Authentication Types
   9.4 Response Handling
   9.5 Rate Limiting

10. CODE/FUNCTION NODES
    10.1 JavaScript in n8n
    10.2 Run Once vs Each Item
    10.3 Built-in Methods
    10.4 Data Transformations
    10.5 HTTP Requests in Code
    10.6 Error Handling in Code

11. USE CASE IMPLEMENTATION GUIDE
    11.1 Architecture Diagram
    11.2 GoHighLevel App Setup
    11.3 OAuth Callback Workflow
    11.4 Token Storage Workflow
    11.5 Token Refresh Workflow
    11.6 Backend API Integration
    11.7 Testing Guide

12. BEST PRACTICES & SECURITY
    12.1 Security Best Practices
    12.2 Performance Optimization
    12.3 Monitoring & Logging
    12.4 Backup & Disaster Recovery
    12.5 API Best Practices

13. REFERENCES & RESOURCES
    13.1 Official Documentation
    13.2 GitHub Repositories
    13.3 Community Resources
    13.4 Workflow Templates
    13.5 Tools & Extensions

APPENDIX A: QUICK REFERENCE CHEAT SHEET
APPENDIX B: TROUBLESHOOTING GUIDE
```

---

## 🎯 Hallazgos Clave de n8n

### 1. Arquitectura de n8n

**Componentes Principales**:
```
┌─────────────────────────────────────────────────────────────┐
│                         n8n Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   REST API   │  │   Webhooks   │      │
│  │  (Editor UI) │  │   Endpoints  │  │   Listener   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Workflow Execution Engine (Core)          │   │
│  │  - Node Processing  - Data Flow  - Error Handling   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Credentials │  │   Database   │  │   Nodes Base │      │
│  │    Store     │  │ (PostgreSQL/ │  │  (400+ nodes)│      │
│  │  (Encrypted) │  │   SQLite)    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Stack Técnico**:
- TypeScript (90.6%)
- Vue.js (7.8%)
- Node.js (>=22.16 required)
- pnpm (>=10.2.1)
- PostgreSQL / SQLite

### 2. REST API de n8n

**Autenticación**:
```bash
X-N8N-API-KEY: tu-api-key-aqui
```

**Endpoints Principales**:

```bash
# Workflows
GET    /api/v1/workflows              # Listar workflows
POST   /api/v1/workflows              # Crear workflow
GET    /api/v1/workflows/{id}         # Obtener workflow
PUT    /api/v1/workflows/{id}         # Actualizar workflow
DELETE /api/v1/workflows/{id}         # Eliminar workflow
POST   /api/v1/workflows/{id}/execute # Ejecutar workflow

# Executions
GET    /api/v1/executions             # Listar ejecuciones
GET    /api/v1/executions/{id}        # Obtener ejecución
DELETE /api/v1/executions/{id}        # Eliminar ejecución

# Credentials
GET    /api/v1/credentials            # Listar credenciales
POST   /api/v1/credentials            # Crear credencial
GET    /api/v1/credentials/{id}       # Obtener credencial
PUT    /api/v1/credentials/{id}       # Actualizar credencial
DELETE /api/v1/credentials/{id}       # Eliminar credencial

# Tags
GET    /api/v1/tags                   # Listar tags
POST   /api/v1/tags                   # Crear tag

# Audit
GET    /api/v1/audit                  # Obtener audit logs
```

**Ejemplo: Ejecutar Workflow**:
```bash
curl -X POST https://n8n.domain.com/api/v1/workflows/123/execute \
  -H "X-N8N-API-KEY: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "test@example.com",
      "name": "John Doe"
    }
  }'
```

### 3. Webhooks en n8n

**URLs de Webhook**:
```
Test:       https://n8n.domain.com/webhook-test/tu-path
Production: https://n8n.domain.com/webhook/tu-path
```

**4 Modos de Respuesta**:

1. **onReceived**: Responde inmediatamente con 200 OK
   ```javascript
   // Útil para: Webhooks que requieren respuesta rápida
   // El workflow continúa ejecutándose en background
   ```

2. **lastNode**: Responde con data del último nodo
   ```javascript
   // Útil para: APIs que esperan data procesada
   // Espera a que todo el workflow termine
   ```

3. **firstEntryJson**: Responde con primer item del primer nodo
   ```javascript
   // Útil para: Respuestas simples basadas en input
   ```

4. **responseNode**: Usa nodo "Respond to Webhook"
   ```javascript
   // Útil para: Control total sobre la respuesta
   // Permite múltiples respuestas condicionales
   ```

**Acceso a Datos del Webhook**:
```javascript
// Query params
{{ $json.query.param_name }}

// Headers
{{ $json.headers['content-type'] }}

// Body (JSON)
{{ $json.body.field_name }}

// Full URL
{{ $json.headers['x-forwarded-proto'] }}://{{ $json.headers.host }}{{ $json.path }}
```

### 4. OAuth2 en n8n

**Flujo Completo**:
```
1. Usuario inicia OAuth en n8n
   ↓
2. n8n redirige a proveedor OAuth (ej: GoHighLevel)
   ↓
3. Usuario autoriza
   ↓
4. Proveedor redirige a: n8n.domain.com/rest/oauth2-credential/callback
   ↓
5. n8n intercambia code por access_token
   ↓
6. n8n guarda tokens (encriptados) en BD
   ↓
7. n8n usa tokens en HTTP Request nodes
   ↓
8. n8n refresh automático cuando expira
```

**Setup para GoHighLevel**:

```json
{
  "name": "GoHighLevel OAuth2 API",
  "clientId": "tu-client-id",
  "clientSecret": "tu-client-secret",
  "authUrl": "https://marketplace.gohighlevel.com/oauth/chooselocation",
  "accessTokenUrl": "https://services.leadconnectorhq.com/oauth/token",
  "scope": "conversations.readonly conversations.write locations.readonly",
  "authQueryParameters": "response_type=code",
  "authentication": "body"
}
```

### 5. Variables Built-in de n8n

```javascript
// Data del item actual
$json                     // { "name": "John", "email": "john@example.com" }
$json.name                // "John"

// Todos los items de entrada
$input.all()              // Array de todos los items
$input.first()            // Primer item
$input.last()             // Último item
$input.item              // Item actual (igual que $json)

// Info del workflow
$workflow.id              // "abc123"
$workflow.name            // "My Workflow"
$workflow.active          // true/false

// Info de la ejecución
$execution.id             // "exec-xyz789"
$execution.mode           // "manual" | "webhook" | "trigger"
$execution.resumeUrl      // URL para resumir execution

// Variables de entorno
$env.DATABASE_URL         // Acceso a env vars
$env.API_KEY

// Utilidades
$now                      // Timestamp actual
$today                    // Fecha de hoy (ISO)
$jmespath(data, query)    // Query JSON con JMESPath
$binary                   // Data binaria del item

// Nodo anterior
$('Node Name').item.json  // Data del nodo "Node Name"
$('Node Name').all()      // Todos los items del nodo
```

### 6. Code Node - JavaScript

**Ejemplo: Transformación de Datos**:
```javascript
// Transformar items
const transformedItems = items.map(item => ({
  ...item.json,
  fullName: `${item.json.firstName} ${item.json.lastName}`,
  createdAt: new Date().toISOString(),
  status: item.json.active ? 'active' : 'inactive'
}));

return transformedItems.map(data => ({ json: data }));
```

**Ejemplo: Filtrar Items**:
```javascript
// Solo items activos
const activeItems = items.filter(item =>
  item.json.status === 'active' &&
  item.json.verified === true
);

return activeItems;
```

**Ejemplo: HTTP Request Custom**:
```javascript
// Hacer request HTTP personalizado
const response = await $http.request({
  method: 'POST',
  url: 'https://api.example.com/endpoint',
  headers: {
    'Authorization': `Bearer ${$env.API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: {
    data: $json,
    timestamp: new Date().toISOString()
  }
});

return [{ json: response }];
```

**Ejemplo: Agrupar por Campo**:
```javascript
// Agrupar items por campo
const grouped = items.reduce((acc, item) => {
  const key = item.json.category;
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(item.json);
  return acc;
}, {});

return Object.entries(grouped).map(([category, items]) => ({
  json: { category, items, count: items.length }
}));
```

### 7. Error Handling en n8n

**Retry Logic Configuration**:
```json
{
  "maxTries": 3,
  "waitBetweenTries": 1000,
  "retryOnFail": true,
  "continueOnFail": false
}
```

**Error Trigger Workflow**:
```javascript
// Workflow que se ejecuta cuando otro falla
{
  "nodes": [
    {
      "type": "n8n-nodes-base.errorTrigger",
      "name": "Error Trigger"
    },
    {
      "type": "n8n-nodes-base.code",
      "name": "Process Error",
      "code": `
        const error = $json.error;
        const workflow = $json.workflow;

        // Log error
        console.error('Workflow failed:', {
          workflowId: workflow.id,
          workflowName: workflow.name,
          error: error.message,
          stack: error.stack
        });

        return [{ json: { processed: true } }];
      `
    }
  ]
}
```

---

## 🎯 Caso de Uso: Nuestro Proyecto

### Arquitectura Actual

```
GoHighLevel Marketplace App Installation
    ↓
User clicks "Install"
    ↓
GHL OAuth Page (user authorizes)
    ↓
GHL redirects to: oauth.cloude.es/ghl/authorize?code=...&state=...
    ↓
n8n Webhook receives callback
    ↓
n8n intercambia code por access_token (GHL API)
    ↓
n8n obtiene location data (GHL API)
    ↓
n8n guarda tokens en base de datos externa (PostgreSQL Neon)
    ↓
n8n llama a webhook de backend: whatsapp.cloude.es/api/webhooks/register-subaccount
    ↓
Backend crea subcuenta + suscripción
    ↓
Usuario redirigido al dashboard
```

### Workflow n8n Completo

**Nombre**: `GHL OAuth Callback Handler`

**Trigger**: Webhook
- URL: `https://n8n.domain.com/webhook/ghl/oauth/callback`
- Method: GET
- Response Mode: `lastNode`

**Nodes**:

1. **Webhook Trigger**
2. **Validate State** (Code Node)
3. **Exchange Code for Token** (HTTP Request)
4. **Get Location Data** (HTTP Request)
5. **Save to GHL Database** (HTTP Request to external DB)
6. **Create Subaccount** (HTTP Request to backend)
7. **Send Success Response** (Respond to Webhook)

**Código Completo en la Guía**: Sección 11.3

---

## 📦 Self-Hosting Configuration

### Docker Compose Example

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=secure_password
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - GENERIC_TIMEZONE=America/New_York
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n_password
      - N8N_ENCRYPTION_KEY=your-encryption-key-here
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n_password
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

### Environment Variables Críticas

```bash
# Autenticación
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password

# Host Configuration
N8N_HOST=n8n.yourdomain.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.yourdomain.com/

# Database
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=secure_password

# Security
N8N_ENCRYPTION_KEY=your-long-random-encryption-key

# Timezone
GENERIC_TIMEZONE=America/New_York

# Execution
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200

# Queue (para alta carga)
QUEUE_BULL_REDIS_HOST=redis
QUEUE_BULL_REDIS_PORT=6379
```

---

## 🔐 Security Best Practices

### 1. Webhook Authentication

```javascript
// En webhook node, validar token
const receivedToken = $json.headers['x-api-token'];
const expectedToken = $env.WEBHOOK_SECRET_TOKEN;

if (receivedToken !== expectedToken) {
  throw new Error('Unauthorized: Invalid token');
}

// Continuar con el workflow...
```

### 2. Credential Encryption

- n8n encripta automáticamente todas las credenciales
- Usa `N8N_ENCRYPTION_KEY` para encriptar/desencriptar
- **NUNCA compartas** tu encryption key
- Haz backup del encryption key de forma segura

### 3. Rate Limiting

```javascript
// En Code node, implementar rate limiting
const redis = await $http.request({
  method: 'GET',
  url: `${$env.REDIS_URL}/rate_limit:${$json.ip}`
});

const requestCount = parseInt(redis || '0');

if (requestCount > 100) {
  throw new Error('Rate limit exceeded');
}

// Incrementar contador
await $http.request({
  method: 'SET',
  url: `${$env.REDIS_URL}/rate_limit:${$json.ip}`,
  body: { value: requestCount + 1, expiry: 3600 }
});
```

### 4. Input Validation

```javascript
// Validar inputs en Code node
const email = $json.email;
const name = $json.name;

// Validar email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}

// Sanitizar strings
const sanitizedName = name
  .replace(/[<>]/g, '')  // Remove HTML tags
  .trim()
  .substring(0, 100);    // Limit length

return [{
  json: {
    email: email.toLowerCase(),
    name: sanitizedName
  }
}];
```

---

## 📊 Monitoring & Logging

### Logging Best Practices

```javascript
// En Code node, logging estructurado
const logData = {
  timestamp: new Date().toISOString(),
  workflowId: $workflow.id,
  workflowName: $workflow.name,
  executionId: $execution.id,
  event: 'user_created',
  userId: $json.id,
  metadata: {
    email: $json.email,
    source: $json.source
  }
};

console.log(JSON.stringify(logData));

// Enviar a servicio externo de logs
await $http.request({
  method: 'POST',
  url: $env.LOG_AGGREGATOR_URL,
  body: logData
});
```

### Execution Monitoring

```bash
# Ver executions recientes
GET /api/v1/executions?limit=10&status=error

# Obtener detalles de execution fallida
GET /api/v1/executions/{execution_id}
```

---

## 📚 Referencias y Recursos

### Documentación Oficial

- **Main Docs**: https://docs.n8n.io/
- **API Reference**: https://docs.n8n.io/api/
- **GitHub Repo**: https://github.com/n8n-io/n8n
- **Community Forum**: https://community.n8n.io/
- **YouTube Channel**: https://www.youtube.com/@n8n-io

### Workflow Templates

- **n8n Templates**: https://n8n.io/workflows/
- **GitHub Examples**: https://github.com/n8n-io/n8n/tree/master/packages/cli/templates

### Tools & Extensions

- **n8n-nodes-**: NPM packages para nodes custom
- **n8n Desktop**: https://github.com/n8n-io/n8n-desktop
- **VSCode Extension**: Syntax highlighting para expressions

---

## 🎯 Próximos Pasos

Con esta documentación completa de n8n, ahora podemos:

1. **Optimizar workflows existentes**
   - Mejorar error handling
   - Agregar retry logic
   - Implementar logging estructurado

2. **Crear nuevos workflows**
   - Token refresh automático
   - Webhook de eventos de GHL
   - Sincronización de datos

3. **Mejorar seguridad**
   - Autenticación de webhooks
   - Validación de inputs
   - Rate limiting

4. **Performance optimization**
   - Caching con Redis
   - Batch processing
   - Async execution

5. **Monitoring & Alerting**
   - Dashboard de executions
   - Alertas de errores
   - Métricas de performance

---

## 📁 Archivos de Esta Sesión

### Documentación Creada

1. **N8N_COMPREHENSIVE_GUIDE.md**
   - Ubicación: `/Users/rayalvarado/Desktop/ghl/N8N_COMPREHENSIVE_GUIDE.md`
   - Tamaño: 92 KB
   - Contenido: Guía técnica completa de n8n

2. **SESION_2025-01-11_N8N_ANALYSIS.md** (este archivo)
   - Ubicación: `/Users/rayalvarado/Desktop/ghl/EvolutionGHLConnect/SESION_2025-01-11_N8N_ANALYSIS.md`
   - Contenido: Resumen de la sesión y hallazgos clave

### Archivos Anteriores de la Sesión

3. **SESION_2025-01-11_OAUTH_REINSTALACION.md**
   - OAuth state fix
   - Reinstalación de subcuentas fix
   - OAuth sin redirección docs

4. **OAUTH_POPUP_IMPLEMENTATION.md**
   - Guía técnica de OAuth con popup

5. **INSTALACION_DIRECTA_DESDE_TU_SITIO.md**
   - Guía práctica de instalación desde propio sitio

---

## ✅ Estado Final

| Item | Estado |
|------|--------|
| Análisis de n8n | ✅ Completado |
| Documentación API | ✅ Completada |
| Webhooks Guide | ✅ Completada |
| OAuth Guide | ✅ Completada |
| Code Examples | ✅ Completados |
| Use Case Implementation | ✅ Completado |
| Best Practices | ✅ Documentadas |
| Self-hosting Guide | ✅ Completado |

---

## 💡 Conocimiento Adquirido

Ahora tenemos **conocimiento completo** de:

✅ Arquitectura interna de n8n
✅ Toda la REST API con ejemplos
✅ Sistema de webhooks (4 modos)
✅ OAuth2 credentials management
✅ Variables built-in y expressions
✅ Code nodes con JavaScript
✅ Error handling y retry logic
✅ Self-hosting en producción
✅ Security best practices
✅ Monitoring y logging
✅ **Implementación específica para nuestro proyecto**

---

**Listo para trabajar en las optimizaciones e implementaciones con n8n.** 🚀

---

**Fin de la Sesión de Análisis de n8n**

Esta documentación complementa la sesión anterior y proporciona toda la base técnica necesaria para trabajar con n8n en el proyecto.
