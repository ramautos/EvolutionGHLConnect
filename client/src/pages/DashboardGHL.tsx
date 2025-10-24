import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Sparkles, Settings, Building2, QrCode, Smartphone } from "lucide-react";
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
}

interface WhatsappInstance {
  id: string;
  locationId?: string;
  instanceName: string;
  evolutionInstanceName: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string;
}

export default function DashboardGHL() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Detectar si viene del OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('ghl_installed') === 'true') {
      const companyIdFromCallback = params.get('company_id');
      
      if (companyIdFromCallback) {
        // Guardar companyId del OAuth en localStorage
        localStorage.setItem('ghl_company_id', companyIdFromCallback);
        setCompanyId(companyIdFromCallback);
      }
      
      toast({
        title: "¡Conexión exitosa!",
        description: "Tu cuenta de GoHighLevel está conectada.",
      });
      
      // Limpiar URL
      window.history.replaceState({}, '', '/dashboard');
    } else {
      // Cargar companyId guardado de localStorage
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
        description: "Ahora puedes generar el código QR",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la instancia",
        variant: "destructive",
      });
    },
  });

  const getInstanceForLocation = (locationId: string) => {
    return instances.find(inst => inst.locationId === locationId);
  };

  const handleGenerateQR = (locationId: string) => {
    const instance = getInstanceForLocation(locationId);
    if (instance) {
      setSelectedInstance(instance.id);
      setQrModalOpen(true);
    } else {
      createInstanceMutation.mutate(locationId);
    }
  };

  if (userLoading || locationsLoading || instancesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">
            No has conectado tu cuenta de GoHighLevel
          </p>
          <Button onClick={() => window.location.href = "/onboarding"}>
            Conectar GoHighLevel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/30 backdrop-blur-lg">
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

      <div className="container mx-auto px-6 lg:px-12 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-accent)' }}>
                Locations de GoHighLevel
              </h1>
              <p className="text-muted-foreground">
                Genera códigos QR de WhatsApp para tus subcuentas
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Tus Locations</h2>
          {locations.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No se encontraron locations en tu cuenta de GoHighLevel
              </p>
              <p className="text-sm text-muted-foreground">
                Asegúrate de haber instalado la aplicación en tus subcuentas
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => {
                const instance = getInstanceForLocation(location.id);
                const hasInstance = !!instance;
                const isConnected = instance?.status === "connected";
                
                return (
                  <Card key={location.id} className="p-6 border-card-border hover-elevate" data-testid={`location-card-${location.id}`}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg" data-testid="location-name">{location.name}</h3>
                            {(location.city || location.state) && (
                              <div className="text-sm text-muted-foreground">
                                {[location.city, location.state].filter(Boolean).join(", ")}
                              </div>
                            )}
                            {hasInstance && instance.phoneNumber && (
                              <div className="text-sm text-primary mt-1" data-testid="instance-phone">
                                <Smartphone className="w-3 h-3 inline mr-1" />
                                {instance.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full gap-2"
                        variant={isConnected ? "outline" : "default"}
                        onClick={() => handleGenerateQR(location.id)}
                        disabled={createInstanceMutation.isPending}
                        data-testid={`button-generate-qr-${location.id}`}
                      >
                        <QrCode className="w-4 h-4" />
                        {isConnected ? "Ver QR" : hasInstance ? "Generar QR" : "Activar WhatsApp"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        instanceId={selectedInstance}
      />
    </div>
  );
}
