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
  phoneNumber: text("phone_number"), // Número de teléfono con código de país
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
  openaiApiKey: text("openai_api_key"), // API Key de OpenAI para transcripción
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
// SUBSCRIPTIONS TABLE - Planes por subcuenta
// ============================================
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subaccountId: varchar("subaccount_id").notNull().references(() => subaccounts.id, { onDelete: "cascade" }).unique(),
  plan: text("plan").notNull().default("none"), // none, basic_1_instance, pro_5_instances
  includedInstances: text("included_instances").notNull().default("0"), // Instancias incluidas en el plan base
  extraSlots: text("extra_slots").notNull().default("0"), // Instancias adicionales compradas ($5 c/u)
  basePrice: text("base_price").notNull().default("0.00"), // Precio base del plan ($8 o $25)
  extraPrice: text("extra_price").notNull().default("0.00"), // Precio total de slots extra
  status: text("status").notNull().default("active"), // active, expired, cancelled
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// INVOICES TABLE - Facturas de pago
// ============================================
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subaccountId: varchar("subaccount_id").notNull().references(() => subaccounts.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(), // Monto total en dólares
  plan: text("plan").notNull(), // basic_1_instance, pro_5_instances, extra_slot
  baseAmount: text("base_amount").notNull().default("0.00"), // Monto del plan base
  extraAmount: text("extra_amount").notNull().default("0.00"), // Monto de slots extra
  extraSlots: text("extra_slots").notNull().default("0"), // Cantidad de slots extra en esta factura
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed
  stripeInvoiceId: text("stripe_invoice_id"), // Para futura integración
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  phoneNumber: z.string().min(1, "El número de teléfono es requerido").optional(),
});

export const updateUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
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

export const updateSubaccountOpenAIKeySchema = z.object({
  openaiApiKey: z.string().min(1, "API Key de OpenAI es requerida"),
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
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserPassword = z.infer<typeof updateUserPasswordSchema>;

export type Subaccount = typeof subaccounts.$inferSelect;
export type InsertSubaccount = z.infer<typeof insertSubaccountSchema>;
export type CreateSubaccount = z.infer<typeof createSubaccountSchema>;
export type UpdateSubaccountOpenAIKey = z.infer<typeof updateSubaccountOpenAIKeySchema>;

export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = z.infer<typeof insertWhatsappInstanceSchema>;
export type CreateWhatsappInstance = z.infer<typeof createWhatsappInstanceSchema>;
export type UpdateWhatsappInstance = z.infer<typeof updateWhatsappInstanceSchema>;

// Subscriptions
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(["none", "basic_1_instance", "pro_5_instances"]).optional(),
  includedInstances: z.string().optional(),
  extraSlots: z.string().optional(),
  basePrice: z.string().optional(),
  extraPrice: z.string().optional(),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
});

// Invoices
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
