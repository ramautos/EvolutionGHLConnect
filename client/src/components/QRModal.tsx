import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrValue: string;
  isScanning: boolean;
  phoneDetected?: string;
}

export default function QRModal({
  isOpen,
  onClose,
  qrValue,
  isScanning,
  phoneDetected,
}: QRModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="qr-modal">
        <DialogHeader>
          <DialogTitle>Escanear Código QR</DialogTitle>
          <DialogDescription>
            Usa WhatsApp en tu teléfono para escanear este código
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8">
          {phoneDetected ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-500 mb-2">
                  ¡Conectado!
                </div>
                <div className="text-2xl font-bold" data-testid="modal-phone-number">
                  {phoneDetected}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  El número ha sido enviado a tu webhook
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl mb-4" data-testid="modal-qr-code">
                <QRCodeSVG value={qrValue} size={200} />
              </div>
              {isScanning && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Esperando escaneo...</span>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
