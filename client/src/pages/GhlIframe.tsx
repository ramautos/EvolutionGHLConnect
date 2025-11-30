import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubaccountDetails from "@/pages/SubaccountDetails";

/**
 * Página especial para el iframe de GoHighLevel (Custom Menu Link / Custom Page)
 *
 * Esta página se abre cuando el usuario hace clic en el Custom Menu Link
 * dentro de GHL. Usa variables de template de GHL en la URL.
 *
 * URL configurada en GHL:
 * https://whatsapp.cloude.es/app-dashboard?locationId={{location.id}}&userId={{user.id}}&email={{user.email}}
 *
 * Flujo:
 * 1. Usuario hace clic en Custom Menu Link en GHL
 * 2. GHL reemplaza las variables: {{location.id}}, {{user.id}}, {{user.email}}
 * 3. GHL carga el iframe con la URL completa
 * 4. Frontend lee los parámetros de la URL
 * 5. Frontend busca la subcuenta por locationId
 * 6. Muestra el dashboard adaptado para iframe
 *
 * Variables disponibles de GHL:
 * - {{location.id}} - ID de la ubicación/subcuenta
 * - {{location.name}} - Nombre de la ubicación
 * - {{user.id}} - ID del usuario logueado
 * - {{user.name}} - Nombre del usuario
 * - {{user.email}} - Email del usuario
 * - {{user.phone}} - Teléfono del usuario
 * - {{company.id}} - ID de la agencia
 */

interface GhlUrlParams {
  locationId: string | null;
  userId: string | null;
  email: string | null;
  userName: string | null;
  companyId: string | null;
}

export default function GhlIframe() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subaccountId, setSubaccountId] = useState<string | null>(null);
  const [ghlParams, setGhlParams] = useState<GhlUrlParams | null>(null);

  useEffect(() => {
    async function initializeFromUrl() {
      // Leer parámetros de la URL (inyectados por GHL)
      const urlParams = new URLSearchParams(window.location.search);

      const params: GhlUrlParams = {
        locationId: urlParams.get("locationId"),
        userId: urlParams.get("userId"),
        email: urlParams.get("email"),
        userName: urlParams.get("userName") || urlParams.get("name"),
        companyId: urlParams.get("companyId"),
      };

      console.log("📍 Parámetros de URL de GHL:", params);

      // Verificar que tenemos el locationId (requerido)
      if (!params.locationId) {
        setError(
          "No se recibió el locationId de GoHighLevel.\n\n" +
          "Configura la URL del Custom Menu Link así:\n" +
          "https://whatsapp.cloude.es/app-dashboard?locationId={{location.id}}&userId={{user.id}}&email={{user.email}}"
        );
        setLoading(false);
        return;
      }

      setGhlParams(params);

      try {
        // Buscar la subcuenta por locationId
        console.log("🔍 Buscando subcuenta para locationId:", params.locationId);

        const response = await apiRequest("GET", `/api/subaccounts/by-location/${params.locationId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError(
              `No se encontró una subcuenta para este location.\n\n` +
              `Location ID: ${params.locationId}\n\n` +
              `La app debe estar instalada primero desde el Marketplace de GHL.`
            );
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al buscar subcuenta");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        console.log("✅ Subcuenta encontrada:", data.subaccount?.id);
        setSubaccountId(data.subaccount.id);
        setLoading(false);

      } catch (err: any) {
        console.error("❌ Error:", err);
        setError(err.message || "Error desconocido");
        setLoading(false);
      }
    }

    initializeFromUrl();
  }, []);

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
