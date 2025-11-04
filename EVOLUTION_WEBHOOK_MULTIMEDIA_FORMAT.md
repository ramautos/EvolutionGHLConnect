# FORMATO WEBHOOK DE EVOLUTION API PARA MULTIMEDIA

## CUANDO LLEGA UN MENSAJE CON AUDIO

### Webhook recibido de Evolution API:

```json
{
  "event": "messages.upsert",
  "instance": "tu_instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "pushName": "Juan Pérez",
    "messageType": "audioMessage",
    "messageTimestamp": 1698765432,
    "instanceId": "instance_id_123",
    "source": "android",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/v/t62.7114-24/XXXXX",
        "mimetype": "audio/ogg; codecs=opus",
        "fileSha256": "HASH_BASE64",
        "fileLength": "45678",
        "seconds": 15,
        "ptt": true,
        "mediaKey": "KEY_BASE64",
        "fileEncSha256": "ENC_HASH_BASE64",
        "directPath": "/v/t62.7114-24/XXXXX",
        "mediaKeyTimestamp": "1698765430"
      }
    }
  },
  "date_time": "2025-01-11T10:30:45.123Z",
  "sender": "5511999999999@s.whatsapp.net",
  "server_url": "http://localhost:8080",
  "apikey": "YOUR_API_KEY"
}
```

### Campos importantes:

- **`data.messageType`**: `"audioMessage"` - Indica que es un audio
- **`data.message.audioMessage.url`**: URL del archivo de audio (encriptado de WhatsApp)
- **`data.message.audioMessage.ptt`**: `true` si es mensaje de voz, `false` si es archivo de audio
- **`data.message.audioMessage.seconds`**: Duración del audio

---

## CUANDO LLEGA UN MENSAJE CON IMAGEN

### Webhook recibido de Evolution API:

```json
{
  "event": "messages.upsert",
  "instance": "tu_instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "pushName": "Juan Pérez",
    "messageType": "imageMessage",
    "messageTimestamp": 1698765432,
    "instanceId": "instance_id_123",
    "source": "android",
    "message": {
      "imageMessage": {
        "url": "https://mmg.whatsapp.net/v/t62.7118-24/XXXXX",
        "mimetype": "image/jpeg",
        "caption": "Mira esta foto!",
        "fileSha256": "HASH_BASE64",
        "fileLength": "123456",
        "height": 1920,
        "width": 1080,
        "mediaKey": "KEY_BASE64",
        "fileEncSha256": "ENC_HASH_BASE64",
        "directPath": "/v/t62.7118-24/XXXXX",
        "mediaKeyTimestamp": "1698765430",
        "jpegThumbnail": "BASE64_THUMBNAIL"
      }
    }
  },
  "date_time": "2025-01-11T10:30:45.123Z",
  "sender": "5511999999999@s.whatsapp.net",
  "server_url": "http://localhost:8080",
  "apikey": "YOUR_API_KEY"
}
```

### Campos importantes:

- **`data.messageType`**: `"imageMessage"` - Indica que es una imagen
- **`data.message.imageMessage.url`**: URL del archivo de imagen (encriptado de WhatsApp)
- **`data.message.imageMessage.caption`**: Texto que acompaña la imagen (opcional)
- **`data.message.imageMessage.mimetype`**: Tipo de imagen (image/jpeg, image/png, etc.)

---

## CUANDO LLEGA UN MENSAJE CON VIDEO

### Webhook recibido de Evolution API:

```json
{
  "event": "messages.upsert",
  "instance": "tu_instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "pushName": "Juan Pérez",
    "messageType": "videoMessage",
    "messageTimestamp": 1698765432,
    "instanceId": "instance_id_123",
    "source": "android",
    "message": {
      "videoMessage": {
        "url": "https://mmg.whatsapp.net/v/t62.7161-24/XXXXX",
        "mimetype": "video/mp4",
        "caption": "Mira este video!",
        "fileSha256": "HASH_BASE64",
        "fileLength": "789012",
        "seconds": 30,
        "mediaKey": "KEY_BASE64",
        "height": 1920,
        "width": 1080,
        "fileEncSha256": "ENC_HASH_BASE64",
        "directPath": "/v/t62.7161-24/XXXXX",
        "mediaKeyTimestamp": "1698765430",
        "jpegThumbnail": "BASE64_THUMBNAIL",
        "streamingSidecar": "BASE64_DATA"
      }
    }
  },
  "date_time": "2025-01-11T10:30:45.123Z",
  "sender": "5511999999999@s.whatsapp.net",
  "server_url": "http://localhost:8080",
  "apikey": "YOUR_API_KEY"
}
```

---

## PROBLEMA: LA URL ESTÁ ENCRIPTADA

Las URLs de WhatsApp (`https://mmg.whatsapp.net/...`) están **ENCRIPTADAS** y requieren las claves de Evolution API para descargarlas.

### SOLUCIÓN 1: USAR ENDPOINT DE EVOLUTION API PARA DESCARGAR

Evolution API tiene un endpoint para obtener el archivo en Base64:

**Endpoint:** `POST /chat/getBase64FromMediaMessage/:instanceName`

**Request:**
```json
{
  "message": {
    "key": {
      "id": "3EB0XXXXX",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    }
  },
  "convertToMp4": false
}
```

**Response:**
```json
{
  "mediaType": "audioMessage",
  "fileName": "audio_3EB0XXXXX.ogg",
  "caption": null,
  "size": {
    "fileLength": 45678,
    "height": 0,
    "width": 0
  },
  "mimetype": "audio/ogg; codecs=opus",
  "base64": "BASE64_DEL_ARCHIVO_AQUI...",
  "error": false,
  "message": "Media successfully converted to base64"
}
```

---

## SOLUCIÓN 2: CONFIGURAR S3/MINIO EN EVOLUTION API

Si configuras S3 o MinIO en Evolution API, automáticamente subirá los archivos y el webhook incluirá URLs públicas accesibles.

### Configurar S3 en Evolution API:

```bash
# En .env de Evolution API
S3_ENABLED=true
S3_ACCESS_KEY=tu_access_key
S3_SECRET_KEY=tu_secret_key
S3_BUCKET=evolution-media
S3_ENDPOINT=s3.amazonaws.com
S3_REGION=us-east-1
S3_USE_SSL=true
```

### Webhook CON S3 configurado:

```json
{
  "event": "messages.upsert",
  "instance": "tu_instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "pushName": "Juan Pérez",
    "messageType": "audioMessage",
    "messageTimestamp": 1698765432,
    "instanceId": "instance_id_123",
    "source": "android",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/v/t62.7114-24/XXXXX",
        "mimetype": "audio/ogg; codecs=opus",
        "fileSha256": "HASH_BASE64",
        "fileLength": "45678",
        "seconds": 15,
        "ptt": true,
        "mediaKey": "KEY_BASE64",
        "fileEncSha256": "ENC_HASH_BASE64",
        "directPath": "/v/t62.7114-24/XXXXX",
        "mediaKeyTimestamp": "1698765430"
      }
    },
    "mediaUrl": "https://tu-bucket.s3.amazonaws.com/evolution-media/instance_id_123/audio_3EB0XXXXX.ogg"
  },
  "date_time": "2025-01-11T10:30:45.123Z",
  "sender": "5511999999999@s.whatsapp.net",
  "server_url": "http://localhost:8080",
  "apikey": "YOUR_API_KEY"
}
```

**¡IMPORTANTE!** Con S3 configurado aparece el campo **`data.mediaUrl`** con la URL pública directa.

---

## FLUJO COMPLETO EN N8N

### Opción 1: SIN S3 (Usar endpoint de Evolution API)

```
1. Webhook n8n recibe mensaje de Evolution API
2. IF node: Verificar si messageType === "audioMessage"
3. HTTP Request a Evolution API:
   POST /chat/getBase64FromMediaMessage/:instanceName
4. Code node: Convertir base64 a URL temporal o subirlo a tu servidor
5. HTTP Request a GHL:
   POST /conversations/messages/inbound
   {
     "type": "WhatsApp",
     "contactId": "...",
     "conversationId": "...",
     "locationId": "...",
     "message": "Audio recibido",
     "attachments": ["https://tu-servidor.com/audio.ogg"]
   }
```

### Opción 2: CON S3 (Directo)

```
1. Webhook n8n recibe mensaje de Evolution API con mediaUrl
2. IF node: Verificar si messageType === "audioMessage"
3. HTTP Request a GHL:
   POST /conversations/messages/inbound
   {
     "type": "WhatsApp",
     "contactId": "...",
     "conversationId": "...",
     "locationId": "...",
     "message": "Audio recibido",
     "attachments": ["={{ $json.data.mediaUrl }}"]
   }
```

---

## WORKFLOW N8N COMPLETO (Opción 1 - Sin S3)

```json
{
  "nodes": [
    {
      "parameters": {},
      "name": "Webhook Evolution API",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "evolution-webhook"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.data.messageType }}",
              "operation": "equals",
              "value2": "audioMessage"
            }
          ]
        }
      },
      "name": "Is Audio?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=http://localhost:8080/chat/getBase64FromMediaMessage/{{ $json.instance }}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "YOUR_EVOLUTION_API_KEY"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "message",
              "value": "={{ { key: $json.data.key } }}"
            }
          ]
        },
        "options": {}
      },
      "name": "Get Audio Base64",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [650, 250]
    },
    {
      "parameters": {
        "jsCode": "// Subir el base64 a tu servidor y obtener URL pública\nconst base64Audio = $input.item.json.base64;\nconst fileName = $input.item.json.fileName;\n\n// Aquí deberías hacer un HTTP request a tu servidor\n// para subir el archivo y obtener una URL pública\n\n// Por ahora, devolvemos un placeholder\nreturn {\n  audioUrl: `https://tu-servidor.com/uploads/${fileName}`,\n  caption: $('Webhook Evolution API').item.json.data.message.audioMessage.caption || 'Audio recibido'\n};"
      },
      "name": "Process Audio",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [850, 250]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages/inbound",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Version",
              "value": "2021-04-15"
            },
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Get GHL Token').item.json.access_token }}"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"WhatsApp\",\n  \"contactId\": \"{{ $('Get Contact').item.json.contactId }}\",\n  \"conversationId\": \"{{ $('Get Conversation').item.json.conversationId }}\",\n  \"locationId\": \"{{ $('Get Location').item.json.locationId }}\",\n  \"message\": \"{{ $json.caption }}\",\n  \"attachments\": [\"{{ $json.audioUrl }}\"]\n}",
        "options": {}
      },
      "name": "Send to GHL",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [1050, 250]
    }
  ]
}
```

---

## RESUMEN: CAMPOS A EXTRAER DEL WEBHOOK

### Para AUDIO:
```javascript
// En n8n Code node
const messageType = $json.data.messageType;  // "audioMessage"
const audioUrl = $json.data.message.audioMessage.url;  // URL encriptada
const caption = $json.data.message.audioMessage.caption || "";
const duration = $json.data.message.audioMessage.seconds;
const ptt = $json.data.message.audioMessage.ptt;  // true si es voz
const messageId = $json.data.key.id;
const remoteJid = $json.data.key.remoteJid;

// Si tienes S3 configurado:
const publicUrl = $json.data.mediaUrl;  // URL pública directa
```

### Para IMAGEN:
```javascript
// En n8n Code node
const messageType = $json.data.messageType;  // "imageMessage"
const imageUrl = $json.data.message.imageMessage.url;  // URL encriptada
const caption = $json.data.message.imageMessage.caption || "";
const mimetype = $json.data.message.imageMessage.mimetype;
const messageId = $json.data.key.id;
const remoteJid = $json.data.key.remoteJid;

// Si tienes S3 configurado:
const publicUrl = $json.data.mediaUrl;  // URL pública directa
```

### Para VIDEO:
```javascript
// En n8n Code node
const messageType = $json.data.messageType;  // "videoMessage"
const videoUrl = $json.data.message.videoMessage.url;  // URL encriptada
const caption = $json.data.message.videoMessage.caption || "";
const duration = $json.data.message.videoMessage.seconds;
const messageId = $json.data.key.id;
const remoteJid = $json.data.key.remoteJid;

// Si tienes S3 configurado:
const publicUrl = $json.data.mediaUrl;  // URL pública directa
```

---

## TIPOS DE MENSAJES POSIBLES

Evolution API puede enviar estos tipos en `data.messageType`:

- `"conversation"` - Texto simple
- `"extendedTextMessage"` - Texto con formato/links
- `"imageMessage"` - Imagen
- `"videoMessage"` - Video
- `"audioMessage"` - Audio/voz
- `"documentMessage"` - Documento (PDF, Word, etc.)
- `"stickerMessage"` - Sticker
- `"ptvMessage"` - Video circular
- `"locationMessage"` - Ubicación
- `"contactMessage"` - Contacto
- `"reactionMessage"` - Reacción a mensaje

---

## RECOMENDACIÓN FINAL

**Configura S3 o MinIO en Evolution API** para que automáticamente:
1. Descargue los archivos multimedia
2. Los suba a S3/MinIO
3. Incluya la URL pública en el webhook (`data.mediaUrl`)
4. Tu workflow de n8n solo necesite extraer `data.mediaUrl` y pasarlo a GHL

**Sin S3:** Necesitas hacer una llamada extra al endpoint `/chat/getBase64FromMediaMessage` de Evolution API, luego subir el base64 a tu servidor para obtener una URL pública.
