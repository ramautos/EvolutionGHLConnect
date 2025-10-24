import { users, subaccounts, whatsappInstances, type User, type InsertUser, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getSubaccounts(userId: string): Promise<Subaccount[]>;
  createSubaccount(subaccount: InsertSubaccount): Promise<Subaccount>;
  
  getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstanceByName(instanceName: string): Promise<WhatsappInstance | undefined>;
  getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]>;
  getAllUserInstances(userId: string): Promise<WhatsappInstance[]>;
  getAllInstances(): Promise<WhatsappInstance[]>;
  createWhatsappInstance(instance: InsertWhatsappInstance): Promise<WhatsappInstance>;
  updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance | undefined>;
  deleteWhatsappInstance(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getSubaccounts(userId: string): Promise<Subaccount[]> {
    return await db.select().from(subaccounts).where(eq(subaccounts.userId, userId));
  }

  async createSubaccount(insertSubaccount: InsertSubaccount): Promise<Subaccount> {
    const [subaccount] = await db
      .insert(subaccounts)
      .values(insertSubaccount)
      .returning();
    return subaccount;
  }

  async getWhatsappInstance(id: string): Promise<WhatsappInstance | undefined> {
    const [instance] = await db.select().from(whatsappInstances).where(eq(whatsappInstances.id, id));
    return instance || undefined;
  }

  async getWhatsappInstanceByName(instanceName: string): Promise<WhatsappInstance | undefined> {
    const [instance] = await db.select().from(whatsappInstances).where(eq(whatsappInstances.instanceName, instanceName));
    return instance || undefined;
  }

  async getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances).where(eq(whatsappInstances.subaccountId, subaccountId));
  }

  async getAllUserInstances(userId: string): Promise<WhatsappInstance[]> {
    const userSubaccounts = await this.getSubaccounts(userId);
    const subaccountIds = userSubaccounts.map(sub => sub.id);
    
    if (subaccountIds.length === 0) {
      return [];
    }
    
    const instances = await db.select().from(whatsappInstances);
    return instances.filter(inst => inst.subaccountId && subaccountIds.includes(inst.subaccountId));
  }

  async getAllInstances(): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances);
  }

  async createWhatsappInstance(insertInstance: InsertWhatsappInstance): Promise<WhatsappInstance> {
    const [instance] = await db
      .insert(whatsappInstances)
      .values(insertInstance)
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
}

export const storage = new DatabaseStorage();
