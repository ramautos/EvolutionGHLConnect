# Configuración de Google OAuth

## ✅ Estado Actual: CONFIGURADO Y FUNCIONANDO

El sistema ya tiene Google OAuth completamente configurado y funcionando tanto para **Login** como para **Registro**.

## 🔑 Credenciales Configuradas

Las siguientes variables de entorno están configuradas en Replit:
- ✅ `GOOGLE_CLIENT_ID` - ID del cliente de Google OAuth
- ✅ `GOOGLE_CLIENT_SECRET` - Secret del cliente de Google OAuth
- ✅ `SESSION_SECRET` - Secret para las sesiones

## 🌐 URLs de Callback Configuradas

El sistema detecta automáticamente el entorno:

### Producción (whatsapp.cloude.es)
```
https://whatsapp.cloude.es/api/auth/google/callback
```

### Desarrollo (localhost)
```
http://localhost:5000/api/auth/google/callback
```

## 🎯 Flujo de Autenticación con Google

### 1️⃣ Login con Google
1. Usuario hace clic en "Google" en la página de Login
2. Se redirige a `/api/auth/google`
3. Google muestra la pantalla de autorización
4. Usuario autoriza la aplicación
5. Google redirige a `/api/auth/google/callback`
6. El sistema procesa la autenticación:
   - Si el usuario existe (por email o Google ID): inicia sesión
   - Si no existe: crea una nueva cuenta automáticamente
7. Redirige al Dashboard

### 2️⃣ Registro con Google
1. Usuario hace clic en "Google" en la página de Registro
2. Mismo flujo que Login
3. Si es un nuevo usuario, se crea automáticamente:
   - Nueva Company con el nombre del usuario
   - Nueva Subaccount con rol "user"
   - Email del perfil de Google
   - Google ID vinculado
4. Auto-login y redirección al Dashboard

## 🔒 Lógica de Seguridad

### Vinculación de Cuentas
- Si un usuario se registra con email/password y luego usa Google con el mismo email:
  - El sistema vincula automáticamente el Google ID a la cuenta existente
  - El usuario puede iniciar sesión con ambos métodos

### Prevención de Duplicados
- El sistema busca primero por Google ID
- Si no encuentra, busca por email
- No permite duplicar cuentas con el mismo email

## 📋 Configuración en Google Cloud Console

### Paso 1: Crear Proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente

### Paso 2: Habilitar Google+ API
1. Ve a "APIs & Services" > "Library"
2. Busca "Google+ API"
3. Haz clic en "Enable"

### Paso 3: Configurar Pantalla de Consentimiento OAuth
1. Ve a "APIs & Services" > "OAuth consent screen"
2. Selecciona "External" (o "Internal" si es G Workspace)
3. Completa:
   - Nombre de la aplicación: **WhatsApp AI Platform**
   - Email de soporte: **soporte@cloude.es**
   - Logo (opcional)
   - Dominios autorizados: **cloude.es**
   - Email del desarrollador: **soporte@cloude.es**

### Paso 4: Crear Credenciales OAuth 2.0
1. Ve a "APIs & Services" > "Credentials"
2. Clic en "Create Credentials" > "OAuth 2.0 Client ID"
3. Tipo de aplicación: **Web application**
4. Nombre: **WhatsApp AI Platform - Web**
5. **Orígenes de JavaScript autorizados:**
   ```
   https://whatsapp.cloude.es
   http://localhost:5000
   ```
6. **URIs de redirección autorizados:**
   ```
   https://whatsapp.cloude.es/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```
7. Clic en "Create"
8. Copia el **Client ID** y **Client Secret**

### Paso 5: Agregar Credenciales a Replit
1. En Replit, ve a la pestaña "Secrets" (candado)
2. Agrega o actualiza:
   - `GOOGLE_CLIENT_ID`: [Tu Client ID]
   - `GOOGLE_CLIENT_SECRET`: [Tu Client Secret]
3. El servidor se reiniciará automáticamente

## 🧪 Cómo Probar

### Probar Login
1. Ve a `/login`
2. Haz clic en el botón "Google"
3. Selecciona una cuenta de Google
4. Deberías ser redirigido al Dashboard

### Probar Registro
1. Ve a `/register`
2. Haz clic en el botón "Google"
3. Selecciona una cuenta de Google que NO esté registrada
4. Se creará una cuenta automáticamente
5. Deberías ser redirigido al Dashboard

### Verificar en Admin Panel
1. Inicia sesión como system_admin
2. Ve a `/admin/users`
3. Busca el usuario creado con Google
4. Verifica que tenga el campo `googleId` poblado

## 🔧 Solución de Problemas

### Error: "redirect_uri_mismatch"
- **Causa**: La URI de redirección no está autorizada en Google Cloud Console
- **Solución**: Agrega la URI exacta en Google Cloud Console > Credentials > OAuth 2.0 Client ID > Authorized redirect URIs

### Error: "access_denied"
- **Causa**: El usuario canceló la autorización o la aplicación no está verificada
- **Solución**: Verifica que la pantalla de consentimiento esté correctamente configurada

### El usuario no se crea
- **Causa**: Google no está devolviendo el email en el perfil
- **Solución**: Asegúrate de que el scope "email" esté incluido en la solicitud OAuth

### Login funciona pero Registro no
- **Causa**: Ambos usan el mismo endpoint `/api/auth/google`
- **Solución**: Esto es normal y correcto. El sistema maneja automáticamente ambos casos

## 📝 Notas Importantes

1. **Ambos botones ("Login" y "Register") usan el mismo endpoint**: `/api/auth/google`
   - El sistema detecta automáticamente si el usuario existe o no
   - No es necesario tener endpoints separados

2. **Compatibilidad con Email/Password**:
   - Los usuarios pueden tener SOLO email/password
   - Los usuarios pueden tener SOLO Google OAuth
   - Los usuarios pueden tener AMBOS (vinculados por email)

3. **Sesiones**:
   - Las sesiones se almacenan en PostgreSQL (tabla `sessions`)
   - Duración: 7 días
   - Se mantienen entre reinicios del servidor

4. **Producción vs Desarrollo**:
   - El sistema detecta automáticamente el entorno
   - Usa diferentes callback URLs según el entorno
   - Ambos entornos deben estar autorizados en Google Cloud Console

## ✨ Mejoras Visuales Implementadas

- ✅ Gradiente de fondo moderno (primary → chart-2)
- ✅ Patrón de cuadrícula sutil en el fondo
- ✅ Logo con gradiente en lugar de color sólido
- ✅ Título con efecto de gradiente de texto
- ✅ Border más grueso en las Cards (border-2)
- ✅ Diseño consistente en Login, Register, ForgotPassword y ResetPassword

## 🚀 Próximos Pasos (Opcional)

1. **Verificación de la aplicación en Google**:
   - Para producción, considera verificar tu aplicación OAuth
   - Esto elimina la advertencia "Esta app no está verificada"

2. **Personalización del branding**:
   - Agrega tu logo en la pantalla de consentimiento
   - Personaliza los colores y textos

3. **Analytics**:
   - Considera agregar tracking de eventos OAuth
   - Monitorear tasas de conversión de registro con Google vs Email/Password
