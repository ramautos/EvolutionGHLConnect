# Solución: Activar PENDING_CLAIM en Producción

## ❌ Problema

El webhook de N8N falla con este error:
```
"insert or update on table \"subaccounts\" violates foreign key constraint \"subaccounts_company_id_companies_id_fk\""
```

**Causa:** La empresa `PENDING_CLAIM` no existe o está inactiva en la base de datos de PRODUCCIÓN.

---

## ✅ Solución: Ejecutar SQL en Producción

### Opción 1: Desde Replit (Producción)

1. Ve a tu Replit de producción
2. Abre la consola Shell
3. Ejecuta:

```bash
psql $DATABASE_URL -c "
INSERT INTO companies (id, name, is_active, plan, created_at, updated_at) 
VALUES (
  'PENDING_CLAIM',
  'Pending Claim',
  true,
  'free',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET is_active = true;
"
```

### Opción 2: Desde la UI de Replit Database

1. Ve a tu Replit de producción
2. Click en "Database" en el panel izquierdo
3. Click en "Query"
4. Ejecuta este SQL:

```sql
INSERT INTO companies (id, name, is_active, plan, created_at, updated_at) 
VALUES (
  'PENDING_CLAIM',
  'Pending Claim',
  true,
  'free',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET is_active = true;
```

### Opción 3: Desde pgAdmin / DBeaver (Recomendado para el futuro)

1. Conecta pgAdmin a tu base de datos de producción
2. Ejecuta el mismo SQL de arriba

---

## 🧪 Verificar que Funciona

Después de ejecutar el SQL, prueba el webhook desde N8N nuevamente o con curl:

```bash
curl -X POST https://whatsapp.cloude.es/api/webhooks/register-subaccount \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coordinacion@llantas777.com",
    "name": "DonCesar",
    "phone": "",
    "locationId": "jA1RJ4Qel8UOKjHuGVvu",
    "ghlCompanyId": "wW07eetYJ3JmgceImT5i",
    "locationName": "Llantas777"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Subaccount created - pending claim",
  "subaccount": {
    "id": "...",
    "email": "coordinacion@llantas777.com",
    "companyId": "PENDING_CLAIM"
  }
}
```

---

## 📋 Datos del Webhook que Estás Enviando

Según tus capturas de N8N:

```json
{
  "email": "coordinacion@llantas777.com",
  "name": "DonCesar",
  "phone": "[empty]",
  "locationId": "jA1RJ4Qel8UOKjHuGVvu",
  "ghlCompanyId": "wW07eetYJ3JmgceImT5i",
  "locationName": "Llantas777"
}
```

✅ Los 6 campos están correctos
✅ El webhook URL está correcto
✅ Solo falta activar PENDING_CLAIM en producción

---

## 🎯 Por Qué Pasó Esto

- Yo activé `PENDING_CLAIM` en tu base de datos de **desarrollo** (localhost)
- Tu webhook N8N apunta a **producción** (`https://whatsapp.cloude.es`)
- La empresa `PENDING_CLAIM` en producción estaba inactiva o no existía

---

## 🚀 Después de Arreglar Esto

Para evitar este problema en el futuro, te recomiendo:

1. **Configurar pgAdmin o DBeaver** para acceder a producción
2. **Usar Drizzle Studio** para ver/editar datos en vivo
3. **Sincronizar esquemas** entre dev y prod con `npm run db:push`

Esto te permitirá ver y gestionar ambas bases de datos sin problemas.
