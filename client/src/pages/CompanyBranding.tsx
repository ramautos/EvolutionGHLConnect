import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Palette, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogoUpload } from "@/components/LogoUpload";
import { useUser } from "@/contexts/UserContext";

interface BrandingData {
  brandingEnabled: boolean;
  logo: string | null;
  brandingText: string | null;
  companyName: string;
}

export default function CompanyBranding() {
  const { toast } = useToast();
  const { user } = useUser();
  const [logo, setLogo] = useState<string | null>(null);
  const [brandingText, setBrandingText] = useState("");
  const [brandingEnabled, setBrandingEnabled] = useState(false);

  const companyId = user?.companyId;

  // Cargar branding actual
  const { data: branding, isLoading } = useQuery<BrandingData>({
    queryKey: ["/api/branding/current"],
    enabled: !!companyId,
  });

  // Sincronizar estado local con datos del servidor
  useEffect(() => {
    if (branding) {
      setLogo(branding.logo);
      setBrandingText(branding.brandingText || "");
      setBrandingEnabled(branding.brandingEnabled);
    }
  }, [branding]);

  const updateMutation = useMutation({
    mutationFn: async (data: { logo?: string | null; brandingText?: string; brandingEnabled?: boolean }) => {
      return apiRequest("PUT", `/api/companies/${companyId}/branding`, data);
    },
    onSuccess: () => {
      toast({
        title: "Marca actualizada",
        description: "Los cambios se guardaron exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/branding/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la marca",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      logo,
      brandingText,
      brandingEnabled,
    });
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No tienes una empresa asociada para configurar la marca.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Personalización de Marca</h1>
          <p className="text-muted-foreground">
            Configura el logo y nombre que verán tus subcuentas
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              Personaliza cómo se ve tu marca en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo de tu empresa</Label>
              <LogoUpload
                value={logo}
                onChange={setLogo}
                maxSizeKB={500}
              />
            </div>

            {/* Texto de marca */}
            <div className="space-y-2">
              <Label htmlFor="brandingText">Nombre de marca</Label>
              <Input
                id="brandingText"
                value={brandingText}
                onChange={(e) => setBrandingText(e.target.value)}
                placeholder={branding?.companyName || "Mi Agencia"}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {brandingText.length}/50 caracteres
              </p>
            </div>

            {/* Toggle activar */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="brandingEnabled">Activar marca personalizada</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar tu logo y nombre en lugar del predeterminado
                </p>
              </div>
              <Switch
                id="brandingEnabled"
                checked={brandingEnabled}
                onCheckedChange={setBrandingEnabled}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista previa
            </CardTitle>
            <CardDescription>
              Así se verá tu marca en la barra lateral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-sidebar p-4">
              <div className="flex items-center gap-3">
                {brandingEnabled && logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-10 w-10 rounded-lg object-contain bg-white p-1"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">W</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sidebar-foreground">
                    {brandingEnabled && brandingText
                      ? brandingText
                      : branding?.companyName || "WhatsApp Platform"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60">
                    Panel de administración
                  </p>
                </div>
              </div>
            </div>

            {!brandingEnabled && (
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Activa la marca personalizada para ver tu logo aquí
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
