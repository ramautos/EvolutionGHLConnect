# GoHighLevel - Implementación de Refresh Token con PostgreSQL

## 📚 Guía Completa para Manejar Tokens

**Última Actualización**: 29 de Octubre, 2025

---

## 🎯 Conceptos Clave

### Tokens en GoHighLevel

| Token | Duración | Uso |
|-------|----------|-----|
| **Access Token** | 24 horas (86,399 segundos) | Para hacer llamadas a la API |
| **Refresh Token** | 1 año (o hasta que se use) | Para obtener un nuevo access token |

### ⚠️ Importante
- Cuando usas un refresh token, obtienes un **NUEVO** refresh token
- El refresh token anterior se **INVALIDA** inmediatamente
- Siempre debes **ACTUALIZAR** ambos tokens en tu base de datos

---

## 1️⃣ Esquema de Base de Datos PostgreSQL

### Tabla para Instalaciones

```sql
-- Tabla para almacenar instalaciones de la app
CREATE TABLE ghl_installations (
    id SERIAL PRIMARY KEY,

    -- Identificadores de GoHighLevel
    location_id VARCHAR(255) UNIQUE,
    company_id VARCHAR(255),

    -- Tokens (encriptados en producción)
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,

    -- Metadata de tokens
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP NOT NULL,
    user_type VARCHAR(50), -- 'Location' o 'Company'

    -- Scopes autorizados
    scopes TEXT,

    -- Información de instalación
    is_bulk_installation BOOLEAN DEFAULT false,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_token_refresh TIMESTAMP,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_location_id ON ghl_installations(location_id);
CREATE INDEX idx_company_id ON ghl_installations(company_id);
CREATE INDEX idx_expires_at ON ghl_installations(expires_at);
CREATE INDEX idx_is_active ON ghl_installations(is_active);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ghl_installations_updated_at
    BEFORE UPDATE ON ghl_installations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Tabla para Log de Refresh (Opcional pero Recomendado)

```sql
-- Tabla para auditar refresh de tokens
CREATE TABLE ghl_token_refresh_log (
    id SERIAL PRIMARY KEY,
    installation_id INTEGER REFERENCES ghl_installations(id),
    location_id VARCHAR(255),

    -- Resultado del refresh
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- Metadata
    old_expires_at TIMESTAMP,
    new_expires_at TIMESTAMP,

    refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_log_installation ON ghl_token_refresh_log(installation_id);
CREATE INDEX idx_refresh_log_location ON ghl_token_refresh_log(location_id);
```

---

## 2️⃣ Configuración Inicial (Environment Variables)

```env
# .env
GHL_CLIENT_ID=your_client_id_here
GHL_CLIENT_SECRET=your_client_secret_here
GHL_REDIRECT_URI=https://yourdomain.com/oauth/callback

DATABASE_URL=postgresql://user:password@localhost:5432/ghl_app

# Encriptación (para producción)
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

---

## 3️⃣ Implementación Completa en Node.js

### A. Clase para Manejo de Tokens

```javascript
// services/ghl-token-manager.js
const axios = require('axios');
const { Pool } = require('pg');

class GHLTokenManager {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        this.clientId = process.env.GHL_CLIENT_ID;
        this.clientSecret = process.env.GHL_CLIENT_SECRET;
        this.tokenEndpoint = 'https://services.leadconnectorhq.com/oauth/token';
    }

    /**
     * Guardar tokens después de la instalación inicial
     */
    async saveInitialTokens(authorizationCode, userType = 'Company') {
        try {
            // Intercambiar código de autorización por tokens
            const tokenResponse = await axios.post(this.tokenEndpoint, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                code: authorizationCode,
                user_type: userType,
                redirect_uri: process.env.GHL_REDIRECT_URI
            });

            const {
                access_token,
                refresh_token,
                expires_in,
                userType: responseUserType,
                companyId,
                locationId,
                scope
            } = tokenResponse.data;

            // Calcular fecha de expiración
            const expiresAt = new Date(Date.now() + (expires_in * 1000));

            // Guardar en la base de datos
            const query = `
                INSERT INTO ghl_installations (
                    location_id,
                    company_id,
                    access_token,
                    refresh_token,
                    expires_at,
                    user_type,
                    scopes,
                    installed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (location_id)
                DO UPDATE SET
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
                RETURNING *
            `;

            const result = await this.pool.query(query, [
                locationId || null,
                companyId || null,
                access_token,
                refresh_token,
                expiresAt,
                responseUserType,
                scope
            ]);

            console.log('✅ Tokens guardados exitosamente:', {
                locationId,
                companyId,
                expiresAt
            });

            return result.rows[0];
        } catch (error) {
            console.error('❌ Error guardando tokens iniciales:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Obtener access token válido (refrescando si es necesario)
     */
    async getValidAccessToken(locationId) {
        try {
            // Buscar instalación en la base de datos
            const query = `
                SELECT * FROM ghl_installations
                WHERE location_id = $1 AND is_active = true
                LIMIT 1
            `;

            const result = await this.pool.query(query, [locationId]);

            if (result.rows.length === 0) {
                throw new Error(`No se encontró instalación para location: ${locationId}`);
            }

            const installation = result.rows[0];
            const now = new Date();
            const expiresAt = new Date(installation.expires_at);

            // Verificar si el token está por expirar (menos de 5 minutos)
            const fiveMinutes = 5 * 60 * 1000;
            const isExpiringSoon = (expiresAt.getTime() - now.getTime()) < fiveMinutes;

            if (isExpiringSoon) {
                console.log('🔄 Token expirando pronto, refrescando...');
                return await this.refreshAccessToken(installation);
            }

            console.log('✅ Token válido, usando existente');
            return installation.access_token;

        } catch (error) {
            console.error('❌ Error obteniendo access token:', error.message);
            throw error;
        }
    }

    /**
     * Refrescar access token usando refresh token
     */
    async refreshAccessToken(installation) {
        const startTime = Date.now();

        try {
            console.log('🔄 Iniciando refresh de token para:', installation.location_id);

            // Llamar al endpoint de refresh
            const response = await axios.post(this.tokenEndpoint, {
                grant_type: 'refresh_token',
                refresh_token: installation.refresh_token,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                user_type: installation.user_type || 'Company'
            });

            const {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
                expires_in
            } = response.data;

            // Calcular nueva fecha de expiración
            const newExpiresAt = new Date(Date.now() + (expires_in * 1000));

            // Actualizar tokens en la base de datos
            const updateQuery = `
                UPDATE ghl_installations
                SET
                    access_token = $1,
                    refresh_token = $2,
                    expires_at = $3,
                    last_token_refresh = NOW(),
                    updated_at = NOW()
                WHERE id = $4
                RETURNING *
            `;

            const updateResult = await this.pool.query(updateQuery, [
                newAccessToken,
                newRefreshToken,
                newExpiresAt,
                installation.id
            ]);

            // Registrar en el log
            await this.logTokenRefresh(
                installation.id,
                installation.location_id,
                true,
                installation.expires_at,
                newExpiresAt
            );

            const duration = Date.now() - startTime;
            console.log(`✅ Token refrescado exitosamente en ${duration}ms`);
            console.log('   Nueva expiración:', newExpiresAt);

            return newAccessToken;

        } catch (error) {
            // Registrar error en el log
            await this.logTokenRefresh(
                installation.id,
                installation.location_id,
                false,
                installation.expires_at,
                null,
                error.message
            );

            console.error('❌ Error refrescando token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Registrar refresh en el log (para auditoría)
     */
    async logTokenRefresh(installationId, locationId, success, oldExpiresAt, newExpiresAt, errorMessage = null) {
        try {
            const query = `
                INSERT INTO ghl_token_refresh_log (
                    installation_id,
                    location_id,
                    success,
                    error_message,
                    old_expires_at,
                    new_expires_at
                )
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            await this.pool.query(query, [
                installationId,
                locationId,
                success,
                errorMessage,
                oldExpiresAt,
                newExpiresAt
            ]);
        } catch (error) {
            console.error('Error guardando log de refresh:', error.message);
        }
    }

    /**
     * Hacer llamada a la API con manejo automático de refresh
     */
    async makeAPICall(locationId, method, endpoint, data = null) {
        try {
            // Obtener token válido (refrescará si es necesario)
            const accessToken = await this.getValidAccessToken(locationId);

            // Hacer la llamada a la API
            const config = {
                method: method,
                url: `https://services.leadconnectorhq.com${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28'
                }
            };

            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;

        } catch (error) {
            // Si el error es 401 (Unauthorized), intentar refresh una vez más
            if (error.response?.status === 401) {
                console.log('⚠️  401 Unauthorized, intentando refresh forzado...');

                const query = `SELECT * FROM ghl_installations WHERE location_id = $1`;
                const result = await this.pool.query(query, [locationId]);

                if (result.rows.length > 0) {
                    const newAccessToken = await this.refreshAccessToken(result.rows[0]);

                    // Reintentar la llamada con el nuevo token
                    const retryConfig = {
                        method: method,
                        url: `https://services.leadconnectorhq.com${endpoint}`,
                        headers: {
                            'Authorization': `Bearer ${newAccessToken}`,
                            'Content-Type': 'application/json',
                            'Version': '2021-07-28'
                        }
                    };

                    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                        retryConfig.data = data;
                    }

                    const retryResponse = await axios(retryConfig);
                    return retryResponse.data;
                }
            }

            throw error;
        }
    }

    /**
     * Desinstalar app (marcar como inactiva)
     */
    async uninstallApp(locationId) {
        try {
            const query = `
                UPDATE ghl_installations
                SET
                    is_active = false,
                    updated_at = NOW()
                WHERE location_id = $1
                RETURNING *
            `;

            const result = await this.pool.query(query, [locationId]);

            console.log('✅ App desinstalada para location:', locationId);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error desinstalando app:', error.message);
            throw error;
        }
    }
}

module.exports = GHLTokenManager;
```

---

## 4️⃣ Uso en tus Rutas/Controladores

### Instalación OAuth (Callback)

```javascript
// routes/oauth.js
const express = require('express');
const router = express.Router();
const GHLTokenManager = require('../services/ghl-token-manager');

const tokenManager = new GHLTokenManager();

// Callback de OAuth después de la instalación
router.get('/oauth/callback', async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                error: 'No authorization code provided'
            });
        }

        // Guardar tokens iniciales
        const installation = await tokenManager.saveInitialTokens(code);

        res.json({
            success: true,
            message: 'App instalada exitosamente',
            locationId: installation.location_id,
            expiresAt: installation.expires_at
        });

    } catch (error) {
        console.error('Error en OAuth callback:', error);
        res.status(500).json({
            error: 'Error procesando instalación',
            details: error.message
        });
    }
});

module.exports = router;
```

### Ejemplo: Obtener Contactos

```javascript
// routes/contacts.js
const express = require('express');
const router = express.Router();
const GHLTokenManager = require('../services/ghl-token-manager');

const tokenManager = new GHLTokenManager();

// Obtener contactos (con refresh automático)
router.get('/contacts/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;

        // makeAPICall maneja automáticamente el refresh si es necesario
        const contacts = await tokenManager.makeAPICall(
            locationId,
            'GET',
            `/contacts/?locationId=${locationId}`
        );

        res.json({
            success: true,
            data: contacts
        });

    } catch (error) {
        console.error('Error obteniendo contactos:', error);
        res.status(500).json({
            error: 'Error obteniendo contactos',
            details: error.message
        });
    }
});

// Crear contacto
router.post('/contacts/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        const contactData = req.body;

        const result = await tokenManager.makeAPICall(
            locationId,
            'POST',
            '/contacts/',
            contactData
        );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error creando contacto:', error);
        res.status(500).json({
            error: 'Error creando contacto',
            details: error.message
        });
    }
});

module.exports = router;
```

---

## 5️⃣ Webhook para Desinstalación

```javascript
// routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const GHLTokenManager = require('../services/ghl-token-manager');

const tokenManager = new GHLTokenManager();

// Verificar firma del webhook
function verifyWebhookSignature(payload, signature) {
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
... (tu clave pública completa aquí)
-----END PUBLIC KEY-----`;

    const verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(payload));
    verifier.end();

    return verifier.verify(publicKey, signature, 'base64');
}

// Endpoint para webhooks de GoHighLevel
router.post('/webhooks/ghl', express.json(), async (req, res) => {
    try {
        const signature = req.headers['x-wh-signature'];
        const payload = req.body;

        // Verificar firma
        const isValid = verifyWebhookSignature(payload, signature);

        if (!isValid) {
            console.error('⚠️  Firma de webhook inválida');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Procesar eventos
        const { type, locationId } = payload;

        switch (type) {
            case 'AppUninstall':
                await tokenManager.uninstallApp(locationId);
                console.log('📤 App desinstalada:', locationId);
                break;

            case 'AppInstall':
                console.log('📥 App instalada:', locationId);
                break;

            default:
                console.log('📬 Webhook recibido:', type);
        }

        // Siempre responder 200 OK inmediatamente
        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(500).json({ error: 'Error processing webhook' });
    }
});

module.exports = router;
```

---

## 6️⃣ Tarea Cron para Limpieza (Opcional)

```javascript
// tasks/cleanup-tokens.js
const { Pool } = require('pg');

async function cleanupExpiredTokens() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // Marcar como inactivas las instalaciones con tokens expirados hace más de 30 días
        const result = await pool.query(`
            UPDATE ghl_installations
            SET is_active = false
            WHERE expires_at < NOW() - INTERVAL '30 days'
            AND is_active = true
            RETURNING location_id
        `);

        console.log(`🧹 Limpieza: ${result.rowCount} instalaciones marcadas como inactivas`);

    } catch (error) {
        console.error('Error en limpieza:', error);
    } finally {
        await pool.end();
    }
}

// Ejecutar cada día
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
```

---

## 7️⃣ Ejemplo Completo de Servidor Express

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const app = express();

// Middlewares
app.use(express.json());

// Rutas
const oauthRoutes = require('./routes/oauth');
const contactsRoutes = require('./routes/contacts');
const webhookRoutes = require('./routes/webhooks');

app.use('/', oauthRoutes);
app.use('/api', contactsRoutes);
app.use('/', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});
```

---

## 📊 Resumen del Flujo

```
1. INSTALACIÓN
   Usuario instala app → Redirige a tu callback con code
   ↓
   Tu app intercambia code por tokens
   ↓
   Guardas access_token + refresh_token en PostgreSQL

2. USO NORMAL
   Necesitas hacer API call
   ↓
   getValidAccessToken(locationId)
   ↓
   Verifica si token expira pronto (< 5 min)
   ↓
   SI: Refresca automáticamente
   NO: Usa token existente

3. REFRESH
   refreshAccessToken()
   ↓
   POST a /oauth/token con refresh_token
   ↓
   Obtienes NUEVO access_token + NUEVO refresh_token
   ↓
   ACTUALIZAS ambos en PostgreSQL
   ↓
   El viejo refresh_token ya NO funciona

4. API CALL
   makeAPICall(locationId, method, endpoint, data)
   ↓
   Automáticamente obtiene token válido
   ↓
   Si falla con 401, intenta refresh una vez más
   ↓
   Retorna resultado
```

---

## ⚠️ Mejores Prácticas

### ✅ Hacer:
1. **Siempre actualizar ambos tokens** cuando hagas refresh
2. **Verificar expiración antes** de usar el token (5 min de buffer)
3. **Manejar 401** con retry automático (máximo 1 retry)
4. **Registrar refreshes** en tabla de log para auditoría
5. **Encriptar tokens** en producción
6. **Usar transacciones** al actualizar tokens

### ❌ No Hacer:
1. No almacenar tokens en texto plano en producción
2. No hacer refresh en cada request (verifica expiración primero)
3. No ignorar errores de refresh
4. No usar el viejo refresh token después de hacer refresh
5. No hacer múltiples refreshes simultáneos para el mismo location

---

## 🔒 Seguridad en Producción

### Encriptación de Tokens

```javascript
const crypto = require('crypto');

class TokenEncryption {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }

    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(text) {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
```

---

## 📚 Recursos Adicionales

- [Documentación Oficial OAuth](../gohighlevel-documentation.md)
- [SDK Oficial](https://github.com/GoHighLevel/highlevel-api-sdk)
- [OAuth Demo](https://github.com/GoHighLevel/oauth-demo)

---

**¿Preguntas?** Consulta la documentación completa en el directorio `/ghl/` 🚀
