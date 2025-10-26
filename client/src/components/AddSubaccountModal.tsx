import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddSubaccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSubaccountModal({ open, onClose, onSuccess }: AddSubaccountModalProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const popupCheckIntervalRef = useRef<number>();

  // Limpiar interval al cerrar
  useEffect(() => {
    return () => {
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
      }
    };
  }, []);

  // Detectar cuando el usuario vuelve del OAuth
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ghl_oauth_success" && e.newValue === "true") {
        // OAuth exitoso
        localStorage.removeItem("ghl_oauth_success");
        setIsConnecting(false);
        
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
        
        toast({
          title: "¡Subcuenta agregada!",
          description: "Tu ubicación de GoHighLevel ha sido conectada exitosamente",
        });
        
        onSuccess?.();
        onClose();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [popupWindow, toast, onClose, onSuccess]);

  const handleConnectGHL = () => {
    setIsConnecting(true);

    // URL del OAuth de GoHighLevel
    // Esta URL apunta al instalador de la app de GHL que redirige a n8n
    const ghlInstallerUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https://ray.cloude.es/webhook/registrocuenta&client_id=${
      import.meta.env.VITE_GHL_CLIENT_ID || ""
    }&scope=locations.readonly contacts.readonly`;

    // Abrir popup centrado
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      ghlInstallerUrl,
      "GHL OAuth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );

    if (popup) {
      setPopupWindow(popup);

      // Verificar si el popup se cerró sin completar
      popupCheckIntervalRef.current = window.setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckIntervalRef.current);
          setIsConnecting(false);
          
          // Verificar si fue exitoso
          const wasSuccessful = localStorage.getItem("ghl_oauth_success") === "true";
          if (!wasSuccessful) {
            toast({
              title: "Conexión cancelada",
              description: "No se completó la conexión con GoHighLevel",
              variant: "destructive",
            });
          }
        }
      }, 500);
    } else {
      setIsConnecting(false);
      toast({
        title: "Error al abrir ventana",
        description: "Por favor habilita las ventanas emergentes para este sitio",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }
    
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
    }
    
    setIsConnecting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Agregar Subcuenta
          </DialogTitle>
          <DialogDescription>
            Conecta una ubicación de GoHighLevel para comenzar a automatizar WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isConnecting ? (
            <>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">¿Cómo funciona?</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Haz clic en "Conectar con GoHighLevel"</li>
                  <li>Inicia sesión en tu cuenta de GoHighLevel</li>
                  <li>Selecciona la ubicación que deseas conectar</li>
                  <li>Autoriza la aplicación</li>
                </ol>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                <p className="text-foreground/80">
                  💡 <strong>Tip:</strong> Puedes agregar múltiples ubicaciones. Cada ubicación puede tener múltiples instancias de WhatsApp.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-muted rounded-lg p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Conectando con GoHighLevel...</p>
                <p className="text-sm text-muted-foreground">
                  Completa la autorización en la ventana emergente
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConnecting}
            data-testid="button-cancel"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConnectGHL}
            disabled={isConnecting}
            data-testid="button-connect-ghl"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Conectar con GoHighLevel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
