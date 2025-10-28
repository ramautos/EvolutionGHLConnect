import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Settings, Server, Calendar, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemConfig } from "@shared/schema";

const systemConfigSchema = z.object({
  evolutionApiUrl: z.string().url("URL de Evolution API inválida").optional().or(z.literal("")),
  evolutionApiKey: z.string().optional(),
  systemName: z.string().min(1, "Nombre del sistema es requerido"),
  systemEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  supportEmail: z.string().email("Email de soporte inválido").optional().or(z.literal("")),
  trialDays: z.string(),
  trialEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
});

type SystemConfigForm = z.infer<typeof systemConfigSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"evolution" | "system" | "trial" | "maintenance">("evolution");

  // Cargar configuración actual
  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ["/api/admin/system-config"],
  });

  const form = useForm<SystemConfigForm>({
    resolver: zodResolver(systemConfigSchema),
    values: config ? {
      evolutionApiUrl: config.evolutionApiUrl || "",
      evolutionApiKey: config.evolutionApiKey || "",
      systemName: config.systemName,
      systemEmail: config.systemEmail || "",
      supportEmail: config.supportEmail || "",
      trialDays: config.trialDays,
      trialEnabled: config.trialEnabled,
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage || "",
    } : {
      evolutionApiUrl: "",
      evolutionApiKey: "",
      systemName: "WhatsApp Platform",
      systemEmail: "",
      supportEmail: "",
      trialDays: "15",
      trialEnabled: true,
      maintenanceMode: false,
      maintenanceMessage: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SystemConfigForm) => {
      return apiRequest("/api/admin/system-config", "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se guardaron exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-config"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SystemConfigForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la configuración general de la plataforma
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeSection === "evolution" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSection("evolution")}
          data-testid="tab-evolution"
        >
          <Server className="h-4 w-4 mr-2" />
          Evolution API
        </Button>
        <Button
          variant={activeSection === "system" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSection("system")}
          data-testid="tab-system"
        >
          <Settings className="h-4 w-4 mr-2" />
          Sistema
        </Button>
        <Button
          variant={activeSection === "trial" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSection("trial")}
          data-testid="tab-trial"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Período de Prueba
        </Button>
        <Button
          variant={activeSection === "maintenance" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSection("maintenance")}
          data-testid="tab-maintenance"
        >
          <Shield className="h-4 w-4 mr-2" />
          Mantenimiento
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Evolution API Section */}
        {activeSection === "evolution" && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Evolution API</CardTitle>
              <CardDescription>
                Configura la conexión con Evolution API para gestionar instancias de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evolutionApiUrl">URL de Evolution API</Label>
                <Input
                  id="evolutionApiUrl"
                  placeholder="https://api.evolution.com"
                  {...form.register("evolutionApiUrl")}
                  data-testid="input-evolution-url"
                />
                {form.formState.errors.evolutionApiUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.evolutionApiUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="evolutionApiKey">API Key</Label>
                <Input
                  id="evolutionApiKey"
                  type="password"
                  placeholder="Ingresa tu API Key"
                  {...form.register("evolutionApiKey")}
                  data-testid="input-evolution-key"
                />
                {form.formState.errors.evolutionApiKey && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.evolutionApiKey.message}
                  </p>
                )}
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  La Evolution API se utiliza para crear y gestionar instancias de WhatsApp Business.
                  Asegúrate de tener una instancia de Evolution API corriendo y accesible.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Section */}
        {activeSection === "system" && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Información general y contacto de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">Nombre del Sistema</Label>
                <Input
                  id="systemName"
                  placeholder="WhatsApp Platform"
                  {...form.register("systemName")}
                  data-testid="input-system-name"
                />
                {form.formState.errors.systemName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.systemName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemEmail">Email del Sistema</Label>
                <Input
                  id="systemEmail"
                  type="email"
                  placeholder="sistema@ejemplo.com"
                  {...form.register("systemEmail")}
                  data-testid="input-system-email"
                />
                {form.formState.errors.systemEmail && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.systemEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Email de Soporte</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  placeholder="soporte@ejemplo.com"
                  {...form.register("supportEmail")}
                  data-testid="input-support-email"
                />
                {form.formState.errors.supportEmail && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.supportEmail.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Period Section */}
        {activeSection === "trial" && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Período de Prueba</CardTitle>
              <CardDescription>
                Configura el período de prueba gratuito para nuevas subcuentas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="trialEnabled">Período de Prueba Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir período de prueba gratuito para nuevas subcuentas
                  </p>
                </div>
                <Switch
                  id="trialEnabled"
                  checked={form.watch("trialEnabled")}
                  onCheckedChange={(checked) => form.setValue("trialEnabled", checked)}
                  data-testid="switch-trial-enabled"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDays">Duración del Período de Prueba (días)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="1"
                  max="90"
                  {...form.register("trialDays")}
                  data-testid="input-trial-days"
                />
                {form.formState.errors.trialDays && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.trialDays.message}
                  </p>
                )}
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  El período de prueba comienza automáticamente cuando un usuario se registra.
                  Durante este tiempo, pueden usar todas las funciones sin restricciones.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Mode Section */}
        {activeSection === "maintenance" && (
          <Card>
            <CardHeader>
              <CardTitle>Modo de Mantenimiento</CardTitle>
              <CardDescription>
                Activa el modo de mantenimiento para realizar actualizaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="maintenanceMode">Modo de Mantenimiento</Label>
                  <p className="text-sm text-muted-foreground">
                    Bloquear el acceso temporalmente para mantenimiento
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={form.watch("maintenanceMode")}
                  onCheckedChange={(checked) => form.setValue("maintenanceMode", checked)}
                  data-testid="switch-maintenance-mode"
                />
              </div>

              {form.watch("maintenanceMode") && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Mensaje de Mantenimiento</Label>
                  <Textarea
                    id="maintenanceMessage"
                    placeholder="El sistema está en mantenimiento. Volveremos pronto."
                    {...form.register("maintenanceMessage")}
                    data-testid="textarea-maintenance-message"
                    rows={4}
                  />
                  {form.formState.errors.maintenanceMessage && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.maintenanceMessage.message}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Advertencia:</strong> Activar el modo de mantenimiento bloqueará el acceso a todos los usuarios excepto administradores.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            data-testid="button-save-config"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
