import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, ChevronRight, Loader2 } from "lucide-react";

interface GhlLocation {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

export default function Step2SelectLocations({ 
  onNext, 
  companyId 
}: { 
  onNext: (selectedLocations: string[]) => void;
  companyId?: string;
}) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const { data: locations = [], isLoading } = useQuery<GhlLocation[]>({
    queryKey: ["/api/ghl/locations", companyId],
    enabled: !!companyId,
  });

  const handleToggleLocation = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleContinue = () => {
    if (selectedLocations.length > 0) {
      onNext(selectedLocations);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto" data-testid="step-2-select-locations">
        <Card className="p-8 border-card-border">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando tus locations de GoHighLevel...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="step-2-select-locations">
      <Card className="p-8 border-card-border">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-accent)' }}>
              Paso 2: Selecciona Locations
            </h2>
            <p className="text-muted-foreground">
              Elige las subcuentas donde quieres activar WhatsApp
            </p>
          </div>

          {locations.length === 0 ? (
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                No se encontraron locations. Asegúrate de haber instalado la app en tu cuenta de GoHighLevel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => handleToggleLocation(location.id)}
                  data-testid={`location-item-${location.id}`}
                >
                  <Checkbox
                    checked={selectedLocations.includes(location.id)}
                    onCheckedChange={() => handleToggleLocation(location.id)}
                    data-testid={`checkbox-location-${location.id}`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{location.name}</div>
                    {(location.city || location.state) && (
                      <div className="text-sm text-muted-foreground">
                        {[location.city, location.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleContinue}
              disabled={selectedLocations.length === 0}
              data-testid="button-continue-to-qr"
            >
              Continuar con {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Puedes agregar más locations después desde el dashboard
          </p>
        </div>
      </Card>
    </div>
  );
}
