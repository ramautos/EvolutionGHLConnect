import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings, QrCode, CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QRModal from "@/components/QRModal";

interface GhlLocation {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
}

interface WhatsappInstance {
  id: string;
  locationId?: string;
  instanceName: string;
  evolutionInstanceName: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string;
  connectedAt?: string;
}

export default function LocationsDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('ghl_installed') === 'true') {
      const companyIdFromCallback = params.get('company_id');
      
      if (companyIdFromCallback) {
        localStorage.setItem('ghl_company_id', companyIdFromCallback);
        setCompanyId(companyIdFromCallback);
      }
      
      toast({
        title: "¡Conexión exitosa!",
        description: "Tu cuenta de GoHighLevel está conectada.",
      });
      
      window.history.replaceState({}, '', '/locations');
    } else {
      const savedCompanyId = localStorage.getItem('ghl_company_id');
      setCompanyId(savedCompanyId);
    }
  }, [toast]);

  const { data: locations = [], isLoading: locationsLoading } = useQuery<GhlLocation[]>({
    queryKey: ["/api/ghl/locations", companyId],
    enabled: !!companyId,
  });

  const { data: instances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/instances/user", user?.id],
    enabled: !!user?.id,
  });

  const createInstanceMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const location = locations.find(l => l.id === locationId);
      const instanceName = location?.name || `location-${locationId.slice(0, 8)}`;
      const evolutionName = `wa-${locationId}`;
      
      const res = await apiRequest("POST", "/api/instances", {
        userId: user?.id,
        locationId: locationId,
        instanceName: instanceName,
        evolutionInstanceName: evolutionName,
        subaccountId: null,
        status: "created",
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances/user", user?.id] });
      setSelectedInstance(data.id);
      setQrModalOpen(true);
      toast({
        title: "Instancia creada",
        description: "Escanea el código QR para conectar WhatsApp",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la instancia de WhatsApp",
        variant: "destructive",
      });
    },
  });

  const getInstanceForLocation = (locationId: string) => {
    return instances.find(inst => inst.locationId === locationId);
  };

  const handleActivateWhatsApp = (locationId: string) => {
    const instance = getInstanceForLocation(locationId);
    if (instance) {
      setSelectedInstance(instance.id);
      setQrModalOpen(true);
    } else {
      createInstanceMutation.mutate(locationId);
    }
  };

  const getStatusBadge = (instance?: WhatsappInstance) => {
    if (!instance) {
      return <Badge variant="outline" className="gap-1" data-testid="status-not-connected">
        <XCircle className="w-3 h-3" />
        Sin conectar
      </Badge>;
    }

    if (instance.status === 'connected' && instance.phoneNumber) {
      return <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700" data-testid="status-connected">
        <CheckCircle2 className="w-3 h-3" />
        Conectado
      </Badge>;
    }

    return <Badge variant="secondary" className="gap-1" data-testid="status-pending">
      <Loader2 className="w-3 h-3 animate-spin" />
      Pendiente
    </Badge>;
  };

  if (userLoading || locationsLoading || instancesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando subcuentas...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">Conecta tu Cuenta</h2>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              No has conectado tu cuenta de GoHighLevel
            </p>
            <Button onClick={() => window.location.href = "/onboarding"} data-testid="button-connect-ghl">
              Conectar GoHighLevel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
                WhatsApp AI
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" data-testid="button-settings">
                <Settings className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.name?.[0].toUpperCase() || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 lg:px-12 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-accent)' }}>
            Tus Subcuentas
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona las conexiones de WhatsApp para cada ubicación
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Subcuentas</p>
                  <p className="text-3xl font-bold" data-testid="text-total-locations">{locations.length}</p>
                </div>
                <Building2 className="w-12 h-12 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp Conectados</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-connected-count">
                    {instances.filter(i => i.status === 'connected' && i.phoneNumber).length}
                  </p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600" data-testid="text-pending-count">
                    {locations.length - instances.filter(i => i.status === 'connected' && i.phoneNumber).length}
                  </p>
                </div>
                <QrCode className="w-12 h-12 text-orange-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Subcuentas */}
        {locations.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-xl font-semibold mb-2">No hay subcuentas</h3>
            <p className="text-muted-foreground">
              No se encontraron subcuentas en tu cuenta de GoHighLevel
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {locations.map((location) => {
              const instance = getInstanceForLocation(location.id);
              const isConnected = instance?.status === 'connected' && instance?.phoneNumber;

              return (
                <Card key={location.id} className="hover-elevate" data-testid={`card-location-${location.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate" data-testid={`text-location-name-${location.id}`}>
                          {location.name}
                        </h3>
                        {location.city && location.state && (
                          <p className="text-sm text-muted-foreground truncate">
                            {location.city}, {location.state}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(instance)}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      {location.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">Email:</span>
                          <span className="truncate">{location.email}</span>
                        </div>
                      )}
                      {location.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">Teléfono:</span>
                          <span>{location.phone}</span>
                        </div>
                      )}
                      {instance?.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-green-600">WhatsApp:</span>
                          <span className="text-green-600">{instance.phoneNumber}</span>
                        </div>
                      )}
                      {instance?.connectedAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">Conectado:</span>
                          <span>{new Date(instance.connectedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleActivateWhatsApp(location.id)}
                      disabled={createInstanceMutation.isPending}
                      variant={isConnected ? "outline" : "default"}
                      className="w-full gap-2"
                      data-testid={`button-activate-${location.id}`}
                    >
                      {createInstanceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creando...
                        </>
                      ) : isConnected ? (
                        <>
                          <QrCode className="w-4 h-4" />
                          Ver QR
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          Conectar WhatsApp
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        instanceId={selectedInstance}
      />
    </div>
  );
}
