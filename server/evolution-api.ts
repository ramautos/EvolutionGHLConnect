interface EvolutionAPIConfig {
  baseUrl: string;
  apiKey: string;
}

interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
}

interface QRCodeResponse {
  pairingCode?: string;
  code: string;
  count: number;
  base64?: string;
}

interface InstanceStateResponse {
  instance: {
    instanceName: string;
    state: string;
  };
}

interface InstanceInfoResponse {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string | null;
}

export class EvolutionAPIService {
  private config: EvolutionAPIConfig | null = null;

  constructor() {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (baseUrl && apiKey) {
      this.config = {
        baseUrl: baseUrl.replace(/\/$/, ''),
        apiKey,
      };
    } else {
      console.warn("Evolution API credentials not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY environment variables.");
    }
  }

  private checkConfig() {
    if (!this.config) {
      throw new Error("Evolution API not configured. Please set EVOLUTION_API_URL and EVOLUTION_API_KEY environment variables.");
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    this.checkConfig();
    const url = `${this.config!.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config!.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async createInstance(instanceName: string): Promise<CreateInstanceResponse> {
    return this.request<CreateInstanceResponse>('POST', '/instance/create', {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    });
  }

  async getQRCode(instanceName: string): Promise<QRCodeResponse> {
    return this.request<QRCodeResponse>('GET', `/instance/connect/${instanceName}`);
  }

  async getInstanceState(instanceName: string): Promise<InstanceStateResponse> {
    return this.request<InstanceStateResponse>('GET', `/instance/connectionState/${instanceName}`);
  }

  async getInstanceInfo(instanceName: string): Promise<InstanceInfoResponse> {
    const response = await this.request<InstanceInfoResponse[]>('GET', `/instance/fetchInstances?instanceName=${instanceName}`);
    if (!response || response.length === 0) {
      throw new Error(`Instance ${instanceName} not found`);
    }
    return response[0];
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.request('DELETE', `/instance/delete/${instanceName}`);
  }

  async logout(instanceName: string): Promise<void> {
    await this.request('DELETE', `/instance/logout/${instanceName}`);
  }
}

export const evolutionAPI = new EvolutionAPIService();
