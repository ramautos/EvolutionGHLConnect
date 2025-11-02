import { useState, useEffect } from "react";
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
  Phone,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Edit2,
  AlertCircle,
  Check,
  CreditCard,
  Zap
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
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsappInstance | null>(null);
  const [instanceName, setInstanceName] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Obtener subcuenta
  const { data: subaccounts = [], isLoading: subaccountLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  const subaccount = subaccounts.find(s => s.id === subaccountId);

  // No inicializar API keys por seguridad - los inputs son write-only

  // Obtener instancias
  const { data: instances = [], isLoading: instancesLoading } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/instances/subaccount", subaccountId],
    enabled: !!subaccountId,
  });

  // Obtener subscription (plan y trial info)
  const { data: subscription } = useQuery<any>({
    queryKey: ["/api/subaccounts", subaccountId, "subscription"],
    enabled: !!subaccountId,
  });

  // Mutation para crear instancia
  const createInstanceMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) {
        throw new Error("Usuario no encontrado");
      }
      if (!subaccountId) {
        throw new Error("Subaccount ID no encontrado");
      }
      if (!subaccount?.locationId) {
        throw new Error("Location ID no encontrado");
      }

      console.log("Creating instance with data:", {
        userId: user.id,
        subaccountId,
        locationId: subaccount.locationId,
        customName: name,
      });

      const res = await apiRequest("POST", "/api/instances", {
        userId: user.id,
        subaccountId,
        locationId: subaccount.locationId,
        customName: name,
        evolutionInstanceName: `wa-${subaccount.locationId}`,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create instance");
      }
      
      return await res.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Instancia creada",
        description: "Generando código QR...",
      });
      
      // Cerrar el diálogo de creación
      setCreateInstanceOpen(false);
      setInstanceName("");
      
      // Invalidar queries para refrescar la lista
      await queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount", subaccountId] });
      
      // Generar automáticamente el código QR para la nueva instancia
      if (data.whatsappInstance?.id) {
        try {
          const qrRes = await apiRequest("POST", `/api/instances/${data.whatsappInstance.id}/generate-qr`, {});
          const qrData = await qrRes.json();
          
          // Mostrar el modal con el código QR
          setSelectedInstance({ 
            ...data.whatsappInstance, 
            qrCode: qrData.qrCode 
          });
          setQrModalOpen(true);
          
          toast({
            title: "¡Listo para escanear!",
            description: "Escanea el código QR con WhatsApp para conectar tu cuenta",
          });
        } catch (error) {
          console.error("Error generating QR after instance creation:", error);
          toast({
            title: "Instancia creada",
            description: "Haz clic en 'Generar QR' para conectar WhatsApp",
            variant: "default",
          });
        }
      }
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

  // Mutation para sincronizar instancia
  const syncInstanceMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const res = await apiRequest("POST", `/api/instances/${instanceId}/sync`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      const message = data.phoneNumber
        ? `Sincronizada. Número: ${data.phoneNumber}`
        : data.message || "Instancia sincronizada";

      toast({
        title: "Sincronización completada",
        description: message,
        variant: data.status === "not_found_in_evolution" ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount", subaccountId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudo sincronizar la instancia",
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar nombre de instancia
  const updateInstanceNameMutation = useMutation({
    mutationFn: async ({ instanceId, newName }: { instanceId: string; newName: string }) => {
      const res = await apiRequest("PATCH", `/api/instances/${instanceId}`, {
        customName: newName,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update instance name");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Nombre actualizado",
        description: "El nombre de la instancia se actualizó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instances/subaccount", subaccountId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el nombre",
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar API Settings (ElevenLabs y Gemini)
  const updateApiSettingsMutation = useMutation({
    mutationFn: async ({ elevenLabsKey, geminiKey }: { elevenLabsKey?: string; geminiKey?: string }) => {
      if (!subaccount?.locationId) {
        throw new Error("Location ID no encontrado");
      }
      
      const updates: any = {};
      
      // Solo incluir las keys que se proporcionaron (no vacías)
      if (elevenLabsKey && elevenLabsKey.trim()) {
        updates.elevenLabsApiKey = elevenLabsKey.trim();
      }
      
      if (geminiKey && geminiKey.trim()) {
        updates.geminiApiKey = geminiKey.trim();
      }
      
      if (Object.keys(updates).length === 0) {
        throw new Error("Por favor proporciona al menos una API key para actualizar");
      }
      
      const res = await apiRequest("PATCH", `/api/subaccounts/${subaccount.locationId}/api-settings`, updates);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update API settings");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Las API keys se guardaron exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user", user?.id] });
      setApiSettingsOpen(false);
      // Limpiar los campos después de guardar
      setElevenLabsApiKey("");
      setGeminiApiKey("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
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

  const handleSyncInstance = (instanceId: string) => {
    syncInstanceMutation.mutate(instanceId);
  };

  const handleUpdateInstanceName = (instanceId: string, newName: string) => {
    updateInstanceNameMutation.mutate({ instanceId, newName });
  };

  const handleSaveApiSettings = () => {
    updateApiSettingsMutation.mutate({
      elevenLabsKey: elevenLabsApiKey,
      geminiKey: geminiApiKey,
    });
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.length < 8) return apiKey;
    return `${apiKey.substring(0, 7)}${"•".repeat(20)}${apiKey.substring(apiKey.length - 4)}`;
  };

  // Helper para calcular días restantes del trial
  const getDaysRemaining = () => {
    if (!subscription?.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diff = trialEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  // Helper para determinar estado del trial (7 días ahora)
  const getTrialStatus = () => {
    if (!subscription?.inTrial) return "expired";
    const daysRemaining = getDaysRemaining();
    if (daysRemaining > 2) return "active"; // Días 3-7
    if (daysRemaining > 0) return "warning"; // Últimos 2 días (ROJO)
    return "expired";
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
            <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-not-found">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();
  const trialStatus = getTrialStatus();

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
        <div className="space-y-8 max-w-6xl mx-auto">
          {/* Trial Banner */}
          {subscription && subscription.inTrial && (
            <Card className={`border-2 ${trialStatus === "warning" ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${trialStatus === "warning" ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                      {trialStatus === "warning" ? (
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${trialStatus === "warning" ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}`}>
                        {trialStatus === "warning" ? "⚠️ Trial por expirar" : "🎉 Período de Prueba Activo"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {trialStatus === "warning" ? (
                          <>Solo te quedan <span className="font-bold text-red-600 dark:text-red-400">{daysRemaining} días</span> de prueba</>
                        ) : (
                          <>Te quedan <span className="font-bold">{daysRemaining} días</span> de trial gratuito</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant={trialStatus === "warning" ? "destructive" : "default"}
                    onClick={() => setPlansDialogOpen(true)}
                    data-testid="button-view-plans"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Ver Planes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {subscription && !subscription.inTrial && (
            <Card className="border-2 border-gray-500 bg-gray-50 dark:bg-gray-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-900/30">
                      <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        🔒 Período de Prueba Finalizado
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tu trial de 7 días ha expirado. Activa un plan para continuar
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={() => setPlansDialogOpen(true)}
                    data-testid="button-activate-account"
                  >
                    Activar Cuenta Ahora
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WhatsApp Instances - MOVIDO ARRIBA */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Instancias de WhatsApp</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus conexiones de WhatsApp Business
                </p>
              </div>
              <Button
                onClick={() => setCreateInstanceOpen(true)}
                disabled={createInstanceMutation.isPending}
                data-testid="button-create-instance"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Instancia
              </Button>
            </div>

            {instances.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay instancias</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Crea tu primera instancia de WhatsApp para comenzar
                  </p>
                  <Button onClick={() => setCreateInstanceOpen(true)} data-testid="button-create-first-instance">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Instancia
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {instances.map((instance) => (
                  <Card key={instance.id} className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <h3 className="font-semibold truncate">{instance.customName}</h3>
                            <Badge variant={getStatusColor(instance.status || "disconnected")}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(instance.status || "disconnected")}
                                {instance.status || "disconnected"}
                              </span>
                            </Badge>
                          </div>
                          
                          {instance.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Phone className="w-4 h-4" />
                              <span>{instance.phoneNumber}</span>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Actualizado {formatDistanceToNow(new Date(instance.updatedAt || instance.createdAt), { 
                              addSuffix: true,
                              locale: es 
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {instance.status !== "connected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateQr(instance)}
                              disabled={generateQrMutation.isPending}
                              data-testid={`button-generate-qr-${instance.id}`}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              Generar QR
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncInstance(instance.id)}
                            disabled={syncInstanceMutation.isPending}
                            data-testid={`button-sync-${instance.id}`}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newName = prompt("Nuevo nombre:", instance.customName);
                              if (newName && newName !== instance.customName) {
                                handleUpdateInstanceName(instance.id, newName);
                              }
                            }}
                            data-testid={`button-edit-name-${instance.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteInstance(instance.id)}
                            disabled={deleteInstanceMutation.isPending}
                            data-testid={`button-delete-${instance.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Configuración de APIs</CardTitle>
                    <CardDescription className="mt-1">
                      Gestiona las credenciales de ElevenLabs y Gemini
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApiSettingsOpen(true)}
                  data-testid="button-api-settings"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                <span className="font-medium">ElevenLabs API:</span>
                <Badge variant={(subaccount as any).hasElevenLabsKey ? "default" : "secondary"}>
                  {(subaccount as any).hasElevenLabsKey ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Configurado
                    </>
                  ) : (
                    "No configurado"
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                <span className="font-medium">Gemini API:</span>
                <Badge variant={(subaccount as any).hasGeminiKey ? "default" : "secondary"}>
                  {(subaccount as any).hasGeminiKey ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Configurado
                    </>
                  ) : (
                    "No configurado"
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subaccount Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <CardTitle>Información de la Subcuenta</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-md bg-muted/50">
                  <span className="font-medium block text-muted-foreground mb-1">Nombre</span>
                  <p className="font-semibold">{subaccount.name}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <span className="font-medium block text-muted-foreground mb-1">Location ID</span>
                  <p className="font-mono text-xs">{subaccount.locationId}</p>
                </div>
                {subaccount.city && subaccount.state && (
                  <div className="p-3 rounded-md bg-muted/50">
                    <span className="font-medium block text-muted-foreground mb-1">Ubicación</span>
                    <p className="font-semibold">{subaccount.city}, {subaccount.state}</p>
                  </div>
                )}
                {subaccount.email && (
                  <div className="p-3 rounded-md bg-muted/50">
                    <span className="font-medium block text-muted-foreground mb-1">Email</span>
                    <p className="font-semibold">{subaccount.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog: Create Instance */}
      <Dialog open={createInstanceOpen} onOpenChange={setCreateInstanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Instancia de WhatsApp</DialogTitle>
            <DialogDescription>
              Crea una nueva instancia para conectar una cuenta de WhatsApp Business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="instance-name">Nombre de la instancia</Label>
              <Input
                id="instance-name"
                placeholder="Ej: WhatsApp Ventas"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                data-testid="input-instance-name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateInstanceOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInstance}
              disabled={createInstanceMutation.isPending || !instanceName.trim()}
              data-testid="button-confirm-create"
            >
              {createInstanceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Instancia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: QR Code */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escanea este código QR con WhatsApp
            </DialogDescription>
          </DialogHeader>
          {selectedInstance?.qrCode && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={selectedInstance.qrCode} size={256} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Pasos para conectar:</p>
                <ol className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>1. Abre WhatsApp en tu teléfono</li>
                  <li>2. Toca Menú o Configuración</li>
                  <li>3. Toca Dispositivos vinculados</li>
                  <li>4. Toca Vincular un dispositivo</li>
                  <li>5. Escanea este código QR</li>
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: API Settings */}
      <Dialog open={apiSettingsOpen} onOpenChange={setApiSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de APIs</DialogTitle>
            <DialogDescription>
              Configura las API keys para ElevenLabs y Gemini. Solo se guardarán las keys que proporciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
                {(subaccount as any)?.hasElevenLabsKey && (
                  <Badge variant="default" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Ya configurada
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  id="elevenlabs-key"
                  type={showElevenLabsKey ? "text" : "password"}
                  placeholder="Ingresa nueva key o deja vacío para mantener"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  data-testid="input-elevenlabs-key"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                  data-testid="button-toggle-elevenlabs"
                >
                  {showElevenLabsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Usada para servicios de voz y transcripción
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                {(subaccount as any)?.hasGeminiKey && (
                  <Badge variant="default" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Ya configurada
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  placeholder="Ingresa nueva key o deja vacío para mantener"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  data-testid="input-gemini-key"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  data-testid="button-toggle-gemini"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Usada para procesamiento de lenguaje natural
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setApiSettingsOpen(false)}
              data-testid="button-cancel-api-settings"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveApiSettings}
              disabled={updateApiSettingsMutation.isPending}
              data-testid="button-save-api-settings"
            >
              {updateApiSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Plans */}
      <Dialog open={plansDialogOpen} onOpenChange={setPlansDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecciona tu Plan</DialogTitle>
            <DialogDescription>
              Elige el plan que mejor se adapte a tus necesidades
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-4 py-4">
            {/* Plan Starter */}
            <Card className="hover-elevate cursor-pointer" data-testid="plan-card-starter">
              <CardHeader>
                <CardTitle className="text-lg">Starter</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$15</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Hasta 3 instancias</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Soporte básico</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>APIs incluidas</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" data-testid="button-select-starter">
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            {/* Plan Basic */}
            <Card className="hover-elevate cursor-pointer border-2 border-primary" data-testid="plan-card-basic">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md">
                Recomendado
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Basic</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$25</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Hasta 10 instancias</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Soporte prioritario</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>APIs incluidas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Análisis avanzado</span>
                  </div>
                </div>
                <Button className="w-full" data-testid="button-select-basic">
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            {/* Plan Pro */}
            <Card className="hover-elevate cursor-pointer" data-testid="plan-card-pro">
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$45</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Instancias ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Soporte 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>APIs incluidas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Análisis avanzado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>API personalizada</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" data-testid="button-select-pro">
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
