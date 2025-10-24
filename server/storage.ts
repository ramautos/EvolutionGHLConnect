import { users, subaccounts, whatsappInstances, type User, type InsertUser, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getSubaccounts(userId: string): Promise<Subaccount[]>;
  createSubaccount(subaccount: InsertSubaccount): Promise<Subaccount>;
  
  getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]>;
  createWhatsappInstance(instance: InsertWhatsappInstance): Promise<WhatsappInstance>;
  updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance | undefined>;
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

  async getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]> {
    return await db.select().from(whatsappInstances).where(eq(whatsappInstances.subaccountId, subaccountId));
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
}

export const storage = new DatabaseStorage();
