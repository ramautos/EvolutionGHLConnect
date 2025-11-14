import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
                WhatsApp AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatización inteligente de WhatsApp para GoHighLevel
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Producto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-features">Características</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-pricing">Precios</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-docs">Documentación</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-api">API</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-about">Nosotros</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-blog">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-contact">Contacto</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-support">Soporte</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recibe actualizaciones y tips de automatización
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="tu@email.com"
                className="h-10"
                data-testid="input-newsletter-email"
              />
              <Button size="sm" className="px-4" data-testid="button-subscribe">
                Enviar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>© 2025 WhatsApp AI. Todos los derechos reservados.</div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-privacy">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-terms">
                Términos
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-cookies">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
