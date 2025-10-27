import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// SESSIONS TABLE - Sesiones de Passport.js (connect-pg-simple)
// ============================================
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ============================================
// USERS TABLE - Usuarios con autenticación
// ============================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"), // Para email/password auth
  googleId: text("google_id"), // Para Google OAuth
  role: text("role").notNull().default("user"), // "user" o "admin"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// ============================================
// SUBACCOUNTS TABLE - Locations de GHL
// ============================================
export const subaccounts = pgTable("subaccounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationId: text("location_id").notNull().unique(), // GHL Location ID
  companyId: text("company_id").notNull(), // GHL Company ID
  name: text("name").notNull(), // Nombre de la location en GHL
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  installedAt: timestamp("installed_at").defaultNow(),
  uninstalledAt: timestamp("uninstalled_at"),
});

// ============================================
// WHATSAPP INSTANCES TABLE - Instancias de WhatsApp
// ============================================
export const whatsappInstances = pgTable("whatsapp_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subaccountId: varchar("subaccount_id").notNull().references(() => subaccounts.id, { onDelete: "cascade" }),
  locationId: text("location_id").notNull(), // GHL location ID (redundante pero útil)
  
  // Nombres
  customName: text("custom_name"), // Nombre personalizado por el usuario
  evolutionInstanceName: text("evolution_instance_name").notNull(), // wa-{locationId}
  
  // Conexión
  phoneNumber: text("phone_number"), // Número de WhatsApp conectado (readonly)
  status: text("status").notNull().default("created"), // created, qr_generated, connected, disconnected, error
  qrCode: text("qr_code"),
  
  // Configuración
  webhookUrl: text("webhook_url"),
  apiKey: text("api_key"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  lastActivityAt: timestamp("last_activity_at"),
});

// ============================================
// ZOD SCHEMAS - Validación
// ============================================

// Users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

// Subaccounts
export const insertSubaccountSchema = createInsertSchema(subaccounts).omit({
  id: true,
  installedAt: true,
  uninstalledAt: true,
});

export const createSubaccountSchema = z.object({
  userId: z.string().uuid(),
  locationId: z.string().min(1, "Location ID es requerido"),
  companyId: z.string().min(1, "Company ID es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
});

// WhatsApp Instances
export const insertWhatsappInstanceSchema = createInsertSchema(whatsappInstances).omit({
  id: true,
  createdAt: true,
  connectedAt: true,
  disconnectedAt: true,
  lastActivityAt: true,
});

export const createWhatsappInstanceSchema = z.object({
  userId: z.string().uuid(),
  subaccountId: z.string().uuid(),
  locationId: z.string().min(1, "Location ID es requerido"),
  customName: z.string().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  evolutionInstanceName: z.string().min(1, "Evolution instance name es requerido"),
});

export const updateWhatsappInstanceSchema = z.object({
  customName: z.string().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres").optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(["created", "qr_generated", "connected", "disconnected", "error"]).optional(),
  qrCode: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  connectedAt: z.date().optional(),
  disconnectedAt: z.date().optional(),
  lastActivityAt: z.date().optional(),
});

// ============================================
// TYPESCRIPT TYPES
// ============================================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Subaccount = typeof subaccounts.$inferSelect;
export type InsertSubaccount = z.infer<typeof insertSubaccountSchema>;
export type CreateSubaccount = z.infer<typeof createSubaccountSchema>;

export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = z.infer<typeof insertWhatsappInstanceSchema>;
export type CreateWhatsappInstance = z.infer<typeof createWhatsappInstanceSchema>;
export type UpdateWhatsappInstance = z.infer<typeof updateWhatsappInstanceSchema>;
