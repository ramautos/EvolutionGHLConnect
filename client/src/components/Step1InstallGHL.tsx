import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, CheckCircle2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Step1InstallGHL({ onNext }: { onNext: () => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isGeneratingState, setIsGeneratingState] = useState(false);
  
  const handleInstallClick = async () => {
    try {
      setIsGeneratingState(true);
      
      // 1. Generar OAuth state en el backend
      const response = await fetch("/api/ghl/generate-oauth-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate OAuth state");
      }

      const { state } = await response.json();
      
      // 2. Construir la URL de OAuth de GoHighLevel
      const baseUrl = "https://marketplace.leadconnectorhq.com/oauth/chooselocation";
      const clientId = import.meta.env.VITE_GHL_CLIENT_ID || "68a94abebdd32d0a7010600e-mgpykfcm";
      
      // n8n webhook que manejará el OAuth y redirigirá de vuelta a nuestra app
      const redirectUri = "https://ray.cloude.es/webhook/registrocuenta";
      
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
        "locations/templates.readonly"
      ].join(" ");

      const params = new URLSearchParams({
        response_type: "code",
        redirect_uri: redirectUri,
        client_id: clientId,
        scope: scopes,
        // Usar el state generado por el backend
        state: state,
      });

      const authUrl = `${baseUrl}?${params.toString()}`;
      
      // 3. Redirigir a GoHighLevel OAuth (que luego redirigirá a n8n)
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la conexión con GoHighLevel. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      setIsGeneratingState(false);
    }
  };

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
            onClick={handleInstallClick}
            disabled={isGeneratingState}
            data-testid="button-install-ghl-app"
          >
            <ExternalLink className="w-5 h-5" />
            {isGeneratingState ? "Iniciando conexión..." : "Conectar con GoHighLevel"}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Serás redirigido a GoHighLevel para autorizar la aplicación
          </p>
        </div>
      </Card>
    </div>
  );
}
