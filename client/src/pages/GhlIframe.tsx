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
 * URL: /app-dashboard?locationId={{location.id}}
 *
 * GHL reemplaza automáticamente {{location.id}} con el ID real de la location.
 * Configurar esta URL en GHL Marketplace → Tu App → Custom Page
 */

export default function GhlIframe() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subaccount, setSubaccount] = useState<Subaccount | null>(null);

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

  // Inicialización - usa solo parámetros URL
  useEffect(() => {
    async function initialize() {
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get("locationId");

      // Verificar que locationId exista
      if (!locationId) {
        setError(
          "Falta el parámetro locationId en la URL.\n\n" +
          "Configura la Custom Page URL en GHL Marketplace:\n" +
          "https://whatsapp.cloude.es/app-dashboard?locationId={{location.id}}"
        );
        setLoading(false);
        return;
      }

      // Verificar que GHL haya reemplazado las variables
      if (locationId.includes("{{")) {
        setError(
          "GHL no reemplazó las variables de la URL.\n\n" +
          "Verifica la configuración de Custom Page en el Marketplace."
        );
        setLoading(false);
        return;
      }

      // Buscar la subcuenta
      console.log("📍 Usando locationId de URL:", locationId);
      await findSubaccountByLocation(locationId);
    }

    initialize();
  }, [findSubaccountByLocation]);

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
          <h2 className="text-xl font-semibold mb-2">Cargando...</h2>
          <p className="text-muted-foreground">
            Conectando con tu cuenta
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
            Error de Configuración
          </h2>
          <p className="text-muted-foreground mb-4 whitespace-pre-line">{error}</p>
          <div className="space-y-3">
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <p className="text-sm text-muted-foreground">
              Si el problema persiste, verifica la configuración en GHL Marketplace.
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
