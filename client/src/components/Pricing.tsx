import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLocation } from "wouter";

const plans = [
  {
    name: "Starter",
    price: "Gratis",
    description: "Perfecto para comenzar y probar la plataforma",
    features: [
      "1 instancia de WhatsApp",
      "Generación de QR ilimitada",
      "Integración con GHL",
      "Webhook básico",
      "Soporte por email",
      "Analytics básicos",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/mes",
    description: "Para negocios en crecimiento que necesitan más poder",
    features: [
      "5 instancias de WhatsApp",
      "Generación de QR ilimitada",
      "Integración completa con GHL",
      "Webhook avanzado con retries",
      "Multi-subcuentas ilimitadas",
      "Analytics en tiempo real",
      "Soporte prioritario 24/7",
      "API access completo",
      "Automatizaciones avanzadas",
    ],
    cta: "Comenzar Ahora",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Para grandes empresas con necesidades específicas",
    features: [
      "Instancias ilimitadas",
      "Infraestructura dedicada",
      "SLA garantizado 99.9%",
      "Onboarding personalizado",
      "Gerente de cuenta dedicado",
      "Integraciones personalizadas",
      "Auditoría de seguridad",
      "Soporte white-label",
    ],
    cta: "Contactar Ventas",
    highlighted: false,
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();

  const handleCTA = (planName: string) => {
    if (planName === "Enterprise") {
      window.location.href = "mailto:sales@whatsappai.com?subject=Enterprise Plan Inquiry";
    } else {
      setLocation("/register");
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background via-card/30 to-background" data-testid="section-pricing">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
            Planes para Cada Negocio
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades. Todos incluyen 14 días de prueba gratis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 hover-elevate transition-all duration-300 relative ${
                plan.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : "border-card-border"
              }`}
              data-testid={`pricing-card-${plan.name.toLowerCase()}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-3"
                    data-testid={`feature-${index}-${featureIndex}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                size="lg"
                data-testid={`button-cta-${plan.name.toLowerCase()}`}
                onClick={() => handleCTA(plan.name)}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            ¿Necesitas ayuda para elegir? <a href="mailto:support@whatsappai.com" className="text-primary hover:underline">Contáctanos</a>
          </p>
        </div>
      </div>
    </section>
  );
}
