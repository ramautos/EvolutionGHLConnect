# n8n - Flujo Automático de Refresh Token para GoHighLevel

## 🎯 Objetivo

Crear un flujo en n8n que:
1. Verifique tokens que están por expirar
2. Los refresque automáticamente
3. Actualice la base de datos PostgreSQL
4. Se ejecute cada hora automáticamente

---

## 📋 Prerequisitos

### En n8n necesitas:
- ✅ Credencial de PostgreSQL configurada
- ✅ Credencial de HTTP Request (opcional)
- ✅ Las tablas de PostgreSQL creadas (ver [REFRESH-TOKEN-IMPLEMENTATION.md](REFRESH-TOKEN-IMPLEMENTATION.md))

### Variables de Entorno en n8n:
```
GHL_CLIENT_ID = tu_client_id
GHL_CLIENT_SECRET = tu_client_secret
```

---

## 🔧 Flujo 1: Refresh Automático (Cron)

Este flujo se ejecuta cada hora y refresca tokens que están por expirar.

### Estructura del Flujo:

```
┌─────────────────┐
│  1. Schedule    │  → Cada 1 hora
│  (Cron Trigger) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  2. PostgreSQL  │  → Buscar tokens que expiran en < 2 horas
│  (Query)        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  3. IF Node     │  → ¿Hay tokens para refrescar?
└────────┬────────┘
         │
    YES  │  NO → END
         ↓
┌─────────────────┐
│  4. Loop Over   │  → Para cada instalación
│  Items          │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  5. HTTP        │  → Llamar a OAuth Token Endpoint
│  Request        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  6. PostgreSQL  │  → Actualizar tokens en DB
│  (Update)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  7. Log         │  → Registrar refresh exitoso
│  (PostgreSQL)   │
└─────────────────┘
```

---

## 📝 Configuración de Nodos

### 1️⃣ Schedule Trigger (Cron)

**Tipo:** Schedule Trigger

**Configuración:**
```json
{
  "rule": {
    "interval": [
      {
        "field": "hours",
        "hoursInterval": 1
      }
    ]
  }
}
```

**Expresión Cron:** `0 * * * *` (cada hora en punto)

---

### 2️⃣ PostgreSQL - Buscar Tokens por Expirar

**Tipo:** Postgres

**Operación:** Execute Query

**Query:**
```sql
SELECT
    id,
    location_id,
    company_id,
    access_token,
    refresh_token,
    expires_at,
    user_type,
    scopes
FROM ghl_installations
WHERE
    is_active = true
    AND expires_at < NOW() + INTERVAL '2 hours'
    AND expires_at > NOW()
ORDER BY expires_at ASC;
```

**Explicación:**
- Busca tokens activos
- Que expiran en menos de 2 horas
- Pero que todavía no han expirado

---

### 3️⃣ IF Node - Verificar si Hay Tokens

**Tipo:** IF

**Condiciones:**
```json
{
  "conditions": {
    "number": [
      {
        "value1": "={{ $json.length }}",
        "operation": "larger",
        "value2": 0
      }
    ]
  }
}
```

**Lógica:** Si hay al menos 1 token para refrescar, continuar.

---

### 4️⃣ Split In Batches - Loop Sobre Items

**Tipo:** Split In Batches

**Configuración:**
```json
{
  "batchSize": 1,
  "options": {}
}
```

**Nota:** Procesa un token a la vez para evitar race conditions.

---

### 5️⃣ HTTP Request - Refresh Token

**Tipo:** HTTP Request

**Configuración:**

**Method:** POST

**URL:** `https://services.leadconnectorhq.com/oauth/token`

**Authentication:** None (usamos headers)

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "={{ $json.refresh_token }}",
  "client_id": "={{ $env.GHL_CLIENT_ID }}",
  "client_secret": "={{ $env.GHL_CLIENT_SECRET }}",
  "user_type": "={{ $json.user_type || 'Company' }}"
}
```

**Response:**
```json
{
  "access_token": "nuevo_access_token",
  "refresh_token": "nuevo_refresh_token",
  "expires_in": 86399,
  "token_type": "Bearer",
  "scope": "scopes...",
  "userType": "Location",
  "locationId": "...",
  "companyId": "..."
}
```

---

### 6️⃣ Function - Calcular Nueva Fecha de Expiración

**Tipo:** Function

**Código JavaScript:**
```javascript
// Obtener datos del refresh anterior
const previousData = $input.first().json;
const refreshResponse = $input.last().json;

// Calcular nueva fecha de expiración
const expiresIn = refreshResponse.expires_in || 86399; // segundos
const newExpiresAt = new Date(Date.now() + (expiresIn * 1000));

// Preparar datos para actualizar
return {
  json: {
    installation_id: previousData.id,
    location_id: previousData.location_id,
    old_access_token: previousData.access_token,
    old_refresh_token: previousData.refresh_token,
    old_expires_at: previousData.expires_at,
    new_access_token: refreshResponse.access_token,
    new_refresh_token: refreshResponse.refresh_token,
    new_expires_at: newExpiresAt.toISOString(),
    expires_in: expiresIn
  }
};
```

---

### 7️⃣ PostgreSQL - Actualizar Tokens

**Tipo:** Postgres

**Operación:** Execute Query

**Query:**
```sql
UPDATE ghl_installations
SET
    access_token = $1,
    refresh_token = $2,
    expires_at = $3,
    last_token_refresh = NOW(),
    updated_at = NOW()
WHERE id = $4
RETURNING *;
```

**Parameters:**
```json
{
  "parameters": [
    "={{ $json.new_access_token }}",
    "={{ $json.new_refresh_token }}",
    "={{ $json.new_expires_at }}",
    "={{ $json.installation_id }}"
  ]
}
```

---

### 8️⃣ PostgreSQL - Registrar en Log

**Tipo:** Postgres

**Operación:** Execute Query

**Query:**
```sql
INSERT INTO ghl_token_refresh_log (
    installation_id,
    location_id,
    success,
    old_expires_at,
    new_expires_at
)
VALUES ($1, $2, true, $3, $4);
```

**Parameters:**
```json
{
  "parameters": [
    "={{ $json.installation_id }}",
    "={{ $json.location_id }}",
    "={{ $json.old_expires_at }}",
    "={{ $json.new_expires_at }}"
  ]
}
```

---

## 🔧 Flujo 2: Refresh Manual (Webhook)

Este flujo permite refrescar un token específico bajo demanda.

### Estructura del Flujo:

```
┌─────────────────┐
│  1. Webhook     │  → POST /refresh-token/:locationId
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  2. PostgreSQL  │  → Obtener instalación
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  3. IF Node     │  → ¿Existe instalación?
└────────┬────────┘
         │
    YES  │  NO → Return Error
         ↓
┌─────────────────┐
│  4. HTTP        │  → Refresh token
│  Request        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  5. Function    │  → Preparar datos
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  6. PostgreSQL  │  → Actualizar DB
│  (Update)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  7. Respond     │  → Retornar success
│  to Webhook     │
└─────────────────┘
```

---

### Nodos del Flujo Manual:

### 1️⃣ Webhook Trigger

**Tipo:** Webhook

**Path:** `/refresh-token/:locationId`

**Method:** POST

**Response Mode:** Last Node

---

### 2️⃣ PostgreSQL - Obtener Instalación

**Tipo:** Postgres

**Query:**
```sql
SELECT
    id,
    location_id,
    company_id,
    access_token,
    refresh_token,
    expires_at,
    user_type
FROM ghl_installations
WHERE
    location_id = $1
    AND is_active = true
LIMIT 1;
```

**Parameters:**
```json
{
  "parameters": [
    "={{ $json.params.locationId }}"
  ]
}
```

---

### 3️⃣ IF Node - Verificar Existencia

**Condiciones:**
```json
{
  "conditions": {
    "boolean": [
      {
        "value1": "={{ $json.id !== undefined }}",
        "operation": "equal",
        "value2": true
      }
    ]
  }
}
```

---

### 4️⃣ Respond to Webhook (Error)

**En la rama FALSE del IF:**

**Tipo:** Respond to Webhook

**Response Code:** 404

**Response Body:**
```json
{
  "success": false,
  "error": "Installation not found for location: {{ $json.params.locationId }}"
}
```

---

### 5️⃣ HTTP Request - Refresh

**(Mismo que en el flujo automático - ver nodo 5️⃣ del Flujo 1)**

---

### 6️⃣ Function - Preparar Datos

**(Mismo que en el flujo automático - ver nodo 6️⃣ del Flujo 1)**

---

### 7️⃣ PostgreSQL - Actualizar

**(Mismo que en el flujo automático - ver nodo 7️⃣ del Flujo 1)**

---

### 8️⃣ Respond to Webhook (Success)

**Tipo:** Respond to Webhook

**Response Code:** 200

**Response Body:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "location_id": "={{ $json.location_id }}",
    "old_expires_at": "={{ $json.old_expires_at }}",
    "new_expires_at": "={{ $json.new_expires_at }}",
    "refreshed_at": "={{ new Date().toISOString() }}"
  }
}
```

---

## 🔧 Flujo 3: Guardar Token Inicial (Al Instalar)

Para guardar los tokens cuando un usuario instala tu app.

### Estructura:

```
┌─────────────────┐
│  1. Webhook     │  → GET /oauth/callback?code=xxx
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  2. HTTP        │  → Exchange code for tokens
│  Request        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  3. Function    │  → Preparar datos
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  4. PostgreSQL  │  → Guardar tokens (INSERT/UPDATE)
│  (Upsert)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  5. Respond     │  → Retornar success
│  to Webhook     │
└─────────────────┘
```

---

### Nodos del Flujo de Instalación:

### 1️⃣ Webhook - OAuth Callback

**Path:** `/oauth/callback`

**Method:** GET

**Query Parameters:**
- `code` (required)

---

### 2️⃣ HTTP Request - Exchange Code

**Method:** POST

**URL:** `https://services.leadconnectorhq.com/oauth/token`

**Body:**
```json
{
  "client_id": "={{ $env.GHL_CLIENT_ID }}",
  "client_secret": "={{ $env.GHL_CLIENT_SECRET }}",
  "grant_type": "authorization_code",
  "code": "={{ $json.query.code }}",
  "user_type": "Company",
  "redirect_uri": "{{ $env.GHL_REDIRECT_URI }}"
}
```

---

### 3️⃣ Function - Calcular Expiración

```javascript
const tokenData = $input.first().json;

// Calcular fecha de expiración
const expiresIn = tokenData.expires_in || 86399;
const expiresAt = new Date(Date.now() + (expiresIn * 1000));

return {
  json: {
    location_id: tokenData.locationId,
    company_id: tokenData.companyId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: expiresAt.toISOString(),
    user_type: tokenData.userType,
    scopes: tokenData.scope,
    token_type: tokenData.token_type || 'Bearer'
  }
};
```

---

### 4️⃣ PostgreSQL - Upsert Tokens

**Query:**
```sql
INSERT INTO ghl_installations (
    location_id,
    company_id,
    access_token,
    refresh_token,
    expires_at,
    user_type,
    scopes,
    token_type,
    installed_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
ON CONFLICT (location_id)
DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW()
RETURNING *;
```

**Parameters:**
```json
{
  "parameters": [
    "={{ $json.location_id }}",
    "={{ $json.company_id }}",
    "={{ $json.access_token }}",
    "={{ $json.refresh_token }}",
    "={{ $json.expires_at }}",
    "={{ $json.user_type }}",
    "={{ $json.scopes }}",
    "={{ $json.token_type }}"
  ]
}
```

---

### 5️⃣ Respond to Webhook

**Response:**
```json
{
  "success": true,
  "message": "App installed successfully",
  "data": {
    "location_id": "={{ $json.location_id }}",
    "company_id": "={{ $json.company_id }}",
    "expires_at": "={{ $json.expires_at }}",
    "installed_at": "={{ new Date().toISOString() }}"
  }
}
```

---

## 🔧 Flujo 4: Obtener Token Válido (Helper)

Flujo reutilizable para obtener un token válido (refresca si es necesario).

### Webhook:

**Path:** `/get-valid-token/:locationId`

**Method:** GET

### Estructura:

```
Webhook → PostgreSQL Query → IF (expira pronto?) →
  YES → Refresh → Update → Return
  NO → Return token existente
```

---

## 📦 JSON del Workflow Completo para Importar

```json
{
  "name": "GHL Token Auto-Refresh",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT id, location_id, company_id, access_token, refresh_token, expires_at, user_type FROM ghl_installations WHERE is_active = true AND expires_at < NOW() + INTERVAL '2 hours' AND expires_at > NOW() ORDER BY expires_at ASC;",
        "options": {}
      },
      "name": "PostgreSQL - Find Expiring Tokens",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "postgres": {
          "id": "YOUR_POSTGRES_CREDENTIAL_ID",
          "name": "PostgreSQL account"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.length }}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      },
      "name": "IF - Has Tokens?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {}
      },
      "name": "Split In Batches",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 1,
      "position": [850, 200]
    },
    {
      "parameters": {
        "url": "https://services.leadconnectorhq.com/oauth/token",
        "authentication": "none",
        "requestMethod": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "={\n  \"grant_type\": \"refresh_token\",\n  \"refresh_token\": \"{{ $json.refresh_token }}\",\n  \"client_id\": \"{{ $env.GHL_CLIENT_ID }}\",\n  \"client_secret\": \"{{ $env.GHL_CLIENT_SECRET }}\",\n  \"user_type\": \"{{ $json.user_type || 'Company' }}\"\n}"
      },
      "name": "HTTP - Refresh Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [1050, 200]
    },
    {
      "parameters": {
        "functionCode": "const previousData = $input.first().json;\nconst refreshResponse = $input.last().json;\n\nconst expiresIn = refreshResponse.expires_in || 86399;\nconst newExpiresAt = new Date(Date.now() + (expiresIn * 1000));\n\nreturn {\n  json: {\n    installation_id: previousData.id,\n    location_id: previousData.location_id,\n    new_access_token: refreshResponse.access_token,\n    new_refresh_token: refreshResponse.refresh_token,\n    new_expires_at: newExpiresAt.toISOString(),\n    old_expires_at: previousData.expires_at\n  }\n};"
      },
      "name": "Function - Prepare Update",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1250, 200]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "=UPDATE ghl_installations SET access_token = '{{ $json.new_access_token }}', refresh_token = '{{ $json.new_refresh_token }}', expires_at = '{{ $json.new_expires_at }}', last_token_refresh = NOW(), updated_at = NOW() WHERE id = {{ $json.installation_id }} RETURNING *;",
        "options": {}
      },
      "name": "PostgreSQL - Update Tokens",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [1450, 200],
      "credentials": {
        "postgres": {
          "id": "YOUR_POSTGRES_CREDENTIAL_ID",
          "name": "PostgreSQL account"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "=INSERT INTO ghl_token_refresh_log (installation_id, location_id, success, old_expires_at, new_expires_at) VALUES ({{ $json.installation_id }}, '{{ $json.location_id }}', true, '{{ $json.old_expires_at }}', '{{ $json.new_expires_at }}');",
        "options": {}
      },
      "name": "PostgreSQL - Log Refresh",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [1650, 200],
      "credentials": {
        "postgres": {
          "id": "YOUR_POSTGRES_CREDENTIAL_ID",
          "name": "PostgreSQL account"
        }
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "PostgreSQL - Find Expiring Tokens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "PostgreSQL - Find Expiring Tokens": {
      "main": [
        [
          {
            "node": "IF - Has Tokens?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IF - Has Tokens?": {
      "main": [
        [
          {
            "node": "Split In Batches",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split In Batches": {
      "main": [
        [
          {
            "node": "HTTP - Refresh Token",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP - Refresh Token": {
      "main": [
        [
          {
            "node": "Function - Prepare Update",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Function - Prepare Update": {
      "main": [
        [
          {
            "node": "PostgreSQL - Update Tokens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "PostgreSQL - Update Tokens": {
      "main": [
        [
          {
            "node": "PostgreSQL - Log Refresh",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "PostgreSQL - Log Refresh": {
      "main": [
        [
          {
            "node": "Split In Batches",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

## 🎯 Resumen de los 4 Flujos

| Flujo | Trigger | Propósito |
|-------|---------|-----------|
| **1. Auto-Refresh** | Cron (cada hora) | Refresca tokens que expiran pronto |
| **2. Manual Refresh** | Webhook POST | Refresca un token específico bajo demanda |
| **3. Save Initial** | Webhook GET (OAuth callback) | Guarda tokens al instalar app |
| **4. Get Valid Token** | Webhook GET | Obtiene token válido (helper) |

---

## 📊 Monitoreo

### Query para Ver Estado de Tokens:

```sql
SELECT
    location_id,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW()))/3600 as hours_until_expiry,
    last_token_refresh,
    is_active
FROM ghl_installations
ORDER BY expires_at ASC;
```

### Query para Ver Historial de Refreshes:

```sql
SELECT
    l.location_id,
    l.success,
    l.old_expires_at,
    l.new_expires_at,
    l.refreshed_at,
    l.error_message
FROM ghl_token_refresh_log l
ORDER BY l.refreshed_at DESC
LIMIT 50;
```

---

## 🚀 Pasos para Implementar

1. **Importar workflows** a n8n
2. **Configurar credenciales** de PostgreSQL
3. **Agregar variables de entorno** (GHL_CLIENT_ID, GHL_CLIENT_SECRET)
4. **Activar el flujo automático** (Cron)
5. **Probar el flujo manual** con Postman/cURL
6. **Monitorear logs** en PostgreSQL

---

## 🔗 Recursos Adicionales

- [Documentación n8n](https://docs.n8n.io)
- [PostgreSQL Nodes](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres/)
- [HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)

---

**¿Necesitas ayuda para configurar algún nodo específico?** 🚀
