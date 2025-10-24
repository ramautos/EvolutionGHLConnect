import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
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
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors" data-testid="nav-features">
                Características
              </a>
              <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors" data-testid="nav-how-it-works">
                Cómo Funciona
              </a>
              <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors" data-testid="nav-testimonials">
                Testimonios
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" data-testid="button-nav-login" onClick={() => setLocation("/dashboard")}>
                Iniciar Sesión
              </Button>
              <Button size="sm" data-testid="button-nav-signup" onClick={() => setLocation("/onboarding")}>
                Comenzar Gratis
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="pt-20">
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        
        <section className="py-32 bg-gradient-to-br from-primary/10 via-chart-2/10 to-background">
          <div className="container mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-accent)' }}>
              ¿Listo para Automatizar WhatsApp?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a más de 2,000 empresas que ya están usando nuestra plataforma
            </p>
            <Button size="lg" className="px-8" data-testid="button-final-cta" onClick={() => setLocation("/onboarding")}>
              Comenzar Ahora - Es Gratis
            </Button>
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
  );
}
