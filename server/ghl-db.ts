import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/ghl-schema";

// Conexión a la base de datos externa de GoHighLevel
function createGhlDbConnection() {
  // Verificar que las credenciales estén configuradas
  const host = process.env.GHL_DB_HOST;
  const port = process.env.GHL_DB_PORT;
  const database = process.env.GHL_DB_NAME;
  const user = process.env.GHL_DB_USER;
  const password = process.env.GHL_DB_PASSWORD;

  if (!host || !port || !database || !user || !password) {
    console.warn('GHL Database credentials not fully configured. Some features may not work.');
    // Retornar una conexión mock si no están configuradas
    return null;
  }

  const pool = new Pool({
    host,
    port: parseInt(port),
    database,
    user,
    password,
    ssl: false, // Configurar según sea necesario
  });

  return drizzle(pool, { schema });
}

export const ghlDb = createGhlDbConnection();
export const isGhlDbConfigured = ghlDb !== null;
