import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneRegistrationDialogProps {
  isOpen: boolean;
}

export function PhoneRegistrationDialog({ isOpen }: PhoneRegistrationDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [canSkip, setCanSkip] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const { toast } = useToast();
  const { refetch } = useUser();

  const updatePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ phone: `+${phone}` }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error al actualizar el perfil");
      }
      return response.json();
    },
    onSuccess: async () => {
      await refetch();
      toast({
        title: "¡Número registrado!",
        description: "Tu número de teléfono ha sido guardado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el número de teléfono",
      });
    },
  });

  const skipPhoneMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ phone: "SKIP" }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Error al actualizar el perfil");
      }
      return response.json();
    },
    onSuccess: async () => {
      await refetch();
      toast({
        title: "Registro pospuesto",
        description: "Podrás agregar tu número de teléfono más tarde en tu perfil.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un número de teléfono válido",
      });
      return;
    }
    updatePhoneMutation.mutate(phoneNumber);
  };

  const handleSkip = () => {
    skipPhoneMutation.mutate();
  };

  // Controlar el countdown cuando el diálogo está abierto
  useEffect(() => {
    if (!isOpen) {
      // Resetear el estado cuando se cierra
      setCountdown(3);
      setCanSkip(false);
      return;
    }

    // El diálogo acaba de abrirse, iniciar el countdown
    setCountdown(3);
    setCanSkip(false);

    // Crear el intervalo para el countdown
    let currentCount = 3;
    const interval = setInterval(() => {
      currentCount--;
      if (currentCount >= 0) {
        setCountdown(currentCount);
      }
      if (currentCount === 0) {
        setCanSkip(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registro de Número de Teléfono</DialogTitle>
          <DialogDescription>
            Por favor registra tu número de teléfono. Podrás agregarlo más tarde si lo prefieres.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Teléfono</Label>
            <PhoneInput
              country="do"
              value={phoneNumber}
              onChange={(phone) => setPhoneNumber(phone)}
              inputProps={{
                id: "phone",
                name: "phone",
                required: true,
                "data-testid": "input-phone-number",
              }}
              containerClass="w-full"
              inputClass="w-full"
              enableSearch
              searchPlaceholder="Buscar país..."
              preferredCountries={["do", "us", "mx", "co", "ve"]}
              countryCodeEditable={false}
              enableAreaCodes={true}
              disableCountryGuess={false}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={updatePhoneMutation.isPending}
              data-testid="button-register-phone"
            >
              {updatePhoneMutation.isPending ? "Guardando..." : "Registrar Número"}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              disabled={!canSkip || skipPhoneMutation.isPending}
              data-testid="button-skip-phone"
            >
              {skipPhoneMutation.isPending 
                ? "Procesando..." 
                : canSkip 
                  ? "Agregar luego" 
                  : `Agregar luego (${countdown}s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
