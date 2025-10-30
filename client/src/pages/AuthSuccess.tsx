import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function AuthSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Obteniendo información del cliente...");

  // Mutation para crear subcuenta directamente desde la base de datos GHL
  const createSubaccountMutation = useMutation({
    mutationFn: async ({ companyId, locationId }: { companyId: string; locationId: string }) => {
      // 1. Obtener los datos completos del cliente desde la base de datos GHL
      setMessage("Consultando datos del cliente...");
      const clientDataRes = await fetch(`/api/ghl/client-data?company_id=${companyId}&location_id=${locationId}`);
      
      if (!clientDataRes.ok) {
        const error = await clientDataRes.json();
        throw new Error(error.error || "No se pudo obtener la información del cliente");
      }
      
      const clientData = await clientDataRes.json();
      console.log("📋 Client data received:", clientData);

      // 2. Crear la subcuenta con todos los datos
      setMessage("Creando subcuenta...");
      const res = await apiRequest("POST", "/api/webhooks/register-subaccount", {
        email: clientData.email,
        name: clientData.name,
        phone: clientData.phone,
        locationId: clientData.locationId,
        locationName: clientData.locationName,
        ghlCompanyId: clientData.ghlCompanyId,
        companyName: clientData.companyName,
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("✅ Subaccount created:", data);
      setStatus("success");
      setMessage("¡Subcuenta creada exitosamente!");
      
      // Disparar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Redirigir a la página de subcuentas después de 2 segundos
      setTimeout(() => {
        setLocation("/subaccounts");
      }, 2000);
    },
    onError: (error: any) => {
      console.error("❌ Error creating subaccount:", error);
      setStatus("error");
      setMessage(error.message || "Hubo un error al crear la subcuenta");
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        setLocation("/subaccounts");
      }, 3000);
    },
  });

  useEffect(() => {
    // Obtener parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get("company_id");
    const locationId = params.get("location_id");

    console.log("🔵 AuthSuccess received params:", { companyId, locationId });

    if (!companyId || !locationId) {
      setStatus("error");
      setMessage("Faltan parámetros de autenticación (company_id o location_id)");
      setTimeout(() => {
        setLocation("/subaccounts");
      }, 2000);
      return;
    }

    // Crear subcuenta automáticamente
    createSubaccountMutation.mutate({ companyId, locationId });
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
