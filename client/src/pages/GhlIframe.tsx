import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SubaccountDetails from "@/pages/SubaccountDetails";

/**
 * Página especial para el iframe de GoHighLevel
 *
 * Esta página se abre cuando el usuario hace clic en el Custom Menu Link
 * dentro de GHL. Recibe un ssoKey encriptado que contiene la información
 * del usuario autenticado en GHL.
 *
 * Flujo:
 * 1. GHL abre: /ghl-iframe?ssoKey=ENCRYPTED_TOKEN
 * 2. Frontend lee el ssoKey de la URL
 * 3. Lo envía al backend: POST /api/ghl/decrypt-sso
 * 4. Backend descifra y devuelve los datos del usuario
 * 5. Frontend establece el usuario en contexto
 * 6. Muestra el dashboard adaptado para iframe
 */
export default function GhlIframe() {
  const [, navigate] = useLocation();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subaccountId, setSubaccountId] = useState<string | null>(null);

  useEffect(() => {
    async function authenticateWithSSO() {
      try {
        // Obtener el ssoKey de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const ssoKey = urlParams.get("ssoKey");

        if (!ssoKey) {
          setError("No se encontró el token SSO en la URL");
          setLoading(false);
          return;
        }

        console.log("🔐 Autenticando con SSO de GHL...");

        // Descifrar el SSO key y autenticar
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

        // Establecer el usuario en el contexto
        setUser(data.user);
        setSubaccountId(data.user.id);
        setLoading(false);
      } catch (err: any) {
        console.error("❌ Error en autenticación SSO:", err);
        setError(err.message || "Error desconocido");
        setLoading(false);
      }
    }

    // Solo autenticar si no hay usuario ya autenticado
    if (!user) {
      authenticateWithSSO();
    } else {
      // Usuario ya autenticado, mostrar su subaccount
      setSubaccountId(user.id);
      setLoading(false);
    }
  }, [user, setUser]);

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center border-destructive">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            Error de Autenticación
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Por favor, intenta cerrar y volver a abrir el dashboard desde GHL.
          </p>
        </Card>
      </div>
    );
  }

  // Usuario autenticado correctamente
  // Mostrar el dashboard adaptado para iframe
  if (subaccountId) {
    return (
      <div className="iframe-mode">
        {/*
          Wrapper especial para modo iframe
          Se puede usar CSS para ocultar elementos innecesarios
          como navbar, sidebar, etc.
        */}
        <SubaccountDetails />
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </Card>
    </div>
  );
}
