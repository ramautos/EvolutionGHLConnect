# CÓMO EXTRAER LA URL DE MULTIMEDIA DEL WEBHOOK DE EVOLUTION API

## 📩 FORMATO DEL WEBHOOK QUE RECIBES

Cuando Evolution API recibe un mensaje con audio/imagen, te envía este webhook a n8n:

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
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/o1/v/t24/f2/m233/AQMpP9qn6sS7GRC4TkrFrQZkJh6pYS4HOvc7FU20NLu87Y0r2m37Px2mUCGOhHKaLgIKlnmcvBsdhExTTuqQBivLf_UZ1-Ag-rjNOAbVeQ?ccb=9-4&oh=01_Q5Aa2wHxXMA5a1CGa8l6JWQ_g31S87jyMXOALRoqUwAaqC7Ajw&oe=692F99DA&_nc_sid=e6ed6c&mms3=true",
        "mimetype": "audio/ogg; codecs=opus",
        "fileSha256": "...",
        "fileLength": "45678",
        "seconds": 15,
        "ptt": true
      }
    }
  }
}
```

---

## 🎯 EXTRAER LA URL EN N8N

### 1. En un nodo **Code** de n8n:

```javascript
// Obtener el tipo de mensaje
const messageType = $input.item.json.data.messageType;

// Extraer URL según el tipo
let mediaUrl = null;
let caption = "";

if (messageType === "audioMessage") {
  mediaUrl = $input.item.json.data.message.audioMessage.url;
  caption = "Audio recibido";
}

if (messageType === "imageMessage") {
  mediaUrl = $input.item.json.data.message.imageMessage.url;
  caption = $input.item.json.data.message.imageMessage.caption || "Imagen recibida";
}

if (messageType === "videoMessage") {
  mediaUrl = $input.item.json.data.message.videoMessage.url;
  caption = $input.item.json.data.message.videoMessage.caption || "Video recibido";
}

if (messageType === "documentMessage") {
  mediaUrl = $input.item.json.data.message.documentMessage.url;
  caption = $input.item.json.data.message.documentMessage.fileName || "Documento recibido";
}

return {
  json: {
    mediaUrl: mediaUrl,
    caption: caption,
    messageType: messageType
  }
};
```

### 2. En expresiones de n8n:

**Para audio:**
```
={{ $json.data.message.audioMessage.url }}
```

**Para imagen:**
```
={{ $json.data.message.imageMessage.url }}
```

**Para video:**
```
={{ $json.data.message.videoMessage.url }}
```

---

## 📝 EJEMPLO: NODO HTTP REQUEST A GHL

```json
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
          "value": "=Bearer {{ $('Get Token').item.json.access_token }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"type\": \"WhatsApp\",\n  \"contactId\": \"{{ $('Get Contact').item.json.contactId }}\",\n  \"conversationId\": \"{{ $('Get Conversation').item.json.conversationId }}\",\n  \"locationId\": \"{{ $('Get Location').item.json.locationId }}\",\n  \"message\": \"{{ $json.caption }}\",\n  \"attachments\": [\"{{ $json.mediaUrl }}\"]\n}"
  }
}
```

---

## ⚠️ IMPORTANTE: LA URL ES TEMPORAL

La URL que te da Evolution API:
```
https://mmg.whatsapp.net/o1/v/t24/...?oe=692F99DA&...
```

**Características:**
- ✅ Es accesible públicamente (tiene tokens en los parámetros)
- ⚠️ **EXPIRA** (el parámetro `oe=692F99DA` es el timestamp de expiración)
- ⚠️ No es confiable para almacenamiento a largo plazo

**El parámetro `oe`:**
```
oe=692F99DA  →  Convierte a decimal: 1765066202  →  Fecha: 2025-02-06 aprox.
```

Esto significa que después de esa fecha, la URL ya no funcionará.

---

## ✅ OPCIONES PARA MANEJAR LA URL

### OPCIÓN 1: Usarla directo (rápido pero temporal)

**Pros:**
- Muy simple
- No requiere almacenamiento adicional
- Funciona inmediatamente

**Contras:**
- ⚠️ La URL expira en días/semanas
- ⚠️ Si el usuario ve la conversación después, el archivo no estará

**Código n8n:**
```json
{
  "attachments": ["={{ $json.data.message.audioMessage.url }}"]
}
```

---

### OPCIÓN 2: Descargar y resubir (permanente)

**Pros:**
- ✅ URL permanente
- ✅ Control total del archivo
- ✅ No depende de WhatsApp

**Contras:**
- Requiere servidor propio
- Más complejo de implementar
- Consume almacenamiento

**Pasos:**

1. **Descargar el archivo de WhatsApp:**
```json
{
  "name": "Download File",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "={{ $json.data.message.audioMessage.url }}",
    "options": {
      "response": {
        "response": {
          "responseFormat": "file"
        }
      }
    }
  }
}
```

2. **Subir a tu servidor:**
```json
{
  "name": "Upload to Server",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://tu-servidor.com/api/upload",
    "sendBody": true,
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {
          "name": "file",
          "inputDataFieldName": "data"
        }
      ]
    }
  }
}
```

3. **Usar la nueva URL en GHL:**
```json
{
  "attachments": ["={{ $json.url }}"]
}
```

---

### OPCIÓN 3: Configurar S3/MinIO en Evolution API (MEJOR)

**Pros:**
- ✅ Completamente automático
- ✅ URLs permanentes
- ✅ CDN incluido con S3
- ✅ No modifica tu workflow de n8n

**Configuración:**

En el `.env` de Evolution API:
```bash
S3_ENABLED=true
S3_ACCESS_KEY=tu_access_key
S3_SECRET_KEY=tu_secret_key
S3_BUCKET=evolution-media
S3_ENDPOINT=s3.amazonaws.com
S3_REGION=us-east-1
S3_USE_SSL=true
```

**Después de configurar S3, el webhook incluirá:**
```json
{
  "data": {
    "messageType": "audioMessage",
    "mediaUrl": "https://tu-bucket.s3.amazonaws.com/instance_123/audio_456.ogg",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/..."
      }
    }
  }
}
```

**En n8n solo extraes:**
```json
{
  "attachments": ["={{ $json.data.mediaUrl }}"]
}
```

---

## 🔄 CÓDIGO COMPLETO PARA N8N (Code Node)

Este código detecta el tipo y extrae la URL correctamente:

```javascript
// Obtener datos del webhook
const data = $input.item.json.data;
const messageType = data.messageType;

// Inicializar variables
let mediaUrl = null;
let caption = "";
let mimetype = "";
let fileName = "";

// Extraer según el tipo
switch (messageType) {
  case "audioMessage":
    mediaUrl = data.message.audioMessage.url;
    caption = "Audio recibido";
    mimetype = data.message.audioMessage.mimetype;
    fileName = `audio_${data.key.id}.ogg`;
    break;

  case "imageMessage":
    mediaUrl = data.message.imageMessage.url;
    caption = data.message.imageMessage.caption || "Imagen recibida";
    mimetype = data.message.imageMessage.mimetype;
    fileName = `image_${data.key.id}.jpg`;
    break;

  case "videoMessage":
    mediaUrl = data.message.videoMessage.url;
    caption = data.message.videoMessage.caption || "Video recibido";
    mimetype = data.message.videoMessage.mimetype;
    fileName = `video_${data.key.id}.mp4`;
    break;

  case "documentMessage":
    mediaUrl = data.message.documentMessage.url;
    caption = data.message.documentMessage.fileName || "Documento recibido";
    mimetype = data.message.documentMessage.mimetype;
    fileName = data.message.documentMessage.fileName;
    break;

  case "conversation":
  case "extendedTextMessage":
    // Es texto, no tiene multimedia
    caption = data.message.conversation || data.message.extendedTextMessage?.text;
    break;
}

// Retornar datos procesados
return {
  json: {
    messageType: messageType,
    mediaUrl: mediaUrl,
    caption: caption,
    mimetype: mimetype,
    fileName: fileName,
    hasMedia: mediaUrl !== null,
    remoteJid: data.key.remoteJid,
    messageId: data.key.id,
    pushName: data.pushName
  }
};
```

---

## 📊 RESUMEN: QUÉ HACER

1. **Para pruebas rápidas:** Usa la URL directo (`$json.data.message.audioMessage.url`)

2. **Para producción SIN S3:** Descarga y resube el archivo a tu servidor

3. **Para producción CON S3 (RECOMENDADO):** Configura S3 en Evolution API y usa `$json.data.mediaUrl`

---

## 🎬 PRÓXIMOS PASOS

1. **Decide qué opción usar** (temporal, resubir, o S3)
2. **Ajusta tu workflow de n8n** según la opción elegida
3. **Prueba con un mensaje de audio/imagen** desde WhatsApp
4. **Verifica que llegue a GHL** correctamente

¿Cuál opción prefieres implementar?
