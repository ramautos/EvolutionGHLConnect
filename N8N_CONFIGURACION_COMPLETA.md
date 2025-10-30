# Configuración Completa N8N - WhatsApp Backend

## 1️⃣ HTTP Request - Enviar Datos al Backend de WhatsApp

### Configuración del Nodo HTTP Request

**Method:** POST

**URL:** `https://whatsapp.cloude.es/api/webhooks/register-subaccount`

**Authentication:** None

**Send Body:** YES (activado)

**Body Content Type:** JSON

**Specify Body:** Using Fields Below

### Body Parameters (7 campos):

| Name | Value (Expression) |
|------|-------------------|
| email | `{{ $json.location.email }}` |
| name | `{{ $json.location.name }}` |
| phone | `{{ $json.location.phone }}` |
| locationId | `{{ $json.location.id }}` |
| ghlCompanyId | `{{ $json.location.companyId }}` |
| locationName | `{{ $json.location.name }}` |
| companyName | `{{ $json.company.name }}` |

---

## 📝 Curl Equivalente (para pruebas)

```bash
curl -X POST https://whatsapp.cloude.es/api/webhooks/register-subaccount \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@ejemplo.com",
    "name": "Nombre del Cliente",
    "phone": "+1234567890",
    "locationId": "jtEqGdhkoR6iePmZaCmd",
    "ghlCompanyId": "ghl_company_123",
    "locationName": "Mi Subcuenta GHL",
    "companyName": "Mi Empresa GHL"
  }'
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Subaccount created - pending claim",
  "subaccount": {
    "id": "uuid-aqui",
    "email": "cliente@ejemplo.com",
    "name": "Nombre del Cliente",
    "locationId": "jtEqGdhkoR6iePmZaCmd",
    "companyId": "PENDING_CLAIM"
  }
}
```

---

## 2️⃣ Respond to Webhook - Redirección 302

### Configuración del Nodo "Respond to Webhook"

**IMPORTANTE:** Este nodo DEBE ir **DESPUÉS** del HTTP Request al backend de WhatsApp.

**Respond With:** First Incoming Item

**Response Code:** 302

**Response Headers:**

| Name | Value |
|------|-------|
| Location | `https://whatsapp.cloude.es/claim-subaccount?locationId={{ $json.location.id }}` |

---

## 🔄 Flujo Completo N8N (Orden de Nodos)

```
1. [Webhook] - Trigger
   ↓
2. [Function/Code] - Extraer el 'code' del query string
   ↓
3. [HTTP Request] - Intercambiar code por access_token
   POST https://services.leadconnectorhq.com/oauth/token
   ↓
4. [HTTP Request] - Obtener datos de la location
   GET https://services.leadconnectorhq.com/locations/{{locationId}}
   (Guardar respuesta en $json.location)
   ↓
5. [PostgreSQL] - Guardar token en tu DB de GHL (opcional)
   ↓
6. [HTTP Request] - Enviar webhook al backend de WhatsApp
   POST https://whatsapp.cloude.es/api/webhooks/register-subaccount
   Body: Los 7 campos mencionados arriba
   ↓
7. [Respond to Webhook] - Redirigir al usuario
   302 → https://whatsapp.cloude.es/claim-subaccount?locationId={{ $json.location.id }}
```

---

## ⚙️ Detalles Importantes

### Para el Nodo 3 (Intercambiar code por token):

**Method:** POST
**URL:** `https://services.leadconnectorhq.com/oauth/token`
**Body:**
```json
{
  "grant_type": "authorization_code",
  "client_id": "tu_client_id_aqui",
  "client_secret": "tu_client_secret_aqui",
  "code": "{{ $json.query.code }}",
  "redirect_uri": "https://ray.cloude.es/webhook/registrocuenta"
}
```

### Para el Nodo 4 (Obtener location):

**Method:** GET
**URL:** `https://services.leadconnectorhq.com/locations/{{ $json.locationId }}`
**Headers:**
- Authorization: `Bearer {{ $json.access_token }}`
- Version: `2021-07-28`

---

## ✅ Verificación

Después de configurar todo, cuando un usuario instale la app en GoHighLevel:

1. ✅ N8N recibe el callback con el `code`
2. ✅ N8N intercambia el code por access_token
3. ✅ N8N obtiene los datos de la location desde GHL API
4. ✅ N8N envía webhook a tu backend → Crea subcuenta con `companyId: "PENDING_CLAIM"`
5. ✅ N8N redirige al usuario → `https://whatsapp.cloude.es/claim-subaccount?locationId=...`
6. ✅ Usuario autenticado reclama la subcuenta → Se asocia con su empresa
7. ✅ Sistema crea instancia de WhatsApp

---

## 🧪 Probar el Webhook

Para probar que el webhook funciona SIN instalar en GHL:

```bash
curl -X POST https://whatsapp.cloude.es/api/webhooks/register-subaccount \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@prueba.com",
    "name": "Usuario de Prueba",
    "phone": "+18091234567",
    "locationId": "test_location_12345",
    "ghlCompanyId": "test_company_67890",
    "locationName": "Test Location",
    "companyName": "Test Company"
  }'
```

Si funciona, recibirás:
```json
{
  "success": true,
  "message": "Subaccount created - pending claim",
  ...
}
```
