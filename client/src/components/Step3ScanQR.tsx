import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

export default function Step3ScanQR({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState<string>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [instanceId, setInstanceId] = useState<string>("");

  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      const evolutionName = `wa-${Date.now()}`;
      const res = await apiRequest("POST", "/api/instances", {
        userId: user?.id,
        instanceName: evolutionName,
        evolutionInstanceName: evolutionName,
        subaccountId: null,
        status: "created",
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setInstanceId(data.id);
      generateQRMutation.mutate(data.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la instancia",
        variant: "destructive",
      });
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/instances/${id}/generate-qr`);
      return await res.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setQrGenerated(true);
      setIsScanning(true);
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
    if (!instanceId) return;

    const newSocket = io(window.location.origin);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("subscribe-instance", instanceId);
    });

    newSocket.on("instance-connected", (data: { instanceId: string; phoneNumber: string }) => {
      if (data.instanceId === instanceId) {
        setPhoneDetected(data.phoneNumber);
        setIsScanning(false);
        toast({
          title: "¡Conectado!",
          description: `WhatsApp conectado con el número ${data.phoneNumber}`,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [instanceId, toast]);

  const generateQR = () => {
    createInstanceMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="step-3-scan-qr">
      <Card className="p-8 border-card-border">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-3 to-primary flex items-center justify-center mb-6">
              <ScanLine className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
              Paso 3: Escanear Código QR
            </h2>
            <p className="text-muted-foreground">
              Conecta tu cuenta de WhatsApp escaneando el código QR
            </p>
          </div>

          {!qrGenerated ? (
            <div className="space-y-6">
              <div className="bg-muted/30 border border-border rounded-xl p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Instrucciones</h3>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      <li>1. Abre WhatsApp en tu teléfono</li>
                      <li>2. Toca Menú o Configuración y selecciona Dispositivos vinculados</li>
                      <li>3. Toca en Vincular un dispositivo</li>
                      <li>4. Apunta tu teléfono hacia esta pantalla para escanear el código</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={generateQR}
                disabled={createInstanceMutation.isPending || generateQRMutation.isPending}
                data-testid="button-generate-qr"
              >
                {createInstanceMutation.isPending || generateQRMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generando código QR...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-5 h-5 mr-2" />
                    Generar Código QR
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              {phoneDetected ? (
                <div className="space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">¡Conectado Exitosamente!</h3>
                    <p className="text-muted-foreground mb-1">
                      Tu WhatsApp ha sido vinculado correctamente
                    </p>
                    <p className="text-sm font-medium text-primary">{phoneDetected}</p>
                  </div>
                  <Button size="lg" className="w-full" onClick={onComplete} data-testid="button-finish">
                    Finalizar Configuración
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-white p-6 rounded-2xl mb-4" data-testid="qr-code-display">
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
          )}
        </div>
      </Card>
    </div>
  );
}
