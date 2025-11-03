# GoHighLevel - Enviar Mensajes Inbound con Audio e Imágenes

**Fecha**: 11 de Enero, 2025
**Propósito**: Documentar cómo enviar mensajes inbound a GoHighLevel con attachments (audio, imágenes, videos, etc.)

---

## 📋 Resumen

Para enviar mensajes con **audio** e **imágenes** a GoHighLevel, usas el **mismo endpoint** que para texto, pero agregando el campo `attachments` con un array de URLs públicas de los archivos.

---

## 🔗 Endpoint de Inbound Messages

```
POST https://services.leadconnectorhq.com/conversations/messages/inbound
```

**Headers**:
```json
{
  "Authorization": "Bearer {access_token}",
  "Version": "2021-04-15",
  "Content-Type": "application/json"
}
```

---

## 📊 Schema Completo

### Campos Principales

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `type` | string | ✅ | Tipo de mensaje: "SMS", "Email", "WhatsApp", "GMB", "IG", "FB", "Custom", "WebChat", "Live_Chat", "Call" |
| `conversationId` | string | ✅ | ID de la conversación |
| `conversationProviderId` | string | ⚠️ | Requerido solo para providers personalizados |
| `message` | string | ⚠️ | Texto del mensaje (opcional si solo envías media) |
| `attachments` | array[string] | ❌ | **Array de URLs** de archivos (imágenes, audio, video, PDF) |
| `contactId` | string | ❌ | ID del contacto |
| `locationId` | string | ❌ | ID de la location |
| `html` | string | ❌ | HTML del mensaje (solo para Email) |
| `subject` | string | ❌ | Asunto (solo para Email) |
| `altId` | string | ❌ | ID alternativo para providers personalizados |
| `dateAdded` | string | ❌ | Fecha del mensaje (ISO 8601) |

---

## 🎯 Tipos de Mensaje Soportados

```javascript
type: "SMS"        // Mensajes de texto SMS
type: "Email"      // Correos electrónicos
type: "WhatsApp"   // Mensajes de WhatsApp ← TU CASO
type: "GMB"        // Google My Business
type: "IG"         // Instagram
type: "FB"         // Facebook Messenger
type: "Custom"     // Providers personalizados
type: "WebChat"    // Chat web
type: "Live_Chat"  // Chat en vivo
type: "Call"       // Llamadas telefónicas
```

---

## 📱 EJEMPLO 1: Mensaje de TEXTO (Tu código actual)

```json
{
  "type": "SMS",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "conversationId": "fcanlLgpbQgQhderivVs",
  "locationId": "l1C08ntBrFjLS0elLIYU",
  "message": "Hola, este es un mensaje de texto\nDesde: +1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "conversationId": "fcanlLgpbQgQhderivVs",
  "messageId": "t22c6DQcTDf3MjRhwf77",
  "message": "Hola, este es un mensaje de texto...",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "dateAdded": "2025-01-11T20:00:00.000Z"
}
```

---

## 🖼️ EJEMPLO 2: Mensaje con IMAGEN

```json
{
  "type": "WhatsApp",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "conversationId": "fcanlLgpbQgQhderivVs",
  "locationId": "l1C08ntBrFjLS0elLIYU",
  "message": "Te envío una imagen",
  "attachments": [
    "https://tu-servidor.com/media/imagen-12345.jpg"
  ]
}
```

**Notas Importantes**:
- ✅ La URL debe ser **pública** y accesible
- ✅ Soporta: JPG, PNG, GIF, WebP
- ✅ El campo `message` es opcional (puedes enviar solo imagen)
- ⚠️ GHL descargará la imagen de la URL para mostrarla

---

## 🎤 EJEMPLO 3: Mensaje con AUDIO

```json
{
  "type": "WhatsApp",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "conversationId": "fcanlLgpbQgQhderivVs",
  "locationId": "l1C08ntBrFjLS0elLIYU",
  "message": "Mensaje de voz",
  "attachments": [
    "https://tu-servidor.com/media/audio-12345.ogg"
  ]
}
```

**Formatos de Audio Soportados**:
- ✅ OGG (Opus) - **Recomendado para WhatsApp**
- ✅ MP3
- ✅ WAV
- ✅ M4A
- ✅ AAC

**Notas**:
- WhatsApp usa OGG/Opus para notas de voz
- Evolution API genera archivos `.ogg` para audios de WhatsApp
- GHL reproducirá el audio en su interfaz

---

## 🎥 EJEMPLO 4: Mensaje con VIDEO

```json
{
  "type": "WhatsApp",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "conversationId": "fcanlLgpbQgQhderivVs",
  "locationId": "l1C08ntBrFjLS0elLIYU",
  "message": "Video adjunto",
  "attachments": [
    "https://tu-servidor.com/media/video-12345.mp4"
  ]
}
```

**Formatos de Video Soportados**:
- ✅ MP4
- ✅ MOV
- ✅ AVI
- ✅ WebM

---

## 📎 EJEMPLO 5: Mensaje con MÚLTIPLES ATTACHMENTS

```json
{
  "type": "WhatsApp",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "conversationId": "fcanlLgpbQgQhderivVs",
  "locationId": "l1C08ntBrFjLS0elLIYU",
  "message": "Te envío varios archivos",
  "attachments": [
    "https://tu-servidor.com/media/imagen-1.jpg",
    "https://tu-servidor.com/media/documento.pdf",
    "https://tu-servidor.com/media/audio.ogg"
  ]
}
```

---

## 📞 EJEMPLO 6: Mensaje de LLAMADA con Grabación (Voicemail)

```json
{
  "type": "Call",
  "contactId": "cI08i1Bls3iTB9bKgFJh",
  "conversationId": "fcanlLgpbQgQhderivVs",
  "locationId": "l1C08ntBrFjLS0elLIYU",
  "conversationProviderId": "provider-id-123",
  "attachments": [
    "https://tu-servidor.com/recordings/voicemail-12345.mp3"
  ],
  "call": {
    "from": "+1234567890",
    "to": "+0987654321",
    "duration": 45,
    "status": "voicemail"
  }
}
```

---

## 🔧 Workflow n8n: Enviar Mensaje con AUDIO

### Configuración Completa para tu Caso de Uso

```json
{
  "nodes": [
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
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ \n  {\n    \"type\": \"WhatsApp\",\n    \"contactId\": $json.contact_id,\n    \"conversationId\": $json.conversacion_id,\n    \"locationId\": $json.locationid,\n    \"message\": $json.hasOwnProperty('transcription') ? \n      `Audio transcrito: ${$json.transcription}\\nDesde: ${$json.senderEvolution}` : \n      `Audio de voz\\nDesde: ${$json.senderEvolution}`,\n    \"attachments\": [\n      $json.audio_url\n    ]\n  }\n}}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [640, 192],
      "id": "send-audio-to-ghl",
      "name": "Send Audio to GHL"
    }
  ]
}
```

**Explicación del JSON Body**:
```javascript
{
  "type": "WhatsApp",                    // Tipo WhatsApp
  "contactId": $json.contact_id,         // ID del contacto en GHL
  "conversationId": $json.conversacion_id, // ID de la conversación
  "locationId": $json.locationid,        // ID de la location
  "message": "Audio transcrito: ...",    // Texto opcional (transcripción)
  "attachments": [
    $json.audio_url                      // ← URL PÚBLICA del audio
  ]
}
```

---

## 🔧 Workflow n8n: Enviar Mensaje con IMAGEN

```json
{
  "nodes": [
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
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ \n  {\n    \"type\": \"WhatsApp\",\n    \"contactId\": $json.contact_id,\n    \"conversationId\": $json.conversacion_id,\n    \"locationId\": $json.locationid,\n    \"message\": $json.caption || \"Imagen recibida\",\n    \"attachments\": [\n      $json.image_url\n    ]\n  }\n}}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [640, 192],
      "id": "send-image-to-ghl",
      "name": "Send Image to GHL"
    }
  ]
}
```

---

## 🔧 Workflow n8n: CONDICIONAL por Tipo de Media

```json
{
  "nodes": [
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.messageType }}",
              "operation": "equals",
              "value2": "audioMessage"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [400, 192],
      "id": "check-if-audio",
      "name": "Is Audio?"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.messageType }}",
              "operation": "equals",
              "value2": "imageMessage"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [400, 350],
      "id": "check-if-image",
      "name": "Is Image?"
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
        "jsonBody": "={{ \n  {\n    \"type\": \"WhatsApp\",\n    \"contactId\": $json.contact_id,\n    \"conversationId\": $json.conversacion_id,\n    \"locationId\": $json.locationid,\n    \"message\": $json.messageType === 'audioMessage' ? \n      `🎤 Audio de voz\\nTranscripción: ${$json.transcription || 'No disponible'}` : \n      $json.messageType === 'imageMessage' ? \n      `📷 ${$json.caption || 'Imagen recibida'}` : \n      $json.messageType === 'videoMessage' ? \n      `🎥 ${$json.caption || 'Video recibido'}` : \n      $json.message,\n    \"attachments\": $json.media_url ? [$json.media_url] : []\n  }\n}}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [640, 192],
      "id": "send-to-ghl",
      "name": "Send to GHL"
    }
  ]
}
```

---

## ⚠️ REQUISITOS IMPORTANTES

### 1. URLs Públicas y Accesibles

Las URLs en `attachments` DEBEN ser:
- ✅ **Públicas** (no requieren autenticación)
- ✅ **HTTPS** (recomendado)
- ✅ **Accesibles desde internet** (GHL descargará el archivo)
- ✅ **Con headers CORS correctos** (si aplica)

**Ejemplo de URL válida**:
```
https://tu-servidor.com/media/audio-12345.ogg
https://storage.googleapis.com/bucket/image.jpg
https://s3.amazonaws.com/bucket/video.mp4
```

**❌ NO funcionará**:
```
http://localhost:3000/audio.ogg        // Localhost no es accesible
https://private.com/audio.ogg?token=   // Requiere autenticación
file:///path/to/audio.ogg              // URL local
```

### 2. Tipos MIME Correctos

El servidor debe retornar los headers correctos:
```
Content-Type: audio/ogg                // Para audio OGG
Content-Type: image/jpeg               // Para imágenes JPG
Content-Type: video/mp4                // Para videos MP4
Content-Type: application/pdf          // Para PDFs
```

### 3. Tamaño de Archivos

GHL tiene límites de tamaño:
- Imágenes: ~5-10 MB
- Audio: ~16 MB
- Video: ~16 MB
- Documentos: ~10 MB

---

## 🔄 Flujo Completo: Evolution API → n8n → GHL

### Paso 1: Evolution API Envía Webhook

```json
{
  "event": "messages.upsert",
  "instance": "instance123",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "msg123"
    },
    "message": {
      "audioMessage": {
        "url": "https://evolution-api.com/media/audio-xyz.ogg",
        "mimetype": "audio/ogg; codecs=opus",
        "seconds": 15
      }
    },
    "messageType": "audioMessage",
    "messageTimestamp": 1704988800
  }
}
```

### Paso 2: n8n Procesa el Webhook

```javascript
// Code Node: Procesar mensaje de Evolution
const message = $json.data.message;
const messageType = $json.data.messageType;

let mediaUrl = null;
let caption = null;
let transcription = null;

if (messageType === 'audioMessage') {
  mediaUrl = message.audioMessage.url;
  // Aquí podrías llamar a una API de transcripción (Gemini, ElevenLabs, etc.)
  transcription = await transcribeAudio(mediaUrl);
}

if (messageType === 'imageMessage') {
  mediaUrl = message.imageMessage.url;
  caption = message.imageMessage.caption || '';
}

if (messageType === 'videoMessage') {
  mediaUrl = message.videoMessage.url;
  caption = message.videoMessage.caption || '';
}

return [{
  json: {
    ...output,
    media_url: mediaUrl,
    caption: caption,
    transcription: transcription,
    messageType: messageType
  }
}];
```

### Paso 3: Obtener Token de GHL

```sql
-- SQL Query en n8n
SELECT access_token, locationid
FROM ghl_clientes
WHERE locationid = :locationId
LIMIT 1
```

### Paso 4: Enviar a GHL con Attachment

```javascript
// HTTP Request a GHL
{
  "type": "WhatsApp",
  "contactId": "{{ $json.contact_id }}",
  "conversationId": "{{ $json.conversacion_id }}",
  "locationId": "{{ $json.locationid }}",
  "message": "{{ $json.transcription ? `Transcripción: ${$json.transcription}` : 'Audio recibido' }}",
  "attachments": [
    "{{ $json.media_url }}"
  ]
}
```

---

## 🎯 TU CÓDIGO ACTUALIZADO

### Versión Original (Solo Texto)

```json
{
  "name": "type",
  "value": "SMS"
},
{
  "name": "message",
  "value": "={{ $('Code').item.json.mensaje }}\nDesde: {{ $('Code').item.json.senderEvolution }}\nTranscripcion:hola"
}
```

### ✅ Versión Mejorada (Con Audio)

```json
{
  "name": "type",
  "value": "WhatsApp"
},
{
  "name": "message",
  "value": "={{ $('Code').item.json.transcription || 'Audio de voz' }}\nDesde: {{ $('Code').item.json.senderEvolution }}"
},
{
  "name": "attachments",
  "value": "={{ [$('Code').item.json.audio_url] }}"
}
```

### ✅ Versión Mejorada (Con Imagen)

```json
{
  "name": "type",
  "value": "WhatsApp"
},
{
  "name": "message",
  "value": "={{ $('Code').item.json.caption || 'Imagen recibida' }}\nDesde: {{ $('Code').item.json.senderEvolution }}"
},
{
  "name": "attachments",
  "value": "={{ [$('Code').item.json.image_url] }}"
}
```

### ✅ Versión Universal (Detecta Tipo Automáticamente)

```json
{
  "name": "type",
  "value": "WhatsApp"
},
{
  "name": "message",
  "value": "={{ \n  $('Code').item.json.messageType === 'audioMessage' ? \n    ($('Code').item.json.transcription ? `🎤 Transcripción: ${$('Code').item.json.transcription}` : '🎤 Audio de voz') : \n  $('Code').item.json.messageType === 'imageMessage' ? \n    `📷 ${$('Code').item.json.caption || 'Imagen recibida'}` : \n  $('Code').item.json.messageType === 'videoMessage' ? \n    `🎥 ${$('Code').item.json.caption || 'Video recibido'}` : \n  $('Code').item.json.mensaje\n}}\\nDesde: {{ $('Code').item.json.senderEvolution }}"
},
{
  "name": "attachments",
  "value": "={{ $('Code').item.json.media_url ? [$('Code').item.json.media_url] : [] }}"
}
```

---

## 📝 Checklist de Implementación

- [ ] Verificar que Evolution API genera URLs públicas para media
- [ ] Confirmar que las URLs son accesibles desde internet
- [ ] Implementar transcripción de audio (opcional pero recomendado)
- [ ] Actualizar workflow n8n con campo `attachments`
- [ ] Cambiar `type` de "SMS" a "WhatsApp"
- [ ] Testing con mensaje de audio
- [ ] Testing con mensaje de imagen
- [ ] Testing con mensaje de video
- [ ] Testing con múltiples attachments
- [ ] Verificar que mensajes aparecen correctamente en GHL

---

## 🐛 Troubleshooting

### Error: "Attachment URL not accessible"

**Problema**: GHL no puede descargar el archivo
**Solución**:
- Verificar que la URL es pública
- Verificar headers CORS
- Verificar que el servidor está online

### Error: "Invalid attachment format"

**Problema**: Formato de archivo no soportado
**Solución**:
- Convertir audio a OGG/MP3
- Convertir imagen a JPG/PNG
- Verificar tipo MIME del archivo

### Error: "Attachment too large"

**Problema**: Archivo excede el límite de tamaño
**Solución**:
- Comprimir el archivo
- Reducir calidad de audio/video/imagen
- Dividir en múltiples mensajes

---

## 📚 Referencias

- **GHL API Docs**: https://marketplace.gohighlevel.com/docs/ghl/conversations/add-an-inbound-message
- **Conversation Providers**: ConversationProviders.md
- **Webhook InboundMessage**: InboundMessage.md
- **Evolution API**: Documentación de media messages

---

**Resumen**: Para enviar audio/imágenes a GHL, usa el MISMO endpoint pero agrega `attachments: ["url-del-archivo"]`. El campo `message` es opcional para solo media, pero recomendado para transcripciones.
