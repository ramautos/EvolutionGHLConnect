import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface GhlInstallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type InstallState = "idle" | "authorizing" | "processing" | "success" | "error";

export function GhlInstallPopup({ isOpen, onClose, onSuccess }: GhlInstallPopupProps) {
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null);

  // Limpiar popup al cerrar
  useEffect(() => {
    return () => {
      if (oauthPopup && !oauthPopup.closed) {
        oauthPopup.close();
      }
    };
  }, [oauthPopup]);

  // Escuchar mensajes del callback OAuth
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origen por seguridad
      if (event.origin !== window.location.origin) return;

      const { type, data } = event.data;

      if (type === "ghl-oauth-success") {
        console.log("✅ OAuth completado exitosamente:", data);
        setInstallState("success");

        // Cerrar popup si está abierto
        if (oauthPopup && !oauthPopup.closed) {
          oauthPopup.close();
        }

        // Notificar éxito después de 2 segundos
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else if (type === "ghl-oauth-error") {
        console.error("❌ Error en OAuth:", data.error);
        setInstallState("error");
        setErrorMessage(data.error || "Error en la autorización");

        if (oauthPopup && !oauthPopup.closed) {
          oauthPopup.close();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [oauthPopup, onSuccess, onClose]);

  // Monitorear si el popup se cierra (exitosamente o por el usuario)
  useEffect(() => {
    if (!oauthPopup || installState !== "authorizing") return;

    const checkPopupClosed = setInterval(() => {
      if (oauthPopup.closed) {
        console.log("⚠️ Popup cerrado");
        clearInterval(checkPopupClosed);

        // Verificar si fue exitoso comprobando si hay subcuentas nuevas
        // o simplemente asumir éxito y recargar
        setInstallState("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    }, 500);

    return () => clearInterval(checkPopupClosed);
  }, [oauthPopup, installState, onSuccess, onClose]);

  const startInstallation = async () => {
    try {
      setInstallState("authorizing");
      setErrorMessage("");

      // 1. Generar OAuth state en el backend (se guarda en la base de datos)
      const stateResponse = await fetch("/api/ghl/generate-oauth-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!stateResponse.ok) {
        throw new Error("No se pudo generar el state de OAuth. Verifica que estés autenticado.");
      }

      const { state } = await stateResponse.json();
      console.log("✅ OAuth state generado:", state);

      // 2. Construir URL de OAuth
      const clientId = import.meta.env.VITE_GHL_CLIENT_ID || "68a94abebdd32d0a7010600e-mgpykfcm";
      // Usar n8n webhook como redirect para procesar OAuth correctamente
      const redirectUri = "https://ray.cloude.es/webhook/registrocuenta";
      // Incluye custom-menu-link para crear menús automáticamente en GHL
      const scopes = [
        "contacts.readonly",
        "contacts.write",
        "conversations.readonly",
        "conversations.write",
        "conversations/message.readonly",
        "conversations/message.write",
        "locations.readonly",
        "locations/customValues.readonly",
        "locations/customValues.write",
        "locations/customFields.readonly",
        "locations/customFields.write",
        "locations/tags.write",
        "socialplanner/tag.readonly",
        "locations/tasks.readonly",
        "locations/tags.readonly",
        "users.readonly",
        "companies.readonly",
        "locations/templates.readonly",
        "custom-menu-link.readonly",
        "custom-menu-link.write",
        "oauth.readonly",
        "oauth.write",
      ].join(" ");

      // version_id requerido para usar los scopes actualizados de la app
      const versionId = "68a94abebdd32d0a7010600e";

      const oauthUrl =
        `https://marketplace.gohighlevel.com/oauth/chooselocation?` +
        `response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${state}` +
        `&version_id=${versionId}`;

      // Abrir popup centrado
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        oauthUrl,
        "ghl-oauth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error("No se pudo abrir el popup. Verifica que no esté bloqueado.");
      }

      setOauthPopup(popup);
    } catch (error: any) {
      console.error("Error iniciando instalación:", error);
      setInstallState("error");
      setErrorMessage(error.message || "Error al iniciar la instalación");
    }
  };

  const handleRetry = () => {
    setInstallState("idle");
    setErrorMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {installState === "idle" && "Conectar con GoHighLevel"}
            {installState === "authorizing" && "Autorizando..."}
            {installState === "processing" && "Procesando..."}
            {installState === "success" && "¡Instalación Completa!"}
            {installState === "error" && "Error de Instalación"}
          </DialogTitle>
          <DialogDescription>
            {installState === "idle" &&
              "Conecta tu cuenta de GoHighLevel para comenzar a usar WhatsApp Dashboard"}
            {installState === "authorizing" &&
              "Se abrió una ventana para autorizar. Por favor completa la autorización."}
            {installState === "processing" && "Configurando tu cuenta..."}
            {installState === "success" && "Tu cuenta ha sido conectada exitosamente"}
            {installState === "error" && errorMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          {installState === "idle" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-4xl">🚀</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Permisos Necesarios</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Acceso a contactos</li>
                  <li>✓ Gestión de conversaciones</li>
                  <li>✓ Lectura de oportunidades</li>
                  <li>✓ Información de ubicación</li>
                </ul>
              </div>
            </div>
          )}

          {installState === "authorizing" && (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Esperando autorización en la ventana emergente...
              </p>
            </div>
          )}

          {installState === "processing" && (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Configurando tu integración...
              </p>
            </div>
          )}

          {installState === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}

          {installState === "error" && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            </div>
          )}
        </div>

        <DialogFooter>
          {installState === "idle" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={startInstallation}>
                Conectar Ahora
              </Button>
            </>
          )}

          {installState === "error" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={handleRetry}>
                Reintentar
              </Button>
            </>
          )}

          {(installState === "authorizing" || installState === "processing") && (
            <Button variant="outline" onClick={onClose} disabled>
              Procesando...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
