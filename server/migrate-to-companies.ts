import { db } from "./db";
import { companies, users } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Script de migración para agrupar usuarios existentes en empresas
 * 
 * Estrategia:
 * 1. Agrupar usuarios por dominio de email (@domain.com)
 * 2. Crear una empresa por cada dominio
 * 3. Asignar usuarios a sus respectivas empresas
 * 4. Usuarios con dominios únicos o personales (@gmail, @outlook, etc.) 
 *    crean empresas individuales
 */

const PERSONAL_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

async function migrateUsersToCompanies() {
  console.log('🚀 Iniciando migración de usuarios a empresas...\n');
  
  try {
    // 1. Obtener todos los usuarios sin empresa asignada
    const allUsers = await db
      .select()
      .from(users)
      .where(isNull(users.companyId));
    
    if (allUsers.length === 0) {
      console.log('✅ No hay usuarios pendientes de migrar');
      return;
    }
    
    console.log(`📊 Encontrados ${allUsers.length} usuarios para migrar\n`);
    
    // 2. Agrupar usuarios por dominio de email
    const usersByDomain: Map<string, typeof allUsers> = new Map();
    
    for (const user of allUsers) {
      const domain = user.email.split('@')[1];
      
      if (!usersByDomain.has(domain)) {
        usersByDomain.set(domain, []);
      }
      
      usersByDomain.get(domain)!.push(user);
    }
    
    console.log(`📧 Encontrados ${usersByDomain.size} dominios únicos\n`);
    
    // 3. Crear empresas y asignar usuarios
    let companiesCreated = 0;
    let usersAssigned = 0;
    
    for (const [domain, domainUsers] of usersByDomain.entries()) {
      const isPersonalDomain = PERSONAL_DOMAINS.includes(domain);
      
      if (isPersonalDomain || domainUsers.length === 1) {
        // Crear empresa individual para cada usuario
        for (const user of domainUsers) {
          const [company] = await db
            .insert(companies)
            .values({
              name: user.name || user.email.split('@')[0],
              email: user.email,
              phoneNumber: user.phoneNumber,
              isActive: true,
            })
            .returning();
          
          await db
            .update(users)
            .set({ companyId: company.id })
            .where(eq(users.id, user.id));
          
          companiesCreated++;
          usersAssigned++;
          
          console.log(`✅ Empresa individual creada: "${company.name}" (${company.email})`);
        }
      } else {
        // Crear empresa única para el dominio
        const companyName = domain.split('.')[0].charAt(0).toUpperCase() + 
                          domain.split('.')[0].slice(1);
        
        const [company] = await db
          .insert(companies)
          .values({
            name: companyName,
            email: domainUsers[0].email, // Usar email del primer usuario como contacto
            phoneNumber: domainUsers[0].phoneNumber,
            isActive: true,
          })
          .returning();
        
        // Asignar todos los usuarios del dominio a esta empresa
        for (const user of domainUsers) {
          await db
            .update(users)
            .set({ companyId: company.id })
            .where(eq(users.id, user.id));
          
          usersAssigned++;
        }
        
        companiesCreated++;
        
        console.log(`✅ Empresa creada: "${company.name}" con ${domainUsers.length} usuarios`);
      }
    }
    
    console.log(`\n🎉 Migración completada exitosamente!`);
    console.log(`   - Empresas creadas: ${companiesCreated}`);
    console.log(`   - Usuarios asignados: ${usersAssigned}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

export { migrateUsersToCompanies };

// Ejecutar migración si se ejecuta directamente
migrateUsersToCompanies()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
