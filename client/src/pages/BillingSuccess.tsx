import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function BillingSuccess() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Obtener session_id de la URL
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session_id");
    setSessionId(session);

    // Invalidar queries para refrescar datos
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts"] });
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px]" />
        <div className="relative z-10 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Procesando tu suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-chart-2/5 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px]" />
      
      <Card className="max-w-2xl w-full relative z-10 border-2 shadow-2xl" data-testid="card-success">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-chart-2 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in-50 duration-500">
            <Check className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-150">
            <CardTitle className="text-3xl sm:text-4xl font-bold">
              ¡Suscripción Activada!
            </CardTitle>
            <CardDescription className="text-lg">
              Tu plan ha sido activado exitosamente
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-300">
          <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg p-6 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">¿Qué sigue?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Tienes <strong className="text-foreground">7 días de prueba gratuita</strong> para explorar todas las funcionalidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Puedes crear subcuentas de GoHighLevel según tu plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Conecta instancias de WhatsApp para empezar a comunicarte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>No se te cobrará hasta que termine el periodo de prueba</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {sessionId && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-xs text-muted-foreground mb-1">ID de Sesión</p>
              <code className="text-xs font-mono break-all" data-testid="text-session-id">{sessionId}</code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1" 
              size="lg"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-go-dashboard"
            >
              Ir al Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setLocation("/billing")}
              data-testid="button-view-billing"
            >
              Ver Detalles del Plan
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Recibirás un correo de confirmación en los próximos minutos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
