import { Card } from "@/components/ui/card";
import { Download, CheckSquare, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Instala la App de GHL",
    description: "Conecta tu cuenta de GoHighLevel con un solo clic. Instalación automática en segundos.",
    color: "from-chart-1 to-chart-2",
  },
  {
    number: "02",
    icon: CheckSquare,
    title: "Selecciona Subcuentas",
    description: "Elige las subcuentas que quieres vincular. Gestiona múltiples líneas de negocio fácilmente.",
    color: "from-chart-2 to-chart-3",
  },
  {
    number: "03",
    icon: ScanLine,
    title: "Escanea el QR",
    description: "Genera el código QR y escanéalo con WhatsApp. El número se detecta y envía automáticamente a tu webhook.",
    color: "from-chart-3 to-chart-4",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24" data-testid="section-how-it-works">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
            Cómo Funciona
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conecta WhatsApp con GoHighLevel en solo 3 pasos simples
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="p-8 relative overflow-hidden border-card-border hover-elevate transition-all duration-300"
              data-testid={`step-card-${index}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${step.color} opacity-10 rounded-full blur-2xl`}></div>
              
              <div className="relative">
                <div className="text-6xl font-bold text-muted/20 mb-4" style={{ fontFamily: 'var(--font-accent)' }}>
                  {step.number}
                </div>
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" className="px-8" data-testid="button-start-setup">
            Comenzar Configuración
          </Button>
        </div>
      </div>
    </section>
  );
}
