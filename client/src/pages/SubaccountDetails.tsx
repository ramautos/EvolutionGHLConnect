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
import openaiLogo from "@assets/openai-old-logo_1762396242467.webp";
import elevenLabsLogo from "@assets/ElevenLabs_1762127966161.png";

export default function SubaccountDetails() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/subaccount/:id");
  const subaccountId = params?.id;

  const [createInstanceOpen, setCreateInstanceOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [elevenLabsSettingsOpen, setElevenLabsSettingsOpen] = useState(false);
  const [openaiSettingsOpen, setOpenaiSettingsOpen] = useState(false);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsappInstance | null>(null);
  const [instanceName, setInstanceName] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "profesional" | "business">("profesional");
  
  // Nuevo sistema de triggers con Dialog
  const [addTriggerOpen, setAddTriggerOpen] = useState(false);
  const [newTriggerName, setNewTriggerName] = useState("");
  const [newTriggerTag, setNewTriggerTag] = useState("");

  // Plan definitions
  const PLANS = [
    { id: "starter", name: "Starter", price: 8, priceId: "price_starter", instances: 1 },
    { id: "profesional", name: "Profesional", price: 15, priceId: "price_profesional", instances: 3 },
    { id: "business", name: "Business", price: 25, priceId: "price_business", instances: 5, extraPrice: 5 },
  ] as const;

  // Obtener subcuenta
  const { data: subaccounts = [], isLoading: subaccountLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  const subaccount = subaccounts.find(s => s.id === subaccountId);

  // Obtener lista de triggers
  const { data: triggers = [], isLoading: triggersLoading } = useQuery<any[]>({
    queryKey: ["/api/subaccounts", subaccount?.locationId, "triggers"],
    enabled: !!subaccount?.locationId,
  });

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

  // Usar companyManualBilling directamente del usuario (viene en /api/auth/me)
  const isManualBilling = (user as any)?.companyManualBilling || false;

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

  // Mutation para actualizar ElevenLabs Settings
  const updateElevenLabsSettingsMutation = useMutation({
    mutationFn: async ({ elevenLabsKey, elevenLabsVoice }: { elevenLabsKey?: string; elevenLabsVoice?: string }) => {
      if (!subaccount?.locationId) {
        throw new Error("Location ID no encontrado");
      }
      
      const updates: any = {};
      
      if (elevenLabsKey && elevenLabsKey.trim()) {
        updates.elevenLabsApiKey = elevenLabsKey.trim();
      }
      
      if (elevenLabsVoice && elevenLabsVoice.trim()) {
        updates.elevenLabsVoiceId = elevenLabsVoice.trim();
      }
      
      if (Object.keys(updates).length === 0) {
        throw new Error("Por favor proporciona al menos un campo para actualizar");
      }
      
      const res = await apiRequest("PATCH", `/api/subaccounts/${subaccount.locationId}/api-settings`, updates);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update ElevenLabs settings");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "ElevenLabs actualizado",
        description: "La configuración de ElevenLabs se guardó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user", user?.id] });
      setElevenLabsSettingsOpen(false);
      setElevenLabsApiKey("");
      setElevenLabsVoiceId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar OpenAI Settings
  const updateOpenaiSettingsMutation = useMutation({
    mutationFn: async ({ openaiKey }: { openaiKey: string }) => {
      if (!subaccount?.locationId) {
        throw new Error("Location ID no encontrado");
      }
      
      if (!openaiKey || !openaiKey.trim()) {
        throw new Error("Por favor proporciona la API Key de OpenAI");
      }
      
      const res = await apiRequest("PATCH", `/api/subaccounts/${subaccount.locationId}/api-settings`, {
        openaiApiKey: openaiKey.trim(),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update OpenAI settings");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "OpenAI actualizado",
        description: "La API Key de OpenAI se guardó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user", user?.id] });
      setOpenaiSettingsOpen(false);
      setOpenaiApiKey("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  // Mutation para crear checkout de Stripe
  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, priceId }: { planId: string; priceId: string }) => {
      return await apiRequest("POST", "/api/create-checkout-session", { planId, priceId });
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear la sesión de pago",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al procesar pago",
        description: error.message || "No se pudo crear la sesión de pago. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (plan) {
      checkoutMutation.mutate({ planId: plan.id, priceId: plan.priceId });
    }
  };

  const handleCreateInstance = () => {
    if (!instanceName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la instancia",
        variant: "destructive",
      });
      return;
    }

    // Validar límite de instancias
    const currentInstanceCount = instances?.length || 0;
    const includedInstances = parseInt(subscription?.includedInstances || "1");
    const extraPrice = parseFloat(subscription?.extraPrice || "0");
    
    // Determinar nombre del plan correctamente
    let planName = "tu plan actual";
    if (subscription?.plan === "starter") planName = "Starter";
    else if (subscription?.plan === "profesional") planName = "Profesional";
    else if (subscription?.plan === "business") planName = "Business";

    if (currentInstanceCount >= includedInstances && extraPrice === 0) {
      // Plan no permite instancias adicionales
      toast({
        title: "Límite alcanzado",
        description: `Tu plan ${planName} permite hasta ${includedInstances} instancia${includedInstances > 1 ? 's' : ''}. Actualiza tu plan para agregar más.`,
        variant: "destructive",
      });
      setPlansDialogOpen(true); // Abrir modal de planes
      return; // No crear instancia
    }

    if (currentInstanceCount >= includedInstances && extraPrice > 0) {
      // Plan permite instancias adicionales - mostrar confirmación
      const confirmCreate = confirm(
        `Tu plan incluye ${includedInstances} instancia${includedInstances > 1 ? 's' : ''}. ` +
        `Esta será una instancia adicional con costo de $${extraPrice}/mes. ¿Deseas continuar?`
      );
      if (!confirmCreate) {
        return; // No crear instancia
      }
    }

    // Si pasó todas las validaciones, crear la instancia
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

  // Mutation para actualizar solo el número de notificación
  const updateNotificationPhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      if (!subaccount?.locationId) {
        throw new Error("Location ID no encontrado");
      }
      
      const res = await apiRequest("PATCH", `/api/subaccounts/${subaccount.locationId}/api-settings`, {
        notificationPhone: phone.trim() || null,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update notification phone");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Número actualizado",
        description: "El número de notificación se guardó exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user", user?.id] });
      setIsEditingPhone(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el número de notificación",
        variant: "destructive",
      });
    },
  });

  const handleSaveElevenLabsSettings = () => {
    updateElevenLabsSettingsMutation.mutate({
      elevenLabsKey: elevenLabsApiKey,
      elevenLabsVoice: elevenLabsVoiceId,
    });
  };

  const handleSaveOpenaiSettings = () => {
    updateOpenaiSettingsMutation.mutate({
      openaiKey: openaiApiKey,
    });
  };

  const handleSaveNotificationPhone = () => {
    updateNotificationPhoneMutation.mutate(notificationPhone);
  };

  // Mutation para crear trigger
  const createTriggerMutation = useMutation({
    mutationFn: async (data: { triggerName: string; triggerTag: string }) => {
      if (!subaccount?.locationId) throw new Error("Location ID no encontrado");
      const res = await apiRequest("POST", `/api/subaccounts/${subaccount.locationId}/triggers`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear el trigger");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Trigger creado", description: "El trigger se creó exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts", subaccount?.locationId, "triggers"] });
      setAddTriggerOpen(false);
      setNewTriggerName("");
      setNewTriggerTag("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear el trigger", variant: "destructive" });
    },
  });

  // Mutation para eliminar trigger
  const deleteTriggerMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      if (!subaccount?.locationId) throw new Error("Location ID no encontrado");
      const res = await apiRequest("DELETE", `/api/subaccounts/${subaccount.locationId}/triggers/${triggerId}`, {});
      if (!res.ok) throw new Error("Error al eliminar el trigger");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Trigger eliminado", description: "El trigger se eliminó exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts", subaccount?.locationId, "triggers"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar el trigger", variant: "destructive" });
    },
  });

  const handleCreateTrigger = () => {
    if (!newTriggerName.trim() || !newTriggerTag.trim()) {
      toast({ title: "Error", description: "Por favor completa ambos campos", variant: "destructive" });
      return;
    }
    createTriggerMutation.mutate({ triggerName: newTriggerName.trim(), triggerTag: newTriggerTag.trim() });
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
          {/* Trial Banner - Solo mostrar si NO es cobro manual */}
          {subscription && subscription.inTrial && !isManualBilling && (
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

          {/* Banner de Planes - Solo mostrar si NO es cobro manual */}
          {subscription && !subscription.inTrial && !isManualBilling && (
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
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Teléfono</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actualizado</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instances.map((instance) => {
                          const isConnected = instance.status === "connected" || instance.status === "open";
                          return (
                            <tr key={instance.id} className="border-b hover-elevate">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium">{instance.customName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <Badge 
                                  variant={isConnected ? "default" : "secondary"}
                                  className={isConnected ? "bg-green-600 hover:bg-green-700 dark:bg-green-700" : ""}
                                >
                                  <span className="flex items-center gap-1">
                                    {isConnected ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                    {isConnected ? "Conectado" : instance.status || "disconnected"}
                                  </span>
                                </Badge>
                              </td>
                              <td className="px-4 py-4">
                                {instance.phoneNumber ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{instance.phoneNumber}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date((instance as any).updatedAt || instance.createdAt || new Date()), { 
                                    addSuffix: true,
                                    locale: es 
                                  })}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {!isConnected && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleGenerateQr(instance)}
                                      disabled={generateQrMutation.isPending}
                                      data-testid={`button-generate-qr-${instance.id}`}
                                    >
                                      <QrCode className="w-4 h-4" />
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
                                      const newName = prompt("Nuevo nombre:", instance.customName || "");
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
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* API Configuration - ElevenLabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={elevenLabsLogo} 
                    alt="ElevenLabs" 
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div>
                    <CardTitle className="text-lg">ElevenLabs</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Para envío de mensaje de voz</p>
                  </div>
                </div>
                <Button
                  onClick={() => setElevenLabsSettingsOpen(true)}
                  size="sm"
                  variant="outline"
                  data-testid="button-config-elevenlabs"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* API Configuration - OpenAI */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={openaiLogo} 
                    alt="OpenAI" 
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div>
                    <CardTitle className="text-lg">OpenAI</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Transcripciones</p>
                  </div>
                </div>
                <Button
                  onClick={() => setOpenaiSettingsOpen(true)}
                  size="sm"
                  variant="outline"
                  data-testid="button-config-openai"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={(subaccount as any).hasOpenaiKey ? "default" : "secondary"}>
                {(subaccount as any).hasOpenaiKey ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Configurado
                  </>
                ) : (
                  "No configurado"
                )}
              </Badge>
            </CardContent>
          </Card>

          {/* Notification Phone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Número de Notificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={isEditingPhone ? notificationPhone : ((subaccount as any)?.notificationPhone || "")}
                    onChange={(e) => {
                      setNotificationPhone(e.target.value);
                      if (!isEditingPhone) setIsEditingPhone(true);
                    }}
                    onFocus={() => {
                      if (!isEditingPhone) {
                        setNotificationPhone((subaccount as any)?.notificationPhone || "");
                        setIsEditingPhone(true);
                      }
                    }}
                    data-testid="input-notification-phone"
                    className="text-base h-11"
                  />
                </div>
                {isEditingPhone && (
                  <Button
                    onClick={handleSaveNotificationPhone}
                    disabled={updateNotificationPhoneMutation.isPending}
                    data-testid="button-save-notification-phone"
                    className="h-11"
                  >
                    {updateNotificationPhoneMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              <div className="bg-muted/30 border border-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Ejemplo de uso:
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Si un WhatsApp se desconecta, a este número se le enviará una notificación de desconexión automáticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trigger Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Configuración de Triggers</CardTitle>
                </div>
                <Button
                  onClick={() => setAddTriggerOpen(true)}
                  size="sm"
                  data-testid="button-add-trigger"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Trigger
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {triggersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : triggers.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No hay triggers configurados. Agrega uno para comenzar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {triggers.map((trigger: any) => (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                      data-testid={`trigger-item-${trigger.id}`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{trigger.triggerName}</span>
                          <Badge variant="outline" className="text-xs">
                            {trigger.triggerTag}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creado {formatDistanceToNow(new Date(trigger.createdAt), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTriggerMutation.mutate(trigger.id)}
                        disabled={deleteTriggerMutation.isPending}
                        data-testid={`button-delete-trigger-${trigger.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-muted/30 border border-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Ejemplo de uso:
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cuando se active el trigger especificado, se agregará automáticamente la etiqueta indicada al contacto en GoHighLevel.
                </p>
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

      {/* Dialog: ElevenLabs Settings */}
      <Dialog open={elevenLabsSettingsOpen} onOpenChange={setElevenLabsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de ElevenLabs</DialogTitle>
            <DialogDescription>
              Configura tu API Key y Voice ID para servicios de voz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="elevenlabs-key">API Key</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevenlabs-voice-id">Voice ID</Label>
              <Input
                id="elevenlabs-voice-id"
                type="text"
                placeholder="Ej: pNInz6obpgDQGcFmaJgB"
                value={elevenLabsVoiceId}
                onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                data-testid="input-elevenlabs-voice-id"
              />
              <p className="text-xs text-muted-foreground">
                ID de la voz que se usará para generar audio
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setElevenLabsSettingsOpen(false)}
              data-testid="button-cancel-elevenlabs-settings"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveElevenLabsSettings}
              disabled={updateElevenLabsSettingsMutation.isPending}
              data-testid="button-save-elevenlabs-settings"
            >
              {updateElevenLabsSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: OpenAI Settings */}
      <Dialog open={openaiSettingsOpen} onOpenChange={setOpenaiSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de OpenAI</DialogTitle>
            <DialogDescription>
              Configura tu API Key para transcripciones y procesamiento de lenguaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="openai-key">API Key</Label>
                {(subaccount as any)?.hasOpenaiKey && (
                  <Badge variant="default" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Ya configurada
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenaiKey ? "text" : "password"}
                  placeholder="Ingresa nueva key o deja vacío para mantener"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  data-testid="input-openai-key"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  data-testid="button-toggle-openai"
                >
                  {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenaiSettingsOpen(false)}
              data-testid="button-cancel-openai-settings"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveOpenaiSettings}
              disabled={updateOpenaiSettingsMutation.isPending}
              data-testid="button-save-openai-settings"
            >
              {updateOpenaiSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                  <span className="text-3xl font-bold">$8</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Hasta 1 instancia</span>
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
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => handleSelectPlan("starter")}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-select-starter"
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            {/* Plan Profesional */}
            <Card className="hover-elevate cursor-pointer border-2 border-primary" data-testid="plan-card-profesional">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md">
                Recomendado
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Profesional</CardTitle>
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
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan("profesional")}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-select-profesional"
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            {/* Plan Business */}
            <Card className="hover-elevate cursor-pointer" data-testid="plan-card-business">
              <CardHeader>
                <CardTitle className="text-lg">Business</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$25</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Hasta 5 instancias</span>
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
                    <span>+$5 por instancia extra</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => handleSelectPlan("business")}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-select-business"
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar trigger */}
      <Dialog open={addTriggerOpen} onOpenChange={setAddTriggerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Trigger</DialogTitle>
            <DialogDescription>
              Crea un nuevo trigger para automatizar el etiquetado de contactos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-trigger-name">Nombre del Trigger</Label>
              <Input
                id="new-trigger-name"
                placeholder="Ej: Bienvenida"
                value={newTriggerName}
                onChange={(e) => setNewTriggerName(e.target.value)}
                data-testid="input-new-trigger-name"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-trigger-tag">Nombre de la Etiqueta</Label>
              <Input
                id="new-trigger-tag"
                placeholder="Ej: nuevo_cliente"
                value={newTriggerTag}
                onChange={(e) => setNewTriggerTag(e.target.value)}
                data-testid="input-new-trigger-tag"
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddTriggerOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTrigger}
              disabled={createTriggerMutation.isPending}
              data-testid="button-submit-trigger"
            >
              {createTriggerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Trigger"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
