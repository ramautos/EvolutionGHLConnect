import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  Building,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalSubaccounts: number;
  totalInstances: number;
  connectedInstances: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vista general del sistema</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Empresas",
      value: stats?.totalCompanies || 0,
      description: `${stats?.activeCompanies || 0} activas`,
      icon: Building2,
      trend: "up",
      trendValue: "+12%",
    },
    {
      title: "Total Usuarios",
      value: stats?.totalUsers || 0,
      description: "Usuarios registrados",
      icon: Users,
      trend: "up",
      trendValue: "+8%",
    },
    {
      title: "Subcuentas",
      value: stats?.totalSubaccounts || 0,
      description: "Locations activas",
      icon: Building,
      trend: "up",
      trendValue: "+15%",
    },
    {
      title: "Instancias",
      value: stats?.totalInstances || 0,
      description: `${stats?.connectedInstances || 0} conectadas`,
      icon: Activity,
      trend: stats?.connectedInstances && stats?.totalInstances 
        ? (stats.connectedInstances / stats.totalInstances > 0.7 ? "up" : "down")
        : "neutral",
      trendValue: stats?.connectedInstances && stats?.totalInstances
        ? `${Math.round((stats.connectedInstances / stats.totalInstances) * 100)}%`
        : "0%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} data-testid={`card-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-metric-value-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {metric.value.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {metric.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                {metric.trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={metric.trend === "up" ? "text-green-500" : metric.trend === "down" ? "text-red-500" : ""}>
                  {metric.trendValue}
                </span>
                <span className="ml-1">{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>Gráfico de ingresos (próximamente)</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>Gráfico de distribución (próximamente)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas y Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>Sin alertas pendientes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
