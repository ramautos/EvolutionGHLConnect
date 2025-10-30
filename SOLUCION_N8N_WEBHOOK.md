# 🔧 Solución: Configurar N8N para Webhook de GoHighLevel

## ❌ Problema Identificado

Tu configuración actual de N8N solo envía 3 campos:
- email
- name  
- phone

Pero el backend **REQUIERE** 4 campos mínimos:
- email ✅
- name ✅
- **locationId** ❌ (FALTA - CRÍTICO)
- **ghlCompanyId** ❌ (FALTA - CRÍTICO)

## ✅ Solución Paso a Paso

### Paso 1: Obtener datos de GoHighLevel API

Primero necesitas obtener la información completa de la location desde GoHighLevel. Después de intercambiar el OAuth code por el access token, debes hacer una petición a la API de GHL:

**Nodo: HTTP Request - Obtener Location**
```
Método: GET
URL: https://services.leadconnectorhq.com/locations/{{$json.locationId}}
Headers:
  - Authorization: Bearer {{$json.access_token}}
  - Version: 2021-07-28
```

Este request te devolverá un objeto con toda la información de la location:
```json
{
  "location": {
    "id": "jtEqGdhkoR6iePmZaCma",
    "name": "Ray Alvarado Auto Shop",
    "email": "RAY@RAMAUTOS.DO",
    "phone": "+1234567890",
    "companyId": "ghl_company_123",
    ...
  },
  "company": {
    "id": "ghl_company_123",
    "name": "RAM Autos",
    ...
  }
}
```

### Paso 2: Configurar HTTP Request al Backend de WhatsApp

**Nodo: HTTP Request - Webhook a WhatsApp Backend**

**URL:**
```
https://whatsapp.cloude.es/api/webhooks/register-subaccount
```

**Method:** POST

**Body Content Type:** JSON

**Body Parameters - TODOS ESTOS CAMPOS:**

| Name | Value (Expression) |
|------|-------------------|
| email | `{{ $json.location.email }}` |
| name | `{{ $json.location.name }}` |
| phone | `{{ $json.location.phone }}` |
| **locationId** | `{{ $json.location.id }}` |
| **ghlCompanyId** | `{{ $json.location.companyId }}` |
| locationName | `{{ $json.location.name }}` |
| companyName | `{{ $json.company.name }}` |

### Paso 3: Redirigir al Usuario (Respond to Webhook)

**Nodo: Respond to Webhook**

**Response Code:** 302

**Response Headers:**

| Name | Value |
|------|-------|
| Location | `https://whatsapp.cloude.es/claim-subaccount?locationId={{ $json.location.id }}` |

## 📊 Flujo Completo en N8N

```
1. [Webhook] - Recibe callback de GHL con code
   ↓
2. [HTTP Request] - Intercambia code por access_token
   POST https://services.leadconnectorhq.com/oauth/token
   ↓
3. [HTTP Request] - Obtiene datos de la location
   GET https://services.leadconnectorhq.com/locations/{{locationId}}
   ↓
4. [Set] - (Opcional) Transformar datos si es necesario
   ↓
5. [PostgreSQL] - Guarda token en tu DB de GHL
   INSERT INTO ghl_clientes (...)
   ↓
6. [HTTP Request] - Envía webhook al backend de WhatsApp
   POST https://whatsapp.cloude.es/api/webhooks/register-subaccount
   Body: { email, name, phone, locationId, ghlCompanyId, locationName, companyName }
   ↓
7. [Respond to Webhook] - Redirige al usuario
   302 → https://whatsapp.cloude.es/claim-subaccount?locationId=...
```

## 🔍 Verificar que Funciona

1. **En N8N Output**: Debes ver respuesta exitosa:
   ```json
   {
     "success": true,
     "message": "Subaccount created - pending claim",
     "subaccount": {
       "id": "...",
       "email": "RAY@RAMAUTOS.DO",
       "name": "Ray Alvarado",
       "locationId": "jtEqGdhkoR6iePmZaCma"
     }
   }
   ```

2. **El usuario es redirigido automáticamente** a:
   ```
   https://whatsapp.cloude.es/claim-subaccount?locationId=jtEqGdhkoR6iePmZaCma
   ```

3. **La página de claim**:
   - Detecta que el usuario está autenticado
   - Asocia la subcuenta con la empresa del usuario
   - Crea la instancia de WhatsApp
   - Redirige al dashboard

## ⚠️ Errores Comunes

### Error: "Invalid data" o campos faltantes
**Causa:** No estás enviando `locationId` o `ghlCompanyId`
**Solución:** Verifica que todos los campos en el Paso 2 estén configurados

### Error: "Subaccount already exists"
**Causa:** Ya existe una subcuenta con ese locationId en la base de datos
**Solución:** 
- Si es una prueba, elimina la subcuenta antigua de la BD
- Si es producción, el usuario puede hacer claim desde el frontend

### Error: "Subaccount too old to claim"
**Causa:** Pasaron más de 10 minutos entre la creación y el claim
**Solución:** Reinstalar la app en GHL o reducir el tiempo entre pasos

## 🎯 Resumen de Cambios Necesarios

1. ✅ Agregar nodo para obtener location de GHL API
2. ✅ Agregar campos `locationId` y `ghlCompanyId` al webhook
3. ✅ Configurar redirect 302 con `locationId` en query string
4. ✅ Probar el flujo completo end-to-end
