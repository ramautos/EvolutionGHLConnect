import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AuthSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Obtener parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get("company_id");
    const locationId = params.get("location_id");

    console.log("✅ OAuth exitoso - Datos recibidos de n8n:", { companyId, locationId });

    // Guardar en localStorage para uso posterior
    if (companyId) {
      localStorage.setItem("ghl_company_id", companyId);
      console.log("💾 Company ID guardado en localStorage:", companyId);
    }

    if (locationId) {
      localStorage.setItem("ghl_location_id", locationId);
      console.log("💾 Location ID guardado en localStorage:", locationId);
    }

    // Redirigir al dashboard de locations
    setTimeout(() => {
      setLocation("/locations");
    }, 500);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-2xl font-bold">Autenticación Exitosa</h2>
        <p className="text-muted-foreground">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  );
}
