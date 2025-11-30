# GoHighLevel External Authentication

## Descripción

HighLevel permite autenticación externa que facilita que usuarios verifiquen sus credenciales con sistemas del desarrollador **antes de instalar aplicaciones**.

## Métodos Disponibles

### 1. OAuth 2.0 Externo

#### Configuración Requerida
- Nombre de la aplicación tercera
- Client Key y Client Secret
- Permisos necesarios
- URL de callback/redirección

#### Parámetros de Autorización

| Parámetro | Valor del Sistema | Propósito |
|-----------|-------------------|-----------|
| `client_id` | `{{externalApp.clientId}}` | Identifica tu aplicación |
| `state` | `{{bundle.state}}` | Token seguridad anti-CSRF |
| `redirect_uri` | `{{bundle.redirectUrl}}` | URL de callback |
| `code` | `{{bundle.code}}` | Código temporal para tokens |

#### PKCE (Proof Key for Code Exchange)
- Genera verificadores únicos por solicitud
- Previene ataques de intercepción de códigos

#### Auto-refresh de Tokens
Habilítalo para evitar que la conexión se rompa al expirar el token.

### 2. API Key / Basic Auth

#### Configuración de Campos (máximo 3)
| Propiedad | Descripción |
|-----------|-------------|
| `Label` | Descripción visible al usuario |
| `Key` | Identificador para acceder al valor (ej: `{{userData.apiKey}}`) |
| `Type` | `"text"` o `"password"` |
| `Required` | Obligatoriedad del campo |

#### Endpoint de Autenticación

Configura la solicitud HTTP ejecutada durante instalación:

- **Método:** GET, POST, PUT o PATCH
- **URL, Headers, Body:** Según necesidades

**Códigos de éxito:** 200, 201, 202, 204

## Parámetros de Solicitud de Instalación

```json
{
  "companyId": "string|null",
  "locationId": ["string"],
  "approveAllLocations": boolean,
  "excludedLocations": ["string"]
}
```

### Comportamientos

- Si `approveAllLocations = true`: solo se envía `excludedLocations`
- Si `approveAllLocations = false`: se envía array de `locationId` seleccionadas

## Ejemplos

### Ubicación única seleccionada
```json
{
  "companyId": "123",
  "locationId": ["A"],
  "username": "user1",
  "approveAllLocations": false
}
```

### Todas las ubicaciones excepto algunas
```json
{
  "companyId": "123",
  "approveAllLocations": true,
  "excludedLocations": ["C", "D"]
}
```

## Testing

Ambos métodos incluyen funcionalidad para validar configuraciones antes de publicar:
- En OAuth: se ejecuta el API de prueba configurado después de generar tokens
