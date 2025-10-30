import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function AuthSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success">("loading");
  const [message, setMessage] = useState("Procesando autenticación con GoHighLevel...");

  useEffect(() => {
    // Obtener parámetros de la URL (solo para logging - el backend de n8n maneja la creación)
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get("company_id");
    const locationId = params.get("location_id");

    console.log("🔵 OAuth Success - params received:", { companyId, locationId });
    console.log("⚠️  Note: Subaccount creation is handled by n8n backend webhook");

    // Simular éxito (el backend ya está procesando la creación)
    setTimeout(() => {
      setStatus("success");
      setMessage("La subcuenta está siendo configurada. Por favor espera unos segundos...");
      
      // Disparar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    }, 1000);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          {status === "loading" && (
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          )}
          {status === "success" && (
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {status === "loading" && "Configurando tu cuenta"}
            {status === "success" && "¡Todo listo!"}
          </h2>
          <p className="text-muted-foreground">{message}</p>
        </div>

        {/* Progress Indicator */}
        {status === "loading" && (
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
