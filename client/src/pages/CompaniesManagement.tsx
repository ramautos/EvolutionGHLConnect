import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Building,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Company {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  address: string | null;
  notes: string | null;
  stripeCustomerId: string | null;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  subaccountCount: number;
  instanceCount: number;
}

const editCompanySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
});

type EditCompanyForm = z.infer<typeof editCompanySchema>;

export default function CompaniesManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const form = useForm<EditCompanyForm>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      country: "",
      address: "",
    },
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies", activeTab !== "all" ? activeTab : undefined],
    queryFn: async () => {
      const url = activeTab !== "all" 
        ? `/api/admin/companies?status=${activeTab}`
        : "/api/admin/companies";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: EditCompanyForm & { id: string }) => {
      const { id, ...updates } = data;
      const res = await apiRequest("PATCH", `/api/admin/companies/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "Empresa actualizada",
        description: "Los cambios se guardaron exitosamente",
      });
      setEditDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la empresa",
        variant: "destructive",
      });
    },
  });

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    form.reset({
      name: company.name,
      email: company.email,
      phoneNumber: company.phoneNumber || "",
      country: company.country || "",
      address: company.address || "",
    });
    setEditDialogOpen(true);
  };

  const onSubmit = (data: EditCompanyForm) => {
    if (!selectedCompany) return;
    updateCompanyMutation.mutate({ ...data, id: selectedCompany.id });
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-companies-title">
            Gestión de Empresas
          </h1>
          <p className="text-muted-foreground">
            Administra todas las empresas del sistema
          </p>
        </div>
        <Button data-testid="button-add-company">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">Todas</TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">Activas</TabsTrigger>
          <TabsTrigger value="trial" data-testid="tab-trial">En Trial</TabsTrigger>
          <TabsTrigger value="expired" data-testid="tab-expired">Vencidas</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-companies"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Subcuentas</TableHead>
                  <TableHead>Instancias</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron empresas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => {
                    const isExpanded = expandedCompanies.has(company.id);
                    return (
                      <Collapsible
                        key={company.id}
                        open={isExpanded}
                        onOpenChange={() => toggleCompany(company.id)}
                        asChild
                      >
                        <>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            data-testid={`row-company-${company.id}`}
                          >
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {company.name}
                              </div>
                            </TableCell>
                            <TableCell>{company.email}</TableCell>
                            <TableCell>{company.userCount}</TableCell>
                            <TableCell>{company.subaccountCount}</TableCell>
                            <TableCell>{company.instanceCount}</TableCell>
                            <TableCell>
                              <Badge variant={company.isActive ? "default" : "secondary"}>
                                {company.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(company);
                                  }}
                                  data-testid={`button-edit-${company.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-delete-${company.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          <CollapsibleContent asChild>
                            <TableRow>
                              <TableCell colSpan={8} className="bg-muted/30">
                                <div className="p-6 space-y-6">
                                  {/* Company Info */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Información de la Empresa
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Nombre:</span>
                                        <p className="font-medium">{company.name}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <p className="font-medium">{company.email}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Teléfono:</span>
                                        <p className="font-medium">{company.phoneNumber || "N/A"}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">País:</span>
                                        <p className="font-medium">{company.country || "N/A"}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Billing Info */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <DollarSign className="h-4 w-4" />
                                      Facturación
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Stripe ID:</span>
                                        <p className="font-medium font-mono text-xs">
                                          {company.stripeCustomerId || "Sin configurar"}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">MRR:</span>
                                        <p className="font-medium">$0.00</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-muted-foreground" />
                                          <div>
                                            <p className="text-2xl font-bold">{company.userCount}</p>
                                            <p className="text-xs text-muted-foreground">Usuarios</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                          <Building className="h-4 w-4 text-muted-foreground" />
                                          <div>
                                            <p className="text-2xl font-bold">{company.subaccountCount}</p>
                                            <p className="text-xs text-muted-foreground">Subcuentas</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-muted-foreground" />
                                          <div>
                                            <p className="text-2xl font-bold">{company.instanceCount}</p>
                                            <p className="text-xs text-muted-foreground">Instancias</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Modifica la información de la empresa
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-company-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCompanyMutation.isPending}
                  data-testid="button-save-company"
                >
                  {updateCompanyMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
