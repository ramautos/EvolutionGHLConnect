import { Card } from "@/components/ui/card";
import { Smartphone, CheckCircle2, Users, Activity } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6 border-card-border">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground mb-1">{title}</div>
          <div className="text-3xl font-bold" data-testid={`stat-value-${title.toLowerCase().replace(/\s/g, '-')}`}>
            {value}
          </div>
          {trend && (
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              {trend}
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
      <StatsCard
        title="Total Instancias"
        value="12"
        icon={Smartphone}
      />
      <StatsCard
        title="Conectadas"
        value="9"
        icon={CheckCircle2}
        trend="+2 esta semana"
      />
      <StatsCard
        title="Subcuentas Activas"
        value="4"
        icon={Users}
      />
      <StatsCard
        title="Mensajes Hoy"
        value="1,234"
        icon={Activity}
        trend="+18% vs ayer"
      />
    </div>
  );
}
