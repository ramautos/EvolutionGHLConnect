import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddSubaccountModal from "@/components/AddSubaccountModal";
import SellSubaccountModal from "@/components/SellSubaccountModal";
import { PhoneRegistrationDialog } from "@/components/PhoneRegistrationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MessageSquare, Settings, LogOut, User, ChevronDown, CreditCard, Receipt, Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [sellSubaccountOpen, setSellSubaccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Si el usuario es admin o system_admin, redirigir al panel de admin
  useEffect(() => {
    if (user?.role === "admin" || user?.role === "system_admin") {
      setLocation("/admin/dashboard");
    }
  }, [user?.role, setLocation]);

  // No renderizar nada si es admin (evitar loops mientras redirige)
  if (user?.role === "admin" || user?.role === "system_admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirigiendo al panel de administración...</p>
        </div>
      </div>
    );
  }

  // Obtener subcuentas del usuario
  const { data: subaccounts = [], isLoading: subaccountsLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  // OPTIMIZADO: Obtener TODAS las instancias del usuario en UNA SOLA petición
  const { data: instances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/instances/user", user?.id],
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
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

  const handleSellSubaccount = () => {
    setSellSubaccountOpen(true);
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

  // Filtrar subcuentas basándose en la búsqueda
  const filteredSubaccounts = useMemo(() => {
    if (!searchQuery.trim()) return subaccounts;

    const query = searchQuery.toLowerCase().trim();
    return subaccounts.filter(subaccount => {
      const matchesPhone = subaccount.phone?.toLowerCase().includes(query);
      const matchesLocationId = subaccount.locationId?.toLowerCase().includes(query);
      const matchesLocationName = subaccount.locationName?.toLowerCase().includes(query);
      const matchesName = subaccount.name?.toLowerCase().includes(query);
      
      return matchesPhone || matchesLocationId || matchesLocationName || matchesName;
    });
  }, [subaccounts, searchQuery]);

  // Determine if user needs phone registration (only for non-admin roles)
  const needsPhoneRegistration = user && user.role === "user" && !user.phone;

  return (
    <div className="min-h-screen bg-background">
      {/* Phone Registration Dialog - Obligatorio solo para usuarios normales */}
      {needsPhoneRegistration && (
        <PhoneRegistrationDialog isOpen={true} />
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              {user?.name && (
                <p className="text-sm font-medium" data-testid="text-welcome-user">
                  Bienvenido, {user.name}
                </p>
              )}
              {(user as any)?.companyName && (
                <p className="text-xs text-muted-foreground" data-testid="text-company-name">{(user as any).companyName}</p>
              )}
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
            <div className="flex gap-2">
              {(user as any)?.companyManualBilling && (
                <Button
                  onClick={handleSellSubaccount}
                  variant="outline"
                  data-testid="button-sell-subaccount"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vender Subcuenta
                </Button>
              )}
              <Button
                onClick={handleAddSubaccount}
                data-testid="button-add-subaccount"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Subcuenta
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {!subaccountsLoading && subaccounts.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre, teléfono o Location ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-subaccounts"
              />
            </div>
          )}

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
            <Card className="border-2 border-primary/20 max-w-3xl mx-auto">
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Bienvenido a WhatsApp AI</CardTitle>
                <CardDescription className="text-sm">
                  Conecta tus ubicaciones de GoHighLevel para comenzar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                    Instala la app en GoHighLevel
                  </h3>
                  <p className="text-muted-foreground text-xs pl-7">
                    Busca nuestra app en el Marketplace e instala en tus ubicaciones.
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                    Autoriza el acceso
                  </h3>
                  <p className="text-muted-foreground text-xs pl-7">
                    Permite sincronizar tus contactos y gestionar WhatsApp automáticamente.
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                    Tus ubicaciones aparecerán aquí
                  </h3>
                  <p className="text-muted-foreground text-xs pl-7">
                    Accede a todas las funcionalidades con 7 días de prueba gratuita.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-center pt-4 border-t">
                <Button onClick={handleAddSubaccount} size="lg" data-testid="button-add-first-subaccount">
                  <Plus className="w-5 h-5 mr-2" />
                  Conectar con GoHighLevel
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* No Results State (after search) */}
          {!subaccountsLoading && !instancesLoading && subaccounts.length > 0 && filteredSubaccounts.length === 0 && (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>No se encontraron resultados</CardTitle>
                <CardDescription className="max-w-md mx-auto">
                  No hay subcuentas que coincidan con "{searchQuery}". Intenta con otro término de búsqueda.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  Limpiar búsqueda
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Subaccounts Grid */}
          {!subaccountsLoading && !instancesLoading && filteredSubaccounts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubaccounts.map((subaccount) => {
                const status = getConnectionStatus(subaccount.id);
                const subaccountInstances = getInstancesForSubaccount(subaccount.id);

                return (
                  <Card
                    key={subaccount.id}
                    data-testid={`card-subaccount-${subaccount.id}`}
                    className={`hover-elevate ${(subaccount as any).isSold ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{subaccount.locationName || subaccount.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {(subaccount as any).isSold && (
                            <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950">
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Vendida
                            </Badge>
                          )}
                          <Badge variant={status.variant} data-testid={`badge-status-${subaccount.id}`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 mb-3">
                        Location ID: {subaccount.locationId}
                      </CardDescription>
                      
                      {/* Instance Count Display - SIEMPRE visible */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-sm">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{subaccountInstances.length}</span>
                          <span className="text-muted-foreground">
                            {subaccountInstances.length === 1 ? "instancia" : "instancias"}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-1.5 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="font-medium">
                            {subaccountInstances.filter(i => i.status === "connected").length}
                          </span>
                          <span className="text-muted-foreground">
                            {subaccountInstances.filter(i => i.status === "connected").length === 1 ? "conectada" : "conectadas"}
                          </span>
                        </div>
                      </div>
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

      {/* Sell Subaccount Modal */}
      <SellSubaccountModal
        open={sellSubaccountOpen}
        onOpenChange={setSellSubaccountOpen}
      />
    </div>
  );
}
