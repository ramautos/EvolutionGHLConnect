/**
 * n8n API Service
 *
 * Servicio para interactuar con la API de n8n:
 * - Duplicar workflows
 * - Configurar webhooks
 * - Actualizar workflows existentes
 */

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

interface DuplicateWorkflowOptions {
  templateWorkflowId: string;
  newName: string;
  webhookPath: string;
}

class N8nService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.N8N_API_URL || "https://n8nqr.cloude.es";
    this.apiKey = process.env.N8N_API_KEY || "";

    if (!this.apiKey) {
      console.warn("⚠️ N8N_API_KEY no configurado. La integración con n8n no funcionará.");
    }
  }

  /**
   * Headers para las peticiones a la API de n8n
   */
  private getHeaders(): HeadersInit {
    return {
      "X-N8N-API-KEY": this.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  /**
   * Obtener un workflow por ID
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/workflows/${workflowId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`❌ Error obteniendo workflow ${workflowId}:`, response.status, response.statusText);
        return null;
      }

      const workflow = await response.json();
      console.log(`✅ Workflow obtenido: ${workflow.name} (${workflowId})`);
      return workflow;
    } catch (error) {
      console.error(`❌ Error en getWorkflow:`, error);
      return null;
    }
  }

  /**
   * Crear un nuevo workflow
   */
  async createWorkflow(workflowData: Partial<N8nWorkflow>): Promise<N8nWorkflow | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/workflows`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error creando workflow:`, response.status, errorText);
        return null;
      }

      const newWorkflow = await response.json();
      console.log(`✅ Workflow creado: ${newWorkflow.name} (${newWorkflow.id})`);
      return newWorkflow;
    } catch (error) {
      console.error(`❌ Error en createWorkflow:`, error);
      return null;
    }
  }

  /**
   * Actualizar nodos de un workflow para cambiar el webhook path
   */
  private updateWebhookNodes(nodes: any[], newWebhookPath: string): any[] {
    return nodes.map((node) => {
      // Si es un nodo de tipo Webhook
      if (node.type === "n8n-nodes-base.webhook") {
        return {
          ...node,
          parameters: {
            ...node.parameters,
            path: newWebhookPath,
          },
        };
      }
      return node;
    });
  }

  /**
   * Duplicar un workflow y configurar webhook personalizado
   */
  async duplicateWorkflow(options: DuplicateWorkflowOptions): Promise<N8nWorkflow | null> {
    try {
      console.log(`🔵 Duplicando workflow ${options.templateWorkflowId} → ${options.newName}`);

      // 1. Obtener el workflow template
      const template = await this.getWorkflow(options.templateWorkflowId);
      if (!template) {
        console.error(`❌ No se pudo obtener el template ${options.templateWorkflowId}`);
        return null;
      }

      // 2. Actualizar nodos para cambiar el webhook path
      const updatedNodes = this.updateWebhookNodes(template.nodes, options.webhookPath);

      // 3. Crear el nuevo workflow
      const newWorkflowData: Partial<N8nWorkflow> = {
        name: options.newName,
        nodes: updatedNodes,
        connections: template.connections,
        settings: template.settings,
        staticData: template.staticData,
        active: true, // Activar automáticamente
      };

      const newWorkflow = await this.createWorkflow(newWorkflowData);

      if (newWorkflow) {
        console.log(`✅ Workflow duplicado exitosamente:`);
        console.log(`   - ID: ${newWorkflow.id}`);
        console.log(`   - Nombre: ${newWorkflow.name}`);
        console.log(`   - Webhook: ${this.apiUrl}/webhook/${options.webhookPath}`);
      }

      return newWorkflow;
    } catch (error) {
      console.error(`❌ Error duplicando workflow:`, error);
      return null;
    }
  }

  /**
   * Verificar si ya existe un workflow con un nombre específico
   */
  async workflowExists(workflowName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/workflows`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`❌ Error listando workflows:`, response.status);
        return false;
      }

      const workflows = await response.json();
      const exists = workflows.data?.some((wf: any) => wf.name === workflowName);

      if (exists) {
        console.log(`ℹ️ Workflow "${workflowName}" ya existe`);
      }

      return exists;
    } catch (error) {
      console.error(`❌ Error en workflowExists:`, error);
      return false;
    }
  }

  /**
   * Crear workflow para un locationId si no existe
   * Este es el método principal que se llamará desde routes.ts
   */
  async createWorkflowForLocation(locationId: string): Promise<string | null> {
    try {
      const templateId = process.env.N8N_TEMPLATE_WORKFLOW_ID || "tnWqUmYez8IvPKeC";

      // Verificar si ya existe
      const exists = await this.workflowExists(locationId);
      if (exists) {
        console.log(`✅ Workflow para ${locationId} ya existe, reutilizando`);
        return `${this.apiUrl}/webhook/${locationId}`;
      }

      // Duplicar el workflow
      const newWorkflow = await this.duplicateWorkflow({
        templateWorkflowId: templateId,
        newName: locationId,
        webhookPath: locationId,
      });

      if (!newWorkflow) {
        console.error(`❌ No se pudo crear workflow para ${locationId}`);
        return null;
      }

      // Retornar la URL del webhook
      const webhookUrl = `${this.apiUrl}/webhook/${locationId}`;
      console.log(`✅ Webhook URL creada: ${webhookUrl}`);
      return webhookUrl;
    } catch (error) {
      console.error(`❌ Error en createWorkflowForLocation:`, error);
      return null;
    }
  }
}

// Exportar instancia singleton
export const n8nService = new N8nService();
