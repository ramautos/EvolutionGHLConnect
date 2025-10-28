import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function AuthSuccess() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Procesando autenticación...");

  // Mutation para crear subcuenta
  const createSubaccountMutation = useMutation({
    mutationFn: async ({ ghlCompanyId, locationId }: { ghlCompanyId: string; locationId: string }) => {
      const res = await apiRequest("POST", "/api/subaccounts/from-ghl", {
        companyId: user?.companyId,
        ghlCompanyId,
        locationId,
      });
      return await res.json();
    },
    onSuccess: () => {
      setStatus("success");
      setMessage("¡Subcuenta agregada exitosamente!");
      
      // Disparar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Marcar como exitoso en localStorage para que el modal lo detecte
      localStorage.setItem("ghl_oauth_success", "true");

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      setStatus("error");
      setMessage(error.message || "Hubo un error al crear la subcuenta");
      
      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
    },
  });

  useEffect(() => {
    // Esperar a que el usuario esté cargado
    if (!user) {
      setMessage("Esperando autenticación...");
      return;
    }

    // Obtener parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const ghlCompanyId = params.get("company_id");
    const locationId = params.get("location_id");

    console.log("✅ OAuth exitoso - Datos recibidos de n8n:", { ghlCompanyId, locationId, userCompanyId: user.companyId });

    if (!ghlCompanyId || !locationId) {
      setStatus("error");
      setMessage("Faltan parámetros de autenticación");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
      return;
    }

    if (!user.companyId) {
      setStatus("error");
      setMessage("Tu usuario no tiene una empresa asignada. Contacta al administrador.");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
      return;
    }

    // Guardar en localStorage para referencia
    localStorage.setItem("ghl_company_id", ghlCompanyId);
    localStorage.setItem("ghl_location_id", locationId);
    console.log("💾 IDs guardados en localStorage:", { ghlCompanyId, locationId });

    // Crear subcuenta
    setMessage("Creando subcuenta...");
    createSubaccountMutation.mutate({ ghlCompanyId, locationId });
  }, [user, setLocation]);

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
          {status === "error" && (
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {status === "loading" && "Configurando tu cuenta"}
            {status === "success" && "¡Todo listo!"}
            {status === "error" && "Algo salió mal"}
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
