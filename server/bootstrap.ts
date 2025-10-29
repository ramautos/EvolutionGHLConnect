import { db } from "./db";
import { companies, subaccounts, subscriptions, systemConfig } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Bootstrap script para inicializar la base de datos de producción
 * Se ejecuta una sola vez después de desplegar la aplicación
 * 
 * Variables de entorno requeridas:
 * - ADMIN_INITIAL_EMAIL: Email del administrador inicial
 * - ADMIN_INITIAL_PASSWORD: Contraseña del administrador inicial
 * - DATABASE_URL: URL de la base de datos (ya configurada por Replit)
 */

/**
 * Ejecuta el proceso de inicialización de la base de datos
 * Retorna true si se ejecutó el bootstrap, false si ya estaba inicializada
 * Lanza error si algo sale mal
 */
export async function runBootstrap(): Promise<boolean> {
  console.log("🚀 Starting database bootstrap...");
  console.log("📊 Current database:", process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown');

  // Validar variables de entorno
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️  Warning: ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD not configured");
    console.warn("   Admin account will not be created automatically");
    return false;
  }

  // Verificar si ya está inicializada
  const existingConfig = await db.query.systemConfig.findFirst();
  
  if (existingConfig?.isInitialized) {
    console.log("✅ Database already initialized. Skipping bootstrap.");
    return false;
  }

  console.log("🔧 Database not initialized. Starting bootstrap process...");

  // 1. Crear o actualizar configuración del sistema
  console.log("📝 Creating system configuration...");
  let config = existingConfig;
  
  if (!config) {
    const [newConfig] = await db.insert(systemConfig).values({
      systemName: "WhatsApp AI Platform",
      trialDays: "15",
      trialEnabled: true,
      isInitialized: false,
    }).returning();
    config = newConfig;
    console.log("   ✓ System configuration created");
  }

  // 2. Crear empresa predeterminada si no existe
  console.log("🏢 Creating default company...");
  let defaultCompany = await db.query.companies.findFirst({
    where: eq(companies.email, adminEmail),
  });

  if (!defaultCompany) {
    const [newCompany] = await db.insert(companies).values({
      name: "Default Company",
      email: adminEmail,
      isActive: true,
    }).returning();
    defaultCompany = newCompany;
    console.log(`   ✓ Default company created: ${defaultCompany.name} (ID: ${defaultCompany.id})`);
  } else {
    console.log(`   ✓ Default company already exists: ${defaultCompany.name} (ID: ${defaultCompany.id})`);
  }

  // 3. Crear o actualizar usuario administrador
  console.log("👤 Creating/updating admin user...");
  let adminUser = await db.query.subaccounts.findFirst({
    where: eq(subaccounts.email, adminEmail),
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  if (!adminUser) {
    const [newAdmin] = await db.insert(subaccounts).values({
      companyId: defaultCompany.id,
      name: "System Administrator",
      email: adminEmail,
      passwordHash,
      role: "admin",
      isActive: true,
      billingEnabled: false,
      manuallyActivated: true,
    }).returning();
    adminUser = newAdmin;
    console.log(`   ✓ Admin user created: ${adminUser.email} (ID: ${adminUser.id})`);
  } else {
    // Actualizar contraseña y asegurar que es admin
    await db.update(subaccounts)
      .set({
        passwordHash,
        role: "admin",
        isActive: true,
        companyId: defaultCompany.id,
      })
      .where(eq(subaccounts.id, adminUser.id));
    console.log(`   ✓ Admin user updated: ${adminUser.email} (ID: ${adminUser.id})`);
  }

  // 4. Crear suscripción para el admin si no existe
  console.log("💳 Ensuring admin subscription...");
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.subaccountId, adminUser.id),
  });

  if (!existingSubscription) {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    await db.insert(subscriptions).values({
      subaccountId: adminUser.id,
      plan: "none",
      status: "active",
      trialEndsAt: trialEndDate,
      inTrial: true,
    });
    console.log("   ✓ Admin subscription created with 15-day trial");
  } else {
    console.log("   ✓ Admin subscription already exists");
  }

  // 5. Marcar como inicializada
  console.log("✅ Marking database as initialized...");
  await db.update(systemConfig)
    .set({
      isInitialized: true,
      updatedAt: new Date(),
    })
    .where(eq(systemConfig.id, config.id));

  console.log("\n🎉 Bootstrap completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Summary:");
  console.log(`   Company: ${defaultCompany.name}`);
  console.log(`   Admin Email: ${adminUser.email}`);
  console.log(`   Admin Role: ${adminUser.role}`);
  console.log(`   Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown'}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✨ You can now login with the admin credentials");
  console.log("   To reset the admin password, run this script again with a new ADMIN_INITIAL_PASSWORD");
  
  return true;
}

/**
 * CLI entry point - solo se ejecuta cuando se llama directamente desde la línea de comandos
 */
async function runAsScript() {
  try {
    const wasBootstrapped = await runBootstrap();
    process.exit(wasBootstrapped ? 0 : 0);
  } catch (error) {
    console.error("❌ Bootstrap failed:");
    console.error(error);
    process.exit(1);
  }
}

// Solo ejecutar si es llamado directamente (no importado)
// En ES modules usamos import.meta.url para detectar si es el módulo principal
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runAsScript();
}
