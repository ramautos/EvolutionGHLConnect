import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { ArrowLeft, User, Phone, Lock, MessageSquare, Key, Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import type { Subaccount } from "@shared/schema";

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, refetch } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Estados para formularios
  const [name, setName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber?.replace("+", "") || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [openaiKeys, setOpenaiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // Obtener subcuentas del usuario
  const { data: subaccounts = [], isLoading: subaccountsLoading } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  // Inicializar los API keys cuando se cargan las subcuentas
  useEffect(() => {
    if (subaccounts && subaccounts.length > 0) {
      const keys: Record<string, string> = {};
      subaccounts.forEach((sub: Subaccount) => {
        if (sub.openaiApiKey) {
          keys[sub.locationId] = sub.openaiApiKey;
        }
      });
      setOpenaiKeys(keys);
    }
  }, [subaccounts]);

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; phoneNumber?: string }) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error al actualizar el perfil");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Recargar el usuario
      await refetch();
      toast({
        title: "Perfil actualizado",
        description: "Tus datos se han actualizado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
      });
    },
  });

  // Mutación para cambiar contraseña
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error al cambiar la contraseña");
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se ha cambiado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
      });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { name?: string; phoneNumber?: string } = {};
    
    if (name !== user?.name) {
      updates.name = name;
    }
    
    const fullPhone = phoneNumber ? `+${phoneNumber}` : "";
    if (fullPhone !== user?.phoneNumber) {
      updates.phoneNumber = fullPhone;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "Sin cambios",
        description: "No hay cambios para guardar.",
      });
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La nueva contraseña debe tener al menos 8 caracteres",
      });
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // Mutación para actualizar OpenAI API key
  const updateOpenAIKeyMutation = useMutation({
    mutationFn: async ({ locationId, apiKey }: { locationId: string; apiKey: string }) => {
      return await apiRequest(`/api/subaccounts/${locationId}/openai-key`, "PATCH", {
        openaiApiKey: apiKey,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user", user?.id] });
      toast({
        title: "API Key actualizada",
        description: "La API Key de OpenAI se ha guardado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la API Key",
      });
    },
  });

  const handleUpdateOpenAIKey = (locationId: string) => {
    const apiKey = openaiKeys[locationId];
    if (!apiKey || apiKey.trim() === "") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa una API Key válida",
      });
      return;
    }
    updateOpenAIKeyMutation.mutate({ locationId, apiKey });
  };

  const toggleShowApiKey = (locationId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [locationId]: !prev[locationId],
    }));
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.length < 8) return apiKey;
    return `${apiKey.substring(0, 7)}${"•".repeat(20)}${apiKey.substring(apiKey.length - 4)}`;
  };

  // Verificar si el usuario tiene contraseña (no es usuario de Google)
  const hasPassword = (user as any)?.hasPassword ?? false;
  const isGoogleUser = !hasPassword;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">WhatsApp AI Platform</h1>
              <p className="text-xs text-muted-foreground">Mi Perfil</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            <p className="text-muted-foreground">
              Gestiona tu información personal y configuración de seguridad
            </p>
          </div>

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu nombre y número de teléfono
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Teléfono</Label>
                  <PhoneInput
                    country="do"
                    value={phoneNumber}
                    onChange={(phone) => setPhoneNumber(phone)}
                    inputProps={{
                      id: "phone",
                      name: "phone",
                      required: true,
                      "data-testid": "input-profile-phone",
                    }}
                    containerClass="w-full"
                    inputClass="w-full"
                    enableSearch
                    searchPlaceholder="Buscar país..."
                    preferredCountries={["do", "us", "mx", "co", "ve"]}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-update-profile"
                >
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Configuración de OpenAI API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Configuración de OpenAI
              </CardTitle>
              <CardDescription>
                Configura tu API Key de OpenAI para cada subcuenta. Esta clave se usa para transcripción de voz en WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subaccountsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-10 bg-muted rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : !subaccounts || subaccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tienes subcuentas. Agrega una subcuenta desde el Dashboard para configurar OpenAI.
                </p>
              ) : (
                <div className="space-y-6">
                  {subaccounts.map((subaccount: Subaccount) => (
                    <div key={subaccount.id} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{subaccount.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Location ID: {subaccount.locationId}
                          </p>
                        </div>
                        {subaccount.openaiApiKey && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                            Configurado
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`openai-key-${subaccount.locationId}`}>
                          API Key de OpenAI
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id={`openai-key-${subaccount.locationId}`}
                              type={showApiKeys[subaccount.locationId] ? "text" : "password"}
                              value={
                                showApiKeys[subaccount.locationId]
                                  ? openaiKeys[subaccount.locationId] || ""
                                  : openaiKeys[subaccount.locationId]
                                  ? maskApiKey(openaiKeys[subaccount.locationId])
                                  : ""
                              }
                              onChange={(e) => {
                                setOpenaiKeys(prev => ({
                                  ...prev,
                                  [subaccount.locationId]: e.target.value,
                                }));
                              }}
                              placeholder="sk-proj-..."
                              data-testid={`input-openai-key-${subaccount.locationId}`}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => toggleShowApiKey(subaccount.locationId)}
                              data-testid={`button-toggle-visibility-${subaccount.locationId}`}
                            >
                              {showApiKeys[subaccount.locationId] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <Button
                            onClick={() => handleUpdateOpenAIKey(subaccount.locationId)}
                            disabled={updateOpenAIKeyMutation.isPending}
                            data-testid={`button-save-openai-key-${subaccount.locationId}`}
                          >
                            {updateOpenAIKeyMutation.isPending ? "Guardando..." : "Guardar"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Obtén tu API Key en{" "}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            platform.openai.com/api-keys
                          </a>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Cambiar Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                {isGoogleUser
                  ? "Este usuario usa autenticación de Google, no puede cambiar contraseña"
                  : "Actualiza tu contraseña para mantener tu cuenta segura"}
              </CardDescription>
            </CardHeader>
            {!isGoogleUser && (
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Contraseña Actual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      data-testid="input-current-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      data-testid="input-new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma tu nueva contraseña"
                      data-testid="input-confirm-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-update-password"
                  >
                    {updatePasswordMutation.isPending ? "Actualizando..." : "Cambiar Contraseña"}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
