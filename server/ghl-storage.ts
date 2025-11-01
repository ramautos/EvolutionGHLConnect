import { ghlClientes, type GhlCliente, type InsertGhlCliente } from "@shared/ghl-schema";
import { ghlDb, isGhlDbConfigured } from "./ghl-db";
import { eq, and } from "drizzle-orm";

export interface IGhlStorage {
  getClienteByLocationId(locationId: string): Promise<GhlCliente | undefined>;
  getClientesByCompanyId(companyId: string): Promise<GhlCliente[]>;
  getClientesByUserId(userId: string): Promise<GhlCliente[]>;
  createOrUpdateCliente(cliente: InsertGhlCliente): Promise<GhlCliente | undefined>;
  updateAccessToken(locationId: string, accessToken: string, refreshToken: string, expiresAt: Date): Promise<void>;
  getActiveClientes(): Promise<GhlCliente[]>;
  deleteClienteByLocationId(locationId: string): Promise<boolean>;
  deleteClientesByCompanyId(companyId: string): Promise<number>;
}

export class GhlDatabaseStorage implements IGhlStorage {
  async getClienteByLocationId(locationId: string): Promise<GhlCliente | undefined> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured');
      return undefined;
    }

    try {
      const [cliente] = await ghlDb
        .select()
        .from(ghlClientes)
        .where(eq(ghlClientes.locationid, locationId));
      return cliente || undefined;
    } catch (error) {
      console.error('Error fetching cliente by location ID:', error);
      return undefined;
    }
  }

  async getClientesByCompanyId(companyId: string): Promise<GhlCliente[]> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured');
      return [];
    }

    try {
      return await ghlDb
        .select()
        .from(ghlClientes)
        .where(and(
          eq(ghlClientes.companyid, companyId),
          eq(ghlClientes.isactive, true)
        ));
    } catch (error) {
      console.error('Error fetching clientes by company ID:', error);
      return [];
    }
  }

  async getClientesByUserId(userId: string): Promise<GhlCliente[]> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured');
      return [];
    }

    try {
      return await ghlDb
        .select()
        .from(ghlClientes)
        .where(and(
          eq(ghlClientes.userid, userId),
          eq(ghlClientes.isactive, true)
        ));
    } catch (error) {
      console.error('Error fetching clientes by user ID:', error);
      return [];
    }
  }

  async createOrUpdateCliente(insertCliente: InsertGhlCliente): Promise<GhlCliente | undefined> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured');
      return undefined;
    }

    try {
      // Verificar si ya existe
      const existing = insertCliente.locationid 
        ? await this.getClienteByLocationId(insertCliente.locationid)
        : undefined;

      if (existing) {
        // Actualizar
        const [updated] = await ghlDb
          .update(ghlClientes)
          .set({
            ...insertCliente,
            lastrefreshed: new Date(),
          })
          .where(eq(ghlClientes.id, existing.id))
          .returning();
        return updated;
      } else {
        // Crear nuevo
        const [created] = await ghlDb
          .insert(ghlClientes)
          .values(insertCliente)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error creating/updating cliente:', error);
      return undefined;
    }
  }

  async updateAccessToken(
    locationId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresAt: Date
  ): Promise<void> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured');
      return;
    }

    try {
      await ghlDb
        .update(ghlClientes)
        .set({
          accesstoken: accessToken,
          refreshtoken: refreshToken,
          expiresat: expiresAt,
          lastrefreshed: new Date(),
        })
        .where(eq(ghlClientes.locationid, locationId));
    } catch (error) {
      console.error('Error updating access token:', error);
    }
  }

  async getActiveClientes(): Promise<GhlCliente[]> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured');
      return [];
    }

    try {
      return await ghlDb
        .select()
        .from(ghlClientes)
        .where(eq(ghlClientes.isactive, true));
    } catch (error) {
      console.error('Error fetching active clientes:', error);
      return [];
    }
  }

  async deleteClienteByLocationId(locationId: string): Promise<boolean> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured - skipping GHL delete');
      return false;
    }

    try {
      console.log(`🗑️ Deleting GHL cliente with locationId: ${locationId}`);
      const deleted = await ghlDb
        .delete(ghlClientes)
        .where(eq(ghlClientes.locationid, locationId))
        .returning();
      
      if (deleted.length > 0) {
        console.log(`✅ GHL cliente deleted: ${locationId}`);
        return true;
      }
      console.log(`⚠️ GHL cliente not found: ${locationId}`);
      return false;
    } catch (error) {
      console.error('Error deleting GHL cliente:', error);
      return false;
    }
  }

  async deleteClientesByCompanyId(companyId: string): Promise<number> {
    if (!isGhlDbConfigured || !ghlDb) {
      console.warn('GHL Database not configured - skipping GHL delete');
      return 0;
    }

    try {
      console.log(`🗑️ Deleting all GHL clientes for company: ${companyId}`);
      const deleted = await ghlDb
        .delete(ghlClientes)
        .where(eq(ghlClientes.companyid, companyId))
        .returning();
      
      const count = deleted.length;
      console.log(`✅ Deleted ${count} GHL clientes for company ${companyId}`);
      return count;
    } catch (error) {
      console.error('Error deleting GHL clientes by company ID:', error);
      return 0;
    }
  }
}

export const ghlStorage = new GhlDatabaseStorage();
