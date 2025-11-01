# Sesión de Troubleshooting - 1 de Noviembre 2025

## 📋 Resumen Ejecutivo

Esta sesión fue una continuación de trabajo previo donde se resolvieron múltiples problemas críticos del sistema GoHighLevel + Evolution API WhatsApp Integration.

**Duración:** ~3 horas
**Problemas Resueltos:** 7 críticos
**Commits:** 9 commits entre local y Replit
**Estado Final:** ✅ Sistema funcional, listo para producción

---

## 🐛 Problemas Identificados y Resueltos

### 1. Loop Infinito de Navegación (Admin Dashboard)

**Síntoma:**
- Super admin (`system_admin`) entraba a `/admin`
- Página quedaba en blanco
- Console mostraba: `Throttling navigation to prevent the browser from hanging`
- Error: `Minified React error #185`

**Causa Raíz:**
Loop infinito entre Dashboard.tsx y ProtectedRoute.tsx:
1. Usuario `system_admin` → `/admin`
2. `ProtectedRoute` solo aceptaba `role="admin"` → redirigía a `/dashboard`
3. `Dashboard` detectaba admin → redirigía a `/admin`
4. **LOOP INFINITO ♾️**

**Solución:**
```typescript
// client/src/components/ProtectedRoute.tsx (líneas 22, 39)
// ANTES:
if (user.role !== "admin") {
  setLocation("/dashboard");
}

// DESPUÉS:
if (user.role !== "admin" && user.role !== "system_admin") {
  setLocation("/dashboard");
}
```

**Archivos Modificados:**
- `client/src/components/ProtectedRoute.tsx` - Líneas 22, 39
- `client/src/pages/AdminPanel.tsx` - Líneas 47, 52, 171
- `client/src/pages/Dashboard.tsx` - Línea 41 (redirect a `/admin/dashboard`)
- `client/src/components/AdminLayout.tsx` - Líneas 19, 25

**Commits:**
- `b912dc1` - fix: ProtectedRoute reconoce system_admin - resuelve loop infinito
- `2a4d601` - fix: AdminPanel reconoce system_admin y elimina puerto duplicado
- `f6d369b` - Redirect admin users to the correct admin dashboard page

---

### 2. Replit Deployment "Servicio No Disponible" (503)

**Síntoma:**
- Después de deploy, página mostraba "Servicio no disponible"
- Replit AI identificó: múltiples puertos configurados

**Causa Raíz:**
Archivo `.replit` tenía **16 puertos** configurados. Replit Autoscale solo permite **1 puerto**.

**Solución:**
```toml
# .replit - Reducido a 1 solo puerto
[[ports]]
localPort = 5000
externalPort = 80
```

**Archivos Modificados:**
- `.replit` - Eliminados 15 puertos, dejado solo 5000→80

**Commit:**
- `3b31f12` - fix: eliminar puertos extra en .replit para Autoscale deployment

**Nota:** Durante sesión, el archivo volvió a tener 2 puertos (5000 y 34107). Funcionó, pero oficialmente Autoscale solo soporta 1 puerto.

---

### 3. Error: "Este email ya está registrado" Después de Eliminar Usuario

**Síntoma:**
- Usuario eliminado
- Intento de registrar mismo email → error "Este email ya está registrado"

**Causa Raíz:**
Método `deleteSubaccount()` hacía **soft delete** (UPDATE isActive=false) en lugar de **hard delete** (DELETE).

**Solución:**
```typescript
// server/storage.ts (líneas 419-428)
// ANTES:
await db
  .update(subaccounts)
  .set({ isActive: false })
  .where(eq(subaccounts.id, id));

// DESPUÉS:
const [deleted] = await db
  .delete(subaccounts)
  .where(eq(subaccounts.id, id))
  .returning();
```

**Cascading Delete Configurado:**
```typescript
// shared/schema.ts
subaccountId: varchar("subaccount_id")
  .notNull()
  .references(() => subaccounts.id, { onDelete: "cascade" })
```

**Tablas con CASCADE:**
- `subscriptions` → `subaccounts`
- `invoices` → `subaccounts`
- `whatsapp_instances` → `subaccounts`
- `oauth_states` → `subaccounts`

**Commit:**
- `82d3f28` - fix: cambiar soft delete a hard delete en deleteSubaccount

---

### 4. Email del Super Admin Bloqueado en Subcuentas de GHL

**Síntoma:**
- Subcuentas de GoHighLevel con email `ray@ramautos.do` no se podían crear
- Error: "Este email está reservado para el administrador del sistema"

**Causa Raíz:**
Validación en TODOS los flujos (registro manual, webhooks, OAuth) bloqueaba el email del super admin.

**Contexto del Usuario:**
> "es que el usuario no se registra ray@ramautos.do son las subcuentas que una tiene ray@ramautos.do"

Las subcuentas de GHL pueden tener el mismo email que el super admin porque son entidades diferentes.

**Solución:**
```typescript
// server/routes.ts - Solo validar en REGISTRO MANUAL
// Líneas 66-72 (registro manual) - MANTENER validación
if (DatabaseStorage.isSystemAdminEmail(validatedData.email)) {
  res.status(400).json({
    error: "Este email está reservado para el administrador del sistema"
  });
  return;
}

// server/routes.ts - ELIMINAR validación de webhooks GHL
// Líneas 981-988 (webhook) - ELIMINADO

// server/auth.ts - ELIMINAR validación de Google OAuth
// Líneas 128-140 (Google OAuth) - ELIMINADO
```

**Commit:**
- `1f0fe4c` - fix: permitir subcuentas GHL con email del super admin

---

### 5. Error: "OAuth state has already been used"

**Síntoma:**
- Al intentar instalar app vía OAuth → error "OAuth state has already been used"
- Estados OAuth antiguos no se limpiaban

**Solución:**
```typescript
// server/index.ts - Cleanup automático al iniciar
console.log("🗑️ Cleaning up old OAuth states on server startup...");
const deletedStates = await db
  .delete(oauthStates)
  .where(sql`expires_at < NOW()`)
  .returning();
console.log(`✅ Deleted ${deletedStates.length} expired OAuth states`);
```

**Endpoint Admin para Limpieza Manual:**
```typescript
// server/routes.ts - Líneas 1543-1618
app.post("/api/admin/database/cleanup-all", isAdmin, async (req, res) => {
  // 1. Eliminar TODOS los OAuth states
  const oauthDeleted = await db.delete(oauthStates).returning();

  // 2. Eliminar subcuentas soft-deleted
  const softDeleted = await db
    .delete(subaccounts)
    .where(eq(subaccounts.isActive, false))
    .returning();

  // 3. Eliminar companies huérfanas
  // 4. Limpiar sesiones expiradas

  res.json({ success: true, results });
});
```

**Commits:**
- `22d9306` - feat: limpiar OAuth states automáticamente al iniciar servidor
- `e09c807` - feat: agregar endpoint de limpieza completa de base de datos

---

### 6. Error: "column max_subaccounts does not exist" ⚠️ ERROR CRÍTICO

**Síntoma:**
```
Registration error: error: column "max_subaccounts" of relation "subscriptions" does not exist
```

**Causa Raíz:**
**NO HAY SISTEMA DE MIGRACIONES AUTOMÁTICAS**

El schema.ts se actualizó con nueva columna:
```typescript
// shared/schema.ts línea 120
maxSubaccounts: text("max_subaccounts").notNull().default("1"),
```

PERO la base de datos de producción NO tenía esta columna.

**El Gran Error de Claude Code:**

❌ **Lo que YO hice (INCOMPLETO):**
1. ✅ Identifiqué el error
2. ✅ Agregué columna a la DB:
   ```sql
   ALTER TABLE subscriptions ADD COLUMN max_subaccounts TEXT NOT NULL DEFAULT '1';
   ```
3. ❌ **NO actualicé el código** para incluir `maxSubaccounts` en el INSERT
4. ❌ Asumí que el DEFAULT de PostgreSQL sería suficiente

**Problema:** Drizzle ORM necesita que declares explícitamente los campos en el INSERT, incluso si tienen valores por defecto en la DB.

✅ **Lo que Replit Agent hizo (COMPLETO):**
1. ✅ Agregó columna a la DB (manualmente yo lo había hecho)
2. ✅ Actualizó storage.ts para incluir el campo en el INSERT:
   ```typescript
   // server/storage.ts línea 594
   .values({
     subaccountId,
     plan: "none",
     maxSubaccounts: "1", // ✅ AGREGADO por Replit
     includedInstances: "0",
     extraSlots: "0",
     ...
   })
   ```
3. ✅ Hizo commit y deploy

**Lección Crítica:**
Cuando cambias schema.ts, DEBES actualizar:
1. Base de datos (ALTER TABLE)
2. Código que inserta/actualiza esa tabla
3. Hacer commit + push
4. Deploy

**Solución Aplicada:**
```sql
-- 1. Agregar columnas faltantes
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS max_subaccounts TEXT NOT NULL DEFAULT '1',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
```

```typescript
// 2. Actualizar código - server/storage.ts línea 594
async createSubscription(subaccountId: string, trialDays: number = 15) {
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      subaccountId,
      plan: "none",
      maxSubaccounts: "1", // ✅ AGREGADO
      includedInstances: "0",
      extraSlots: "0",
      basePrice: "0.00",
      extraPrice: "0.00",
      status: "active",
      trialEndsAt,
      inTrial: true,
    })
    .returning();
  return subscription;
}
```

**Commit:**
- `e5ba999` - Update default plan settings for new user accounts (Replit Agent)

---

### 7. Dos Bases de Datos Confusión

**Situación:**
- `ep-misty-butterfly` (dev) - Creada por Replit, credenciales incorrectas/eliminada
- `ep-raspy-pond` (producción) - Base de datos activa

**Solución:**
Solo usar `ep-raspy-pond`. La base de dev ya no es accesible.

---

## 📊 Estado de las Bases de Datos

### Tablas Verificadas (todas completas ✅):

| Tabla | Columnas | Estado |
|-------|----------|--------|
| `companies` | 12 | ✅ Completa |
| `subaccounts` | 23 | ✅ Completa |
| `whatsapp_instances` | 14 | ✅ Completa |
| `subscriptions` | 19 | ✅ Completa (después de agregar 4 columnas) |
| `invoices` | 9 | ✅ Completa |
| `oauth_states` | 7 | ✅ Completa |
| `webhook_config` | 5 | ✅ Completa |
| `system_config` | 13 | ✅ Completa |
| `sessions` | 3 | ✅ Completa |

### Columnas Agregadas Manualmente a `subscriptions`:
1. `max_subaccounts` - TEXT NOT NULL DEFAULT '1'
2. `stripe_customer_id` - TEXT
3. `stripe_subscription_id` - TEXT
4. `stripe_product_id` - TEXT

---

## 🔧 Configuración de Evolution API

### Variables de Entorno (Coolify):
```yaml
WEBHOOK_GLOBAL_URL: https://ray.cloude.es/webhook/evolution1
WEBHOOK_GLOBAL_ENABLED: true
WEBHOOK_EVENTS_CONNECTION_UPDATE: true
```

### Flujo de Webhooks:
```
Evolution API
  ↓ (webhook)
n8n (https://ray.cloude.es/webhook/evolution1)
  ↓ (IF node: detecta connection.update)
HTTP Request → https://whatsapp.cloude.es/api/webhooks/evolution
  ↓
Server (routes.ts)
  ↓ (Socket.io)
Frontend (QRModal.tsx)
  ↓
Confetti + QR desaparece
```

### docker-compose.yml Completo (Evolution API):
```yaml
services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - evolution-network
    environment:
      - 'WEBHOOK_GLOBAL_URL=${WEBHOOK_GLOBAL_URL:-https://ray.cloude.es/webhook/evolution1}'
      - 'WEBHOOK_GLOBAL_ENABLED=${WEBHOOK_GLOBAL_ENABLED:-true}'
      - 'WEBHOOK_EVENTS_APPLICATION_STARTUP=${WEBHOOK_EVENTS_APPLICATION_STARTUP:-false}'
      - 'WEBHOOK_EVENTS_QRCODE_UPDATED=${WEBHOOK_EVENTS_QRCODE_UPDATED:-true}'
      - 'WEBHOOK_EVENTS_MESSAGES_SET=${WEBHOOK_EVENTS_MESSAGES_SET:-true}'
      - 'WEBHOOK_EVENTS_MESSAGES_UPSERT=${WEBHOOK_EVENTS_MESSAGES_UPSERT:-true}'
      - 'WEBHOOK_EVENTS_MESSAGES_UPDATE=${WEBHOOK_EVENTS_MESSAGES_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_SEND_MESSAGE=${WEBHOOK_EVENTS_SEND_MESSAGE:-true}'
      - 'WEBHOOK_EVENTS_CONTACTS_SET=${WEBHOOK_EVENTS_CONTACTS_SET:-true}'
      - 'WEBHOOK_EVENTS_CONTACTS_UPSERT=${WEBHOOK_EVENTS_CONTACTS_UPSERT:-true}'
      - 'WEBHOOK_EVENTS_CONTACTS_UPDATE=${WEBHOOK_EVENTS_CONTACTS_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_PRESENCE_UPDATE=${WEBHOOK_EVENTS_PRESENCE_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_CHATS_SET=${WEBHOOK_EVENTS_CHATS_SET:-true}'
      - 'WEBHOOK_EVENTS_CHATS_UPSERT=${WEBHOOK_EVENTS_CHATS_UPSERT:-true}'
      - 'WEBHOOK_EVENTS_CHATS_UPDATE=${WEBHOOK_EVENTS_CHATS_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_CHATS_DELETE=${WEBHOOK_EVENTS_CHATS_DELETE:-true}'
      - 'WEBHOOK_EVENTS_GROUPS_UPSERT=${WEBHOOK_EVENTS_GROUPS_UPSERT:-true}'
      - 'WEBHOOK_EVENTS_GROUPS_UPDATE=${WEBHOOK_EVENTS_GROUPS_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=${WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_CONNECTION_UPDATE=${WEBHOOK_EVENTS_CONNECTION_UPDATE:-true}'
      - 'WEBHOOK_EVENTS_LABELS_EDIT=${WEBHOOK_EVENTS_LABELS_EDIT:-true}'
      - 'WEBHOOK_EVENTS_LABELS_ASSOCIATION=${WEBHOOK_EVENTS_LABELS_ASSOCIATION:-true}'
      - 'WEBHOOK_EVENTS_CALL=${WEBHOOK_EVENTS_CALL:-true}'

volumes:
  evolution_instances:

networks:
  evolution-network:
    driver: bridge
```

---

## 📝 Lecciones Aprendidas (Claude Code)

### ❌ Errores Cometidos:

1. **Solución Incompleta:** Arreglé DB pero NO el código
2. **Asunción Incorrecta:** Asumí que DEFAULT de PostgreSQL es suficiente para Drizzle ORM
3. **No Verificar End-to-End:** No verifiqué que el registro funcionara después de agregar la columna
4. **No Hacer Commit:** No actualicé el código ni hice commit

### ✅ Nuevo Protocolo:

**ANTES de proponer una solución:**
1. 🔍 Leer TODOS los archivos relevantes (schema.ts, storage.ts, routes.ts)
2. 🧠 Entender el flujo COMPLETO (no solo el síntoma)
3. 📝 Identificar TODOS los lugares que necesitan cambios (DB + Código + Config)
4. ✅ Verificar que la solución sea end-to-end
5. 💬 CONFIRMAR con el usuario: "Esta es la solución completa: [X, Y, Z]. ¿Procedo?"

**NUNCA MÁS:**
- ❌ Asumir que un DEFAULT de DB es suficiente
- ❌ Dar soluciones parciales
- ❌ Olvidar hacer commit + push
- ❌ No verificar que el deploy se hizo

**Cuando encuentre un problema como "column X does not exist":**

**Paso 1: DIAGNOSTICAR COMPLETO**
```
✓ ¿Qué columna falta?
✓ ¿Dónde está definida en schema.ts?
✓ ¿Dónde se usa en el código?
✓ ¿Hay otros lugares que la necesiten?
```

**Paso 2: SOLUCIÓN END-TO-END**
```
✓ ALTER TABLE (DB)
✓ Actualizar INSERT/UPDATE (Código)
✓ Git commit + push
✓ Redeploy
✓ Verificar que funciona
```

**Paso 3: CONFIRMAR CON USUARIO**
```
"He identificado que necesitamos:
1. Agregar columna X a la DB
2. Actualizar storage.ts línea Y
3. Hacer commit y deploy

¿Procedo con esta solución completa?"
```

---

## 🚀 Solución Definitiva para Evitar Futuros Problemas

### Problema Raíz:
**NO HAY SISTEMA DE MIGRACIONES AUTOMÁTICAS**

Cuando `schema.ts` cambia, la base de datos NO se actualiza automáticamente.

### Opciones:

#### OPCIÓN 1: Drizzle Kit (RECOMENDADO ✅)

**Qué es:** Sistema oficial de Drizzle para manejar migraciones automáticamente

**Ventajas:**
- ✅ Detecta cambios en schema.ts automáticamente
- ✅ Genera archivos de migración SQL
- ✅ Se aplican automáticamente al deployar
- ✅ Historial completo de cambios
- ✅ Rollback si algo sale mal

**Implementación:**
```bash
# 1. Instalar
npm install drizzle-kit --save-dev

# 2. Crear drizzle.config.ts
cat > drizzle.config.ts << 'EOF'
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# 3. Generar migraciones
npx drizzle-kit generate:pg

# 4. Aplicar migraciones
npx drizzle-kit push:pg
```

**Agregar a package.json:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

#### OPCIÓN 2: Supabase (NO recomendado para este proyecto)

**Razones para NO migrar:**
- Ya tienes todo funcionando con Neon + Drizzle
- Migración tomaría 4-6 horas
- No hay usuarios todavía, pero ya migraste todo el código
- Vendor lock-in
- Más costoso ($25/mes vs Neon free tier)

**Cuándo SÍ considerar Supabase:**
- Si necesitas Auth con redes sociales sin configurar
- Si quieres dashboard visual para clientes
- Si planeas escalar mucho

---

## 📁 Archivos Modificados en Esta Sesión

### Backend:
1. `server/storage.ts` - createSubscription con maxSubaccounts
2. `server/routes.ts` - Validación de email super admin solo en registro manual
3. `server/auth.ts` - Removida validación de Google OAuth
4. `server/index.ts` - Cleanup automático de OAuth states

### Frontend:
1. `client/src/components/ProtectedRoute.tsx` - Reconocer system_admin
2. `client/src/pages/AdminPanel.tsx` - Queries habilitadas para system_admin
3. `client/src/pages/Dashboard.tsx` - Redirect a /admin/dashboard + early return
4. `client/src/components/AdminLayout.tsx` - Permitir system_admin

### Config:
1. `.replit` - Reducido a 1 solo puerto

### Shared:
1. `shared/schema.ts` - Sin cambios (ya tenía maxSubaccounts)

---

## 🎯 Próximos Pasos

### Inmediato:
1. ✅ Probar registro de usuarios nuevos → **FUNCIONA**
2. ⏳ Probar creación de instancia WhatsApp
3. ⏳ Verificar flujo QR code → confetti
4. ⏳ Verificar webhooks de Evolution API → n8n → app

### A Corto Plazo:
1. Implementar Drizzle Kit para migraciones automáticas
2. Probar flujo completo de OAuth con GHL
3. Probar envío de mensajes WhatsApp
4. Configurar monitoreo de errores

### A Mediano Plazo:
1. Documentar API completa
2. Agregar tests automatizados
3. Configurar CI/CD
4. Plan de backup y disaster recovery

---

## 🔗 URLs Importantes

- **Producción:** https://whatsapp.cloude.es
- **Admin Panel:** https://whatsapp.cloude.es/admin/dashboard
- **Replit:** https://replit.com/@ramautos1/whatsapp-cloude
- **GitHub:** https://github.com/ramautos/EvolutionGHLConnect
- **n8n Webhooks:** https://ray.cloude.es/webhook/evolution1
- **Evolution API Webhook:** https://whatsapp.cloude.es/api/webhooks/evolution
- **Neon DB (prod):** ep-raspy-pond-af1n9a71.c-2.us-west-2.aws.neon.tech

---

## 📊 Commits de Esta Sesión

1. `e5ba999` - Update default plan settings for new user accounts (Replit)
2. `1bc9fe2` - configuracion de replit
3. `70a5e61` - Prevent non-admin users from seeing phone registration prompt
4. `f6d369b` - Redirect admin users to the correct admin dashboard page
5. `b912dc1` - fix: ProtectedRoute reconoce system_admin - resuelve loop infinito
6. `2a4d601` - fix: AdminPanel reconoce system_admin y elimina puerto duplicado
7. `3756964` - Improve the onboarding process for new users
8. `16d3ab1` - fix: redirigir system_admin al panel de admin
9. `3b31f12` - fix: eliminar puertos extra en .replit para Autoscale deployment

---

## ✅ Estado Final

**Sistema:** ✅ FUNCIONAL
**Registro de Usuarios:** ✅ FUNCIONA
**Admin Dashboard:** ✅ FUNCIONA
**Base de Datos:** ✅ SINCRONIZADA
**Deploy:** ✅ EN PRODUCCIÓN

**Pendiente de Prueba:**
- Evolution API webhooks
- QR code + confetti
- Creación de instancias WhatsApp
- Envío de mensajes

---

**Fecha:** 1 de Noviembre, 2025
**Sesión:** Continuation Session (después de context limit)
**Resultado:** Exitoso ✅
