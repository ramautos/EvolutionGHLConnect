import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, QrCode, Power, Trash2 } from "lucide-react";

interface InstanceCardProps {
  instanceName: string;
  phoneNumber?: string;
  status: "created" | "connecting" | "connected" | "disconnected";
  onGenerateQR: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}

const statusConfig = {
  created: { label: "Creado", color: "bg-muted text-muted-foreground" },
  connecting: { label: "Conectando", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  connected: { label: "Conectado", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  disconnected: { label: "Desconectado", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

export default function InstanceCard({
  instanceName,
  phoneNumber,
  status,
  onGenerateQR,
  onDisconnect,
  onDelete,
}: InstanceCardProps) {
  const statusStyle = statusConfig[status];
  
  return (
    <Card className="p-6 border-card-border hover-elevate" data-testid="instance-card">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid="instance-name">{instanceName}</h3>
              {phoneNumber ? (
                <div className="text-sm text-muted-foreground" data-testid="instance-phone">
                  {phoneNumber}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sin conectar</div>
              )}
            </div>
          </div>
          
          <Badge className={`${statusStyle.color} border-0`} data-testid="instance-status">
            {statusStyle.label}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {status === "connected" ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={onDisconnect}
                data-testid="button-disconnect"
              >
                <Power className="w-4 h-4" />
                Desconectar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                className="flex-1 gap-2"
                onClick={onGenerateQR}
                data-testid="button-generate-qr"
              >
                <QrCode className="w-4 h-4" />
                Generar QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
