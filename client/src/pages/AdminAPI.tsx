import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminAPI() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentación de API</h1>
        <p className="text-muted-foreground mt-1">
          Endpoints disponibles para integración con el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentación de API</CardTitle>
          <CardDescription>
            Endpoints disponibles para consultar información del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Endpoints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔐 Autenticación
            </h3>
            <div className="space-y-2 pl-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/auth/login</code>
                </div>
                <p className="text-sm text-muted-foreground">Iniciar sesión con email y contraseña</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ email: string, password: string }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/auth/logout</code>
                </div>
                <p className="text-sm text-muted-foreground">Cerrar sesión</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/auth/me</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener información del usuario actual</p>
              </div>
            </div>
          </div>

          {/* Subaccounts Endpoints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🏢 Subcuentas
            </h3>
            <div className="space-y-2 pl-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/admin/subaccounts</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener todas las subcuentas (solo admin)</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/subaccounts/:id</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener una subcuenta por ID</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PATCH</Badge>
                  <code className="text-sm">/api/admin/subaccounts/:id/billing</code>
                </div>
                <p className="text-sm text-muted-foreground">Activar/desactivar billing de subcuenta (solo admin)</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ billingEnabled: boolean }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PATCH</Badge>
                  <code className="text-sm">/api/admin/subaccounts/:id/activation</code>
                </div>
                <p className="text-sm text-muted-foreground">Activar/desactivar subcuenta manualmente (solo admin)</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ manuallyActivated: boolean }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PATCH</Badge>
                  <code className="text-sm">/api/subaccounts/:locationId/crm-settings</code>
                </div>
                <p className="text-sm text-muted-foreground">Actualizar Calendar ID y OpenAI API Key</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ openaiApiKey?: string, calendarId?: string }"}
                </div>
              </div>
            </div>
          </div>

          {/* Instances Endpoints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              💬 Instancias de WhatsApp
            </h3>
            <div className="space-y-2 pl-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/instances/subaccount/:subaccountId</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener instancias de una subcuenta</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/admin/instances</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener todas las instancias del sistema (solo admin)</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/instances</code>
                </div>
                <p className="text-sm text-muted-foreground">Crear nueva instancia de WhatsApp</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ subaccountId: string, customName?: string }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">DELETE</Badge>
                  <code className="text-sm">/api/instances/:id</code>
                </div>
                <p className="text-sm text-muted-foreground">Eliminar una instancia</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/instances/:id/send-message</code>
                </div>
                <p className="text-sm text-muted-foreground">Enviar mensaje de WhatsApp (para n8n)</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ number: string, text: string }"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Nota: La instancia debe estar conectada. El número puede incluir código de país.
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Endpoints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              💳 Suscripciones y Facturación
            </h3>
            <div className="space-y-2 pl-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/subaccounts/:subaccountId/subscription</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener información de suscripción y trial</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Response: {"{ plan, inTrial, trialEndsAt, basePrice, includedInstances, extraSlots }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PATCH</Badge>
                  <code className="text-sm">/api/subaccounts/:subaccountId/subscription</code>
                </div>
                <p className="text-sm text-muted-foreground">Cambiar plan de suscripción</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ plan: 'starter' | 'basic' | 'pro' }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/subaccounts/:subaccountId/invoices</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener facturas de una subcuenta</p>
              </div>
            </div>
          </div>

          {/* Webhook Endpoints */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔗 Webhook
            </h3>
            <div className="space-y-2 pl-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">GET</Badge>
                  <code className="text-sm">/api/admin/webhook-config</code>
                </div>
                <p className="text-sm text-muted-foreground">Obtener configuración del webhook (solo admin)</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">PATCH</Badge>
                  <code className="text-sm">/api/admin/webhook-config</code>
                </div>
                <p className="text-sm text-muted-foreground">Actualizar configuración del webhook (solo admin)</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ webhookUrl: string, isActive: boolean }"}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/api/webhook/message</code>
                </div>
                <p className="text-sm text-muted-foreground">Recibir mensajes (endpoint público)</p>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  Body: {"{ locationId, message, from, instanceName, timestamp }"}
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              ⚠️ Notas Importantes
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              <li>Todos los endpoints requieren autenticación excepto los marcados como públicos</li>
              <li>Los endpoints marcados como "solo admin" requieren que el usuario tenga role="admin"</li>
              <li>Las respuestas incluyen códigos HTTP estándar (200, 400, 401, 403, 500)</li>
              <li>Los trial duran 15 días con instancias ilimitadas</li>
              <li>Planes disponibles: starter ($10), basic ($19), pro ($29) + $5 por instancia adicional</li>
            </ul>
          </div>

          {/* n8n Integration Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              🔗 Integración con n8n
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Flujo completo de mensajería:</p>
              <div className="space-y-1 pl-4">
                <p>1. <strong>Recibir mensajes:</strong> WhatsApp → Evolution API → <code className="bg-muted px-1">/api/webhook/message</code> → n8n</p>
                <p>2. <strong>Enviar mensajes:</strong> n8n → <code className="bg-muted px-1">/api/instances/:id/send-message</code> → Evolution API → WhatsApp</p>
              </div>
              <p className="mt-2">
                <strong>Configuración automática:</strong> Cada instancia se configura automáticamente con el webhook de Evolution API.
                No requiere configuración manual.
              </p>
              <p>
                <strong>Formato del webhook:</strong> Los mensajes recibidos incluyen <code className="bg-muted px-1">locationId</code> para enrutamiento en n8n.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
