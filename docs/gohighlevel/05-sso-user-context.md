# GoHighLevel SSO y User Context

## Descripción

HighLevel proporciona SSO (Single Sign-On) para acceder a información del usuario autenticado de forma segura mediante tokens firmados.

## SSO Key

### Generación
1. Ir a configuración avanzada de la app
2. Generar "Shared Secret Key"
3. Guardar de forma segura (no se muestra de nuevo)

### Variables de Entorno
```env
GHL_APP_CLIENT_ID=<tu_client_id>
GHL_APP_CLIENT_SECRET=<tu_client_secret>
GHL_API_DOMAIN=https://services.leadconnectorhq.com
GHL_APP_SSO_KEY=<tu_sso_key>
```

## Flujo SSO

1. **App GHL carga Custom Page en iframe**
2. **Custom Page solicita info SSO** - envía mensaje cross-frame
3. **App GHL solicita info al Server** - pasa Client ID
4. **Server encripta info SSO** - usa SSO Token de la app
5. **App GHL retorna info encriptada** - responde cross-frame
6. **Custom Page envía a backend** - info encriptada
7. **Backend desencripta** - usando SSO Token

## Estructura de Datos

### Contexto de Agency

```json
{
  "userId": "user123",
  "companyId": "company456",
  "role": "admin",
  "type": "agency",
  "userName": "John Doe",
  "email": "john@example.com",
  "isAgencyOwner": true
}
```

### Contexto de Location

Incluye campo adicional:
```json
{
  "userId": "user123",
  "companyId": "company456",
  "role": "user",
  "type": "location",
  "userName": "Jane Smith",
  "email": "jane@example.com",
  "isAgencyOwner": false,
  "activeLocation": "location789"
}
```

## Implementación Frontend

### Método 1: JavaScript Personalizado

```javascript
// Obtener datos encriptados
const encryptedData = await window.exposeSessionDetails(APP_ID);

// Enviar a backend para desencriptación
const response = await fetch('/decrypt-sso', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: encryptedData })
});

const userData = await response.json();
```

### Método 2: Páginas Personalizadas (iframe)

```javascript
// Solicitar datos al parent
window.parent.postMessage({
  type: 'REQUEST_USER_DATA'
}, '*');

// Escuchar respuesta
window.addEventListener('message', (event) => {
  if (event.data.type === 'USER_DATA_RESPONSE') {
    const encryptedData = event.data.payload;
    // Enviar a backend para desencriptar
  }
});
```

## Implementación Backend

### Desencriptación con CryptoJS

```javascript
const CryptoJS = require('crypto-js');

function decryptUserData(encryptedData, ssoKey) {
  const decrypted = CryptoJS.AES.decrypt(
    encryptedData,
    ssoKey
  ).toString(CryptoJS.enc.Utf8);

  return JSON.parse(decrypted);
}

// Ruta de desencriptación
app.post('/decrypt-sso', (req, res) => {
  const { data } = req.body;
  const userData = decryptUserData(data, process.env.GHL_APP_SSO_KEY);
  res.json(userData);
});
```

## Consideraciones de Seguridad

1. **Nunca exponer SSO Key en cliente**
2. **Desencriptar solo en backend**
3. **Usar variables de entorno**
4. **HTTPS obligatorio**
5. **Rotar claves regularmente**

## Custom Menu Links con iFrame

### Tipos de Apertura

| Tipo | Descripción |
|------|-------------|
| **Embedded (iFrame)** | Muestra página externa dentro de HighLevel |
| **New Browser Tab** | Abre en pestaña separada |
| **Current Browser Tab** | Reemplaza pantalla actual |

### Configuración

Las Custom Menu Links permiten personalizar la navegación para:
- Sub-accounts
- Usuarios de agencia
- Acceso a recursos externos
- Materiales de entrenamiento

## Recursos

- [User Context Documentation](https://marketplace.gohighlevel.com/docs/other/user-context-marketplace-apps/index.html)
- [Marketplace App Template](https://github.com/GoHighLevel/ghl-marketplace-app-template)
- [SSO Changelog](https://ideas.gohighlevel.com/changelog/sso-in-our-developer-app-marketplace)
