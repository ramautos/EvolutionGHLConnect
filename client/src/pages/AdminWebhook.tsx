import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Webhook } from "lucide-react";

interface WebhookConfig {
  id: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminWebhook() {
  const { user } = useUser();
  const { toast } = useToast();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookActive, setWebhookActive] = useState(false);

  const { data: webhookConfig, isLoading: webhookConfigLoading } = useQuery<WebhookConfig>({
    queryKey: ["/api/admin/webhook-config"],
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (webhookConfig) {
      setWebhookUrl(webhookConfig.webhookUrl);
      setWebhookActive(webhookConfig.isActive);
    }
  }, [webhookConfig]);

  const updateWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/admin/webhook-config", {
        webhookUrl,
        isActive: webhookActive,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "La configuración del webhook se guardó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhook-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Webhook</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona el webhook global para todos los mensajes del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Configuración de Webhook
          </CardTitle>
          <CardDescription>
            Configura la URL de webhook donde se reenviarán los mensajes recibidos de los usuarios.
            Los usuarios no pueden ver esta configuración.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {webhookConfigLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Estado del Webhook */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="font-medium">Estado del Webhook</div>
                  <p className="text-sm text-muted-foreground">
                    {webhookActive ? "El webhook está activo y reenviando mensajes" : "El webhook está desactivado"}
                  </p>
                </div>
                <Switch
                  checked={webhookActive}
                  onCheckedChange={setWebhookActive}
                  data-testid="switch-webhook-active"
                />
              </div>

              {/* URL del Webhook */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL del Webhook</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://tu-servidor.com/webhook/messages"
                  data-testid="input-webhook-url"
                />
                <p className="text-xs text-muted-foreground">
                  Los mensajes se enviarán a esta URL con el siguiente formato:
                </p>
                <div className="rounded-md bg-muted p-4 font-mono text-xs">
                  {`{
  "locationId": "abc123",
  "message": "texto del mensaje",
  "from": "número de teléfono",
  "instanceName": "nombre de la instancia",
  "timestamp": "2025-01-01T00:00:00.000Z"
}`}
                </div>
              </div>

              {/* Información adicional */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
                <h4 className="font-medium mb-2">ℹ️ Información importante</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Los mensajes se reenvían automáticamente cuando se reciben</li>
                  <li>• El endpoint debe responder con código HTTP 200 para confirmar recepción</li>
                  <li>• Los usuarios no tienen visibilidad de esta configuración</li>
                  <li>• Asegúrate de que tu servidor pueda manejar la carga de mensajes</li>
                </ul>
              </div>

              {/* Botón de guardar */}
              <div className="flex justify-end">
                <Button
                  onClick={() => updateWebhookMutation.mutate()}
                  disabled={updateWebhookMutation.isPending || !webhookUrl.trim()}
                  data-testid="button-save-webhook"
                >
                  {updateWebhookMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Configuración"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
