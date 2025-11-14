# Resumen de Sesión - Implementación ElevenLabs Voice ID
**Fecha:** 12 de Noviembre, 2025
**Objetivo:** Agregar campo `elevenLabsVoiceId` a la configuración de API
**Estado Final:** Rollback temporal, sistema estable, reimplementación pendiente

---

## 📋 Resumen Ejecutivo

### Objetivo Principal
Implementar el campo **ElevenLabs Voice ID** para permitir a los usuarios configurar un ID de voz específico junto con su API Key de ElevenLabs. Este campo debe estar disponible en:
- Configuración de perfil (UI)
- Respuestas de API (`/api/v1/user/info` y `/api/v1/location/:locationId/info`)
- Base de datos (tabla `subaccounts`)

### Resultado
La implementación inicial causó un **error de autenticación** en producción debido a que el código intentaba leer una columna que no existía en la base de datos de producción. Se realizó un **rollback temporal** al commit anterior funcional.

### Estado Actual
✅ **Sistema estable y funcional**
✅ **Login funciona** en todos los navegadores
✅ **Registro desde n8n** funciona correctamente
⏸️ **Voice ID** pendiente de reimplementación correcta

---

## 🕐 Cronología de Eventos

### 1. Implementación Inicial (Commit 5e84520)
**Hora:** ~21:00
**Acción:** Implementación completa del campo ElevenLabs Voice ID

**Cambios realizados:**
- ✅ Schema actualizado con campo `elevenLabsVoiceId`
- ✅ Endpoint `/api/user/api-settings` creado
- ✅ UI en Profile.tsx para configuración
- ✅ Migración SQL preparada
- ✅ Build exitoso
- ✅ Push a GitHub

### 2. Problema Detectado (23:20-23:33)
**Síntoma:** Error "Service Unavailable" en producción
**Logs de Replit:**
```
3:33:13 AM [express] POST /api/auth/login 500 in 50ms :: {"error":"Error en autenticación"}
```

**Error en logs:**
```
error: column "eleven_labs_voice_id" does not exist
at DatabaseStorage.getSubaccount
```

**Causa Raíz:**
- El código fue actualizado (commit 5e84520)
- La migración SQL NO fue ejecutada en la BD de producción
- El schema.ts incluía el campo `elevenLabsVoiceId`
- Cualquier SELECT de la tabla `subaccounts` fallaba

### 3. Rollback Ejecutado (Commit 9e86566)
**Hora:** ~23:40
**Acción:** Revertir al commit anterior funcional

**Comandos ejecutados:**
```bash
git reset --hard 9e86566
git push --force origin main
npm install
npm run build
```

**En Replit:**
```bash
git fetch origin
git reset --hard origin/main
npm install
npm run build
npm start
```

### 4. Resolución (23:50+)
**Resultado:**
- ✅ Servidor reiniciado correctamente
- ✅ Login funcional en todos navegadores
- ✅ Registro desde n8n funcional
- ✅ Sistema estable

### 5. Problema Adicional: Registro desde n8n
**Error detectado:** Foreign key constraint violation al registrar clientes

**Error específico:**
```
insert or update on table "subaccounts" violates foreign key constraint
"subaccounts_company_id_companies_id_fk"
```

**Estado:** Resuelto (no especificado cómo, usuario confirmó solución)

---

## 💻 Cambios Técnicos Implementados (Revertidos)

### 1. Base de Datos - shared/schema.ts

**Línea 77:** Agregado campo a tabla `subaccounts`
```typescript
elevenLabsApiKey: text("eleven_labs_api_key"),
elevenLabsVoiceId: text("eleven_labs_voice_id"),  // NUEVO
geminiApiKey: text("gemini_api_key"),
```

**Línea 361:** Actualizado schema de validación
```typescript
export const updateSubaccountApiSettingsSchema = z.object({
  elevenLabsApiKey: z.string().optional(),
  elevenLabsVoiceId: z.string().optional(),  // NUEVO
  geminiApiKey: z.string().optional(),
  notificationPhone: z.string().optional(),
  triggerName: z.string().optional(),
  triggerTag: z.string().optional(),
});
```

### 2. Backend - server/routes.ts

**Líneas 414-439:** Nuevo endpoint para actualizar configuración de API
```typescript
app.patch("/api/user/api-settings", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const validatedData = updateSubaccountApiSettingsSchema.parse(req.body);

    const updatedUser = await storage.updateSubaccount(user.id, validatedData);

    if (!updatedUser) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    req.user = updatedUser;

    const { passwordHash: _, googleId: __, ...userWithoutSensitive } = updatedUser;
    res.json(userWithoutSensitive);
  } catch (error: any) {
    console.error("Error al actualizar configuración de API:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Error al actualizar la configuración de API" });
  }
});
```

**Línea 1574:** Actualizado endpoint `/api/v1/user/info`
```typescript
apiKeys: {
  openai: user.openaiApiKey || null,
  elevenlabs: user.elevenLabsApiKey || null,
  elevenLabsVoiceId: user.elevenLabsVoiceId || null,  // NUEVO
  gemini: user.geminiApiKey || null,
},
```

**Línea 1689:** Actualizado endpoint `/api/v1/location/:locationId/info`
```typescript
apiKeys: {
  openai: targetSubaccount.openaiApiKey || null,
  elevenlabs: targetSubaccount.elevenLabsApiKey || null,
  elevenLabsVoiceId: targetSubaccount.elevenLabsVoiceId || null,  // NUEVO
  gemini: targetSubaccount.geminiApiKey || null,
},
```

### 3. Frontend - client/src/pages/Profile.tsx

**Líneas 36-38:** Estados para configuración de API
```typescript
const [elevenLabsApiKey, setElevenLabsApiKey] = useState((user as any)?.elevenLabsApiKey || "");
const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState((user as any)?.elevenLabsVoiceId || "");
const [geminiApiKey, setGeminiApiKey] = useState((user as any)?.geminiApiKey || "");
```

**Líneas 106-135:** Mutación para actualizar configuración
```typescript
const updateApiSettingsMutation = useMutation({
  mutationFn: async (data: { elevenLabsApiKey?: string; elevenLabsVoiceId?: string; geminiApiKey?: string }) => {
    const response = await fetch("/api/user/api-settings", {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Error al actualizar configuración de API");
    }
    return response.json();
  },
  onSuccess: async () => {
    await refetch();
    toast({
      title: "Configuración actualizada",
      description: "Tus API keys se han actualizado exitosamente.",
    });
  },
  // ...
});
```

**Líneas 401-467:** Nueva sección "Configuración de API" en UI
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Key className="w-5 h-5" />
      Configuración de API
    </CardTitle>
    <CardDescription>
      Configura tus API keys para servicios de terceros
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleUpdateApiSettings} className="space-y-4">
      {/* ElevenLabs API Key */}
      <div className="space-y-2">
        <Label htmlFor="elevenlabs-api-key">ElevenLabs API Key</Label>
        <Input
          id="elevenlabs-api-key"
          type="text"
          value={elevenLabsApiKey}
          onChange={(e) => setElevenLabsApiKey(e.target.value)}
          placeholder="tu-api-key-de-elevenlabs"
        />
      </div>

      {/* ElevenLabs Voice ID - NUEVO */}
      <div className="space-y-2">
        <Label htmlFor="elevenlabs-voice-id">ElevenLabs Voice ID</Label>
        <Input
          id="elevenlabs-voice-id"
          type="text"
          value={elevenLabsVoiceId}
          onChange={(e) => setElevenLabsVoiceId(e.target.value)}
          placeholder="voice-id-de-elevenlabs"
        />
        <p className="text-xs text-muted-foreground">
          ID de voz específica para usar en ElevenLabs
        </p>
      </div>

      {/* Gemini API Key */}
      <div className="space-y-2">
        <Label htmlFor="gemini-api-key">Gemini API Key</Label>
        <Input
          id="gemini-api-key"
          type="text"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          placeholder="tu-api-key-de-gemini"
        />
      </div>

      <Button type="submit" disabled={updateApiSettingsMutation.isPending}>
        {updateApiSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </form>
  </CardContent>
</Card>
```

### 4. Migración SQL - migration-elevenlabs-voice-id.sql

**Archivo creado:**
```sql
-- ============================================
-- Migration: Add elevenLabsVoiceId column
-- Date: 2025-11-10
-- Description: Añade el campo elevenLabsVoiceId a la tabla subaccounts
-- ============================================

-- Agregar columna eleven_labs_voice_id a la tabla subaccounts
ALTER TABLE subaccounts
ADD COLUMN eleven_labs_voice_id TEXT;

-- Verificar que la columna se agregó correctamente
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'subaccounts'
-- AND column_name = 'eleven_labs_voice_id';
```

**⚠️ IMPORTANTE:** Esta migración fue ejecutada en la base de datos de testing/desarrollo pero **NO en la base de datos de producción de Replit**, causando el error de autenticación.

---

## 🔴 Problemas Encontrados

### Problema 1: Error de Autenticación (CRÍTICO)

**Síntomas:**
- Login fallaba con error 500
- Mensaje: "Error en autenticación"
- Navegadores: Chrome, Safari, Firefox (todos afectados)

**Error en logs:**
```
error: column "eleven_labs_voice_id" does not exist
at file:///home/runner/workspace/node_modules/@neondatabase/serverless/index.mjs:1345:74
at async DatabaseStorage.getSubaccount (file:///home/runner/workspace/dist/index.js:854:26)
```

**Causa Raíz:**
1. El código fue actualizado con `elevenLabsVoiceId` en el schema
2. Drizzle ORM genera SELECT con TODOS los campos del schema
3. La migración NO fue ejecutada en la BD de producción
4. Cada consulta a `subaccounts` incluía `eleven_labs_voice_id`
5. PostgreSQL retornaba error por columna inexistente
6. El proceso de autenticación llamaba `getSubaccount()` → ERROR

**Lección Aprendida:**
> **SIEMPRE ejecutar migraciones de BD ANTES de actualizar el código en producción**

**Orden correcto:**
1. ✅ Ejecutar migración SQL en producción
2. ✅ Verificar que columna existe
3. ✅ Actualizar código
4. ✅ Deploy
5. ✅ Probar

**Orden incorrecto (lo que hicimos):**
1. ❌ Actualizar código
2. ❌ Deploy
3. ❌ Ejecutar migración (demasiado tarde)
4. ❌ Sistema roto

### Problema 2: Navegadores con Caché

**Síntomas:**
- Chrome y Safari no abrían la página
- Mostraban "Service Unavailable"
- Firefox sí abría pero login fallaba

**Causa:**
- Navegadores guardaron en caché la página de error
- Incluso después de arreglar el servidor, seguían mostrando el error

**Solución:**
- Chrome: Ctrl/Cmd + Shift + R (hard reload)
- Safari: Cmd + Option + E (vaciar caché)
- Firefox: Ctrl/Cmd + Shift + R
- Modo incógnito también funciona

### Problema 3: Registro desde n8n - Foreign Key

**Error:**
```json
{
  "errorMessage": "The service was not able to process your request",
  "errorDescription": "Failed to register subaccount",
  "errorDetails": {
    "rawErrorMessage": [
      "500 - \"{\\\"error\\\":\\\"Failed to register subaccount\\\",\\\"message\\\":\\\"insert or update on table \\\\\\\"subaccounts\\\\\\\" violates foreign key constraint \\\\\\\"subaccounts_company_id_companies_id_fk\\\\\\\"\\\"}\""
    ]
  }
}
```

**Endpoint afectado:** `/api/webhooks/create-from-oauth` (línea 868 en routes.ts)

**Causa potencial:**
- n8n enviaba `company_id` que no existía en tabla `companies`
- El código intentaba crear subaccount con `companyId` inválido

**Estado:** RESUELTO (usuario confirmó, método de solución no documentado)

---

## ✅ Soluciones Aplicadas

### Solución 1: Rollback Temporal

**Commits:**
- Anterior funcional: `9e86566` - "feat: Agregar endpoint para consultar info por locationId"
- Problemático: `5e84520` - "Add ElevenLabs Voice ID configuration"

**Comandos ejecutados:**

**En local:**
```bash
cd /Users/rayalvarado/Desktop/ghl/EvolutionGHLConnect
git log --oneline -10
git reset --hard 9e86566
git push --force origin main
npm install
npm run build
```

**En Replit:**
```bash
pkill -9 node
git fetch origin
git reset --hard origin/main
git log -1 --oneline  # Verificar: 9e86566
npm install
npm run build
npm start
```

**Resultado:**
- ✅ Servidor inició correctamente
- ✅ Login funcional en todos navegadores
- ✅ Registro desde n8n funcional
- ✅ Sistema estable

### Solución 2: Sync with GitHub en Replit

Cuando el rollback manual no funcionó completamente, se usó la función **"Sync with GitHub"** en Replit, que:
1. Descartó cambios locales en Replit
2. Obtuvo la versión exacta del código de GitHub
3. Reinstió dependencias automáticamente
4. Reconstruyó el proyecto

---

## 📊 Estado Actual del Sistema

### Commit Actual
```
9e86566 (HEAD -> main, origin/main) feat: Agregar endpoint para consultar info por locationId
```

### Funcionalidades Operativas
| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Login (Email/Password) | ✅ Funcional | Todos navegadores |
| Login (Google OAuth) | ✅ Funcional | - |
| Registro manual | ✅ Funcional | - |
| Registro desde n8n | ✅ Funcional | Problema FK resuelto |
| Dashboard | ✅ Funcional | - |
| Gestión de instancias | ✅ Funcional | - |
| API Tokens | ✅ Funcional | Commits anteriores |
| Endpoint `/api/v1/user/info` | ✅ Funcional | Sin elevenLabsVoiceId |
| Endpoint `/api/v1/location/:locationId/info` | ✅ Funcional | Sin elevenLabsVoiceId |
| **ElevenLabs Voice ID** | ⏸️ Pendiente | Reimplementación necesaria |

### Base de Datos de Producción

**Estado de la columna `eleven_labs_voice_id`:**
- ❓ Estado DESCONOCIDO (no verificado después del rollback)
- Si existe: Quedó huérfana (código no la usa)
- Si no existe: Necesita crearse para reimplementación

**Verificación pendiente:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subaccounts'
AND column_name = 'eleven_labs_voice_id';
```

### Archivos con Cambios Revertidos
- ✅ `shared/schema.ts` - Revertido (sin elevenLabsVoiceId)
- ✅ `server/routes.ts` - Revertido (sin endpoint api-settings)
- ✅ `client/src/pages/Profile.tsx` - Revertido (sin sección API config)
- ⚠️ `migration-elevenlabs-voice-id.sql` - Archivo existe pero no en commit actual

---

## 🔄 Próximos Pasos Recomendados

### Reimplementación de ElevenLabs Voice ID (Orden Correcto)

#### Fase 1: Preparación de Base de Datos ⭐ CRÍTICO
1. **Conectar a la BD de producción en Replit**
   ```sql
   -- Verificar si columna existe
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'subaccounts'
   AND column_name = 'eleven_labs_voice_id';
   ```

2. **Si NO existe, crear la columna:**
   ```sql
   ALTER TABLE subaccounts
   ADD COLUMN eleven_labs_voice_id TEXT;
   ```

3. **Verificar creación exitosa:**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'subaccounts'
   AND column_name = 'eleven_labs_voice_id';
   ```

4. **Probar SELECT simple:**
   ```sql
   SELECT id, email, eleven_labs_voice_id
   FROM subaccounts
   LIMIT 1;
   ```

#### Fase 2: Actualización de Código
1. Recuperar commit `5e84520` con cambios de Voice ID
2. Crear nueva rama: `git checkout -b feature/elevenlabs-voice-id-v2`
3. Cherry-pick cambios específicos o reimplementar manualmente
4. Verificar que NO rompe funcionalidad existente

#### Fase 3: Testing Exhaustivo
**ANTES de hacer commit:**

1. **Test Local (si es posible):**
   - Configurar DATABASE_URL local apuntando a BD de dev
   - Ejecutar servidor local
   - Probar login
   - Probar actualización de Voice ID

2. **Test en Replit (staging/preview):**
   - Deploy en ambiente de prueba
   - Probar login completo
   - Probar registro desde n8n
   - Probar endpoints de API
   - Verificar que Voice ID se guarda y recupera correctamente

3. **Checklist de Validación:**
   - [ ] Login funciona (email/password)
   - [ ] Login funciona (Google OAuth)
   - [ ] Registro desde n8n funciona
   - [ ] Endpoint `/api/v1/user/info` retorna elevenLabsVoiceId
   - [ ] Endpoint `/api/v1/location/:locationId/info` retorna elevenLabsVoiceId
   - [ ] UI de Profile permite editar Voice ID
   - [ ] Cambios se guardan correctamente
   - [ ] Sin errores en consola del navegador
   - [ ] Sin errores en logs del servidor

#### Fase 4: Deployment
1. Merge a main SOLO si todos los tests pasan
2. Hacer backup de BD antes de deploy final
3. Monitorear logs durante primeros 15 minutos
4. Probar inmediatamente después del deploy
5. Tener plan de rollback listo

---

## 📝 Lecciones Aprendidas

### 1. Orden de Migraciones es CRÍTICO
**Problema:** Actualizamos código antes que base de datos
**Solución:** SIEMPRE migrar BD → verificar → actualizar código

### 2. Drizzle ORM es Estricto con Schema
**Problema:** Drizzle incluye TODOS los campos del schema en queries
**Implicación:** No se puede tener campos en schema que no existan en BD
**Solución:** Mantener schema sincronizado con BD de producción

### 3. Testing en Producción es Peligroso
**Problema:** No probamos suficientemente antes de deploy
**Solución:** Usar ambiente de staging o testing exhaustivo local

### 4. Caché de Navegador Puede Confundir
**Problema:** Navegadores guardaron página de error
**Solución:** Siempre probar en incógnito o hard reload después de fix

### 5. Logs de Replit son Esenciales
**Problema:** Difícil diagnosticar sin ver logs en tiempo real
**Solución:** Mantener consola de Replit visible durante deploys

### 6. Git Force Push con Cuidado
**Problema:** Force push puede causar problemas si hay otros desarrolladores
**Solución:** En este caso era necesario, pero documentar bien

### 7. Plan de Rollback es Obligatorio
**Problema:** No teníamos plan B preparado
**Solución:** Siempre tener commit funcional identificado antes de deploy

---

## 🔧 Comandos Útiles para Futuro

### Git - Rollback Seguro
```bash
# Ver historial
git log --oneline -10

# Rollback manteniendo archivos
git reset --soft <commit>

# Rollback descartando cambios
git reset --hard <commit>

# Force push (con cuidado)
git push --force origin main

# Ver cambios entre commits
git diff <commit1> <commit2>
```

### Replit - Gestión de Servidor
```bash
# Matar procesos Node
pkill -9 node

# Ver procesos corriendo
ps aux | grep node

# Sincronizar con GitHub
git fetch origin
git reset --hard origin/main

# Ver logs en tiempo real
tail -f /var/log/replit.log  # (si existe)

# Reiniciar servidor
npm start
```

### Base de Datos - Verificación de Columnas
```sql
-- Listar todas las columnas de una tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subaccounts'
ORDER BY ordinal_position;

-- Verificar columna específica
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'subaccounts'
AND column_name = 'eleven_labs_voice_id';

-- Probar SELECT con nueva columna
SELECT id, email, eleven_labs_voice_id
FROM subaccounts
LIMIT 5;

-- Ver compañías existentes (útil para debug de FK)
SELECT id, name, ghl_company_id, is_active
FROM companies
ORDER BY created_at DESC
LIMIT 10;
```

### Build y Deploy
```bash
# Build local
npm run build

# Verificar errores de TypeScript
npx tsc --noEmit

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar build anterior
rm -rf dist/
npm run build
```

---

## 📚 Referencias Técnicas

### Documentación Relevante
- **Drizzle ORM:** https://orm.drizzle.team/docs/overview
- **Neon Database:** https://neon.tech/docs
- **React Query:** https://tanstack.com/query/latest
- **Zod Validation:** https://zod.dev/

### Endpoints Modificados
| Endpoint | Método | Cambio | Estado |
|----------|--------|--------|--------|
| `/api/user/api-settings` | PATCH | Creado | Revertido |
| `/api/v1/user/info` | GET | Agregado elevenLabsVoiceId | Revertido |
| `/api/v1/location/:locationId/info` | GET | Agregado elevenLabsVoiceId | Revertido |
| `/api/auth/login` | POST | Sin cambios | Funcional |
| `/api/webhooks/create-from-oauth` | POST | Sin cambios | Funcional (FK fix) |

### Archivos del Proyecto
```
EvolutionGHLConnect/
├── shared/
│   └── schema.ts                    # Schema de BD con Drizzle
├── server/
│   ├── routes.ts                    # Endpoints de API
│   ├── auth.ts                      # Middleware de autenticación
│   └── storage.ts                   # Operaciones de BD
├── client/
│   └── src/
│       └── pages/
│           └── Profile.tsx          # UI de configuración de perfil
├── migration-elevenlabs-voice-id.sql  # Migración SQL (no en commit actual)
└── SESSION_SUMMARY_2025-11-12.md    # Este archivo
```

---

## 🎯 Conclusión

### Resumen de la Sesión
- **Duración:** ~3 horas
- **Commits:** 2 (uno implementado, uno rollback)
- **Problemas críticos:** 1 (autenticación rota)
- **Estado final:** Sistema estable, funcional completo

### Éxitos
✅ Implementación técnica correcta del código
✅ Rollback rápido y efectivo
✅ Sistema restaurado sin pérdida de datos
✅ Documentación completa de problema y solución

### Áreas de Mejora
⚠️ Testing antes de deploy
⚠️ Verificación de migraciones en producción
⚠️ Ambiente de staging para pruebas

### Próximo Objetivo
🎯 Reimplementar ElevenLabs Voice ID siguiendo el proceso correcto:
1. Migración BD primero
2. Verificación exhaustiva
3. Actualización de código
4. Testing completo
5. Deploy gradual

---

**Documento creado por:** Claude Code
**Última actualización:** 2025-11-12
**Versión del sistema:** Commit 9e86566
**Estado:** Sistema estable, Voice ID pendiente de reimplementación
