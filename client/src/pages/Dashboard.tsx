import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import InstanceCard from "@/components/InstanceCard";
import QRModal from "@/components/QRModal";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Settings } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WhatsappInstance } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string>("");

  const { data: instances = [], isLoading: instancesLoading, error } = useQuery<WhatsappInstance[]>({
    queryKey: ["/api/instances/user", user?.id],
    enabled: !!user?.id,
  });

  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      const evolutionName = `wa-${Date.now()}`;
      const res = await apiRequest("POST", "/api/instances", {
        userId: user?.id,
        instanceName: evolutionName,
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
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la instancia",
        variant: "destructive",
      });
    },
  });

  const updateInstanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WhatsappInstance> }) => {
      const res = await apiRequest("PATCH", `/api/instances/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances/user", user?.id] });
      toast({
        title: "Instancia actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la instancia",
        variant: "destructive",
      });
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/instances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances/user", user?.id] });
      toast({
        title: "Instancia eliminada",
        description: "La instancia se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la instancia",
        variant: "destructive",
      });
    },
  });

  const handleCreateNewInstance = () => {
    createInstanceMutation.mutate();
  };

  const handleGenerateQR = (id: string) => {
    setSelectedInstance(id);
    setQrModalOpen(true);
  };

  const handleDisconnect = async (id: string) => {
    await updateInstanceMutation.mutateAsync({
      id,
      updates: { status: "disconnected", phoneNumber: null },
    });
  };

  const handleDelete = async (id: string) => {
    await deleteInstanceMutation.mutateAsync(id);
  };

  const handleUpdateName = async (id: string, newName: string) => {
    await updateInstanceMutation.mutateAsync({
      id,
      updates: { instanceName: newName },
    });
  };

  if (userLoading || instancesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error al cargar las instancias</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
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
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Gestiona tus instancias de WhatsApp
              </p>
            </div>
            <Button 
              className="gap-2" 
              data-testid="button-add-instance"
              onClick={handleCreateNewInstance}
              disabled={createInstanceMutation.isPending}
            >
              <Plus className="w-5 h-5" />
              Nueva Instancia
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Instancias de WhatsApp</h2>
          {instances.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <p className="text-muted-foreground mb-4">
                No tienes instancias de WhatsApp configuradas
              </p>
              <Button 
                className="gap-2"
                onClick={handleCreateNewInstance}
                disabled={createInstanceMutation.isPending}
                data-testid="button-create-first-instance"
              >
                <Plus className="w-5 h-5" />
                Crear Primera Instancia
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instanceName={instance.instanceName}
                  phoneNumber={instance.phoneNumber || undefined}
                  status={instance.status as "connected" | "created" | "connecting" | "disconnected"}
                  onGenerateQR={() => handleGenerateQR(instance.id)}
                  onDisconnect={() => handleDisconnect(instance.id)}
                  onDelete={() => handleDelete(instance.id)}
                  onUpdateName={(newName) => handleUpdateName(instance.id, newName)}
                />
              ))}
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
