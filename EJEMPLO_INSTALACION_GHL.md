# Ejemplo de Instalación de Aplicación GoHighLevel

## 📋 Resumen del Flujo

Cuando un cliente instala la aplicación de GoHighLevel desde el marketplace, se ejecuta el siguiente flujo automático:

```
Cliente GHL → OAuth GoHighLevel → N8N Webhook → Backend API → Creación Automática
```

---

## 🔄 Flujo Detallado Paso a Paso

### **PASO 1: Cliente Instala la App en GoHighLevel**

Un cliente busca tu aplicación en el marketplace de GoHighLevel y hace click en "Instalar".

GoHighLevel redirige al usuario a tu URL de OAuth con los siguientes parámetros:
```
https://oauth.cloude.es/ghl/authorize?
  code=abc123xyz...
  &companyId=ghl_company_123
  &locationId=ghl_location_456
```

---

### **PASO 2: N8N Recibe el Callback de OAuth**

Tu flujo de N8N intercepta el callback y:

1. **Intercambia el código por un Access Token**
   ```json
   POST https://services.leadconnectorhq.com/oauth/token
   {
     "client_id": "tu_client_id",
     "client_secret": "tu_client_secret",
     "grant_type": "authorization_code",
     "code": "abc123xyz...",
     "redirect_uri": "https://tu-n8n.com/webhook/oauth"
   }
   ```

2. **Obtiene datos del cliente desde GHL API**
   ```json
   GET https://services.leadconnectorhq.com/locations/{locationId}
   Headers: Authorization: Bearer {access_token}
   
   Response:
   {
     "location": {
       "id": "ghl_location_456",
       "name": "Miami Fitness Center",
       "email": "info@miamifitness.com",
       "phone": "+1-305-555-1234",
       "companyId": "ghl_company_123"
     }
   }
   ```

3. **Guarda el Access Token en la Base de Datos GHL**
   ```sql
   INSERT INTO ghl_clientes (
     locationid,
     companyid,
     email_cliente,
     nombre_cliente,
     telefono_cliente,
     cuenta_principal,
     subcuenta,
     access_token,
     refresh_token,
     token_type
   ) VALUES (
     'ghl_location_456',
     'ghl_company_123',
     'info@miamifitness.com',
     'John Smith',
     '+1-305-555-1234',
     'Miami Fitness Group',
     'Miami Fitness Center',
     'ghl_access_token_xyz...',
     'ghl_refresh_token_abc...',
     'Bearer'
   );
   ```

---

### **PASO 3: N8N Envía Webhook a tu Backend**

N8N envía un POST request a tu API:

```http
POST https://whatsapp.cloude.es/api/webhooks/register-subaccount
Content-Type: application/json

{
  "email": "info@miamifitness.com",
  "name": "John Smith",
  "phone": "+1-305-555-1234",
  "locationId": "ghl_location_456",
  "locationName": "Miami Fitness Center",
  "ghlCompanyId": "ghl_company_123",
  "companyName": "Miami Fitness Group",
  "state": "oauth_state_optional_xyz123"
}
```

**Campos aceptados** (el webhook acepta ambos formatos):

| Campo Normalizado | Campo Alternativo (DB GHL) | Descripción |
|-------------------|----------------------------|-------------|
| `email` | `email_cliente` | Email del cliente |
| `name` | `nombre_cliente` | Nombre del cliente |
| `phone` | `telefono_cliente` | Teléfono (opcional) |
| `locationId` | `locationid` | ID de la ubicación GHL |
| `locationName` | `subcuenta` | Nombre de la subcuenta |
| `ghlCompanyId` | `companyid` | ID de la empresa en GHL |
| `companyName` | `cuenta_principal` | Nombre de la empresa |
| `state` | - | OAuth state (opcional) |

---

### **PASO 4: Backend Procesa el Webhook**

El backend ejecuta la siguiente lógica:

#### **4.1 - Normalización de Datos**
```typescript
const normalizedData = {
  email: req.body.email || req.body.email_cliente,
  name: req.body.name || req.body.nombre_cliente,
  locationId: req.body.locationId || req.body.locationid,
  ghlCompanyId: req.body.ghlCompanyId || req.body.companyid,
  companyName: req.body.companyName || req.body.cuenta_principal,
  locationName: req.body.locationName || req.body.subcuenta,
  phone: req.body.phone || req.body.telefono_cliente,
  state: req.body.state
};
```

#### **4.2 - Validación de Datos**
```typescript
const webhookSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  locationId: z.string().min(1, "Location ID es requerido"),
  ghlCompanyId: z.string().min(1, "Company ID es requerido"),
  companyName: z.string().optional(),
  locationName: z.string().optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
});

const validatedData = webhookSchema.parse(normalizedData);
```

#### **4.3 - Validación de OAuth State (Opcional)**

**Escenario A: CON OAuth State Validado**
```typescript
if (validatedData.state) {
  const oauthState = await storage.getOAuthState(validatedData.state);
  
  // Validaciones:
  // - Estado existe
  // - No ha sido usado antes
  // - No ha expirado (30 minutos)
  
  if (oauthState.valid) {
    // El usuario que instaló la app está autenticado
    ownerCompanyId = oauthState.companyId;
    ownerUserId = oauthState.userId;
    ownerEmail = oauthState.userEmail;
    
    // Marcar state como usado
    await storage.markOAuthStateAsUsed(validatedData.state);
  }
}
```

**Escenario B: SIN OAuth State (Instalación Directa)**
```typescript
// No hay state - la subcuenta será "pending claim"
companyId = 'PENDING_CLAIM';
```

#### **4.4 - Verificar si la Subcuenta Ya Existe**
```typescript
let subaccount = await storage.getSubaccountByLocationId(validatedData.locationId);

if (subaccount) {
  console.log('✅ Subaccount already exists');
  return res.json({ 
    success: true, 
    message: "Subaccount already exists"
  });
}
```

#### **4.5 - Crear la Subcuenta**

**Caso 1: Con Owner Validado (OAuth State Presente)**
```typescript
subaccount = await storage.createSubaccount({
  email: "info@miamifitness.com",
  name: "John Smith",
  phone: "+1-305-555-1234",
  locationId: "ghl_location_456",
  locationName: "Miami Fitness Center",
  ghlCompanyId: "ghl_company_123",
  companyId: "uuid-de-la-empresa-del-owner",  // ✅ Asociada a empresa existente
  role: "user",
  isActive: true,
  billingEnabled: true,
  manuallyActivated: false,
  passwordHash: null,
  googleId: null,
});
```

**Caso 2: Sin Owner (Instalación Directa) - PENDING CLAIM**
```typescript
subaccount = await storage.createSubaccount({
  email: "info@miamifitness.com",
  name: "John Smith",
  phone: "+1-305-555-1234",
  locationId: "ghl_location_456",
  locationName: "Miami Fitness Center",
  ghlCompanyId: "ghl_company_123",
  companyId: "PENDING_CLAIM",  // ⚠️ Esperando que un usuario la reclame
  role: "user",
  isActive: true,
  billingEnabled: true,
  manuallyActivated: false,
  passwordHash: null,
  googleId: null,
});
```

#### **4.6 - Crear Suscripción con 15 Días de Prueba**
```typescript
await storage.createSubscription(subaccount.id, 15);
// Plan: "Starter"
// Días de prueba: 15
// maxSubaccounts: "1"
```

#### **4.7 - Crear Instancia de WhatsApp (Solo si hay Owner)**

**Si hay Owner Validado:**
```typescript
// Generar nombre único para Evolution API
const existingInstances = await storage.getWhatsappInstancesByLocationId(
  validatedData.locationId
);
const instanceNumber = existingInstances.length + 1;
const evolutionName = `${validatedData.locationId}_${instanceNumber}`;
// Resultado: "ghl_location_456_1"

const instance = await storage.createWhatsappInstance({
  subaccountId: subaccount.id,
  locationId: validatedData.locationId,
  evolutionInstanceName: evolutionName,
  customName: "WhatsApp Miami Fitness Center",
});

console.log('✅ WhatsApp instance created automatically');
```

**Si NO hay Owner (Pending Claim):**
```typescript
console.log('⚠️ Instance creation skipped - user must claim subaccount first');
// La instancia se creará DESPUÉS cuando el usuario reclame la subcuenta
```

---

### **PASO 5: N8N Redirige al Usuario**

**Escenario A: Con OAuth State (Usuario Autenticado)**
```http
HTTP 302 Found
Location: https://whatsapp.cloude.es/dashboard
```
El usuario va directo a su dashboard y ve la nueva subcuenta.

**Escenario B: Sin OAuth State (Instalación Directa)**
```http
HTTP 302 Found
Location: https://whatsapp.cloude.es/claim-subaccount?locationId=ghl_location_456
```
El usuario debe registrarse/iniciar sesión y reclamar la subcuenta.

---

## 🎯 Resultados en la Base de Datos

### **Tabla: companies**
```sql
id                  | name                     | email                  | is_active
--------------------|--------------------------|-----------------------|-----------
PENDING_CLAIM       | Pending Claim Company    | pending@system.local  | true
uuid-empresa-123    | Miami Fitness Group      | john@owner.com        | true
```

### **Tabla: subaccounts**

**Con Owner Validado:**
```sql
id              | company_id        | email                  | name       | location_id      | role | is_active
----------------|-------------------|------------------------|------------|------------------|------|----------
uuid-sub-456    | uuid-empresa-123  | info@miamifitness.com | John Smith | ghl_location_456 | user | true
```

**Pending Claim:**
```sql
id              | company_id    | email                  | name       | location_id      | role | is_active
----------------|---------------|------------------------|------------|------------------|------|----------
uuid-sub-789    | PENDING_CLAIM | info@miamifitness.com | John Smith | ghl_location_456 | user | true
```

### **Tabla: subscriptions**
```sql
id           | subaccount_id | plan    | trial_ends_at           | is_active | max_subaccounts
-------------|---------------|---------|-------------------------|-----------|----------------
uuid-subs-1  | uuid-sub-456  | Starter | 2025-11-16 00:00:00     | true      | 1
```

### **Tabla: whatsapp_instances** (Solo si hay Owner)
```sql
id            | subaccount_id | location_id      | evolution_instance_name | custom_name                  | status
--------------|---------------|------------------|-------------------------|------------------------------|------------
uuid-inst-1   | uuid-sub-456  | ghl_location_456 | ghl_location_456_1      | WhatsApp Miami Fitness Center| disconnected
```

---

## 📊 Flujo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                   INSTALACIÓN DESDE GHL MARKETPLACE              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Cliente hace    │
                    │  click "Install" │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ GoHighLevel OAuth│
                    │ Redirect → N8N   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ N8N intercambia  │
                    │ code por tokens  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ N8N obtiene datos│
                    │ de GHL API       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ N8N guarda tokens│
                    │ en DB externa    │
                    └──────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │ N8N envía webhook a backend             │
        │ POST /api/webhooks/register-subaccount  │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │        Backend procesa webhook          │
        ├─────────────────────────────────────────┤
        │ 1. Normaliza datos                      │
        │ 2. Valida schema                        │
        │ 3. Verifica OAuth state (opcional)      │
        │ 4. Determina companyId                  │
        │ 5. Crea/actualiza subaccount            │
        │ 6. Crea subscription (15 días trial)    │
        │ 7. Crea WhatsApp instance (si hay owner)│
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
      ┌──────────────────┐       ┌──────────────────┐
      │ CON OAuth State  │       │ SIN OAuth State  │
      ├──────────────────┤       ├──────────────────┤
      │ • Owner validado │       │ • PENDING_CLAIM  │
      │ • Asocia empresa │       │ • Requiere claim │
      │ • Crea instancia │       │ • No crea inst.  │
      │ • Redirect: /    │       │ • Redirect:      │
      │   dashboard      │       │   /claim-sub...  │
      └──────────────────┘       └──────────────────┘
```

---

## 🔧 Configuración Necesaria en N8N

### **Nodo 1: Webhook Trigger**
```
URL: https://tu-n8n.com/webhook/ghl-oauth-callback
Method: GET
```

### **Nodo 2: HTTP Request - Exchange Code for Token**
```
Method: POST
URL: https://services.leadconnectorhq.com/oauth/token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  client_id: {{$env.GHL_CLIENT_ID}}
  client_secret: {{$env.GHL_CLIENT_SECRET}}
  grant_type: authorization_code
  code: {{$json.code}}
  redirect_uri: {{$env.GHL_REDIRECT_URI}}
```

### **Nodo 3: HTTP Request - Get Location Data**
```
Method: GET
URL: https://services.leadconnectorhq.com/locations/{{$json.locationId}}
Headers:
  Authorization: Bearer {{$node["Exchange Token"].json.access_token}}
  Version: 2021-07-28
```

### **Nodo 4: PostgreSQL - Save Tokens**
```sql
INSERT INTO ghl_clientes (
  locationid,
  companyid,
  email_cliente,
  nombre_cliente,
  telefono_cliente,
  cuenta_principal,
  subcuenta,
  access_token,
  refresh_token,
  token_type
) VALUES (
  '{{$json.location.id}}',
  '{{$json.location.companyId}}',
  '{{$json.location.email}}',
  '{{$json.location.contactName}}',
  '{{$json.location.phone}}',
  '{{$json.location.companyName}}',
  '{{$json.location.name}}',
  '{{$node["Exchange Token"].json.access_token}}',
  '{{$node["Exchange Token"].json.refresh_token}}',
  '{{$node["Exchange Token"].json.token_type}}'
)
ON CONFLICT (locationid) 
DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token;
```

### **Nodo 5: HTTP Request - Notify Backend**
```
Method: POST
URL: https://whatsapp.cloude.es/api/webhooks/register-subaccount
Headers:
  Content-Type: application/json
Body:
{
  "email": "{{$json.location.email}}",
  "name": "{{$json.location.contactName}}",
  "phone": "{{$json.location.phone}}",
  "locationId": "{{$json.location.id}}",
  "locationName": "{{$json.location.name}}",
  "ghlCompanyId": "{{$json.location.companyId}}",
  "companyName": "{{$json.location.companyName}}"
}
```

### **Nodo 6: Respond to Webhook (Redirect)**
```
Response Code: 302
Headers:
  Location: https://whatsapp.cloude.es/claim-subaccount?locationId={{$json.locationId}}
```

---

## 🚨 Casos de Uso

### **Caso 1: Usuario Registrado Instala App**
```
1. Usuario ya tiene cuenta: john@owner.com
2. Usuario hace OAuth desde su dashboard
3. OAuth state incluye su companyId
4. N8N envía webhook con state
5. Backend valida state y asocia subcuenta a su empresa
6. Backend crea instancia de WhatsApp automáticamente
7. Usuario ve nueva subcuenta en su dashboard
```

### **Caso 2: Nuevo Usuario Instala App**
```
1. Usuario no tiene cuenta en tu plataforma
2. Usuario instala desde GHL marketplace (sin OAuth state)
3. N8N envía webhook sin state
4. Backend crea subcuenta con companyId = PENDING_CLAIM
5. Backend NO crea instancia de WhatsApp
6. N8N redirige a: /claim-subaccount?locationId=...
7. Usuario se registra/inicia sesión
8. Usuario reclama la subcuenta (POST /api/subaccounts/claim)
9. Backend asocia subcuenta a su empresa
10. Backend crea instancia de WhatsApp
11. Usuario ve subcuenta en su dashboard
```

---

## ✅ Verificación

Para verificar que la instalación fue exitosa:

```bash
# 1. Verificar que la subcuenta existe
curl -X GET "https://whatsapp.cloude.es/api/admin/users" \
  -H "Cookie: connect.sid=..." \
  | jq '.[] | select(.locationId == "ghl_location_456")'

# 2. Verificar suscripción
curl -X GET "https://whatsapp.cloude.es/api/subscriptions/{subaccountId}" \
  -H "Cookie: connect.sid=..."

# 3. Verificar instancia de WhatsApp
curl -X GET "https://whatsapp.cloude.es/api/instances/subaccount/{subaccountId}" \
  -H "Cookie: connect.sid=..."
```

---

## 📝 Notas Importantes

1. **Seguridad**: El OAuth state tiene una validez de 30 minutos
2. **Idempotencia**: Si la subcuenta ya existe, el webhook responde con éxito sin crear duplicados
3. **Trial Automático**: Todas las nuevas subcuentas reciben 15 días de prueba gratuita
4. **Naming Convention**: Las instancias se nombran `{locationId}_{número_secuencial}`
5. **Pending Claim**: Las subcuentas sin owner tienen una ventana de 10 minutos para ser reclamadas
