import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Check, Link as LinkIcon, Loader2 } from "lucide-react";

interface SellSubaccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SellSubaccountModal({ open, onOpenChange }: SellSubaccountModalProps) {
  const { toast } = useToast();
  const [subaccountName, setSubaccountName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const sellMutation = useMutation({
    mutationFn: async (data: { subaccountName: string; customerName: string; customerEmail: string }) => {
      const response = await apiRequest("POST", "/api/subaccounts/sell", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLink(data.installLink);
      queryClient.invalidateQueries({ queryKey: ["/api/subaccounts/user"] });
      toast({
        title: "Subcuenta Vendida Creada",
        description: "Link único generado. Cópialo y compártelo con tu cliente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la subcuenta vendida",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sellMutation.mutate({ subaccountName, customerName, customerEmail });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copiado",
      description: "Link copiado al portapapeles",
    });
  };

  const handleClose = () => {
    setSubaccountName("");
    setCustomerName("");
    setCustomerEmail("");
    setGeneratedLink("");
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Vender Subcuenta
          </DialogTitle>
          <DialogDescription>
            Genera una subcuenta manual con link único para tu cliente
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subaccountName">Nombre de la Subcuenta *</Label>
              <Input
                id="subaccountName"
                placeholder="Ej: Tienda de Zapatos"
                value={subaccountName}
                onChange={(e) => setSubaccountName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre del Cliente *</Label>
              <Input
                id="customerName"
                placeholder="Ej: Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email del Cliente *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={sellMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={sellMutation.isPending}>
                {sellMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Generar Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-2">
                ✅ Subcuenta Creada Exitosamente
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Comparte este link con {customerName} para que instale la aplicación
              </p>
            </div>

            <div className="space-y-2">
              <Label>Link Único de Instalación</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Copia el link de arriba</li>
                <li>Envíalo a tu cliente por email, WhatsApp, etc.</li>
                <li>Cuando tu cliente abra el link e instale la app, aparecerá automáticamente en tus subcuentas</li>
                <li>Verás un badge especial indicando que es una subcuenta vendida</li>
              </ol>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
