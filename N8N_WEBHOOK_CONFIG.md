# Configuración N8N para OAuth de GoHighLevel

## ⚠️ IMPORTANTE: Sistema de Validación OAuth

El sistema ahora usa **validación de state en base de datos** para garantizar que las subcuentas se creen bajo la company correcta.

## Flujo OAuth Completo

### 1. Usuario Inicia OAuth (Frontend)
Cuando `bono@bono.com` presiona "Conectar con GoHighLevel":

```javascript
// Frontend llama al backend
POST /api/ghl/generate-oauth-state

// Backend genera state único y lo guarda en BD:
{
  state: "abc123def456...", // Token único de 64 caracteres
  userId: "user-uuid-123",
  companyId: "company-uuid-456",
  userEmail: "bono@bono.com",
  used: false,
  expiresAt: "2025-01-30T12:00:00Z" // 10 minutos de validez
}

// Frontend redirige a GoHighLevel con ese state
```

### 2. GoHighLevel Redirige a N8N
GoHighLevel envía a n8n:
- `code`: Código de autorización
- `state`: El token único generado (ej: "abc123def456...")
- `locationId`: ID de la location de GHL
- `companyId`: ID de la company de GHL

### 3. N8N Envía Webhook al Backend
**CRÍTICO**: N8N debe enviar el `state` parameter al webhook:

```json
POST https://whatsapp.cloude.es/api/webhooks/register-subaccount

{
  "email": "{{email_cliente}}",
  "name": "{{nombre_cliente}}",
  "phone": "{{telefono_cliente}}",
  "locationId": "{{locationid}}",
  "locationName": "{{subcuenta}}",
  "ghlCompanyId": "{{companyid}}",
  "companyName": "{{cuenta_principal}}",
  "state": "{{state}}"  // ← IMPORTANTE: Pasar el state parameter de GoHighLevel
}
```

### 4. Backend Valida y Crea Subcuenta
El backend:
1. Busca el `state` en la base de datos
2. Valida que no esté usado y no haya expirado
3. Recupera el `companyId` del usuario que inició el OAuth
4. Marca el `state` como usado
5. Crea la subcuenta bajo la company correcta

## Ejemplo Completo

### Usuario logueado:
- Email: bono@bono.com
- User ID: abc-123
- Company ID: company-456
- Company Name: "Bono Corp"

### Paso 1: Frontend genera state
```
POST /api/ghl/generate-oauth-state
Response: { "state": "7f3a2b1c..." }
```

### Paso 2: OAuth a GoHighLevel
```
https://marketplace.leadconnectorhq.com/oauth/chooselocation?
  response_type=code&
  client_id=...&
  redirect_uri=https://ray.cloude.es/webhook/registrocuenta&
  state=7f3a2b1c...
```

### Paso 3: GoHighLevel → N8N
```
https://ray.cloude.es/webhook/registrocuenta?
  code=auth_code_xyz&
  state=7f3a2b1c...&
  locationId=xyz-789&
  companyId=ghl-comp-123
```

### Paso 4: N8N → Backend Webhook
```json
POST /api/webhooks/register-subaccount
{
  "email": "ray@ramautos.do",
  "name": "Ram Mega Autos",
  "locationId": "xyz-789",
  "ghlCompanyId": "ghl-comp-123",
  "state": "7f3a2b1c..."
}
```

### Paso 5: Backend valida y crea
```
1. Busca state "7f3a2b1c..." en oauth_states table
2. Encuentra: companyId = "company-456", userId = "abc-123"
3. Marca state como usado
4. Crea subaccount bajo company-456 (Bono Corp)
```

### Resultado en DB:
```
Company: company-456 (Bono Corp)
  └── Subaccount: ram-mega-autos
        - Email: ray@ramautos.do
        - Name: Ram Mega Autos  
        - Location ID: xyz-789
        - Owner: bono@bono.com (via companyId: company-456)
```

## Configuración N8N

### Extraer State del Query String
En n8n, el `state` viene como query parameter de GoHighLevel. Debes extraerlo:

```javascript
// En el nodo HTTP Request de n8n
const state = $node["Webhook"].json.query.state;
```

### Enviar al Webhook
Asegúrate de incluir el `state` en el body del webhook:

```json
{
  "email": "{{ $json.email_cliente }}",
  "name": "{{ $json.nombre_cliente }}",
  "phone": "{{ $json.telefono_cliente }}",
  "locationId": "{{ $json.locationid }}",
  "locationName": "{{ $json.subcuenta }}",
  "ghlCompanyId": "{{ $json.companyid }}",
  "companyName": "{{ $json.cuenta_principal }}",
  "state": "{{ $node['Webhook'].json.query.state }}"
}
```

## Seguridad

1. **State Expiration**: Los states expiran en 10 minutos
2. **Single Use**: Cada state solo puede usarse una vez
3. **Database Validation**: No se puede falsificar el state
4. **User Association**: El state está cryptográficamente vinculado al usuario

## Endpoints Disponibles

### POST /api/ghl/generate-oauth-state (Autenticado)
Genera un state único para el usuario logueado.

Response:
```json
{
  "state": "7f3a2b1c4d5e6f..."
}
```

### POST /api/webhooks/register-subaccount (Público - validado por state)
Crea subcuenta con validación de state.

Required fields:
- `email`
- `name`
- `locationId`
- `ghlCompanyId`
- `state` (para validación OAuth)

## Debugging

Si las subcuentas se crean en la company incorrecta, verifica en los logs:

```bash
🔐 Validating OAuth state: 7f3a2b1c...
✅ OAuth state validated for user: bono@bono.com (company: company-456)
✅ Using owner's company: Bono Corp (company-456)
```

Si no ves estos logs, n8n no está enviando el `state` parameter.
