import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ClaimSubaccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const claimSubaccount = async () => {
      try {
        // Obtener locationId de la URL
        const params = new URLSearchParams(window.location.search);
        const locationId = params.get("locationId");

        if (!locationId) {
          setStatus("error");
          setMessage("No se proporcionó un ID de subcuenta válido");
          return;
        }

        console.log(`🔄 Reclamando subcuenta para location: ${locationId}`);

        // Llamar al endpoint de claim
        const response = await fetch("/api/subaccounts/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ locationId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al reclamar la subcuenta");
        }

        console.log("✅ Subcuenta reclamada exitosamente:", data);
        setStatus("success");
        setMessage("Tu subcuenta ha sido vinculada exitosamente a tu cuenta");

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          setLocation("/dashboard");
        }, 2000);
      } catch (error: any) {
        console.error("Error claiming subaccount:", error);
        setStatus("error");
        setMessage(error.message || "Ocurrió un error al vincular la subcuenta");
        
        toast({
          title: "Error",
          description: error.message || "No se pudo vincular la subcuenta a tu cuenta",
          variant: "destructive",
        });
      }
    };

    claimSubaccount();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Vinculando Subcuenta
                </h2>
                <p className="text-muted-foreground">
                  Estamos asociando la subcuenta a tu cuenta...
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-500">
                  ¡Listo!
                </h2>
                <p className="text-muted-foreground">
                  {message}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirigiendo al dashboard...
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-destructive/80 to-destructive flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-destructive">
                  Error
                </h2>
                <p className="text-muted-foreground">
                  {message}
                </p>
              </div>
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                data-testid="button-go-dashboard"
              >
                Ir al Dashboard
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
