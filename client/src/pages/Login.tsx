import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import googleLogo from "@assets/png-clipart-google-search-google-account-google-s-google-play-google-company-text-thumbnail_1762396802267.png";

export default function Login() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Error al iniciar sesión");
      }

      // Login exitoso - redirect inmediato a dashboard (v2.0)
      console.log("Login exitoso, redirigiendo...");
      window.location.href = "/dashboard";
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error de autenticación",
        description: error.message || "Email o contraseña incorrectos",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-chart-2/5 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px]" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo y Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-2">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
            Iniciar Sesión
          </h1>
          <p className="mt-2 text-muted-foreground">
            Accede a tu cuenta de WhatsApp AI Platform
          </p>
        </div>

        {/* Formulario */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Ingresa tus credenciales</CardTitle>
            <CardDescription>
              Usa tu email y contraseña para acceder
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-email"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña *</Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                    data-testid="link-forgot-password"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-password"
                  autoComplete="current-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                data-testid="button-google-login"
              >
                <img src={googleLogo} alt="Google" className="mr-2 h-4 w-4" />
                Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <a
                  href="/register"
                  className="font-medium text-primary hover:underline"
                  data-testid="link-register"
                >
                  Regístrate aquí
                </a>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <a href="#" className="underline hover:text-foreground">
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a href="#" className="underline hover:text-foreground">
            Política de Privacidad
          </a>
        </p>
      </div>
    </div>
  );
}
