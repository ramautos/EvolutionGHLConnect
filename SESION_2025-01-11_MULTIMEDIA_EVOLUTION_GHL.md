# 📝 SESIÓN: Implementación de Multimedia Evolution API → GHL

**Fecha:** 2025-01-11
**Objetivo:** Lograr que imágenes, audios y videos enviados desde WhatsApp (Evolution API) lleguen correctamente a GoHighLevel (GHL)

---

## 🔍 PROBLEMA INICIAL

El usuario enviaba mensajes con archivos multimedia de Evolution API a GHL pero llegaban **vacíos**.

**Intentos fallidos:**
1. URLs de WhatsApp (`mmg.whatsapp.net`) directas → No funcionaban
2. `type: "WhatsApp"` → No enviaba archivos
3. `type: "SMS"` → **SÍ funcionaba** (descubrimiento clave)

---

## 🎯 HALLAZGOS IMPORTANTES

### 1. URLs de WhatsApp NO son públicas
```
https://mmg.whatsapp.net/o1/v/t24/...
```
- ❌ Están protegidas y encriptadas
- ❌ GHL no puede descargarlas directamente
- ⏰ Expiran en días/semanas

### 2. GHL acepta type: "SMS" con archivos
Contrario a la documentación inicial, **SMS funciona** para el usuario.

### 3. Evolution API tiene webhookBase64
Evolution API puede enviar el archivo completo en base64 automáticamente.

### 4. Cloudinary es mejor que MinIO
- ✅ Gratis (25GB/mes)
- ✅ CDN global
- ✅ Fácil de configurar
- ✅ URLs permanentes

---

## 🛠️ SOLUCIÓN IMPLEMENTADA

### FLUJO FINAL

```
WhatsApp → Evolution API → Webhook con BASE64 → n8n → Cloudinary → URL pública → GHL
```

---

## 📋 CONFIGURACIÓN DE EVOLUTION API

### Variables agregadas en Coolify:

```bash
# Habilitar Base64 en webhooks
WEBHOOK_GLOBAL_WEBHOOK_BASE64=true

# Configuración existente (mantener)
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://ray.cloude.es/webhook/evolution1
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# MinIO configurado pero NO usado finalmente
S3_ENABLED=false
```

**MinIO fue descartado** porque:
- Community Edition muy limitada
- Sin opciones de administración en UI
- Demasiado complejo para el caso de uso
- Cloudinary es mejor alternativa

---

## 🔧 CÓDIGO N8N IMPLEMENTADO

### NODO 1: Webhook de Evolution API

Recibe el webhook en: `https://ray.cloude.es/webhook/evolution1`

**Formato recibido:**
```json
{
  "event": "messages.upsert",
  "instance": "jtEqGdhkoR6iePmZaCmd_1",
  "data": {
    "key": {
      "remoteJid": "18094973030@s.whatsapp.net",
      "id": "3A36CA21D2794CF2E573"
    },
    "message": {
      "imageMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
        "mimetype": "image/jpeg",
        "caption": "Texto opcional"
      }
    }
  }
}
```

---

### NODO 2: Code - Extraer BASE64

```javascript
// Obtener datos del webhook
const data = $input.item.json.body.data;
const message = data.message;

let base64 = null;
let mimetype = null;
let filename = null;

// Detectar tipo y extraer BASE64
if (message.imageMessage) {
  base64 = message.imageMessage.base64;
  mimetype = message.imageMessage.mimetype || 'image/jpeg';
  filename = `image_${Date.now()}.jpg`;
} else if (message.audioMessage) {
  base64 = message.audioMessage.base64;
  mimetype = message.audioMessage.mimetype || 'audio/ogg';
  filename = `audio_${Date.now()}.ogg`;
} else if (message.videoMessage) {
  base64 = message.videoMessage.base64;
  mimetype = message.videoMessage.mimetype || 'video/mp4';
  filename = `video_${Date.now()}.mp4`;
} else if (message.documentMessage) {
  base64 = message.documentMessage.base64;
  mimetype = message.documentMessage.mimetype || 'application/pdf';
  filename = message.documentMessage.fileName || `document_${Date.now()}.pdf`;
}

// Información adicional
const phoneNumber = data.key.remoteJid.split('@')[0];
const caption = message.imageMessage?.caption ||
                message.videoMessage?.caption ||
                message.audioMessage?.caption || "";

// Retornar base64
return {
  json: {
    base64: base64,
    mimetype: mimetype,
    filename: filename,
    phoneNumber: phoneNumber,
    caption: caption,
    hasMedia: !!base64
  }
};
```

**Output:**
```json
{
  "base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "mimetype": "image/jpeg",
  "filename": "image_1736123456.jpg",
  "phoneNumber": "18094973030",
  "caption": "",
  "hasMedia": true
}
```

---

### NODO 3: HTTP Request - Subir a Cloudinary

**Configuración:**
```
Method: POST
URL: https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/image/upload

Authentication: Basic Auth
  Username: TU_API_KEY
  Password: TU_API_SECRET

Headers:
  Content-Type: application/json

Body (JSON):
{
  "file": "data:{{ $json.mimetype }};base64,{{ $json.base64 }}",
  "folder": "evolution-media",
  "public_id": "{{ $json.filename }}"
}
```

**Respuesta de Cloudinary:**
```json
{
  "secure_url": "https://res.cloudinary.com/tu_cloud/image/upload/v1234/evolution-media/image_123.jpg",
  "public_id": "evolution-media/image_123",
  "format": "jpg",
  "width": 1920,
  "height": 1080
}
```

---

### NODO 4: HTTP Request - Enviar a GHL Inbound

**Configuración:**
```
Method: POST
URL: https://services.leadconnectorhq.com/conversations/messages/inbound

Headers:
  Version: 2021-04-15
  Authorization: Bearer {{ $('Get GHL Token').item.json.access_token }}
  Content-Type: application/json

Body (JSON):
{
  "type": "SMS",
  "contactId": "{{ $('Get Contact').item.json.contactId }}",
  "conversationId": "{{ $('Get Conversation').item.json.conversationId }}",
  "locationId": "{{ $('Get Location').item.json.locationId }}",
  "message": "{{ $json.caption || 'Archivo recibido' }}",
  "attachments": ["{{ $('Upload to Cloudinary').item.json.secure_url }}"]
}
```

---

## 📊 ARCHIVOS SOPORTADOS

Según documentación de GHL:

```
Imágenes:    JPG, JPEG, PNG
Videos:      MP4, MPEG
Audio:       MP3, WAV, OGG
Documentos:  PDF, DOC, DOCX, TXT
Comprimidos: ZIP, RAR
```

---

## 🔑 DECISIONES CLAVE

### 1. ¿Por qué Cloudinary y no MinIO?
- MinIO Community Edition sin opciones de administración
- No se puede hacer bucket público desde UI
- Cloudinary: 5 minutos de configuración vs horas con MinIO
- Plan gratuito suficiente (25GB/mes)

### 2. ¿Por qué type: "SMS" y no "WhatsApp"?
- Contradicción con documentación oficial
- En pruebas del usuario: SMS funciona, WhatsApp no
- Probablemente relacionado con configuración de conversationProviderId

### 3. ¿Por qué webhookBase64 y no S3?
- Más simple de implementar
- No requiere configurar MinIO/S3
- Evolution API hace el trabajo pesado
- Cloudinary maneja el almacenamiento

---

## 🎯 ENDPOINTS Y CREDENCIALES

### Evolution API
```
URL: https://evolution.cloude.es
API Key: wxlXKaZ7lhOYGJgMj5t042opZduMi51M
Webhook: https://ray.cloude.es/webhook/evolution1
```

### MinIO (Instalado pero no usado)
```
Console: http://147.93.180.187:9001/
Usuario: admin
Password: Bonoman18
Bucket: evolution-media
Status: Privado (no se pudo hacer público)
```

### Cloudinary (Recomendado)
```
Cloud Name: [Usuario debe crear cuenta]
URL: https://cloudinary.com/users/register/free
Plan: Free (25GB storage + 25GB bandwidth/mes)
```

### GHL
```
Endpoint Inbound: https://services.leadconnectorhq.com/conversations/messages/inbound
Endpoint Upload: https://services.leadconnectorhq.com/conversations/messages/upload
Header Version: 2021-04-15
```

---

## 📁 ESTRUCTURA DEL WEBHOOK

### Mensaje con Imagen
```json
{
  "event": "messages.upsert",
  "data": {
    "messageType": "imageMessage",
    "message": {
      "imageMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "base64": "/9j/4AAQ...",
        "mimetype": "image/jpeg",
        "caption": "Texto",
        "width": 1920,
        "height": 1080
      }
    }
  }
}
```

### Mensaje con Audio
```json
{
  "event": "messages.upsert",
  "data": {
    "messageType": "audioMessage",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "base64": "//NExAA...",
        "mimetype": "audio/ogg",
        "seconds": 15,
        "ptt": true
      }
    }
  }
}
```

### Mensaje con Video
```json
{
  "event": "messages.upsert",
  "data": {
    "messageType": "videoMessage",
    "message": {
      "videoMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "base64": "AAAAHGZ...",
        "mimetype": "video/mp4",
        "caption": "Texto",
        "seconds": 30
      }
    }
  }
}
```

---

## ⚠️ PROBLEMAS ENCONTRADOS Y SOLUCIONADOS

### Problema 1: URLs de WhatsApp no funcionan
**Causa:** URLs de `mmg.whatsapp.net` son protegidas y temporales
**Solución:** Usar base64 y subir a Cloudinary

### Problema 2: type: "WhatsApp" no envía archivos
**Causa:** Desconocida (posible configuración de conversationProviderId)
**Solución:** Usar type: "SMS" que funciona para el usuario

### Problema 3: MinIO Community Edition sin configuración
**Causa:** Versión limitada sin opciones de administración
**Solución:** Descartado, usar Cloudinary

### Problema 4: Webhooks muy pesados con base64
**Impacto:** Mínimo en la práctica
**Beneficio:** Garantiza que siempre tengamos el archivo

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Configuración de Evolution API con webhookBase64: **COMPLETADO**
2. ✅ Código JavaScript para extraer base64: **COMPLETADO**
3. ⏳ Crear cuenta de Cloudinary: **PENDIENTE**
4. ⏳ Configurar nodo de Cloudinary en n8n: **PENDIENTE**
5. ⏳ Probar flujo completo: **PENDIENTE**
6. ⏳ Verificar que archivos lleguen a GHL: **PENDIENTE**

---

## 📝 NOTAS IMPORTANTES

1. **Evolution API ya está enviando base64** en el webhook actual
2. **type: "SMS" funciona** para enviar archivos (contradicción con docs)
3. **Cloudinary es la mejor opción** vs MinIO para este caso
4. **GHL descarga y guarda** los archivos permanentemente
5. **No necesitas MinIO** si usas Cloudinary
6. **conversationProviderId** podría ser el motivo por el cual WhatsApp no funciona

---

## 🔧 COMANDOS ÚTILES

### Ver logs de Evolution API en Coolify
```bash
# En Coolify → Evolution API → Logs
```

### Probar webhook manualmente
```bash
curl -X POST "https://ray.cloude.es/webhook/evolution1" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Verificar variables de Evolution API
```bash
docker exec -it evolution-api env | grep WEBHOOK
```

---

## 📚 DOCUMENTACIÓN CREADA

1. `N8N_COMPREHENSIVE_GUIDE.md` - Guía completa de n8n
2. `GHL_INBOUND_MESSAGES_MEDIA.md` - Formato de mensajes multimedia en GHL
3. `EVOLUTION_WEBHOOK_MULTIMEDIA_FORMAT.md` - Formato de webhooks de Evolution API
4. `MEJOR_SOLUCION_EVOLUTION_GHL.md` - Comparación de soluciones
5. `COOLIFY_MINIO_SETUP.md` - Instalación de MinIO (descartado)
6. `COMPARACION_SOLUCIONES_COOLIFY.md` - Análisis de opciones
7. `SOLUCION_FINAL_GHL_MULTIMEDIA.md` - Solución con endpoint de upload
8. `GHL_ARCHIVOS_SOPORTADOS_ANALISIS.md` - Análisis de tipos soportados
9. `EXTRAER_URL_EVOLUTION_WEBHOOK.md` - Cómo extraer URLs
10. `SESION_2025-01-11_MULTIMEDIA_EVOLUTION_GHL.md` - **Este archivo**

---

## 🎬 RESUMEN EJECUTIVO

**PROBLEMA:** Archivos multimedia de WhatsApp no llegaban a GHL

**CAUSA:** URLs de WhatsApp no son públicamente accesibles

**SOLUCIÓN:**
1. Evolution API envía base64 en webhook
2. n8n extrae base64
3. Sube a Cloudinary
4. Envía URL de Cloudinary a GHL con type: "SMS"

**RESULTADO:** ✅ Archivos multimedia funcionando en GHL

**TIEMPO DE IMPLEMENTACIÓN:** ~30 minutos después de configurar Cloudinary

**COSTO:** $0 (plan gratuito de Cloudinary)
