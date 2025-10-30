import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import passport from "passport";
import { storage } from "./storage";
import { ghlStorage } from "./ghl-storage";
import { ghlApi } from "./ghl-api";
import { evolutionAPI } from "./evolution-api";
import { setupPassport, isAuthenticated, isAdmin, hashPassword } from "./auth";
import { insertCompanySchema, updateCompanySchema, createSubaccountSchema, createWhatsappInstanceSchema, updateWhatsappInstanceSchema, registerSubaccountSchema, loginSubaccountSchema, updateSubaccountProfileSchema, updateSubaccountPasswordSchema, updateSubaccountOpenAIKeySchema, updateSubaccountCrmSettingsSchema, updateWebhookConfigSchema, updateSystemConfigSchema, sendWhatsappMessageSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // CONFIGURAR AUTENTICACIÓN
  // ============================================
  setupPassport(app);
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: any) => {
    console.log("Client connected:", socket.id);

    socket.on("subscribe-instance", (instanceId: string) => {
      socket.join(`instance-${instanceId}`);
      console.log(`Client subscribed to instance ${instanceId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // ============================================
  // RUTAS DE AUTENTICACIÓN
  // ============================================

  // Registro con email/password (manual o Google OAuth)
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Schema inline para evitar problemas de cache en imports
      const registerSchema = z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
      });
      
      const validatedData = registerSchema.parse(req.body);
      
      // Verificar si el email ya existe
      const existingUser = await storage.getSubaccountByEmail(validatedData.email);
      if (existingUser) {
        res.status(400).json({ error: "Este email ya está registrado" });
        return;
      }

      // Hash de la contraseña
      const passwordHash = await hashPassword(validatedData.password);

      // Obtener o crear empresa por defecto para desarrollo
      // Intentar obtener la empresa test-company-001 primero
      let defaultCompany = await storage.getCompany("test-company-001");
      if (!defaultCompany) {
        // Si no existe, crear empresa por defecto
        defaultCompany = await storage.createCompany({
          name: "Default Company",
          email: "default@company.com",
          isActive: true,
        });
      }

      // Crear usuario
      const user = await storage.createSubaccount({
        companyId: defaultCompany.id,
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: "user",
        isActive: true,
        locationId: `LOCAL_${Date.now()}`,
        ghlCompanyId: "LOCAL_AUTH",
        billingEnabled: true,
        manuallyActivated: true,
      });

      // Auto-login después de registro
      req.login(user, (err) => {
        if (err) {
          console.error("Error during auto-login:", err);
          res.status(500).json({ error: "Usuario creado pero error en auto-login" });
          return;
        }
        
        // No enviar passwordHash al cliente
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Datos inválidos", details: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Error al registrar usuario" });
      }
    }
  });

  // Login con email/password
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const validatedData = loginSubaccountSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ error: "Error en autenticación" });
        }
        
        if (!user) {
          return res.status(401).json({ error: info?.message || "Credenciales inválidas" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ error: "Error al iniciar sesión" });
          }
          
          // No enviar passwordHash al cliente
          const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
          return res.json({ user: userWithoutSensitive });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ error: "Error al procesar login" });
      }
    }
  });

  // Iniciar Google OAuth
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  // Callback de Google OAuth
  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Error en Google OAuth:", err);
        return res.redirect("/login?error=oauth_error");
      }
      
      if (!user) {
        console.error("Google OAuth: Usuario no autenticado", info);
        return res.redirect("/login?error=auth_failed");
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Error al crear sesión después de Google OAuth:", loginErr);
          return res.redirect("/login?error=session_error");
        }
        
        // Redirigir al dashboard después del login exitoso
        res.redirect("/dashboard");
      });
    })(req, res, next);
  });

  // Obtener usuario actual
  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    
    const user = req.user as any;
    
    // Obtener información de la empresa
    let companyName = null;
    if (user.companyId) {
      const company = await storage.getCompany(user.companyId);
      companyName = company?.name || null;
    }
    
    // No enviar datos sensibles al cliente, pero indicar si tiene contraseña
    const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
    const userResponse = {
      ...userWithoutSensitive,
      hasPassword: !!user.passwordHash, // Indicar si tiene contraseña local
      companyName, // Agregar nombre de la empresa
    };
    res.json(userResponse);
  });

  // Cerrar sesión
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        res.status(500).json({ error: "Error al cerrar sesión" });
        return;
      }
      res.json({ success: true });
    });
  });

  // ============================================
  // RUTAS DE PERFIL DE USUARIO
  // ============================================

  // Actualizar perfil (nombre, teléfono)
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = updateSubaccountProfileSchema.parse(req.body);

      const updatedUser = await storage.updateSubaccount(user.id, validatedData);
      
      if (!updatedUser) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      // Actualizar la sesión con los nuevos datos
      req.user = updatedUser;

      const { passwordHash: _, googleId: __, ...userWithoutSensitive } = updatedUser;
      res.json(userWithoutSensitive);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Error al actualizar el perfil" });
    }
  });

  // Actualizar contraseña
  app.patch("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = updateSubaccountPasswordSchema.parse(req.body);

      // Verificar que el usuario tenga contraseña (no solo Google OAuth)
      if (!user.passwordHash) {
        res.status(400).json({ error: "Este usuario usa autenticación de Google" });
        return;
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        res.status(400).json({ error: "Contraseña actual incorrecta" });
        return;
      }

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      await storage.updateSubaccount(user.id, { passwordHash: hashedPassword });

      res.json({ success: true, message: "Contraseña actualizada exitosamente" });
    } catch (error: any) {
      console.error("Error al actualizar contraseña:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Error al actualizar la contraseña" });
    }
  });

  // ============================================
  // RUTAS DE USUARIOS (Solo Admin)
  // ============================================

  // ELIMINADO: POST /api/users (usaba bypass de seguridad)
  // Usar /api/auth/register en su lugar

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getSubaccount(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      // Solo el usuario mismo o un admin puede ver datos del usuario
      const currentUser = req.user as any;
      if (currentUser.id !== user.id && currentUser.role !== "admin") {
        res.status(403).json({ error: "No autorizado para ver este usuario" });
        return;
      }
      
      // No enviar datos sensibles
      const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
      res.json(userWithoutSensitive);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Solo admin puede buscar por email
  app.get("/api/users/email/:email", isAdmin, async (req, res) => {
    try {
      const user = await storage.getSubaccountByEmail(req.params.email);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      // No enviar datos sensibles
      const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
      res.json(userWithoutSensitive);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Debug endpoint to check server configuration
  app.get("/api/debug/server-info", (req, res) => {
    res.json({
      protocol: req.protocol,
      host: req.get('host'),
      forwardedProto: req.get('x-forwarded-proto'),
      forwardedHost: req.get('x-forwarded-host'),
      expectedRedirectUri: `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}/api/auth/oauth/callback`,
      env: {
        hasClientId: !!process.env.GHL_CLIENT_ID,
        hasClientSecret: !!process.env.GHL_CLIENT_SECRET,
        clientIdPreview: process.env.GHL_CLIENT_ID ? `${process.env.GHL_CLIENT_ID.substring(0, 15)}...` : 'missing'
      }
    });
  });

  // GoHighLevel OAuth Callback (renamed to avoid GHL detection in URL)
  app.get("/api/auth/oauth/callback", async (req, res) => {
    try {
      const { code } = req.query;

      console.log("🔵 OAuth Callback received:", {
        code: code ? `${String(code).substring(0, 10)}...` : "missing",
        protocol: req.protocol,
        host: req.get('host'),
        fullUrl: `${req.protocol}://${req.get('host')}${req.path}`
      });

      if (!code || typeof code !== "string") {
        console.error("❌ Missing authorization code");
        res.status(400).json({ error: "Missing authorization code" });
        return;
      }

      // Intercambiar código por token
      // IMPORTANTE: En producción, siempre usar HTTPS
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/auth/oauth/callback`;
      
      console.log("🔵 Attempting token exchange:", {
        protocol,
        host,
        redirectUri,
        headers: {
          'x-forwarded-proto': req.get('x-forwarded-proto'),
          'x-forwarded-host': req.get('x-forwarded-host')
        }
      });
      
      const tokenResponse = await ghlApi.exchangeCodeForToken(code, redirectUri);

      if (!tokenResponse) {
        console.error("❌ Failed to exchange code for token");
        
        // Intentar hacer la llamada manualmente para capturar el error exacto
        let ghlErrorDetails = "No se pudo obtener detalles del error";
        try {
          const debugResponse = await fetch(`https://services.leadconnectorhq.com/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grant_type: "authorization_code",
              client_id: process.env.GHL_CLIENT_ID,
              client_secret: process.env.GHL_CLIENT_SECRET,
              code,
              redirect_uri: redirectUri,
            }),
          });
          const errorText = await debugResponse.text();
          ghlErrorDetails = `Status: ${debugResponse.status}\n${errorText}`;
        } catch (e: any) {
          ghlErrorDetails = e.message;
        }
        
        // Mostrar el error real en la respuesta para debugging
        res.status(500).send(`
          <html>
            <head><title>OAuth Error</title></head>
            <body style="font-family: monospace; padding: 20px;">
              <h2>❌ Error en OAuth de GoHighLevel</h2>
              <p><strong>Mensaje:</strong> No se pudo intercambiar el código por el token</p>
              <h3>Información de Debug:</h3>
              <pre>redirect_uri usado: ${redirectUri}
protocol: ${protocol}
host: ${host}
              
Client ID configurado: ${process.env.GHL_CLIENT_ID ? process.env.GHL_CLIENT_ID.substring(0, 20) + '...' : 'NO CONFIGURADO'}
Client Secret configurado: ${process.env.GHL_CLIENT_SECRET ? 'SÍ' : 'NO'}

<strong>Error de GoHighLevel API:</strong>
${ghlErrorDetails}
              </pre>
              <p><a href="/">← Volver al inicio</a></p>
            </body>
          </html>
        `);
        return;
      }

      console.log("✅ Token exchange successful");

      // Obtener detalles del instalador
      const installerDetails = await ghlApi.getInstallerDetails(tokenResponse.access_token);

      if (!installerDetails) {
        res.status(500).json({ error: "Failed to get installer details" });
        return;
      }

      // Guardar en la base de datos de GoHighLevel
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      
      await ghlStorage.createOrUpdateCliente({
        locationid: tokenResponse.locationId || installerDetails.location?.id || null,
        companyid: tokenResponse.companyId || installerDetails.company.id,
        userid: tokenResponse.userId || installerDetails.user.id,
        accesstoken: tokenResponse.access_token,
        refreshtoken: tokenResponse.refresh_token,
        refreshtokenid: null,
        expiresat: expiresAt,
        scopes: tokenResponse.scope,
        isactive: true,
        isbulkinstallation: false,
        appclientid: process.env.GHL_CLIENT_ID || null,
        lastrefreshed: new Date(),
        uninstalledat: null,
        nombreCliente: installerDetails.user.name || null,
        emailCliente: installerDetails.user.email || null,
        telefonoCliente: null,
        subcuenta: installerDetails.location?.name || null,
        cuentaPrincipal: installerDetails.company.name || null,
      });

      // (Opcional) Notificar a n8n que se instaló la app
      const n8nWebhookUrl = process.env.N8N_INSTALL_WEBHOOK_URL;
      if (n8nWebhookUrl) {
        try {
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'ghl_app_installed',
              companyId: tokenResponse.companyId || installerDetails.company.id,
              locationId: tokenResponse.locationId || installerDetails.location?.id,
              userId: tokenResponse.userId || installerDetails.user.id,
              companyName: installerDetails.company.name,
              locationName: installerDetails.location?.name,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          console.error('Failed to notify n8n:', error);
          // No bloqueamos el flujo si falla el webhook
        }
      }

      // Redirigir al dashboard de locations con éxito, incluyendo companyId
      const companyId = tokenResponse.companyId || installerDetails.company.id;
      res.redirect(`/locations?ghl_installed=true&company_id=${companyId}`);
    } catch (error) {
      console.error("Error in GHL OAuth callback:", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Obtener locations del usuario por company ID
  app.get("/api/ghl/locations/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const clientes = await ghlStorage.getClientesByCompanyId(companyId);
      
      // Obtener detalles de cada location
      const locations = await Promise.all(
        clientes.map(async (cliente) => {
          if (!cliente.locationid || !cliente.accesstoken) {
            return null;
          }

          const validToken = await ghlApi.getValidAccessToken(cliente.locationid);
          if (!validToken) {
            return null;
          }

          const location = await ghlApi.getLocation(cliente.locationid, validToken);
          return location ? {
            ...location,
            clienteId: cliente.id,
            // NO exponer accessToken al cliente
          } : null;
        })
      );

      res.json(locations.filter(Boolean));
    } catch (error) {
      console.error("Error getting locations:", error);
      res.status(500).json({ error: "Failed to get locations" });
    }
  });

  // Obtener location específica
  app.get("/api/ghl/location/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const cliente = await ghlStorage.getClienteByLocationId(locationId);

      if (!cliente) {
        res.status(404).json({ error: "Location not found" });
        return;
      }

      const validToken = await ghlApi.getValidAccessToken(locationId);
      if (!validToken) {
        res.status(401).json({ error: "Failed to get valid access token" });
        return;
      }

      const location = await ghlApi.getLocation(locationId, validToken);
      
      if (!location) {
        res.status(404).json({ error: "Location details not found" });
        return;
      }

      res.json({
        ...location,
        clienteId: cliente.id,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      res.status(500).json({ error: "Failed to get location" });
    }
  });

  // REMOVED: /api/ghl/client-data endpoint (security vulnerability - exposed PII without auth)
  // Functionality moved to server-side webhook endpoint /api/webhooks/create-from-oauth

  // ============================================
  // WEBHOOK PARA REGISTRO DE SUBCUENTAS (N8N)
  // ============================================

  // Webhook SEGURO para crear subcuenta desde OAuth flow (server-side only)
  app.post("/api/webhooks/create-from-oauth", async (req, res) => {
    try {
      console.log("🔵 Webhook create-from-oauth received:", JSON.stringify(req.body, null, 2));

      const { company_id, location_id } = req.body;

      if (!company_id || !location_id) {
        res.status(400).json({ error: "company_id and location_id are required" });
        return;
      }

      console.log(`🔍 Fetching client data from GHL DB for company_id=${company_id}, location_id=${location_id}`);

      // 1. Buscar el cliente en la base de datos GHL externa (server-side only)
      const cliente = await ghlStorage.getClienteByLocationId(location_id);

      if (!cliente) {
        res.status(404).json({ error: "Client not found in GHL database" });
        return;
      }

      // Verificar que pertenece a la compañía correcta
      if (cliente.companyid !== company_id) {
        res.status(403).json({ error: "Client does not belong to this company" });
        return;
      }

      // 2. Preparar datos completos del cliente
      const clientData = {
        email: cliente.emailCliente,
        name: cliente.nombreCliente,
        phone: cliente.telefonoCliente,
        locationId: cliente.locationid,
        locationName: cliente.subcuenta,
        ghlCompanyId: cliente.companyid,
        companyName: cliente.cuentaPrincipal,
      };

      console.log("📋 Client data retrieved:", JSON.stringify(clientData, null, 2));

      // 3. Validar datos
      const webhookSchema = z.object({
        email: z.string().email("Email inválido"),
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        locationId: z.string().min(1, "Location ID es requerido"),
        ghlCompanyId: z.string().min(1, "Company ID es requerido"),
        companyName: z.string().nullable(),
        locationName: z.string().nullable(),
        phone: z.string().nullable(),
      });

      const validatedData = webhookSchema.parse(clientData);

      // 4. Buscar o crear la empresa
      let company = await storage.getCompanyByGhlId(validatedData.ghlCompanyId);
      
      if (!company) {
        console.log(`📝 Creating new company: ${validatedData.companyName || validatedData.ghlCompanyId}`);
        try {
          company = await storage.createCompany({
            name: validatedData.companyName || `Company ${validatedData.ghlCompanyId}`,
            email: validatedData.email,
            ghlCompanyId: validatedData.ghlCompanyId,
            isActive: true,
          });
        } catch (error: any) {
          if (error.message?.includes("unique constraint") || error.code === "23505") {
            console.log(`⚠️ Company already created by concurrent request, re-querying...`);
            company = await storage.getCompanyByGhlId(validatedData.ghlCompanyId);
            if (!company) {
              throw new Error("Failed to create or find company after race condition");
            }
          } else {
            throw error;
          }
        }
      }

      // 5. Verificar si la subcuenta ya existe
      let subaccount = await storage.getSubaccountByLocationId(validatedData.locationId);

      if (subaccount) {
        console.log(`✅ Subaccount already exists for location ${validatedData.locationId}`);
        res.json({ 
          success: true, 
          message: "Subaccount already exists",
          subaccount: {
            id: subaccount.id,
            email: subaccount.email,
            name: subaccount.name,
            locationId: subaccount.locationId,
            locationName: subaccount.locationName,
          }
        });
        return;
      }

      // 6. Crear la subcuenta
      console.log(`📝 Creating new subaccount for location ${validatedData.locationId}`);
      
      subaccount = await storage.createSubaccount({
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone || null,
        locationId: validatedData.locationId,
        locationName: validatedData.locationName || null,
        ghlCompanyId: validatedData.ghlCompanyId,
        companyId: company.id,
        role: "user",
        isActive: true,
        billingEnabled: true,
        manuallyActivated: false,
        passwordHash: null,
        googleId: null,
      });

      // 7. Crear suscripción con trial
      await storage.createSubscription(subaccount.id, 15);

      // 8. Crear instancia de WhatsApp
      const existingInstances = await storage.getWhatsappInstancesByLocationId(validatedData.locationId);
      const instanceNumber = existingInstances.length + 1;
      const instanceName = `${validatedData.locationId}_${instanceNumber}`;

      const whatsappInstance = await storage.createWhatsappInstance({
        subaccountId: subaccount.id,
        locationId: validatedData.locationId,
        evolutionInstanceName: instanceName,
        status: "created",
      });

      console.log(`✅ Subaccount created successfully: ${subaccount.email} (${subaccount.locationId})`);
      console.log(`✅ WhatsApp instance created: ${instanceName}`);

      res.json({
        success: true,
        message: "Subaccount created successfully",
        subaccount: {
          id: subaccount.id,
          email: subaccount.email,
          name: subaccount.name,
          locationId: subaccount.locationId,
          locationName: subaccount.locationName,
        },
        whatsappInstance: {
          id: whatsappInstance.id,
          instanceName: instanceName,
          status: whatsappInstance.status,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error creating subaccount from OAuth:", error);
        res.status(500).json({ error: "Failed to create subaccount" });
      }
    }
  });
  
  // Webhook para registrar subcuenta desde n8n después de OAuth
  app.post("/api/webhooks/register-subaccount", async (req, res) => {
    try {
      console.log("🔵 Webhook register-subaccount received:", JSON.stringify(req.body, null, 2));

      // El webhook puede venir de dos fuentes:
      // 1. Directamente desde n8n con campos transformados (email, name, locationId, etc.)
      // 2. Desde la base de datos GHL (email_cliente, nombre_cliente, locationid, etc.)
      
      // Normalizar los datos para aceptar ambos formatos
      const normalizedData = {
        email: req.body.email || req.body.email_cliente,
        name: req.body.name || req.body.nombre_cliente,
        locationId: req.body.locationId || req.body.locationid,
        ghlCompanyId: req.body.ghlCompanyId || req.body.companyid,
        companyName: req.body.companyName || req.body.cuenta_principal || undefined,
        locationName: req.body.locationName || req.body.subcuenta || undefined,
        phone: req.body.phone || req.body.telefono_cliente || undefined,
      };

      console.log("📋 Normalized webhook data:", JSON.stringify(normalizedData, null, 2));

      const webhookSchema = z.object({
        email: z.string().email("Email inválido"),
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        locationId: z.string().min(1, "Location ID es requerido"),
        ghlCompanyId: z.string().min(1, "Company ID es requerido"),
        companyName: z.string().optional(),
        locationName: z.string().optional(),
        phone: z.string().optional(),
      });

      const validatedData = webhookSchema.parse(normalizedData);

      // 1. Buscar o crear la empresa (con manejo de race conditions)
      let company = await storage.getCompanyByGhlId(validatedData.ghlCompanyId);
      
      if (!company) {
        console.log(`📝 Creating new company: ${validatedData.companyName || validatedData.ghlCompanyId}`);
        try {
          company = await storage.createCompany({
            name: validatedData.companyName || `Company ${validatedData.ghlCompanyId}`,
            email: validatedData.email,
            ghlCompanyId: validatedData.ghlCompanyId,
            isActive: true,
          });
        } catch (error: any) {
          // Handle race condition: another request may have created the company
          if (error.message?.includes("unique constraint") || error.code === "23505") {
            console.log(`⚠️ Company already created by concurrent request, re-querying...`);
            company = await storage.getCompanyByGhlId(validatedData.ghlCompanyId);
            if (!company) {
              throw new Error("Failed to create or find company after race condition");
            }
          } else {
            throw error;
          }
        }
      }

      // 2. Verificar si la subcuenta ya existe por locationId
      let subaccount = await storage.getSubaccountByLocationId(validatedData.locationId);

      if (subaccount) {
        console.log(`✅ Subaccount already exists for location ${validatedData.locationId}`);
        res.json({ 
          success: true, 
          message: "Subaccount already exists",
          subaccount: {
            id: subaccount.id,
            email: subaccount.email,
            name: subaccount.name,
            locationId: subaccount.locationId,
          }
        });
        return;
      }

      // 3. Crear la subcuenta (OAuth-only, no password)
      console.log(`📝 Creating new subaccount for location ${validatedData.locationId}`);
      
      subaccount = await storage.createSubaccount({
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone || null,
        locationId: validatedData.locationId,
        locationName: validatedData.locationName || null,
        ghlCompanyId: validatedData.ghlCompanyId,
        companyId: company.id,
        role: "user",
        isActive: true,
        billingEnabled: true,
        manuallyActivated: false,
        passwordHash: null, // OAuth-only authentication
        googleId: null,
      });

      // 4. Crear suscripción con trial de 15 días
      await storage.createSubscription(subaccount.id, 15);

      console.log(`✅ Subaccount created successfully: ${subaccount.email} (${subaccount.locationId})`);

      // 5. Crear instancia de WhatsApp automáticamente
      let instanceCreated = false;
      let instanceId = null;
      
      try {
        console.log(`📱 Creating WhatsApp instance for ${subaccount.name}...`);
        
        // Obtener instancias existentes para generar nombre único
        const existingInstances = await storage.getWhatsappInstancesByLocationId(validatedData.locationId);
        const instanceNumber = existingInstances.length + 1;
        const evolutionName = `${validatedData.locationId}_${instanceNumber}`;
        
        const instance = await storage.createWhatsappInstance({
          subaccountId: subaccount.id,
          locationId: validatedData.locationId,
          customName: validatedData.locationName || `WhatsApp ${validatedData.name}`,
          evolutionInstanceName: evolutionName,
        });
        
        instanceCreated = true;
        instanceId = instance.id;
        console.log(`✅ WhatsApp instance created: ${instance.evolutionInstanceName}`);
      } catch (error) {
        console.error(`⚠️ Failed to create WhatsApp instance automatically:`, error);
        // No fallar el webhook si la creación de instancia falla
        // El usuario puede crear la instancia manualmente desde el dashboard
      }

      res.json({
        success: true,
        message: "Subaccount created successfully",
        subaccount: {
          id: subaccount.id,
          email: subaccount.email,
          name: subaccount.name,
          locationId: subaccount.locationId,
          companyId: company.id,
          companyName: company.name,
        },
        instance: instanceCreated ? {
          id: instanceId,
          created: true,
        } : {
          created: false,
          message: "Instance will be created when user first logs in",
        }
      });
    } catch (error: any) {
      console.error("❌ Error in register-subaccount webhook:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid webhook data", 
          details: error.errors 
        });
        return;
      }

      res.status(500).json({ 
        error: "Failed to register subaccount",
        message: error.message 
      });
    }
  });

  // ============================================
  // RUTAS DE ADMIN
  // ============================================

  // Listar todos los usuarios (solo admin)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllSubaccounts();
      // No enviar datos sensibles
      const usersWithoutSensitive = users.map(user => {
        const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
      });
      res.json(usersWithoutSensitive);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Eliminar usuario (solo admin)
  app.delete("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevenir que el admin se elimine a sí mismo
      if ((req.user as any).id === userId) {
        res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
        return;
      }

      const deleted = await storage.deleteSubaccount(userId);
      if (!deleted) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      res.json({ success: true, message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  });

  // Listar todas las subcuentas (solo admin)
  app.get("/api/admin/subaccounts", isAdmin, async (req, res) => {
    try {
      const subaccounts = await storage.getAllSubaccounts();
      res.json(subaccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subaccounts" });
    }
  });

  // Listar todas las instancias de WhatsApp con información completa (solo admin)
  app.get("/api/admin/instances", isAdmin, async (req, res) => {
    try {
      const instances = await storage.getAllWhatsappInstancesWithDetails();
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get all instances" });
    }
  });

  // Eliminar instancia de WhatsApp (solo admin)
  app.delete("/api/admin/instances/:id", isAdmin, async (req, res) => {
    try {
      const instanceId = req.params.id;
      
      // Obtener la instancia
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }

      // Intentar eliminar de Evolution API (si existe)
      try {
        await evolutionAPI.deleteInstance(instance.evolutionInstanceName);
      } catch (error) {
        console.error(`Error deleting instance from Evolution API:`, error);
        // Continuar aunque falle la eliminación de Evolution API
      }

      // Eliminar de la base de datos
      const deleted = await storage.deleteWhatsappInstance(instanceId);
      
      if (deleted) {
        res.json({ success: true, message: "Instance deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete instance from database" });
      }
    } catch (error) {
      console.error("Error deleting instance:", error);
      res.status(500).json({ error: "Failed to delete instance" });
    }
  });

  // Obtener configuración de webhook (solo admin)
  app.get("/api/admin/webhook-config", isAdmin, async (req, res) => {
    try {
      let config = await storage.getWebhookConfig();
      
      // Si no existe, crear una configuración por defecto
      if (!config) {
        config = await storage.createWebhookConfig({
          webhookUrl: "",
          isActive: false,
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error getting webhook config:", error);
      res.status(500).json({ error: "Failed to get webhook configuration" });
    }
  });

  // Actualizar configuración de webhook (solo admin)
  app.patch("/api/admin/webhook-config", isAdmin, async (req, res) => {
    try {
      const validatedData = updateWebhookConfigSchema.parse(req.body);
      
      let config = await storage.getWebhookConfig();
      
      if (!config) {
        // Si no existe, crear una nueva
        config = await storage.createWebhookConfig({
          webhookUrl: validatedData.webhookUrl || "",
          isActive: validatedData.isActive ?? false,
        });
      } else {
        // Actualizar existente
        config = await storage.updateWebhookConfig(config.id, validatedData);
        if (!config) {
          res.status(500).json({ error: "Failed to update webhook config" });
          return;
        }
      }
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating webhook config:", error);
        res.status(500).json({ error: "Failed to update webhook configuration" });
      }
    }
  });

  // ============================================
  // SYSTEM CONFIG ROUTES (Admin-only)
  // ============================================

  // Obtener configuración del sistema (solo admin)
  app.get("/api/admin/system-config", isAdmin, async (req, res) => {
    try {
      let config = await storage.getSystemConfig();
      
      // Si no existe, crear una configuración por defecto
      if (!config) {
        config = await storage.createSystemConfig({
          systemName: "WhatsApp Platform",
          trialDays: "15",
          trialEnabled: true,
          maintenanceMode: false,
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error getting system config:", error);
      res.status(500).json({ error: "Failed to get system configuration" });
    }
  });

  // Actualizar configuración del sistema (solo admin)
  app.patch("/api/admin/system-config", isAdmin, async (req, res) => {
    try {
      const validatedData = updateSystemConfigSchema.parse(req.body);
      
      let config = await storage.getSystemConfig();
      
      if (!config) {
        // Si no existe, crear una nueva con los valores proporcionados
        config = await storage.createSystemConfig({
          systemName: validatedData.systemName || "WhatsApp Platform",
          evolutionApiUrl: validatedData.evolutionApiUrl,
          evolutionApiKey: validatedData.evolutionApiKey,
          systemEmail: validatedData.systemEmail,
          supportEmail: validatedData.supportEmail,
          trialDays: validatedData.trialDays || "15",
          trialEnabled: validatedData.trialEnabled ?? true,
          maintenanceMode: validatedData.maintenanceMode ?? false,
          maintenanceMessage: validatedData.maintenanceMessage,
        });
      } else {
        // Actualizar existente
        config = await storage.updateSystemConfig(config.id, validatedData);
        if (!config) {
          res.status(500).json({ error: "Failed to update system config" });
          return;
        }
      }
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error updating system config:", error);
        res.status(500).json({ error: "Failed to update system configuration" });
      }
    }
  });

  // Actualizar estado de billing de una subcuenta (solo admin)
  app.patch("/api/admin/subaccounts/:id/billing", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { billingEnabled } = req.body;
      
      if (typeof billingEnabled !== "boolean") {
        res.status(400).json({ error: "billingEnabled debe ser un booleano" });
        return;
      }
      
      const subaccount = await storage.updateSubaccountBilling(id, billingEnabled);
      if (!subaccount) {
        res.status(404).json({ error: "Subcuenta no encontrada" });
        return;
      }
      
      res.json(subaccount);
    } catch (error) {
      console.error("Error updating subaccount billing:", error);
      res.status(500).json({ error: "Error al actualizar billing" });
    }
  });

  // ============================================
  // RUTAS DE COMPANIES (Admin only)
  // ============================================

  // Obtener todas las empresas con estadísticas
  app.get("/api/admin/companies", isAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const companies = await storage.getCompaniesByStatus(status as any);
      res.json(companies);
    } catch (error) {
      console.error("Error getting companies:", error);
      res.status(500).json({ error: "Failed to get companies" });
    }
  });

  // Obtener una empresa específica con estadísticas
  app.get("/api/admin/companies/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompany(id);
      
      if (!company) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }
      
      const stats = await storage.getCompanyStats(id);
      
      res.json({ ...company, stats });
    } catch (error) {
      console.error("Error getting company:", error);
      res.status(500).json({ error: "Failed to get company" });
    }
  });

  // Crear nueva empresa
  app.post("/api/admin/companies", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
        return;
      }
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  // Actualizar empresa
  app.patch("/api/admin/companies/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateCompanySchema.parse(req.body);
      const updated = await storage.updateCompany(id, validatedData);
      
      if (!updated) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
        return;
      }
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  // Eliminar empresa
  app.delete("/api/admin/companies/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      
      // Prevenir que el admin elimine su propia empresa (causaría error 502)
      if (user.companyId === id) {
        res.status(403).json({ 
          error: "No puedes eliminar tu propia empresa",
          message: "No puedes eliminar la empresa a la que perteneces. Esto causaría que pierdas acceso al sistema."
        });
        return;
      }
      
      const deleted = await storage.deleteCompany(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Empresa no encontrada" });
        return;
      }
      
      res.json({ success: true, message: "Empresa eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Obtener estadísticas globales para el dashboard
  app.get("/api/admin/dashboard/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Actualizar estado de activación manual de una subcuenta (solo admin)
  app.patch("/api/admin/subaccounts/:id/activation", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { manuallyActivated } = req.body;
      
      if (typeof manuallyActivated !== "boolean") {
        res.status(400).json({ error: "manuallyActivated debe ser un booleano" });
        return;
      }
      
      const subaccount = await storage.updateSubaccountActivation(id, manuallyActivated);
      if (!subaccount) {
        res.status(404).json({ error: "Subcuenta no encontrada" });
        return;
      }
      
      res.json(subaccount);
    } catch (error) {
      console.error("Error updating subaccount activation:", error);
      res.status(500).json({ error: "Error al actualizar activación" });
    }
  });

  // ============================================
  // RUTAS DE BILLING Y SUSCRIPCIONES POR SUBCUENTA (Protegidas)
  // ============================================

  // Obtener suscripción de una subcuenta
  app.get("/api/subaccounts/:subaccountId/subscription", isAuthenticated, async (req, res) => {
    try {
      const { subaccountId } = req.params;
      
      // Verificar que la subcuenta pertenece al usuario
      const subaccount = await storage.getSubaccount(subaccountId);
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      const user = req.user as any;
      if (subaccount.id !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      let subscription = await storage.getSubscription(subaccountId);
      
      // Si no tiene suscripción, crear una vacía (plan "none")
      if (!subscription) {
        subscription = await storage.createSubscription(subaccountId);
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Actualizar plan de suscripción de una subcuenta
  app.patch("/api/subaccounts/:subaccountId/subscription", isAuthenticated, async (req, res) => {
    try {
      const { subaccountId } = req.params;
      const { plan, extraSlots } = req.body;
      
      // Verificar que la subcuenta pertenece al usuario
      const subaccount = await storage.getSubaccount(subaccountId);
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      const user = req.user as any;
      if (subaccount.id !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Validar plan
      if (!plan || !["basic_1_instance", "pro_5_instances"].includes(plan)) {
        res.status(400).json({ error: "Invalid plan. Must be 'basic_1_instance' or 'pro_5_instances'" });
        return;
      }

      // Obtener o crear suscripción
      let subscription = await storage.getSubscription(subaccountId);
      if (!subscription) {
        subscription = await storage.createSubscription(subaccountId);
      }

      // Verificar si el plan ya es el actual
      if (subscription.plan === plan && (!extraSlots || subscription.extraSlots === extraSlots)) {
        console.log(`Subaccount ${subaccountId} already has this plan configuration`);
        res.json(subscription);
        return;
      }

      // Calcular precios
      const includedInstances = plan === "basic_1_instance" ? "1" : "5";
      const basePrice = plan === "basic_1_instance" ? "8.00" : "25.00";
      const extraSlotsNum = parseInt(extraSlots || "0");
      const extraPrice = (extraSlotsNum * 5).toFixed(2);
      const totalAmount = (parseFloat(basePrice) + parseFloat(extraPrice)).toFixed(2);

      // Actualizar suscripción
      const updatedSubscription = await storage.updateSubscription(subaccountId, {
        plan,
        includedInstances,
        extraSlots: extraSlots || "0",
        basePrice,
        extraPrice,
        status: "active",
      });

      // Crear factura
      const description = plan === "basic_1_instance" 
        ? `Plan Básico - 1 instancia de WhatsApp${extraSlotsNum > 0 ? ` + ${extraSlotsNum} instancia(s) adicional(es)` : ""}`
        : `Plan Pro - 5 instancias de WhatsApp${extraSlotsNum > 0 ? ` + ${extraSlotsNum} instancia(s) adicional(es)` : ""}`;

      await storage.createInvoice({
        subaccountId,
        amount: totalAmount,
        plan,
        baseAmount: basePrice,
        extraAmount: extraPrice,
        extraSlots: extraSlots || "0",
        description,
        status: "pending",
      });

      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // Obtener facturas de una subcuenta
  app.get("/api/subaccounts/:subaccountId/invoices", isAuthenticated, async (req, res) => {
    try {
      const { subaccountId } = req.params;
      
      // Verificar que la subcuenta pertenece al usuario
      const subaccount = await storage.getSubaccount(subaccountId);
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      const user = req.user as any;
      if (subaccount.id !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const invoices = await storage.getInvoices(subaccountId);
      res.json(invoices);
    } catch (error) {
      console.error("Error getting invoices:", error);
      res.status(500).json({ error: "Failed to get invoices" });
    }
  });

  // ============================================
  // RUTAS DE SUBCUENTAS (Protegidas)
  // ============================================

  app.post("/api/subaccounts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = createSubaccountSchema.parse(req.body);
      const subaccount = await storage.createSubaccount(validatedData);
      res.json(subaccount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create subaccount" });
      }
    }
  });

  // Crear subcuenta desde GoHighLevel OAuth
  app.post("/api/subaccounts/from-ghl", isAuthenticated, async (req, res) => {
    try {
      const { companyId, ghlCompanyId, locationId } = req.body;

      if (!locationId) {
        res.status(400).json({ error: "Missing required field: locationId" });
        return;
      }

      if (!companyId) {
        res.status(400).json({ error: "User must have a company assigned to create subaccounts" });
        return;
      }

      console.log("📥 Creating subaccount from GHL OAuth:", { companyId, ghlCompanyId, locationId });

      // Verificar si la subcuenta ya existe por locationId
      const existing = await storage.getSubaccountByLocationId(locationId);
      
      if (existing) {
        console.log("✅ Subaccount already exists:", existing.id);
        res.json(existing);
        return;
      }

      // Obtener access token de la location desde GHL database (n8n guarda tokens de location-level)
      console.log("🔍 Looking for location token in GHL database:", locationId);
      const cliente = await ghlStorage.getClienteByLocationId(locationId);
      
      if (!cliente || !cliente.accesstoken) {
        console.error("❌ No access token found for location:", locationId);
        res.status(404).json({ error: `No access token found for location ${locationId}. The OAuth flow may not have completed correctly.` });
        return;
      }

      console.log("✅ Location token found in database");

      // Obtener información de la location desde GHL usando el token de location
      console.log("🔍 Fetching location details from GHL API");
      const location = await ghlApi.getLocation(locationId, cliente.accesstoken);

      if (!location) {
        console.error("❌ Could not fetch location details from GHL API");
        res.status(404).json({ error: "Could not fetch location details from GoHighLevel API" });
        return;
      }

      console.log("✅ Location details fetched:", { id: location.id, name: location.name });

      // Crear subcuenta (solo con campos que existen en el schema)
      const subaccount = await storage.createSubaccount({
        companyId,  // ID de nuestra tabla companies (FK válida)
        locationId: location.id,
        ghlCompanyId: ghlCompanyId || location.companyId,  // ID de GoHighLevel
        name: location.name,
        email: location.email,
        phone: location.phone,
        city: location.city,
        state: location.state,
        address: location.address,
      });

      console.log("✅ Subaccount created successfully:", subaccount.id);

      // Crear subscription vacía para la subcuenta
      await storage.createSubscription(subaccount.id);
      console.log("✅ Empty subscription created for subaccount");

      res.json(subaccount);
    } catch (error: any) {
      console.error("❌ Error creating subaccount from GHL:", error);
      res.status(500).json({ error: error.message || "Failed to create subaccount from GHL" });
    }
  });

  // Actualizar API Key de OpenAI por locationId
  app.patch("/api/subaccounts/:locationId/openai-key", async (req, res) => {
    try {
      const { locationId } = req.params;
      const validatedData = updateSubaccountOpenAIKeySchema.parse(req.body);

      const subaccount = await storage.getSubaccountByLocationId(locationId);
      
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      const updated = await storage.updateSubaccount(subaccount.id, {
        openaiApiKey: validatedData.openaiApiKey,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update OpenAI API key" });
      }
    }
  });

  // Actualizar Ajustes del CRM (Calendar ID) por locationId
  app.patch("/api/subaccounts/:locationId/crm-settings", isAuthenticated, async (req, res) => {
    try {
      const { locationId } = req.params;
      const validatedData = updateSubaccountCrmSettingsSchema.parse(req.body);

      const subaccount = await storage.getSubaccountByLocationId(locationId);
      
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      // Verificar que la subcuenta pertenece al usuario
      const user = req.user as any;
      if (subaccount.id !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const updated = await storage.updateSubaccount(subaccount.id, {
        calendarId: validatedData.calendarId,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update CRM settings" });
      }
    }
  });

  // Obtener información completa del cliente por locationId
  app.get("/api/subaccounts/:locationId/info", async (req, res) => {
    try {
      const { locationId } = req.params;

      const subaccount = await storage.getSubaccountByLocationId(locationId);
      
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      // Retornar toda la información del cliente
      res.json({
        name: subaccount.name,
        phone: subaccount.phone,
        email: subaccount.email,
        locationId: subaccount.locationId,
        openaiApiKey: subaccount.openaiApiKey,
        companyId: subaccount.companyId,
        city: subaccount.city,
        state: subaccount.state,
        address: subaccount.address,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get subaccount info" });
    }
  });

  // ============================================
  // RUTAS DE INSTANCIAS WHATSAPP (Protegidas)
  // ============================================

  app.post("/api/instances", isAuthenticated, async (req, res) => {
    try {
      const validatedData = createWhatsappInstanceSchema.parse(req.body);
      
      // Verificar plan de la subcuenta antes de crear instancia
      const subaccount = await storage.getSubaccount(validatedData.subaccountId);
      if (!subaccount) {
        res.status(404).json({ error: "Subaccount not found" });
        return;
      }

      // VALIDACIÓN 1: Verificar que la subcuenta esté manualmente activada
      if (!subaccount.manuallyActivated) {
        res.status(403).json({ 
          error: "Subcuenta desactivada", 
          message: "Esta subcuenta ha sido desactivada por el administrador. Contacte con soporte." 
        });
        return;
      }

      // Obtener o crear subscription
      let subscription = await storage.getSubscription(validatedData.subaccountId);
      if (!subscription) {
        subscription = await storage.createSubscription(validatedData.subaccountId, 15); // 15 días de prueba
      }

      // Verificar si está en período de prueba
      const now = new Date();
      const isInTrial = subscription.inTrial && 
                        subscription.trialEndsAt && 
                        new Date(subscription.trialEndsAt) > now;

      // Si está en período de prueba, permitir crear instancia sin restricciones
      if (isInTrial) {
        const instance = await storage.createWhatsappInstance(validatedData);
        res.json({
          instance,
          inTrial: true,
          trialEndsAt: subscription.trialEndsAt,
          invoiceGenerated: false,
        });
        return;
      }

      // Si terminó el período de prueba, marcar como no en prueba
      if (subscription.inTrial && subscription.trialEndsAt && new Date(subscription.trialEndsAt) <= now) {
        subscription = await storage.updateSubscription(validatedData.subaccountId, {
          inTrial: false,
        }) || subscription;
      }

      // VALIDACIÓN 2: Verificar billing habilitado (solo después del período de prueba)
      if (!subaccount.billingEnabled) {
        res.status(403).json({ 
          error: "Billing deshabilitado", 
          message: "El billing ha sido deshabilitado para esta subcuenta. Contacte con soporte para más información." 
        });
        return;
      }

      // Contar instancias actuales
      const currentInstances = await storage.countWhatsappInstances(validatedData.subaccountId);
      
      // LÓGICA AUTOMÁTICA DE BILLING (después del período de prueba)
      // NUEVO MODELO: 1 inst=$10, 2-3=$19, 4-5=$29, 6+=$29+$5/extra
      let needsPlanChange = false;
      let newPlan = subscription.plan;
      let newExtraSlots = parseInt(subscription.extraSlots);
      let invoiceGenerated = false;
      let invoiceId: string | undefined;

      // Determinar plan necesario según cantidad de instancias (contando la nueva)
      const totalInstances = currentInstances + 1;
      
      if (currentInstances === 0 && subscription.plan === "none") {
        // Primera instancia: Plan Starter ($10/mes)
        needsPlanChange = true;
        newPlan = "starter";
        newExtraSlots = 0;
        
        const invoice = await storage.createInvoice({
          subaccountId: validatedData.subaccountId,
          amount: "10.00",
          plan: "starter",
          baseAmount: "10.00",
          extraAmount: "0.00",
          extraSlots: "0",
          description: "Plan Starter - 1 instancia de WhatsApp",
          status: "pending",
        });
        invoiceGenerated = true;
        invoiceId = invoice.id;
      }
      else if (totalInstances >= 2 && totalInstances <= 3 && subscription.plan === "starter") {
        // 2-3 instancias: Upgrade a Plan Básico ($19/mes)
        needsPlanChange = true;
        newPlan = "basic";
        newExtraSlots = 0;
        
        const invoice = await storage.createInvoice({
          subaccountId: validatedData.subaccountId,
          amount: "19.00",
          plan: "basic",
          baseAmount: "19.00",
          extraAmount: "0.00",
          extraSlots: "0",
          description: "Plan Básico - Hasta 3 instancias de WhatsApp (Upgrade automático)",
          status: "pending",
        });
        invoiceGenerated = true;
        invoiceId = invoice.id;
      }
      else if (totalInstances >= 4 && totalInstances <= 5 && (subscription.plan === "starter" || subscription.plan === "basic")) {
        // 4-5 instancias: Upgrade a Plan Pro ($29/mes)
        needsPlanChange = true;
        newPlan = "pro";
        newExtraSlots = 0;
        
        const invoice = await storage.createInvoice({
          subaccountId: validatedData.subaccountId,
          amount: "29.00",
          plan: "pro",
          baseAmount: "29.00",
          extraAmount: "0.00",
          extraSlots: "0",
          description: "Plan Pro - Hasta 5 instancias de WhatsApp (Upgrade automático)",
          status: "pending",
        });
        invoiceGenerated = true;
        invoiceId = invoice.id;
      }
      else if (totalInstances > 5 && subscription.plan === "pro") {
        // Más de 5 instancias: Agregar slot extra ($5 cada uno)
        needsPlanChange = true;
        newPlan = "pro";
        newExtraSlots = totalInstances - 5; // Slots adicionales sobre el plan Pro base
        
        const invoice = await storage.createInvoice({
          subaccountId: validatedData.subaccountId,
          amount: "5.00",
          plan: "pro",
          baseAmount: "0.00",
          extraAmount: "5.00",
          extraSlots: "1",
          description: `Slot adicional #${newExtraSlots} - Instancia extra de WhatsApp`,
          status: "pending",
        });
        invoiceGenerated = true;
        invoiceId = invoice.id;
      }

      // Aplicar cambios al plan si es necesario
      if (needsPlanChange) {
        let includedInstances = "0";
        let basePrice = "0.00";
        
        if (newPlan === "starter") {
          includedInstances = "1";
          basePrice = "10.00";
        } else if (newPlan === "basic") {
          includedInstances = "3";
          basePrice = "19.00";
        } else if (newPlan === "pro") {
          includedInstances = "5";
          basePrice = "29.00";
        }
        
        subscription = await storage.updateSubscription(validatedData.subaccountId, {
          plan: newPlan,
          extraSlots: newExtraSlots.toString(),
          includedInstances,
          basePrice,
          extraPrice: newExtraSlots > 0 ? (newExtraSlots * 5).toFixed(2) : "0.00",
        }) || subscription;
      }

      // Crear la instancia
      const instance = await storage.createWhatsappInstance(validatedData);
      
      // Responder con la instancia y la factura generada (si aplica)
      res.json({
        instance,
        invoiceGenerated,
        invoiceId,
        planChanged: needsPlanChange,
        currentPlan: newPlan,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error creating instance:", error.errors);
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error creating instance:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create instance";
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  app.get("/api/instances/subaccount/:subaccountId", isAuthenticated, async (req, res) => {
    try {
      const instances = await storage.getWhatsappInstances(req.params.subaccountId);
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get instances" });
    }
  });

  app.patch("/api/instances/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateWhatsappInstanceSchema.parse(req.body);
      const updated = await storage.updateWhatsappInstance(req.params.id, validatedData);
      if (!updated) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update instance" });
      }
    }
  });

  app.delete("/api/instances/:id", isAuthenticated, async (req, res) => {
    try {
      const instanceId = req.params.id;
      
      // Obtener la instancia primero
      const instance = await storage.getWhatsappInstance(instanceId);
      if (!instance) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }

      // Intentar eliminar de Evolution API primero
      try {
        await evolutionAPI.deleteInstance(instance.evolutionInstanceName);
        console.log(`✅ Deleted instance ${instance.evolutionInstanceName} from Evolution API`);
      } catch (error) {
        console.error(`⚠️ Error deleting instance ${instance.evolutionInstanceName} from Evolution API:`, error);
        // Continuar aunque falle - la instancia podría ya no existir en Evolution API
      }

      // Eliminar de la base de datos
      const deleted = await storage.deleteWhatsappInstance(instanceId);
      if (!deleted) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }
      
      console.log(`🗑️ Instance ${instanceId} deleted from database`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting instance:", error);
      res.status(500).json({ error: "Failed to delete instance" });
    }
  });

  app.post("/api/instances/:id/generate-qr", isAuthenticated, async (req, res) => {
    try {
      const whatsappInstance = await storage.getWhatsappInstance(req.params.id);
      if (!whatsappInstance) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }
      
      // Eliminar instancia existente en Evolution API para prevenir sufijos _1, _2, etc.
      try {
        console.log(`🔍 Checking if instance ${whatsappInstance.evolutionInstanceName} exists in Evolution API...`);
        await evolutionAPI.getInstanceState(whatsappInstance.evolutionInstanceName);
        // Si llegamos aquí, la instancia existe - eliminarla primero
        console.log(`🗑️ Instance ${whatsappInstance.evolutionInstanceName} exists, deleting before creating new one...`);
        await evolutionAPI.deleteInstance(whatsappInstance.evolutionInstanceName);
        console.log(`✅ Old instance deleted successfully`);
      } catch (error) {
        // Si falla getInstanceState, la instancia no existe - esto está bien
        console.log(`ℹ️ Instance ${whatsappInstance.evolutionInstanceName} doesn't exist yet (this is expected)`);
      }

      // Crear nueva instancia limpia
      console.log(`🆕 Creating fresh instance ${whatsappInstance.evolutionInstanceName}...`);
      await evolutionAPI.createInstance(whatsappInstance.evolutionInstanceName);

      // Configurar webhook automáticamente
      try {
        const webhookUrl = 'https://whatsapp.cloude.es/api/webhook/message';
        console.log(`🔗 Configuring webhook for instance ${whatsappInstance.evolutionInstanceName}: ${webhookUrl}`);
        await evolutionAPI.setWebhook(whatsappInstance.evolutionInstanceName, webhookUrl);
        console.log(`✅ Webhook configured successfully`);
      } catch (webhookError) {
        console.error('⚠️ Failed to configure webhook:', webhookError);
        // Continuar aunque falle el webhook - no es crítico para la creación
      }

      const qrData = await evolutionAPI.getQRCode(whatsappInstance.evolutionInstanceName);

      await storage.updateWhatsappInstance(req.params.id, {
        status: "qr_generated",
        qrCode: qrData.code,
      });

      res.json({
        qrCode: qrData.code,
        pairingCode: qrData.pairingCode,
      });
    } catch (error) {
      console.error("Error generating QR:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  app.get("/api/instances/:id/status", async (req, res) => {
    try {
      const whatsappInstance = await storage.getWhatsappInstance(req.params.id);
      if (!whatsappInstance) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }
      
      try {
        const stateData = await evolutionAPI.getInstanceState(whatsappInstance.evolutionInstanceName);
        
        if (stateData.instance.state === "open") {
          await storage.updateWhatsappInstance(req.params.id, {
            status: "connected",
            connectedAt: new Date(),
          });
        }

        res.json({
          state: stateData.instance.state,
          status: whatsappInstance.status,
        });
      } catch (error) {
        res.json({
          state: "disconnected",
          status: whatsappInstance.status,
        });
      }
    } catch (error) {
      console.error("Error checking status:", error);
      res.status(500).json({ error: "Failed to check instance status" });
    }
  });

  // Endpoint para sincronización manual con Evolution API
  app.post("/api/instances/:id/sync", isAuthenticated, async (req, res) => {
    try {
      const instance = await storage.getWhatsappInstance(req.params.id);
      if (!instance) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }

      console.log(`🔄 Manual sync requested for instance ${instance.evolutionInstanceName}`);

      try {
        // Intentar obtener estado de Evolution API
        const stateData = await evolutionAPI.getInstanceState(instance.evolutionInstanceName);
        const state = stateData.instance.state;

        if (state === "open") {
          // Intentar obtener información completa
          let phoneNumber = instance.phoneNumber;
          
          try {
            const instanceInfo = await evolutionAPI.getInstanceInfo(instance.evolutionInstanceName);
            const rawPhoneNumber = instanceInfo.ownerJid || null;
            phoneNumber = extractPhoneNumber(rawPhoneNumber);
            console.log(`📞 Sync: extracted phone ${phoneNumber} from Evolution API`);
          } catch (infoError) {
            console.error(`Sync: could not fetch instance info:`, infoError);
          }

          await storage.updateWhatsappInstance(instance.id, {
            status: "connected",
            phoneNumber,
            connectedAt: new Date(),
          });

          res.json({
            success: true,
            status: "connected",
            phoneNumber,
            message: "Instance synchronized successfully",
          });
        } else if (state === "close") {
          await storage.updateWhatsappInstance(instance.id, {
            status: "disconnected",
            disconnectedAt: new Date(),
          });

          res.json({
            success: true,
            status: "disconnected",
            message: "Instance is disconnected",
          });
        } else {
          res.json({
            success: true,
            status: state,
            message: `Instance state: ${state}`,
          });
        }
      } catch (error) {
        // Si falla getInstanceState, la instancia probablemente no existe en Evolution API
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          console.log(`⚠️ Sync: Instance ${instance.evolutionInstanceName} doesn't exist in Evolution API`);
          
          res.json({
            success: true,
            status: "not_found_in_evolution",
            message: "Instance not found in Evolution API - may have been deleted",
            suggestion: "Delete this instance or regenerate QR code",
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error syncing instance:", error);
      res.status(500).json({ error: "Failed to sync instance" });
    }
  });

  // Endpoint para enviar mensajes de WhatsApp
  app.post("/api/instances/:id/send-message", isAuthenticated, async (req, res) => {
    try {
      const instance = await storage.getWhatsappInstance(req.params.id);
      if (!instance) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }

      // Validar que el usuario tenga acceso a esta instancia
      if (instance.subaccountId !== (req.user as any).id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Validar que la instancia esté conectada
      if (instance.status !== "connected") {
        res.status(400).json({ 
          error: "Instance not connected",
          message: "La instancia debe estar conectada para enviar mensajes" 
        });
        return;
      }

      // Validar datos del mensaje
      const validatedData = sendWhatsappMessageSchema.parse(req.body);

      console.log(`📤 Sending message from instance ${instance.evolutionInstanceName} to ${validatedData.number}`);

      // Enviar mensaje a través de Evolution API
      const response = await evolutionAPI.sendTextMessage(
        instance.evolutionInstanceName,
        validatedData.number,
        validatedData.text
      );

      console.log(`✅ Message sent successfully:`, response);

      res.json({
        success: true,
        message: "Mensaje enviado correctamente",
        data: response
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        console.error("Error sending message:", error);
        res.status(500).json({ 
          error: "Failed to send message",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Helper function to extract phone number from various WhatsApp formats
  const extractPhoneNumber = (value: string | null | undefined): string | null => {
    if (!value) {
      console.log('📱 extractPhoneNumber: received null/undefined value');
      return null;
    }
    
    console.log(`📱 extractPhoneNumber: processing "${value}"`);
    
    // Remove whitespace and common separators
    let cleaned = value.trim().replace(/[\s\-\(\)]/g, '');
    
    // Handle WhatsApp JID format: "553198296801@s.whatsapp.net"
    if (cleaned.includes('@')) {
      cleaned = cleaned.split('@')[0];
      console.log(`📱 extractPhoneNumber: extracted from JID format: "${cleaned}"`);
    }
    
    // Handle "+" prefix
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
      console.log(`📱 extractPhoneNumber: removed + prefix: "${cleaned}"`);
    }
    
    // Validate it's a number
    if (!/^\d+$/.test(cleaned)) {
      console.log(`📱 extractPhoneNumber: invalid format (non-numeric): "${cleaned}"`);
      return null;
    }
    
    // Typical phone numbers are 10-15 digits
    if (cleaned.length < 10 || cleaned.length > 15) {
      console.log(`📱 extractPhoneNumber: invalid length ${cleaned.length}: "${cleaned}"`);
      return null;
    }
    
    console.log(`📱 extractPhoneNumber: final cleaned number: "${cleaned}"`);
    return cleaned;
  };

  app.post("/api/webhooks/evolution", async (req, res) => {
    try {
      const event = req.body;
      console.log("Evolution API webhook received:", JSON.stringify(event, null, 2));
      
      if (!event || typeof event.event !== "string" || typeof event.instance !== "string") {
        console.error("Invalid webhook payload: missing required fields");
        res.status(400).json({ error: "Invalid payload" });
        return;
      }
      
      if (event.event === "connection.update") {
        const instanceName = event.instance;
        const state = event.data?.state;

        if (!state || typeof state !== "string") {
          console.error(`Invalid state in webhook for instance ${instanceName}`);
          res.status(400).json({ error: "Invalid state data" });
          return;
        }

        const instance = await storage.getWhatsappInstanceByName(instanceName);

        if (instance) {
          console.log(`Processing connection update for instance ${instance.id} (${instanceName}): state=${state}`);
          
          if (state === "open") {
            // Intentar obtener número de teléfono de múltiples fuentes
            let rawPhoneNumber = event.data?.phoneNumber || event.data?.owner || null;
            let phoneNumber = extractPhoneNumber(rawPhoneNumber);
            
            // Si no se obtuvo del webhook, intentar desde Evolution API
            if (!phoneNumber) {
              try {
                console.log(`📞 Webhook didn't provide phone number, fetching from Evolution API...`);
                const instanceInfo = await evolutionAPI.getInstanceInfo(instanceName);
                rawPhoneNumber = instanceInfo.ownerJid || null;
                phoneNumber = extractPhoneNumber(rawPhoneNumber);
                console.log(`📞 Fetched from Evolution API: ${phoneNumber} (raw: ${rawPhoneNumber})`);
              } catch (infoError) {
                console.error(`Could not fetch instance info:`, infoError);
              }
            }
            
            await storage.updateWhatsappInstance(instance.id, {
              status: "connected",
              phoneNumber,
              connectedAt: new Date(),
            });

            console.log(`Instance ${instance.id} connected with phone ${phoneNumber}`);

            io.to(`instance-${instance.id}`).emit("instance-connected", {
              instanceId: instance.id,
              phoneNumber,
            });

            if (instance.webhookUrl) {
              console.log(`Sending connection data to webhook: ${instance.webhookUrl}`);
              try {
                const webhookResponse = await fetch(instance.webhookUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    instanceId: instance.id,
                    customName: instance.customName,
                    phoneNumber,
                    status: "connected",
                    connectedAt: new Date(),
                  }),
                });
                
                if (!webhookResponse.ok) {
                  const errorText = await webhookResponse.text();
                  console.error(`Webhook delivery failed for instance ${instance.id}: ${webhookResponse.status} ${webhookResponse.statusText} - ${errorText}`);
                } else {
                  console.log(`Webhook delivered successfully for instance ${instance.id}: ${webhookResponse.status} ${webhookResponse.statusText}`);
                }
              } catch (error) {
                console.error(`Error calling webhook for instance ${instance.id}:`, error);
              }
            }
          } else if (state === "close") {
            await storage.updateWhatsappInstance(instance.id, {
              status: "disconnected",
              disconnectedAt: new Date(),
            });
            console.log(`Instance ${instance.id} disconnected at ${new Date().toISOString()}`);
          }
        } else {
          console.error(`Instance not found for name: ${instanceName}`);
          res.status(404).json({ error: "Instance not found" });
          return;
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ============================================
  // WEBHOOK DE MENSAJES (Público - llamado por Evolution API/n8n)
  // ============================================
  
  // Recibir mensaje y reenviarlo a webhook configurado
  app.post("/api/webhook/message", async (req, res) => {
    try {
      const { locationId, message, from, instanceName } = req.body;
      
      if (!locationId || !message) {
        res.status(400).json({ error: "locationId and message are required" });
        return;
      }

      // Obtener configuración de webhook
      const webhookConfig = await storage.getWebhookConfig();
      
      if (!webhookConfig || !webhookConfig.isActive || !webhookConfig.webhookUrl) {
        console.log("Webhook not configured or inactive");
        res.status(200).json({ success: true, message: "Webhook not configured" });
        return;
      }

      // Preparar datos para enviar al webhook
      const webhookPayload = {
        locationId,
        message,
        from,
        instanceName,
        timestamp: new Date().toISOString(),
      };

      // Enviar al webhook configurado
      try {
        const response = await fetch(webhookConfig.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          console.error(`Webhook failed with status: ${response.status}`);
        } else {
          console.log(`✅ Message forwarded to webhook for locationId: ${locationId}`);
        }
      } catch (webhookError) {
        console.error("Error forwarding to webhook:", webhookError);
      }

      res.json({ success: true, message: "Message processed" });
    } catch (error) {
      console.error("Error processing webhook message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Polling automático cada 5 segundos para sincronización
  setInterval(async () => {
    try {
      const allInstances = await storage.getAllInstances();
      
      for (const instance of allInstances) {
        // Solo verificar instancias que podrían estar activas
        if (instance.status === "qr_generated" || instance.status === "connected" || instance.status === "disconnected") {
          try {
            const stateData = await evolutionAPI.getInstanceState(instance.evolutionInstanceName);
            
            // Si está abierta en Evolution API
            if (stateData.instance.state === "open") {
              // Siempre intentar obtener número de teléfono si no lo tenemos
              let phoneNumber = instance.phoneNumber;
              let needsUpdate = false;
              
              // Cambio de estado: de desconectado/qr a conectado
              if (instance.status !== "connected") {
                needsUpdate = true;
                console.log(`🔄 Instance ${instance.evolutionInstanceName} transitioning to connected`);
              }
              
              // Ya está conectado pero sin número de teléfono
              if (instance.status === "connected" && !instance.phoneNumber) {
                needsUpdate = true;
                console.log(`📞 Instance ${instance.evolutionInstanceName} is connected but missing phone number`);
              }
              
              // Obtener número de teléfono de Evolution API
              if (needsUpdate) {
                try {
                  const instanceInfo = await evolutionAPI.getInstanceInfo(instance.evolutionInstanceName);
                  const rawPhoneNumber = instanceInfo.ownerJid || null;
                  const extractedPhone = extractPhoneNumber(rawPhoneNumber);
                  
                  if (extractedPhone) {
                    phoneNumber = extractedPhone;
                    console.log(`✅ Auto-sync: Got phone number ${phoneNumber} for ${instance.evolutionInstanceName}`);
                  } else {
                    console.log(`⚠️ Auto-sync: Could not extract phone number from "${rawPhoneNumber}" for ${instance.evolutionInstanceName}`);
                  }
                } catch (infoError) {
                  console.error(`Could not fetch instance info for ${instance.evolutionInstanceName}:`, infoError);
                }
                
                await storage.updateWhatsappInstance(instance.id, {
                  status: "connected",
                  phoneNumber,
                  connectedAt: new Date(),
                });
                
                io.to(`instance-${instance.id}`).emit("instance-connected", {
                  instanceId: instance.id,
                  phoneNumber,
                });
              }
            }
            // Si está cerrada en Evolution API pero marcada como conectada en nuestra BD
            else if (stateData.instance.state === "close" && instance.status === "connected") {
              await storage.updateWhatsappInstance(instance.id, {
                status: "disconnected",
                disconnectedAt: new Date(),
              });
              console.log(`📴 Auto-sync: Instance ${instance.evolutionInstanceName} disconnected at ${new Date().toISOString()}`);
              
              io.to(`instance-${instance.id}`).emit("instance-disconnected", {
                instanceId: instance.id,
                disconnectedAt: new Date(),
              });
            }
          } catch (error) {
            // Detectar si la instancia fue eliminada desde WhatsApp
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage.includes('404') || errorMessage.includes('not found')) {
              console.log(`🗑️ Auto-sync: Instance ${instance.evolutionInstanceName} no longer exists in Evolution API - deleting from database`);
              
              try {
                await storage.deleteWhatsappInstance(instance.id);
                console.log(`✅ Deleted orphaned instance ${instance.id} from database`);
                
                io.to(`instance-${instance.id}`).emit("instance-deleted", {
                  instanceId: instance.id,
                  reason: "deleted_from_whatsapp",
                });
              } catch (deleteError) {
                console.error(`Failed to delete orphaned instance ${instance.id}:`, deleteError);
              }
            } else {
              console.error(`Error checking instance ${instance.evolutionInstanceName}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in status check interval:", error);
    }
  }, 5000);

  return httpServer;
}
