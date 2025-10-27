import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  MessageSquare, 
  Plus, 
  QrCode, 
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone
} from "lucide-react";
import type { Subaccount, WhatsappInstance } from "@shared/schema";
import { QRCodeSVG } from "qrcode.react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function SubaccountDetails() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/subaccount/:id");
  const subaccountId = params?.id;

  const [createInstanceOpen, setCreateInstanceOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsappInstance | null>(null);
  const [instanceName, setInstanceName] = useState("");

  // Obtener subcuenta
  const { data: subaccounts = [], isLoading: subaccountLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  const subaccount = subaccounts.find(s => s.id === subaccountId);

  // Obtener instancias
  const { data: instances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/instances/subaccount", subaccountId],
    enabled: !!subaccountId,
  });

  // Mutation para crear instancia
  const createInstanceMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id || !subaccountId || !subaccount?.locationId) {
        throw new Error("Missing required data");
      }

      const res = await apiRequest("POST", "/api/instances", {
        userId: user.id,
        subaccountId,
        locationId: subaccount.locationId,
        customName: name,
        evolutionInstanceName: `wa-${subaccount.locationId}`,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Instancia creada",
        description: "La instancia de WhatsApp ha sido creada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount", subaccountId] });
      setCreateInstanceOpen(false);
      setInstanceName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la instancia",
        variant: "destructive",
      });
    },
  });

  // Mutation para generar QR
  const generateQrMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const res = await apiRequest("POST", `/api/instances/${instanceId}/generate-qr`, {});
      return await res.json();
    },
    onSuccess: (data, instanceId) => {
      // Buscar la instancia y abrir modal QR
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        setSelectedInstance({ ...instance, qrCode: data.qrCode });
        setQrModalOpen(true);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount", subaccountId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el código QR",
        variant: "destructive",
      });
    },
  });

  // Mutation para eliminar instancia
  const deleteInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const res = await apiRequest("DELETE", `/api/instances/${instanceId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Instancia eliminada",
        description: "La instancia ha sido eliminada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount", subaccountId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la instancia",
        variant: "destructive",
      });
    },
  });

  const handleCreateInstance = () => {
    if (!instanceName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la instancia",
        variant: "destructive",
      });
      return;
    }
    createInstanceMutation.mutate(instanceName);
  };

  const handleGenerateQr = (instance: WhatsappInstance) => {
    generateQrMutation.mutate(instance.id);
  };

  const handleDeleteInstance = (instanceId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta instancia?")) {
      deleteInstanceMutation.mutate(instanceId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default";
      case "qr_generated":
        return "secondary";
      case "disconnected":
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="w-4 h-4" />;
      case "qr_generated":
        return <QrCode className="w-4 h-4" />;
      case "disconnected":
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  if (subaccountLoading || instancesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subaccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Subcuenta no encontrada</CardTitle>
            <CardDescription>La subcuenta que buscas no existe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{subaccount.name}</h1>
            <p className="text-xs text-muted-foreground">Gestión de WhatsApp</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8 max-w-4xl">
          {/* Subaccount Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <CardTitle>Información de la Subcuenta</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <p className="text-muted-foreground">{subaccount.name}</p>
                </div>
                <div>
                  <span className="font-medium">Location ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{subaccount.locationId}</p>
                </div>
                {subaccount.city && subaccount.state && (
                  <div>
                    <span className="font-medium">Ubicación:</span>
                    <p className="text-muted-foreground">{subaccount.city}, {subaccount.state}</p>
                  </div>
                )}
                {subaccount.email && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-muted-foreground">{subaccount.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Instances */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Instancias de WhatsApp</h2>
                <p className="text-sm text-muted-foreground">
                  Conecta y gestiona números de WhatsApp para esta ubicación
                </p>
              </div>
              <Button
                onClick={() => setCreateInstanceOpen(true)}
                data-testid="button-add-instance"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Instancia
              </Button>
            </div>

            {instances.length === 0 ? (
              <Card className="text-center py-12">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle>No hay instancias de WhatsApp</CardTitle>
                  <CardDescription>
                    Crea tu primera instancia para conectar WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setCreateInstanceOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Instancia
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {instances.map((instance) => (
                  <Card key={instance.id} data-testid={`card-instance-${instance.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{instance.customName}</CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {instance.evolutionInstanceName}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusColor(instance.status)} className="gap-1">
                          {getStatusIcon(instance.status)}
                          {instance.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {instance.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{instance.phoneNumber}</span>
                        </div>
                      )}

                      {instance.status === "disconnected" && instance.disconnectedAt && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <XCircle className="w-4 h-4" />
                          <span>
                            Desconectado hace {formatDistanceToNow(new Date(instance.disconnectedAt), { 
                              addSuffix: false, 
                              locale: es 
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {instance.status !== "connected" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => handleGenerateQr(instance)}
                            disabled={generateQrMutation.isPending}
                            data-testid={`button-qr-${instance.id}`}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Generar QR
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteInstance(instance.id)}
                          disabled={deleteInstanceMutation.isPending}
                          data-testid={`button-delete-${instance.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Instance Modal */}
      <Dialog open={createInstanceOpen} onOpenChange={setCreateInstanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Instancia de WhatsApp</DialogTitle>
            <DialogDescription>
              Dale un nombre descriptivo a esta instancia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nombre de la Instancia</Label>
              <Input
                id="instance-name"
                placeholder="Ej: WhatsApp Principal"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateInstance()}
                data-testid="input-instance-name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateInstanceOpen(false);
                  setInstanceName("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateInstance}
                disabled={createInstanceMutation.isPending}
                data-testid="button-create-instance"
              >
                {createInstanceMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Crear Instancia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escanea este código QR con tu WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInstance?.qrCode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={selectedInstance.qrCode} size={256} />
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  <p>1. Abre WhatsApp en tu teléfono</p>
                  <p>2. Ve a Configuración → Dispositivos vinculados</p>
                  <p>3. Escanea este código QR</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generando código QR...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
