# Configuracion de Custom Page en GHL Marketplace

## Resumen

Custom Page permite mostrar tu aplicacion embebida dentro del sidebar de GoHighLevel.
A diferencia de Custom Menu Links API, Custom Page se configura directamente en el Marketplace
y no requiere scopes adicionales ni llamadas API.

## URL de Custom Page

Usa esta URL exacta en la configuracion de tu app en GHL Marketplace:

```
https://whatsapp.cloude.es/app-dashboard?locationId={{location.id}}
```

### Variables Template de GHL

| Variable | Descripcion |
|----------|-------------|
| `{{location.id}}` | ID de la location/subaccount donde esta instalada la app |

GHL reemplaza automaticamente `{{location.id}}` con el ID real cuando carga el iframe.

**Nota:** Solo se necesita el `locationId`. No es necesario pasar `userId` ni `email`.

## Pasos de Configuracion

### 1. Acceder al Developer Portal

1. Ve a: https://marketplace.gohighlevel.com/
2. Inicia sesion con tu cuenta de agencia
3. Ve a **My Apps** y selecciona tu aplicacion

### 2. Configurar Custom Page

1. En la configuracion de la app, busca la seccion **"Custom Pages"** o **"Settings"**
2. Activa la opcion de Custom Page / Custom Menu Link
3. Configura los siguientes campos:

| Campo | Valor |
|-------|-------|
| **Name/Title** | WhatsApp AI |
| **URL** | `https://whatsapp.cloude.es/app-dashboard?locationId={{location.id}}` |
| **Icon** | Link (o el icono que prefieras) |
| **Open Type** | Embedded/iFrame |
| **Show on Mobile** | Si (opcional) |

### 3. Guardar y Probar

1. Guarda los cambios en el Marketplace
2. Desinstala la app de una subaccount de prueba (si ya estaba instalada)
3. Reinstala la app
4. Verifica que aparezca en el sidebar izquierdo de GHL

## Verificacion

Una vez instalada, la app debe:

1. Aparecer en el sidebar izquierdo de GHL
2. Al hacer clic, cargar un iframe con tu dashboard
3. El dashboard debe autenticarse automaticamente usando los parametros URL

## Troubleshooting

### La app no aparece en el sidebar

1. Verifica que Custom Page este habilitado en el Marketplace
2. Desinstala y reinstala la app en la subaccount
3. Verifica que la URL sea correcta (sin espacios extra)

### Error de autenticacion en el iframe

1. Verifica que la subaccount tenga el GHL Location ID correcto en la base de datos
2. Revisa los logs del servidor para ver si hay errores en `/api/subaccounts/by-location/:locationId`

### El iframe muestra "Cuenta no encontrada"

1. La subaccount debe estar registrada en tu sistema antes de que el usuario pueda verla
2. Verifica que el `locationId` coincida con el almacenado en la tabla `ghl_clientes`

## Codigo Relacionado

El componente que maneja Custom Page esta en:
- [client/src/pages/GhlIframe.tsx](../../client/src/pages/GhlIframe.tsx)

El endpoint que busca subaccounts por locationId:
- `GET /api/subaccounts/by-location/:locationId` en [server/routes.ts](../../server/routes.ts)

## Diferencia con Custom Menu Links API

| Caracteristica | Custom Page | Custom Menu Links API |
|----------------|-------------|----------------------|
| Configuracion | Manual en Marketplace | Programatica via API |
| Scopes requeridos | Ninguno adicional | `custom-menu-link.readonly`, `custom-menu-link.write` |
| Requiere reinstalar | Solo si cambia URL | Si, para obtener nuevos scopes |
| Aparece automaticamente | Si, al instalar | Depende de que la API funcione |

## Recomendacion

**Usar Custom Page** es la forma mas simple y confiable de mostrar tu app en GHL.
Custom Menu Links API es util para crear menus adicionales dinamicamente, pero
requiere manejo de tokens y scopes que pueden complicar el proceso.
