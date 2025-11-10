import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Copy, Trash2, Plus, Key } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiToken {
  id: string;
  tokenName: string;
  token: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export default function AdminAPI() {
  const { toast } = useToast();
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Obtener tokens
  const { data: tokens = [], isLoading } = useQuery<ApiToken[]>({
    queryKey: ["/api/tokens"],
  });

  // Crear token
  const createTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tokens", {
        tokenName: tokenName.trim(),
        expiresAt: null,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setNewToken(data.token);
      setTokenName("");
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast({
        title: "Token creado",
        description: "Copia el token ahora. No podrás verlo de nuevo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el token",
        variant: "destructive",
      });
    },
  });

  // Eliminar token
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const res = await apiRequest("DELETE", `/api/tokens/${tokenId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
      toast({
        title: "Token eliminado",
        description: "El token ha sido revocado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el token",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Token copiado al portapapeles",
    });
  };

  const handleDeleteToken = (tokenId: string) => {
    setTokenToDelete(tokenId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tokenToDelete) {
      deleteTokenMutation.mutate(tokenToDelete);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Tokens & Documentación</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus tokens de API y consulta la documentación de endpoints
        </p>
      </div>

      {/* Gestión de Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Tokens
          </CardTitle>
          <CardDescription>
            Crea y gestiona tokens para acceder a la API desde aplicaciones externas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crear Token */}
          <div className="space-y-3">
            <Label htmlFor="token-name">Crear Nuevo Token</Label>
            <div className="flex gap-2">
              <Input
                id="token-name"
                placeholder="Nombre del token (ej: Mi App de Python)"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                disabled={createTokenMutation.isPending}
              />
              <Button
                onClick={() => createTokenMutation.mutate()}
                disabled={!tokenName.trim() || createTokenMutation.isPending}
              >
                {createTokenMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Token
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Mostrar Token Recién Creado */}
          {newToken && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 space-y-2">
              <h4 className="font-medium text-green-900 dark:text-green-100">
                ✅ Token creado exitosamente
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Copia este token ahora. Por seguridad, no podrás verlo de nuevo.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(newToken)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewToken(null)}
              >
                Entendido, cerrar
              </Button>
            </div>
          )}

          {/* Lista de Tokens */}
          <div className="space-y-2">
            <Label>Tus Tokens</Label>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 border rounded-lg">
                No tienes tokens creados. Crea uno para empezar a usar la API.
              </div>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{token.tokenName}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {token.token}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Creado: {new Date(token.createdAt).toLocaleDateString()}
                        {token.lastUsedAt && (
                          <span className="ml-3">
                            Último uso: {new Date(token.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteToken(token.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentación de API */}
      <Card>
        <CardHeader>
          <CardTitle>Documentación de API v1</CardTitle>
          <CardDescription>
            Endpoints disponibles para acceder a tu información mediante API Tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Token Authentication */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔐 Autenticación con Token
            </h3>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Todos los endpoints de API v1 requieren un token de autenticación en el header:
              </p>
              <div className="bg-muted p-3 rounded text-xs font-mono">
                Authorization: Bearer ghl_tu_token_aqui
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
                <p className="font-medium mb-2">Ejemplo con curl:</p>
                <code className="text-xs">
                  curl -H "Authorization: Bearer ghl_xxxxx" \<br />
                  &nbsp;&nbsp;https://whatsapp.cloude.es/api/v1/user/info
                </code>
              </div>
            </div>
          </div>

          {/* GET /api/v1/user/info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              📊 Obtener Información Completa del Usuario
            </h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">GET</Badge>
                <code className="text-sm">/api/v1/user/info</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Retorna TODA la información del usuario autenticado con el token
              </p>

              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Respuesta incluye:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Datos del usuario (id, email, name, phone, role)</li>
                  <li>API Keys (OpenAI, ElevenLabs, Gemini)</li>
                  <li>Información de la empresa (si existe)</li>
                  <li>Subcuentas de la empresa</li>
                  <li>Instancias de WhatsApp (status, phoneNumber, webhookUrl)</li>
                  <li>Metadata (totales, instancias conectadas, timestamp)</li>
                </ul>
              </div>

              <div className="mt-3 bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`{
  "success": true,
  "user": {
    "id": "usr_123",
    "email": "tu@email.com",
    "name": "Tu Nombre",
    "phone": "+573001234567",
    "role": "user",
    "locationId": "LOC_ABC123",
    "apiKeys": {
      "openai": "sk-...",
      "elevenlabs": "...",
      "gemini": "..."
    },
    "company": {
      "id": "comp_123",
      "name": "Mi Empresa",
      "manualBilling": false
    }
  },
  "subaccounts": [
    {
      "id": "sub_456",
      "name": "Subcuenta 1",
      "locationId": "LOC_XYZ",
      "isActive": true
    }
  ],
  "instances": [
    {
      "id": "inst_789",
      "customName": "WhatsApp Soporte",
      "status": "connected",
      "phoneNumber": "+573009876543",
      "webhookUrl": "https://n8nqr.cloude.es/webhook/LOC_ABC123"
    }
  ],
  "metadata": {
    "totalSubaccounts": 2,
    "totalInstances": 3,
    "connectedInstances": 2,
    "timestamp": "2025-01-10T20:30:00.000Z"
  }
}`}
              </div>
            </div>
          </div>

          {/* Ejemplos de Uso */}
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              💡 Ejemplos de Uso
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Python:</p>
                <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
{`import requests

token = "ghl_tu_token_aqui"
headers = {"Authorization": f"Bearer {token}"}

response = requests.get(
    "https://whatsapp.cloude.es/api/v1/user/info",
    headers=headers
)

data = response.json()
print(f"Instancias conectadas: {data['metadata']['connectedInstances']}")`}
                </div>
              </div>

              <div>
                <p className="font-medium mb-1">JavaScript (Node.js):</p>
                <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
{`const token = "ghl_tu_token_aqui";

const response = await fetch(
  "https://whatsapp.cloude.es/api/v1/user/info",
  {
    headers: {
      "Authorization": \`Bearer \${token}\`
    }
  }
);

const data = await response.json();
console.log("API Keys:", data.user.apiKeys);`}
                </div>
              </div>

              <div>
                <p className="font-medium mb-1">cURL:</p>
                <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
{`curl -H "Authorization: Bearer ghl_tu_token_aqui" \\
  https://whatsapp.cloude.es/api/v1/user/info`}
                </div>
              </div>
            </div>
          </div>

          {/* Notas Importantes */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              ⚠️ Notas Importantes
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              <li>Guarda tu token en un lugar seguro. No se puede recuperar después de crearlo.</li>
              <li>No compartas tu token. Cualquiera con el token puede acceder a tu información.</li>
              <li>Si crees que tu token fue comprometido, elimínalo inmediatamente y crea uno nuevo.</li>
              <li>Los tokens no expiran por defecto, pero puedes eliminarlos en cualquier momento.</li>
              <li>El header Authorization debe incluir "Bearer " antes del token.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmación para Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar token?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El token será revocado inmediatamente
              y las aplicaciones que lo usen dejarán de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTokenMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Token"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
