import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Building2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import type { Subaccount } from "@shared/schema";

export default function Step2SelectSubaccounts({ onNext }: { onNext: () => void }) {
  const { user, isLoading: userLoading } = useUser();
  const [selected, setSelected] = useState<string[]>([]);

  const { data: subaccounts = [], isLoading: subaccountsLoading, error } = useQuery<Subaccount[]>({
    queryKey: ["/api/subaccounts/user", user?.id],
    enabled: !!user?.id,
  });

  const toggleSubaccount = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    onNext();
  };

  if (userLoading || subaccountsLoading) {
    return (
      <div className="max-w-2xl mx-auto" data-testid="step-2-select-subaccounts">
        <Card className="p-8 border-card-border">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando subcuentas...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto" data-testid="step-2-select-subaccounts">
        <Card className="p-8 border-card-border">
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Error al cargar las subcuentas</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (subaccounts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto" data-testid="step-2-select-subaccounts">
        <Card className="p-8 border-card-border">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center mb-6">
                <CheckSquare className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
                Paso 2: Seleccionar Subcuentas
              </h2>
              <p className="text-muted-foreground mb-6">
                No se encontraron subcuentas vinculadas a tu cuenta de GoHighLevel
              </p>
              <Button onClick={onNext} data-testid="button-continue-to-qr">
                Continuar de todos modos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="step-2-select-subaccounts">
      <Card className="p-8 border-card-border">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center mb-6">
              <CheckSquare className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
              Paso 2: Seleccionar Subcuentas
            </h2>
            <p className="text-muted-foreground">
              Elige las subcuentas que deseas conectar con WhatsApp
            </p>
          </div>

          <div className="space-y-3">
            {subaccounts.map((subaccount) => (
              <Card
                key={subaccount.id}
                className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all border ${
                  selected.includes(subaccount.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-card-border'
                }`}
                onClick={() => toggleSubaccount(subaccount.id)}
                data-testid={`subaccount-card-${subaccount.id}`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selected.includes(subaccount.id)}
                    onCheckedChange={() => toggleSubaccount(subaccount.id)}
                    data-testid={`checkbox-subaccount-${subaccount.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <span className="font-semibold">{subaccount.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      GHL ID: {subaccount.ghlId}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinue}
              disabled={selected.length === 0}
              data-testid="button-continue-to-qr"
            >
              Continuar ({selected.length} seleccionadas)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
