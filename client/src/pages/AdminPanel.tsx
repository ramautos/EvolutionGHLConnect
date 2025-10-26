import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, User, Building2, Activity, Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface InstanceWithDetails {
  instance: {
    id: string;
    subaccountId: string;
    evolutionInstanceName: string;
    customName: string | null;
    phoneNumber: string | null;
    status: string;
    qrCode: string | null;
    createdAt: string;
    updatedAt: string;
  };
  subaccount: {
    id: string;
    userId: string;
    locationId: string;
    companyId: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminPanel() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedInstance, setSelectedInstance] = useState<InstanceWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<InstanceWithDetails | null>(null);

  const { data: instances, isLoading } = useQuery<InstanceWithDetails[]>({
    queryKey: ["/api/admin/instances"],
    enabled: user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      return await apiRequest(`/api/admin/instances/${instanceId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instances"] });
      toast({
        title: "Instancia eliminada",
        description: "La instancia de WhatsApp se eliminó correctamente",
      });
      setShowDeleteDialog(false);
      setInstanceToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la instancia",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (instance: InstanceWithDetails) => {
    setSelectedInstance(instance);
    setShowDetailsDialog(true);
  };

  const handleDeleteClick = (instance: InstanceWithDetails) => {
    setInstanceToDelete(instance);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (instanceToDelete) {
      deleteMutation.mutate(instanceToDelete.instance.id);
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

  if (isLoading) {
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
              Gestiona todas las instancias de WhatsApp del sistema
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instancias</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instances?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instances?.filter(i => i.instance.status === "connected").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(instances?.map(i => i.user?.id).filter(Boolean)).size || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subcuentas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(instances?.map(i => i.subaccount?.id).filter(Boolean)).size || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instances Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Instancias de WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            {!instances || instances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay instancias de WhatsApp en el sistema
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Subcuenta</TableHead>
                      <TableHead>Nombre Instancia</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((item) => (
                      <TableRow key={item.instance.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.user?.name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.user?.email || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.subaccount?.name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.subaccount?.locationId || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.instance.customName || item.instance.evolutionInstanceName}
                            </span>
                            {item.instance.customName && (
                              <span className="text-xs text-muted-foreground">
                                {item.instance.evolutionInstanceName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.instance.phoneNumber || (
                            <span className="text-muted-foreground">No conectado</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.instance.status)}</TableCell>
                        <TableCell>
                          {new Date(item.instance.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                              data-testid={`button-view-${item.instance.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              data-testid={`button-delete-${item.instance.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Instancia</DialogTitle>
            <DialogDescription>
              Información completa de la instancia de WhatsApp
            </DialogDescription>
          </DialogHeader>
          {selectedInstance && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Información de Usuario</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedInstance.user?.name || "N/A"}</p>
                    <p><span className="font-medium">Email:</span> {selectedInstance.user?.email || "N/A"}</p>
                    <p><span className="font-medium">Rol:</span> {selectedInstance.user?.role || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Información de Subcuenta</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedInstance.subaccount?.name || "N/A"}</p>
                    <p><span className="font-medium">Location ID:</span> {selectedInstance.subaccount?.locationId || "N/A"}</p>
                    <p><span className="font-medium">Company ID:</span> {selectedInstance.subaccount?.companyId || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Información de Instancia</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">ID:</span> {selectedInstance.instance.id}</p>
                  <p><span className="font-medium">Nombre Evolution:</span> {selectedInstance.instance.evolutionInstanceName}</p>
                  <p><span className="font-medium">Nombre Personalizado:</span> {selectedInstance.instance.customName || "N/A"}</p>
                  <p><span className="font-medium">Número:</span> {selectedInstance.instance.phoneNumber || "No conectado"}</p>
                  <div><span className="font-medium">Estado:</span> {getStatusBadge(selectedInstance.instance.status)}</div>
                  <p><span className="font-medium">Creado:</span> {new Date(selectedInstance.instance.createdAt).toLocaleString("es-ES")}</p>
                  <p><span className="font-medium">Actualizado:</span> {new Date(selectedInstance.instance.updatedAt).toLocaleString("es-ES")}</p>
                  {selectedInstance.instance.connectedAt && (
                    <p><span className="font-medium">Conectado:</span> {new Date(selectedInstance.instance.connectedAt).toLocaleString("es-ES")}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la instancia{" "}
              <span className="font-semibold">
                {instanceToDelete?.instance.customName || instanceToDelete?.instance.evolutionInstanceName}
              </span>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
