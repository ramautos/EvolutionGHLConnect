import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ENUMS
// ============================================
export const roleEnum = pgEnum("role", ["user", "admin", "system_admin"]);

// ============================================
// SESSIONS TABLE - Sesiones de Passport.js (connect-pg-simple)
// ============================================
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ============================================
// COMPANIES TABLE - Empresas (nivel superior de jerarquía)
// ============================================
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  country: text("country"),
  address: text("address"),
  notes: text("notes"),
  
  // GoHighLevel Integration
  ghlCompanyId: text("ghl_company_id").unique(),
  
  // Stripe integration (a nivel de empresa para facturación consolidada)
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// SUBACCOUNTS TABLE - Subcuentas (usuarios del sistema con autenticación)
// ============================================
export const subaccounts = pgTable("subaccounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: "cascade" }),
  
  // GoHighLevel Integration (opcionales para registro manual)
  locationId: text("location_id").unique(),
  locationName: text("location_name"), // Nombre de la subcuenta en GoHighLevel
  ghlCompanyId: text("ghl_company_id"),
  
  // Información básica
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // Email para login
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  address: text("address"),
  
  // Autenticación (fusionado desde users)
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  role: roleEnum("role").notNull().default("user"),
  lastLoginAt: timestamp("last_login_at"),
  
  // Configuración de API para Transcripciones y Audio
  elevenLabsApiKey: text("eleven_labs_api_key"),
  geminiApiKey: text("gemini_api_key"),
  
  // Notificaciones de desconexión de WhatsApp
  notificationPhone: text("notification_phone"),
  
  // Control de estado
  isActive: boolean("is_active").notNull().default(true),
  billingEnabled: boolean("billing_enabled").notNull().default(true),
  manuallyActivated: boolean("manually_activated").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  installedAt: timestamp("installed_at"),
  uninstalledAt: timestamp("uninstalled_at"),
});

// ============================================
// TRIGGERS TABLE - Triggers ilimitados por subcuenta
// ============================================
export const triggers = pgTable("triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subaccountId: varchar("subaccount_id").notNull().references(() => subaccounts.id, { onDelete: "cascade" }),
  
  // Configuración del trigger
  triggerName: text("trigger_name").notNull(),
  triggerTag: text("trigger_tag").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// WHATSAPP INSTANCES TABLE - Instancias de WhatsApp
// ============================================
export const whatsappInstances = pgTable("whatsapp_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subaccountId: varchar("subaccount_id").notNull().references(() => subaccounts.id, { onDelete: "cascade" }),
  locationId: text("location_id").notNull(),
  
  // Nombres
  customName: text("custom_name"),
  evolutionInstanceName: text("evolution_instance_name").notNull(),
  
  // Conexión
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("created"),
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
  plan: text("plan").notNull().default("trial"),
  maxSubaccounts: text("max_subaccounts").notNull().default("1"),
  includedInstances: text("included_instances").notNull().default("1"),
  extraSlots: text("extra_slots").notNull().default("0"),
  basePrice: text("base_price").notNull().default("0.00"),
  extraPrice: text("extra_price").notNull().default("0.00"),
  status: text("status").notNull().default("active"),
  
  // Trial period
  trialEndsAt: timestamp("trial_ends_at"),
  inTrial: boolean("in_trial").notNull().default(true),
  
  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeProductId: text("stripe_product_id"),
  
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
  amount: text("amount").notNull(),
  plan: text("plan").notNull(),
  baseAmount: text("base_amount").notNull().default("0.00"),
  extraAmount: text("extra_amount").notNull().default("0.00"),
  extraSlots: text("extra_slots").notNull().default("0"),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  stripeInvoiceId: text("stripe_invoice_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// WEBHOOK CONFIG TABLE - Configuración de webhook (admin-only)
// ============================================
export const webhookConfig = pgTable("webhook_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookUrl: text("webhook_url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// SYSTEM CONFIG TABLE - Configuración general del sistema (admin-only)
// ============================================
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Evolution API Configuration
  evolutionApiUrl: text("evolution_api_url"),
  evolutionApiKey: text("evolution_api_key"),
  
  // System Settings
  systemName: text("system_name").notNull().default("WhatsApp Platform"),
  systemEmail: text("system_email"),
  supportEmail: text("support_email"),
  
  // Trial Configuration
  trialDays: text("trial_days").notNull().default("15"),
  trialEnabled: boolean("trial_enabled").notNull().default(true),
  
  // Maintenance Mode
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message"),
  
  // Bootstrap Flag
  isInitialized: boolean("is_initialized").notNull().default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// OAUTH STATES TABLE - Validación de OAuth flow
// ============================================
export const oauthStates = pgTable("oauth_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  state: text("state").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => subaccounts.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

// Subaccounts (usuarios del sistema)
export const insertSubaccountSchema = createInsertSchema(subaccounts).omit({
  id: true,
  createdAt: true,
  installedAt: true,
  uninstalledAt: true,
  lastLoginAt: true,
});

export const registerSubaccountSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

export const loginSubaccountSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const createSubaccountSchema = z.object({
  companyId: z.string().uuid(),
  locationId: z.string().min(1, "Location ID es requerido"),
  ghlCompanyId: z.string().min(1, "Company ID es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
});

export const updateSubaccountProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  phone: z.string().min(1, "El número de teléfono es requerido").optional(),
});

export const updateSubaccountPasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export const updateSubaccountElevenLabsKeySchema = z.object({
  elevenLabsApiKey: z.string().min(1, "API Key de Eleven Labs es requerida"),
});

export const updateSubaccountGeminiKeySchema = z.object({
  geminiApiKey: z.string().min(1, "API Key de Gemini es requerida"),
});

export const updateSubaccountApiSettingsSchema = z.object({
  elevenLabsApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  notificationPhone: z.string().optional(),
  triggerName: z.string().optional(),
  triggerTag: z.string().optional(),
});

export type Subaccount = typeof subaccounts.$inferSelect;
export type InsertSubaccount = z.infer<typeof insertSubaccountSchema>;
export type RegisterSubaccount = z.infer<typeof registerSubaccountSchema>;
export type LoginSubaccount = z.infer<typeof loginSubaccountSchema>;
export type CreateSubaccount = z.infer<typeof createSubaccountSchema>;
export type UpdateSubaccountProfile = z.infer<typeof updateSubaccountProfileSchema>;
export type UpdateSubaccountPassword = z.infer<typeof updateSubaccountPasswordSchema>;
export type UpdateSubaccountElevenLabsKey = z.infer<typeof updateSubaccountElevenLabsKeySchema>;
export type UpdateSubaccountGeminiKey = z.infer<typeof updateSubaccountGeminiKeySchema>;
export type UpdateSubaccountApiSettings = z.infer<typeof updateSubaccountApiSettingsSchema>;

// WhatsApp Instances
export const insertWhatsappInstanceSchema = createInsertSchema(whatsappInstances).omit({
  id: true,
  createdAt: true,
  connectedAt: true,
  disconnectedAt: true,
  lastActivityAt: true,
});

export const createWhatsappInstanceSchema = z.object({
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

export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = z.infer<typeof insertWhatsappInstanceSchema>;
export type CreateWhatsappInstance = z.infer<typeof createWhatsappInstanceSchema>;
export type UpdateWhatsappInstance = z.infer<typeof updateWhatsappInstanceSchema>;

// Triggers
export const insertTriggerSchema = createInsertSchema(triggers).omit({
  id: true,
  createdAt: true,
});

export const createTriggerSchema = z.object({
  triggerName: z.string().min(1, "El nombre del trigger es requerido").max(100, "Máximo 100 caracteres").trim(),
  triggerTag: z.string().min(1, "El nombre de la etiqueta es requerido").max(100, "Máximo 100 caracteres").trim(),
});

export const updateTriggerSchema = z.object({
  triggerName: z.string().min(1, "El nombre del trigger es requerido").max(100, "Máximo 100 caracteres").trim().optional(),
  triggerTag: z.string().min(1, "El nombre de la etiqueta es requerido").max(100, "Máximo 100 caracteres").trim().optional(),
});

export type Trigger = typeof triggers.$inferSelect;
export type InsertTrigger = z.infer<typeof insertTriggerSchema>;
export type CreateTrigger = z.infer<typeof createTriggerSchema>;
export type UpdateTrigger = z.infer<typeof updateTriggerSchema>;

// Subscriptions
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(["trial", "none", "starter", "profesional", "business"]).optional(),
  maxSubaccounts: z.string().optional(),
  includedInstances: z.string().optional(),
  extraSlots: z.string().optional(),
  basePrice: z.string().optional(),
  extraPrice: z.string().optional(),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeProductId: z.string().optional(),
  inTrial: z.boolean().optional(),
  trialEndsAt: z.date().optional(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;

// Invoices
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

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

// System Config
export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSystemConfigSchema = z.object({
  evolutionApiUrl: z.string().url("URL de Evolution API inválida").min(1, "URL de Evolution API es requerida"),
  evolutionApiKey: z.string().min(1, "API Key de Evolution es requerida"),
  systemName: z.string().min(1, "Nombre del sistema es requerido").optional(),
  systemEmail: z.union([z.string().email(), z.literal("")]).optional(),
  supportEmail: z.union([z.string().email(), z.literal("")]).optional(),
  trialDays: z.string().optional(),
  trialEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type UpdateSystemConfig = z.infer<typeof updateSystemConfigSchema>;

// OAuth States
export const insertOAuthStateSchema = createInsertSchema(oauthStates).omit({
  id: true,
  createdAt: true,
});

export type OAuthState = typeof oauthStates.$inferSelect;
export type InsertOAuthState = z.infer<typeof insertOAuthStateSchema>;

// Schema para enviar mensajes de WhatsApp
export const sendWhatsappMessageSchema = z.object({
  number: z.string().min(10, "El número debe tener al menos 10 dígitos"),
  text: z.string().min(1, "El mensaje no puede estar vacío"),
});
export type SendWhatsappMessage = z.infer<typeof sendWhatsappMessageSchema>;
