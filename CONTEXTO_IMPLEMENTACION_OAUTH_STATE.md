# Contexto: Implementación de OAuth State para Validación de Propietario de Subcuenta

## Fecha
2025-10-31

## Problema Original

### Síntomas
- Las subcuentas se estaban creando en la base de datos
- Pero eran asignadas a la empresa 'PENDING_CLAIM' en lugar de al usuario real
- Las instancias de WhatsApp NO se estaban creando automáticamente
- El flujo OAuth debería conectar la subcuenta al usuario que instaló la app de GHL

### Arquitectura del Negocio
1. Ray es el administrador del sistema (empresa default)
2. Los usuarios se registran y se convierten en clientes
3. Cada usuario puede instalar la app de GHL y conectar múltiples subcuentas
4. Cada subcuenta representa una ubicación de GHL con automatización de WhatsApp
5. Cada subcuenta debe pertenecer al usuario que la instaló

### Flujo de Datos
```
Usuario registrado → Login en app → Click "Agregar Subcuenta"
  → Redirección a GHL OAuth
  → GHL redirige a n8n webhook (ray.cloude.es/webhook/registrocuenta)
  → n8n guarda tokens en PostgreSQL (tabla ghl_clientes)
  → n8n envía webhook a app (whatsapp.cloude.es/api/webhooks/register-subaccount)
  → App crea subcuenta + instancia de WhatsApp
```

## Causa Raíz del Problema

### Análisis del Código Backend
El código en `server/routes.ts` (líneas 726-930) tiene dos flujos diferentes:

**CON OAuth state (líneas 762-799):**
```typescript
if (validatedData.state) {
  const oauthState = await storage.getOAuthState(validatedData.state);
  if (oauthState) {
    ownerCompanyId = oauthState.companyId;
    ownerUserId = oauthState.userId;
    ownerEmail = oauthState.userEmail;
  }
}
```

**SIN OAuth state (líneas 802-818):**
```typescript
let companyId: string = 'PENDING_CLAIM';
if (ownerCompanyId) {
  companyId = company.id;
}
```

**Creación de instancia WhatsApp (líneas 866-891):**
```typescript
if (ownerCompanyId) {
  // Solo crea instancia si hay un propietario validado
  const instance = await storage.createWhatsappInstance({...});
}
```

### El Problema
- El flujo de n8n NO estaba pasando el parámetro `state`
- Sin `state`, el código no podía validar quién instaló la app
- Por lo tanto: `ownerCompanyId` quedaba `undefined`
- Resultado: subcuenta → 'PENDING_CLAIM', sin instancia de WhatsApp

## Solución Implementada

### 1. Modificación del Frontend
**Archivo:** `client/src/components/AddSubaccountModal.tsx`

**Cambio:** Modificar `handleConnectGHL` de síncrono a asíncrono para generar OAuth state antes de redirigir:

```typescript
const handleConnectGHL = async () => {
  try {
    // 1. Generar OAuth state con el usuario actual
    const response = await fetch('/api/ghl/generate-oauth-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Importante para enviar cookies de sesión
    });

    if (!response.ok) {
      throw new Error('Error al generar OAuth state');
    }

    const { state } = await response.json();
    console.log('✅ OAuth state generado:', state);

    // 2. Construir URL de GHL con el state
    const ghlInstallerUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https://ray.cloude.es/webhook/registrocuenta&client_id=${
      import.meta.env.VITE_GHL_CLIENT_ID || ""
    }&scope=locations.readonly contacts.readonly&state=${state}`;

    // 3. Redirigir a GHL
    window.location.href = ghlInstallerUrl;
  } catch (error) {
    console.error('Error al conectar con GHL:', error);
    alert('Error al conectar con GoHighLevel. Por favor intenta de nuevo.');
  }
};
```

**Endpoint utilizado:** `/api/ghl/generate-oauth-state` (ya existía en `server/routes.ts` líneas 1455-1485)

### 2. Actualización del Workflow de n8n
**Archivo creado:** `N8N_WORKFLOW_CORREGIDO.json`

#### Cambios clave:

**Nodo 1 - "Code in JavaScript":**
```javascript
// Extraer code y state del webhook de GHL
const code = $input.item.json.query?.code || $input.item.json.code;
const state = $input.item.json.query?.state || $input.item.json.state;

if (!code) {
  throw new Error('❌ No se encontró el código de autorización');
}

console.log('✅ Código de autorización recibido:', code);
console.log('🔐 OAuth state recibido:', state || 'Sin state (instalación sin validación)');

return {
  code: code,
  state: state || null
};
```

**Nodo 2 - "HTTP Request5" (intercambio de código por tokens):**
```json
{
  "method": "POST",
  "url": "https://services.leadconnectorhq.com/oauth/token",
  "bodyParameters": {
    "parameters": [
      {"name": "client_id", "value": "YOUR_CLIENT_ID"},
      {"name": "client_secret", "value": "YOUR_CLIENT_SECRET"},
      {"name": "grant_type", "value": "authorization_code"},
      {"name": "code", "value": "={{ $('Code in JavaScript').item.json.code }}"},
      {"name": "redirect_uri", "value": "https://ray.cloude.es/webhook/registrocuenta"}
    ]
  }
}
```

**Nodo 3 - "HTTP Request" (webhook final a app):**
```json
{
  "method": "POST",
  "url": "https://whatsapp.cloude.es/api/webhooks/register-subaccount",
  "contentType": "json",
  "specifyBody": "json",
  "jsonBody": "={{ JSON.stringify({
    email: $('insertar tabla nuevas').item.json.email_cliente,
    name: $('insertar tabla nuevas').item.json.nombre_cliente,
    phone: $('insertar tabla nuevas').item.json.telefono_cliente,
    locationId: $('insertar tabla nuevas').item.json.locationid,
    ghlCompanyId: $('insertar tabla nuevas').item.json.companyid,
    locationName: $('insertar tabla nuevas').item.json.subcuenta,
    state: $('Code in JavaScript').item.json.state
  }) }}"
}
```

**Nodo 4 - "enviar a whatsapp ai" (redirección al claim):**
```json
{
  "responseCode": 302,
  "headers": {
    "Location": "=https://whatsapp.cloude.es/claim-subaccount?locationId={{ $('HTTP Request').item.json.subaccount.locationId }}"
  }
}
```

### 3. Git Push a GitHub
```bash
cd ~/Desktop/ghl/EvolutionGHLConnect
git add client/src/components/AddSubaccountModal.tsx
git commit -m "feat: agregar OAuth state para validar propietario de subcuenta"
git pull --rebase  # Resolver conflicto non-fast-forward
git push origin main  # Commit e619614
```

**Resultado:** Replit auto-deploy detecta el cambio en 10-30 segundos

## Endpoints Relevantes del Backend

### 1. `/api/ghl/generate-oauth-state` (POST)
**Ubicación:** `server/routes.ts:1455-1485`
**Autenticación:** Requiere usuario logueado (middleware `isAuthenticated`)
**Función:**
- Genera un token aleatorio de 64 caracteres hex
- Guarda en tabla `oauth_states` con userId, companyId, email
- Expira en 10 minutos
- Retorna: `{ state: "..." }`

### 2. `/api/webhooks/register-subaccount` (POST)
**Ubicación:** `server/routes.ts:726-930`
**Autenticación:** Ninguna (webhook público)
**Función:**
- Recibe datos de n8n
- Valida OAuth state si existe
- Crea o encuentra empresa
- Crea subcuenta con companyId correcto
- Crea instancia de WhatsApp si hay propietario validado
- Retorna datos de subcuenta creada

### 3. Funciones de Storage OAuth State
**Ubicación:** `server/storage.ts:575-601`

```typescript
async createOAuthState(state: InsertOAuthState): Promise<OAuthState>
async getOAuthState(state: string): Promise<OAuthState | undefined>
async markOAuthStateAsUsed(state: string): Promise<void>
async cleanupExpiredOAuthStates(): Promise<void>
```

## Estructura de Datos

### Tabla `oauth_states`
```typescript
{
  state: string;          // Token hex de 64 caracteres
  userId: string;         // ID del usuario que inició OAuth
  companyId: string;      // ID de la empresa del usuario
  userEmail: string;      // Email del usuario
  expiresAt: Date;        // Expira en 10 minutos
  used: boolean;          // Marcado como usado después de validar
  createdAt: Date;
}
```

### Webhook Data (n8n → app)
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "locationId": "ghl_location_id",
  "ghlCompanyId": "ghl_company_id",
  "locationName": "Mi Ubicación",
  "state": "abc123...xyz789"
}
```

## Pasos de Prueba

### 1. Verificar Auto-Deploy en Replit
- Esperar 30 segundos después del git push
- Verificar que el último commit aparezca en Replit

### 2. Importar Workflow Corregido
- Abrir n8n
- Importar `N8N_WORKFLOW_CORREGIDO.json`
- Actualizar `client_id` y `client_secret` de GHL
- Activar workflow

### 3. Probar Flujo OAuth Completo
1. **Login como usuario registrado** (no como admin)
2. **Abrir consola del navegador** (F12 → Console)
3. **Click "Agregar Subcuenta"**
4. **Verificar en consola:**
   - Debe aparecer: `✅ OAuth state generado: [hash]`
5. **Completar OAuth en GHL:**
   - Seleccionar ubicación
   - Autorizar app
6. **Verificar en PostgreSQL:**
   - Subcuenta debe tener `companyid` del usuario (NO 'PENDING_CLAIM')
   - Debe existir instancia de WhatsApp creada

### 4. Logs a Revisar si Falla
- **n8n:** Ver si recibe el parámetro `state`
- **Replit:** Ver errores del webhook `/api/webhooks/register-subaccount`
- **Consola navegador:** Ver errores de frontend o llamada a `/api/ghl/generate-oauth-state`

## Flujo OAuth Completo (Con State)

```
1. Usuario login → app guarda sesión con userId + companyId

2. Usuario click "Agregar Subcuenta"
   → Frontend llama POST /api/ghl/generate-oauth-state
   → Backend genera state y lo guarda en DB con userId/companyId
   → Frontend recibe state

3. Frontend redirige a GHL con state en URL:
   https://marketplace.gohighlevel.com/oauth/chooselocation?
     response_type=code&
     redirect_uri=https://ray.cloude.es/webhook/registrocuenta&
     client_id=XXX&
     scope=locations.readonly contacts.readonly&
     state=abc123...xyz789

4. Usuario autoriza en GHL
   → GHL redirige a: https://ray.cloude.es/webhook/registrocuenta?code=YYY&state=abc123...xyz789

5. n8n recibe webhook:
   → Extrae code y state
   → Intercambia code por tokens con GHL
   → Guarda tokens en PostgreSQL (tabla ghl_clientes)
   → Envía webhook a app con state incluido

6. App recibe webhook:
   → Valida state en DB
   → Obtiene userId y companyId asociados al state
   → Crea subcuenta con companyId correcto
   → Crea instancia de WhatsApp
   → Marca state como usado
```

## Tecnologías Involucradas

- **Backend:** TypeScript + Express.js
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **OAuth Provider:** GoHighLevel (GHL)
- **WhatsApp API:** Evolution API
- **Workflow:** n8n
- **Deploy:** Replit (auto-deploy desde GitHub)
- **Version Control:** Git + GitHub

## URLs del Sistema

- **App principal:** https://whatsapp.cloude.es
- **Webhook GHL (n8n):** https://ray.cloude.es/webhook/registrocuenta
- **GitHub Repo:** https://github.com/ramautos/EvolutionGHLConnect
- **GHL OAuth:** https://marketplace.gohighlevel.com/oauth/chooselocation
- **GHL Token Exchange:** https://services.leadconnectorhq.com/oauth/token

## Archivos Modificados

1. **client/src/components/AddSubaccountModal.tsx**
   - Cambio: handleConnectGHL ahora es async y genera OAuth state

2. **N8N_WORKFLOW_CORREGIDO.json** (nuevo)
   - Extrae state del query parameter
   - Incluye state en webhook final

## Comandos Git Ejecutados

```bash
# Clonar repositorio
git clone https://github.com/ramautos/EvolutionGHLConnect.git
cd EvolutionGHLConnect

# Después de modificar AddSubaccountModal.tsx
git add client/src/components/AddSubaccountModal.tsx
git commit -m "feat: agregar OAuth state para validar propietario de subcuenta"
git pull --rebase  # Resolver non-fast-forward
git push origin main  # Commit hash: e619614
```

## Próximos Pasos (Pendientes)

1. ✅ Código modificado y pusheado a GitHub
2. ✅ Workflow de n8n corregido y guardado
3. ✅ Fix de subcuenta duplicada (commit 8135f67)
4. ✅ Endpoint /api/subaccounts/user agregado
5. ⏳ Importar workflow en n8n
6. ⏳ Probar flujo completo con usuario real
7. ⏳ Verificar que subcuenta se cree con companyId correcto
8. ⏳ Verificar que instancia de WhatsApp se cree automáticamente

## Notas Adicionales

- El backend YA tenía soporte para OAuth state, solo faltaba implementarlo en frontend y n8n
- No se requiere republish manual en Replit, el auto-deploy funciona automáticamente
- El state expira en 10 minutos por seguridad
- El state se marca como "usado" después de validarse, no se puede reutilizar
- Existe un cleanup automático de states expirados en el backend

## Troubleshooting Común

### Problema: "OAuth state generado" no aparece en consola
**Solución:** Verificar que el usuario esté logueado (endpoint requiere autenticación)

### Problema: Subcuenta sigue en 'PENDING_CLAIM'
**Solución:** Verificar que n8n esté enviando el parámetro `state` en el webhook final

### Problema: Instancia de WhatsApp no se crea
**Solución:** Verificar que el state sea válido y que `ownerCompanyId` no sea undefined

### Problema: Git push rechazado (non-fast-forward)
**Solución:**
```bash
git pull --rebase
git push origin main
```

### Problema: Subcuenta del administrador aparece duplicada en la lista
**Causa:** Al registrarse, se crea una subcuenta con `locationId: LOCAL_xxxxx` que no es una ubicación de GHL real, sino la cuenta del administrador de la empresa.

**Solución aplicada (commit 8135f67):**
- Modificado `storage.getSubaccountsByCompany()` para filtrar subcuentas con `locationId` que empiece con `LOCAL_`
- Estas subcuentas NO deben aparecer en la lista de ubicaciones de GHL

### Problema: No se visualizan las subcuentas del usuario
**Causa:** Faltaba el endpoint `/api/subaccounts/user/:userId` en routes.ts

**Solución aplicada (commit 8135f67):**
- Agregado endpoint GET `/api/subaccounts/user/:userId` que:
  - Filtra por companyId del usuario
  - Incluye información de la empresa propietaria (ownerCompany)
  - Requiere autenticación
  - Valida que el usuario solo pueda ver sus propias subcuentas

### Problema: No se muestra el propietario de la subcuenta
**Solución aplicada (commit 8135f67):**
- El endpoint ahora incluye `ownerCompany: { id, name }` en cada subcuenta
- El frontend puede mostrar "Propietario: pedro" en la tabla de subcuentas

---

## Cambios Adicionales (Commit 8135f67)

### Archivos Modificados:

**1. server/routes.ts (líneas 1507-1539)**
```typescript
// Obtener subcuentas del usuario (por companyId)
app.get("/api/subaccounts/user/:userId", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;

    // Verificar que el usuario esté consultando sus propias subcuentas
    if (user.role !== "admin" && user.id !== req.params.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Obtener subcuentas por companyId del usuario
    const subaccounts = await storage.getSubaccountsByCompany(user.companyId);

    // Obtener información de la empresa propietaria
    const company = await storage.getCompany(user.companyId);

    // Agregar información del propietario a cada subcuenta
    const subaccountsWithOwner = subaccounts.map(sub => ({
      ...sub,
      ownerCompany: company ? {
        id: company.id,
        name: company.name,
      } : null
    }));

    res.json(subaccountsWithOwner);
  } catch (error) {
    console.error("Error getting user subaccounts:", error);
    res.status(500).json({ error: "Failed to get subaccounts" });
  }
});
```

**2. server/storage.ts (líneas 237-248)**
```typescript
async getSubaccountsByCompany(companyId: string): Promise<Subaccount[]> {
  const results = await db
    .select()
    .from(subaccounts)
    .where(and(
      eq(subaccounts.companyId, companyId),
      eq(subaccounts.isActive, true)
    ));

  // Filtrar subcuentas locales (creadas en registro, no son ubicaciones de GHL)
  return results.filter(sub => !sub.locationId.startsWith('LOCAL_'));
}
```

---

**Documento creado:** 2025-10-31
**Última actualización:** 2025-10-31 (commit 8135f67)
**Autor:** Claude Code + Ray Alvarado
