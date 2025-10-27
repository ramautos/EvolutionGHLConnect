import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Check, Zap, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";

export default function Billing() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"basic_1" | "pro_5">("basic_1");

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const { data: subaccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  const upgradePlanMutation = useMutation({
    mutationFn: async (plan: "basic_1" | "pro_5") => {
      return await apiRequest("PATCH", "/api/subscription", { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "¡Plan actualizado!",
        description: "Tu plan ha sido actualizado exitosamente. Ahora puedes crear más subcuentas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar plan",
        description: error.message || "No se pudo actualizar tu plan. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>No se pudo cargar la información de suscripción</p>
      </div>
    );
  }

  const maxSubaccounts = parseInt(subscription.maxSubaccounts || "1");
  const currentSubaccounts = subaccounts.length;
  const isTrialActive = subscription.plan === "trial" && subscription.status === "active";
  
  let daysRemaining = 0;
  if (isTrialActive && subscription.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const plans = [
    {
      id: "basic_1",
      name: "Plan Básico",
      price: 8,
      locations: 1,
      description: "Perfecto para comenzar",
      features: [
        "1 Subcuenta de GoHighLevel",
        "1 Número de WhatsApp",
        "Soporte prioritario",
        "Integración con n8n",
      ],
    },
    {
      id: "pro_5",
      name: "Plan Pro",
      price: 25,
      locations: 5,
      description: "Para negocios en crecimiento",
      features: [
        "5 Subcuentas de GoHighLevel",
        "5 Números de WhatsApp",
        "Soporte prioritario 24/7",
        "Integración con n8n",
      ],
      popular: true,
    },
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Planes y Facturación
            </h1>
            <p className="text-muted-foreground mt-2">
              Administra tu suscripción y elige el plan perfecto para tu negocio
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Current Plan Status */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Plan Actual
                </CardTitle>
                <CardDescription className="mt-1">
                  {isTrialActive ? "Estás en periodo de prueba gratuita" : "Tu suscripción actual"}
                </CardDescription>
              </div>
              <Badge variant={isTrialActive ? "secondary" : "default"} className="text-base px-4 py-2" data-testid="badge-current-plan">
                {isTrialActive ? "Prueba Gratuita" : subscription.plan === "basic_1" ? "Plan Básico" : "Plan Pro"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50" data-testid="stat-subaccounts">
                <p className="text-sm text-muted-foreground">Subcuentas Disponibles</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-subaccounts-count">
                  {currentSubaccounts} / {maxSubaccounts}
                </p>
              </div>
              
              {isTrialActive && (
                <div className="p-4 rounded-lg bg-primary/10" data-testid="stat-trial-days">
                  <p className="text-sm text-muted-foreground">Días de Prueba Restantes</p>
                  <p className="text-2xl font-bold mt-1 text-primary" data-testid="text-trial-days">
                    {daysRemaining} días
                  </p>
                </div>
              )}
              
              <div className="p-4 rounded-lg bg-muted/50" data-testid="stat-status">
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="text-2xl font-bold mt-1 capitalize" data-testid="text-status">
                  {subscription.status === "active" ? "Activo" : subscription.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Escala tu negocio con <span className="text-primary">Poder ilimitado</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Elige el plan perfecto para tus necesidades. Más ubicaciones = mejor precio.
            </p>
            <p className="text-muted-foreground mt-1">
              ¡Empieza a crecer hoy!
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary border-2 shadow-lg shadow-primary/20"
                    : "border hover-elevate"
                } ${plan.popular ? "md:scale-105" : ""}`}
                onClick={() => setSelectedPlan(plan.id as any)}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ${(plan.price / plan.locations).toFixed(2)} por ubicación
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    className="w-full"
                    size="lg"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {selectedPlan === plan.id ? "Seleccionado" : "Seleccionar Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Purchase Summary */}
          {selectedPlanData && (
            <Card className="max-w-2xl mx-auto mt-8 border-2">
              <CardHeader>
                <CardTitle>Resumen de Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">{selectedPlanData.name}</span>
                  <span className="text-lg font-bold">${selectedPlanData.price}/mes</span>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ {selectedPlanData.locations} {selectedPlanData.locations === 1 ? "subcuenta" : "subcuentas"} de GoHighLevel</p>
                  <p>✓ {selectedPlanData.locations} {selectedPlanData.locations === 1 ? "número" : "números"} de WhatsApp</p>
                  <p>✓ Soporte prioritario</p>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => upgradePlanMutation.mutate(selectedPlan)}
                    disabled={upgradePlanMutation.isPending || subscription?.plan === selectedPlan}
                    data-testid="button-proceed-payment"
                  >
                    {upgradePlanMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : subscription?.plan === selectedPlan ? (
                      "Plan Actual"
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceder al Pago
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    <Check className="w-3 h-3 inline mr-1" />
                    Pago seguro • Cancela en cualquier momento
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
