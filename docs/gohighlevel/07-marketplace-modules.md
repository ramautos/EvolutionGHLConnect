# GoHighLevel Marketplace Modules

## Descripción

Los Marketplace Modules permiten crear integraciones personalizadas en diferentes áreas del CRM.

## Módulo de Payments (Ejemplo)

### Scopes Requeridos

```
payments/orders.readonly
payments/orders.write
payments/subscriptions.readonly
payments/transactions.readonly
payments/custom-provider.readonly
payments/custom-provider.write
products.readonly
products/prices.readonly
```

### Componentes de Configuración

| Componente | Descripción |
|------------|-------------|
| OAuth Redirect URL | URL de callback |
| Client Keys | Claves almacenadas de forma segura |
| Webhook URL | Endpoint para eventos |
| SSO Key | Para autenticación |

### Configuración del Proveedor

- **Nombre:** Nombre del proveedor de pagos
- **Descripción:** Descripción del servicio
- **Tipos soportados:** OneTime, Recurring, Off Session
- **Logo:** Imagen representativa

## Eventos de Payment

### Iniciación de Pago

Evento `payment_initiate_props`:
```json
{
  "amount": 1000,
  "currency": "USD",
  "contactData": {},
  "orderId": "order123",
  "transactionId": "tx456"
}
```

### Verificación de Pago

POST a `queryUrl` con:
```json
{
  "type": "verify"
}
```

Response esperado: booleano indicando éxito.

### Métodos de Pago

**Agregar método:**
- Evento: `setup_initiate_props`

**Listar métodos:**
```json
{
  "type": "list_payment_methods"
}
```

**Cargar pago:**
```json
{
  "type": "charge_payment"
}
```

## Respuestas

**Éxito:**
```javascript
dispatchEvent('custom_element_success_response', {
  chargeId: 'charge123'
});
```

**Error:**
```javascript
dispatchEvent('custom_element_error_response', {
  message: 'Payment failed'
});
```

## Webhooks de Payment

Eventos disponibles:
- `subscription.active`
- `payment.captured`
- `payment.failed`
- `subscription.cancelled`

## Otros Módulos Disponibles

- **Business:** Gestión de negocios
- **Calendars:** Calendarios y citas
- **Campaigns:** Campañas de marketing
- **Contacts:** Gestión de contactos
- **Conversations:** Mensajería
- **Courses:** Cursos online
- **Email:** Email marketing
- **Forms:** Formularios
- **Invoices:** Facturación
- **Opportunities:** Pipeline de ventas
- **Products:** Catálogo de productos
- **Workflows:** Automatizaciones

## Recursos

- [Payments Module](https://marketplace.gohighlevel.com/docs/marketplace-modules/Payments/index.html)
- [Developer Portal](https://marketplace.gohighlevel.com/docs/)
