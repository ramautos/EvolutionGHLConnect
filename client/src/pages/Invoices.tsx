import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, Download, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@shared/schema";

export default function Invoices() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      paid: {
        variant: "default" as const,
        icon: CheckCircle2,
        label: "Pagado",
      },
      pending: {
        variant: "secondary" as const,
        icon: Clock,
        label: "Pendiente",
      },
      failed: {
        variant: "destructive" as const,
        icon: XCircle,
        label: "Fallido",
      },
    };

    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.pending;

    return (
      <Badge variant={variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getPlanName = (plan: string) => {
    const plans: Record<string, string> = {
      basic_1: "Plan Básico (1 ubicación)",
      pro_5: "Plan Pro (5 ubicaciones)",
    };
    return plans[plan] || plan;
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "—";
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const totalPaid = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Receipt className="w-8 h-8 text-primary" />
              Facturas y Pagos
            </h1>
            <p className="text-muted-foreground mt-2">
              Historial completo de tus transacciones y pagos
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card data-testid="stat-total-paid">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-paid">${totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Acumulado histórico
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-invoices">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Totales</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-invoices">{invoices.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.filter(i => i.status === "paid").length} pagadas
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-last-invoice">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Factura</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-last-invoice">
                {invoices.length > 0 ? `$${invoices[invoices.length - 1].amount}` : "$0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.length > 0 ? formatDate(invoices[invoices.length - 1].createdAt) : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Facturas</CardTitle>
            <CardDescription>
              Todas tus transacciones y pagos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay facturas</h3>
                <p className="text-muted-foreground mb-4">
                  Aún no has realizado ningún pago. Comienza eligiendo un plan.
                </p>
                <Button onClick={() => setLocation("/billing")} data-testid="button-go-billing">
                  Ver Planes
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">
                        {formatDate(invoice.createdAt)}
                      </TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>
                        <span className="text-sm">{getPlanName(invoice.plan)}</span>
                      </TableCell>
                      <TableCell className="font-bold">
                        ${parseFloat(invoice.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
