import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, Building2, Activity, MessageSquare, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Subaccount, WhatsappInstance } from "@shared/schema";

export default function AdminPanel() {
  const { user } = useUser();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [subaccountToDelete, setSubaccountToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Get companyId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const companyIdFilter = searchParams.get('companyId');

  const { data: allSubaccounts = [], isLoading: subaccountsLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/admin/subaccounts"],
    enabled: user?.role === "admin",
  });

  const { data: allInstances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/admin/instances"],
    enabled: user?.role === "admin",
  });

  // Filter data by companyId if provided
  const subaccounts = companyIdFilter 
    ? allSubaccounts.filter(s => s.companyId === companyIdFilter)
    : allSubaccounts;
    
  const instances = companyIdFilter
    ? allInstances.filter(i => {
        const subaccount = allSubaccounts.find(s => s.id === i.subaccountId);
        return subaccount?.companyId === companyIdFilter;
      })
    : allInstances;

  const deleteSubaccountMutation = useMutation({
    mutationFn: async (subaccountId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${subaccountId}`);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administrador</h1>
          <p className="text-muted-foreground mt-1">
            {companyIdFilter ? 'Filtrando por empresa seleccionada' : 'Gestiona usuarios, subcuentas e instancias del sistema'}
          </p>
          {companyIdFilter && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation(location.split('?')[0])}
              className="mt-2"
              data-testid="button-clear-filter"
            >
              Ver todas las subcuentas
            </Button>
          )}
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
