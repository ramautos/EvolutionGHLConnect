import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Ban, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubaccountDetails from "@/pages/SubaccountDetails";
import type { Subaccount } from "@shared/schema";

/**
 * Página para el iframe de GoHighLevel (Custom Page)
 *
 * Usa SSO para obtener el locationId:
 * 1. Frontend envía REQUEST_USER_DATA via postMessage
 * 2. GHL responde con REQUEST_USER_DATA_RESPONSE (datos encriptados)
 * 3. Backend descifra con GHL_APP_SSO_KEY
 * 4. Se obtiene activeLocation (locationId)
 *
 * Docs: https://marketplace.gohighlevel.com/docs/other/user-context-marketplace-apps
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

  // Función para procesar datos de usuario de GHL
  const processUserData = useCallback(async (userData: any) => {
    try {
      console.log("🔐 Procesando datos de usuario GHL:", userData);

      // GHL puede enviar los datos en varios formatos
      // 1. Datos directos (no encriptados) con locationId
      // 2. Datos encriptados que necesitan descifrar

      // Intentar obtener locationId directamente
      const locationId = userData.activeLocation || userData.locationId || userData.location_id;

      if (locationId) {
        console.log("✅ LocationId obtenido directamente:", locationId);
        await findSubaccountByLocation(locationId);
        return;
      }

      // Si hay datos encriptados, enviar al backend para descifrar
      if (typeof userData === "string" || userData.encrypted || userData.ssoData) {
        const ssoData = typeof userData === "string" ? userData : (userData.ssoData || userData.encrypted);
        console.log("🔐 Descifrando SSO data...");

        const response = await apiRequest("POST", "/api/ghl/decrypt-sso", { ssoKey: ssoData });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al descifrar SSO");
        }

        const data = await response.json();
        const decryptedLocationId = data.ghlData?.activeLocation || data.ghlData?.locationId;

        if (!data.success || !decryptedLocationId) {
          console.error("SSO Response:", data);
          throw new Error("Respuesta SSO inválida - no se encontró locationId");
        }

        console.log("✅ SSO descifrado - LocationId:", decryptedLocationId);
        await findSubaccountByLocation(decryptedLocationId);
        return;
      }

      throw new Error("No se pudo obtener el locationId de los datos de GHL");
    } catch (err: any) {
      console.error("❌ Error procesando datos:", err);
      setError(err.message || "Error de autenticación");
      setLoading(false);
    }
  }, [findSubaccountByLocation]);

  // Solicitar datos de usuario a GHL via postMessage
  const requestUserDataFromGhl = useCallback(() => {
    console.log("📨 Solicitando datos de usuario a GHL...");
    setSsoRequested(true);

    if (window.parent && window.parent !== window) {
      // Método 1: REQUEST_USER_DATA (formato oficial de GHL)
      window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");

      // Método 2: getSSO (formato alternativo)
      setTimeout(() => {
        window.parent.postMessage({ action: "getSSO" }, "*");
      }, 500);

      // Método 3: Intentar obtener token directamente
      setTimeout(() => {
        try {
          // @ts-ignore - getToken puede estar disponible en el contexto de GHL
          if (typeof window.getToken === "function") {
            console.log("📨 Intentando window.getToken()...");
            // @ts-ignore
            window.getToken().then((token: string) => {
              console.log("✅ Token obtenido via getToken()");
              processUserData({ token });
            }).catch((e: any) => console.log("getToken no disponible:", e));
          }
        } catch (e) {
          console.log("getToken no disponible");
        }
      }, 1000);
    } else {
      console.warn("⚠️ No estamos en un iframe");
      setError("Esta página debe abrirse desde GoHighLevel.");
      setLoading(false);
    }
  }, [processUserData]);

  // Escuchar respuestas de GHL
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log("📥 Mensaje recibido:", event.data);

      // Ignorar mensajes propios
      if (event.source === window) return;

      const data = event.data;

      // Formato 1: REQUEST_USER_DATA_RESPONSE (oficial GHL)
      if (data?.message === "REQUEST_USER_DATA_RESPONSE" && data?.payload) {
        console.log("📥 REQUEST_USER_DATA_RESPONSE recibido");
        await processUserData(data.payload);
        return;
      }

      // Formato 2: Respuesta directa con datos de usuario
      if (data?.locationId || data?.activeLocation || data?.location_id) {
        console.log("📥 Datos de usuario recibidos directamente");
        await processUserData(data);
        return;
      }

      // Formato 3: SSO data encriptado
      if (data?.ssoData || data?.encrypted) {
        console.log("📥 SSO data encriptado recibido");
        await processUserData(data.ssoData || data.encrypted);
        return;
      }

      // Formato 4: Respuesta genérica con data
      if (data?.data && (data.data.locationId || data.data.activeLocation)) {
        console.log("📥 Datos anidados recibidos");
        await processUserData(data.data);
        return;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [processUserData]);

  // Inicialización
  useEffect(() => {
    async function initialize() {
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get("locationId");

      // Si hay locationId válido en URL, usarlo directamente
      if (locationId && !locationId.includes("{{")) {
        console.log("📍 Usando locationId de URL:", locationId);
        await findSubaccountByLocation(locationId);
        return;
      }

      // Si no, solicitar datos a GHL
      console.log("📍 Solicitando datos de usuario a GHL...");
      if (!ssoRequested) {
        requestUserDataFromGhl();

        // Timeout de 10 segundos
        setTimeout(() => {
          if (loading && !subaccount && !error) {
            setError(
              "No se recibió respuesta de GoHighLevel.\n\n" +
              "Verifica que:\n" +
              "1. La app esté instalada en esta ubicación\n" +
              "2. El SSO Key esté configurado correctamente\n" +
              "3. Estés accediendo desde dentro de GHL"
            );
            setLoading(false);
          }
        }, 10000);
      }
    }

    initialize();
  }, [findSubaccountByLocation, requestUserDataFromGhl, ssoRequested, loading, subaccount, error]);

  // Función para reintentar
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setSsoRequested(false);
    window.location.reload();
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="ghl-iframe-container min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Conectando...</h2>
          <p className="text-muted-foreground">
            Autenticando con GoHighLevel
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
            Error de Conexión
          </h2>
          <p className="text-muted-foreground mb-4 whitespace-pre-line">{error}</p>
          <div className="space-y-3">
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <p className="text-sm text-muted-foreground">
              Si el problema persiste, contacta al soporte.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Verificar si la cuenta está suspendida
  if (subaccount && (subaccount as any).suspended) {
    return (
      <div className="ghl-iframe-container min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center border-2 border-red-300 shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-red-700">
            Cuenta Suspendida
          </h2>
          <p className="text-gray-600 mb-6">
            {(subaccount as any).suspendedReason || "Tu cuenta ha sido suspendida temporalmente."}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              Para reactivar tu cuenta o resolver cualquier duda, contacta con tu administrador.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4" />
            <span>Contacta al soporte de tu agencia</span>
          </div>
        </Card>
      </div>
    );
  }

  // Usuario autenticado correctamente - Mostrar el dashboard adaptado para iframe
  if (subaccount) {
    return (
      <div className="ghl-iframe-mode">
        <style>{`
          .ghl-iframe-mode {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }
          .ghl-iframe-mode header,
          .ghl-iframe-mode nav,
          .ghl-iframe-mode .main-nav,
          .ghl-iframe-mode .sidebar,
          .ghl-iframe-mode .footer {
            display: none !important;
          }
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
