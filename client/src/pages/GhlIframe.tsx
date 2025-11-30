import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubaccountDetails from "@/pages/SubaccountDetails";
import type { Subaccount } from "@shared/schema";

/**
 * Página especial para el iframe de GoHighLevel (Custom Menu Link / Custom Page)
 *
 * Soporta DOS métodos de autenticación:
 *
 * 1. URL Parameters (preferido si GHL los reemplaza):
 *    URL: /app-dashboard?locationId={{location.id}}&userId={{user.id}}&email={{user.email}}
 *
 * 2. SSO via postMessage (fallback para Custom Pages):
 *    - Frontend solicita SSO: window.parent.postMessage({ action: 'getSSO' }, '*')
 *    - GHL responde con ssoData cifrado
 *    - Backend descifra con GHL_APP_SSO_KEY
 */

export default function GhlIframe() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subaccount, setSubaccount] = useState<Subaccount | null>(null);
  const [ssoRequested, setSsoRequested] = useState(false);

  // Función para buscar subcuenta por locationId
  const findSubaccountByLocation = useCallback(async (locationId: string) => {
    try {
      console.log("🔍 Buscando subcuenta para locationId:", locationId);

      const response = await apiRequest("GET", `/api/subaccounts/by-location/${locationId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `No se encontró una subcuenta para este location.\n\n` +
            `Location ID: ${locationId}\n\n` +
            `La app debe estar instalada primero desde el Marketplace de GHL.`
          );
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al buscar subcuenta");
      }

      const data = await response.json();
      console.log("✅ Subcuenta encontrada:", data.subaccount?.id);
      setSubaccount(data.subaccount);
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Error desconocido");
      setLoading(false);
    }
  }, []);

  // Función para autenticar con SSO (postMessage)
  const authenticateWithSso = useCallback(async (ssoData: string) => {
    try {
      console.log("🔐 Descifrando SSO data...");

      const response = await apiRequest("POST", "/api/ghl/decrypt-sso", { ssoKey: ssoData });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al descifrar SSO");
      }

      const data = await response.json();

      if (!data.success || !data.ghlData?.locationId) {
        throw new Error("Respuesta SSO inválida");
      }

      console.log("✅ SSO descifrado - LocationId:", data.ghlData.locationId);
      await findSubaccountByLocation(data.ghlData.locationId);
    } catch (err: any) {
      console.error("❌ Error SSO:", err);
      setError(err.message || "Error de autenticación SSO");
      setLoading(false);
    }
  }, [findSubaccountByLocation]);

  // Solicitar SSO via postMessage
  const requestSsoFromGhl = useCallback(() => {
    console.log("📨 Solicitando SSO a GHL via postMessage...");
    setSsoRequested(true);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ action: "getSSO" }, "*");
    } else {
      console.warn("⚠️ No estamos en un iframe");
      setError("Esta página debe abrirse desde GoHighLevel.");
      setLoading(false);
    }
  }, []);

  // Escuchar respuestas de GHL (SSO)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.ssoData) {
        console.log("📥 SSO data recibido via postMessage");
        await authenticateWithSso(event.data.ssoData);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [authenticateWithSso]);

  // Inicialización
  useEffect(() => {
    async function initialize() {
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get("locationId");

      // Método 1: URL params (si GHL los reemplazó correctamente)
      if (locationId && !locationId.includes("{{")) {
        console.log("📍 Usando locationId de URL:", locationId);
        await findSubaccountByLocation(locationId);
        return;
      }

      // Método 2: SSO via postMessage
      console.log("📍 URL params no válidos, usando SSO...");
      if (!ssoRequested) {
        requestSsoFromGhl();

        // Timeout de 8 segundos
        setTimeout(() => {
          if (loading && !subaccount) {
            setError(
              "No se recibió respuesta de GoHighLevel.\n\n" +
              "Verifica que:\n" +
              "1. La app esté instalada en esta ubicación\n" +
              "2. El SSO Key esté configurado correctamente"
            );
            setLoading(false);
          }
        }, 8000);
      }
    }

    initialize();
  }, [findSubaccountByLocation, requestSsoFromGhl, ssoRequested, loading, subaccount]);

  // Función para reintentar
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
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
  if (subaccount) {
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
        <SubaccountDetails subaccountData={subaccount} isGhlIframe={true} />
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
