import { type User, type InsertUser, type Subaccount, type InsertSubaccount, type WhatsappInstance, type InsertWhatsappInstance } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subaccounts: Map<string, Subaccount>;
  private whatsappInstances: Map<string, WhatsappInstance>;

  constructor() {
    this.users = new Map();
    this.subaccounts = new Map();
    this.whatsappInstances = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getSubaccounts(userId: string): Promise<Subaccount[]> {
    return Array.from(this.subaccounts.values()).filter(
      (sub) => sub.userId === userId,
    );
  }

  async createSubaccount(insertSubaccount: InsertSubaccount): Promise<Subaccount> {
    const id = randomUUID();
    const subaccount: Subaccount = { 
      ...insertSubaccount, 
      id, 
      createdAt: new Date(),
      selected: insertSubaccount.selected ?? false 
    };
    this.subaccounts.set(id, subaccount);
    return subaccount;
  }

  async getWhatsappInstances(subaccountId: string): Promise<WhatsappInstance[]> {
    return Array.from(this.whatsappInstances.values()).filter(
      (instance) => instance.subaccountId === subaccountId,
    );
  }

  async createWhatsappInstance(insertInstance: InsertWhatsappInstance): Promise<WhatsappInstance> {
    const id = randomUUID();
    const instance: WhatsappInstance = { 
      ...insertInstance, 
      id, 
      createdAt: new Date(),
      connectedAt: null,
      status: insertInstance.status ?? "created",
      phoneNumber: insertInstance.phoneNumber ?? null,
      qrCode: insertInstance.qrCode ?? null,
      webhookUrl: insertInstance.webhookUrl ?? null
    };
    this.whatsappInstances.set(id, instance);
    return instance;
  }

  async updateWhatsappInstance(id: string, updates: Partial<WhatsappInstance>): Promise<WhatsappInstance | undefined> {
    const instance = this.whatsappInstances.get(id);
    if (!instance) return undefined;
    
    const updated = { ...instance, ...updates };
    this.whatsappInstances.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
