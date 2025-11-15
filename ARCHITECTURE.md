# Arquitectura Técnica - Evolution GHL Connect

## 📋 Resumen del Sistema

Sistema de integración entre WhatsApp (vía Evolution API), GoHighLevel CRM y n8n automation platform.

---

## 🏗️ Arquitectura de Webhooks

### Flujo de Datos Principal

```
WhatsApp → Evolution API → n8n (DIRECTO)
                            ↓
                     Procesamiento de mensajes
                     Automatizaciones n8n
```

**URL del Webhook:** `https://n8nqr.cloude.es/webhook/evolution1`

**Configuración:**
- Cada instancia de WhatsApp creada se configura automáticamente con webhook apuntando a n8n
- Ver: `server/routes.ts` línea 3771-3784

**Eventos enviados a n8n:**
- `connection.update` - Cuando se conecta/desconecta WhatsApp
- `messages.upsert` - Mensajes nuevos
- `messages.update` - Actualizaciones de mensajes (leído, entregado, etc.)

---

## 🎉 Sistema de QR Auto-Close con Confetti

### Problema Resuelto
El QR debe desaparecer automáticamente cuando el usuario escanea con WhatsApp, mostrando confetti celebratorio.

### Solución Implementada: Dual Detection System

#### 1. **WebSocket (Ideal - si webhook funcionara al backend)**
- Socket.IO conectado en `QRModal.tsx` (línea 113-142)
- Escucha evento `instance-connected`
- **Estado actual:** No se usa porque webhook va directo a n8n

#### 2. **Polling Agresivo (Activo - Solución Principal)** ✅
- Intervalo: **1 segundo** (línea 146-166 en `QRModal.tsx`)
- Consulta: `GET /api/instances/:id/status`
- Backend consulta Evolution API directamente
- Cuando detecta `state === "open"` → Trigger confetti

### Código Clave

**Frontend - QRModal.tsx (línea 146-166):**
```typescript
const pollingInterval = setInterval(async () => {
  const res = await apiRequest("GET", `/api/instances/${instanceId}/status`);
  const statusData = await res.json();

  if (statusData.state === "open" && !phoneDetected) {
    celebrateConnection(statusData.phoneNumber);
    clearInterval(pollingInterval);
  }
}, 1000); // Cada 1 segundo
```

**Backend - routes.ts (línea 3792-3836):**
```typescript
app.get("/api/instances/:id/status", async (req, res) => {
  const stateData = await evolutionAPI.getInstanceState(instanceName);

  if (stateData.instance.state === "open") {
    const instanceInfo = await evolutionAPI.getInstanceInfo(instanceName);
    phoneNumber = instanceInfo.number || instanceInfo.ownerJid;
  }

  res.json({ state, status, phoneNumber });
});
```

**Celebración - QRModal.tsx (línea 54-105):**
- Confetti por 3 segundos
- Toast celebratorio
- Modal se cierra automáticamente
- Invalida queries para refresh de datos

---

## 🔐 Variables de Entorno Críticas

### En Replit Secrets:

```bash
# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your_api_key

# n8n Webhook (CRÍTICO)
N8N_WEBHOOK_URL=https://n8nqr.cloude.es/webhook/evolution1

# Backend URL (para webhooks si se necesitara)
SERVER_URL=https://whatsapp.cloude.es
APP_URL=https://whatsapp.cloude.es

# GoHighLevel OAuth
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret

# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Session
SESSION_SECRET=your_random_secret
```

### En Frontend (.env):

```bash
VITE_GHL_CLIENT_ID=your_client_id  # DEBE ser igual a GHL_CLIENT_ID
```

---

## 🔄 Flujo de Creación de Instancia

1. **Usuario crea instancia** → `POST /api/instances/:id/generate-qr`
2. **Backend crea instancia en Evolution API** → `evolutionAPI.createInstance()`
3. **Backend configura webhook automáticamente** → `evolutionAPI.setWebhook(instanceName, N8N_WEBHOOK_URL)`
4. **Backend genera QR** → `evolutionAPI.getQRCode()`
5. **Frontend abre modal QR** → Inicia polling cada 1s
6. **Usuario escanea QR** → Evolution API notifica a n8n
7. **Polling detecta conexión** → `state === "open"`
8. **Frontend celebra** → Confetti + Toast + Auto-close

---

## 🎯 OAuth Flow (GoHighLevel)

### Implementación: Popup en Frontend

**Componente:** `GhlInstallPopup.tsx`

**Flujo:**
1. Usuario hace clic "Conectar con GoHighLevel"
2. Frontend abre popup OAuth → `https://marketplace.gohighlevel.com/oauth/chooselocation`
3. Usuario autoriza en GHL
4. GHL redirige a → `${APP_URL}/api/auth/oauth/callback?code=xxx`
5. Backend procesa callback → `POST /api/auth/oauth/callback`
6. Backend obtiene tokens, crea subcuenta
7. Backend renderiza HTML con postMessage al opener
8. Frontend recibe mensaje → `ghl-oauth-success`
9. Frontend cierra popup y recarga subcuentas

**Por qué popup y no redirect:**
- Mejor UX - usuario no sale de la app
- Permite comunicación parent-child window
- Estado de la app se mantiene

---

## 📊 Base de Datos - Schema Principal

### Tablas Clave:

**users:**
- `id`, `email`, `role` (system_admin, admin, end_user)
- `stripeCustomerId`, `subscriptionStatus`

**subaccounts:**
- `id`, `userId`, `ghlLocationId`
- `ghlAccessToken`, `ghlRefreshToken`
- `companyName`, `subscriptionStatus`

**whatsappInstances:**
- `id`, `subaccountId`, `evolutionInstanceName`
- `phoneNumber`, `status` (pending, connected, disconnected)
- `qrCode`, `connectedAt`

---

## 🚨 Problemas Comunes y Soluciones

### ❌ QR no desaparece después de escanear

**Causas:**
- Polling no está corriendo (verificar logs del navegador)
- Evolution API no devuelve `state: "open"` (verificar endpoint `/status`)
- phoneNumber no se obtiene correctamente

**Solución:**
- Verificar logs en consola del navegador: `📊 Polling check: state=...`
- Verificar que `/api/instances/:id/status` devuelve datos correctos
- El polling DEBE seguir corriendo hasta detectar `state === "open"`

### ❌ Mensajes no llegan a n8n

**Causas:**
- `N8N_WEBHOOK_URL` no configurado en Replit Secrets
- Webhook no se configuró en la instancia
- URL de n8n incorrecta

**Solución:**
- Verificar en logs de Replit al crear instancia:
  ```
  📡 Webhook URL n8n: https://n8nqr.cloude.es/webhook/evolution1
  ✅ Webhook configurado exitosamente apuntando a n8n
  ```
- Verificar en Evolution API settings que la URL sea la correcta
- Testear webhook de n8n independientemente

### ❌ OAuth popup se queda en "Autorizando..."

**Causas:**
- postMessage no llega al parent window
- Callback HTML no se renderiza correctamente
- CORS o security policy bloquea comunicación

**Solución:**
- Verificar en `server/routes.ts` que el callback renderiza HTML con postMessage
- Verificar que el origen del mensaje es correcto (window.location.origin)
- Abrir DevTools en el popup para ver errores

---

## 🔧 Endpoints API Importantes

### Instancias WhatsApp

```
POST   /api/instances/:id/generate-qr       # Generar QR
GET    /api/instances/:id/status            # Estado actual (polling)
GET    /api/instances/:id                   # Info de instancia
DELETE /api/instances/:id                   # Eliminar instancia
GET    /api/instances/user/:userId          # Todas las instancias del usuario
GET    /api/instances/subaccount            # Por subaccount (desde token GHL)
```

### OAuth GoHighLevel

```
GET    /api/auth/oauth/callback             # Callback OAuth (HTML response)
POST   /api/auth/oauth/callback             # Process OAuth (JSON response)
```

### Subcuentas

```
GET    /api/subaccounts/user/:userId        # Subcuentas del usuario
POST   /api/subaccounts                     # Crear subcuenta manual
```

---

## 📱 Frontend - Componentes Clave

### QRModal.tsx
- Genera QR
- Polling cada 1s para detectar conexión
- Confetti celebration
- Auto-close después de 3s

### GhlInstallPopup.tsx
- OAuth popup flow
- postMessage communication
- Estado de autorización

### Dashboard.tsx
- Lista de subcuentas/locations
- Estado de conexión WhatsApp
- Integración con Stripe billing

---

## 🎨 Tecnologías Utilizadas

**Frontend:**
- React + TypeScript
- Vite
- TanStack Query (data fetching)
- Wouter (routing)
- Shadcn UI (components)
- Socket.IO Client (WebSocket)
- canvas-confetti (celebrations)

**Backend:**
- Express.js
- PostgreSQL + Drizzle ORM
- Socket.IO (WebSocket server)
- Stripe (billing)
- Evolution API Client

**Infrastructure:**
- Replit (backend hosting)
- Coolify (Evolution API hosting)
- n8n (automation platform)

---

## 📝 Notas de Desarrollo

### Por qué webhook NO apunta al backend:

**Opción descartada:** Evolution API → Backend → n8n
- ❌ Sobrecarga del backend con miles de mensajes/segundo
- ❌ Latencia adicional (dos saltos en lugar de uno)
- ❌ Punto de fallo adicional

**Opción elegida:** Evolution API → n8n directo ✅
- ✅ Menor latencia
- ✅ Backend no se sobrecarga
- ✅ n8n y Evolution API están en el mismo servidor (latencia mínima)
- ✅ Polling cada 1s es suficiente para UX de confetti

### Polling vs WebSocket para QR:

**Por qué polling está bien aquí:**
- Solo se usa durante escaneo de QR (evento temporal, ~30 segundos)
- 1 request/segundo es bajo overhead
- Más confiable que WebSocket (no depende de configuraciones complejas)
- Funciona aunque webhook falle o n8n no reenvíe eventos

---

## 🔄 Historial de Cambios Importantes

### 2025-01-XX: Webhook directo a n8n
- Cambió de `Evolution → Backend → n8n` a `Evolution → n8n directo`
- Polling mejorado a 1 segundo
- Auto-configuración de webhook al crear instancia

### 2025-01-XX: OAuth Popup Implementation
- Cambió de redirect a popup para mejor UX
- Implementado postMessage para comunicación parent-child
- Callback renderiza HTML en lugar de redirect

### 2025-01-XX: QR Auto-close con Confetti
- Implementado sistema dual: WebSocket + Polling
- Confetti celebration con canvas-confetti
- Auto-close después de 3 segundos

---

## 📚 Referencias

- Evolution API Docs: https://doc.evolution-api.com/
- GoHighLevel API: https://highlevel.stoplight.io/
- n8n Documentation: https://docs.n8n.io/
- Stripe Integration: https://stripe.com/docs

---

**Última actualización:** 2025-01-15
**Mantenido por:** Ray Alvarado + Claude Code
