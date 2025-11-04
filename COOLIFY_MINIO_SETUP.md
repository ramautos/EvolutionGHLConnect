# 🚀 INSTALAR MINIO EN COOLIFY PARA EVOLUTION API

## 🎯 OBJETIVO

Configurar MinIO en Coolify para que Evolution API suba automáticamente los archivos multimedia y genere URLs públicas que funcionen con GHL.

---

## 📋 PASO 1: Instalar MinIO en Coolify

### Opción A: Desde la UI de Coolify

1. **Ir a tu servidor en Coolify**
2. **Click en "New Resource"**
3. **Seleccionar "Service"**
4. **Buscar "MinIO"** en la lista de servicios
5. **Click en "Deploy"**

### Opción B: Docker Compose en Coolify

1. **Crear nuevo servicio Docker Compose**
2. **Pegar este docker-compose.yml:**

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123  # Cambiar por password seguro
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
    driver: local
```

3. **Guardar y deployar**

---

## 🔧 PASO 2: Configurar MinIO

### 1. Acceder a MinIO Console

```
https://tu-servidor.com:9001
o
http://ip-servidor:9001
```

**Credenciales:**
- Username: `minioadmin`
- Password: `minioadmin123` (el que configuraste)

### 2. Crear Bucket

1. Click en **"Buckets"** en el menú izquierdo
2. Click en **"Create Bucket"**
3. Nombre: `evolution-media`
4. Click **"Create Bucket"**

### 3. Hacer el Bucket Público

1. Click en el bucket `evolution-media`
2. Click en **"Anonymous"** tab
3. Click **"Add Access Rule"**
4. **Prefix:** `*`
5. **Access:** `readonly` o `readwrite`
6. Click **"Add"**

**O configurar política manualmente:**

1. Click en **"Buckets"** → **evolution-media**
2. Click en **"Summary"** → **"Access Policy"**
3. Seleccionar: **"Public"** o pegar esta política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::evolution-media/*"
      ]
    }
  ]
}
```

### 4. Crear Access Keys

1. Click en **"Access Keys"** en el menú izquierdo
2. Click **"Create access key"**
3. **Copiar y guardar:**
   - Access Key: `xxxxx`
   - Secret Key: `xxxxx`

---

## ⚙️ PASO 3: Configurar Evolution API

### En el archivo `.env` de Evolution API:

```bash
# S3/MinIO Configuration
S3_ENABLED=true
S3_ACCESS_KEY=tu_access_key_de_minio
S3_SECRET_KEY=tu_secret_key_de_minio
S3_BUCKET=evolution-media
S3_PORT=9000
S3_ENDPOINT=tu-servidor.com  # o IP del servidor
S3_REGION=us-east-1
S3_USE_SSL=false  # true si tienes SSL/HTTPS configurado

# Si MinIO está en el mismo servidor/red de Docker:
# S3_ENDPOINT=minio  # nombre del container
```

### Si Evolution API está en Coolify:

1. **Ir al servicio de Evolution API en Coolify**
2. **Click en "Environment Variables"**
3. **Agregar las variables:**

```
S3_ENABLED=true
S3_ACCESS_KEY=xxxxx
S3_SECRET_KEY=xxxxx
S3_BUCKET=evolution-media
S3_PORT=9000
S3_ENDPOINT=minio
S3_REGION=us-east-1
S3_USE_SSL=false
```

4. **Restart Evolution API**

---

## 🧪 PASO 4: Probar la Configuración

### 1. Enviar un audio desde WhatsApp

Envía un mensaje de voz o imagen a tu número de Evolution API.

### 2. Verificar en webhook de n8n

El webhook ahora debería incluir:

```json
{
  "data": {
    "messageType": "audioMessage",
    "mediaUrl": "http://tu-servidor.com:9000/evolution-media/instance_123/audio_456.ogg",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/..."
      }
    }
  }
}
```

### 3. Verificar en MinIO Console

1. Ir a MinIO Console
2. Click en **"Object Browser"**
3. Click en bucket **"evolution-media"**
4. Deberías ver carpetas por instancia con los archivos

---

## 🔒 PASO 5: Configurar Dominio Público (Opcional pero Recomendado)

### Si quieres URLs limpias tipo `https://media.tudominio.com/archivo.ogg`

1. **En Coolify, configurar dominio para MinIO:**
   - Dominio: `media.tudominio.com`
   - Puerto: `9000`
   - SSL: Activar

2. **Actualizar Evolution API `.env`:**
```bash
S3_ENDPOINT=media.tudominio.com
S3_USE_SSL=true
S3_PORT=443
```

3. **Las URLs ahora serán:**
```
https://media.tudominio.com/evolution-media/instance_123/audio_456.ogg
```

---

## 📊 PASO 6: Actualizar Workflow de n8n

### Ahora tu workflow es MUCHO más simple:

```javascript
// Code node en n8n
const data = $input.item.json.data;

// Extraer URL pública de MinIO
const mediaUrl = data.mediaUrl;  // ← Ya es URL pública

return {
  json: {
    mediaUrl: mediaUrl,
    hasMedia: !!mediaUrl
  }
};
```

### HTTP Request a GHL (directo):

```json
{
  "method": "POST",
  "url": "https://services.leadconnectorhq.com/conversations/messages/inbound",
  "headers": {
    "Version": "2021-04-15",
    "Authorization": "Bearer {{ $('Get Token').item.json.access_token }}"
  },
  "body": {
    "type": "WhatsApp",
    "contactId": "...",
    "conversationId": "...",
    "locationId": "...",
    "message": "Audio recibido",
    "attachments": ["={{ $json.mediaUrl }}"]
  }
}
```

✅ **Sin necesidad de descargar y resubir**

---

## 🎯 VENTAJAS DE ESTA SOLUCIÓN

✅ **Simple:** Evolution API hace todo automáticamente
✅ **Rápido:** No procesamiento adicional en n8n
✅ **Confiable:** URLs permanentes
✅ **Backup:** Archivos guardados en tu servidor
✅ **Gratuito:** MinIO es open source
✅ **Escalable:** Soporta miles de archivos
✅ **Compatible:** API de S3 estándar

---

## 🔍 VERIFICAR QUE FUNCIONA

### Test 1: Ver variables de Evolution API

```bash
docker exec -it evolution-api env | grep S3
```

Debería mostrar:
```
S3_ENABLED=true
S3_BUCKET=evolution-media
S3_ENDPOINT=minio
...
```

### Test 2: Logs de Evolution API

```bash
docker logs -f evolution-api
```

Cuando llegue un mensaje con media, deberías ver:
```
[INFO] Uploading media to S3...
[INFO] Media uploaded: http://minio:9000/evolution-media/...
```

### Test 3: Webhook de n8n

El campo `data.mediaUrl` debe existir y tener URL de MinIO:
```json
{
  "mediaUrl": "http://tu-servidor.com:9000/evolution-media/..."
}
```

---

## ⚠️ TROUBLESHOOTING

### Problema: URLs no aparecen en webhook

**Solución:** Verificar que:
1. S3_ENABLED=true
2. Evolution API reiniciado después de configurar
3. Bucket es público
4. Access keys son correctas

### Problema: Evolution API no puede conectar con MinIO

**Solución:** Si están en la misma red de Docker:
```bash
S3_ENDPOINT=minio  # nombre del container
S3_PORT=9000
S3_USE_SSL=false
```

### Problema: GHL no puede descargar de MinIO

**Solución:** Asegúrate que:
1. Bucket es público
2. MinIO es accesible desde internet (puerto 9000 abierto)
3. O usa dominio público con SSL

---

## 📁 ESTRUCTURA DE ARCHIVOS EN MINIO

```
evolution-media/
├── instance_123/
│   ├── audio_msg1.ogg
│   ├── audio_msg2.ogg
│   ├── image_msg3.jpg
│   └── video_msg4.mp4
├── instance_456/
│   ├── audio_msg5.ogg
│   └── image_msg6.png
```

---

## 💾 BACKUP Y MANTENIMIENTO

### Backup de MinIO

Los archivos están en el volumen `minio_data`. Para backup:

```bash
# Backup
docker run --rm -v minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data

# Restore
docker run --rm -v minio_data:/data -v $(pwd):/backup alpine tar xzf /backup/minio-backup.tar.gz -C /
```

### Limpieza de archivos antiguos (opcional)

Puedes configurar lifecycle policies en MinIO para borrar archivos después de X días.

---

## 🔐 SEGURIDAD

### Recomendaciones:

1. **Cambiar password por defecto:**
```bash
MINIO_ROOT_PASSWORD=un_password_muy_seguro_y_largo
```

2. **Usar SSL/HTTPS:**
- Configurar dominio en Coolify con SSL
- `S3_USE_SSL=true`

3. **Restringir acceso a Console:**
- Solo accesible desde red interna
- O proteger con VPN

4. **Rotar Access Keys periódicamente**

---

## 📊 MONITOREO

MinIO incluye métricas de Prometheus:

```
http://tu-servidor:9000/minio/v2/metrics/cluster
```

Puedes integrar con Grafana para dashboards.

---

## 🎬 RESUMEN

1. ✅ Instalar MinIO en Coolify (1 click o docker-compose)
2. ✅ Crear bucket `evolution-media` y hacerlo público
3. ✅ Configurar Evolution API con variables S3
4. ✅ Reiniciar Evolution API
5. ✅ Probar enviando audio/imagen
6. ✅ Verificar que `mediaUrl` aparece en webhook
7. ✅ Usar `mediaUrl` directo en GHL

**Resultado:** URLs públicas automáticas sin procesamiento adicional 🎉
