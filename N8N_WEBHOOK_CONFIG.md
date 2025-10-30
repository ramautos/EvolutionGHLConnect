# Configuración N8N para Crear Subcuentas

## Flujo Correcto

Cuando `bono@bono.com` presiona "Instalar Subcuenta" en el dashboard:

1. El frontend pasa información del usuario en el `state` parameter de OAuth:
   ```javascript
   state: {
     "user_email": "bono@bono.com",
     "user_id": "user-uuid-123",
     "company_id": "company-uuid-456"
   }
   ```

2. GoHighLevel redirige a n8n con:
   - `code`: Código de autorización
   - `state`: Información del usuario (paso 1)
   - `locationId`: ID de la location de GHL
   - `companyId`: ID de la company de GHL

3. **N8N debe enviar al webhook** `/api/webhooks/register-subaccount`:
   ```json
   {
     "email": "{{email_cliente}}",
     "name": "{{nombre_cliente}}",
     "phone": "{{telefono_cliente}}",
     "locationId": "{{locationid}}",
     "locationName": "{{subcuenta}}",
     "ghlCompanyId": "{{companyid}}",
     "companyName": "{{cuenta_principal}}",
     "user_email": "{{state.user_email}}",
     "user_id": "{{state.user_id}}",
     "company_id": "{{state.company_id}}"
   }
   ```

## Modelo de Datos Correcto

- **Company**: Empresa de `bono@bono.com` (una sola)
- **Subaccounts**: Todas las locations de GoHighLevel que `bono@bono.com` instale
  - Cada subaccount tiene su propio `locationId`
  - Todas pertenecen a la misma `company_id` de bono@bono.com
  - El `ghlCompanyId` es solo informativo (no se usa para crear companies)

## Lo que hace el backend:

1. Recibe `company_id` del usuario logueado (del state)
2. Busca esa company en la base de datos
3. Crea la subcuenta bajo ESA company (no crea una nueva)
4. La subcuenta usa el email/nombre de la LOCATION de GoHighLevel
5. El dueño de la subcuenta es identificado por `company_id`

## Ejemplo Completo:

### Usuario logueado:
- Email: bono@bono.com
- Company ID: abc-123
- Company Name: "Bono Corp"

### Instala Location de GHL:
- Location ID: xyz-789
- Location Name: "Ram Mega Autos"
- Location Email: ray@ramautos.do

### Resultado en DB:
```
Company: abc-123 (Bono Corp)
  └── Subaccount 1: ram-mega-autos-001
        - Email: ray@ramautos.do
        - Name: Ram Mega Autos  
        - Location ID: xyz-789
        - Owner: bono@bono.com (via company_id: abc-123)
```

## Endpoints Disponibles:

### POST /api/webhooks/register-subaccount
Crear subcuenta con información completa (USAR ESTE)

### POST /api/webhooks/create-from-oauth  
Solo para testing - busca en DB GHL externa
