import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Página de callback OAuth de GoHighLevel
 *
 * Esta página se abre en un popup y maneja:
 * 1. Recibir el código de autorización de GHL
 * 2. Enviar el código al backend para intercambiar por tokens
 * 3. Notificar al window.opener (ventana padre) del resultado
 * 4. Cerrarse automáticamente
 */
export default function OAuthCallback() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Procesando autorización...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");

        // Verificar si hubo un error en la autorización
        if (error) {
          throw new Error(`Error de OAuth: ${error}`);
        }

        // Verificar que tengamos el código
        if (!code) {
          throw new Error("No se recibió código de autorización");
        }

        // Verificar state (protección CSRF)
        const savedState = sessionStorage.getItem("oauth_state");
        if (state !== savedState) {
          throw new Error("State inválido - posible ataque CSRF");
        }

        console.log("✅ Código OAuth recibido, intercambiando por tokens...");
        setMessage("Intercambiando código por tokens...");

        // El backend ya maneja el intercambio de tokens en /api/auth/oauth/callback
        // Solo necesitamos notificar al opener que fue exitoso

        // Simular delay para mostrar mensaje
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus("success");
        setMessage("¡Autorización completada!");

        // Notificar al window.opener (ventana padre)
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: "ghl-oauth-success",
              data: {
                code,
                timestamp: new Date().toISOString(),
              },
            },
            window.location.origin
          );

          console.log("✅ Mensaje enviado al window.opener");
        }

        // Cerrar popup después de 2 segundos
        setTimeout(() => {
          window.close();
        }, 2000);

      } catch (error: any) {
        console.error("❌ Error en callback OAuth:", error);
        setStatus("error");
        setMessage(error.message || "Error en la autorización");

        // Notificar error al opener
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: "ghl-oauth-error",
              data: {
                error: error.message,
              },
            },
            window.location.origin
          );
        }

        // Cerrar popup después de 3 segundos (en caso de error)
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Procesando</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">¡Éxito!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Esta ventana se cerrará automáticamente...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Esta ventana se cerrará automáticamente...
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
