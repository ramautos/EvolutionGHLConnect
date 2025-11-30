import { ghlStorage } from "./ghl-storage";
import crypto from "crypto";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export interface GhlLocation {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  companyId?: string;
}

export interface GhlOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  userType: string;
  locationId?: string;
  companyId?: string;
  userId?: string;
}

export interface GhlInstallerDetails {
  company: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      addressLine1?: string;
    };
    phone?: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class GhlApiService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.GHL_CLIENT_ID || "";
    this.clientSecret = process.env.GHL_CLIENT_SECRET || "";

    if (!this.clientId || !this.clientSecret) {
      console.warn("GoHighLevel OAuth credentials not configured");
    }
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<GhlOAuthTokenResponse | null> {
    try {
      console.log("🔵 GHL API - Exchange Code for Token:", {
        url: `${GHL_BASE_URL}/oauth/token`,
        client_id: this.clientId ? `${this.clientId.substring(0, 10)}...` : "missing",
        client_secret: this.clientSecret ? "configured" : "missing",
        redirect_uri: redirectUri,
        code: code ? `${code.substring(0, 10)}...` : "missing"
      });

      const response = await fetch(`${GHL_BASE_URL}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = errorText;
        }
        console.error("❌ GHL API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorJson
        });
        return null;
      }

      const tokenData = await response.json();
      console.log("✅ GHL API - Token received:", {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        companyId: tokenData.companyId,
        locationId: tokenData.locationId
      });

      return tokenData;
    } catch (error) {
      console.error("❌ Error in exchangeCodeForToken:", error);
      return null;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<GhlOAuthTokenResponse | null> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error refreshing token:", error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error in refreshAccessToken:", error);
      return null;
    }
  }

  async getInstallerDetails(accessToken: string): Promise<GhlInstallerDetails | null> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/marketplace/installer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: GHL_API_VERSION,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error getting installer details:", error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getInstallerDetails:", error);
      return null;
    }
  }

  async getLocation(locationId: string, accessToken: string): Promise<GhlLocation | null> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/locations/${locationId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: GHL_API_VERSION,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error getting location:", error);
        return null;
      }

      const data = await response.json();
      return data.location || data;
    } catch (error) {
      console.error("Error in getLocation:", error);
      return null;
    }
  }

  async getInstalledLocations(companyAccessToken: string): Promise<GhlLocation[]> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/oauth/installedLocations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${companyAccessToken}`,
          Version: GHL_API_VERSION,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error getting installed locations:", error);
        return [];
      }

      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error("Error in getInstalledLocations:", error);
      return [];
    }
  }

  async getLocationAccessToken(locationId: string, companyAccessToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/oauth/locationToken`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${companyAccessToken}`,
          "Content-Type": "application/json",
          Version: GHL_API_VERSION,
        },
        body: JSON.stringify({
          locationId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error getting location access token:", error);
        return null;
      }

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      console.error("Error in getLocationAccessToken:", error);
      return null;
    }
  }

  async getValidAccessToken(locationId: string): Promise<string | null> {
    const cliente = await ghlStorage.getClienteByLocationId(locationId);
    
    if (!cliente || !cliente.accesstoken) {
      console.error("No client found for location:", locationId);
      return null;
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const expiresAt = cliente.expiresat ? new Date(cliente.expiresat) : null;
    
    if (expiresAt && expiresAt > now) {
      // Token todavía válido
      return cliente.accesstoken;
    }

    // Token expirado, refrescar
    if (!cliente.refreshtoken) {
      console.error("No refresh token available for location:", locationId);
      return null;
    }

    const tokenResponse = await this.refreshAccessToken(cliente.refreshtoken);
    
    if (!tokenResponse) {
      console.error("Failed to refresh token for location:", locationId);
      return null;
    }

    // Actualizar token en la base de datos
    const newExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
    await ghlStorage.updateAccessToken(
      locationId,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      newExpiresAt
    );

    return tokenResponse.access_token;
  }

  /**
   * Descifra un SSO key de GoHighLevel
   * @param ssoKey - El SSO key encriptado recibido desde GHL
   * @returns Los datos descifrados (locationId, userId, companyId, timestamp)
   */
  async decryptSsoKey(ssoKey: string): Promise<{
    locationId: string;
    userId: string;
    companyId: string;
    timestamp: number;
  } | null> {
    try {
      const ssoSecret = process.env.GHL_APP_SSO_KEY;
      if (!ssoSecret) {
        console.error("GHL_APP_SSO_KEY no configurado");
        return null;
      }

      // El SSO key viene en formato base64url, convertir a base64
      const base64 = ssoKey.replace(/-/g, '+').replace(/_/g, '/');
      const encryptedData = Buffer.from(base64, 'base64');

      // GHL usa AES-256-CBC
      // La clave SSO es la clave de descifrado
      const key = crypto.createHash('sha256').update(ssoSecret).digest();

      // El IV son los primeros 16 bytes
      const iv = encryptedData.slice(0, 16);
      const encrypted = encryptedData.slice(16);

      // Descifrar
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Parsear JSON
      const data = JSON.parse(decrypted.toString('utf8'));

      console.log("✅ SSO Key descifrado exitosamente");
      return data;
    } catch (error) {
      console.error("❌ Error descifrando SSO key:", error);
      return null;
    }
  }

  /**
   * Crea un Custom Menu Link en una location de GHL
   * Docs: https://marketplace.gohighlevel.com/docs/ghl/custom-menus/create-custom-menu
   *
   * Endpoint: POST /custom-menus/
   * Parámetros según documentación GHL:
   * - name: Nombre del menú (visible en sidebar)
   * - url: URL que se abrirá
   * - icon: Nombre del icono (string)
   * - openType: 'iframe' | 'new_tab' | 'current_tab'
   * - locationId: ID de la location
   *
   * @param locationId - ID de la location
   * @param accessToken - Access token válido para la location
   * @param menuLinkData - Datos del menu link
   */
  async createCustomMenuLink(
    locationId: string,
    accessToken: string,
    menuLinkData: {
      name: string;
      url: string;
      icon?: string;
      openType?: 'iframe' | 'new_tab' | 'current_tab';
    }
  ): Promise<{ success: boolean; menuId?: string; error?: string }> {
    try {
      // Construir body según formato de GHL
      const requestBody = {
        name: menuLinkData.name,
        url: menuLinkData.url,
        icon: menuLinkData.icon || 'link',
        openType: menuLinkData.openType || 'iframe',
        locationId: locationId,
      };

      console.log(`📎 Creando Custom Menu Link para location ${locationId}:`, requestBody);

      const response = await fetch(`${GHL_BASE_URL}/custom-menus/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Version: GHL_API_VERSION,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { message: errorText };
        }
        console.error("❌ Error creando Custom Menu Link:", {
          status: response.status,
          statusText: response.statusText,
          body: requestBody,
          error: errorJson
        });
        return { success: false, error: errorJson.message || errorJson.error || errorText };
      }

      const result = await response.json();
      console.log("✅ Custom Menu Link creado exitosamente:", result);
      return { success: true, menuId: result.id || result.customMenuId };
    } catch (error: any) {
      console.error("❌ Error en createCustomMenuLink:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene los Custom Menu Links de una location
   * Endpoint: GET /custom-menus/?locationId={locationId}
   */
  async getCustomMenuLinks(
    locationId: string,
    accessToken: string
  ): Promise<any[]> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/custom-menus/?locationId=${locationId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: GHL_API_VERSION,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Error obteniendo Custom Menu Links:", error);
        return [];
      }

      const result = await response.json();
      return result.menus || result.customMenus || result || [];
    } catch (error) {
      console.error("❌ Error en getCustomMenuLinks:", error);
      return [];
    }
  }

  /**
   * Elimina un Custom Menu Link
   * Endpoint: DELETE /custom-menus/:customMenuId
   */
  async deleteCustomMenuLink(
    locationId: string,
    menuId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${GHL_BASE_URL}/custom-menus/${menuId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Version: GHL_API_VERSION,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Error eliminando Custom Menu Link:", error);
        return false;
      }

      console.log("✅ Custom Menu Link eliminado exitosamente");
      return true;
    } catch (error) {
      console.error("❌ Error en deleteCustomMenuLink:", error);
      return false;
    }
  }
}

export const ghlApi = new GhlApiService();
