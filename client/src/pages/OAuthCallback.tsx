import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Página de callback OAuth de GoHighLevel
 *
 * Esta página se abre en un popup y maneja:
 * 1. Recibir confirmación de instalación exitosa (success=true)
 * 2. Notificar al window.opener (ventana padre) del resultado
 * 3. Refrescar la página padre
 * 4. Cerrarse automáticamente
 *
 * URL esperada después de que n8n procese:
 * https://whatsapp.cloude.es/oauth/callback?success=true
 */
export default function OAuthCallback() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Procesando autorización...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get("success");
        const error = urlParams.get("error");
        const code = urlParams.get("code");

        // Verificar si hubo un error
        if (error) {
          throw new Error(`Error de OAuth: ${error}`);
        }

        // Si viene con success=true, el proceso ya se completó en n8n
        if (success === "true") {
          console.log("✅ Instalación completada exitosamente");
          setStatus("success");
          setMessage("¡Instalación completada!");

          // Notificar al opener y refrescar
          notifyOpenerAndClose(true);
          return;
        }

        // Si viene con código, es el flujo directo (sin n8n)
        if (code) {
          console.log("✅ Código OAuth recibido");
          setStatus("success");
          setMessage("¡Autorización completada!");
          notifyOpenerAndClose(true);
          return;
        }

        // Si no hay parámetros válidos, esperar un momento
        // (puede que la página se esté redirigiendo)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Si después de 2 segundos seguimos aquí sin parámetros, mostrar éxito
        // (asumimos que el usuario completó el proceso)
        setStatus("success");
        setMessage("Proceso completado");
        notifyOpenerAndClose(true);

      } catch (error: any) {
        console.error("❌ Error en callback OAuth:", error);
        setStatus("error");
        setMessage(error.message || "Error en la autorización");
        notifyOpenerAndClose(false, error.message);
      }
    }

    function notifyOpenerAndClose(success: boolean, errorMsg?: string) {
      // Notificar al window.opener (ventana padre)
      if (window.opener && !window.opener.closed) {
        if (success) {
          window.opener.postMessage(
            {
              type: "ghl-oauth-success",
              data: {
                timestamp: new Date().toISOString(),
              },
            },
            window.location.origin
          );

          // Forzar refresh de la página padre
          try {
            window.opener.location.reload();
          } catch (e) {
            console.log("No se pudo refrescar la página padre directamente");
          }
        } else {
          window.opener.postMessage(
            {
              type: "ghl-oauth-error",
              data: { error: errorMsg },
            },
            window.location.origin
          );
        }
        console.log("✅ Mensaje enviado al window.opener");
      }

      // Cerrar popup después de 1.5 segundos
      setTimeout(() => {
        window.close();
      }, 1500);
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
              Cerrando ventana automáticamente...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Cerrando ventana automáticamente...
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
