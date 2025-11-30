# GoHighLevel Developer Glossary

## Términos Principales

### API (Application Programming Interface)
Conjunto de reglas y protocolos que permite que diferentes aplicaciones de software se comuniquen entre sí.

### Access Token
Credencial que una aplicación utiliza para acceder a recursos protegidos. Se obtiene mediante el proceso OAuth.

### Refresh Token
Credencial que permite obtener un nuevo Access Token sin requerir reautenticación del usuario.

### OAuth
Protocolo estándar de la industria que permite autorización segura de aplicaciones.

### Scopes
Permisos específicos y derechos de acceso que una aplicación requiere para interactuar con GoHighLevel.

## Identificadores

### App ID
Identificador único para tu aplicación marketplace, ubicado debajo del nombre de la app.

### Company ID
Identificador único asignado a una cuenta o empresa GoHighLevel (Agency).

### Location ID
Identificador único para una ubicación específica dentro de una cuenta GoHighLevel (Sub-Account).

### Conversation Provider ID
Identificador único para el tipo de proveedor que instala un usuario.

## OAuth & Autenticación

### Authorization Code
Credencial de corta duración obtenida después de que un usuario autoriza una aplicación.

### Redirect URI
URL a donde GoHighLevel enviará usuarios después de autorizar el acceso de la app.

### Authorization Header
Header HTTP que incluye credenciales de autenticación:
```
Authorization: Bearer {Access-Token}
```

### API Key
Identificador único que proporciona acceso a la API.

### Callback URL
Endpoint donde la app recibe respuestas después de que el usuario otorga permiso.

## API & HTTP

### Endpoint
URL o URI específica que representa un recurso o funcionalidad de API.

### Status Code
Número de tres dígitos que indica el resultado de una solicitud HTTP.

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 400 | Bad Request |
| 401 | No autorizado |
| 403 | Prohibido |
| 404 | No encontrado |
| 422 | Entidad no procesable |
| 429 | Rate limit excedido |

### HTTP Methods
- **GET:** Recuperar datos
- **POST:** Enviar datos
- **PUT:** Actualizar recursos
- **DELETE:** Eliminar recursos

### Request
Comunicación que envía una app a la API de GoHighLevel.

### Response
Respuesta del servidor a una solicitud realizada.

### Parameters
Valores adicionales en solicitudes API para proporcionar instrucciones específicas.

## Datos & Formato

### JSON
Formato ligero de intercambio de datos que es fácil de leer, escribir y procesar.

### Pagination
División de grandes conjuntos de datos en partes más pequeñas.

### Rate Limiting
Mecanismo que restringe solicitudes dentro de períodos específicos.
- **Burst:** 100 requests/10 segundos
- **Daily:** 200,000 requests/día

## Webhooks & Eventos

### Webhooks
Notificaciones HTTP enviadas de una aplicación a otra cuando ocurre un evento específico.

### Event
Ocurrencia o acción específica que dispara una notificación webhook.

## Distribución

### Distribution Type
Cómo se distribuye una app:
- **Agency:** Accesible por toda la agencia
- **Sub-Account:** Limitado a ubicaciones específicas

### Live Server
Ambiente de producción donde la app interactúa con datos reales.

## Desarrollo

### Developer's Marketplace
Plataforma dentro de GoHighLevel que permite a desarrolladores construir e integrar aplicaciones.

### SDK (Software Development Kit)
Conjunto de herramientas, librerías y documentación para construir aplicaciones.

### Front-End Development
Construcción de componentes visibles al usuario (HTML, CSS, JavaScript).

### Back-End Development
Componentes del lado del servidor incluyendo lógica y almacenamiento de datos.
