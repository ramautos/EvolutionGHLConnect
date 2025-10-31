# 🧪 Guía de Prueba Manual - Google OAuth

## ✅ Sistema Completamente Configurado

El sistema ya tiene Google OAuth funcionando. Solo necesitas probarlo manualmente siguiendo estos pasos.

## 📋 Pre-requisitos

1. ✅ Variables de entorno configuradas (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. ✅ Callback URLs autorizadas en Google Cloud Console
3. ✅ Servidor corriendo en https://whatsapp.cloude.es

## 🔍 Paso 1: Verificar Configuración

### Verificar en los Logs del Servidor
En la consola del servidor, deberías ver:
```
Google OAuth callback URL configurado: https://whatsapp.cloude.es/api/auth/google/callback
```

✅ **Confirmado**: Esta línea aparece en los logs actuales.

## 🎯 Paso 2: Probar Login con Google

### Escenario A: Usuario Nuevo (Primera vez con Google)

1. **Abre una ventana de incógnito** en tu navegador
2. Navega a: `https://whatsapp.cloude.es/login`
3. **Verifica el diseño**:
   - ✅ Fondo con gradiente sutil (primary → chart-2)
   - ✅ Patrón de cuadrícula en el fondo
   - ✅ Logo con gradiente colorido
   - ✅ Título "Iniciar Sesión" con efecto gradiente en el texto
   - ✅ Botón "Google" con ícono de Chrome

4. **Haz clic en el botón "Google"**
5. Serás redirigido a la página de Google
6. **Selecciona una cuenta de Google** que NO hayas usado antes en la plataforma
7. **Autoriza la aplicación** (primera vez te pedirá permisos)
8. **Deberías ser redirigido automáticamente a**: `/dashboard`

### ✅ Verificación de Éxito (Escenario A)
- [ ] Estás en `/dashboard`
- [ ] Ves tu nombre del perfil de Google en la interfaz
- [ ] Puedes navegar por el dashboard sin errores
- [ ] Si vas a `/profile`, ves tu información de Google

### Escenario B: Usuario Existente (Ya usó Google antes)

1. Abre tu navegador normal (donde ya has iniciado sesión antes)
2. Navega a: `https://whatsapp.cloude.es/login`
3. Haz clic en "Google"
4. Si ya estás autenticado en Google, te redirigirá directamente
5. Deberías llegar a `/dashboard` inmediatamente

### ✅ Verificación de Éxito (Escenario B)
- [ ] Login inmediato sin pedir autorización de nuevo
- [ ] Llegas a `/dashboard` en menos de 2 segundos
- [ ] Tus datos persisten de sesiones anteriores

## 🆕 Paso 3: Probar Registro con Google

### Proceso

1. **Cierra sesión** si estás autenticado
2. Abre una ventana de incógnito
3. Navega a: `https://whatsapp.cloude.es/register`
4. **Verifica el diseño**:
   - ✅ Mismo gradiente de fondo que Login
   - ✅ Título "Crear Cuenta" con gradiente
   - ✅ Botón "Google" visible
   - ✅ Campos de nombre, email y contraseña

5. **Haz clic en el botón "Google"**
6. Usa una **cuenta de Google DIFERENTE** (que no esté registrada)
7. Autoriza la aplicación
8. **El sistema automáticamente**:
   - Crea una nueva Company con tu nombre de Google
   - Crea tu usuario vinculado a esa Company
   - Te loguea automáticamente
   - Te redirige a `/dashboard`

### ✅ Verificación de Éxito
- [ ] Cuenta creada automáticamente
- [ ] No necesitaste llenar ningún formulario
- [ ] Estás logueado en `/dashboard`
- [ ] Tu nombre de Google aparece en el perfil

## 🔄 Paso 4: Probar Vinculación de Cuentas

Este es un caso especial donde combinas email/password con Google.

### Escenario: Ya tienes cuenta con Email/Password

1. **Crea una cuenta** con email/password:
   - Ve a `/register`
   - Usa tu email de Google (ej: `tuusuario@gmail.com`)
   - Pon una contraseña (ej: `password123`)
   - Registra la cuenta

2. **Cierra sesión**

3. **Inicia sesión con Google**:
   - Ve a `/login`
   - Click en "Google"
   - Usa la MISMA cuenta de Google del paso 1
   - Autoriza

4. **El sistema automáticamente**:
   - Detecta que ya existe una cuenta con ese email
   - Vincula tu Google ID a esa cuenta existente
   - Te loguea

### ✅ Verificación de Éxito
- [ ] No se creó una cuenta duplicada
- [ ] Ahora puedes usar AMBOS métodos de login:
  - Email/Password
  - Google OAuth
- [ ] Llegas a la MISMA cuenta con ambos métodos

## 🧪 Paso 5: Probar Recuperación de Contraseña

Esta funcionalidad también está implementada:

1. Ve a `/login`
2. Haz clic en **"¿Olvidaste tu contraseña?"**
3. **Verifica el diseño**:
   - ✅ Mismo gradiente de fondo
   - ✅ Título "Restablecer Contraseña" con gradiente
   - ✅ Campo de email
   - ✅ Botón "Enviar Enlace de Recuperación"

4. Ingresa tu email
5. Haz clic en "Enviar Enlace"
6. **En desarrollo**: El link de recuperación aparece en la **consola del servidor**
7. Busca en los logs algo como:
   ```
   ========================================
   PASSWORD RESET REQUEST
   Email: tu@email.com
   Reset Link: https://whatsapp.cloude.es/reset-password?token=xxxxx
   ========================================
   ```

8. **Copia ese link** y ábrelo en tu navegador
9. Ingresa una nueva contraseña
10. Deberías ser redirigido a `/login`
11. Inicia sesión con la nueva contraseña

### ✅ Verificación de Éxito
- [ ] Recibes confirmación de email enviado
- [ ] Encuentras el link en la consola del servidor
- [ ] Puedes cambiar la contraseña
- [ ] Puedes login con la nueva contraseña

## 📊 Paso 6: Verificar en Admin Panel

Si tienes acceso de `system_admin`:

1. Inicia sesión como system_admin
2. Ve a `/admin/users`
3. **Busca el usuario** que creaste con Google
4. **Verifica**:
   - [ ] Tiene un `googleId` (no nulo)
   - [ ] El email es de Google
   - [ ] El nombre es del perfil de Google
   - [ ] Tiene una `companyId` asignada
   - [ ] El rol es "user"

## 🐛 Problemas Comunes y Soluciones

### Error: "redirect_uri_mismatch"

**Síntoma**: Después de hacer clic en "Google", ves un error de Google.

**Causa**: La URI de callback no está autorizada.

**Solución**:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services > Credentials
3. Encuentra tu OAuth 2.0 Client ID
4. En "Authorized redirect URIs" agrega:
   ```
   https://whatsapp.cloude.es/api/auth/google/callback
   ```
5. Guarda y espera unos minutos

### Error: "access_denied"

**Síntoma**: Google te redirige de vuelta con error.

**Causa**: Cancelaste la autorización o la app no está configurada.

**Solución**:
- Intenta de nuevo y autoriza la aplicación
- Verifica que la pantalla de consentimiento OAuth esté configurada

### El login funciona pero no redirige al dashboard

**Síntoma**: Te logueas pero te quedas en `/login`

**Causa**: Problema con la sesión.

**Solución**:
1. Limpia las cookies del navegador
2. Intenta en modo incógnito
3. Verifica los logs del servidor para errores

### No puedo ver el link de recuperación

**Síntoma**: Solicitas recuperación pero no ves el link.

**Causa**: Estás en producción (no development).

**Solución**:
- En desarrollo: El link aparece en la **consola del servidor**
- En producción: Necesitas configurar un servicio de email (SendGrid, AWS SES)

## 📝 Checklist Final

Marca todo lo que has probado:

### Autenticación
- [ ] Login con email/password funciona
- [ ] Registro con email/password funciona
- [ ] Login con Google funciona
- [ ] Registro con Google funciona
- [ ] Vinculación de cuentas funciona
- [ ] Cerrar sesión funciona

### Diseño
- [ ] Login tiene gradiente de fondo
- [ ] Register tiene gradiente de fondo
- [ ] ForgotPassword tiene gradiente de fondo
- [ ] ResetPassword tiene gradiente de fondo
- [ ] Logo tiene gradiente
- [ ] Títulos tienen efecto de gradiente

### Recuperación de Contraseña
- [ ] Link "¿Olvidaste tu contraseña?" funciona
- [ ] Página ForgotPassword se ve bien
- [ ] Envío de email funciona
- [ ] Link de recuperación aparece en consola
- [ ] Cambio de contraseña funciona
- [ ] Login con nueva contraseña funciona

## 🎉 Resultado Esperado

Si todo funciona correctamente:
- ✅ 4 métodos de autenticación funcionando (email/pass login + register, Google login + register)
- ✅ Sistema de recuperación de contraseña completo
- ✅ Diseño consistente y elegante en todas las páginas
- ✅ Vinculación automática de cuentas
- ✅ Sesiones persistentes
- ✅ Redirecciones correctas

## 🚀 Próximo Paso

Una vez que hayas verificado que todo funciona:
1. ✅ En desarrollo: Todo listo para continuar
2. 🔜 En producción: Considera configurar servicio de email real para recuperación de contraseña
3. 🔜 Opcional: Verificar la app en Google para quitar el mensaje "Esta app no está verificada"
