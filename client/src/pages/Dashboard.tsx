import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddSubaccountModal from "@/components/AddSubaccountModal";
import { PhoneRegistrationDialog } from "@/components/PhoneRegistrationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MessageSquare, Settings, LogOut, User, ChevronDown, CreditCard, Receipt } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Subaccount, WhatsappInstance } from "@shared/schema";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [addSubaccountOpen, setAddSubaccountOpen] = useState(false);

  // Si el usuario es admin, redirigir al panel de admin
  useEffect(() => {
    if (user?.role === "admin") {
      setLocation("/admin");
    }
  }, [user?.role, setLocation]);

  // Obtener subcuentas del usuario
  const { data: subaccounts = [], isLoading: subaccountsLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id && user?.role !== "admin",
  });

  // Obtener todas las instancias del usuario
  const { data: instances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/instances/user", user?.id],
    enabled: !!user?.id && user?.role !== "admin",
  });

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
        // Redirect a login
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

  const handleAddSubaccount = () => {
    setAddSubaccountOpen(true);
  };

  const handleSubaccountSuccess = () => {
    // Recargar subcuentas
    queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user", user?.id] });
  };

  const getInstancesForSubaccount = (subaccountId: string) => {
    return instances.filter(inst => inst.subaccountId === subaccountId);
  };

  const getConnectionStatus = (subaccountId: string) => {
    const subaccountInstances = getInstancesForSubaccount(subaccountId);
    if (subaccountInstances.length === 0) return { label: "Sin WhatsApp", variant: "secondary" as const };
    
    const connectedCount = subaccountInstances.filter(inst => inst.status === "connected").length;
    if (connectedCount === 0) return { label: "Desconectado", variant: "destructive" as const };
    if (connectedCount === subaccountInstances.length) return { label: `${connectedCount} conectado${connectedCount > 1 ? 's' : ''}`, variant: "default" as const };
    return { label: `${connectedCount}/${subaccountInstances.length} conectados`, variant: "secondary" as const };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Phone Registration Dialog - Obligatorio */}
      <PhoneRegistrationDialog isOpen={!user?.phone} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">WhatsApp AI Platform</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-account-menu">
                  <User className="w-4 h-4 mr-2" />
                  Mi Cuenta
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/billing")} data-testid="menu-billing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Planes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/invoices")} data-testid="menu-invoices">
                  <Receipt className="w-4 h-4 mr-2" />
                  Facturas
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")} data-testid="menu-admin">
                    <Settings className="w-4 h-4 mr-2" />
                    Panel de Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Mis Subcuentas</h2>
              <p className="text-muted-foreground">
                Gestiona tus ubicaciones de GoHighLevel y sus conexiones de WhatsApp
              </p>
            </div>
            <Button
              onClick={handleAddSubaccount}
              data-testid="button-add-subaccount"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Subcuenta
            </Button>
          </div>

          {/* Loading State */}
          {(subaccountsLoading || instancesLoading) && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!subaccountsLoading && !instancesLoading && subaccounts.length === 0 && (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>No tienes subcuentas</CardTitle>
                <CardDescription className="max-w-md mx-auto">
                  Comienza agregando tu primera ubicación de GoHighLevel para conectar WhatsApp
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button onClick={handleAddSubaccount} data-testid="button-add-first-subaccount">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primera Subcuenta
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Subaccounts Grid */}
          {!subaccountsLoading && !instancesLoading && subaccounts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subaccounts.map((subaccount) => {
                const status = getConnectionStatus(subaccount.id);
                const subaccountInstances = getInstancesForSubaccount(subaccount.id);

                return (
                  <Card key={subaccount.id} data-testid={`card-subaccount-${subaccount.id}`} className="hover-elevate">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{subaccount.name}</CardTitle>
                        </div>
                        <Badge variant={status.variant} data-testid={`badge-status-${subaccount.id}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        Location ID: {subaccount.locationId}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {subaccount.city && subaccount.state && (
                        <div className="text-sm text-muted-foreground">
                          📍 {subaccount.city}, {subaccount.state}
                        </div>
                      )}

                      {subaccountInstances.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Instancias WhatsApp:</p>
                          <div className="space-y-1">
                            {subaccountInstances.map((instance) => (
                              <div
                                key={instance.id}
                                className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                                data-testid={`instance-${instance.id}`}
                              >
                                <span className="font-medium truncate">
                                  {instance.customName || instance.evolutionInstanceName}
                                </span>
                                <Badge
                                  variant={instance.status === "connected" ? "default" : "secondary"}
                                  className="ml-2"
                                >
                                  {instance.status === "connected" ? "●" : "○"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/subaccount/${subaccount.id}`)}
                        data-testid={`button-manage-${subaccount.id}`}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Gestionar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/subaccount/${subaccount.id}`)}
                        data-testid={`button-whatsapp-${subaccount.id}`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Subaccount Modal */}
      <AddSubaccountModal
        open={addSubaccountOpen}
        onClose={() => setAddSubaccountOpen(false)}
        onSuccess={handleSubaccountSuccess}
      />
    </div>
  );
}
