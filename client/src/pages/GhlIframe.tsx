import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Ban, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubaccountDetails from "@/pages/SubaccountDetails";
import type { Subaccount } from "@shared/schema";

/**
 * Página para el iframe de GoHighLevel (Custom Page)
 *
 * Métodos de detección de locationId (en orden de prioridad):
 * 1. URL params: ?locationId=xxx (Custom Menu Link creado por API)
 * 2. SSO postMessage: REQUEST_USER_DATA (si URL params no funcionan)
 *    - GHL envía payload ENCRIPTADO que debe descifrarse en backend
 *
 * Docs: https://marketplace.gohighlevel.com/docs/other/user-context-marketplace-apps
 */

export default function GhlIframe() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("Iniciando...");
  const [error, setError] = useState<string | null>(null);
  const [subaccount, setSubaccount] = useState<Subaccount | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const ssoAttempted = useRef(false);
  const locationFoundRef = useRef(false);

  // Función para buscar subcuenta por locationId
  const findSubaccountByLocation = useCallback(async (locationId: string) => {
    if (locationFoundRef.current) return;
    locationFoundRef.current = true;

    try {
      console.log("🔍 Buscando subcuenta para locationId:", locationId);
      setStatus("Buscando cuenta...");

      const response = await fetch(`/api/subaccounts/by-location/${locationId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `No se encontró una subcuenta para este location.\n\n` +
            `Location ID: ${locationId}\n\n` +
            `La app debe estar instalada primero desde el Marketplace de GHL.`
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Subcuenta encontrada:", data.subaccount?.id);
      setSubaccount(data.subaccount);
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error:", err);
      locationFoundRef.current = false;
      setError(err.message || "Error desconocido");
      setLoading(false);
    }
  }, []);

  // Función para desencriptar SSO y obtener locationId
  const decryptSsoAndFindSubaccount = useCallback(async (encryptedPayload: string) => {
    try {
      console.log("🔐 Descifrando SSO payload...");
      setStatus("Descifrando datos de GHL...");

      const response = await fetch("/api/ghl/decrypt-sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssoKey: encryptedPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error descifrando SSO: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ SSO descifrado:", data);

      // Obtener locationId de los datos descifrados
      const locationId = data.ghlData?.activeLocation ||
                         data.ghlData?.locationId ||
                         data.user?.locationId;

      if (!locationId) {
        throw new Error("No se encontró locationId en los datos SSO descifrados");
      }

      console.log("✅ LocationId obtenido via SSO:", locationId);
      await findSubaccountByLocation(locationId);
    } catch (err: any) {
      console.error("❌ Error descifrando SSO:", err);
      setError(err.message || "Error al descifrar datos de GHL");
      setLoading(false);
    }
  }, [findSubaccountByLocation]);

  // Escuchar respuestas SSO de GHL
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.source === window) return;
      if (locationFoundRef.current) return;

      const data = event.data;
      console.log("📥 Mensaje recibido:", data);

      // Agregar a debug info
      setDebugInfo(prev => {
        const msgPreview = typeof data === 'object' ? JSON.stringify(data).substring(0, 150) : String(data);
        return prev + `\nMsg: ${msgPreview}`;
      });

      // Formato: REQUEST_USER_DATA_RESPONSE con payload encriptado
      if (data?.message === "REQUEST_USER_DATA_RESPONSE" && data?.payload) {
        console.log("🎉 SSO Response recibido");

        const payload = data.payload;

        // Si payload es string, está encriptado - enviar al backend
        if (typeof payload === "string") {
          console.log("🔐 Payload encriptado detectado, enviando al backend...");
          await decryptSsoAndFindSubaccount(payload);
          return;
        }

        // Si payload es objeto, intentar obtener locationId directamente
        if (typeof payload === "object") {
          const locationId = payload.activeLocation || payload.locationId;
          if (locationId && !locationId.includes("{{")) {
            console.log("✅ LocationId directo:", locationId);
            await findSubaccountByLocation(locationId);
            return;
          }
        }
      }

      // Formato alternativo: datos directos con locationId
      if (data?.locationId || data?.activeLocation) {
        const locationId = data.locationId || data.activeLocation;
        if (locationId && !locationId.includes("{{")) {
          console.log("✅ LocationId via mensaje directo:", locationId);
          await findSubaccountByLocation(locationId);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [findSubaccountByLocation, decryptSsoAndFindSubaccount]);

  // Inicialización
  useEffect(() => {
    async function initialize() {
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get("locationId");
      const fullUrl = window.location.href;

      console.log("🚀 GhlIframe inicializando...");
      console.log("📍 URL:", fullUrl);
      console.log("📍 locationId:", locationId);

      setDebugInfo(`URL: ${fullUrl}\nlocationId: ${locationId || "no encontrado"}`);

      // MÉTODO 1: URL params con locationId válido
      if (locationId && !locationId.includes("{{") && !locationId.includes("}}")) {
        console.log("✅ Usando locationId de URL");
        await findSubaccountByLocation(locationId);
        return;
      }

      // MÉTODO 2: SSO - solicitar datos a GHL via postMessage
      if (!ssoAttempted.current) {
        ssoAttempted.current = true;
        setStatus("Solicitando datos a GHL...");
        console.log("📨 URL params no válidos, intentando SSO...");

        if (window.parent && window.parent !== window) {
          console.log("📨 Enviando REQUEST_USER_DATA a GHL...");
          window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");

          // Timeout: si no hay respuesta en 10 segundos
          setTimeout(() => {
            if (!locationFoundRef.current && loading) {
              console.log("⏰ Timeout SSO - no hubo respuesta procesable");
              setError(
                "No se pudo obtener el contexto de GoHighLevel.\n\n" +
                "Posibles causas:\n" +
                "1. La app no fue instalada correctamente\n" +
                "2. El SSO Key no está configurado en el servidor\n" +
                "3. El Custom Menu Link no se creó durante la instalación\n\n" +
                "Solución: Desinstala y reinstala la app desde el Marketplace."
              );
              setLoading(false);
            }
          }, 10000);
        } else {
          console.warn("⚠️ No estamos en un iframe");
          setError(
            "Esta página debe abrirse desde GoHighLevel.\n\n" +
            "Si eres administrador, verifica que:\n" +
            "1. La app esté instalada en la subcuenta\n" +
            "2. Accedas desde el menú lateral de GHL"
          );
          setLoading(false);
        }
      }
    }

    initialize();
  }, [findSubaccountByLocation, loading]);

  // Función para reintentar
  const handleRetry = () => {
    locationFoundRef.current = false;
    ssoAttempted.current = false;
    setError(null);
    setLoading(true);
    setStatus("Reintentando...");
    window.location.reload();
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="ghl-iframe-container min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Conectando...</h2>
          <p className="text-muted-foreground text-sm">{status}</p>
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
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            Error de Conexión
          </h2>
          <p className="text-muted-foreground mb-4 whitespace-pre-line text-sm">{error}</p>
          <div className="space-y-3">
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            {debugInfo && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Info técnica
                </summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                  {debugInfo}
                </pre>
              </details>
            )}
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
              Para reactivar tu cuenta, contacta con tu administrador.
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

  // Usuario autenticado - Mostrar dashboard
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
