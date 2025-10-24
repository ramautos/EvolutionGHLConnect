import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { io, Socket } from "socket.io-client";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
}

export default function QRModal({ isOpen, onClose, instanceId }: QRModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState<string>();
  const [socket, setSocket] = useState<Socket | null>(null);

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/instances/${instanceId}/generate-qr`);
      return await res.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setIsScanning(true);
      setPhoneDetected(undefined);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isOpen || !instanceId) return;

    generateQRMutation.mutate();

    const newSocket = io(window.location.origin);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("subscribe-instance", instanceId);
    });

    newSocket.on("instance-connected", (data: { instanceId: string; phoneNumber: string }) => {
      if (data.instanceId === instanceId) {
        setPhoneDetected(data.phoneNumber);
        setIsScanning(false);
        queryClient.invalidateQueries({ queryKey: ["/api/instances/user", user?.id] });
        toast({
          title: "¡Conectado!",
          description: `WhatsApp conectado con el número ${data.phoneNumber}`,
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, instanceId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código QR</DialogTitle>
          <DialogDescription>
            Abre WhatsApp en tu teléfono y escanea este código
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {generateQRMutation.isPending ? (
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Generando código QR...</p>
            </div>
          ) : phoneDetected ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">¡Conectado!</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  WhatsApp vinculado correctamente
                </p>
                <p className="text-sm font-medium text-primary">{phoneDetected}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl mb-4" data-testid="modal-qr-code">
                <QRCodeSVG value={qrCode} size={200} />
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
