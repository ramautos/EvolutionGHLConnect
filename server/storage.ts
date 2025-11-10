import { companies, subaccounts, whatsappInstances, subscriptions, invoices, webhookConfig, systemConfig, oauthStates, triggers, type SelectCompany, type InsertCompany, type UpdateCompany, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance, type CreateSubaccount, type CreateWhatsappInstance, type Subscription, type InsertSubscription, type Invoice, type InsertInvoice, type WebhookConfig, type InsertWebhookConfig, type SystemConfig, type InsertSystemConfig, type UpdateSystemConfig, type OAuthState, type InsertOAuthState, type Trigger, type InsertTrigger } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql as drizzleSql, count, sum, isNotNull, not } from "drizzle-orm";
import { evolutionAPI } from "./evolution-api";

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
  getCompanyBillingInfo(companyId: string): Promise<any>;
  getDashboardStats(): Promise<any>;
  
  // ============================================
  // SUBACCOUNT OPERATIONS (con autenticación)
  // ============================================
  getSubaccount(id: string): Promise<Subaccount | undefined>;
  getSubaccountByEmail(email: string): Promise<Subaccount | undefined>;
  getSubaccountByEmailForAuth(email: string): Promise<Subaccount | undefined>;
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
  cleanupAllOAuthStates(): Promise<number>;
  
  // ============================================
  // TRIGGER OPERATIONS
  // ============================================
  getTriggers(subaccountId: string): Promise<any[]>;
  getTrigger(id: string): Promise<any | undefined>;
  createTrigger(subaccountId: string, triggerData: { triggerName: string; triggerTag: string }): Promise<any>;
  updateTrigger(id: string, updates: { triggerName?: string; triggerTag?: string }): Promise<any | undefined>;
  deleteTrigger(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Verifica si un email corresponde al super admin del sistema
   * El super admin NO debe poder ser usado para registrar empresas o subcuentas normales
   */
  static isSystemAdminEmail(email: string): boolean {
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
    if (!adminEmail) return false;
    return email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
  }

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
    // CASCADA: Eliminar todas las subcuentas de la empresa primero
    // Esto a su vez eliminará todas las instancias de cada subcuenta
    const companySubaccounts = await db
      .select()
      .from(subaccounts)
      .where(eq(subaccounts.companyId, id));

    console.log(`🗑️ Deleting company ${id} with ${companySubaccounts.length} subaccounts...`);

    // Eliminar cada subcuenta (esto eliminará sus instancias)
    for (const subaccount of companySubaccounts) {
      await this.deleteSubaccount(subaccount.id);
    }

    // Ahora eliminar la empresa
    const result = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();

    console.log(`✅ Company ${id} deleted successfully`);
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

  async getCompanyBillingInfo(companyId: string): Promise<any> {
    // Obtener información de billing para una empresa con cobro manual
    const company = await this.getCompany(companyId);
    if (!company) {
      return null;
    }

    // OPTIMIZADO: Obtener subcuentas con conteo de instancias en UNA SOLA QUERY usando JOIN
    const subaccountsData = await db
      .select({
        subaccount: subaccounts,
        instanceCount: drizzleSql<number>`COUNT(${whatsappInstances.id})`,
      })
      .from(subaccounts)
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id))
      .where(eq(subaccounts.companyId, companyId))
      .groupBy(subaccounts.id);

    // Filtrar subcuentas locales (de autenticación)
    const realSubaccounts = subaccountsData
      .filter(item =>
        !item.subaccount.locationId.startsWith('LOCAL_') &&
        !item.subaccount.locationId.startsWith('GOOGLE_')
      )
      .map(item => ({
        ...item.subaccount,
        instanceCount: Number(item.instanceCount),
        extraInstances: Math.max(0, Number(item.instanceCount) - 5), // 5 instancias incluidas
      }));

    // Calcular costos
    const pricePerSubaccount = parseFloat(company.pricePerSubaccount || "10.00");
    const pricePerExtraInstance = parseFloat(company.pricePerExtraInstance || "5.00");

    const totalSubaccountCost = realSubaccounts.length * pricePerSubaccount;
    const totalExtraInstancesCost = realSubaccounts.reduce(
      (sum, sub) => sum + (sub.extraInstances * pricePerExtraInstance),
      0
    );
    const totalCost = totalSubaccountCost + totalExtraInstancesCost;

    return {
      company,
      subaccounts: realSubaccounts,
      pricing: {
        pricePerSubaccount,
        pricePerExtraInstance,
        totalSubaccounts: realSubaccounts.length,
        totalSubaccountCost,
        totalExtraInstances: realSubaccounts.reduce((sum, sub) => sum + sub.extraInstances, 0),
        totalExtraInstancesCost,
        totalCost,
      },
    };
  }

  async getDashboardStats(): Promise<any> {
    // Obtener estadísticas aplicando los mismos filtros que getCompaniesByStatus() y getAllSubaccounts()
    // para mostrar solo datos de empresas y subcuentas reales (no del sistema)
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
      .leftJoin(whatsappInstances, eq(whatsappInstances.subaccountId, subaccounts.id))
      .where(
        and(
          // Filtros de empresas: excluir empresas del sistema
          not(eq(companies.name, 'Default Company')),
          not(eq(companies.name, 'Pending Claim')),
          not(eq(companies.id, 'PENDING_CLAIM')),
          // Filtro de subcuentas: excluir roles de administración y pendientes
          // (si no hay subcuenta, se permite la empresa)
          drizzleSql`(
            ${subaccounts.id} IS NULL OR (
              ${subaccounts.role} != 'system_admin' AND
              ${subaccounts.role} != 'admin' AND
              ${subaccounts.companyId} != 'PENDING_CLAIM' AND
              ${subaccounts.locationId} NOT LIKE 'LOCAL_%' AND
              ${subaccounts.locationId} NOT LIKE 'GOOGLE_%'
            )
          )`
        )
      );

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
    // IMPORTANTE: Excluir system_admin y admin para evitar conflictos
    // El super admin NO debe interferir con registros normales
    const [subaccount] = await db
      .select()
      .from(subaccounts)
      .where(
        and(
          eq(subaccounts.email, email),
          not(eq(subaccounts.role, "system_admin")),
          not(eq(subaccounts.role, "admin"))
        )
      );
    return subaccount || undefined;
  }

  async getSubaccountByEmailForAuth(email: string): Promise<Subaccount | undefined> {
    // Método ESPECIAL para autenticación (login)
    // INCLUYE a system_admin y admin para que puedan iniciar sesión
    const [subaccount] = await db
      .select()
      .from(subaccounts)
      .where(eq(subaccounts.email, email));
    return subaccount || undefined;
  }

  async getSubaccountByGoogleId(googleId: string): Promise<Subaccount | undefined> {
    // IMPORTANTE: Excluir system_admin y admin para evitar conflictos
    const [subaccount] = await db
      .select()
      .from(subaccounts)
      .where(
        and(
          eq(subaccounts.googleId, googleId),
          not(eq(subaccounts.role, "system_admin")),
          not(eq(subaccounts.role, "admin"))
        )
      );
    return subaccount || undefined;
  }

  async getSubaccountByLocationId(locationId: string): Promise<Subaccount | undefined> {
    // IMPORTANTE: Excluir system_admin y admin para evitar conflictos
    // El super admin NO debe interferir con instalaciones normales de GHL
    const [subaccount] = await db
      .select()
      .from(subaccounts)
      .where(
        and(
          eq(subaccounts.locationId, locationId),
          not(eq(subaccounts.role, "system_admin")),
          not(eq(subaccounts.role, "admin"))
        )
      );
    return subaccount || undefined;
  }

  async getSubaccountsByCompany(companyId: string): Promise<Subaccount[]> {
    const results = await db
      .select()
      .from(subaccounts)
      .where(and(
        eq(subaccounts.companyId, companyId),
        // Incluir subcuentas activas O subcuentas vendidas (aunque estén inactivas)
        or(
          eq(subaccounts.isActive, true),
          eq(subaccounts.isSold, true)
        )
      ));

    // Filtrar subcuentas locales (creadas en registro, no son ubicaciones de GHL)
    // Se identifican por locationId que empieza con LOCAL_
    return results.filter(sub => !sub.locationId.startsWith('LOCAL_'));
  }

  async getAllSubaccounts(): Promise<Subaccount[]> {
    // Filtrar system_admins y subcuentas pendientes de claim de la lista pública
    const results = await db
      .select()
      .from(subaccounts)
      .where(and(
        eq(subaccounts.isActive, true),
        not(eq(subaccounts.role, "system_admin")), // Excluir system_admins
        not(eq(subaccounts.role, "admin")), // Excluir admins
        not(eq(subaccounts.companyId, "PENDING_CLAIM")) // Excluir pendientes de claim
      ));

    // Filtrar subcuentas locales (creadas en registro, no son ubicaciones de GHL)
    // Se identifican por locationId que empieza con LOCAL_
    return results.filter(sub => !sub.locationId.startsWith('LOCAL_'));
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
    // CASCADA: Eliminar todas las instancias de WhatsApp de Evolution API primero
    const instances = await db
      .select()
      .from(whatsappInstances)
      .where(eq(whatsappInstances.subaccountId, id));

    console.log(`🗑️ Deleting subaccount ${id} with ${instances.length} WhatsApp instances...`);

    // Eliminar cada instancia de Evolution API
    for (const instance of instances) {
      try {
        console.log(`🗑️ Deleting Evolution API instance: ${instance.evolutionInstanceName}`);
        await evolutionAPI.deleteInstance(instance.evolutionInstanceName);
        console.log(`✅ Evolution API instance deleted: ${instance.evolutionInstanceName}`);
      } catch (error) {
        console.error(`⚠️ Failed to delete Evolution API instance ${instance.evolutionInstanceName}:`, error);
        // Continuar aunque falle la eliminación en Evolution API
      }

      // Eliminar instancia de la base de datos
      await db
        .delete(whatsappInstances)
        .where(eq(whatsappInstances.id, instance.id));
    }

    // HARD DELETE: Eliminar subcuenta de la base de datos
    // Esto permite reutilizar el email y locationId en el futuro
    // La suscripción se eliminará automáticamente por CASCADE (schema.ts línea 118)
    const [deleted] = await db
      .delete(subaccounts)
      .where(eq(subaccounts.id, id))
      .returning();

    console.log(`✅ Subaccount ${id} deleted successfully (hard delete)`);
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

    // Aplanar los datos para que sean más fáciles de usar en el frontend
    return results.map(r => ({
      ...r.instance,
      subaccountName: r.subaccount?.name,
      subaccountEmail: r.subaccount?.email,
      subaccountLocationId: r.subaccount?.locationId,
      subaccountCompanyId: r.subaccount?.companyId,
    }));
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

  async createSubscription(subaccountId: string, trialDays: number = 7): Promise<Subscription> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
    
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        subaccountId,
        plan: "none",
        maxSubaccounts: "1",
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
    // SOLUCIÓN DEFINITIVA: BORRAR el state después de usarlo
    // En lugar de solo marcarlo como "used", lo eliminamos completamente
    // Esto evita acumulación de basura y errores de "state already used"
    await db
      .delete(oauthStates)
      .where(eq(oauthStates.state, state));

    console.log(`🗑️ OAuth state deleted after use: ${state.substring(0, 10)}...`);
  }

  async cleanupExpiredOAuthStates(): Promise<void> {
    await db
      .delete(oauthStates)
      .where(drizzleSql`${oauthStates.expiresAt} < NOW()`);
  }

  async cleanupAllOAuthStates(): Promise<number> {
    // Eliminar TODOS los OAuth states (expirados, usados, y pendientes)
    // Útil para limpiar la base de datos después de borrar empresas/subcuentas
    const deleted = await db.delete(oauthStates).returning();
    console.log(`🗑️ Deleted ${deleted.length} OAuth states`);
    return deleted.length;
  }

  // ============================================
  // TRIGGER OPERATIONS
  // ============================================

  async getTriggers(subaccountId: string): Promise<Trigger[]> {
    const triggerList = await db
      .select()
      .from(triggers)
      .where(eq(triggers.subaccountId, subaccountId))
      .orderBy(triggers.createdAt);
    return triggerList;
  }

  async getTrigger(id: string): Promise<Trigger | undefined> {
    const [trigger] = await db
      .select()
      .from(triggers)
      .where(eq(triggers.id, id));
    return trigger || undefined;
  }

  async createTrigger(subaccountId: string, triggerData: { triggerName: string; triggerTag: string }): Promise<Trigger> {
    const [newTrigger] = await db
      .insert(triggers)
      .values({
        subaccountId,
        triggerName: triggerData.triggerName.trim(),
        triggerTag: triggerData.triggerTag.trim(),
      })
      .returning();
    return newTrigger;
  }

  async updateTrigger(id: string, updates: { triggerName?: string; triggerTag?: string }): Promise<Trigger | undefined> {
    const cleanedUpdates: any = {};
    if (updates.triggerName !== undefined) {
      cleanedUpdates.triggerName = updates.triggerName.trim();
    }
    if (updates.triggerTag !== undefined) {
      cleanedUpdates.triggerTag = updates.triggerTag.trim();
    }

    const [updated] = await db
      .update(triggers)
      .set(cleanedUpdates)
      .where(eq(triggers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrigger(id: string): Promise<boolean> {
    const deleted = await db
      .delete(triggers)
      .where(eq(triggers.id, id))
      .returning();
    return deleted.length > 0;
  }
}

export const storage = new DatabaseStorage();
