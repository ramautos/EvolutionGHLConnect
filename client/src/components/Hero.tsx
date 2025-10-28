import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import heroImage from '@assets/generated_images/AI_WhatsApp_dashboard_hero_5c133378.png';
import { useLocation } from "wouter";

export default function Hero() {
  const [, setLocation] = useLocation();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'var(--font-accent)' }}>
              <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
                WhatsApp AI
              </span>
              <br />
              para GoHighLevel
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Conecta y automatiza WhatsApp con tu CRM GoHighLevel en 3 simples pasos. 
              Genera códigos QR, gestiona múltiples instancias de manera autonoma y facil.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="text-base px-8"
                data-testid="button-get-started"
                onClick={() => setLocation("/register")}
              >
                Comenzar Ahora
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8 gap-2"
                data-testid="button-watch-demo"
              >
                <Play className="w-4 h-4" />
                Ver Demo
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-sm">
                <div className="font-semibold text-foreground">2,000+</div>
                <div className="text-muted-foreground">Empresas activas</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">5M+</div>
                <div className="text-muted-foreground">Mensajes/mes</div>
              </div>
            </div>
          </div>
          
          <div className="relative hidden lg:block" data-testid="hero-image">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-chart-2/20 rounded-2xl blur-3xl"></div>
            <img 
              src={heroImage} 
              alt="WhatsApp AI Dashboard" 
              className="relative rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
