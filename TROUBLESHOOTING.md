# 🔧 Troubleshooting Guide - Evolution API + WebSocket

## 📊 Configuración de Evolution API (Coolify)

### Variables críticas configuradas:

```bash
# URLs y autenticación
SERVICE_URL_API=https://evolution.cloude.es
SERVICE_URL_EVO=https://evolution.cloude.es
AUTHENTICATION_API_KEY=wxlXKaZ7lhOYGJgMj5t042opZduMi51M

# Webhooks (IMPORTANTE)
WEBHOOK_GLOBAL_ENABLED=true  # ✅ DEBE estar en TRUE
WEBHOOK_GLOBAL_URL=https://ray.cloude.es/webhook/mensajerecibido  # Para n8n
WEBHOOK_EVENTS_CONNECTION_UPDATE=true  # ✅ Crítico para detectar conexiones
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true

# WebSocket (Evolution API)
WEBSOCKET_ENABLED=false  # ✅ Mantener en FALSE (no se necesita)
WEBSOCKET_GLOBAL_EVENTS=false  # ✅ Mantener en FALSE
```

---

## 🔌 Variables de entorno en Replit

### Secrets configurados:

```bash
EVOLUTION_API_URL=https://evolution.cloude.es
EVOLUTION_API_KEY=wxlXKaZ7lhOYGJgMj5t042opZduMi51M
```

**Verificación**: Si puede crear instancias automáticamente en Evolution API, las variables están correctas.

---

## 🔄 Flujo de WebSocket/Webhook (Cómo debería funcionar)

### Arquitectura:

```
1. Usuario genera QR en frontend
   ↓
2. Frontend → Backend: POST /api/instances/:id/generate-qr
   ↓
3. Backend → Evolution API: createInstance() + setWebhook()
   ↓
4. Backend configura webhook: https://whatsapp.cloude.es/api/webhooks/evolution
   ↓
5. Usuario escanea QR con WhatsApp
   ↓
6. Evolution API detecta conexión (state=open)
   ↓
7. Evolution API → Backend: POST /api/webhooks/evolution
   ↓
8. Backend actualiza BD + emite evento Socket.io
   ↓
9. Frontend (QRModal.tsx) recibe evento "instance-connected"
   ↓
10. Frontend muestra confetti + número + cierra modal
```

### Endpoints importantes:

- **Generación QR**: `POST /api/instances/:id/generate-qr` (routes.ts línea 2100-2152)
- **Webhook Evolution**: `POST /api/webhooks/evolution` (routes.ts línea 2366-2467)
- **Socket.io setup**: `server/index.ts` (líneas 55-79)

---

## 🐛 Problema: Confetti no aparece y necesita refresh

### Síntomas:
- ❌ QR no se quita automáticamente
- ❌ No aparece confetti al escanear
- ❌ Necesita refresh para ver el número
- ❌ Estado no se actualiza en tiempo real

### Posibles causas:

#### 1. Webhook no configurado en Evolution API
**Verificar**: Logs de Replit cuando generas QR deberían mostrar:
```
🔗 Configuring webhook for instance wa-xxx: https://whatsapp.cloude.es/api/webhooks/evolution
✅ Webhook configured successfully
```

Si no aparece o muestra error, el webhook no se está configurando.

#### 2. Evolution API no envía eventos
**Verificar**: Logs de Replit cuando escaneas QR deberían mostrar:
```
Evolution API webhook received: { event: 'connection.update', instance: '...', data: { state: 'open' } }
Processing connection update for instance xxx: state=open
Instance xxx connected with phone 18094973030
```

Si no aparece nada, Evolution API no está enviando el webhook.

**Solución potencial**:
- Verificar que `WEBHOOK_GLOBAL_ENABLED=true` en Evolution API
- Reiniciar servicio de Evolution API
- Verificar que Evolution API puede acceder a `https://whatsapp.cloude.es`

#### 3. Socket.io no conectado en frontend
**Verificar**: Console del navegador (F12) debería mostrar:
```
Connected to WebSocket
```

Si no aparece, el WebSocket frontend-backend no está conectando.

**Archivo**: `client/src/components/QRModal.tsx` (líneas 58-134)

#### 4. Firewall bloqueando webhooks
Evolution API en Coolify podría no poder hacer POST a `whatsapp.cloude.es`.

**Verificar**: Desde Coolify/Evolution API, intentar:
```bash
curl -X POST https://whatsapp.cloude.es/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"test","instance":"test"}'
```

Debería responder `200 OK`.

---

## 🔍 Pasos de diagnóstico

### Test completo:

1. **Limpiar logs de Replit y consola del navegador**

2. **Generar QR nuevo**
   - Ir a subcuenta → Crear instancia
   - Click "Generar QR"

3. **Verificar logs de Replit** (deberían aparecer inmediatamente):
   ```
   ✅ 🆕 Creating fresh instance wa-xxx
   ✅ 🔗 Configuring webhook for instance wa-xxx
   ✅ ✅ Webhook configured successfully
   ```

4. **Verificar consola del navegador**:
   ```
   ✅ Connected to WebSocket
   ```

5. **Escanear QR con WhatsApp**

6. **Verificar logs de Replit** (deberían aparecer al escanear):
   ```
   ✅ Evolution API webhook received: ...
   ✅ Processing connection update for instance xxx: state=open
   ✅ Instance xxx connected with phone 18094973030
   ```

7. **Verificar consola del navegador**:
   ```
   ✅ instance-connected { instanceId: xxx, phoneNumber: xxx }
   ```

8. **Verificar UI**:
   - ✅ Confetti aparece
   - ✅ Número de teléfono se muestra
   - ✅ Modal se cierra automáticamente

### Si alguno falla:

**❌ Paso 3 falla** → Problema en código de configuración de webhook
- Revisar: `server/routes.ts` línea 2126-2136
- Verificar que Evolution API esté accesible

**❌ Paso 4 falla** → Problema de Socket.io en frontend
- Revisar: `client/src/components/QRModal.tsx` línea 58
- Verificar: `server/index.ts` configuración de CORS

**❌ Paso 6 falla** → Evolution API no envía webhook
- Verificar `WEBHOOK_GLOBAL_ENABLED=true` en Coolify
- Verificar que Evolution API puede acceder a tu servidor
- Revisar logs de Evolution API en Coolify

**❌ Paso 7 falla** → Socket.io no emite o frontend no escucha
- Revisar: `server/routes.ts` línea 2418-2421 (emisión)
- Revisar: `client/src/components/QRModal.tsx` línea 65-116 (escucha)

---

## 📝 Commits relevantes

### Últimos cambios importantes:

- `24e06ad` - feat: configurar webhook de Evolution API y WebSocket en tiempo real
- `19cd514` - fix: corregir visualización de instancias en panel de administrador
- `e1d59f0` - feat: agregar confetti en conexión WhatsApp y editor de nombre personalizado
- `14f53f1` - fix: invalidar cache al reclamar subcuenta para mostrar múltiples subcuentas

---

## 🎯 Problemas conocidos

### 1. Pending Claim aparece en lista de empresas
**Causa**: Sistema crea empresas temporales con ID "PENDING_CLAIM" durante el registro.

**Solución temporal**: Filtrar en `getCompaniesByStatus()`:
```typescript
const filteredCompanies = companiesData.filter(company =>
  company.name !== 'Default Company' &&
  company.name !== 'Pending Claim' &&
  company.id !== 'PENDING_CLAIM' &&
  !company.email?.includes('ramautos.do') &&
  !company.email?.includes('system.internal')
);
```

### 2. Conteos incorrectos (Empresas y Subcuentas)
**Causa**: Contadores incluyen subcuentas LOCAL_ y registros del sistema.

**Solución**: Aplicar mismos filtros que las listas a los queries de conteo.

### 3. Solo aparece última subcuenta instalada
**Estado**: ✅ RESUELTO (commit 14f53f1)
**Solución**: Invalidar cache de React Query al reclamar subcuenta.

---

## 🆘 Contacto de soporte

Si necesitas ayuda:
1. Recopilar logs completos (Replit + Navegador)
2. Documentar pasos exactos para reproducir
3. Verificar esta guía primero
4. Incluir commit/versión actual del código

---

**Última actualización**: 2025-01-31
**Versión del documento**: 1.0
