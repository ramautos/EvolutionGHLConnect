import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, User, Building2, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const { data: instances, isLoading } = useQuery<InstanceWithDetails[]>({
    queryKey: ["/api/admin/instances"],
    enabled: user?.role === "admin",
  });

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
                              data-testid={`button-view-${item.instance.id}`}
                            >
                              Ver Detalles
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
    </div>
  );
}
