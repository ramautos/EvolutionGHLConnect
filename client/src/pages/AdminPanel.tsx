import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, User as UserIcon, Building2, Activity, MessageSquare, LogOut, Webhook, Trash2, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Subaccount, WhatsappInstance } from "@shared/schema";

interface WebhookConfig {
  id: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookActive, setWebhookActive] = useState(false);
  const [subaccountToDelete, setSubaccountToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: subaccounts = [], isLoading: subaccountsLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/admin/subaccounts"],
    enabled: user?.role === "admin",
  });

  const { data: instances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/admin/instances"],
    enabled: user?.role === "admin",
  });

  const { data: webhookConfig, isLoading: webhookConfigLoading } = useQuery<WebhookConfig>({
    queryKey: ["/api/admin/webhook-config"],
    enabled: user?.role === "admin",
  });

  // Inicializar valores del webhook cuando se carga
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

  const deleteSubaccountMutation = useMutation({
    mutationFn: async (subaccountId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/subaccounts/${subaccountId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subcuenta eliminada",
        description: "La subcuenta ha sido eliminada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subaccounts"] });
      setDeleteDialogOpen(false);
      setSubaccountToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la subcuenta",
        variant: "destructive",
      });
    },
  });

  const updateBillingMutation = useMutation({
    mutationFn: async ({ subaccountId, billingEnabled }: { subaccountId: string; billingEnabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/subaccounts/${subaccountId}/billing`, {
        billingEnabled,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Billing actualizado",
        description: "El estado de billing se actualizó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subaccounts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el billing",
        variant: "destructive",
      });
    },
  });

  const updateActivationMutation = useMutation({
    mutationFn: async ({ subaccountId, manuallyActivated }: { subaccountId: string; manuallyActivated: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/subaccounts/${subaccountId}/activation`, {
        manuallyActivated,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Activación actualizada",
        description: "El estado de activación se actualizó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subaccounts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la activación",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSubaccount = (subaccountId: string) => {
    setSubaccountToDelete(subaccountId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSubaccount = () => {
    if (subaccountToDelete) {
      deleteSubaccountMutation.mutate(subaccountToDelete);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión exitosamente",
        });
        window.location.href = "/login";
      } else {
        throw new Error("Error al cerrar sesión");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      connected: "default",
      qr_generated: "secondary",
      created: "outline",
      disconnected: "destructive",
      error: "destructive",
    };

    const labels: Record<string, string> = {
      connected: "Conectado",
      qr_generated: "QR Generado",
      created: "Creado",
      disconnected: "Desconectado",
      error: "Error",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const connectedInstances = instances.filter(i => i.status === "connected").length;

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No tienes permisos para acceder al panel de administrador.
            </p>
            <Button onClick={() => setLocation("/dashboard")}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subaccountsLoading || instancesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Administrador</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona usuarios, subcuentas e instancias del sistema
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcuentas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subaccounts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {subaccounts.filter(s => s.role === "admin").length} administradores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instancias</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instances.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {connectedInstances} conectadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conexión</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instances.length > 0 ? Math.round((connectedInstances / instances.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subaccounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subaccounts" data-testid="tab-subaccounts">
              <Building2 className="w-4 h-4 mr-2" />
              Subcuentas
            </TabsTrigger>
            <TabsTrigger value="instances" data-testid="tab-instances">
              <MessageSquare className="w-4 h-4 mr-2" />
              Instancias
            </TabsTrigger>
            <TabsTrigger value="webhook" data-testid="tab-webhook">
              <Webhook className="w-4 h-4 mr-2" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">
              <FileText className="w-4 h-4 mr-2" />
              API
            </TabsTrigger>
          </TabsList>

          {/* Subaccounts Tab */}
          <TabsContent value="subaccounts">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Subcuentas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Location ID</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Instancias</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Activada</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subaccounts.map((s) => {
                      const instanceCount = instances.filter(i => i.subaccountId === s.id).length;
                      
                      return (
                        <TableRow key={s.id} data-testid={`row-subaccount-${s.id}`}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell className="font-mono text-xs">{s.locationId}</TableCell>
                          <TableCell>
                            <Badge variant={s.role === "admin" ? "default" : "secondary"}>
                              {s.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{instanceCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={s.billingEnabled}
                                onCheckedChange={(checked) => 
                                  updateBillingMutation.mutate({ 
                                    subaccountId: s.id, 
                                    billingEnabled: checked 
                                  })
                                }
                                data-testid={`switch-billing-${s.id}`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {s.billingEnabled ? "Habilitado" : "Deshabilitado"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={s.manuallyActivated}
                                onCheckedChange={(checked) => 
                                  updateActivationMutation.mutate({ 
                                    subaccountId: s.id, 
                                    manuallyActivated: checked 
                                  })
                                }
                                data-testid={`switch-activation-${s.id}`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {s.manuallyActivated ? "Activa" : "Inactiva"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubaccount(s.id)}
                              disabled={s.id === user?.id}
                              data-testid={`button-delete-subaccount-${s.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instances Tab */}
          <TabsContent value="instances">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Instancias</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Instance Name</TableHead>
                      <TableHead>Subcuenta</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((inst) => {
                      const subaccount = subaccounts.find(s => s.id === inst.subaccountId);
                      
                      return (
                        <TableRow key={inst.id} data-testid={`row-instance-${inst.id}`}>
                          <TableCell className="font-medium">
                            {inst.customName || "Sin nombre"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {inst.evolutionInstanceName}
                          </TableCell>
                          <TableCell>{subaccount?.name || "—"}</TableCell>
                          <TableCell>{subaccount?.email || "—"}</TableCell>
                          <TableCell>{inst.phoneNumber || "—"}</TableCell>
                          <TableCell>{getStatusBadge(inst.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Tab */}
          <TabsContent value="webhook">
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
          </TabsContent>

          {/* API Documentation Tab */}
          <TabsContent value="api">
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

                {/* User Endpoints */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    👥 Usuarios
                  </h3>
                  <div className="space-y-2 pl-4">
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">GET</Badge>
                        <code className="text-sm">/api/admin/users</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Obtener todos los usuarios (solo admin)</p>
                      <div className="bg-muted p-3 rounded text-xs font-mono">
                        Response: User[]
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">DELETE</Badge>
                        <code className="text-sm">/api/admin/users/:id</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Eliminar un usuario (solo admin)</p>
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
                        <code className="text-sm">/api/subaccounts/user/:userId</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Obtener subcuentas de un usuario</p>
                    </div>

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
                        <code className="text-sm">/api/instances/user/:userId</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Obtener todas las instancias de un usuario</p>
                    </div>

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
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la subcuenta
              y todos sus datos asociados (instancias de WhatsApp, suscripciones, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSubaccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteSubaccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
