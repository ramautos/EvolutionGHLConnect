import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subaccounts = pgTable("subaccounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  ghlId: text("ghl_id").notNull(),
  name: text("name").notNull(),
  selected: boolean("selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappInstances = pgTable("whatsapp_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subaccountId: varchar("subaccount_id").references(() => subaccounts.id),
  instanceName: text("instance_name").notNull(),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("created"),
  qrCode: text("qr_code"),
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow(),
  connectedAt: timestamp("connected_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSubaccountSchema = createInsertSchema(subaccounts).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappInstanceSchema = createInsertSchema(whatsappInstances).omit({
  id: true,
  createdAt: true,
  connectedAt: true,
});

export const updateWhatsappInstanceSchema = z.object({
  phoneNumber: z.string().optional(),
  status: z.enum(["created", "qr_generated", "connected", "disconnected", "error"]).optional(),
  qrCode: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  connectedAt: z.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSubaccount = z.infer<typeof insertSubaccountSchema>;
export type Subaccount = typeof subaccounts.$inferSelect;
export type InsertWhatsappInstance = z.infer<typeof insertWhatsappInstanceSchema>;
export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type UpdateWhatsappInstance = z.infer<typeof updateWhatsappInstanceSchema>;
