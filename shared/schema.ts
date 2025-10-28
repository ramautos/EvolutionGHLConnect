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
// COMPANIES TABLE - Empresas (agrupación de usuarios)
// ============================================
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Nombre de la empresa
  email: text("email").notNull(), // Email principal de contacto
  phoneNumber: text("phone_number"), // Teléfono de contacto
  country: text("country"), // País
  address: text("address"), // Dirección
  notes: text("notes"), // Notas internas del administrador
  
  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"), // ID del customer en Stripe
  stripeSubscriptionId: text("stripe_subscription_id"), // ID de la suscripción en Stripe
  
  // Estado
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// USERS TABLE - Usuarios con autenticación
// ============================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "set null" }), // Empresa a la que pertenece
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
  calendarId: text("calendar_id"), // GHL Calendar ID para integraciones
  isActive: boolean("is_active").notNull().default(true),
  
  // Control manual por administrador
  billingEnabled: boolean("billing_enabled").notNull().default(true), // Si se cobra o no a esta subcuenta
  manuallyActivated: boolean("manually_activated").notNull().default(true), // Si está activada manualmente por admin
  
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
  plan: text("plan").notNull().default("none"), // none, starter, basic, pro
  includedInstances: text("included_instances").notNull().default("0"), // Instancias incluidas en el plan base
  extraSlots: text("extra_slots").notNull().default("0"), // Instancias adicionales compradas ($5 c/u)
  basePrice: text("base_price").notNull().default("0.00"), // Precio base del plan ($10, $19 o $29)
  extraPrice: text("extra_price").notNull().default("0.00"), // Precio total de slots extra
  status: text("status").notNull().default("active"), // active, expired, cancelled
  
  // Período de prueba gratuito (15 días)
  trialEndsAt: timestamp("trial_ends_at"), // Fecha cuando termina el período de prueba (null = sin prueba)
  inTrial: boolean("in_trial").notNull().default(true), // Indicador si está actualmente en prueba
  
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
  plan: text("plan").notNull(), // starter, basic, pro, extra_slot
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
// WEBHOOK CONFIG TABLE - Configuración de webhook (admin-only)
// ============================================
export const webhookConfig = pgTable("webhook_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookUrl: text("webhook_url").notNull(), // URL donde se reenvían los mensajes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// ZOD SCHEMAS - Validación
// ============================================

// Companies
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCompanySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;
export type SelectCompany = typeof companies.$inferSelect;

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

export const updateSubaccountCalendarIdSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID es requerido"),
});

export const updateSubaccountCrmSettingsSchema = z.object({
  calendarId: z.string().optional(),
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
export type UpdateSubaccountCalendarId = z.infer<typeof updateSubaccountCalendarIdSchema>;
export type UpdateSubaccountCrmSettings = z.infer<typeof updateSubaccountCrmSettingsSchema>;

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

// Webhook Config
export const insertWebhookConfigSchema = createInsertSchema(webhookConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWebhookConfigSchema = z.object({
  webhookUrl: z.string().url("URL de webhook inválida").optional(),
  isActive: z.boolean().optional(),
});

export type WebhookConfig = typeof webhookConfig.$inferSelect;
export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;
export type UpdateWebhookConfig = z.infer<typeof updateWebhookConfigSchema>;

// Schema para enviar mensajes de WhatsApp
export const sendWhatsappMessageSchema = z.object({
  number: z.string().min(10, "El número debe tener al menos 10 dígitos"),
  text: z.string().min(1, "El mensaje no puede estar vacío"),
});
export type SendWhatsappMessage = z.infer<typeof sendWhatsappMessageSchema>;
