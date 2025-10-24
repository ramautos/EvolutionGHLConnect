import { pgTable, serial, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabla ghl_clientes en la base de datos externa de GoHighLevel
export const ghlClientes = pgTable("ghl_clientes", {
  id: serial("id").primaryKey(),
  locationid: varchar("locationid", { length: 255 }),
  companyid: varchar("companyid", { length: 255 }),
  userid: varchar("userid", { length: 255 }),
  accesstoken: text("accesstoken"),
  refreshtoken: text("refreshtoken"),
  refreshtokenid: varchar("refreshtokenid", { length: 255 }),
  expiresat: timestamp("expiresat"),
  scopes: text("scopes"),
  isactive: boolean("isactive").default(true),
  isbulkinstallation: boolean("isbulkinstallation").default(false),
  appclientid: varchar("appclientid", { length: 255 }),
  installedat: timestamp("installedat").defaultNow(),
  lastrefreshed: timestamp("lastrefreshed"),
  uninstalledat: timestamp("uninstalledat"),
  nombreCliente: varchar("nombre_cliente", { length: 255 }),
  emailCliente: varchar("email_cliente", { length: 255 }),
  telefonoCliente: varchar("telefono_cliente", { length: 50 }),
  subcuenta: varchar("subcuenta", { length: 255 }),
  cuentaPrincipal: varchar("cuenta_principal", { length: 255 }),
});

export const insertGhlClienteSchema = createInsertSchema(ghlClientes).omit({
  id: true,
  installedat: true,
});

export type InsertGhlCliente = z.infer<typeof insertGhlClienteSchema>;
export type GhlCliente = typeof ghlClientes.$inferSelect;
