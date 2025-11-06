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
    id: "starter",
    name: "Starter",
    price: 8,
    priceId: "price_starter", // Stripe Price ID
    instances: 1,
    extraInstancePrice: undefined,
    description: "Ideal para emprendedores y pequeñas empresas",
    features: [
      "1 número de WhatsApp",
      "Mensajería ilimitada",
      "Generación de QR instantánea",
      "Webhooks seguros",
      "Integrado en panel GHL",
      "OpenAI - Transcripción de audio",
      "ElevenLabs - Envío de audio en chat",
    ],
    popular: false,
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 15,
    priceId: "price_profesional",
    instances: 3,
    extraInstancePrice: undefined,
    description: "Perfecto para agencias y equipos de ventas",
    features: [
      "3 números de WhatsApp",
      "Mensajería ilimitada",
      "Generación de QR instantánea",
      "Webhooks seguros avanzados",
      "Multi-subcuentas GHL",
      "Analytics en tiempo real",
      "OpenAI - Transcripción de audio",
      "ElevenLabs - Envío de audio en chat",
      "Soporte prioritario",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 25,
    priceId: "price_business",
    instances: 5,
    extraInstancePrice: 5,
    description: "Para empresas que necesitan escalar operaciones",
    features: [
      "5 números de WhatsApp",
      "Mensajería ilimitada",
      "Multi-subcuentas GHL ilimitadas",
      "Generación de QR instantánea",
      "Webhooks seguros avanzados",
      "Analytics avanzados + reportes",
      "API personalizada",
      "OpenAI - Transcripción de audio",
      "ElevenLabs - Envío de audio en chat",
      "Soporte VIP 24/7",
      "+$5 USD por instancia adicional",
    ],
    popular: false,
  },
] as const;

export default function Billing() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "profesional" | "business">("profesional");

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const { data: subaccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  // Obtener company info para verificar si es cobro manual
  const { data: company } = useQuery<any>({
    queryKey: ["/api/companies", (user as any)?.companyId],
    enabled: !!(user as any)?.companyId,
  });

  // Obtener billing info de la company (solo si es cobro manual)
  const { data: billingInfo } = useQuery<any>({
    queryKey: ["/api/companies", (user as any)?.companyId, "billing-info"],
    enabled: !!(user as any)?.companyId && company?.manualBilling,
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

  // Vista de Cobro Manual para Agencias
  if (company?.manualBilling && billingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px]" />

        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Facturación - {billingInfo.company.name}
              </h1>
              <p className="text-muted-foreground mt-2">
                Resumen de costos de tus subcuentas
              </p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>

          {/* Resumen de Costos */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Resumen de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">Subcuentas</div>
                  <p className="text-3xl font-bold">{billingInfo.pricing.totalSubaccounts}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${billingInfo.pricing.pricePerSubaccount} c/u
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">Instancias Extras</div>
                  <p className="text-3xl font-bold">{billingInfo.pricing.totalExtraInstances}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${billingInfo.pricing.pricePerExtraInstance} c/u
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">Subtotal</div>
                  <p className="text-2xl font-bold">
                    ${(billingInfo.pricing.totalSubaccountCost + billingInfo.pricing.totalExtraInstancesCost).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                  <div className="text-sm opacity-90 mb-1">Total Mensual</div>
                  <p className="text-3xl font-bold">${billingInfo.pricing.totalCost.toFixed(2)}</p>
                  <div className="text-xs opacity-75 mt-1">USD/mes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalle de Subcuentas */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Subcuentas</CardTitle>
              <CardDescription>
                Cada subcuenta incluye 5 instancias de WhatsApp. Instancias adicionales tienen costo extra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {billingInfo.subaccounts.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sub.instanceCount} instancia{sub.instanceCount !== 1 ? 's' : ''}
                          {sub.extraInstances > 0 && (
                            <span className="text-orange-600 ml-2">
                              (+{sub.extraInstances} extra{sub.extraInstances !== 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ${(parseFloat(billingInfo.pricing.pricePerSubaccount) + (sub.extraInstances * parseFloat(billingInfo.pricing.pricePerExtraInstance))).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.extraInstances > 0
                          ? `$${billingInfo.pricing.pricePerSubaccount} base + $${(sub.extraInstances * parseFloat(billingInfo.pricing.pricePerExtraInstance)).toFixed(2)} extras`
                          : `$${billingInfo.pricing.pricePerSubaccount} base`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <MessageSquare className="w-5 h-5 mx-auto mb-1 text-chart-2" />
                      <p className="text-2xl font-bold">{plan.instances}</p>
                      <p className="text-xs text-muted-foreground">Instancias WhatsApp</p>
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
                
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Instancias WhatsApp incluidas</p>
                  <p className="text-3xl font-bold mt-2">{selectedPlanData.instances}</p>
                  {selectedPlanData.extraInstancePrice && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +${selectedPlanData.extraInstancePrice} por instancia adicional
                    </p>
                  )}
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
