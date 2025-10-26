import { Card } from "@/components/ui/card";
import { Zap, QrCode, Webhook, Users, Shield, BarChart3 } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Generación de QR Instantánea",
    description: "Crea códigos QR para conectar WhatsApp en segundos. Escanea y conecta múltiples líneas de negocio.",
  },
  {
    icon: Webhook,
    title: "Webhooks Personalizados",
    description: "Envía automáticamente los datos de conexión a tu endpoint personalizado para procesamiento instantáneo.",
  },
  {
    icon: Users,
    title: "Multi-Subcuentas GHL",
    description: "Gestiona múltiples subcuentas de GoHighLevel desde un único panel centralizado.",
  },
  {
    icon: Zap,
    title: "Detección Automática",
    description: "Detecta y captura el número de teléfono automáticamente al escanear el código QR.",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Integración oficial con Evolution API. Tus datos están protegidos con encriptación end-to-end.",
  },
  {
    icon: BarChart3,
    title: "Analytics en Tiempo Real",
    description: "Monitorea el estado de todas tus conexiones y obtén insights de rendimiento instantáneos.",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-card/30" data-testid="section-features">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
            Características Potentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Todo lo que necesitas para tener multiples WhatsApp con GoHighLevel de manera profesional
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-8 hover-elevate transition-all duration-300 border-card-border"
              data-testid={`feature-card-${index}`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
