import { Link } from "wouter";
import { Shield, Lock, Eye, Database, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
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
            <Shield className="w-4 h-4" />
            Actualizado: Noviembre 2025
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-6">
            Política de{" "}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              Privacidad
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tu privacidad y seguridad son nuestra prioridad. Conoce cómo protegemos y utilizamos tu información.
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
                En <strong>WhatsApp AI</strong>, nos comprometemos a proteger tu privacidad y datos personales. 
                Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y compartimos tu información 
                cuando utilizas nuestra plataforma de integración WhatsApp-GoHighLevel CRM.
              </p>
            </div>

            {/* Sección 1 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">1. Información que Recopilamos</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">1.1 Información de Cuenta</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Nombre completo y correo electrónico</li>
                        <li>Número de teléfono para notificaciones</li>
                        <li>Contraseña cifrada (bcrypt)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">1.2 Información de Integración</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Tokens OAuth de GoHighLevel</li>
                        <li>Location ID y datos de subcuentas GHL</li>
                        <li>API Keys de ElevenLabs y Gemini (encriptadas)</li>
                        <li>Configuración de webhooks</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">1.3 Datos de WhatsApp</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Números de WhatsApp conectados</li>
                        <li>Estado de conexión (conectado/desconectado)</li>
                        <li>Metadatos de mensajes (no contenido)</li>
                        <li>QR codes temporales para vinculación</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">2. Cómo Usamos tu Información</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Provisión del Servicio:</strong> Gestionar instancias de WhatsApp, sincronización con GoHighLevel, transcripciones de audio.</li>
                      <li><strong>Autenticación y Seguridad:</strong> Validar tu identidad mediante Passport.js (Local + Google OAuth).</li>
                      <li><strong>Facturación:</strong> Procesar pagos con Stripe, gestionar planes (Starter, Professional, Business).</li>
                      <li><strong>Notificaciones:</strong> Enviar alertas de desconexión de WhatsApp vía SMS/email.</li>
                      <li><strong>Mejoras del Producto:</strong> Analizar uso anónimo para optimizar funcionalidades.</li>
                      <li><strong>Cumplimiento Legal:</strong> Responder a solicitudes gubernamentales legítimas.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">3. Seguridad de Datos</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">🔐 Cifrado</h4>
                        <p className="text-sm">Contraseñas con bcrypt, API keys encriptadas, conexión HTTPS/TLS.</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">🗄️ Base de Datos</h4>
                        <p className="text-sm">PostgreSQL (Neon) con backups automáticos y aislamiento de datos.</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">🔑 Control de Acceso</h4>
                        <p className="text-sm">RBAC (Role-Based Access Control) con roles user/admin.</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">🛡️ Sesiones</h4>
                        <p className="text-sm">HttpOnly cookies con expiración automática.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">4. Compartición de Datos</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      <strong>NO vendemos</strong> tus datos personales. Solo compartimos información con:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Proveedores de Servicios:</strong> Stripe (pagos), Neon (database), Evolution API (WhatsApp), ElevenLabs, Gemini.</li>
                      <li><strong>GoHighLevel:</strong> Datos de Location ID y tokens OAuth para sincronización CRM.</li>
                      <li><strong>Autoridades Legales:</strong> Cuando lo requiera la ley (orden judicial, citación).</li>
                    </ul>
                    <p className="mt-4 bg-primary/10 p-4 rounded-lg border border-primary/20">
                      ⚠️ <strong>Importante:</strong> API keys de terceros (ElevenLabs, Gemini) NUNCA son expuestas al cliente. 
                      Solo retornamos flags booleanos (<code>hasElevenLabsKey</code>, <code>hasGeminiKey</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">5. Tus Derechos</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>Tienes derecho a:</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span><strong>Acceder</strong> a tus datos personales</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span><strong>Rectificar</strong> información incorrecta</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span><strong>Eliminar</strong> tu cuenta y datos</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span><strong>Exportar</strong> datos en formato estructurado</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span><strong>Revocar</strong> consentimiento en cualquier momento</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span><strong>Oponerte</strong> al procesamiento de datos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 6 */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">6. Retención de Datos</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Cuentas Activas:</strong> Retenemos datos mientras tu cuenta esté activa.</li>
                      <li><strong>Cuentas Canceladas:</strong> Eliminación completa en 30 días (excepto obligaciones legales/fiscales).</li>
                      <li><strong>Backups:</strong> Datos en backups se eliminan automáticamente después de 90 días.</li>
                      <li><strong>Logs del Sistema:</strong> Se retienen por 12 meses para auditoría de seguridad.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-2 border-primary/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">¿Preguntas sobre tu Privacidad?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Si tienes dudas sobre esta política o deseas ejercer tus derechos, contáctanos:
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <a 
                  href="mailto:soporte@cloude.es" 
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  data-testid="link-email-privacy"
                >
                  <Mail className="w-5 h-5" />
                  soporte@cloude.es
                </a>
              </div>
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
