# GoHighLevel Webhooks

## Descripción

Los webhooks son notificaciones HTTP enviadas de una aplicación a otra cuando ocurre un evento específico. Permiten comunicación en tiempo real.

## Configuración

### Pasos

1. Navegar a la app en el Marketplace dashboard
2. Click en "Advanced Settings" en el panel izquierdo
3. Ir a sección "Webhooks"
4. Ingresar URL del webhook en el input
5. Usar toggles para suscribirse a eventos deseados

### Crear Endpoint de Webhook

Configura un endpoint POST en tu aplicación para recibir y procesar payloads JSON.

```javascript
// Ejemplo Node.js/Express
app.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Webhook received:', event);

  // Procesar evento

  res.status(200).send('OK');
});
```

## Eventos de App Install/Uninstall

### App Install Event

**Suscripción automática** si hay webhook URL configurada.

**Payload de Ejemplo:**
```json
{
  "type": "INSTALL",
  "appId": "app123",
  "versionId": "v1.0",
  "installType": "Location",
  "locationId": "HjiMUOsCCHCjtxzEf8PR",
  "companyId": "GNb7aIv4rQFVb9iwNl5K",
  "userId": "user456",
  "companyName": "Mi Agencia",
  "isWhitelabelCompany": false,
  "whitelabelDetails": {
    "logoUrl": "https://...",
    "domain": "app.midominio.com"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "webhookId": "wh789"
}
```

### App Uninstall Event

**Payload - Desinstalación de Location:**
```json
{
  "type": "UNINSTALL",
  "appId": "app123",
  "locationId": "HjiMUOsCCHCjtxzEf8PR"
}
```

**Payload - Desinstalación de Agency:**
```json
{
  "type": "UNINSTALL",
  "appId": "app123",
  "companyId": "GNb7aIv4rQFVb9iwNl5K"
}
```

## Categorías de Eventos

- Contact events
- Opportunity events
- Task events
- Appointment events
- Invoice events
- Product events
- Association events
- Location events
- User events
- Y más...

## Seguridad - Verificación de Firma

Los webhooks incluyen header `x-wh-signature` para validación usando SHA256 con clave pública RSA.

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(JSON.stringify(payload));
  return verify.verify(publicKey, signature, 'base64');
}
```

## Best Practices

### Respuesta Rápida
- Responder inmediatamente con 200 OK
- Procesar de forma asíncrona

### Prevenir Duplicados
- Almacenar IDs de eventos procesados
- Verificar antes de procesar

### Logging
- Registrar todos los eventos recibidos
- Mantener logs para debugging

## Sistema de Reintentos

- Solo reintenta en respuestas **429** (rate limit)
- Máximo 6 intentos
- Cada 10 minutos con jitter
- Duración total: ~1 hora 10 minutos

## App Uninstall API

Permite desinstalar apps programáticamente de cuentas inactivas:

**Endpoint:** `DELETE /oauth/installedLocations`

Útil para:
- Limpiar cuentas dormidas
- Minimizar webhooks redundantes

## Recursos

- [Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html)
- [App Uninstall Webhook](https://marketplace.gohighlevel.com/docs/webhook/AppUninstall/index.html)
