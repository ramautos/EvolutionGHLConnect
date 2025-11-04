# 📋 ANÁLISIS: Archivos Soportados en GHL

## 🔍 HALLAZGOS EN LA DOCUMENTACIÓN

### ✅ ARCHIVOS SOPORTADOS (Endpoint Upload)

Según la documentación oficial de GHL (`/conversations/messages/upload`):

```
JPG, JPEG, PNG        ← Imágenes
MP4, MPEG             ← Videos
MP3, WAV              ← Audio
PDF, DOC, DOCX, TXT   ← Documentos
ZIP, RAR              ← Archivos comprimidos
```

---

## 📱 TIPOS DE MENSAJE EN GHL

### Tipos disponibles en `type`:

1. **SMS** - Mensajes de texto
2. **Email** - Correos electrónicos
3. **WhatsApp** - WhatsApp Business
4. **GMB** - Google My Business
5. **IG** - Instagram
6. **FB** - Facebook Messenger
7. **Custom** - Proveedor personalizado
8. **WebChat** - Chat web
9. **Live_Chat** - Chat en vivo
10. **Call** - Llamadas

---

## ⚠️ IMPORTANTE: SMS vs WhatsApp

### 🚫 SMS (type: "SMS")

**NO soporta attachments directamente** a menos que:
- El número tenga capacidad **MMS** (Multimedia Messaging Service)
- Si no tiene MMS, los attachments son **ignorados**

**Documentación dice:**
> "Attachments will be empty for Call and Voicemails"

SMS tradicional **NO puede** enviar imágenes/videos/audios.

---

### ✅ WhatsApp (type: "WhatsApp")

**SÍ soporta attachments completamente**

Soporta:
- ✅ Imágenes (JPG, JPEG, PNG)
- ✅ Videos (MP4, MPEG)
- ✅ Audio (MP3, WAV, OGG)
- ✅ Documentos (PDF, DOC, DOCX, TXT)
- ✅ Archivos comprimidos (ZIP, RAR)

---

## 🎯 CONCLUSIÓN PARA TU CASO

### ❌ **NO uses type: "SMS"** para enviar archivos multimedia

Aunque Evolution API está conectado a WhatsApp, si envías con `type: "SMS"`, GHL:
- ❌ Ignorará los attachments
- ❌ Solo enviará el texto
- ❌ NO funcionará con archivos multimedia

### ✅ **USA type: "WhatsApp"** siempre

Para que los archivos funcionen:

```json
{
  "type": "WhatsApp",  // ← IMPORTANTE: WhatsApp, NO SMS
  "contactId": "...",
  "conversationId": "...",
  "locationId": "...",
  "message": "Audio recibido",
  "attachments": ["https://url-del-archivo.com/audio.ogg"]
}
```

---

## 🔧 SOLUCIÓN PARA EVOLUTION API → GHL

### PROBLEMA IDENTIFICADO

Tus mensajes llegaban vacíos porque probablemente estabas usando:
```json
{
  "type": "SMS",  // ← ERROR: SMS no soporta multimedia
  "attachments": ["https://mmg.whatsapp.net/..."]
}
```

### SOLUCIÓN CORRECTA

```json
{
  "type": "WhatsApp",  // ← CORRECTO
  "attachments": ["URL_PÚBLICA_DEL_ARCHIVO"]
}
```

**PERO** la URL debe ser pública y accesible, **NO** de `mmg.whatsapp.net`.

---

## 📊 FLUJO COMPLETO FUNCIONANDO

### PASO 1: Obtener archivo desde Evolution API

Evolution API envía webhook con:
```json
{
  "data": {
    "messageType": "audioMessage",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/..."  // ← URL temporal de WhatsApp
      }
    }
  }
}
```

### PASO 2: Descargar el archivo

```bash
curl "https://mmg.whatsapp.net/..." -o audio.ogg
```

### PASO 3: Subir a GHL

```bash
curl -X POST "https://services.leadconnectorhq.com/conversations/messages/upload" \
  -H "Version: 2021-04-15" \
  -H "Authorization: Bearer TOKEN" \
  -F "conversationId=xxx" \
  -F "locationId=xxx" \
  -F "fileAttachment=@audio.ogg"
```

**Respuesta:**
```json
{
  "uploadedFiles": {
    "url": "https://storage.googleapis.com/msgsndr/.../audio.ogg"
  }
}
```

### PASO 4: Enviar mensaje inbound con URL de GHL

```bash
curl -X POST "https://services.leadconnectorhq.com/conversations/messages/inbound" \
  -H "Version: 2021-04-15" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "WhatsApp",
    "contactId": "xxx",
    "conversationId": "xxx",
    "locationId": "xxx",
    "message": "Audio recibido",
    "attachments": ["https://storage.googleapis.com/msgsndr/.../audio.ogg"]
  }'
```

---

## 🎬 RESUMEN

### ✅ LO QUE FUNCIONA:

```json
{
  "type": "WhatsApp",
  "attachments": ["https://storage.googleapis.com/..."]
}
```

### ❌ LO QUE NO FUNCIONA:

```json
// Error 1: Tipo incorrecto
{
  "type": "SMS",  // ← NO soporta multimedia
  "attachments": ["..."]
}

// Error 2: URL no accesible
{
  "type": "WhatsApp",
  "attachments": ["https://mmg.whatsapp.net/..."]  // ← GHL no puede descargar
}
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Usar `type: "WhatsApp"` siempre
2. ✅ Subir archivos a GHL primero usando `/upload`
3. ✅ Usar la URL que GHL devuelve en `attachments`
4. ✅ Olvídate de MinIO por ahora (opcional para el futuro)

---

## 💡 ALTERNATIVA MÁS SIMPLE

Si no quieres lidiar con MinIO:

### Opción 1: Upload directo a GHL (RECOMENDADO)
```
Evolution API → n8n descarga → n8n sube a GHL → URL de GHL → mensaje inbound
```

### Opción 2: MinIO (para el futuro)
```
Evolution API → MinIO (auto) → URL pública → mensaje inbound directo
```

---

**CONCLUSIÓN:** Usa `type: "WhatsApp"` y sube los archivos a GHL primero.
