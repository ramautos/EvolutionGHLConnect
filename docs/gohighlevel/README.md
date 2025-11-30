# GoHighLevel API Documentation

Documentacion completa de la API de GoHighLevel para desarrollo de apps del Marketplace.

## Indice de Documentacion

| # | Archivo | Descripcion |
|---|---------|-------------|
| 1 | [01-oauth-authorization.md](./01-oauth-authorization.md) | OAuth 2.0, tokens, scopes, endpoints |
| 2 | [02-external-authentication.md](./02-external-authentication.md) | Autenticacion externa, PKCE, API Keys |
| 3 | [03-sub-accounts-api.md](./03-sub-accounts-api.md) | Sub-Accounts/Locations API, distribucion |
| 4 | [04-webhooks.md](./04-webhooks.md) | Webhooks, eventos install/uninstall |
| 5 | [05-sso-user-context.md](./05-sso-user-context.md) | SSO, User Context, desencriptacion |
| 6 | [06-custom-menus.md](./06-custom-menus.md) | Custom Menus API, iframes |
| 7 | [07-marketplace-modules.md](./07-marketplace-modules.md) | Modulos del Marketplace (Payments, etc) |
| 8 | [08-getting-started.md](./08-getting-started.md) | Guia de inicio, template, configuracion |
| 9 | [09-glossary.md](./09-glossary.md) | Glosario de terminos |

## URLs Importantes

### Documentacion Oficial
- **Developer Portal:** https://marketplace.gohighlevel.com/docs/
- **OAuth 2.0:** https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html
- **Developer Community:** https://developers.gohighlevel.com/

### API Base URL
```
https://services.leadconnectorhq.com/
```

### Repositorios de Ejemplo
- **App Template:** https://github.com/GoHighLevel/ghl-marketplace-app-template
- **OAuth Demo:** https://github.com/GoHighLevel/oauth-demo

### Soporte
- **Developer Slack:** https://developers.gohighlevel.com/join-dev-community
- **Bug Reports:** https://developers.gohighlevel.com/support

## Quick Reference

### Endpoints Principales

| Endpoint | Descripcion |
|----------|-------------|
| `POST /oauth/token` | Intercambiar codigo por token |
| `POST /oauth/locationToken` | Generar token de sub-account |
| `GET /oauth/installedLocations` | Locations donde app esta instalada |
| `GET /locations/:locationId` | Obtener detalles de sub-account |
| `POST /custom-menus/` | Crear menu personalizado |

### Headers Requeridos

```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
Version: 2021-07-28
```

### Rate Limits
- **Burst:** 100 requests / 10 segundos
- **Daily:** 200,000 requests / dia

### Token Expiration
- **Access Token:** ~24 horas
- **Refresh Token:** 1 año (o hasta usar)

## Uso para Desarrollo

Esta documentacion esta destinada a ayudar en el desarrollo de la aplicacion EvolutionGHLConnect, especificamente para:

1. **Instalacion en Sub-Accounts:** Permitir que sub-cuentas vean su propia seccion
2. **Integracion OAuth:** Manejar autorizacion correctamente
3. **Webhooks:** Recibir eventos de install/uninstall
4. **SSO:** Obtener contexto del usuario autenticado
5. **Custom Menus:** Crear navegacion personalizada

---

*Documentacion recopilada de https://marketplace.gohighlevel.com/docs/*
*Fecha: 2025*
