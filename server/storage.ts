import { companies, subaccounts, whatsappInstances, subscriptions, invoices, webhookConfig, systemConfig, oauthStates, type SelectCompany, type InsertCompany, type UpdateCompany, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance, type CreateSubaccount, type CreateWhatsappInstance, type Subscription, type InsertSubscription, type Invoice, type InsertInvoice, type WebhookConfig, type InsertWebhookConfig, type SystemConfig, type InsertSystemConfig, type UpdateSystemConfig, type OAuthState, type InsertOAuthState } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql as drizzleSql, count, sum, isNotNull, not } from "drizzle-orm";

export interface IStorage {
  // ============================================
  // COMPANY OPERATIONS
  // ============================================
  getCompany(id: string): Promise<SelectCompany | undefined>;
  getCompanyByGhlId(ghlCompanyId: string): Promise<SelectCompany | undefined>;
  getCompanies(): Promise<SelectCompany[]>;
  getCompaniesByStatus(status?: 'active' | 'trial' | 'expired'): Promise<any[]>;
  createCompany(company: InsertCompany): Promise<SelectCompany>;
  updateCompany(id: string, updates: UpdateCompany): Promise<SelectCompany | undefined>;
  deleteCompany(id: string): Promise<boolean>;
  getCompanyStats(companyId: string): Promise<any>;
  getDashboardStats(): Promise<any>;
  
  // ============================================
  // SUBACCOUNT OPERATIONS (con autenticación)
  // ============================================
  getSubaccount(id: string): Promise<Subaccount | undefined>;
  getSubaccountByEmail(email: string): Promise<Subaccount | undefined>;
  getSubaccountByGoogleId(googleId: string): Promise<Subaccount | undefined>;
  getSubaccountByLocationId(locationId: string): Promise<Subaccount | undefined>;
  getSubaccountsByCompany(companyId: string): Promise<Subaccount[]>;
  getAllSubaccounts(): Promise<Subaccount[]>;
  createSubaccount(subaccount: Partial<InsertSubaccount>): Promise<Subaccount>;
  updateSubaccount(id: string, updates: Partial<Subaccount>): Promise<Subaccount | undefined>;
  deleteSubaccount(id: string): Promise<boolean>;
  updateSubaccountLastLogin(id: string): Promise<void>;
  updateSubaccountBilling(id: string, billingEnabled: boolean): Promise<Subaccount | undefined>;
  updateSubaccountActivation(id: string, manuallyActivated: boolean): Promise<Subaccount | undefined>;
  
  // ============================================
  // WHATSAPP INSTANCE OPERATIONS
  // ============================================
  getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstanceByName(instanceName: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]>;
  getWhatsappInstancesByLocationId(locationId: string): Promise<WhatsappInstance[]>;
  getAllInstances(): Promise<WhatsappInstance[]>;
  getAllWhatsappInstancesWithDetails(): Promise<any[]>;
  createWhatsappInstance(instance: CreateWhatsappInstance): Promise<WhatsappInstance>;
  updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance | undefined>;
  deleteWhatsappInstance(id: string): Promise<boolean>;
  
  // ============================================
  // SUBSCRIPTION OPERATIONS (Por subcuenta)
  // ============================================
  getSubscription(subaccountId: string): Promise<Subscription | undefined>;
  createSubscription(subaccountId: string, trialDays?: number): Promise<Subscription>;
  updateSubscription(subaccountId: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  countWhatsappInstances(subaccountId: string): Promise<number>;
  
  // ============================================
  // INVOICE OPERATIONS (Por subcuenta)
  // ============================================
  getInvoices(subaccountId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // ============================================
  // WEBHOOK CONFIG OPERATIONS (Admin-only)
  // ============================================
  getWebhookConfig(): Promise<WebhookConfig | undefined>;
  createWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig>;
  updateWebhookConfig(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | undefined>;
  
  // ============================================
  // SYSTEM CONFIG OPERATIONS (Admin-only)
  // ============================================
  getSystemConfig(): Promise<SystemConfig | undefined>;
  createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(id: string, updates: UpdateSystemConfig): Promise<SystemConfig | undefined>;
  
  // ============================================
  // OAUTH STATE OPERATIONS
  // ============================================
  createOAuthState(state: InsertOAuthState): Promise<OAuthState>;
  getOAuthState(state: string): Promise<OAuthState | undefined>;
  markOAuthStateAsUsed(state: string): Promise<void>;
  cleanupExpiredOAuthStates(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // COMPANY OPERATIONS
  // ============================================
  
  async getCompany(id: string): Promise<SelectCompany | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByGhlId(ghlCompanyId: string): Promise<SelectCompany | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.ghlCompanyId, ghlCompanyId));
    return company || undefined;
  }

  async getCompanies(): Promise<SelectCompany[]> {
    return await db.select().from(companies);
  }

  async getCompaniesByStatus(status?: 'active' | 'trial' | 'expired'): Promise<any[]> {
    // Get all companies with their aggregate data
    const companiesData = await db
      .select({
        id: companies.id,
        name: companies.name,
        email: companies.email,
        phoneNumber: companies.phoneNumber,
        country: companies.country,
        address: companies.address,
        notes: companies.notes,
        stripeCustomerId: companies.stripeCustomerId,
        stripeSubscriptionId: companies.stripeSubscriptionId,
        isActive: companies.isActive,
        createdAt: companies.createdAt,
        subaccountCount: drizzleSql<number>`COUNT(DISTINCT ${subaccounts.id})`,
        instanceCount: drizzleSql<number>`COUNT(DISTINCT ${whatsappInstances.id})`,
        connectedInstances: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${whatsappInstances.status} = 'connected' THEN ${whatsappInstances.id} END)`,
        hasActiveTrial: drizzleSql<boolean>`BOOL_OR(${subscriptions.inTrial} = true AND ${subscriptions.trialEndsAt} > NOW())`,
        hasExpiredSubscription: drizzleSql<boolean>`BOOL_OR(${subscriptions.status} = 'expired')`,
      })
      .from(companies)
      .leftJoin(subaccounts, eq(subaccounts.companyId, companies.id))
      .leftJoin(subscriptions, eq(subscriptions.subaccountId, subaccounts.id))
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id))
      .groupBy(companies.id);

    // Filtrar la empresa del admin (Default Company)
    // Se identifica por tener el nombre "Default Company" o ser la empresa del system_admin
    const filteredCompanies = companiesData.filter(company =>
      company.name !== 'Default Company' &&
      !company.email?.includes('ramautos.do')
    );

    if (!status) {
      return filteredCompanies;
    }

    return filteredCompanies.filter(company => {
      if (status === 'trial') {
        return company.hasActiveTrial;
      } else if (status === 'expired') {
        return company.hasExpiredSubscription;
      } else if (status === 'active') {
        return !company.hasActiveTrial && !company.hasExpiredSubscription && company.isActive;
      }
      return true;
    });
  }

  async createCompany(company: InsertCompany): Promise<SelectCompany> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateCompany(id: string, updates: UpdateCompany): Promise<SelectCompany | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();
    return result.length > 0;
  }

  async getCompanyStats(companyId: string): Promise<any> {
    const [stats] = await db
      .select({
        subaccountCount: drizzleSql<number>`COUNT(DISTINCT ${subaccounts.id})`,
        instanceCount: drizzleSql<number>`COUNT(DISTINCT ${whatsappInstances.id})`,
        activeInstanceCount: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${whatsappInstances.status} = 'connected' THEN ${whatsappInstances.id} END)`,
      })
      .from(companies)
      .leftJoin(subaccounts, eq(subaccounts.companyId, companies.id))
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id))
      .where(eq(companies.id, companyId))
      .groupBy(companies.id);

    return stats || { subaccountCount: 0, instanceCount: 0, activeInstanceCount: 0 };
  }

  async getDashboardStats(): Promise<any> {
    const [globalStats] = await db
      .select({
        totalCompanies: drizzleSql<number>`COUNT(DISTINCT ${companies.id})`,
        activeCompanies: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${companies.isActive} = true THEN ${companies.id} END)`,
        totalSubaccounts: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${subaccounts.isActive} = true THEN ${subaccounts.id} END)`,
        totalInstances: drizzleSql<number>`COUNT(DISTINCT ${whatsappInstances.id})`,
        connectedInstances: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${whatsappInstances.status} = 'connected' THEN ${whatsappInstances.id} END)`,
      })
      .from(companies)
      .leftJoin(subaccounts, eq(subaccounts.companyId, companies.id))
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id));

    return globalStats || {
      totalCompanies: 0,
      activeCompanies: 0,
      totalSubaccounts: 0,
      totalInstances: 0,
      connectedInstances: 0,
    };
  }

  // ============================================
  // SUBACCOUNT OPERATIONS (con autenticación)
  // ============================================
  
  async getSubaccount(id: string): Promise<Subaccount | undefined> {
    const [subaccount] = await db.select().from(subaccounts).where(eq(subaccounts.id, id));
    return subaccount || undefined;
  }

  async getSubaccountByEmail(email: string): Promise<Subaccount | undefined> {
    const [subaccount] = await db.select().from(subaccounts).where(eq(subaccounts.email, email));
    return subaccount || undefined;
  }

  async getSubaccountByGoogleId(googleId: string): Promise<Subaccount | undefined> {
    const [subaccount] = await db.select().from(subaccounts).where(eq(subaccounts.googleId, googleId));
    return subaccount || undefined;
  }

  async getSubaccountByLocationId(locationId: string): Promise<Subaccount | undefined> {
    const [subaccount] = await db
      .select()
      .from(subaccounts)
      .where(eq(subaccounts.locationId, locationId));
    return subaccount || undefined;
  }

  async getSubaccountsByCompany(companyId: string): Promise<Subaccount[]> {
    const results = await db
      .select()
      .from(subaccounts)
      .where(and(
        eq(subaccounts.companyId, companyId),
        eq(subaccounts.isActive, true)
      ));

    // Filtrar subcuentas locales (creadas en registro, no son ubicaciones de GHL)
    // Se identifican por locationId que empieza con LOCAL_
    return results.filter(sub => !sub.locationId.startsWith('LOCAL_'));
  }

  async getAllSubaccounts(): Promise<Subaccount[]> {
    // Filtrar system_admins y subcuentas pendientes de claim de la lista pública
    return await db
      .select()
      .from(subaccounts)
      .where(and(
        eq(subaccounts.isActive, true),
        not(eq(subaccounts.role, "system_admin")), // Excluir system_admins
        not(eq(subaccounts.companyId, "PENDING_CLAIM")) // Excluir pendientes de claim
      ));
  }

  async createSubaccount(insertSubaccount: Partial<InsertSubaccount>): Promise<Subaccount> {
    const isSystemAdmin = insertSubaccount.role === "system_admin";
    
    // REGLA CRÍTICA: Solo system_admins pueden tener companyId = NULL
    // Todos los demás DEBEN tener una empresa asignada
    
    let companyId = insertSubaccount.companyId;
    
    // Para system_admins: FORZAR companyId = null (sin empresa)
    if (isSystemAdmin) {
      companyId = null;
    } 
    // Para NO-system_admins: SIEMPRE asignar empresa
    else {
      // Si companyId es null o undefined, asignar empresa PENDING_CLAIM
      if (!companyId) {
        companyId = "PENDING_CLAIM";
      }
      // Si especificaron companyId, usarlo (validar que exista)
      // Esto permite asignar empresas reales en registro normal
    }
    
    const [subaccount] = await db
      .insert(subaccounts)
      .values({ ...insertSubaccount, companyId } as InsertSubaccount)
      .returning();
    return subaccount;
  }

  async updateSubaccount(id: string, updates: Partial<Subaccount>): Promise<Subaccount | undefined> {
    const [updated] = await db
      .update(subaccounts)
      .set(updates)
      .where(eq(subaccounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSubaccount(id: string): Promise<boolean> {
    const [deleted] = await db
      .update(subaccounts)
      .set({ 
        isActive: false,
        uninstalledAt: new Date()
      })
      .where(eq(subaccounts.id, id))
      .returning();
    return !!deleted;
  }

  async updateSubaccountLastLogin(id: string): Promise<void> {
    await db
      .update(subaccounts)
      .set({ lastLoginAt: new Date() })
      .where(eq(subaccounts.id, id));
  }

  async updateSubaccountBilling(id: string, billingEnabled: boolean): Promise<Subaccount | undefined> {
    const [updated] = await db
      .update(subaccounts)
      .set({ billingEnabled })
      .where(eq(subaccounts.id, id))
      .returning();
    return updated || undefined;
  }

  async updateSubaccountActivation(id: string, manuallyActivated: boolean): Promise<Subaccount | undefined> {
    const [updated] = await db
      .update(subaccounts)
      .set({ manuallyActivated })
      .where(eq(subaccounts.id, id))
      .returning();
    return updated || undefined;
  }

  // ============================================
  // WHATSAPP INSTANCE OPERATIONS
  // ============================================

  async getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined> {
    const [instance] = await db.select().from(whatsappInstances).where(eq(whatsappInstances.id, id));
    return instance || undefined;
  }

  async getWhatsappInstanceByName(instanceName: string): Promise<WhatsappInstance | undefined> {
    const [instance] = await db.select().from(whatsappInstances).where(eq(whatsappInstances.evolutionInstanceName, instanceName));
    return instance || undefined;
  }

  async getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances).where(eq(whatsappInstances.subaccountId, subaccountId));
  }

  async getWhatsappInstancesByLocationId(locationId: string): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances).where(eq(whatsappInstances.locationId, locationId));
  }

  async getAllInstances(): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances);
  }

  async getAllWhatsappInstancesWithDetails(): Promise<any[]> {
    const results = await db
      .select({
        instance: whatsappInstances,
        subaccount: subaccounts,
      })
      .from(whatsappInstances)
      .leftJoin(subaccounts, eq(whatsappInstances.subaccountId, subaccounts.id));
    
    return results;
  }

  async createWhatsappInstance(insertInstance: CreateWhatsappInstance): Promise<WhatsappInstance> {
    const existingInstances = await this.getWhatsappInstancesByLocationId(insertInstance.locationId);
    const instanceNumber = existingInstances.length + 1;
    const evolutionName = `${insertInstance.locationId}_${instanceNumber}`;
    
    const [instance] = await db
      .insert(whatsappInstances)
      .values({
        ...insertInstance,
        evolutionInstanceName: evolutionName,
        status: "created"
      })
      .returning();
    return instance;
  }

  async updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance | undefined> {
    const [updated] = await db
      .update(whatsappInstances)
      .set(updates)
      .where(eq(whatsappInstances.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWhatsappInstance(id: string): Promise<boolean> {
    const result = await db
      .delete(whatsappInstances)
      .where(eq(whatsappInstances.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================
  // SUBSCRIPTION OPERATIONS (Por subcuenta)
  // ============================================

  async getSubscription(subaccountId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subaccountId, subaccountId));
    
    if (!subscription) {
      return undefined;
    }

    // Si inTrial=true pero trialEndsAt=null, desactivar trial
    if (subscription.inTrial && !subscription.trialEndsAt) {
      const updated = await this.updateSubscription(subaccountId, {
        inTrial: false,
        trialEndsAt: new Date(0),
      });
      return updated || subscription;
    }

    // Si terminó el período de prueba, actualizar estado
    if (subscription.inTrial && subscription.trialEndsAt) {
      const now = new Date();
      if (new Date(subscription.trialEndsAt) <= now) {
        const updated = await this.updateSubscription(subaccountId, {
          inTrial: false,
        });
        return updated || subscription;
      }
    }

    return subscription;
  }

  async createSubscription(subaccountId: string, trialDays: number = 15): Promise<Subscription> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
    
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        subaccountId,
        plan: "none",
        includedInstances: "0",
        extraSlots: "0",
        basePrice: "0.00",
        extraPrice: "0.00",
        status: "active",
        trialEndsAt,
        inTrial: true,
      })
      .returning();
    return subscription;
  }

  async updateSubscription(subaccountId: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.subaccountId, subaccountId))
      .returning();
    return updated || undefined;
  }

  async countWhatsappInstances(subaccountId: string): Promise<number> {
    const instances = await this.getWhatsappInstances(subaccountId);
    return instances.length;
  }

  // ============================================
  // INVOICE OPERATIONS (Por subcuenta)
  // ============================================

  async getInvoices(subaccountId: string): Promise<Invoice[]> {
    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subaccountId, subaccountId))
      .orderBy(invoices.createdAt);
    return results;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return created;
  }

  // ============================================
  // WEBHOOK CONFIG OPERATIONS (Admin-only)
  // ============================================

  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    const [config] = await db
      .select()
      .from(webhookConfig)
      .limit(1);
    return config || undefined;
  }

  async createWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig> {
    const [created] = await db
      .insert(webhookConfig)
      .values(config)
      .returning();
    return created;
  }

  async updateWebhookConfig(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | undefined> {
    const [updated] = await db
      .update(webhookConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(webhookConfig.id, id))
      .returning();
    return updated || undefined;
  }

  // ============================================
  // SYSTEM CONFIG OPERATIONS (Admin-only)
  // ============================================

  async getSystemConfig(): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).limit(1);
    return config || undefined;
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const [newConfig] = await db
      .insert(systemConfig)
      .values(config)
      .returning();
    return newConfig;
  }

  async updateSystemConfig(id: string, updates: UpdateSystemConfig): Promise<SystemConfig | undefined> {
    // Get existing config to prevent overwriting critical credentials with empty values
    const existing = await this.getSystemConfig();
    
    // Protect critical Evolution API credentials from being cleared
    const protectedUpdates = { ...updates };
    
    if (existing) {
      // If evolutionApiKey exists and update tries to clear it, keep existing value
      if (existing.evolutionApiKey && (!updates.evolutionApiKey || updates.evolutionApiKey === "")) {
        protectedUpdates.evolutionApiKey = existing.evolutionApiKey;
      }
      
      // If evolutionApiUrl exists and update tries to clear it, keep existing value
      if (existing.evolutionApiUrl && (!updates.evolutionApiUrl || updates.evolutionApiUrl === "")) {
        protectedUpdates.evolutionApiUrl = existing.evolutionApiUrl;
      }
    }
    
    const [updated] = await db
      .update(systemConfig)
      .set({ ...protectedUpdates, updatedAt: new Date() })
      .where(eq(systemConfig.id, id))
      .returning();
    return updated || undefined;
  }

  // ============================================
  // OAUTH STATE OPERATIONS
  // ============================================

  async createOAuthState(state: InsertOAuthState): Promise<OAuthState> {
    const [newState] = await db
      .insert(oauthStates)
      .values(state)
      .returning();
    return newState;
  }

  async getOAuthState(state: string): Promise<OAuthState | undefined> {
    const [oauthState] = await db
      .select()
      .from(oauthStates)
      .where(eq(oauthStates.state, state));
    return oauthState || undefined;
  }

  async markOAuthStateAsUsed(state: string): Promise<void> {
    await db
      .update(oauthStates)
      .set({ used: true })
      .where(eq(oauthStates.state, state));
  }

  async cleanupExpiredOAuthStates(): Promise<void> {
    await db
      .delete(oauthStates)
      .where(drizzleSql`${oauthStates.expiresAt} < NOW()`);
  }
}

export const storage = new DatabaseStorage();
