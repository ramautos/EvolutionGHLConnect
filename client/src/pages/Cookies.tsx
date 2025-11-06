import { Link } from "wouter";
import { Cookie, Settings, BarChart, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold">WhatsApp AI</span>
            </div>
          </Link>
          <Link href="/login">
            <Button variant="outline" data-testid="button-login">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </header>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-chart-2/5 to-background">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Cookie className="w-4 h-4" />
            Actualizado: Noviembre 2025
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-6">
            Política de{" "}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              Cookies
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Información sobre cómo usamos cookies y tecnologías similares en WhatsApp AI.
          </p>
        </div>
      </section>
      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <div className="space-y-12">
            {/* Introducción */}
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed">
                WhatsApp AI utiliza cookies y tecnologías similares para mejorar tu experiencia, 
                mantener tu sesión activa y analizar el uso de nuestra plataforma. 
                Esta política explica qué son las cookies, cómo las usamos y tus opciones.
              </p>
            </div>

            {/* Sección 1 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">1. ¿Qué son las Cookies?</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio web. 
                      Permiten que el sitio recuerde tus preferencias y acciones durante un período de tiempo.
                    </p>
                    <div className="bg-muted/30 p-4 rounded-lg mt-4">
                      <p className="text-sm">
                        <strong>Ejemplo:</strong> Una cookie de sesión recuerda que iniciaste sesión, 
                        evitando que tengas que autenticarte en cada página que visites.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">2. Tipos de Cookies que Usamos</h2>
                  <div className="space-y-6 text-muted-foreground">
                    
                    {/* Cookies Esenciales */}
                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-foreground text-lg">2.1 Cookies Esenciales</h3>
                      </div>
                      <p className="mb-3">
                        Son necesarias para que la plataforma funcione correctamente. <strong>No se pueden desactivar</strong>.
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Mantienen tu sesión activa mientras usas la plataforma</li>
                        <li>Protegen tu cuenta contra accesos no autorizados</li>
                        <li>Recuerdan tus preferencias de visualización</li>
                      </ul>
                      <div className="mt-3 text-sm bg-background/50 p-3 rounded-lg">
                        <strong>Duración:</strong> Se eliminan al cerrar sesión o tu navegador
                      </div>
                    </div>

                    {/* Cookies de Funcionalidad */}
                    <div className="bg-chart-2/5 p-5 rounded-xl border border-chart-2/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-chart-2 rounded-lg flex items-center justify-center">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-foreground text-lg">2.2 Cookies de Funcionalidad</h3>
                      </div>
                      <p className="mb-3">
                        Mejoran tu experiencia recordando tus preferencias personales.
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Tu idioma preferido</li>
                        <li>Si prefieres el tema claro u oscuro</li>
                        <li>Cómo organizas tu panel de control</li>
                      </ul>
                      <div className="mt-3 text-sm bg-background/50 p-3 rounded-lg">
                        <strong>Duración:</strong> Hasta 1 año
                      </div>
                    </div>

                    {/* Cookies de Análisis */}
                    <div className="bg-muted/30 p-5 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-primary/50 rounded-lg flex items-center justify-center">
                          <BarChart className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-foreground text-lg">2.3 Cookies de Análisis</h3>
                      </div>
                      <p className="mb-3">
                        Nos ayudan a mejorar la plataforma entendiendo cómo la usas. <strong>Son opcionales y puedes desactivarlas</strong>.
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Qué páginas visitas más frecuentemente</li>
                        <li>Qué funciones usas con mayor frecuencia</li>
                        <li>Cuánto tiempo pasas en diferentes secciones</li>
                      </ul>
                      <div className="mt-3 text-sm bg-background/50 p-3 rounded-lg">
                        <strong>Duración:</strong> Hasta 2 años
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">3. Cookies de Terceros</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Trabajamos con servicios externos confiables que pueden usar sus propias cookies:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Procesador de Pagos:</strong> Para gestionar tus suscripciones de forma segura</li>
                      <li><strong>Servicios de Autenticación:</strong> Para que puedas iniciar sesión con tu cuenta de Google</li>
                      <li><strong>Herramientas de CRM:</strong> Para sincronizar tus datos con GoHighLevel</li>
                      <li><strong>Servicios de Análisis:</strong> Para entender cómo mejorar la plataforma</li>
                    </ul>
                    <p className="mt-4 text-sm">
                      Estos servicios tienen sus propias políticas de privacidad que puedes consultar en sus sitios web.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">4. Gestión de Cookies</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">4.1 Configuración en WhatsApp AI</h3>
                      <p>
                        Puedes gestionar tus preferencias de cookies desde tu panel de usuario en: 
                        <strong className="text-foreground"> Configuración → Privacidad → Cookies</strong>
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">4.2 Configuración en tu Navegador</h3>
                      <p className="mb-3">
                        Todos los navegadores permiten controlar cookies. Instrucciones para navegadores populares:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                        <li><strong>Firefox:</strong> Preferencias → Privacidad → Cookies</li>
                        <li><strong>Safari:</strong> Preferencias → Privacidad → Bloquear cookies</li>
                        <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
                      </ul>
                    </div>
                    <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mt-4">
                      <p className="text-destructive font-semibold">
                        ⚠️ Advertencia: Bloquear cookies esenciales puede afectar el funcionamiento de la plataforma 
                        (no podrás iniciar sesión).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">5. Do Not Track (DNT)</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Respetamos la señal "Do Not Track" de tu navegador. Si la activas:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>No se instalarán cookies de análisis (Google Analytics)</li>
                      <li>No se rastreará tu comportamiento en la plataforma</li>
                      <li>Las cookies esenciales seguirán funcionando (necesarias para el servicio)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 6 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">6. Actualizaciones de esta Política</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Podemos actualizar esta política de cookies periódicamente. Los cambios se publicarán en esta página 
                      con la fecha de "Última actualización" modificada.
                    </p>
                    <p>
                      Te notificaremos sobre cambios significativos por email o mediante un aviso destacado en la plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-2 border-primary/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">¿Preguntas sobre Cookies?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Si tienes dudas sobre nuestra política de cookies, contáctanos:
              </p>
              <a 
                href="mailto:soporte@cloude.es" 
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                data-testid="link-email-cookies"
              >
                <Cookie className="w-5 h-5" />
                soporte@cloude.es
              </a>
              <p className="text-sm text-muted-foreground mt-6">
                Última actualización: 6 de noviembre de 2025
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
