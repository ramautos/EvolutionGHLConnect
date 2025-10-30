# Configuración N8N para OAuth de GoHighLevel

## 🎯 Sistema de Reclamación de Subcuentas

El sistema usa un flujo de **reclamación** donde:
1. n8n crea la subcuenta (sin asociarla a un usuario específico)
2. n8n redirige al usuario de vuelta a la aplicación
3. La aplicación asocia automáticamente la subcuenta con el usuario autenticado

## 🔄 Flujo Completo

### 1. Usuario Inicia OAuth
Usuario (bono@bono.com) presiona "Conectar con GoHighLevel"
- Frontend redirige a GoHighLevel OAuth
- GoHighLevel muestra página de autorización

### 2. GoHighLevel Callback a N8N
GoHighLevel redirige a n8n con:
- `code`: Código de autorización OAuth
- URL: `https://ray.cloude.es/webhook/registrocuenta?code=abc123...`

### 3. N8N Procesa el Callback
N8N debe hacer **3 cosas en este orden**:

#### A. Intercambiar code por access token
```javascript
// HTTP Request a GoHighLevel
POST https://services.leadconnectorhq.com/oauth/token
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "authorization_code",
  "code": "{{$node['Webhook'].json.query.code}}",
  "redirect_uri": "https://ray.cloude.es/webhook/registrocuenta"
}
```

#### B. Obtener datos de la location
```javascript
// HTTP Request a GoHighLevel API
GET https://services.leadconnectorhq.com/locations/{{locationId}}
Headers: {
  "Authorization": "Bearer {{access_token}}",
  "Version": "2021-07-28"
}
```

#### C. Guardar en base de datos GHL (tu DB)
Guardar: access_token, locationId, email, nombre, etc.

#### D. Enviar webhook al backend de WhatsApp
```javascript
// HTTP Request
POST https://whatsapp.cloude.es/api/webhooks/register-subaccount
Content-Type: application/json

{
  "email": "{{$json.location.email}}",
  "name": "{{$json.location.name}}",
  "phone": "{{$json.location.phone}}",
  "locationId": "{{$json.location.id}}",
  "locationName": "{{$json.location.name}}",
  "ghlCompanyId": "{{$json.location.companyId}}",
  "companyName": "{{$json.company.name}}"
}
```

**IMPORTANTE**: No incluir el `state` parameter (GoHighLevel no lo devuelve)

#### E. Redirigir al usuario de vuelta
**ESTE ES EL PASO CRÍTICO QUE FALTABA**

```javascript
// Nodo "Respond to Webhook"
Status Code: 302
Headers: {
  "Location": "https://whatsapp.cloude.es/claim-subaccount?locationId={{$json.location.id}}"
}
```

### 4. Usuario es Redirigido
El navegador redirige automáticamente a:
```
https://whatsapp.cloude.es/claim-subaccount?locationId=jtEqGdhkoR6iePmZaCmd
```

### 5. Frontend Reclama la Subcuenta
La página `/claim-subaccount`:
1. Extrae el `locationId` de la URL
2. Llama automáticamente a `POST /api/subaccounts/claim`
3. Backend asocia la subcuenta con el usuario autenticado
4. Crea la instancia de WhatsApp
5. Redirige al dashboard

## 🛠️ Configuración en N8N

### Nodos Necesarios:

1. **Webhook** (trigger)
   - URL: `https://ray.cloude.es/webhook/registrocuenta`
   - Method: GET
   - Response: Immediate

2. **Function** (extraer code de query)
   ```javascript
   return {
     code: $node['Webhook'].json.query.code
   };
   ```

3. **HTTP Request** (obtener access token)
   - Method: POST
   - URL: `https://services.leadconnectorhq.com/oauth/token`
   - Body: Formulario con code, client_id, client_secret, etc.

4. **HTTP Request** (obtener location data)
   - Method: GET
   - URL: `https://services.leadconnectorhq.com/locations/{{locationId}}`
   - Headers: Authorization Bearer token

5. **PostgreSQL** (guardar en tu BD GHL)
   - Operation: Insert
   - Tabla: `ghl_clientes`
   - Datos: access_token, locationId, email, etc.

6. **HTTP Request** (webhook a mi backend)
   - Method: POST
   - URL: `https://whatsapp.cloude.es/api/webhooks/register-subaccount`
   - Body JSON con datos de la location

7. **Respond to Webhook** (redirigir usuario)
   - Response Code: 302
   - Headers:
     ```json
     {
       "Location": "https://whatsapp.cloude.es/claim-subaccount?locationId={{$json.location.id}}"
     }
     ```

## 📊 Ejemplo Completo

### Datos que recibe n8n de GoHighLevel:
```json
{
  "query": {
    "code": "a6a4fa71734606dcd51229395aa57415f5ca0d5b"
  }
}
```

### Datos que n8n envía al webhook:
```json
{
  "email": "RAY@RAMAUTOS.DO",
  "name": "Ram Mega Autos",
  "phone": "+18092878059",
  "locationId": "jtEqGdhkoR6iePmZaCmd",
  "locationName": "Ram Mega Autos",
  "ghlCompanyId": "wW07eetYJ3JmgceImT5i",
  "companyName": "Ram Mega Autos"
}
```

### URL de redirección final:
```
https://whatsapp.cloude.es/claim-subaccount?locationId=jtEqGdhkoR6iePmZaCmd
```

## 🔒 Seguridad

1. **Timeout de reclamación**: Solo se pueden reclamar subcuentas creadas hace menos de 10 minutos
2. **Autenticación requerida**: El usuario debe estar logueado
3. **Asociación automática**: La subcuenta se asocia con la company del usuario autenticado

## ✅ Resultado Final

```
Company: Bono Corp (companyId: abc-123)
  └── Subaccount: Ram Mega Autos
        - Email: RAY@RAMAUTOS.DO
        - Location ID: jtEqGdhkoR6iePmZaCmd
        - Owner: bono@bono.com (reclamó la subcuenta)
        - WhatsApp Instance: jtEqGdhkoR6iePmZaCmd_1
```

## 🐛 Debugging

Si la subcuenta no se asocia correctamente, verifica en los logs:

```bash
# Backend logs
🔍 User bono@bono.com attempting to claim subaccount for location jtEqGdhkoR6iePmZaCmd
🔄 Updating subaccount company from xxx to abc-123
✅ Subaccount claimed successfully by bono@bono.com
📱 Creating WhatsApp instance for claimed subaccount...
✅ WhatsApp instance created: jtEqGdhkoR6iePmZaCmd_1
```

## ⚠️ Errores Comunes

1. **"Subaccount not found"**: n8n no envió el webhook o el locationId es incorrecto
2. **"Subaccount too old to claim"**: Pasaron más de 10 minutos entre la creación y el claim
3. **Página se queda en loading**: n8n no está redirigiendo al usuario (falta el nodo "Respond to Webhook")

## 📝 Endpoints Disponibles

### POST /api/webhooks/register-subaccount (Público)
Crea subcuenta desde n8n (sin owner, pendiente de reclamación)

### POST /api/subaccounts/claim (Autenticado)
Asocia subcuenta con el usuario logueado

Payload:
```json
{
  "locationId": "jtEqGdhkoR6iePmZaCmd"
}
```
