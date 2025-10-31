import { db } from "./db";
import { companies, subaccounts, subscriptions, systemConfig } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "url";
import path from "path";

/**
 * Bootstrap script para inicializar la base de datos de producción
 * Se ejecuta una sola vez después de desplegar la aplicación
 * 
 * Variables de entorno requeridas:
 * - ADMIN_INITIAL_EMAIL: Email del administrador inicial
 * - ADMIN_INITIAL_PASSWORD: Contraseña del administrador inicial
 * - DATABASE_URL: URL de la base de datos (ya configurada por Replit)
 */

// Lazy loading: Cache en memoria para evitar queries repetidas
let isInitializedCache: boolean | null = null;
let bootstrapPromise: Promise<boolean> | null = null;

/**
 * Ejecuta el proceso de inicialización de la base de datos
 * Retorna true si se ejecutó el bootstrap, false si ya estaba inicializada
 * Lanza error si algo sale mal
 */
export async function runBootstrap(): Promise<boolean> {
  // Si ya hay un bootstrap corriendo, esperar a que termine
  if (bootstrapPromise) {
    console.log("⏳ Bootstrap already running, waiting for completion...");
    return bootstrapPromise;
  }

  // Si ya verificamos y está inicializada, retornar inmediatamente
  if (isInitializedCache === true) {
    console.log("✅ Database already initialized (cached). Skipping bootstrap.");
    return false;
  }

  // Crear promesa de bootstrap para evitar ejecuciones múltiples
  bootstrapPromise = (async () => {
    try {
      console.log("🚀 Starting database bootstrap...");
      console.log("📊 Current database:", process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown');

      // Verificar si ya está inicializada PRIMERO
      const existingConfig = await db.query.systemConfig.findFirst();
      
      if (existingConfig?.isInitialized) {
        console.log("✅ Database already initialized. Skipping bootstrap.");
        isInitializedCache = true; // Cachear resultado
        return false;
      }

      return await performBootstrap(existingConfig);
    } finally {
      // Limpiar promesa para permitir reintentos en caso de error
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

/**
 * Ejecuta el bootstrap real (separado para mejor estructura)
 */
async function performBootstrap(existingConfig: any): Promise<boolean> {
  // Solo ahora validar credenciales (porque necesitamos inicializar)
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD are required to initialize the database. " +
      "Please configure these secrets before starting the server."
    );
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

  // 2. Crear empresa especial para subcuentas pendientes de claim
  console.log("🏢 Creating PENDING_CLAIM company for unclaimed subaccounts...");
  let pendingCompany = await db.query.companies.findFirst({
    where: eq(companies.id, "PENDING_CLAIM"),
  });

  if (!pendingCompany) {
    const [newPendingCompany] = await db.insert(companies).values({
      id: "PENDING_CLAIM",
      name: "Pending Claim",
      email: "pending@system.internal",
      isActive: true, // DEBE estar activa para que foreign key funcione
    }).returning();
    pendingCompany = newPendingCompany;
    console.log(`   ✓ PENDING_CLAIM company created (ID: ${pendingCompany.id})`);
  } else {
    // Asegurar que siempre esté activa
    await db.update(companies)
      .set({ isActive: true })
      .where(eq(companies.id, "PENDING_CLAIM"));
    console.log(`   ✓ PENDING_CLAIM company already exists and activated (ID: ${pendingCompany.id})`);
  }

  // 3. Crear o actualizar usuario administrador del sistema (SIN empresa)
  console.log("👤 Creating/updating system administrator...");
  let adminUser = await db.query.subaccounts.findFirst({
    where: eq(subaccounts.email, adminEmail),
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  if (!adminUser) {
    const [newAdmin] = await db.insert(subaccounts).values({
      companyId: null, // System admin NO tiene empresa
      name: "System Administrator",
      email: adminEmail,
      passwordHash,
      role: "system_admin", // Rol especial para admin del sistema
      isActive: true,
      billingEnabled: false,
      manuallyActivated: true,
      locationId: "SYSTEM_ADMIN", // Identificador especial
    }).returning();
    adminUser = newAdmin;
    console.log(`   ✓ System admin created: ${adminUser.email} (ID: ${adminUser.id})`);
  } else {
    // Actualizar contraseña y asegurar que es system_admin
    await db.update(subaccounts)
      .set({
        passwordHash,
        role: "system_admin",
        isActive: true,
        companyId: null, // Asegurar que NO tiene empresa
      })
      .where(eq(subaccounts.id, adminUser.id));
    console.log(`   ✓ System admin updated: ${adminUser.email} (ID: ${adminUser.id})`);
  }

  // 4. NO crear suscripción para system_admin (no la necesita)
  console.log("   ℹ️  System admin doesn't need subscription (manages all companies)");

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
  console.log(`   System Admin Email: ${adminUser.email}`);
  console.log(`   System Admin Role: ${adminUser.role}`);
  console.log(`   Company: N/A (system admin has no company)`);
  console.log(`   PENDING_CLAIM Company: ${pendingCompany.id}`);
  console.log(`   Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'unknown'}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✨ You can now login with the admin credentials");
  console.log("   To reset the admin password, run this script again with a new ADMIN_INITIAL_PASSWORD");
  
  // Cachear el estado para evitar queries futuras
  isInitializedCache = true;
  
  return true;
}

/**
 * CLI entry point - solo se ejecuta cuando se llama directamente desde la línea de comandos
 * DISABLED: Se ejecuta automáticamente desde server.listen() callback
 * Si necesitas ejecutar manualmente: npx tsx server/bootstrap.ts
 */
// async function runAsScript() {
//   try {
//     const wasBootstrapped = await runBootstrap();
//     process.exit(wasBootstrapped ? 0 : 0);
//   } catch (error) {
//     console.error("❌ Bootstrap failed:");
//     console.error(error);
//     process.exit(1);
//   }
// }

// DISABLED: Auto-ejecución bloqueaba el inicio del servidor en producción
// El bootstrap ahora se ejecuta dentro del callback de server.listen()
// const scriptPath = path.resolve(process.argv[1]);
// const isMainModule = import.meta.url === pathToFileURL(scriptPath).href;
// if (isMainModule) {
//   runAsScript();
// }
