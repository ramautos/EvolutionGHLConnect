# ✅ SOLUCIÓN FINAL: Enviar Multimedia de Evolution API a GHL

## 🔍 EL PROBLEMA IDENTIFICADO

Las URLs de WhatsApp (`mmg.whatsapp.net`) **NO funcionan directamente** en GHL porque:
- Son URLs protegidas que requieren autenticación especial
- GHL no puede descargar archivos de ese dominio
- Por eso los mensajes llegan vacíos

---

## ✅ LA SOLUCIÓN CORRECTA

GHL tiene **su propio endpoint para subir archivos**:

**POST** `/conversations/messages/upload`

### Flujo completo:

```
1. Evolution API → n8n (webhook con URL de WhatsApp)
2. n8n descarga el archivo de WhatsApp
3. n8n sube el archivo a GHL usando endpoint /upload
4. GHL devuelve URL del archivo alojado en GHL
5. n8n envía mensaje inbound con la URL de GHL
```

---

## 📝 IMPLEMENTACIÓN EN N8N

### PASO 1: Descargar archivo de WhatsApp

```json
{
  "name": "Download Audio from WhatsApp",
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

### PASO 2: Subir a GHL

```json
{
  "name": "Upload to GHL",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://services.leadconnectorhq.com/conversations/messages/upload",
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
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {
          "name": "conversationId",
          "value": "={{ $('Get Conversation').item.json.conversationId }}"
        },
        {
          "name": "locationId",
          "value": "={{ $('Get Location').item.json.locationId }}"
        },
        {
          "name": "fileAttachment",
          "inputDataFieldName": "data"
        }
      ]
    }
  }
}
```

**Respuesta de GHL:**
```json
{
  "uploadedFiles": {
    "url": "https://storage.googleapis.com/ghl-files/audio_123.ogg"
  }
}
```

### PASO 3: Enviar mensaje inbound con URL de GHL

```json
{
  "name": "Send to GHL Inbound",
  "type": "n8n-nodes-base.httpRequest",
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
    "jsonBody": "={\n  \"type\": \"WhatsApp\",\n  \"contactId\": \"{{ $('Get Contact').item.json.contactId }}\",\n  \"conversationId\": \"{{ $('Get Conversation').item.json.conversationId }}\",\n  \"locationId\": \"{{ $('Get Location').item.json.locationId }}\",\n  \"message\": \"Audio recibido\",\n  \"attachments\": [\"{{ $('Upload to GHL').item.json.uploadedFiles.url }}\"]\n}"
  }
}
```

---

## 🎯 FORMATOS SOPORTADOS POR GHL

Según la documentación:
- ✅ JPG, JPEG, PNG
- ✅ MP4, MPEG
- ✅ MP3, WAV
- ✅ PDF, DOC, DOCX, TXT
- ✅ ZIP, RAR

---

## 📊 WORKFLOW N8N COMPLETO

```json
{
  "nodes": [
    {
      "parameters": {},
      "name": "Webhook Evolution",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const data = $input.item.json.data;\nconst messageType = data.messageType;\n\nlet mediaUrl = null;\nlet mimetype = null;\n\nif (messageType === \"audioMessage\") {\n  mediaUrl = data.message.audioMessage.url;\n  mimetype = data.message.audioMessage.mimetype;\n} else if (messageType === \"imageMessage\") {\n  mediaUrl = data.message.imageMessage.url;\n  mimetype = data.message.imageMessage.mimetype;\n} else if (messageType === \"videoMessage\") {\n  mediaUrl = data.message.videoMessage.url;\n  mimetype = data.message.videoMessage.mimetype;\n} else if (messageType === \"documentMessage\") {\n  mediaUrl = data.message.documentMessage.url;\n  mimetype = data.message.documentMessage.mimetype;\n}\n\nreturn {\n  json: {\n    mediaUrl: mediaUrl,\n    mimetype: mimetype,\n    messageType: messageType,\n    hasMedia: mediaUrl !== null,\n    remoteJid: data.key.remoteJid,\n    phoneNumber: data.key.remoteJid.split('@')[0]\n  }\n};"
      },
      "name": "Extract Media Info",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.hasMedia }}",
              "value2": true
            }
          ]
        }
      },
      "name": "Has Media?",
      "type": "n8n-nodes-base.if",
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $json.mediaUrl }}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        }
      },
      "name": "Download from WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [850, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages/upload",
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
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "name": "conversationId",
              "value": "={{ $('Get Conversation').item.json.conversationId }}"
            },
            {
              "name": "locationId",
              "value": "={{ $('Get Location').item.json.locationId }}"
            },
            {
              "name": "fileAttachment",
              "inputDataFieldName": "data"
            }
          ]
        }
      },
      "name": "Upload to GHL",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1050, 200]
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
        "jsonBody": "={\n  \"type\": \"WhatsApp\",\n  \"contactId\": \"{{ $('Get Contact').item.json.contactId }}\",\n  \"conversationId\": \"{{ $('Get Conversation').item.json.conversationId }}\",\n  \"locationId\": \"{{ $('Get Location').item.json.locationId }}\",\n  \"message\": \"Archivo recibido\",\n  \"attachments\": [\"{{ $json.uploadedFiles.url }}\"]\n}"
      },
      "name": "Send Inbound with GHL URL",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1250, 200]
    }
  ],
  "connections": {
    "Webhook Evolution": {
      "main": [[{"node": "Extract Media Info"}]]
    },
    "Extract Media Info": {
      "main": [[{"node": "Has Media?"}]]
    },
    "Has Media?": {
      "main": [[{"node": "Download from WhatsApp"}]]
    },
    "Download from WhatsApp": {
      "main": [[{"node": "Upload to GHL"}]]
    },
    "Upload to GHL": {
      "main": [[{"node": "Send Inbound with GHL URL"}]]
    }
  }
}
```

---

## 🔑 PUNTOS CLAVE

1. **NO uses** URLs de `mmg.whatsapp.net` directamente en attachments
2. **SÍ descarga** el archivo de WhatsApp primero
3. **SÍ sube** el archivo a GHL usando `/conversations/messages/upload`
4. **SÍ usa** la URL que GHL te devuelve en el campo `uploadedFiles.url`

---

## 📋 ENDPOINT DE GHL PARA UPLOAD

**POST** `https://services.leadconnectorhq.com/conversations/messages/upload`

**Headers:**
```
Version: 2021-04-15
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
```
conversationId: "ve9EPM428h8vShlRW1KT"
locationId: "jtEqGdhkoR6iePmZaCmd"
fileAttachment: [binary file data]
```

**Response:**
```json
{
  "uploadedFiles": {
    "url": "https://storage.googleapis.com/ghl-files/audio_123.ogg"
  }
}
```

---

## 🎯 RESUMEN EJECUTIVO

**PROBLEMA:** URLs de WhatsApp no funcionan en GHL

**SOLUCIÓN:** Usar endpoint de upload de GHL

**FLUJO:**
```
WhatsApp URL → Descargar → Subir a GHL → Obtener URL de GHL → Usar en inbound
```

**RESULTADO:** ✅ Archivos multimedia funcionando correctamente en GHL

---

## ⚠️ NOTA IMPORTANTE

Si prefieres **NO** descargar/resubir archivos, la **única alternativa** es:

**Configurar S3/MinIO en Evolution API** para que automáticamente:
1. Descargue archivos de WhatsApp
2. Los suba a S3
3. Te envíe URLs públicas de S3
4. Esas URLs SÍ funcionan en GHL

Pero si no quieres configurar S3, entonces **esta solución con el endpoint de upload de GHL es la correcta**.
