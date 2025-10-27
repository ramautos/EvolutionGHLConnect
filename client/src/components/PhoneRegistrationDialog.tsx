import { useState } from "react";
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
  const { toast } = useToast();
  const { refetch } = useUser();

  const updatePhoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ phoneNumber: `+${phone}` }),
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
      // Recargar el usuario para cerrar el diálogo
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Registro de Número de Teléfono</DialogTitle>
          <DialogDescription>
            Por favor registra tu número de teléfono para continuar. Este campo es obligatorio.
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
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={updatePhoneMutation.isPending}
            data-testid="button-register-phone"
          >
            {updatePhoneMutation.isPending ? "Guardando..." : "Registrar Número"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
