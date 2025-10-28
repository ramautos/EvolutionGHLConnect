import { companies, users, subaccounts, whatsappInstances, subscriptions, invoices, webhookConfig, type SelectCompany, type InsertCompany, type UpdateCompany, type User, type InsertUser, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance, type CreateSubaccount, type CreateWhatsappInstance, type Subscription, type InsertSubscription, type Invoice, type InsertInvoice, type WebhookConfig, type InsertWebhookConfig } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql as drizzleSql, count, sum, isNotNull } from "drizzle-orm";

export interface IStorage {
  // ============================================
  // COMPANY OPERATIONS
  // ============================================
  getCompany(id: string): Promise<SelectCompany | undefined>;
  getCompanies(): Promise<SelectCompany[]>;
  getCompaniesByStatus(status?: 'active' | 'trial' | 'expired'): Promise<any[]>; // Con estadísticas
  createCompany(company: InsertCompany): Promise<SelectCompany>;
  updateCompany(id: string, updates: UpdateCompany): Promise<SelectCompany | undefined>;
  deleteCompany(id: string): Promise<boolean>;
  getCompanyStats(companyId: string): Promise<any>; // Estadísticas de una empresa
  getDashboardStats(): Promise<any>; // Estadísticas globales para dashboard
  
  // ============================================
  // USER OPERATIONS
  // ============================================
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateLastLogin(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>; // Para admin panel
  
  // ============================================
  // SUBACCOUNT OPERATIONS
  // ============================================
  getSubaccount(id: string): Promise<Subaccount | undefined>;
  getSubaccounts(userId: string): Promise<Subaccount[]>;
  getSubaccountByLocationId(locationId: string): Promise<Subaccount | undefined>;
  createSubaccount(subaccount: CreateSubaccount): Promise<Subaccount>;
  updateSubaccount(id: string, updates: Partial<Subaccount>): Promise<Subaccount | undefined>;
  deleteSubaccount(id: string): Promise<boolean>;
  getAllSubaccounts(): Promise<Subaccount[]>; // Para admin panel
  
  // ============================================
  // WHATSAPP INSTANCE OPERATIONS
  // ============================================
  getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstanceByName(instanceName: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]>;
  getWhatsappInstancesByLocationId(locationId: string): Promise<WhatsappInstance[]>;
  getAllUserInstances(userId: string): Promise<WhatsappInstance[]>;
  getAllInstances(): Promise<WhatsappInstance[]>;
  getAllWhatsappInstancesWithDetails(): Promise<any[]>; // Para admin panel con JOIN
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
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // COMPANY OPERATIONS
  // ============================================
  
  async getCompany(id: string): Promise<SelectCompany | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanies(): Promise<SelectCompany[]> {
    return await db.select().from(companies);
  }

  async getCompaniesByStatus(status?: 'active' | 'trial' | 'expired'): Promise<any[]> {
    // Get all companies with their aggregate data including subscription info
    const companiesData = await db
      .select({
        id: companies.id,
        name: companies.name,
        email: companies.email,
        phoneNumber: companies.phoneNumber,
        country: companies.country,
        stripeCustomerId: companies.stripeCustomerId,
        isActive: companies.isActive,
        createdAt: companies.createdAt,
        userCount: drizzleSql<number>`COUNT(DISTINCT ${users.id})`,
        subaccountCount: drizzleSql<number>`COUNT(DISTINCT ${subaccounts.id})`,
        instanceCount: drizzleSql<number>`COUNT(DISTINCT ${whatsappInstances.id})`,
        // Subscription status indicators
        hasActiveTrial: drizzleSql<boolean>`BOOL_OR(${subscriptions.inTrial} = true AND ${subscriptions.trialEndsAt} > NOW())`,
        hasExpiredSubscription: drizzleSql<boolean>`BOOL_OR(${subscriptions.status} = 'expired')`,
      })
      .from(companies)
      .leftJoin(users, eq(users.companyId, companies.id))
      .leftJoin(subaccounts, eq(subaccounts.userId, users.id))
      .leftJoin(subscriptions, eq(subscriptions.subaccountId, subaccounts.id))
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id))
      .groupBy(companies.id);

    // If no status filter, return all
    if (!status) {
      return companiesData;
    }

    // Filter by status based on subscription data
    return companiesData.filter(company => {
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
    // Get detailed stats for a specific company
    const [stats] = await db
      .select({
        userCount: drizzleSql<number>`COUNT(DISTINCT ${users.id})`,
        subaccountCount: drizzleSql<number>`COUNT(DISTINCT ${subaccounts.id})`,
        instanceCount: drizzleSql<number>`COUNT(DISTINCT ${whatsappInstances.id})`,
        activeInstanceCount: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${whatsappInstances.status} = 'connected' THEN ${whatsappInstances.id} END)`,
      })
      .from(companies)
      .leftJoin(users, eq(users.companyId, companies.id))
      .leftJoin(subaccounts, eq(subaccounts.userId, users.id))
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id))
      .where(eq(companies.id, companyId))
      .groupBy(companies.id);

    return stats || { userCount: 0, subaccountCount: 0, instanceCount: 0, activeInstanceCount: 0 };
  }

  async getDashboardStats(): Promise<any> {
    // Global statistics for admin dashboard
    const [globalStats] = await db
      .select({
        totalCompanies: drizzleSql<number>`COUNT(DISTINCT ${companies.id})`,
        activeCompanies: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${companies.isActive} = true THEN ${companies.id} END)`,
        totalUsers: drizzleSql<number>`COUNT(DISTINCT ${users.id})`,
        totalSubaccounts: drizzleSql<number>`COUNT(DISTINCT ${subaccounts.id})`,
        totalInstances: drizzleSql<number>`COUNT(DISTINCT ${whatsappInstances.id})`,
        connectedInstances: drizzleSql<number>`COUNT(DISTINCT CASE WHEN ${whatsappInstances.status} = 'connected' THEN ${whatsappInstances.id} END)`,
      })
      .from(companies)
      .leftJoin(users, eq(users.companyId, companies.id))
      .leftJoin(subaccounts, eq(subaccounts.userId, users.id))
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id));

    return globalStats || {
      totalCompanies: 0,
      activeCompanies: 0,
      totalUsers: 0,
      totalSubaccounts: 0,
      totalInstances: 0,
      connectedInstances: 0,
    };
  }

  // ============================================
  // USER OPERATIONS
  // ============================================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // ============================================
  // SUBACCOUNT OPERATIONS
  // ============================================

  async getSubaccount(id: string): Promise<Subaccount | undefined> {
    const [subaccount] = await db.select().from(subaccounts).where(eq(subaccounts.id, id));
    return subaccount || undefined;
  }

  async getSubaccounts(userId: string): Promise<Subaccount[]> {
    return await db
      .select()
      .from(subaccounts)
      .where(and(
        eq(subaccounts.userId, userId),
        eq(subaccounts.isActive, true)
      ));
  }

  async getSubaccountByLocationId(locationId: string): Promise<Subaccount | undefined> {
    const [subaccount] = await db
      .select()
      .from(subaccounts)
      .where(eq(subaccounts.locationId, locationId));
    return subaccount || undefined;
  }

  async createSubaccount(insertSubaccount: CreateSubaccount): Promise<Subaccount> {
    const [subaccount] = await db
      .insert(subaccounts)
      .values(insertSubaccount)
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

  async getAllSubaccounts(): Promise<Subaccount[]> {
    return await db.select().from(subaccounts);
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

  async getAllUserInstances(userId: string): Promise<WhatsappInstance[]> {
    const instances = await db.select().from(whatsappInstances).where(eq(whatsappInstances.userId, userId));
    return instances;
  }

  async getAllInstances(): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances);
  }

  async getAllWhatsappInstancesWithDetails(): Promise<any[]> {
    const results = await db
      .select({
        instance: whatsappInstances,
        subaccount: subaccounts,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        }
      })
      .from(whatsappInstances)
      .leftJoin(subaccounts, eq(whatsappInstances.subaccountId, subaccounts.id))
      .leftJoin(users, eq(subaccounts.userId, users.id));
    
    return results;
  }

  async createWhatsappInstance(insertInstance: CreateWhatsappInstance): Promise<WhatsappInstance> {
    // Contar instancias existentes para este locationId
    const existingInstances = await this.getWhatsappInstancesByLocationId(insertInstance.locationId);
    const instanceNumber = existingInstances.length + 1;
    
    // Generar nombre: locationId_1, locationId_2, etc.
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

    // BACKFILL LOGIC: Si inTrial=true pero trialEndsAt=null (legacy), desactivar trial
    if (subscription.inTrial && !subscription.trialEndsAt) {
      const updated = await this.updateSubscription(subaccountId, {
        inTrial: false,
        trialEndsAt: new Date(0), // Fecha en el pasado
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
    // Calcular fecha de fin de prueba (15 días por defecto)
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
}

export const storage = new DatabaseStorage();
