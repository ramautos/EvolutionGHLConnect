import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubaccountVerification {
  valid: boolean;
  subaccount?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

export default function InstallSubaccount() {
  const [, params] = useRoute("/install/:token");
  const token = params?.token;
  const { toast } = useToast();
  const [isInstalling, setIsInstalling] = useState(false);

  // Verificar el token
  const { data: verification, isLoading, error } = useQuery<SubaccountVerification>({
    queryKey: ["/api/subaccounts/verify-token", token],
    enabled: !!token,
    retry: false,
  });

  const handleInstall = () => {
    if (!token) return;

    setIsInstalling(true);

    // Construir URL de OAuth con state que incluye el token
    const clientId = import.meta.env.VITE_GHL_CLIENT_ID || "68a94abebdd32d0a7010600e-mgpykfcm";
    // Usar n8n webhook como redirect para procesar OAuth correctamente
    const redirectUri = "https://ray.cloude.es/webhook/registrocuenta";

    // State especial que indica que es una instalación vendida
    const state = JSON.stringify({
      type: 'sold_subaccount',
      token: token,
    });

    // Scopes correctos de la aplicación (coinciden con AddSubaccountModal)
    const scopes = 'contacts.readonly+contacts.write+conversations.readonly+conversations.write+conversations/message.readonly+conversations/message.write+locations.readonly+locations/customValues.readonly+locations/customValues.write+locations/customFields.readonly+locations/customFields.write+locations/tags.write+socialplanner/tag.readonly+locations/tasks.readonly+locations/tags.readonly+users.readonly+companies.readonly+locations/templates.readonly';

    const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${scopes}&state=${encodeURIComponent(state)}`;

    // Redirigir a OAuth de GoHighLevel
    window.location.href = authUrl;
  };

  // Token inválido o error
  if (!token || error || (verification && !verification.valid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-900">Link Inválido</CardTitle>
            <CardDescription className="text-red-700">
              Este link de instalación no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Por favor, contacta con la agencia que te proporcionó este link para obtener uno nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cargando verificación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Verificando...</CardTitle>
            <CardDescription>
              Validando tu link de instalación
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Token válido - mostrar pantalla de instalación
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl mb-2">Bienvenido a WhatsApp Integration</CardTitle>
          <CardDescription className="text-lg">
            Conecta tu cuenta de GoHighLevel para comenzar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {verification?.subaccount && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Información de tu cuenta:</h3>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Nombre:</span> {verification.subaccount.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {verification.subaccount.email}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold">¿Qué vas a obtener?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Hasta 5 instancias de WhatsApp incluidas</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Dashboard completo para gestionar tus conexiones</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Integración automática con GoHighLevel</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Soporte técnico de tu agencia</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-sm">Próximos pasos:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Haz clic en "Conectar con GoHighLevel"</li>
              <li>2. Selecciona tu ubicación de GoHighLevel</li>
              <li>3. Autoriza la aplicación</li>
              <li>4. ¡Listo! Serás redirigido a tu dashboard</li>
            </ol>
          </div>

          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Redirigiendo a GoHighLevel...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Conectar con GoHighLevel
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Al continuar, aceptas conectar tu cuenta de GoHighLevel con esta aplicación de WhatsApp.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
