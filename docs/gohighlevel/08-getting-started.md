# GoHighLevel Developer Marketplace - Getting Started

## Requisitos Previos

- Cuenta en https://marketplace.gohighlevel.com
- Acceso de administrador de agencia
- Navegador web actualizado

## Paso a Paso

### 1. Registro de Cuenta

1. Ir a https://marketplace.gohighlevel.com
2. Crear cuenta de desarrollador
3. Completar proceso de registro

### 2. Crear una Aplicación

1. Autenticarse en el marketplace
2. Ir a "My Apps"
3. Click en "Create App"

### 3. Configurar Información de Perfil

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Identificador único visible |
| **Tipo** | Pública o Privada |
| **Distribución** | Agency o Sub-Account |

### 4. Agregar Permisos (Scopes)

Consulta scopes disponibles en:
https://marketplace.gohighlevel.com/docs/Authorization/Scopes

### 5. Generar Credenciales

En configuración de la app:
1. Generar Client Key
2. Guardar de forma segura:
   - **Client ID**
   - **Client Secret**

## Configuración OAuth

### 6. Crear Endpoint OAuth GET

Crear ruta (ej: `/oauth/callback/gohighlevel`) que:
- Escuche solicitudes entrantes
- Capture parámetro `code`
- Almacene código de forma segura
- Realice POST al endpoint de token

### 7. Configurar URL de Redirect

En configuración de la app, establecer "OAuth Token Redirect URL" apuntando al endpoint creado.

### 8. Crear Endpoint de Webhook

Desarrollar endpoint POST para procesar payloads JSON de eventos de HighLevel.

### 9. Registrar URL del Webhook

Ingresar URL del endpoint en configuración de la aplicación.

### 10. Asignar Locations/Accounts

1. Iniciar sesión como admin de agencia
2. Buscar app en Marketplace
3. Click en "+ Add App"
4. Seleccionar location/account deseada

### 11. Obtener Código de Autorización

Tras agregar app, serás redirigido a URL con parámetro `code`:
```
https://tuapp.com/oauth/callback?code=c40216d8574eb90abe0c884058fa9f5101085exx
```

### 12. Completar Autenticación

Abrir nueva pestaña e ingresar:
```
TU_REDIRECT_URL?code=CODIGO_COPIADO
```

### 13. Verificar Conexión

Si recibes access token de `https://services.leadconnectorhq.com/oauth/token`, la conexión está establecida.

## Flujo OAuth Explicado

1. **Registro:** App recibe Client ID y Secret
2. **Solicitud:** App redirige usuario a servidor de autorización
3. **Consentimiento:** Usuario autoriza permisos (scopes)
4. **Código:** App recibe código temporal
5. **Token:** Se intercambia código por access token
6. **API:** Se usa token en headers `Authorization: Bearer {token}`
7. **Renovación:** Refresh token cuando expire

## Template de Aplicación

GitHub: https://github.com/GoHighLevel/ghl-marketplace-app-template

### Estructura
```
ghl-marketplace-app-template/
├── src/
│   ├── ui/                    # Vue 3
│   └── (Express server)
├── .env.example
├── package.json
└── README.md
```

### Rutas Incluidas

| Ruta | Propósito |
|------|-----------|
| `/authorize-handler` | Flujo OAuth |
| `/example-api-call` | Llamada API de empresa |
| `/example-api-call-location` | Llamada API de location |
| `/example-webhook-handler` | Procesar webhooks |
| `/decrypt-sso` | Desencriptar SSO |
| `/` | Servir Vue 3 app |

### Variables de Entorno
```env
GHL_APP_CLIENT_ID=<client_id>
GHL_APP_CLIENT_SECRET=<client_secret>
GHL_API_DOMAIN=https://services.leadconnectorhq.com
GHL_APP_SSO_KEY=<sso_key>
```

### Instalación
```bash
git clone git@github.com:GoHighLevel/ghl-marketplace-app-template.git
cd ghl-marketplace-app-template
npm install
npm run dev
```

## Recursos

- **Documentación:** https://marketplace.gohighlevel.com/docs/
- **Developer Community:** https://developers.gohighlevel.com/
- **GitHub Template:** https://github.com/GoHighLevel/ghl-marketplace-app-template
- **OAuth Demo:** https://github.com/GoHighLevel/oauth-demo
- **Soporte:** https://developers.gohighlevel.com/support
