# GoHighLevel Developer Reference

Esta documentación es una referencia rápida para el desarrollo de apps en el marketplace de GoHighLevel.

---

## Tipos de Apps

| Tipo | Visible en | Quién instala | Uso |
|------|-----------|---------------|-----|
| **Agency App** | Solo Agency Marketplace | Solo admins de agencia | Operaciones a nivel de agencia |
| **Sub-Account App** | Ambos marketplaces | Agencia o subcuenta | Operaciones por ubicación |

### Modelos de Instalación para Sub-Account Apps

1. **Ambos pueden instalar**: Visible en ambos marketplaces
2. **Solo agencia instala**: Solo visible para admins de agencia, pero usado por subcuentas
3. **Bulk Installation**: Cuando `isBulkInstallation: true`, se despliega a múltiples subcuentas automáticamente

---

## OAuth 2.0

### Flujo de Autorización (Authorization Code Grant)

```
1. Usuario hace click en "Install" en el marketplace
2. GHL redirige a tu redirect_uri con ?code=XXX
3. Tu backend intercambia el code por tokens
4. Guardas tokens y locationId/companyId
5. Usas tokens para llamadas API
```

### Endpoints

**Obtener Access Token:**
```
POST https://services.leadconnectorhq.com/oauth/token

Body:
{
  "client_id": "tu_client_id",
  "client_secret": "tu_client_secret",
  "grant_type": "authorization_code",
  "code": "codigo_recibido",
  "redirect_uri": "tu_redirect_uri",
  "user_type": "Company" | "Location"
}

Response:
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 86399,
  "locationId": "xxx" (si es Location),
  "companyId": "xxx"
}
```

**Obtener Token de Location desde Token de Agency:**
```
POST https://services.leadconnectorhq.com/oauth/locationToken

Headers:
  Authorization: Bearer {agency_access_token}
  Version: 2021-07-28

Body:
{
  "companyId": "xxx",
  "locationId": "xxx"
}
```

**Refresh Token:**
```
POST https://services.leadconnectorhq.com/oauth/token

Body:
{
  "client_id": "tu_client_id",
  "client_secret": "tu_client_secret",
  "grant_type": "refresh_token",
  "refresh_token": "tu_refresh_token"
}
```

### Tiempos de Expiración

- **Access Token**: ~24 horas (86,399 segundos)
- **Refresh Token**: Hasta 1 año o hasta que se use (genera uno nuevo)

---

## SSO (Single Sign-On)

### Qué es

SSO permite acceder a los datos del usuario logueado cuando tu app se muestra en un iframe dentro de GHL (Custom Pages/Custom Menu Links).

### Datos que devuelve SSO

```javascript
{
  companyId: "xxx",      // ID de la agencia
  locationId: "xxx",     // ID de la subcuenta/ubicación
  userId: "xxx",         // ID del usuario logueado
  name: "John Doe",      // Nombre del usuario
  email: "john@example.com",
  userType: "Company" | "Location"  // Tipo de usuario
}
```

### Implementación

1. **En el frontend (iframe)**: Solicitar datos SSO cifrados al parent
2. **En el backend**: Descifrar usando `GHL_APP_SSO_KEY`

```javascript
// Frontend - Solicitar SSO
window.parent.postMessage({ action: 'getSSO' }, '*');

// Escuchar respuesta
window.addEventListener('message', (event) => {
  if (event.data.ssoData) {
    // Enviar al backend para descifrar
    fetch('/decrypt-sso', {
      method: 'POST',
      body: JSON.stringify({ encryptedData: event.data.ssoData })
    });
  }
});
```

```javascript
// Backend - Descifrar SSO
const crypto = require('crypto');

function decryptSSO(encryptedData, ssoKey) {
  // Usar la clave SSO del marketplace para descifrar
  const decipher = crypto.createDecipheriv('aes-256-cbc', ssoKey, iv);
  // ... lógica de descifrado
  return decryptedData; // { companyId, locationId, userId, ... }
}
```

### Variable de Entorno

```env
GHL_APP_SSO_KEY=tu_clave_sso_del_marketplace
```

---

## Custom Menu Links (Custom Pages)

### Qué son

Páginas personalizadas que aparecen en el menú lateral de GHL, renderizadas en un iframe.

### Configuración

1. En el Marketplace > Tu App > Settings
2. Agregar "Custom Menu Link"
3. Configurar:
   - **Name**: Nombre del menú
   - **URL**: URL de tu app (se carga en iframe)
   - **Icon**: Ícono del menú
   - **Location**: Dónde aparece (sidebar, settings, etc.)

### Uso con SSO

Cuando el usuario hace click en tu Custom Menu Link:
1. GHL carga tu URL en un iframe
2. Tu app solicita datos SSO
3. GHL envía datos cifrados via postMessage
4. Tu backend descifra y obtiene locationId del usuario actual
5. Muestras contenido específico para esa ubicación

---

## Webhooks de Instalación

### Eventos Disponibles

| Evento | Descripción |
|--------|-------------|
| `app.installed` | Cuando una ubicación instala tu app |
| `app.uninstalled` | Cuando una ubicación desinstala tu app |

### Payload de Instalación

```json
{
  "type": "app.installed",
  "locationId": "xxx",
  "companyId": "xxx",
  "userId": "xxx",
  "appId": "tu_app_id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Configuración

1. En el Marketplace > Tu App > Settings > Webhook URL
2. Agregar tu endpoint: `https://tu-app.com/webhooks/ghl`

---

## API Base URL

```
https://services.leadconnectorhq.com
```

### Headers Requeridos

```
Authorization: Bearer {access_token}
Version: 2021-07-28
Content-Type: application/json
```

---

## Scopes Comunes

| Scope | Descripción |
|-------|-------------|
| `contacts.readonly` | Leer contactos |
| `contacts.write` | Crear/editar contactos |
| `conversations.readonly` | Leer conversaciones |
| `conversations.write` | Enviar mensajes |
| `locations.readonly` | Leer ubicaciones |
| `locations.write` | Editar ubicaciones |
| `users.readonly` | Leer usuarios |
| `companies.readonly` | Leer datos de agencia |
| `oauth.readonly` | Acceso OAuth básico |
| `oauth.write` | Gestión OAuth |

---

## Flujo para Mostrar Contenido por Subcuenta

### Escenario: App instalada, usuario accede via Custom Menu Link

```
1. Usuario (de LocationX) hace click en tu menú
2. GHL carga tu iframe con tu URL
3. Tu frontend solicita SSO data
4. GHL envía: { locationId: "LocationX", userId: "...", ... }
5. Tu backend descifra y obtiene locationId
6. Consultas tu BD: SELECT * FROM instances WHERE location_id = "LocationX"
7. Muestras solo los datos de esa ubicación
```

### Código de Ejemplo (tu proyecto actual)

```typescript
// En GhlIframe.tsx o similar
useEffect(() => {
  // Solicitar SSO al cargar
  window.parent.postMessage({ action: 'getSSO' }, '*');

  const handleMessage = async (event: MessageEvent) => {
    if (event.data.ssoData) {
      const response = await fetch('/api/ghl/decrypt-sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted: event.data.ssoData })
      });
      const { locationId, companyId, userId } = await response.json();

      // Ahora tienes el locationId de la subcuenta actual
      // Carga datos específicos para esta ubicación
      loadInstancesForLocation(locationId);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

---

## Variables de Entorno Necesarias

```env
# OAuth
GHL_CLIENT_ID=tu_client_id
GHL_CLIENT_SECRET=tu_client_secret
VITE_GHL_CLIENT_ID=tu_client_id  # Para frontend

# SSO
GHL_APP_SSO_KEY=tu_clave_sso

# API
GHL_API_DOMAIN=https://services.leadconnectorhq.com

# Tu app
APP_URL=https://tu-app.com
REDIRECT_URI=https://tu-app.com/oauth/callback
```

---

## Enlaces Útiles

- [Developer Portal](https://developers.gohighlevel.com/)
- [API Docs](https://marketplace.gohighlevel.com/docs/)
- [OAuth Documentation](https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html)
- [App Distribution Models](https://marketplace.gohighlevel.com/docs/oauth/AppDistribution/index.html)
- [Official App Template (GitHub)](https://github.com/GoHighLevel/ghl-marketplace-app-template)
- [GHL API v2 Helper Tool](https://www.ghlapiv2.com/)

---

## Notas para EvolutionGHLConnect

### Implementación Actual

| Componente | Estado | Archivo |
|------------|--------|---------|
| OAuth Flow | ✅ Implementado | `server/routes.ts`, `server/ghl-api.ts` |
| SSO Decrypt | ✅ Implementado | `server/ghl-api.ts` → `decryptSsoKey()` |
| SSO Endpoint | ✅ Implementado | `/api/ghl/decrypt-sso` |
| GHL Iframe | ✅ Implementado | `client/src/pages/GhlIframe.tsx` |
| Custom Page URL | ✅ Configurado | `/ghl-iframe` |

### Flujo SSO Implementado (Custom Pages)

```
1. Usuario hace click en Custom Menu Link en GHL
2. GHL carga iframe: https://tu-app.com/ghl-iframe
3. Frontend solicita SSO: window.parent.postMessage({ action: 'getSSO' }, '*')
4. GHL responde con ssoData cifrado via postMessage
5. Frontend envía a backend: POST /api/ghl/decrypt-sso
6. Backend descifra usando GHL_APP_SSO_KEY
7. Backend retorna: { locationId, userId, companyId, user }
8. Frontend muestra dashboard filtrado por locationId
```

### Cómo Obtener GHL_APP_SSO_KEY

1. Ve a [GoHighLevel Marketplace](https://marketplace.gohighlevel.com)
2. Entra a **My Apps** → Tu aplicación
3. Ve a la pestaña **Settings**
4. En la sección **App Configuration**, busca **SSO Key**
5. Copia la clave y agrégala a tu `.env`:

```env
GHL_APP_SSO_KEY=tu_clave_sso_del_marketplace
```

### Configurar Custom Menu Link en GHL

1. En el Marketplace → Tu App → **Settings**
2. Busca **Custom Menu Links**
3. Agrega un nuevo link:
   - **Name**: WhatsApp Dashboard
   - **URL**: `https://tu-app.com/ghl-iframe`
   - **Icon**: message-circle (o el que prefieras)
   - **Location**: sidebar

### Para vender a subcuentas

1. Crear link de instalación con `access_token` único
2. Subcuenta accede al link
3. OAuth flow con `user_type: "Location"`
4. Guardar `locationId` en `subaccounts`
5. En Custom Page, SSO devuelve ese `locationId`
6. Mostrar solo instancias de esa ubicación

---

## Troubleshooting SSO

### Error: "GHL_APP_SSO_KEY no configurado"
- Verifica que la variable esté en tu `.env`
- Reinicia el servidor después de agregar la variable

### Error: "SSO key inválido o expirado"
- El SSO key tiene un timestamp, expira después de 5 minutos
- Verifica que tu servidor tenga la hora correcta (NTP sync)
- La clave SSO del marketplace puede haber cambiado, verifica en Settings

### Error: "Subcuenta no encontrada para este location"
- El locationId del SSO no tiene una subcuenta registrada en tu sistema
- La app no está instalada correctamente en esa location
- Verifica que el OAuth flow haya guardado el locationId

### El iframe muestra "Esta página debe abrirse desde GoHighLevel"
- La página no está cargando dentro de un iframe de GHL
- Verifica que el Custom Menu Link esté configurado correctamente
- Para testing, puedes usar: `/ghl-iframe?ssoKey=TOKEN_CIFRADO`
