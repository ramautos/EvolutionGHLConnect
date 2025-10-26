import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request, RequestHandler } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

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
          const user = await storage.getUserByEmail(email);

          if (!user) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: "Esta cuenta usa Google OAuth. Por favor inicia sesión con Google." });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);

          if (!isValidPassword) {
            return done(null, false, { message: "Email o contraseña incorrectos" });
          }

          if (!user.isActive) {
            return done(null, false, { message: "Esta cuenta está desactivada" });
          }

          // Actualizar último login
          await storage.updateLastLogin(user.id);

          return done(null, user);
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
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === "production"
            ? "https://whatsapp.cloude.es/api/auth/google/callback"
            : "http://localhost:5000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Buscar usuario existente por Google ID
            let user = await storage.getUserByGoogleId(profile.id);

            if (!user) {
              // Si no existe, buscar por email
              const email = profile.emails?.[0]?.value;
              if (email) {
                user = await storage.getUserByEmail(email);
              }

              if (!user && email) {
                // Crear nuevo usuario
                user = await storage.createUser({
                  email,
                  name: profile.displayName || email.split('@')[0],
                  googleId: profile.id,
                  role: "user",
                  isActive: true,
                });
              } else if (user && !user.googleId) {
                // Vincular Google ID a cuenta existente
                user = await storage.updateUser(user.id, { googleId: profile.id }) || user;
              }
            }

            if (!user) {
              return done(new Error("No se pudo crear o encontrar el usuario"));
            }

            if (!user.isActive) {
              return done(null, false, { message: "Esta cuenta está desactivada" });
            }

            // Actualizar último login
            await storage.updateLastLogin(user.id);

            return done(null, user);
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
      const user = await storage.getUser(id);
      done(null, user);
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

export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as User)?.role === "admin") {
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
