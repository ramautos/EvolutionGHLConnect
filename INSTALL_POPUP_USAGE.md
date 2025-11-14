# Cómo Usar el Popup de Instalación de GHL

## 📝 Resumen

Ahora tienes un sistema de instalación que funciona completamente **DENTRO de tu aplicación** usando un popup, sin redirigir a páginas externas.

## 🎯 Componentes Creados

1. **GhlInstallPopup** (`client/src/components/GhlInstallPopup.tsx`)
   - Modal/Dialog con UI profesional
   - Abre popup OAuth de GHL
   - Escucha mensajes del callback
   - Muestra estados: idle, authorizing, success, error

2. **OAuthCallback** (`client/src/pages/OAuthCallback.tsx`)
   - Se abre en el popup
   - Procesa el código OAuth
   - Notifica al window.opener (parent)
   - Se cierra automáticamente

3. **Ruta agregada** en App.tsx:
   - `/oauth/callback` → OAuthCallback component

## 📖 Cómo Usar

### Opción 1: En el Dashboard (para usuarios existentes)

```tsx
// Dashboard.tsx
import { useState } from "react";
import { GhlInstallPopup } from "@/components/GhlInstallPopup";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  const handleInstallSuccess = () => {
    // Refrescar datos, mostrar mensaje de éxito, etc.
    console.log("✅ Instalación completada");
    // Opcional: recargar la página o actualizar datos
    window.location.reload();
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <Button onClick={() => setShowInstallPopup(true)}>
        🔌 Conectar con GoHighLevel
      </Button>

      <GhlInstallPopup
        isOpen={showInstallPopup}
        onClose={() => setShowInstallPopup(false)}
        onSuccess={handleInstallSuccess}
      />
    </div>
  );
}
```

### Opción 2: En la Landing Page (para nuevos usuarios)

```tsx
// Landing.tsx (en la sección Hero)
import { useState } from "react";
import { GhlInstallPopup } from "@/components/GhlInstallPopup";

export default function Landing() {
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  return (
    <div>
      {/* Tu Hero section */}
      <button
        onClick={() => setShowInstallPopup(true)}
        className="cta-button"
      >
        Comenzar Ahora - Gratis
      </button>

      <GhlInstallPopup
        isOpen={showInstallPopup}
        onClose={() => setShowInstallPopup(false)}
        onSuccess={() => {
          // Redirigir a dashboard o mostrar onboarding
          window.location.href = "/dashboard";
        }}
      />
    </div>
  );
}
```

### Opción 3: En Onboarding

```tsx
// Onboarding.tsx
import { GhlInstallPopup } from "@/components/GhlInstallPopup";

export default function Onboarding() {
  return (
    <div className="onboarding-steps">
      {/* Paso 1: Bienvenida */}
      {/* Paso 2: Conectar GHL */}
      <GhlInstallPopup
        isOpen={currentStep === 2}
        onClose={() => setCurrentStep(1)}
        onSuccess={() => setCurrentStep(3)}
      />
      {/* Paso 3: Configuración */}
    </div>
  );
}
```

## 🔧 Configuración Necesaria

### 1. Variables de Entorno

Asegúrate de tener en `.env` o en Replit:

```env
# Frontend (Vite)
VITE_GHL_CLIENT_ID=tu_client_id_aqui

# Backend ya tiene:
GHL_CLIENT_ID=tu_client_id_aqui
GHL_CLIENT_SECRET=tu_client_secret_aqui
GHL_APP_SSO_KEY=tu_sso_key_aqui
```

### 2. Redirect URI en GHL Developer Portal

Agrega esta URL a los **Redirect URIs permitidos** en tu app de GHL:

```
https://whatsapp.cloude.es/oauth/callback
```

(O tu dominio de Replit en desarrollo)

## 🚀 Flujo Completo

```
1. Usuario hace clic en "Conectar con GoHighLevel"
   ↓
2. Se abre modal GhlInstallPopup
   ↓
3. Usuario hace clic en "Conectar Ahora"
   ↓
4. Se abre popup (600x700px) con OAuth de GHL
   ↓
5. Usuario autoriza la app en GHL
   ↓
6. GHL redirige a /oauth/callback (en el popup)
   ↓
7. OAuthCallback procesa el código
   ↓
8. Envía mensaje postMessage al window.opener
   ↓
9. GhlInstallPopup recibe el mensaje
   ↓
10. Muestra "success" y ejecuta onSuccess()
    ↓
11. Popup se cierra automáticamente
    ↓
12. Usuario permanece en tu app (sin redireccionamiento)
```

## ✅ Ventajas de Este Approach

- ✅ **Todo dentro de tu app** - Usuario nunca sale
- ✅ **UX profesional** - Modal con estados visuales claros
- ✅ **Seguro** - Usa postMessage con verificación de origin
- ✅ **Responsive** - Funciona en móvil y desktop
- ✅ **Manejo de errores** - Captura todos los casos edge
- ✅ **Auto-cierre** - Popup se cierra solo al terminar

## 🐛 Debugging

Si el popup no funciona:

1. **Verificar que el popup no esté bloqueado por el navegador**
   - El usuario debe permitir popups para tu sitio

2. **Verificar VITE_GHL_CLIENT_ID**
   ```bash
   console.log(import.meta.env.VITE_GHL_CLIENT_ID);
   ```

3. **Verificar Redirect URI en GHL**
   - Debe coincidir exactamente con la configurada en GHL

4. **Ver mensajes postMessage en console**
   - Busca "✅ Mensaje enviado al window.opener"

## 📝 Personalización

Puedes personalizar el componente GhlInstallPopup:

```tsx
<GhlInstallPopup
  isOpen={showPopup}
  onClose={() => setShowPopup(false)}
  onSuccess={() => {
    // Tu lógica personalizada
    toast.success("¡Conectado exitosamente!");
    navigate("/dashboard");
  }}
/>
```

## 🎨 Estilos

El popup usa componentes de shadcn/ui:
- Dialog
- Button
- Card
- Loader2, CheckCircle2, AlertCircle (iconos de lucide-react)

Puedes personalizar los estilos editando el componente.

## 🔐 Seguridad

- ✅ Verifica origin en postMessage
- ✅ Usa state para prevenir CSRF
- ✅ Guarda state en sessionStorage (se limpia al cerrar pestaña)
- ✅ Solo acepta mensajes del mismo origin

## 📊 Próximos Pasos

1. ✅ Componentes creados
2. ✅ Ruta agregada en App.tsx
3. ⏳ Agregar botón en Dashboard/Landing
4. ⏳ Configurar VITE_GHL_CLIENT_ID
5. ⏳ Probar flujo completo
6. ⏳ Deploy a producción

---

¿Necesitas ayuda con algún paso específico?
