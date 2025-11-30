# GoHighLevel Custom Menus API

## Descripción

La API de Custom Menus permite crear menús personalizados para compañías, facilitando la navegación personalizada dentro de HighLevel.

## Autenticación

Usa Bearer Auth con JWT tokens:
- Access Token (Sub-Account o Agency user type)
- Private Integration Token

```
Authorization: Bearer {access_token}
```

## Endpoints

### Create Custom Menu

**Endpoint:** `POST /custom-menus/`

**Descripción:** Crea un nuevo menú personalizado para una compañía

**Requisitos:**
- Autenticación requerida
- Permisos apropiados

**Response Codes:**
| Código | Descripción |
|--------|-------------|
| 201 | Custom menu created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized |
| 403 | Forbidden - Insufficient permissions |
| 422 | Unprocessable Entity |

## Tipos de Custom Menu Links

### 1. Embedded Page (iFrame)
- Muestra página externa dentro de HighLevel
- Mantiene estructura de navegación
- Ideal para integrar tu app sin salir del CRM

### 2. New Browser Tab
- Abre link en pestaña separada
- Útil para recursos externos

### 3. Current Browser Tab
- Reemplaza pantalla actual de HighLevel
- Para flujos que requieren pantalla completa

## Uso con SSO

Cuando usas Custom Menu Links con iFrame:
1. La página cargada puede solicitar info SSO
2. Se encriptan los datos del usuario
3. Tu backend puede desencriptar con SSO Key

## Casos de Uso

- **Recursos externos:** Enlaces a documentación
- **Training:** Materiales de capacitación
- **Apps personalizadas:** Tu aplicación embebida
- **Herramientas:** Acceso rápido a utilidades

## Scopes Requeridos

Para usar la Custom Menus API necesitas scopes como:
```
custom-menus.readonly
custom-menus.write
```

## Ejemplo de Implementación

```javascript
// Crear custom menu
const response = await fetch('https://services.leadconnectorhq.com/custom-menus/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  },
  body: JSON.stringify({
    name: 'Mi App',
    url: 'https://miapp.com/dashboard',
    icon: 'link',
    openType: 'iframe'
  })
});
```

## Recursos

- [Custom Menus API](https://marketplace.gohighlevel.com/docs/ghl/custom-menus/custom-menus-api/index.html)
- [Create Custom Menu](https://marketplace.gohighlevel.com/docs/ghl/custom-menus/create-custom-menu/index.html)
- [Custom Menu Links Guide](https://help.gohighlevel.com/support/solutions/articles/48001185767-customizing-highlevel-menus-a-guide-to-custom-menu-links)
