import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Building2 } from "lucide-react";
import { useState } from "react";

// todo: remove mock functionality
const mockSubaccounts = [
  { id: "1", name: "Agencia Principal", locationCount: 12 },
  { id: "2", name: "Departamento de Ventas", locationCount: 8 },
  { id: "3", name: "Soporte al Cliente", locationCount: 5 },
  { id: "4", name: "Marketing Digital", locationCount: 15 },
];

export default function Step2SelectSubaccounts({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  
  const toggleSubaccount = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
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
            {mockSubaccounts.map((subaccount) => (
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
                      {subaccount.locationCount} ubicaciones
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
              onClick={onNext}
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
