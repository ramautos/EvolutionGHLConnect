import { Link } from "wouter";
import { FileText, Scale, Ban, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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
      <section className="py-20 bg-gradient-to-br from-chart-2/5 via-primary/5 to-background">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-chart-2/10 text-chart-2 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Scale className="w-4 h-4" />
            Vigente desde: Noviembre 2025
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-6">
            Términos y{" "}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              Condiciones
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Acuerdo legal que gobierna el uso de nuestra plataforma de integración WhatsApp-GoHighLevel.
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
                Al acceder y usar <strong>WhatsApp AI</strong>, aceptas estos Términos y Condiciones. 
                Si no estás de acuerdo, por favor no utilices nuestros servicios.
              </p>
            </div>

            {/* Sección 1 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">1. Descripción del Servicio</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      WhatsApp AI es una plataforma SaaS multi-tenant que integra WhatsApp Business con GoHighLevel CRM, 
                      ofreciendo:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Gestión automatizada de instancias de WhatsApp vía Evolution API</li>
                      <li>Sincronización bidireccional con GoHighLevel (OAuth 2.0)</li>
                      <li>Sistema de triggers ilimitados por subcuenta</li>
                      <li>Transcripciones de audio con Gemini AI</li>
                      <li>Envío de mensajes de voz con ElevenLabs</li>
                      <li>Notificaciones de desconexión de WhatsApp</li>
                      <li>Panel administrativo para gestión jerárquica de empresas</li>
                      <li>Facturación con Stripe (Starter, Professional, Business)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">2. Registro y Cuenta</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">2.1 Requisitos de Registro</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Debes tener al menos 18 años de edad</li>
                        <li>Proporcionar información verídica y actualizada</li>
                        <li>Registrar un número de teléfono válido (obligatorio)</li>
                        <li>Crear contraseña segura o usar Google OAuth 2.0</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">2.2 Seguridad de Cuenta</h3>
                      <p>
                        Eres responsable de mantener la confidencialidad de tus credenciales. 
                        Notifícanos inmediatamente si detectas acceso no autorizado.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">2.3 Tipos de Cuenta</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Usuario:</strong> Acceso a subcuentas propias</li>
                        <li><strong>Admin:</strong> Gestión completa del sistema (invitación únicamente)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">3. Planes y Facturación</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">3.1 Período de Prueba</h3>
                      <p>
                        Todas las cuentas nuevas incluyen <strong>7 días de prueba gratuita</strong>. 
                        No se requiere tarjeta de crédito durante el período de prueba.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">3.2 Planes Disponibles</h3>
                      <div className="grid md:grid-cols-3 gap-4 mt-3">
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                          <h4 className="font-bold text-foreground mb-2">Starter</h4>
                          <p className="text-2xl font-black text-primary mb-1">$8 USD/mes</p>
                          <p className="text-sm">1 instancia WhatsApp</p>
                        </div>
                        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
                          <h4 className="font-bold text-foreground mb-2">Professional 🔥</h4>
                          <p className="text-2xl font-black text-primary mb-1">$15 USD/mes</p>
                          <p className="text-sm">3 instancias WhatsApp</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                          <h4 className="font-bold text-foreground mb-2">Business</h4>
                          <p className="text-2xl font-black text-primary mb-1">$25 USD/mes</p>
                          <p className="text-sm">5 instancias + $5/extra</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">3.3 Facturación y Pagos</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Facturación mensual automática vía Stripe</li>
                        <li>Cambio de plan permitido en cualquier momento (prorrateado)</li>
                        <li>Reembolsos disponibles dentro de 14 días (ver política de reembolsos)</li>
                        <li>Plan Business: instancias adicionales cobradas mensualmente</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">3.4 Suspensión por Falta de Pago</h3>
                      <p>
                        Si el pago falla, tu cuenta será suspendida después de 3 intentos (7 días). 
                        Las instancias de WhatsApp se desconectarán automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ban className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">4. Uso Prohibido</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="font-semibold text-foreground">No está permitido usar WhatsApp AI para:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Enviar spam, mensajes no solicitados o contenido ilegal</li>
                      <li>Violar políticas de WhatsApp Business API</li>
                      <li>Compartir credenciales de cuenta con terceros</li>
                      <li>Realizar ingeniería inversa de la plataforma</li>
                      <li>Automatizar acciones que violen términos de GoHighLevel</li>
                      <li>Usar números de WhatsApp no autorizados o robados</li>
                      <li>Realizar ataques DDoS o intentos de hacking</li>
                    </ul>
                    <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mt-4">
                      <p className="text-destructive font-semibold">
                        ⚠️ Advertencia: El incumplimiento resultará en suspensión inmediata de la cuenta sin reembolso.
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
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">5. Responsabilidades del Usuario</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Cumplimiento Legal:</strong> Cumplir con leyes locales sobre privacidad y comunicaciones.</li>
                      <li><strong>WhatsApp Business:</strong> Respetar términos de WhatsApp Business Platform.</li>
                      <li><strong>GoHighLevel:</strong> Mantener cuenta GHL activa para integración OAuth.</li>
                      <li><strong>API Keys:</strong> Proporcionar tus propias API keys de ElevenLabs y Gemini (opcional).</li>
                      <li><strong>Backups:</strong> Realizar respaldos propios de datos críticos.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 6 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">6. Limitación de Responsabilidad</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      WhatsApp AI se proporciona <strong>"tal cual"</strong> sin garantías. No nos hacemos responsables de:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Interrupciones de servicio por mantenimiento o terceros (Evolution API, WhatsApp, GHL)</li>
                      <li>Pérdida de datos causada por fallas de terceros</li>
                      <li>Bloqueos de números de WhatsApp por incumplimiento de políticas</li>
                      <li>Daños indirectos, lucro cesante o pérdida de ingresos</li>
                      <li>Uso indebido de API keys de terceros (ElevenLabs, Gemini)</li>
                    </ul>
                    <p className="mt-4">
                      <strong>Límite máximo de responsabilidad:</strong> Monto pagado en los últimos 12 meses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 7 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">7. Cancelación y Terminación</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">7.1 Cancelación por el Usuario</h3>
                      <p>
                        Puedes cancelar tu suscripción en cualquier momento desde el panel de facturación. 
                        Mantendrás acceso hasta el final del período facturado.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">7.2 Terminación por Incumplimiento</h3>
                      <p>
                        Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos, 
                        sin previo aviso ni reembolso.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">7.3 Eliminación de Datos</h3>
                      <p>
                        Tras la cancelación, tus datos se eliminarán en 30 días (excepto obligaciones legales). 
                        Los backups se eliminan automáticamente después de 90 días.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 8 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scale className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">8. Modificaciones</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                      Los cambios se notificarán por email con 30 días de antelación.
                    </p>
                    <p>
                      El uso continuado del servicio después de los cambios constituye aceptación de los nuevos términos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-gradient-to-br from-chart-2/10 to-primary/10 border-2 border-chart-2/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">¿Preguntas Legales?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Para consultas sobre estos términos, contáctanos en:
              </p>
              <a 
                href="mailto:legal@whatsappai.com" 
                className="inline-flex items-center gap-2 bg-chart-2 text-white px-6 py-3 rounded-xl font-semibold hover:bg-chart-2/90 transition-colors"
                data-testid="link-email-legal"
              >
                <FileText className="w-5 h-5" />
                legal@whatsappai.com
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
