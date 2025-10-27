import { users, subaccounts, whatsappInstances, subscriptions, invoices, webhookConfig, type User, type InsertUser, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance, type CreateSubaccount, type CreateWhatsappInstance, type Subscription, type InsertSubscription, type Invoice, type InsertInvoice, type WebhookConfig, type InsertWebhookConfig } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
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
  createSubscription(subaccountId: string): Promise<Subscription>;
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
    return subscription || undefined;
  }

  async createSubscription(subaccountId: string): Promise<Subscription> {
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
