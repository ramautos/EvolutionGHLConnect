import { useState } from "react";
import DashboardStats from "@/components/DashboardStats";
import InstanceCard from "@/components/InstanceCard";
import QRModal from "@/components/QRModal";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Settings } from "lucide-react";

// todo: remove mock functionality
const mockInstances = [
  { id: "1", instanceName: "Agencia Principal", phoneNumber: "+1 (555) 123-4567", status: "connected" as const },
  { id: "2", instanceName: "Ventas Departamento", phoneNumber: "+1 (555) 987-6543", status: "connected" as const },
  { id: "3", instanceName: "Soporte Cliente", status: "created" as const },
  { id: "4", instanceName: "Marketing Team", status: "connecting" as const },
];

export default function Dashboard() {
  const [instances, setInstances] = useState(mockInstances);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [phoneDetected, setPhoneDetected] = useState<string>();
  
  const handleGenerateQR = (id: string) => {
    setSelectedInstance(id);
    setQrModalOpen(true);
    setPhoneDetected(undefined);
    
    // Simulate phone detection
    setTimeout(() => {
      setPhoneDetected("+1 (555) 999-8888");
    }, 3000);
  };
  
  const handleDisconnect = (id: string) => {
    setInstances(prev =>
      prev.map(inst =>
        inst.id === id ? { ...inst, status: "disconnected" as const, phoneNumber: undefined } : inst
      )
    );
  };
  
  const handleDelete = (id: string) => {
    setInstances(prev => prev.filter(inst => inst.id !== id));
  };
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/30 backdrop-blur-lg">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
                WhatsApp AI
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" data-testid="button-settings">
                <Settings className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-6 lg:px-12 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-accent)' }}>
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Gestiona tus instancias de WhatsApp
              </p>
            </div>
            <Button className="gap-2" data-testid="button-add-instance">
              <Plus className="w-5 h-5" />
              Nueva Instancia
            </Button>
          </div>
          
          <DashboardStats />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Instancias de WhatsApp</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instanceName={instance.instanceName}
                phoneNumber={instance.phoneNumber}
                status={instance.status}
                onGenerateQR={() => handleGenerateQR(instance.id)}
                onDisconnect={() => handleDisconnect(instance.id)}
                onDelete={() => handleDelete(instance.id)}
              />
            ))}
          </div>
        </div>
      </div>
      
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrValue="https://wa.me/qr/SAMPLE123456"
        isScanning={!phoneDetected}
        phoneDetected={phoneDetected}
      />
    </div>
  );
}
