import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Step3ScanQR({ onComplete }: { onComplete: () => void }) {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState<string | null>(null);
  
  // todo: remove mock functionality
  const mockQRValue = "https://wa.me/qr/ABCDEF123456";
  
  const generateQR = () => {
    setQrGenerated(true);
    setIsScanning(true);
    
    // Simulate phone number detection after 3 seconds
    setTimeout(() => {
      setPhoneDetected("+1 (555) 123-4567");
      setIsScanning(false);
    }, 3000);
  };
  
  return (
    <div className="max-w-2xl mx-auto" data-testid="step-3-scan-qr">
      <Card className="p-8 border-card-border">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center mb-6">
              <ScanLine className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
              Paso 3: Escanear Código QR
            </h2>
            <p className="text-muted-foreground">
              Conecta tu número de WhatsApp escaneando el código QR
            </p>
          </div>
          
          {!qrGenerated ? (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium mb-1">1. Abre WhatsApp en tu teléfono</div>
                    <div className="text-muted-foreground">Ve a Ajustes → Dispositivos vinculados</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ScanLine className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium mb-1">2. Toca "Vincular un dispositivo"</div>
                    <div className="text-muted-foreground">Se abrirá el escáner de códigos QR</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium mb-1">3. Escanea el código que aparecerá aquí</div>
                    <div className="text-muted-foreground">La conexión se detectará automáticamente</div>
                  </div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full" 
                onClick={generateQR}
                data-testid="button-generate-qr"
              >
                Generar Código QR
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-8 flex flex-col items-center justify-center border border-card-border">
                {phoneDetected ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-500 mb-2">
                        ¡Conectado Exitosamente!
                      </div>
                      <div className="text-2xl font-bold" data-testid="detected-phone-number">
                        {phoneDetected}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Este número ha sido enviado a tu webhook
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-6 rounded-2xl mb-4" data-testid="qr-code-display">
                      <QRCodeSVG value={mockQRValue} size={200} />
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
              
              {phoneDetected && (
                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={onComplete}
                  data-testid="button-complete-setup"
                >
                  Completar Configuración
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
