import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubaccountDetails from "@/pages/SubaccountDetails";

/**
 * Página especial para el iframe de GoHighLevel (Custom Menu Link / Custom Page)
 *
 * Esta página se abre cuando el usuario hace clic en el Custom Menu Link
 * dentro de GHL. Usa SSO via postMessage para autenticar.
 *
 * Flujo SSO (postMessage):
 * 1. GHL carga el iframe con tu URL
 * 2. Frontend solicita SSO: window.parent.postMessage({ action: 'getSSO' }, '*')
 * 3. GHL responde con ssoData cifrado via postMessage
 * 4. Frontend envía al backend: POST /api/ghl/decrypt-sso
 * 5. Backend descifra y devuelve los datos del usuario
 * 6. Frontend establece el usuario en contexto
 * 7. Muestra el dashboard adaptado para iframe
 *
 * Flujo alternativo (URL param - para testing):
 * 1. GHL abre: /ghl-iframe?ssoKey=ENCRYPTED_TOKEN
 * 2. Frontend lee el ssoKey de la URL
 * 3. Continúa desde paso 4 arriba
 */

interface GhlSsoData {
  locationId: string;
  companyId: string;
  userId: string;
  email?: string;
  name?: string;
  userType?: string;
}

export default function GhlIframe() {
  const [, navigate] = useLocation();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subaccountId, setSubaccountId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [ssoRequested, setSsoRequested] = useState(false);

  // Función para descifrar SSO y autenticar
  const authenticateWithSsoKey = useCallback(async (ssoKey: string) => {
    try {
      console.log("🔐 Descifrando SSO key...");

      const response = await apiRequest("POST", "/api/ghl/decrypt-sso", {
        ssoKey,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al autenticar con SSO");
      }

      const data = await response.json();

      if (!data.success || !data.user) {
        throw new Error("Respuesta inválida del servidor");
      }

      console.log("✅ Autenticado exitosamente con SSO");
      console.log("Usuario:", data.user.email);
      console.log("Location ID:", data.ghlData.locationId);

      // Establecer el usuario y locationId
      setUser(data.user);
      setSubaccountId(data.user.id);
      setLocationId(data.ghlData.locationId);
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error en autenticación SSO:", err);
      setError(err.message || "Error desconocido");
      setLoading(false);
    }
  }, [setUser]);

  // Solicitar SSO via postMessage
  const requestSsoFromGhl = useCallback(() => {
    console.log("📨 Solicitando SSO a GHL via postMessage...");
    setSsoRequested(true);

    // Enviar solicitud de SSO al parent (GHL)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ action: "getSSO" }, "*");
    } else {
      console.warn("⚠️ No estamos en un iframe, no se puede solicitar SSO via postMessage");
    }
  }, []);

  useEffect(() => {
    // Handler para mensajes de GHL
    const handleMessage = async (event: MessageEvent) => {
      // Verificar que el mensaje tiene datos SSO
      if (event.data && event.data.ssoData) {
        console.log("📥 SSO data recibido via postMessage");
        await authenticateWithSsoKey(event.data.ssoData);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [authenticateWithSsoKey]);

  useEffect(() => {
    async function initializeAuth() {
      // Si ya hay usuario autenticado, usar sus datos
      if (user) {
        setSubaccountId(user.id);
        setLoading(false);
        return;
      }

      // Método 1: Verificar si hay ssoKey en la URL (para testing o modo alternativo)
      const urlParams = new URLSearchParams(window.location.search);
      const ssoKeyFromUrl = urlParams.get("ssoKey");

      if (ssoKeyFromUrl) {
        console.log("🔗 SSO key encontrado en URL");
        await authenticateWithSsoKey(ssoKeyFromUrl);
        return;
      }

      // Método 2: Solicitar SSO via postMessage (flujo estándar de GHL)
      // Verificar si estamos en un iframe
      const isInIframe = window.parent !== window;

      if (isInIframe && !ssoRequested) {
        requestSsoFromGhl();

        // Timeout si no recibimos respuesta en 5 segundos
        setTimeout(() => {
          if (loading && !user && !subaccountId) {
            console.warn("⏱️ Timeout esperando SSO de GHL");
            setError("No se recibió respuesta de SSO de GoHighLevel. Verifica que la app esté correctamente instalada.");
            setLoading(false);
          }
        }, 5000);
      } else if (!isInIframe) {
        // No estamos en iframe y no hay ssoKey
        setError("Esta página debe abrirse desde GoHighLevel. Si estás probando, agrega ?ssoKey=TOKEN a la URL.");
        setLoading(false);
      }
    }

    initializeAuth();
  }, [user, authenticateWithSsoKey, requestSsoFromGhl, ssoRequested, loading, subaccountId]);

  // Función para reintentar
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setSsoRequested(false);
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="ghl-iframe-container min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Autenticando...</h2>
          <p className="text-muted-foreground">
            Verificando tu sesión de GoHighLevel
          </p>
        </Card>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="ghl-iframe-container min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center border-destructive">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            Error de Autenticación
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-3">
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <p className="text-sm text-muted-foreground">
              Si el problema persiste, cierra y vuelve a abrir el dashboard desde GHL.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Usuario autenticado correctamente - Mostrar el dashboard adaptado para iframe
  if (subaccountId) {
    return (
      <div className="ghl-iframe-mode">
        {/*
          Wrapper especial para modo iframe dentro de GHL
          CSS oculta elementos innecesarios (navbar, sidebar, etc.)
        */}
        <style>{`
          /* Estilos para modo iframe de GHL */
          .ghl-iframe-mode {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }

          /* Ocultar elementos de navegación en modo iframe */
          .ghl-iframe-mode header,
          .ghl-iframe-mode nav,
          .ghl-iframe-mode .main-nav,
          .ghl-iframe-mode .sidebar,
          .ghl-iframe-mode .footer {
            display: none !important;
          }

          /* Ajustar el contenido principal */
          .ghl-iframe-mode main,
          .ghl-iframe-mode .main-content {
            margin: 0 !important;
            padding: 1rem !important;
            max-width: 100% !important;
          }
        `}</style>
        <SubaccountDetails />
      </div>
    );
  }

  // Fallback
  return (
    <div className="ghl-iframe-container min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </Card>
    </div>
  );
}
