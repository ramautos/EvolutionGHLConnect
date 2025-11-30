# GoHighLevel Sub-Accounts (Locations) API

## Descripción

La API de OAuth ofrece dos tipos de acceso:
- **Location Level Access (Sub-Account):** Operaciones específicas de una sub-cuenta
- **Agency Level Access (Company):** Manejo de datos de toda la agencia

## Autenticación

Usa el Access Token generado con user type como Sub-Account (O) Private Integration Token de Sub-Account.

```
Authorization: Bearer {access_token}
```

## Endpoints Principales

### Get Sub-Account (Location)

**Endpoint:** `GET /locations/:locationId`

**Descripción:** Obtiene detalles de una Sub-Account por su ID

**Response Codes:**
| Código | Descripción |
|--------|-------------|
| 200 | Successful response |
| 400 | Bad Request |
| 401 | Unauthorized |
| 422 | Unprocessable Entity |

### Get Installed Locations

**Endpoint:** `GET /oauth/installedLocations`

**Descripción:** Obtiene las locations donde la app está instalada

**Response Codes:**
| Código | Descripción |
|--------|-------------|
| 200 | Successful response con datos de locations |
| 400 | Bad Request |
| 401 | Unauthorized |
| 422 | Unprocessable Entity |

### Create Sub-Account

**Endpoint:** `POST /locations`

**Descripción:** Crea una nueva sub-cuenta/location

## Tipos de Distribución de Apps

### 1. Target User: Agency
- **Alcance:** Apps solo a nivel de agencia
- **Instalación:** Solo admins/propietarios de agencia
- **Pago:** La agencia cubre costos
- **Reventa:** No permitida

### 2. Target User: Sub-account (Both Can Install)
- **Alcance:** Disponible para agencias y sub-cuentas
- **Instalación:** Ambos tipos pueden instalar
- **Bulk Installation:** Agencias pueden instalar en múltiples sub-cuentas
- **Reventa:** Permitida

### 3. Target User: Sub-account (Only Agency Can Install)
- **Alcance:** Solo visible en marketplace de agencia
- **Instalación:** Solo agencias instalan en sub-cuentas
- **Reventa:** Permitida con precios personalizados

## Instalación de Apps

### Proceso de Instalación

1. Abrir app en Marketplace
2. Click en "+ Add App"
3. Buscar la cuenta/location deseada
4. Seleccionar para establecer conexión webhook

### Instalación Masiva (Bulk)

- Elegir instalar para toda la agencia
- Seleccionar qué sub-cuentas tendrán acceso
- Instalar/desinstalar en todas las sub-cuentas a la vez

## Recursos

- [Sub-Account API](https://marketplace.gohighlevel.com/docs/ghl/locations/sub-account-formerly-location-api/index.html)
- [Get Location](https://marketplace.gohighlevel.com/docs/ghl/locations/get-location/index.html)
- [Get Installed Locations](https://marketplace.gohighlevel.com/docs/ghl/oauth/get-installed-location/index.html)
