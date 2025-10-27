import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink } from "lucide-react";

interface AddSubaccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSubaccountModal({ open, onClose }: AddSubaccountModalProps) {
  const handleConnectGHL = () => {
    // URL del OAuth de GoHighLevel
    // Esta URL apunta al instalador de la app de GHL que redirige a n8n
    const ghlInstallerUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https://ray.cloude.es/webhook/registrocuenta&client_id=${
      import.meta.env.VITE_GHL_CLIENT_ID || ""
    }&scope=locations.readonly contacts.readonly`;

    // Redirigir la página completa (más confiable que popup, especialmente en Replit)
    window.location.href = ghlInstallerUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">¿Cómo funciona?</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Haz clic en "Conectar con GoHighLevel"</li>
              <li>Inicia sesión en tu cuenta de GoHighLevel</li>
              <li>Selecciona la ubicación que deseas conectar</li>
              <li>Autoriza la aplicación</li>
              <li>Serás redirigido de vuelta al dashboard</li>
            </ol>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
            <p className="text-foreground/80">
              💡 <strong>Tip:</strong> Puedes agregar múltiples ubicaciones. Cada ubicación puede tener múltiples instancias de WhatsApp.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConnectGHL}
            data-testid="button-connect-ghl"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Conectar con GoHighLevel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
