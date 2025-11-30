# GoHighLevel OAuth 2.0 Authorization

## Resumen

HighLevel implementa el flujo **Authorization Code Grant** para OAuth 2.0.

## Flujo de Autorización

1. Usuario redirige a URL de instalación
2. Código de autorización retornado
3. Código intercambiado por access token
4. Token usado para llamadas API

## Endpoints

### Token Exchange Endpoint

**URL:** `https://services.leadconnectorhq.com/oauth/token`

**Método:** POST

**Headers Requeridos:**
```
Accept: application/json
Content-Type: application/json
```

### Intercambiar Código por Access Token

**Request Parameters:**
| Parámetro | Descripción |
|-----------|-------------|
| `client_id` | ID del cliente de tu app |
| `client_secret` | Secret key de tu app |
| `grant_type` | `"authorization_code"` |
| `code` | Código de autorización del redirect |
| `user_type` | `"Company"` o `"Location"` |
| `redirect_uri` | Debe coincidir con URL registrada |

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86399,
  "refresh_token": "abc123...",
  "userType": "Company",
  "companyId": "GNb7aIv4rQFVb9iwNl5K",
  "locationId": "HjiMUOsCCHCjtxzEf8PR",
  "userId": "user123",
  "isBulkInstallation": false
}
```

## Refresh Token

**Mismo endpoint** con parámetros modificados:
- `grant_type`: `"refresh_token"`
- `refresh_token`: Token de refresh previo

**IMPORTANTE:** Una vez usado el Refresh Token, este se invalida y la respuesta incluye uno nuevo.

### Tiempos de Expiración
- **Access Token:** ~24 horas (86,399 segundos)
- **Refresh Token:** 1 año o hasta ser usado

## Generar Token de Sub-Account

**URL:** `https://services.leadconnectorhq.com/oauth/locationToken`

**Método:** POST

**Headers:**
```
Content-Type: application/json
Accept: application/json
Version: 2021-07-28
Authorization: Bearer {agency_access_token}
```

**Body:**
```json
{
  "companyId": "string",
  "locationId": "string"
}
```

## Tipos de Access Token

### 1. Agency-level (Company)
- `userType: "Company"`
- Usado para operaciones de agencia
- Crear sub-accounts, manejar compañías
- Incluye `companyId`

### 2. Location-level (Sub-Account)
- `userType: "Location"`
- Usado para operaciones de sub-cuenta
- Contactos, calendarios, workflows
- Incluye `locationId` y `companyId`

## Scopes (Permisos)

Los scopes definen el nivel de acceso de tu app. Ejemplos:

```
calendars.readonly
calendars.write
calendars/events.readonly
calendars/events.write
contacts.readonly
contacts.write
conversations.readonly
conversations.write
locations.readonly
locations.write
```

**Best Practice:** Solicita solo los scopes mínimos necesarios.

## Rate Limits

- **Burst limit:** Máximo 100 requests por 10 segundos por app/recurso
- **Daily limit:** 200,000 requests por día por app/recurso

## URL Base de la API

```
https://services.leadconnectorhq.com/
```

Autorización via Bearer token en header:
```
Authorization: Bearer {access_token}
```

## Recursos

- [Documentación OAuth 2.0](https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html)
- [Developer Portal](https://marketplace.gohighlevel.com/docs/)
- [Developer Community](https://developers.gohighlevel.com/)
