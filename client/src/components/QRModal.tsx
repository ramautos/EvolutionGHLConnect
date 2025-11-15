import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { io, Socket } from "socket.io-client";
import confetti from "canvas-confetti";

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
  const confettiIntervalRef = useRef<any>(null);
  const closeTimeoutRef = useRef<any>(null);
  const pollingIntervalRef = useRef<any>(null);

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

  // Función para celebrar la conexión
  const celebrate Connection = (phoneNumber: string) => {
    console.log(`🎉 Iniciando celebración para ${phoneNumber}`);
    setPhoneDetected(phoneNumber);
    setIsScanning(false);
    queryClient.invalidateQueries({ queryKey: ["/api/instances/user", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount"] });

    // 🎉 Lanzar confeti celebratorio
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        confettiIntervalRef.current = null;
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    confettiIntervalRef.current = interval;

    // Toast celebratorio
    toast({
      title: "¡Felicidades!",
      description: `WhatsApp conectado exitosamente con ${phoneNumber}`,
    });

    // Cerrar modal después de 3 segundos
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 3000);
  };

  useEffect(() => {
    if (!isOpen || !instanceId) return;

    generateQRMutation.mutate();

    // WebSocket con logs detallados
    console.log(`🔌 Conectando WebSocket para instancia: ${instanceId}`);
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log(`✅ WebSocket conectado - ID: ${newSocket.id}`);
      console.log(`📡 Suscribiéndose a room: instance-${instanceId}`);
      newSocket.emit("subscribe-instance", instanceId);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Error de conexión WebSocket:", error);
    });

    newSocket.on("instance-connected", (data: { instanceId: string; phoneNumber: string }) => {
      console.log(`🎉 Evento WebSocket recibido:`, data);
      if (data.instanceId === instanceId) {
        console.log(`✅ Coincide con instancia actual, celebrando...`);
        celebrateConnection(data.phoneNumber);
        // Detener polling si está activo
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    });

    setSocket(newSocket);

    // Polling como fallback (verifica cada 2 segundos)
    console.log(`⏱️ Iniciando polling de fallback cada 2 segundos`);
    const pollingInterval = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/instances/${instanceId}`);
        const instance = await res.json();

        if (instance.status === "connected" && instance.phoneNumber && !phoneDetected) {
          console.log(`✅ Polling detectó conexión: ${instance.phoneNumber}`);
          celebrateConnection(instance.phoneNumber);
          clearInterval(pollingInterval);
          pollingIntervalRef.current = null;
        }
      } catch (error) {
        console.error("Error en polling:", error);
      }
    }, 2000);

    pollingIntervalRef.current = pollingInterval;

    return () => {
      console.log(`🔌 Desconectando WebSocket y limpiando recursos`);
      newSocket.disconnect();

      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current);
        confettiIntervalRef.current = null;
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
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
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <Sparkles className="w-6 h-6 text-yellow-500 absolute top-0 right-1/4 animate-bounce" />
                <Sparkles className="w-5 h-5 text-yellow-400 absolute bottom-2 left-1/4 animate-bounce delay-150" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ¡Felicidades!
                </h3>
                <p className="text-base text-muted-foreground mb-2">
                  WhatsApp conectado exitosamente
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-600">{phoneDetected}</p>
                </div>
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
