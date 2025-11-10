import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request, RequestHandler } from "express";
import { storage, DatabaseStorage } from "./storage";
import type { Subaccount } from "@shared/schema";

// ============================================
// CONFIGURACIÓN DE SESIONES
// ============================================
export function getSessionMiddleware() {
  // Validar SESSION_SECRET obligatorio
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in environment variables");
  }

  // Validar DATABASE_URL obligatorio
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for session storage");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 semana
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // La tabla ya fue creada manualmente
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      maxAge: sessionTtl,
    },
  });
}

// ============================================
// CONFIGURACIÓN DE PASSPORT
// ============================================
export function setupPassport(app: Express) {
  // Inicializar sesiones
  app.use(getSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  // ============================================
  // LOCAL STRATEGY (Email/Password)
  // ============================================
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Usar método especial para autenticación que incluye admins
          const subaccount = await storage.getSubaccountByEmailForAuth(email);

          if (!subaccount) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          if (!subaccount.passwordHash) {
            return done(null, false, { message: "Esta cuenta usa Google OAuth. Por favor inicia sesión con Google." });
          }

          const isValidPassword = await bcrypt.compare(password, subaccount.passwordHash);

          if (!isValidPassword) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          if (!subaccount.isActive) {
            return done(null, false, { message: "Esta cuenta está desactivada" });
          }

          // Actualizar último login
          await storage.updateSubaccountLastLogin(subaccount.id);

          return done(null, subaccount);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // ============================================
  // GOOGLE OAUTH STRATEGY
  // ============================================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Detectar URL del callback basándose en el dominio de Replit
    const isProduction = process.env.REPLIT_DEPLOYMENT === "1" || process.env.REPL_SLUG;
    const callbackURL = isProduction
      ? "https://whatsapp.cloude.es/api/auth/google/callback"
      : "http://localhost:5000/api/auth/google/callback";
    
    console.log(`Google OAuth callback URL configurado: ${callbackURL}`);
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Buscar subcuenta existente por Google ID
            let subaccount = await storage.getSubaccountByGoogleId(profile.id);

            if (!subaccount) {
              // Si no existe, buscar por email (incluye admins para login)
              const email = profile.emails?.[0]?.value;
              if (email) {
                subaccount = await storage.getSubaccountByEmailForAuth(email);
              }

              if (!subaccount && email) {
                // Crear empresa nueva para este usuario
                const newCompany = await storage.createCompany({
                  name: profile.displayName || email.split('@')[0],
                  email: email,
                  isActive: true,
                });

                // Crear nueva subcuenta asociada a la nueva empresa
                // IMPORTANTE: Usar prefijo LOCAL_GOOGLE_ para que los filtros excluyan
                // esta subcuenta de las listas públicas hasta que se instale una location real de GHL
                subaccount = await storage.createSubaccount({
                  companyId: newCompany.id,
                  email,
                  name: profile.displayName || email.split('@')[0],
                  googleId: profile.id,
                  role: "user",
                  isActive: true,
                  locationId: `LOCAL_GOOGLE_${profile.id}`,
                  ghlCompanyId: "GOOGLE_AUTH",
                  billingEnabled: true,
                  manuallyActivated: true,
                });
                
                // Crear suscripción con 7 días de prueba gratuita
                await storage.createSubscription(subaccount.id, 7);
                console.log(`✅ Subscription created with 7-day trial for Google user ${email}`);
              } else if (subaccount && !subaccount.googleId) {
                // Vincular Google ID a cuenta existente
                subaccount = await storage.updateSubaccount(subaccount.id, { googleId: profile.id }) || subaccount;
              }
            }

            if (!subaccount) {
              return done(new Error("No se pudo crear o encontrar la subcuenta"));
            }

            if (!subaccount.isActive) {
              return done(null, false, { message: "Esta cuenta está desactivada" });
            }

            // Actualizar último login
            await storage.updateSubaccountLastLogin(subaccount.id);

            return done(null, subaccount);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const subaccount = await storage.getSubaccount(id);
      done(null, subaccount);
    } catch (error) {
      done(error);
    }
  });
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "No autorizado. Por favor inicia sesión." });
};

// Middleware de autenticación con API Token (para endpoints de API externa)
export const isApiAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // Obtener token del header Authorization: Bearer ghl_...
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: "No autorizado",
        message: "Se requiere un token de API en el header Authorization: Bearer <token>"
      });
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Validar token en la base de datos
    const apiToken = await storage.getApiTokenByToken(token);

    if (!apiToken) {
      res.status(401).json({
        error: "Token inválido",
        message: "El token proporcionado no existe o ha sido revocado"
      });
      return;
    }

    // Verificar si el token ha expirado
    if (apiToken.expiresAt && new Date(apiToken.expiresAt) < new Date()) {
      res.status(401).json({
        error: "Token expirado",
        message: "El token ha expirado. Por favor genera uno nuevo"
      });
      return;
    }

    // Obtener el usuario asociado al token
    const user = await storage.getSubaccount(apiToken.userId);

    if (!user) {
      res.status(401).json({
        error: "Usuario no encontrado",
        message: "El usuario asociado al token no existe"
      });
      return;
    }

    // Actualizar lastUsedAt del token (sin await para no bloquear)
    storage.updateApiTokenLastUsed(apiToken.id).catch(err =>
      console.error('Error updating token last used:', err)
    );

    // Agregar usuario al request
    req.user = user;

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      error: "Error de autenticación",
      message: "Ocurrió un error al validar el token"
    });
  }
};

// Helper: verificar si es administrador del sistema
export const isSystemAdmin = (user: any): boolean => {
  return user && user.role === "system_admin";
};

// Helper: verificar si es administrador de empresa
export const isCompanyAdmin = (user: any): boolean => {
  return user && user.role === "admin" && user.companyId !== null;
};

// Helper: verificar si es cualquier tipo de administrador
export const isAnyAdmin = (user: any): boolean => {
  return user && (user.role === "admin" || user.role === "system_admin");
};

// Middleware: requiere ser administrador del sistema
export const requireSystemAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && isSystemAdmin(req.user)) {
    return next();
  }
  res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador del sistema." });
};

// Middleware: requiere ser cualquier tipo de admin (para backward compatibility)
export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && isAnyAdmin(req.user)) {
    return next();
  }
  res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." });
};

// ============================================
// UTILIDADES
// ============================================
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
