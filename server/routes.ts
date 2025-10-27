import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import passport from "passport";
import { storage } from "./storage";
import { ghlStorage } from "./ghl-storage";
import { ghlApi } from "./ghl-api";
import { evolutionAPI } from "./evolution-api";
import { setupPassport, isAuthenticated, isAdmin, hashPassword } from "./auth";
import { insertUserSchema, createSubaccountSchema, createWhatsappInstanceSchema, updateWhatsappInstanceSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { z } from "zod";

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
    // No enviar datos sensibles al cliente
    const { passwordHash: _, googleId: __, ...userWithoutSensitive } = user;
    res.json(userWithoutSensitive);
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
      res.json(subaccount);
    } catch (error: any) {
      console.error("❌ Error creating subaccount from GHL:", error);
      res.status(500).json({ error: error.message || "Failed to create subaccount from GHL" });
    }
  });

  // ============================================
  // RUTAS DE INSTANCIAS WHATSAPP (Protegidas)
  // ============================================

  app.post("/api/instances", isAuthenticated, async (req, res) => {
    try {
      const validatedData = createWhatsappInstanceSchema.parse(req.body);
      const instance = await storage.createWhatsappInstance(validatedData);
      res.json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create instance" });
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
      const deleted = await storage.deleteWhatsappInstance(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Instance not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
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
      
      try {
        await evolutionAPI.createInstance(whatsappInstance.evolutionInstanceName);
      } catch (error) {
        console.log("Instance may already exist, continuing...");
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

  // Helper function to extract phone number from WhatsApp JID format
  const extractPhoneNumber = (value: string | null | undefined): string | null => {
    if (!value) return null;
    // WhatsApp JID format: "553198296801@s.whatsapp.net"
    // Extract just the number part
    return value.split('@')[0] || null;
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
            const rawPhoneNumber = event.data?.phoneNumber || null;
            const phoneNumber = extractPhoneNumber(rawPhoneNumber);
            
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
            });
            console.log(`Instance ${instance.id} disconnected`);
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

  setInterval(async () => {
    try {
      const allInstances = await storage.getAllInstances();
      
      for (const instance of allInstances) {
        if (instance.status === "qr_generated" || instance.status === "connected") {
          try {
            const stateData = await evolutionAPI.getInstanceState(instance.evolutionInstanceName);
            
            // Update if transitioning to connected OR if already connected but missing phone number
            const needsUpdate = 
              (stateData.instance.state === "open" && instance.status !== "connected") ||
              (stateData.instance.state === "open" && instance.status === "connected" && !instance.phoneNumber);
            
            if (needsUpdate) {
              let phoneNumber = instance.phoneNumber;
              
              try {
                const instanceInfo = await evolutionAPI.getInstanceInfo(instance.evolutionInstanceName);
                const rawPhoneNumber = instanceInfo.instance.owner || instanceInfo.instance.phoneNumber || null;
                phoneNumber = extractPhoneNumber(rawPhoneNumber);
                console.log(`📞 Extracted phone number for ${instance.evolutionInstanceName}: ${phoneNumber} (from raw: ${rawPhoneNumber})`);
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
          } catch (error) {
            console.error(`Error checking instance ${instance.evolutionInstanceName}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error in status check interval:", error);
    }
  }, 5000);

  return httpServer;
}
