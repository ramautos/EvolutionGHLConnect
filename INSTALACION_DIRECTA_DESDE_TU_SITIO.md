# Instalación de Tu App GHL Directamente Desde Tu Sitio

## 🎯 Objetivo

Permitir que tus clientes instalen tu aplicación del marketplace de GoHighLevel **directamente desde whatsapp.cloude.es**, sin tener que:
- Ir al marketplace de GHL
- Salir de tu sitio
- Ver redirecciones a otros dominios

---

## ✅ Solución: Link Directo + Popup OAuth

**La clave**: No necesitas "embeder" el marketplace. Simplemente inicias el flujo OAuth directamente desde tu sitio usando un **botón de instalación personalizado**.

---

## 🔗 URL de Instalación de Tu App

Cada app del marketplace de GHL tiene una URL de instalación directa:

```
https://marketplace.gohighlevel.com/oauth/chooselocation?
  response_type=code&
  client_id=TU_CLIENT_ID_GHL&
  redirect_uri=https://whatsapp.cloude.es/oauth/callback&
  scope=conversations.readonly conversations.write locations.readonly users.readonly
```

**Parámetros**:
- `client_id`: El Client ID de tu app (lo obtienes del marketplace)
- `redirect_uri`: Tu URL de callback (DEBE estar registrada en tu app del marketplace)
- `scope`: Los permisos que necesita tu app

---

## 📋 Paso a Paso: Configuración

### 1. Registrar URL de Callback en el Marketplace

1. Ve a [marketplace.gohighlevel.com](https://marketplace.gohighlevel.com)
2. Entra a tu app
3. Ve a Settings → OAuth
4. En **Redirect URIs**, agrega:
   ```
   https://whatsapp.cloude.es/oauth/callback
   ```
5. Guarda cambios

### 2. Obtener Client ID y Client Secret

En la misma sección de OAuth, copia:
- **Client ID**: Lo usarás en el frontend
- **Client Secret**: Lo usarás en el backend (¡NUNCA en frontend!)

---

## 💻 Implementación Simple (Sin Popup)

### Opción A: Redirección Simple (Más Fácil)

Si no te importa una redirección temporal, esta es la forma más simple:

```tsx
// client/src/components/ConnectGHLButton.tsx

import { Button } from '@/components/ui/button';

export function ConnectGHLButton() {
  const handleConnect = () => {
    // Construir URL de OAuth
    const CLIENT_ID = 'tu_client_id_ghl';
    const REDIRECT_URI = 'https://whatsapp.cloude.es/oauth/callback';
    const SCOPES = [
      'conversations.readonly',
      'conversations.write',
      'locations.readonly',
      'users.readonly'
    ].join(' ');

    const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);

    // Redirigir directamente
    window.location.href = authUrl.toString();
  };

  return (
    <Button onClick={handleConnect} size="lg">
      Conectar con GoHighLevel
    </Button>
  );
}
```

**Flujo**:
1. Usuario hace clic → Redirige a GHL OAuth
2. Usuario autoriza → GHL redirige de vuelta a `https://whatsapp.cloude.es/oauth/callback?code=...`
3. Tu callback procesa y crea la subcuenta

**Ventajas**:
- ✅ Simple de implementar
- ✅ Funciona en todos los navegadores
- ✅ No hay problemas con popup blockers

**Desventajas**:
- ❌ Hay una redirección temporal (sale de tu sitio y vuelve)

---

## 🎨 Implementación Avanzada (Con Popup - Sin Salir del Sitio)

### Opción B: Popup Seamless (Mejor UX)

Esta es la implementación que documenté en `OAUTH_POPUP_IMPLEMENTATION.md`. El usuario **nunca sale de tu sitio**.

```tsx
// client/src/components/ConnectGHLButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { openOAuthPopup } from '@/utils/oauth-popup';

export function ConnectGHLButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    setIsConnecting(true);

    // Construir URL de OAuth
    const CLIENT_ID = 'tu_client_id_ghl';
    const REDIRECT_URI = 'https://whatsapp.cloude.es/oauth/callback';
    const SCOPES = [
      'conversations.readonly',
      'conversations.write',
      'locations.readonly',
      'users.readonly'
    ].join(' ');

    const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);

    // Abrir en popup
    const popup = openOAuthPopup({
      url: authUrl.toString(),
      width: 600,
      height: 700,
      onSuccess: (data) => {
        toast({
          title: '✅ Conexión exitosa',
          description: 'Tu cuenta de GoHighLevel ha sido conectada.',
        });

        // Recargar o actualizar UI
        window.location.reload();
      },
      onError: (error) => {
        toast({
          title: '❌ Error',
          description: error,
          variant: 'destructive',
        });
        setIsConnecting(false);
      },
      onClose: () => {
        setIsConnecting(false);
      },
    });

    if (!popup) {
      toast({
        title: '⚠️ Popups bloqueados',
        description: 'Por favor permite popups para este sitio.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      size="lg"
    >
      {isConnecting ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Conectando...
        </>
      ) : (
        <>
          <img src="/ghl-logo.svg" className="w-5 h-5 mr-2" alt="GHL" />
          Conectar con GoHighLevel
        </>
      )}
    </Button>
  );
}
```

Para esto necesitas la función `openOAuthPopup()` del archivo `OAUTH_POPUP_IMPLEMENTATION.md`.

**Ventajas**:
- ✅ Usuario NUNCA sale de tu sitio
- ✅ UX profesional y seamless
- ✅ Mantiene el estado de la aplicación

**Desventajas**:
- ⚠️ Requiere más código (pero ya lo tienes documentado)
- ⚠️ Algunos navegadores pueden bloquear popups

---

## 🔧 Backend: Endpoint de Callback

Este endpoint es el mismo para ambas opciones:

```typescript
// server/routes.ts

app.get("/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Error: No authorization code received');
    }

    console.log('✅ Received OAuth callback with code:', code.substring(0, 10) + '...');

    // 1. Intercambiar code por access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: 'https://whatsapp.cloude.es/oauth/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Failed to exchange code for token:', error);
      return res.status(400).send('Error exchanging authorization code');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, locationId, companyId } = tokenData;

    console.log('✅ Access token received for location:', locationId);

    // 2. Obtener datos de la location
    const locationResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/${locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Version': '2021-07-28',
        },
      }
    );

    const locationData = await locationResponse.json();
    const location = locationData.location;

    console.log('✅ Location data:', location.name);

    // 3. Guardar tokens en base de datos GHL
    await ghlStorage.createOrUpdateCliente({
      locationid: locationId,
      companyid: companyId,
      email_cliente: location.email,
      nombre_cliente: location.name,
      telefono_cliente: location.phone,
      access_token: access_token,
      refresh_token: refresh_token,
      token_type: 'Bearer',
    });

    // 4. Enviar webhook a n8n para crear subcuenta
    await fetch('https://ray.cloude.es/webhook/registrocuenta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: location.email,
        name: location.name,
        phone: location.phone,
        locationId: locationId,
        locationName: location.name,
        ghlCompanyId: companyId,
      }),
    });

    console.log('✅ Installation complete!');

    // 5. Redirigir al usuario
    // OPCIÓN A: Redirección simple
    res.redirect('https://whatsapp.cloude.es/dashboard?installed=true');

    // OPCIÓN B: Si usas popup, mostrar página que cierra el popup
    // res.send(`
    //   <!DOCTYPE html>
    //   <html>
    //   <head><title>Instalación exitosa</title></head>
    //   <body>
    //     <h1>✅ Instalación exitosa</h1>
    //     <p>Cerrando ventana...</p>
    //     <script>
    //       if (window.opener) {
    //         window.opener.postMessage({
    //           type: 'GHL_OAUTH_SUCCESS',
    //           payload: { locationId: '${locationId}', locationName: '${location.name}' }
    //         }, 'https://whatsapp.cloude.es');
    //       }
    //       setTimeout(() => window.close(), 1000);
    //     </script>
    //   </body>
    //   </html>
    // `);

  } catch (error: any) {
    console.error('❌ Error in OAuth callback:', error);
    res.status(500).send('Internal server error');
  }
});
```

---

## 🎨 UI/UX Recomendaciones

### Página de Landing para Clientes

Crea una página en tu sitio donde expliques el valor de conectar con GHL:

```tsx
// client/src/pages/ConnectGHL.tsx

export function ConnectGHLPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Conecta tu cuenta de GoHighLevel
        </h1>
        <p className="text-xl text-gray-600">
          Gestiona tus conversaciones de WhatsApp directamente desde GHL
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="text-5xl mb-4">📱</div>
          <h3 className="font-semibold mb-2">WhatsApp Integrado</h3>
          <p className="text-gray-600">
            Envía y recibe mensajes de WhatsApp en tu CRM
          </p>
        </div>

        <div className="text-center">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="font-semibold mb-2">Automatización</h3>
          <p className="text-gray-600">
            Responde automáticamente con workflows
          </p>
        </div>

        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="font-semibold mb-2">Analytics</h3>
          <p className="text-gray-600">
            Métricas de todas tus conversaciones
          </p>
        </div>
      </div>

      <div className="text-center">
        <ConnectGHLButton />

        <p className="text-sm text-gray-500 mt-4">
          Al conectar, autorizas a WhatsApp Cloud acceder a tu cuenta de GoHighLevel
        </p>
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">¿Qué sucede al conectar?</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Se abrirá una ventana de GoHighLevel para autorizar</li>
          <li>Selecciona la ubicación (location) que deseas conectar</li>
          <li>Tu cuenta se conectará automáticamente</li>
          <li>Podrás empezar a usar WhatsApp desde GHL inmediatamente</li>
        </ol>
      </div>
    </div>
  );
}
```

---

## 📱 Link para Compartir

Puedes compartir este link con tus clientes:

```
https://whatsapp.cloude.es/connect-ghl
```

Este link los lleva a tu página de instalación (no al marketplace de GHL).

---

## 🔐 Variables de Entorno

```bash
# .env
GHL_CLIENT_ID=tu_client_id_del_marketplace
GHL_CLIENT_SECRET=tu_client_secret_del_marketplace
```

---

## 📊 Comparación de Opciones

| Característica | Redirección Simple | Popup Seamless |
|----------------|-------------------|----------------|
| **Implementación** | ⭐ Muy fácil (5 min) | ⭐⭐ Media (30 min) |
| **UX** | ⭐⭐ Buena | ⭐⭐⭐ Excelente |
| **Compatibilidad** | ✅ 100% navegadores | ⚠️ 95% (popup blockers) |
| **Usuario sale del sitio** | ❌ Sí (temporal) | ✅ No |
| **Código requerido** | Mínimo | Moderado |
| **Recomendado para** | MVP, pruebas rápidas | Producción, mejor UX |

---

## ✅ Recomendación Final

**Para empezar rápido**: Usa la **Opción A (Redirección Simple)**
- Implementación en 5 minutos
- Funciona perfectamente
- Puedes mejorar después

**Para producción**: Usa la **Opción B (Popup Seamless)**
- Mejor experiencia de usuario
- Más profesional
- Usuario nunca pierde contexto

**O mejor aún**: Implementa ambas con fallback:
```typescript
// Intentar popup primero, si falla, hacer redirección
const popup = openOAuthPopup(options);
if (!popup) {
  // Fallback a redirección completa
  window.location.href = authUrl;
}
```

---

## 🎯 Resultado Final

Tus clientes verán:

1. **Botón en tu sitio**: "Conectar con GoHighLevel"
2. **Click**: Se abre ventana de OAuth (popup o redirección)
3. **Autorización**: Seleccionan su location en GHL
4. **Éxito**: Vuelven a tu sitio, todo conectado
5. **Nunca vieron**: El marketplace de GHL (solo la pantalla de OAuth)

¡Todo sucede desde TU sitio! 🎉
