import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLocation } from "wouter";

const plans = [
  {
    name: "Starter",
    title: "1 Cuenta WhatsApp",
    description: "Ideal para emprendedores y pequeñas empresas",
    monthlyPrice: 10,
    annualPrice: 8,
    savings: 24,
    features: [
      "1 número de WhatsApp",
      "Mensajería ilimitada",
      "Generación de QR instantánea",
      "Webhooks seguros",
      "Integrado en panel GHL",
      "OpenAI - Transcripción de audio",
      "ElevenLabs - Envío de audio en chat",
      "Etiquetas con palabras clave",
      "Envío de notificaciones",
      "Notificación de desconexión",
      "Conexión cifrada",
      "Grupos de WhatsApp",
    ],
    highlighted: false,
  },
  {
    name: "Profesional",
    title: "3 Cuentas WhatsApp",
    description: "Perfecto para agencias y equipos de ventas",
    monthlyPrice: 20,
    annualPrice: 15,
    savings: 60,
    features: [
      "3 números de WhatsApp",
      "Mensajería ilimitada",
      "Generación de QR instantánea",
      "Webhooks seguros",
      "Multi-subcuentas GHL",
      "Analytics en tiempo real",
      "OpenAI - Transcripción de audio",
      "ElevenLabs - Envío de audio en chat",
      "Etiquetas con palabras clave",
      "Envío de notificaciones",
      "Notificación de desconexión",
      "Conexión cifrada",
      "Grupos de WhatsApp",
      "Soporte prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    title: "5 Cuentas WhatsApp",
    description: "Para empresas que necesitan escalar operaciones",
    monthlyPrice: 30,
    annualPrice: 25,
    savings: 60,
    features: [
      "5 números de WhatsApp",
      "Mensajería ilimitada",
      "Generación de QR instantánea",
      "Webhooks seguros avanzados",
      "Multi-subcuentas GHL ilimitadas",
      "Analytics avanzados + reportes",
      "API personalizada",
      "OpenAI - Transcripción de audio",
      "ElevenLabs - Envío de audio en chat",
      "Revender subcuentas",
      "Etiquetas con palabras clave",
      "Envío de notificaciones",
      "Notificación de desconexión",
      "Conexión cifrada",
      "Grupos de WhatsApp",
      "Soporte VIP 24/7",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  return (
    <section className="py-20 bg-muted/30" data-testid="section-pricing">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
            Planes{" "}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              Simples
            </span>{" "}
            y Transparentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escoge el plan perfecto para tu negocio. Todos incluyen integración con OpenAI para transcripción de audio y ElevenLabs para envío de audio.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex gap-0 bg-card p-1 rounded-xl shadow-md border border-border">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all relative ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-r from-primary to-chart-2 text-white shadow-md"
                  : "text-muted-foreground hover-elevate"
              }`}
              data-testid="toggle-monthly"
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all relative ${
                billingPeriod === "annual"
                  ? "bg-gradient-to-r from-primary to-chart-2 text-white shadow-md"
                  : "text-muted-foreground hover-elevate"
              }`}
              data-testid="toggle-annual"
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-chart-2 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                Ahorra 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {plans.map((plan, index) => {
            const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
            
            return (
              <div
                key={index}
                className={`group relative rounded-3xl border-2 transition-all duration-300 flex flex-col ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-primary to-chart-2 text-white border-primary shadow-xl scale-105 hover:scale-110"
                    : "bg-card border-border hover:-translate-y-3 hover:border-primary hover:shadow-2xl overflow-hidden"
                }`}
                style={{
                  animation: `fadeInUp 0.6s ease-out ${0.1 + index * 0.1}s forwards`,
                  opacity: 0,
                }}
                data-testid={`pricing-card-${plan.name.toLowerCase()}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-6 right-6 bg-white/25 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide">
                    🔥 Más Popular
                  </div>
                )}

                {!plan.highlighted && (
                  <div
                    className="absolute top-0 left-0 w-full h-1 rounded-t-3xl transition-all duration-400 bg-gradient-to-r from-primary to-chart-2 scale-x-0 group-hover:scale-x-100"
                  />
                )}
                
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-white" />
                )}
                
                <div className="p-8 flex flex-col flex-1">

                <div className="mb-6">
                  <div
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      plan.highlighted ? "text-white/85" : "text-muted-foreground"
                    }`}
                  >
                    {plan.name}
                  </div>
                  <h3 className={`text-3xl font-black mb-2 ${
                    plan.highlighted 
                      ? "" 
                      : "bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent"
                  }`}>
                    {plan.title}
                  </h3>
                  <p
                    className={`text-sm ${
                      plan.highlighted ? "text-white/90" : "text-muted-foreground"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`py-8 my-8 border-t border-b text-center ${
                    plan.highlighted ? "border-white/20" : "border-border"
                  }`}
                >
                  <div className="flex items-baseline justify-center gap-1 mb-3">
                    <span className="text-3xl font-extrabold">$</span>
                    <span className="text-7xl font-black leading-none">{price}</span>
                    <span
                      className={`text-lg font-medium ${
                        plan.highlighted ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      USD / mes
                    </span>
                  </div>
                  {billingPeriod === "annual" && (
                    <div className="flex justify-center">
                      <div
                        className={`inline-block px-4 py-2 rounded-lg text-xs font-bold ${
                          plan.highlighted
                            ? "bg-white/20 text-white"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        Ahorras ${plan.savings} USD al año
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3 text-sm"
                      data-testid={`feature-${index}-${featureIndex}`}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.highlighted
                            ? "bg-white text-primary"
                            : "bg-primary text-white"
                        }`}
                      >
                        <Check className="w-3 h-3 font-bold" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                  <Button
                    className="w-full py-6 text-base font-bold rounded-xl transition-all mt-auto bg-foreground text-background hover:bg-primary hover:text-white hover:shadow-xl"
                    data-testid={`button-cta-${plan.name.toLowerCase()}`}
                    onClick={() => setLocation("/register")}
                  >
                    Prueba gratis
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center p-10 bg-card border-2 border-dashed border-primary/40 rounded-2xl">
          <div className="text-2xl font-extrabold mb-3">💡 ¿Necesitas más cuentas?</div>
          <div className="text-5xl font-black text-primary my-5">$5 USD</div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Agrega cuentas adicionales de WhatsApp a cualquier plan por solo $5 USD por cuenta adicional.
            Sin límites, escala según tus necesidades.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
