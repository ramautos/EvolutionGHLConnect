# 🤖 Integración Automática con n8n

Este documento explica cómo funciona la integración automática que crea workflows de n8n cuando se crea una instancia de WhatsApp.

## 📋 Descripción General

Cuando se crea una **instancia de WhatsApp** en Evolution API, el sistema automáticamente:

1. **Detecta** si es la primera instancia para ese `locationId`
2. **Duplica** el workflow template de n8n
3. **Renombra** el workflow al `locationId`
4. **Configura** el webhook con la URL correcta
5. **Guarda** el webhook URL en la instancia

## 🔄 Flujo de Funcionamiento

### Escenario 1: Primera Instancia

```
Usuario crea instancia → locationId: "LOC_ABC123"
↓
Sistema detecta: "Es la primera instancia para LOC_ABC123"
↓
Llama a n8n API:
  - Obtiene template: tnWqUmYez8IvPKeC
  - Duplica workflow
  - Renombra a: "LOC_ABC123"
  - Configura webhook: /webhook/LOC_ABC123
↓
Guarda en BD: webhookUrl = "https://n8nqr.cloude.es/webhook/LOC_ABC123"
↓
✅ Instancia creada con webhook configurado
```

### Escenario 2: Instancias Adicionales (2da, 3ra, etc.)

```
Usuario crea instancia → locationId: "LOC_ABC123" (número diferente)
↓
Sistema detecta: "Ya existe workflow para LOC_ABC123"
↓
Busca webhook existente de otra instancia con mismo locationId
↓
Reutiliza webhook: "https://n8nqr.cloude.es/webhook/LOC_ABC123"
↓
✅ Instancia creada con mismo webhook (no duplica workflow)
```

## ⚙️ Configuración

### 1. Variables de Entorno Requeridas

Agrega estas variables en **Replit → Secrets**:

```env
N8N_API_URL=https://n8nqr.cloude.es
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
N8N_TEMPLATE_WORKFLOW_ID=tnWqUmYez8IvPKeC
```

### 2. Obtener API Key de n8n

1. Ve a tu instancia de n8n: `https://n8nqr.cloude.es`
2. Settings (⚙️) → API
3. Click en "Create API Key"
4. Copia el key generado
5. Agrégalo como `N8N_API_KEY` en Replit Secrets

### 3. Configurar Workflow Template

El workflow template (`tnWqUmYez8IvPKeC`) debe tener:

- **Nodo Webhook** con path configurable
- **Lógica de automatización** que será la misma para todos
- **Estado activo** para recibir eventos inmediatamente

## 📊 Estructura de Datos

### Tabla `whatsapp_instances`

```sql
CREATE TABLE whatsapp_instances (
  id VARCHAR PRIMARY KEY,
  subaccountId VARCHAR NOT NULL,
  locationId TEXT NOT NULL,
  evolutionInstanceName TEXT NOT NULL,
  phoneNumber TEXT,
  webhookUrl TEXT,  -- ← NUEVO: URL del webhook de n8n
  ...
);
```

### Ejemplo de Datos

| id | locationId | phoneNumber | webhookUrl |
|----|------------|-------------|------------|
| uuid-1 | LOC_ABC123 | +1234567890 | https://n8nqr.cloude.es/webhook/LOC_ABC123 |
| uuid-2 | LOC_ABC123 | +1234567891 | https://n8nqr.cloude.es/webhook/LOC_ABC123 |
| uuid-3 | LOC_XYZ789 | +1234567892 | https://n8nqr.cloude.es/webhook/LOC_XYZ789 |

## 🔍 Código Relevante

### Servicio n8n (`server/n8n-service.ts`)

```typescript
// Método principal que se llama desde routes.ts
async createWorkflowForLocation(locationId: string): Promise<string | null> {
  // 1. Verifica si ya existe workflow con ese nombre
  const exists = await this.workflowExists(locationId);
  if (exists) return `${this.apiUrl}/webhook/${locationId}`;

  // 2. Duplica el template
  const newWorkflow = await this.duplicateWorkflow({
    templateWorkflowId: templateId,
    newName: locationId,
    webhookPath: locationId,
  });

  // 3. Retorna webhook URL
  return `${this.apiUrl}/webhook/${locationId}`;
}
```

### Integración en Routes (`server/routes.ts`)

```typescript
// POST /api/instances
app.post("/api/instances", async (req, res) => {
  // ... validaciones y creación de instancia ...

  const instance = await storage.createWhatsappInstance(validatedData);

  // INTEGRACIÓN CON N8N
  const locationId = validatedData.locationId;
  const instancesWithSameLocation = await db
    .select()
    .from(whatsappInstances)
    .where(eq(whatsappInstances.locationId, locationId));

  if (instancesWithSameLocation.length === 1) {
    // Primera instancia → crear workflow
    const webhookUrl = await n8nService.createWorkflowForLocation(locationId);
    await db.update(whatsappInstances).set({ webhookUrl });
  } else {
    // Instancia adicional → reutilizar webhook
    const existingWebhook = instancesWithSameLocation[0].webhookUrl;
    await db.update(whatsappInstances).set({ webhookUrl: existingWebhook });
  }

  res.json({ instance });
});
```

## 🧪 Cómo Probar

### 1. Configurar Variables de Entorno

Asegúrate de tener las 3 variables en Replit Secrets.

### 2. Crear Primera Instancia

```bash
# En el dashboard, crea una instancia de WhatsApp
Location ID: LOC_TEST123
```

**Logs esperados:**
```
🔵 Primera instancia para locationId LOC_TEST123, creando workflow en n8n...
✅ Workflow obtenido: Template Workflow (tnWqUmYez8IvPKeC)
✅ Workflow creado: LOC_TEST123 (new-id-here)
✅ Workflow duplicado exitosamente:
   - ID: new-id-here
   - Nombre: LOC_TEST123
   - Webhook: https://n8nqr.cloude.es/webhook/LOC_TEST123
✅ Workflow n8n creado y webhook configurado para LOC_TEST123
```

### 3. Verificar en n8n

1. Ve a n8n: `https://n8nqr.cloude.es/workflows`
2. Deberías ver un nuevo workflow llamado `LOC_TEST123`
3. Abre el workflow → verifica que el nodo Webhook tenga path: `LOC_TEST123`

### 4. Crear Segunda Instancia (mismo locationId)

```bash
# Crea otra instancia con el mismo Location ID
Location ID: LOC_TEST123  # ← Mismo que antes
Phone: diferente número
```

**Logs esperados:**
```
ℹ️ Instancia adicional para locationId LOC_TEST123, reutilizando workflow existente
✅ Webhook reutilizado: https://n8nqr.cloude.es/webhook/LOC_TEST123
```

**Verificar:** NO se debe crear un segundo workflow en n8n.

## ❓ Preguntas Frecuentes

### ¿Qué pasa si n8n está caído?

La creación de la instancia NO falla. El sistema:
1. Registra el error en logs
2. Continúa creando la instancia
3. `webhookUrl` queda como `null`
4. Puedes configurarlo manualmente después

### ¿Se pueden actualizar todos los workflows?

Si modificas el template, los workflows YA CREADOS NO se actualizan automáticamente.

**Solución:** Implementar script de sincronización (próximamente).

### ¿Cuántos workflows se crean?

**1 workflow por locationId**, sin importar cuántas instancias tenga.

Ejemplo:
- 5 instancias con locationId `LOC_ABC123` → 1 workflow
- 3 instancias con locationId `LOC_XYZ789` → 1 workflow
- **Total:** 2 workflows para 8 instancias

## 🐛 Troubleshooting

### Error: "N8N_API_KEY no configurado"

**Solución:** Agrega `N8N_API_KEY` en Replit Secrets.

### Error: "No se pudo obtener el template"

**Causas posibles:**
1. `N8N_TEMPLATE_WORKFLOW_ID` incorrecto
2. Template eliminado de n8n
3. API Key sin permisos

**Solución:** Verifica que el template existe en n8n.

### Webhook no funciona

**Verificar:**
1. Workflow está activo en n8n
2. Path del webhook es correcto: `/webhook/{locationId}`
3. URL completa guardada en BD: `https://n8nqr.cloude.es/webhook/{locationId}`

## 📚 Referencias

- [n8n API Documentation](https://docs.n8n.io/api/)
- [Evolution API Webhooks](https://doc.evolution-api.com/v2/pt/webhooks/)
- Código fuente: `server/n8n-service.ts`
- Integración: `server/routes.ts` (líneas 2965+, 3043+, 3141+)

---

**Última actualización:** 2025-01-15
**Versión:** 1.0.0
