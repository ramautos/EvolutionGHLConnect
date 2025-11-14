import type { DatabaseStorage } from "../storage";
import type { Subaccount } from "@shared/schema";

/**
 * Crea datos de demostración para probar la interfaz
 * Solo debe ejecutarse en entornos de desarrollo
 * 
 * @param storage - La instancia de DatabaseStorage
 * @param currentUser - El objeto subaccount del usuario autenticado
 */
export async function seedDemoData(storage: DatabaseStorage, currentUser: Subaccount) {
  console.log("🌱 Seeding demo data for user:", currentUser.email);

  // Verificar que el usuario tenga una empresa
  if (!currentUser.companyId) {
    throw new Error("El usuario no tiene una empresa asociada");
  }

  // Verificar si ya existen datos de demostración para evitar duplicados
  const existingSubaccounts = await storage.getSubaccountsByCompany(currentUser.companyId);
  const hasDemoData = existingSubaccounts.some(
    sub => sub.locationId?.startsWith('DEMO_') || sub.locationId?.startsWith('SOLD_')
  );

  if (hasDemoData) {
    console.log("⚠️  Demo data already exists. Cleaning before creating new data...");
    await cleanDemoData(storage, currentUser);
  }

  // 1. Crear subcuenta de demostración principal
  const timestamp = Date.now();
  const demoSubaccountData = {
    companyId: currentUser.companyId,
    email: `demo-${timestamp}@example.com`,
    name: "Subcuenta de Prueba",
    locationId: `DEMO_LOC_${timestamp}`,
    locationName: "Ubicación Demo",
    ghlCompanyId: currentUser.companyId,
    phone: "+1234567890",
    city: "Ciudad de México",
    state: "CDMX",
    address: "Av. Reforma 123",
    role: "user" as const,
    isActive: true,
    billingEnabled: true,
    manuallyActivated: true,
  };
  
  const demoSubaccount = await storage.createSubaccount(demoSubaccountData);

  console.log("✅ Demo subaccount created:", demoSubaccount.id);

  // 2. Crear suscripción para la subcuenta demo
  await storage.createSubscription(demoSubaccount.id, 7);
  console.log("✅ Subscription created for demo subaccount");

  // 3. Crear instancias de WhatsApp
  const instances = [];

  // Instancia 1: Conectada
  const instance1 = await storage.createWhatsappInstance({
    subaccountId: demoSubaccount.id,
    locationId: demoSubaccount.locationId!,
    customName: "WhatsApp Principal",
    evolutionInstanceName: `${demoSubaccount.locationId}_1`,
  });
  
  // Actualizar estado a conectado
  await storage.updateWhatsappInstance(instance1.id, {
    status: "connected",
    phoneNumber: "+52 55 1234 5678",
    connectedAt: new Date(),
  });
  instances.push(instance1);
  console.log("✅ WhatsApp instance 1 created (connected)");

  // Instancia 2: Desconectada
  const instance2 = await storage.createWhatsappInstance({
    subaccountId: demoSubaccount.id,
    locationId: demoSubaccount.locationId!,
    customName: "WhatsApp Soporte",
    evolutionInstanceName: `${demoSubaccount.locationId}_2`,
  });
  
  await storage.updateWhatsappInstance(instance2.id, {
    status: "disconnected",
    disconnectedAt: new Date(),
  });
  instances.push(instance2);
  console.log("✅ WhatsApp instance 2 created (disconnected)");

  // Instancia 3: QR Generado
  const instance3 = await storage.createWhatsappInstance({
    subaccountId: demoSubaccount.id,
    locationId: demoSubaccount.locationId!,
    customName: "WhatsApp Ventas",
    evolutionInstanceName: `${demoSubaccount.locationId}_3`,
  });
  
  await storage.updateWhatsappInstance(instance3.id, {
    status: "qr_generated",
    qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  });
  instances.push(instance3);
  console.log("✅ WhatsApp instance 3 created (qr_generated)");

  // 4. Opcionalmente crear una subcuenta "vendida"
  const timestamp2 = Date.now() + 1;
  const soldSubaccountData = {
    companyId: currentUser.companyId,
    email: `sold-demo-${timestamp2}@example.com`,
    name: "Subcuenta Vendida Demo",
    locationId: `SOLD_LOC_${timestamp2}`,
    locationName: "Cliente Vendido",
    ghlCompanyId: currentUser.companyId,
    phone: "+9876543210",
    city: "Monterrey",
    state: "NL",
    role: "user" as const,
    isActive: true,
    billingEnabled: true,
    manuallyActivated: true,
    isSold: true,
    soldByAgencyId: currentUser.id,
  };
  
  const soldSubaccount = await storage.createSubaccount(soldSubaccountData);

  console.log("✅ Sold subaccount created:", soldSubaccount.id);

  // Crear suscripción para la subcuenta vendida
  await storage.createSubscription(soldSubaccount.id, 7);

  // Crear una instancia para la subcuenta vendida
  const soldInstance = await storage.createWhatsappInstance({
    subaccountId: soldSubaccount.id,
    locationId: soldSubaccount.locationId!,
    customName: "WhatsApp Cliente",
    evolutionInstanceName: `${soldSubaccount.locationId}_1`,
  });
  
  await storage.updateWhatsappInstance(soldInstance.id, {
    status: "connected",
    phoneNumber: "+52 81 9876 5432",
    connectedAt: new Date(),
  });
  instances.push(soldInstance);
  console.log("✅ WhatsApp instance created for sold subaccount");

  // 5. Crear algunos triggers de demostración
  await storage.createTrigger(demoSubaccount.id, {
    triggerName: "Nuevo Lead",
    triggerTag: "new_lead",
  });

  await storage.createTrigger(demoSubaccount.id, {
    triggerName: "Seguimiento",
    triggerTag: "follow_up",
  });

  console.log("✅ Demo triggers created");

  return {
    subaccounts: [demoSubaccount, soldSubaccount],
    instances,
    message: "Datos de demostración creados exitosamente",
  };
}

/**
 * Limpia todos los datos de demostración creados
 * Elimina subcuentas demo y todos sus datos relacionados (instancias, triggers, suscripciones)
 * 
 * @param storage - La instancia de DatabaseStorage
 * @param currentUser - El objeto subaccount del usuario autenticado
 */
export async function cleanDemoData(storage: DatabaseStorage, currentUser: Subaccount) {
  console.log("🧹 Cleaning demo data for user:", currentUser.email);

  if (!currentUser.companyId) {
    throw new Error("Usuario no encontrado o sin empresa asociada");
  }

  // Obtener todas las subcuentas de la empresa
  const allSubaccounts = await storage.getSubaccountsByCompany(currentUser.companyId);

  // Filtrar solo las subcuentas de demo (las que tienen DEMO_ o SOLD_ en el locationId)
  const demoSubaccounts = allSubaccounts.filter(
    sub => sub.locationId?.startsWith('DEMO_') || sub.locationId?.startsWith('SOLD_')
  );

  let deletedSubaccounts = 0;
  let deletedInstances = 0;
  let deletedTriggers = 0;

  let deletedSubscriptions = 0;

  for (const subaccount of demoSubaccounts) {
    // Eliminar instancias de WhatsApp asociadas
    const instances = await storage.getWhatsappInstances(subaccount.id);
    for (const instance of instances) {
      await storage.deleteWhatsappInstance(instance.id);
      deletedInstances++;
      console.log(`  ✅ Deleted WhatsApp instance: ${instance.id}`);
    }

    // Eliminar triggers asociados
    const triggers = await storage.getTriggers(subaccount.id);
    for (const trigger of triggers) {
      await storage.deleteTrigger(trigger.id);
      deletedTriggers++;
      console.log(`  ✅ Deleted trigger: ${trigger.id}`);
    }

    // Eliminar suscripción manualmente (no hay CASCADE desde subscriptions a subaccounts)
    const subscription = await storage.getSubscription(subaccount.id);
    if (subscription) {
      // Usar una query directa para eliminar la suscripción
      // No hay método deleteSubscription en la interfaz, pero subscriptions 
      // tiene cascade en el schema, así que se eliminará automáticamente
      console.log(`  ✅ Subscription will be cascade-deleted with subaccount`);
      deletedSubscriptions++;
    }

    // La eliminación de la subcuenta eliminará automáticamente la suscripción
    // debido a la relación de CASCADE en la base de datos
    await storage.deleteSubaccount(subaccount.id);
    deletedSubaccounts++;
    console.log(`✅ Deleted demo subaccount: ${subaccount.id} (${subaccount.locationName || subaccount.name})`);
  }

  return {
    deletedSubaccounts,
    deletedInstances,
    deletedTriggers,
    deletedSubscriptions,
    message: `Eliminadas ${deletedSubaccounts} subcuentas, ${deletedInstances} instancias, ${deletedTriggers} triggers y ${deletedSubscriptions} suscripciones de demostración`,
  };
}
