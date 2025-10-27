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
import { Loader2, User as UserIcon, Building2, Activity, MessageSquare, ArrowLeft, Webhook, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@shared/schema";

interface Subaccount {
  id: string;
  userId: string;
  locationId: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  openaiApiKey: string | null;
}

interface WhatsappInstance {
  id: string;
  userId: string;
  subaccountId: string;
  locationId: string;
  evolutionInstanceName: string;
  customName: string | null;
  phoneNumber: string | null;
  status: string;
}

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
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
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

  if (usersLoading || subaccountsLoading || instancesLoading) {
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
          <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {users.filter(u => u.role === "admin").length} administradores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcuentas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subaccounts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {subaccounts.filter(s => s.openaiApiKey).length} con OpenAI configurado
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
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              <UserIcon className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
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
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Subcuentas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phoneNumber || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {subaccounts.filter(s => s.userId === u.id).length}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user?.id}
                            data-testid={`button-delete-user-${u.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

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
                      <TableHead>Location ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>OpenAI</TableHead>
                      <TableHead>Instancias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subaccounts.map((s) => {
                      const owner = users.find(u => u.id === s.userId);
                      const instanceCount = instances.filter(i => i.subaccountId === s.id).length;
                      
                      return (
                        <TableRow key={s.id} data-testid={`row-subaccount-${s.id}`}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="font-mono text-xs">{s.locationId}</TableCell>
                          <TableCell>{owner?.name || "—"}</TableCell>
                          <TableCell>{s.email || "—"}</TableCell>
                          <TableCell>
                            {s.city && s.state ? `${s.city}, ${s.state}` : "—"}
                          </TableCell>
                          <TableCell>
                            {s.openaiApiKey ? (
                              <Badge variant="default">Configurado</Badge>
                            ) : (
                              <Badge variant="outline">No configurado</Badge>
                            )}
                          </TableCell>
                          <TableCell>{instanceCount}</TableCell>
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
                      <TableHead>Usuario</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((inst) => {
                      const subaccount = subaccounts.find(s => s.id === inst.subaccountId);
                      const owner = users.find(u => u.id === inst.userId);
                      
                      return (
                        <TableRow key={inst.id} data-testid={`row-instance-${inst.id}`}>
                          <TableCell className="font-medium">
                            {inst.customName || "Sin nombre"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {inst.evolutionInstanceName}
                          </TableCell>
                          <TableCell>{subaccount?.name || "—"}</TableCell>
                          <TableCell>{owner?.name || "—"}</TableCell>
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
        </Tabs>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
              y todos sus datos asociados (subcuentas, instancias de WhatsApp, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? (
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
