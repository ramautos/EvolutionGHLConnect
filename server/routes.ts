import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import passport from "passport";
import { storage } from "./storage";
import { ghlStorage } from "./ghl-storage";
import { ghlApi } from "./ghl-api";
import { evolutionAPI } from "./evolution-api";
import { setupPassport, isAuthenticated, isAdmin, hashPassword } from "./auth";
import { insertUserSchema, createSubaccountSchema, createWhatsappInstanceSchema, updateWhatsappInstanceSchema, registerUserSchema, loginUserSchema, updateUserProfileSchema, updateUserPasswordSchema, updateSubaccountOpenAIKeySchema, updateSubaccountCrmSettingsSchema, updateWebhookConfigSchema, sendWhatsappMessageSchema } from "@shared/schema";
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

  // Registro con email/password
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      // Verificar si el email ya existe
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        res.status(400).json({ error: "Este email ya está registrado" });
        return;
      }

      // Hash de la contraseña
      const passwordHash = await hashPassword(validatedData.password);

      // Crear usuario
      const user = await storage.createUser({
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: "user",
        isActive: true,
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
      const validatedData = loginUserSchema.parse(req.body);
      
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
  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Redirigir al dashboard después del login exitoso
      res.redirect("/dashboard");
    }
  );

  // Obtener usuario actual
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    
    const user = req.user as any;
    // No enviar datos sensibles al cliente, pero indicar si tiene contraseña
    const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
    const userResponse = {
      ...userWithoutSensitive,
      hasPassword: !!user.passwordHash, // Indicar si tiene contraseña local
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
      const validatedData = updateUserProfileSchema.parse(req.body);

      const updatedUser = await storage.updateUser(user.id, validatedData);
      
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
      const validatedData = updateUserPasswordSchema.parse(req.body);

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
      await storage.updateUser(user.id, { passwordHash: hashedPassword });

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
      const user = await storage.getUser(req.params.id);
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
      const user = await storage.getUserByEmail(req.params.email);
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

  // ============================================
  // RUTAS DE ADMIN
  // ============================================

  // Listar todos los usuarios (solo admin)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
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

      const deleted = await storage.deleteUser(userId);
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
      if (subaccount.userId !== user.id && user.role !== "admin") {
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
      if (subaccount.userId !== user.id && user.role !== "admin") {
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
      if (subaccount.userId !== user.id && user.role !== "admin") {
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

  app.get("/api/subaccounts/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const subaccounts = await storage.getSubaccounts(req.params.userId);
      res.json(subaccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subaccounts" });
    }
  });

  // Crear subcuenta desde GoHighLevel OAuth
  app.post("/api/subaccounts/from-ghl", isAuthenticated, async (req, res) => {
    try {
      const { userId, companyId, locationId } = req.body;

      if (!userId || !companyId || !locationId) {
        res.status(400).json({ error: "Missing required fields: userId, companyId, locationId" });
        return;
      }

      console.log("📥 Creating subaccount from GHL OAuth:", { userId, companyId, locationId });

      // Verificar si la subcuenta ya existe
      const existingSubaccounts = await storage.getSubaccounts(userId);
      const existing = existingSubaccounts.find(s => s.locationId === locationId);
      
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
        userId,
        locationId: location.id,
        companyId,
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
      if (subaccount.userId !== user.id && user.role !== "admin") {
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

  app.get("/api/instances/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const instances = await storage.getAllUserInstances(req.params.userId);
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user instances" });
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
      if (instance.userId !== (req.user as any).id) {
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
