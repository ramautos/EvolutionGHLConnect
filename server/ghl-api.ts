import { ghlStorage } from "./ghl-storage";

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
        const error = await response.text();
        console.error("Error exchanging code for token:", error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error in exchangeCodeForToken:", error);
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
}

export const ghlApi = new GhlApiService();
