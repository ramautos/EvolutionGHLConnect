# 📘 Documentación Completa del API - WhatsApp AI Platform

**Base URL**: `https://whatsapp.cloude.es`  
**Versión**: 1.0  
**Última actualización**: Octubre 27, 2025

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren autenticación mediante sesión de cookies. Las cookies se establecen automáticamente después del login.

### Headers Requeridos
```
Content-Type: application/json
Cookie: connect.sid=<session-id>
```

---

## 📑 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Subcuentas (Locations GHL)](#subcuentas-locations-ghl)
4. [Instancias de WhatsApp](#instancias-de-whatsapp)
5. [Webhooks](#webhooks)
6. [Admin](#admin)

---

## 🔑 Autenticación

### Registro de Usuario
**POST** `/api/auth/register`

Registra un nuevo usuario con email y contraseña.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "miContraseña123",
  "name": "Juan Pérez"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "role": "user",
  "phoneNumber": null,
  "createdAt": "2025-10-27T12:00:00.000Z"
}
```

**Errores:**
- `400`: Datos inválidos o email ya registrado
- `500`: Error del servidor

---

### Login
**POST** `/api/auth/login`

Inicia sesión con email y contraseña.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "miContraseña123"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "role": "user",
  "phoneNumber": "+18094973030",
  "createdAt": "2025-10-27T12:00:00.000Z"
}
```

**Errores:**
- `401`: Credenciales inválidas
- `500`: Error del servidor

---

### Login con Google OAuth
**GET** `/api/auth/google`

Redirige al flujo de autenticación de Google.

---

### Callback de Google OAuth
**GET** `/api/auth/google/callback`

Endpoint de callback después de la autenticación de Google. Redirige al dashboard.

---

### Obtener Usuario Actual
**GET** `/api/auth/me`

Obtiene la información del usuario autenticado.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "role": "user",
  "phoneNumber": "+18094973030",
  "hasPassword": true,
  "createdAt": "2025-10-27T12:00:00.000Z"
}
```

**Errores:**
- `401`: No autenticado
- `500`: Error del servidor

---

### Cerrar Sesión
**POST** `/api/auth/logout`

Cierra la sesión del usuario.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 👤 Usuarios

### Actualizar Perfil
**PATCH** `/api/user/profile`

Actualiza el nombre y/o número de teléfono del usuario autenticado.

**Request Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "phoneNumber": "+18094973030"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "name": "Juan Carlos Pérez",
  "phoneNumber": "+18094973030",
  "role": "user"
}
```

**Errores:**
- `400`: Datos inválidos
- `401`: No autenticado
- `500`: Error del servidor

---

### Cambiar Contraseña
**PATCH** `/api/user/password`

Cambia la contraseña del usuario autenticado (solo para usuarios con email/password).

**Request Body:**
```json
{
  "currentPassword": "contraseñaActual123",
  "newPassword": "nuevaContraseña456"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Errores:**
- `400`: Contraseña actual incorrecta o datos inválidos
- `401`: No autenticado
- `403`: Usuario de Google (no puede cambiar contraseña)
- `500`: Error del servidor

---

## 🏢 Subcuentas (Locations GHL)

### Listar Subcuentas del Usuario
**GET** `/api/subaccounts/user/:userId`

Obtiene todas las subcuentas (locations de GoHighLevel) del usuario.

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-id",
    "locationId": "12334455",
    "companyId": "wW07eetYJ3...",
    "name": "Mi Negocio",
    "email": "negocio@ejemplo.com",
    "phone": "+18094973030",
    "city": "Santo Domingo",
    "state": "Distrito Nacional",
    "address": "Calle Principal 123",
    "openaiApiKey": "sk-proj-...",
    "isActive": true,
    "installedAt": "2025-10-27T12:00:00.000Z"
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error del servidor

---

### Crear Subcuenta desde GHL OAuth
**POST** `/api/subaccounts/from-ghl`

Crea una subcuenta después del flujo de OAuth de GoHighLevel.

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "wW07eetYJ3...",
  "locationId": "12334455"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-id",
  "locationId": "12334455",
  "companyId": "wW07eetYJ3...",
  "name": "Mi Negocio",
  "email": "negocio@ejemplo.com",
  "phone": "+18094973030",
  "city": "Santo Domingo",
  "state": "Distrito Nacional",
  "address": "Calle Principal 123",
  "isActive": true
}
```

**Errores:**
- `400`: Datos faltantes
- `401`: No autenticado
- `404`: Token de OAuth no encontrado
- `500`: Error del servidor

---

### Actualizar API Key de OpenAI
**PATCH** `/api/subaccounts/:locationId/openai-key`

Actualiza el API key de OpenAI para una subcuenta específica.

**Parámetros:**
- `locationId`: ID de la location en GoHighLevel

**Request Body:**
```json
{
  "openaiApiKey": "sk-proj-..."
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-id",
  "locationId": "12334455",
  "openaiApiKey": "sk-proj-...",
  "name": "Mi Negocio"
}
```

**Errores:**
- `400`: API key inválida
- `404`: Subcuenta no encontrada
- `500`: Error del servidor

---

### Obtener Información Completa del Cliente
**GET** `/api/subaccounts/:locationId/info`

Obtiene toda la información de un cliente por locationId.

**Parámetros:**
- `locationId`: ID de la location en GoHighLevel

**Response (200):**
```json
{
  "name": "Mi Negocio",
  "phone": "+18094973030",
  "email": "negocio@ejemplo.com",
  "locationId": "12334455",
  "openaiApiKey": "sk-proj-...",
  "companyId": "wW07eetYJ3...",
  "city": "Santo Domingo",
  "state": "Distrito Nacional",
  "address": "Calle Principal 123"
}
```

**Uso en n8n:**
Este endpoint es ideal para obtener el API key de OpenAI y realizar transcripciones de voz.

**Errores:**
- `404`: Subcuenta no encontrada
- `500`: Error del servidor

---

## 📱 Instancias de WhatsApp

### Crear Instancia de WhatsApp
**POST** `/api/instances`

Crea una nueva instancia de WhatsApp.

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "subaccountId": "subaccount-id",
  "locationId": "12334455",
  "customName": "WhatsApp Ventas",
  "evolutionInstanceName": "12334455_1"
}
```

**Response (201):**
```json
{
  "id": "instance-id",
  "userId": "user-id",
  "subaccountId": "subaccount-id",
  "locationId": "12334455",
  "customName": "WhatsApp Ventas",
  "evolutionInstanceName": "12334455_1",
  "status": "created",
  "phoneNumber": null,
  "qrCode": null
}
```

**Errores:**
- `400`: Datos inválidos
- `401`: No autenticado
- `500`: Error del servidor

---

### Listar Instancias por Subcuenta
**GET** `/api/instances/subaccount/:subaccountId`

Obtiene todas las instancias de WhatsApp de una subcuenta.

**Response (200):**
```json
[
  {
    "id": "instance-id",
    "userId": "user-id",
    "subaccountId": "subaccount-id",
    "locationId": "12334455",
    "customName": "WhatsApp Ventas",
    "evolutionInstanceName": "12334455_1",
    "status": "connected",
    "phoneNumber": "+18094973030",
    "qrCode": null,
    "connectedAt": "2025-10-27T12:00:00.000Z",
    "disconnectedAt": null
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error del servidor

---

### Listar Instancias del Usuario
**GET** `/api/instances/user/:userId`

Obtiene todas las instancias de WhatsApp del usuario.

**Response (200):**
```json
[
  {
    "id": "instance-id",
    "userId": "user-id",
    "subaccountId": "subaccount-id",
    "locationId": "12334455",
    "customName": "WhatsApp Ventas",
    "evolutionInstanceName": "12334455_1",
    "status": "connected",
    "phoneNumber": "+18094973030"
  }
]
```

**Errores:**
- `401`: No autenticado
- `500`: Error del servidor

---

### Generar Código QR
**POST** `/api/instances/:id/generate-qr`

Genera un código QR para conectar una instancia de WhatsApp.

**Response (200):**
```json
{
  "id": "instance-id",
  "qrCode": "data:image/png;base64,...",
  "status": "qr_generated"
}
```

**Errores:**
- `401`: No autenticado
- `404`: Instancia no encontrada
- `500`: Error del servidor

---

### Sincronizar con Evolution API
**POST** `/api/instances/:id/sync`

Sincroniza manualmente el estado de una instancia con Evolution API.

**Response (200):**
```json
{
  "id": "instance-id",
  "status": "connected",
  "phoneNumber": "+18094973030",
  "state": "open"
}
```

**Errores:**
- `401`: No autenticado
- `404`: Instancia no encontrada
- `500`: Error del servidor

---

### Eliminar Instancia
**DELETE** `/api/instances/:id`

Elimina una instancia de WhatsApp (tanto de la base de datos como de Evolution API).

**Response (200):**
```json
{
  "message": "Instance deleted successfully"
}
```

**Errores:**
- `401`: No autenticado
- `404`: Instancia no encontrada
- `500`: Error del servidor

---

## 🔔 Webhooks

### Webhook de Evolution API
**POST** `/api/webhooks/evolution`

Recibe eventos de Evolution API para actualizar el estado de las instancias.

**Request Body (ejemplo):**
```json
{
  "event": "connection.update",
  "instance": "12334455_1",
  "data": {
    "state": "open",
    "phoneNumber": "18094973030@s.whatsapp.net"
  }
}
```

**Response (200):**
```json
{
  "message": "Webhook processed successfully"
}
```

**Eventos soportados:**
- `connection.update`: Actualización del estado de conexión
- `qrcode.updated`: Nuevo código QR generado

---

## 👑 Admin

### Listar Todos los Usuarios
**GET** `/api/admin/users`

Obtiene todos los usuarios del sistema (solo admin).

**Response (200):**
```json
[
  {
    "id": "user-id",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "user",
    "phoneNumber": "+18094973030",
    "createdAt": "2025-10-27T12:00:00.000Z"
  }
]
```

**Errores:**
- `401`: No autenticado
- `403`: No autorizado (no es admin)
- `500`: Error del servidor

---

### Listar Todas las Subcuentas
**GET** `/api/admin/subaccounts`

Obtiene todas las subcuentas del sistema (solo admin).

**Response (200):**
```json
[
  {
    "id": "subaccount-id",
    "userId": "user-id",
    "locationId": "12334455",
    "name": "Mi Negocio",
    "isActive": true
  }
]
```

**Errores:**
- `401`: No autenticado
- `403`: No autorizado (no es admin)
- `500`: Error del servidor

---

### Listar Todas las Instancias
**GET** `/api/admin/instances`

Obtiene todas las instancias de WhatsApp del sistema (solo admin).

**Response (200):**
```json
[
  {
    "id": "instance-id",
    "userId": "user-id",
    "subaccountId": "subaccount-id",
    "locationId": "12334455",
    "evolutionInstanceName": "12334455_1",
    "status": "connected",
    "phoneNumber": "+18094973030"
  }
]
```

**Errores:**
- `401`: No autenticado
- `403`: No autorizado (no es admin)
- `500`: Error del servidor

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - No autorizado |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🔒 Seguridad

- Todas las contraseñas se almacenan encriptadas con bcrypt
- Las sesiones se almacenan en PostgreSQL con TTL de 7 días
- Los API keys de OpenAI se almacenan en texto plano (considera encriptación en producción)
- CORS está configurado para permitir credenciales

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Flujo completo de autenticación y creación de instancia

```bash
# 1. Registrar usuario
curl -X POST https://whatsapp.cloude.es/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "miContraseña123",
    "name": "Juan Pérez"
  }'

# 2. Login
curl -X POST https://whatsapp.cloude.es/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "miContraseña123"
  }'

# 3. Obtener subcuentas
curl -X GET https://whatsapp.cloude.es/api/subaccounts/user/USER_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Crear instancia de WhatsApp
curl -X POST https://whatsapp.cloude.es/api/instances \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "userId": "USER_ID",
    "subaccountId": "SUBACCOUNT_ID",
    "locationId": "12334455",
    "customName": "WhatsApp Ventas",
    "evolutionInstanceName": "12334455_1"
  }'

# 5. Generar código QR
curl -X POST https://whatsapp.cloude.es/api/instances/INSTANCE_ID/generate-qr \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Ejemplo 2: Configurar OpenAI API Key desde n8n

```bash
# Actualizar API key de OpenAI
curl -X PATCH https://whatsapp.cloude.es/api/subaccounts/12334455/openai-key \
  -H "Content-Type: application/json" \
  -d '{
    "openaiApiKey": "sk-proj-..."
  }'

# Obtener información del cliente incluyendo OpenAI API key
curl -X GET https://whatsapp.cloude.es/api/subaccounts/12334455/info \
  -H "Content-Type: application/json"
```

---

## 📞 Soporte

Para soporte técnico, contacta a: ray@ramautos.do

---

**Última actualización**: Octubre 27, 2025  
**Versión del API**: 1.0
