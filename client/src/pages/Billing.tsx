import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Check, Zap, ArrowLeft, Building2, Users, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";

const PLANS = [
  {
    id: "basic_1",
    name: "Plan Básico",
    price: 15,
    priceId: "price_basic_1", // Stripe Price ID
    maxSubaccounts: 1,
    instances: 1,
    description: "Perfecto para comenzar",
    features: [
      "1 Subcuenta de GoHighLevel",
      "1 Instancia de WhatsApp",
      "Soporte por email",
      "Integración con N8N",
      "Dashboard básico",
    ],
    popular: false,
  },
  {
    id: "pro_5",
    name: "Plan Pro",
    price: 50,
    priceId: "price_pro_5",
    maxSubaccounts: 5,
    instances: 5,
    description: "Para negocios en crecimiento",
    features: [
      "5 Subcuentas de GoHighLevel",
      "5 Instancias de WhatsApp",
      "Soporte prioritario 24/7",
      "Integración avanzada N8N",
      "Dashboard completo",
      "Webhooks personalizados",
    ],
    popular: true,
  },
  {
    id: "enterprise_10",
    name: "Plan Enterprise",
    price: 90,
    priceId: "price_enterprise_10",
    maxSubaccounts: 10,
    instances: 10,
    description: "Para empresas escalando",
    features: [
      "10 Subcuentas de GoHighLevel",
      "10 Instancias de WhatsApp",
      "Soporte dedicado 24/7",
      "Integración N8N ilimitada",
      "Dashboard personalizado",
      "API completa",
      "Onboarding personalizado",
    ],
    popular: false,
  },
] as const;

export default function Billing() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"basic_1" | "pro_5" | "enterprise_10">("pro_5");

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const { data: subaccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, priceId }: { planId: string; priceId: string }) => {
      return await apiRequest("POST", "/api/create-checkout-session", { planId, priceId });
    },
    onSuccess: (data: any) => {
      if (data.url) {
        // Redirigir a Stripe Checkout
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No se pudo cargar la suscripción</CardTitle>
            <CardDescription>Por favor, intenta nuevamente más tarde</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/dashboard")}>
              Volver al Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const maxSubaccounts = parseInt(subscription.maxSubaccounts || "1");
  const currentSubaccounts = subaccounts.filter(s => !s.locationId?.startsWith("LOCAL_") && !s.locationId?.startsWith("GOOGLE_")).length;
  const isTrialActive = subscription.plan === "trial" && subscription.status === "active";
  
  let daysRemaining = 0;
  if (isTrialActive && subscription.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);
  const currentPlanName = PLANS.find(p => p.id === subscription.plan)?.name || "Prueba Gratuita";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px]" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              Planes y Suscripción
            </h1>
            <p className="text-muted-foreground mt-2">
              Elige el plan perfecto para escalar tu negocio
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Plan Actual
                </CardTitle>
                <CardDescription className="mt-1">
                  {isTrialActive ? "Estás en periodo de prueba gratuita" : "Tu suscripción activa"}
                </CardDescription>
              </div>
              <Badge 
                variant={isTrialActive ? "secondary" : "default"} 
                className="text-base px-4 py-2" 
                data-testid="badge-current-plan"
              >
                {currentPlanName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-chart-2/10 border border-primary/20" data-testid="stat-subaccounts">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="w-4 h-4" />
                  Subcuentas Disponibles
                </div>
                <p className="text-3xl font-bold mt-1" data-testid="text-subaccounts-count">
                  {currentSubaccounts} <span className="text-lg text-muted-foreground">/ {maxSubaccounts}</span>
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-chart-2 transition-all"
                    style={{ width: `${Math.min((currentSubaccounts / maxSubaccounts) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {isTrialActive && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-chart-2/10 to-primary/10 border border-chart-2/20" data-testid="stat-trial-days">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="w-4 h-4" />
                    Días de Prueba Restantes
                  </div>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent" data-testid="text-trial-days">
                    {daysRemaining} <span className="text-lg">días</span>
                  </p>
                </div>
              )}
              
              <div className="p-4 rounded-lg bg-muted/50 border" data-testid="stat-status">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MessageSquare className="w-4 h-4" />
                  Estado
                </div>
                <p className="text-3xl font-bold mt-1 capitalize" data-testid="text-status">
                  {subscription.status === "active" ? "●  Activo" : subscription.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Escala tu negocio con <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">Planes Flexibles</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Más ubicaciones, más poder. Precios diseñados para crecer contigo.
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary border-2 shadow-lg shadow-primary/20 scale-105"
                    : "border-2 hover-elevate"
                } ${plan.popular ? "md:scale-110 z-10" : ""}`}
                onClick={() => setSelectedPlan(plan.id as any)}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-chart-2 text-white px-4 py-1 shadow-lg">
                      <Zap className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ${(plan.price / plan.maxSubaccounts).toFixed(2)} por ubicación
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold">{plan.maxSubaccounts}</p>
                      <p className="text-xs text-muted-foreground">Subcuentas</p>
                    </div>
                    <div className="text-center">
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-chart-2" />
                      <p className="text-2xl font-bold">{plan.instances}</p>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                    </div>
                  </div>

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
                    {selectedPlan === plan.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Seleccionado
                      </>
                    ) : (
                      "Seleccionar Plan"
                    )}
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
                <CardDescription>
                  Confirma los detalles de tu nueva suscripción
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">{selectedPlanData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlanData.description}</p>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                    ${selectedPlanData.price}/mes
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Subcuentas</p>
                    <p className="text-xl font-bold">{selectedPlanData.maxSubaccounts}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Instancias WhatsApp</p>
                    <p className="text-xl font-bold">{selectedPlanData.instances}</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => checkoutMutation.mutate({ 
                      planId: selectedPlan, 
                      priceId: selectedPlanData.priceId 
                    })}
                    disabled={checkoutMutation.isPending || subscription?.plan === selectedPlan}
                    data-testid="button-proceed-payment"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirigiendo a Stripe...
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
                    15 días de prueba gratuita • Pago seguro con Stripe
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
