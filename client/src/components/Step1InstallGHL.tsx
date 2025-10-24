import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, CheckCircle2 } from "lucide-react";

export default function Step1InstallGHL({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-2xl mx-auto" data-testid="step-1-install-ghl">
      <Card className="p-8 border-card-border">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
            <Download className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
              Paso 1: Instalar App de GoHighLevel
            </h2>
            <p className="text-muted-foreground">
              Conecta tu cuenta de GoHighLevel para comenzar
            </p>
          </div>
          
          <div className="bg-muted/30 rounded-xl p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Autorización segura con OAuth 2.0</div>
                <div className="text-sm text-muted-foreground">Tu información está protegida</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Acceso a todas tus subcuentas</div>
                <div className="text-sm text-muted-foreground">Gestiona múltiples líneas de negocio</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Instalación en un solo clic</div>
                <div className="text-sm text-muted-foreground">Sin configuración técnica</div>
              </div>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="w-full gap-2" 
            onClick={onNext}
            data-testid="button-install-ghl-app"
          >
            <ExternalLink className="w-5 h-5" />
            Conectar con GoHighLevel
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Serás redirigido a GoHighLevel para autorizar la aplicación
          </p>
        </div>
      </Card>
    </div>
  );
}
