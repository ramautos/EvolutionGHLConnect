# OAuth sin Redirección - Implementación con Popup Window

## 📋 Resumen

Esta guía explica cómo implementar la instalación de tu aplicación GoHighLevel **sin redirección completa de página**, usando una ventana popup y comunicación con `window.postMessage`.

---

## 🎯 Objetivo

**Flujo Actual (con redirección completa)**:
```
Usuario en tu app → Click "Instalar" → Redirección completa a GHL OAuth
→ Usuario autoriza → Redirección completa de regreso → Tu app procesa
```

**Flujo Deseado (sin redirección, seamless)**:
```
Usuario en tu app → Click "Instalar" → Popup OAuth abre
→ Usuario autoriza en popup → Popup cierra → Tu app recibe datos → Usuario permanece en tu app
```

---

## 🔍 Basado en la Documentación Oficial de GHL

GoHighLevel usa este patrón exacto para **Social Media Posting OAuth** (Google, Facebook, Instagram, LinkedIn, TikTok). Ver: `/apps/social-media-posting.json` en la documentación oficial.

Patrón documentado:
```javascript
// GHL recomienda:
window.addEventListener('message', function(e) {
  if (e.data && e.data.page === 'social_media_posting') {
    const { actionType, page, platform, accountId } = e.data
    // Procesar datos sin redirección
  }
}, false)
```

---

## 🛠️ Implementación Frontend

### 1. Crear Función para Abrir OAuth Popup

```typescript
// client/src/utils/oauth-popup.ts

interface OAuthPopupOptions {
  url: string;
  width?: number;
  height?: number;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

export function openOAuthPopup(options: OAuthPopupOptions): Window | null {
  const {
    url,
    width = 600,
    height = 700,
    onSuccess,
    onError,
    onClose
  } = options;

  // Calcular posición centrada
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  // Opciones del popup
  const popupOptions = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'toolbar=no',
    'location=no',
    'directories=no',
    'status=no',
    'menubar=no',
    'scrollbars=yes',
    'resizable=yes',
    'copyhistory=no'
  ].join(',');

  // Abrir popup
  const popup = window.open(url, 'GHL OAuth', popupOptions);

  if (!popup) {
    onError('Popup bloqueado. Por favor permite popups para este sitio.');
    return null;
  }

  // Listener para mensajes del popup
  const messageHandler = (event: MessageEvent) => {
    // IMPORTANTE: Validar origen por seguridad
    // Solo aceptar mensajes de tu propio dominio o dominios confiables
    const trustedOrigins = [
      window.location.origin,
      'https://whatsapp.cloude.es',
      'https://oauth.cloude.es'
    ];

    if (!trustedOrigins.includes(event.origin)) {
      console.warn('Mensaje rechazado de origen no confiable:', event.origin);
      return;
    }

    // Verificar que el mensaje es del flujo OAuth
    if (event.data && event.data.type === 'GHL_OAUTH_SUCCESS') {
      console.log('✅ OAuth exitoso, datos recibidos:', event.data);

      // Limpiar listener
      window.removeEventListener('message', messageHandler);

      // Cerrar popup
      if (popup && !popup.closed) {
        popup.close();
      }

      // Llamar callback de éxito
      onSuccess(event.data.payload);
    } else if (event.data && event.data.type === 'GHL_OAUTH_ERROR') {
      console.error('❌ OAuth falló:', event.data.error);

      // Limpiar listener
      window.removeEventListener('message', messageHandler);

      // Cerrar popup
      if (popup && !popup.closed) {
        popup.close();
      }

      // Llamar callback de error
      onError(event.data.error || 'Error desconocido en OAuth');
    }
  };

  // Agregar listener
  window.addEventListener('message', messageHandler);

  // Monitorear si el usuario cerró el popup manualmente
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', messageHandler);

      if (onClose) {
        onClose();
      }

      console.log('⚠️ Usuario cerró el popup de OAuth');
    }
  }, 500);

  return popup;
}
```

---

### 2. Componente React para Botón de Instalación

```tsx
// client/src/components/InstallGHLButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { openOAuthPopup } from '@/utils/oauth-popup';

export function InstallGHLButton() {
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      // 1. Generar OAuth state en tu backend
      const stateResponse = await fetch('/api/admin/ghl/generate-oauth-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!stateResponse.ok) {
        throw new Error('Error al generar OAuth state');
      }

      const { state, authUrl } = await stateResponse.json();

      console.log('🔐 OAuth state generado:', state);
      console.log('🔗 Abriendo popup con URL:', authUrl);

      // 2. Abrir popup de OAuth
      const popup = openOAuthPopup({
        url: authUrl,
        width: 600,
        height: 700,
        onSuccess: async (data) => {
          console.log('✅ OAuth completado exitosamente:', data);

          toast({
            title: '¡Instalación exitosa!',
            description: 'Tu aplicación GHL ha sido instalada correctamente.',
          });

          // Recargar datos o redirigir
          window.location.reload();
        },
        onError: (error) => {
          console.error('❌ Error en OAuth:', error);

          toast({
            title: 'Error en la instalación',
            description: error,
            variant: 'destructive',
          });

          setIsInstalling(false);
        },
        onClose: () => {
          console.log('⚠️ Popup cerrado');
          setIsInstalling(false);
        },
      });

      if (!popup) {
        toast({
          title: 'Popups bloqueados',
          description: 'Por favor permite popups para este sitio.',
          variant: 'destructive',
        });
        setIsInstalling(false);
      }
    } catch (error: any) {
      console.error('❌ Error al iniciar OAuth:', error);

      toast({
        title: 'Error',
        description: error.message || 'Error al iniciar la instalación',
        variant: 'destructive',
      });

      setIsInstalling(false);
    }
  };

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      size="lg"
    >
      {isInstalling ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Instalando...
        </>
      ) : (
        'Instalar App GHL'
      )}
    </Button>
  );
}
```

---

## 🔧 Implementación Backend

### 3. Endpoint para Generar OAuth State

```typescript
// server/routes.ts

// Nuevo endpoint: Generar OAuth state y URL de autorización
app.post("/api/admin/ghl/generate-oauth-state", requireSystemAdmin, async (req, res) => {
  try {
    const user = req.user as Subaccount;

    // 1. Generar OAuth state
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // 2. Guardar state en DB
    await storage.createOAuthState({
      state,
      companyId: user.companyId || undefined,
      userId: user.id,
      userEmail: user.email,
      expiresAt,
      used: false,
    });

    // 3. Construir URL de autorización GHL
    const CLIENT_ID = process.env.GHL_CLIENT_ID!;
    const REDIRECT_URI = process.env.GHL_REDIRECT_URI!; // https://oauth.cloude.es/ghl/callback
    const SCOPES = [
      'conversations.readonly',
      'conversations.write',
      'locations.readonly',
      'users.readonly',
    ].join(' ');

    const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);

    console.log(`✅ OAuth state generated for user ${user.email}: ${state}`);

    res.json({
      success: true,
      state,
      authUrl: authUrl.toString(),
    });
  } catch (error: any) {
    console.error('❌ Error generating OAuth state:', error);
    res.status(500).json({
      error: 'Failed to generate OAuth state',
      message: error.message,
    });
  }
});
```

---

### 4. Página de Callback OAuth (HTML Estático)

Esta página recibe el callback de GHL y envía el mensaje al parent window.

```html
<!-- public/oauth-callback.html -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autenticando...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error {
      background: rgba(239, 68, 68, 0.9);
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2 id="message">Autenticando con GoHighLevel...</h2>
    <div id="error" class="error" style="display: none;"></div>
  </div>

  <script>
    (function() {
      console.log('🔄 OAuth callback page loaded');

      // Obtener parámetros de URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      const messageEl = document.getElementById('message');
      const errorEl = document.getElementById('error');

      // Si hay error de GHL
      if (error) {
        console.error('❌ GHL OAuth error:', error);
        messageEl.textContent = 'Error en la autenticación';
        errorEl.textContent = 'Error: ' + error;
        errorEl.style.display = 'block';

        // Enviar error al parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GHL_OAUTH_ERROR',
            error: error
          }, window.location.origin);
        }

        // Cerrar popup después de 3 segundos
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      // Si no hay code
      if (!code) {
        console.error('❌ No authorization code received');
        messageEl.textContent = 'Error: No se recibió código de autorización';
        errorEl.textContent = 'Falta el código de autorización';
        errorEl.style.display = 'block';

        if (window.opener) {
          window.opener.postMessage({
            type: 'GHL_OAUTH_ERROR',
            error: 'No authorization code received'
          }, window.location.origin);
        }

        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      console.log('✅ Authorization code received:', code.substring(0, 10) + '...');
      console.log('🔐 State:', state);

      // Llamar a tu backend para intercambiar el code por access token
      messageEl.textContent = 'Procesando instalación...';

      fetch('/api/ghl/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          state: state
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('✅ Backend response:', data);

          if (data.success) {
            messageEl.textContent = '¡Instalación exitosa!';

            // Enviar éxito al parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'GHL_OAUTH_SUCCESS',
                payload: data
              }, window.location.origin);
            }

            // Cerrar popup después de 1 segundo
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            throw new Error(data.error || 'Error desconocido');
          }
        })
        .catch(err => {
          console.error('❌ Error processing OAuth:', err);
          messageEl.textContent = 'Error en la instalación';
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';

          // Enviar error al parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GHL_OAUTH_ERROR',
              error: err.message
            }, window.location.origin);
          }

          // Cerrar popup después de 3 segundos
          setTimeout(() => {
            window.close();
          }, 3000);
        });
    })();
  </script>
</body>
</html>
```

---

### 5. Endpoint Backend para Procesar Callback

```typescript
// server/routes.ts

// Endpoint para procesar el callback OAuth (llamado desde el popup)
app.post("/api/ghl/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.body;

    console.log('🔄 Processing OAuth callback...');
    console.log('📝 Code:', code?.substring(0, 10) + '...');
    console.log('🔐 State:', state);

    // 1. Validar OAuth state
    if (state) {
      const oauthState = await storage.getOAuthState(state);

      if (!oauthState) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OAuth state'
        });
      }

      if (oauthState.used) {
        return res.status(400).json({
          success: false,
          error: 'OAuth state has already been used'
        });
      }

      if (new Date() > new Date(oauthState.expiresAt)) {
        return res.status(400).json({
          success: false,
          error: 'OAuth state has expired'
        });
      }

      // Marcar state como usado (lo borra automáticamente ahora)
      await storage.markOAuthStateAsUsed(state);
    }

    // 2. Intercambiar code por access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ GHL token exchange failed:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to exchange authorization code for access token'
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token received');

    // 3. Obtener información de la location
    const locationId = tokenData.locationId;
    const companyId = tokenData.companyId;

    const locationResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/${locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28',
        },
      }
    );

    if (!locationResponse.ok) {
      console.error('❌ Failed to fetch location data');
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch location data from GHL'
      });
    }

    const locationData = await locationResponse.json();
    console.log('✅ Location data fetched');

    // 4. Guardar tokens en base de datos GHL (tu DB externa)
    // Aquí llamarías a ghl-storage para guardar los tokens

    // 5. Enviar webhook a n8n para crear la subcuenta
    // (Esto ya lo tienes implementado en tu flujo actual)

    res.json({
      success: true,
      message: 'OAuth completed successfully',
      locationId: locationId,
      companyId: companyId,
      locationName: locationData.location?.name
    });

  } catch (error: any) {
    console.error('❌ Error processing OAuth callback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});
```

---

## 🔒 Consideraciones de Seguridad

### 1. Validar Origen de Mensajes

```typescript
// SIEMPRE validar el origen del postMessage
const trustedOrigins = [
  window.location.origin,
  'https://whatsapp.cloude.es',
  'https://oauth.cloude.es'
];

if (!trustedOrigins.includes(event.origin)) {
  console.warn('Mensaje rechazado de origen no confiable:', event.origin);
  return;
}
```

### 2. Usar State Parameter

El state parameter previene CSRF attacks. NUNCA omitir este parámetro.

### 3. HTTPS Obligatorio

Tanto tu app como la URL de callback DEBEN usar HTTPS en producción.

### 4. Expiración de State

Los OAuth states deben expirar en 30 minutos máximo.

---

## 🎨 UX Best Practices

### 1. Manejar Popup Blockers

```typescript
if (!popup) {
  toast({
    title: 'Popups bloqueados',
    description: 'Por favor permite popups para este sitio.',
    variant: 'destructive',
  });
}
```

### 2. Loading States

Mostrar spinner mientras el popup está abierto.

### 3. Timeout

Cerrar el popup automáticamente si tarda más de 5 minutos.

---

## 📝 Variables de Entorno Requeridas

```bash
# .env
GHL_CLIENT_ID=tu_client_id_ghl
GHL_CLIENT_SECRET=tu_client_secret_ghl
GHL_REDIRECT_URI=https://oauth.cloude.es/ghl/callback
```

---

## ✅ Ventajas de Esta Implementación

1. ✅ **Sin redirección completa** - Usuario permanece en tu app
2. ✅ **UX mejorada** - Popup seamless
3. ✅ **Seguro** - Usa state parameter y validación de origen
4. ✅ **Compatible** - Funciona en todos los navegadores modernos
5. ✅ **Basado en GHL** - Patrón usado por GHL para Social Media OAuth

---

## ⚠️ Limitaciones Conocidas

1. **Popup Blockers**: Algunos navegadores pueden bloquear popups. Debes manejar esto con un mensaje al usuario.
2. **Mobile Safari**: Puede tener problemas con `window.opener`. Considera fallback a redirección completa en mobile.
3. **Cross-Origin**: Solo funciona si tu callback está en el mismo dominio o en un dominio de confianza.

---

## 🧪 Testing

### Test Manual:

1. Click en botón "Instalar App GHL"
2. Popup se abre con OAuth de GHL
3. Usuario selecciona location y autoriza
4. Popup se cierra automáticamente
5. Usuario recibe notificación de éxito
6. Subcuenta se crea sin redirección de página

### Debug Console Logs:

```
🔐 OAuth state generado: abc123...
🔗 Abriendo popup con URL: https://marketplace.gohighlevel.com/oauth/chooselocation?...
🔄 OAuth callback page loaded
✅ Authorization code received: xyz789...
✅ Backend response: { success: true, ... }
✅ OAuth exitoso, datos recibidos: { ... }
```

---

## 📚 Referencias

- [GHL OAuth Documentation](https://marketplace.gohighlevel.com/docs/oauth/Authorization)
- [GHL Social Media Posting OAuth Pattern](https://marketplace.gohighlevel.com/docs/social-media-posting)
- [MDN window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/rfc6749)
