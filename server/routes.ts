import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { ghlStorage } from "./ghl-storage";
import { ghlApi } from "./ghl-api";
import { evolutionAPI } from "./evolution-api";
import { insertUserSchema, insertSubaccountSchema, insertWhatsappInstanceSchema, updateWhatsappInstanceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
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
              
Revisa los logs del servidor para ver el error exacto de la API de GoHighLevel.
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

  app.post("/api/subaccounts", async (req, res) => {
    try {
      const validatedData = insertSubaccountSchema.parse(req.body);
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

  app.get("/api/subaccounts/user/:userId", async (req, res) => {
    try {
      const subaccounts = await storage.getSubaccounts(req.params.userId);
      res.json(subaccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subaccounts" });
    }
  });

  app.post("/api/instances", async (req, res) => {
    try {
      const validatedData = insertWhatsappInstanceSchema.parse(req.body);
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

  app.get("/api/instances/subaccount/:subaccountId", async (req, res) => {
    try {
      const instances = await storage.getWhatsappInstances(req.params.subaccountId);
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get instances" });
    }
  });

  app.get("/api/instances/user/:userId", async (req, res) => {
    try {
      const instances = await storage.getAllUserInstances(req.params.userId);
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user instances" });
    }
  });

  app.patch("/api/instances/:id", async (req, res) => {
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

  app.delete("/api/instances/:id", async (req, res) => {
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

  app.post("/api/instances/:id/generate-qr", async (req, res) => {
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
            const phoneNumber = event.data?.phoneNumber || null;
            
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
                    instanceName: instance.instanceName,
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
            
            if (stateData.instance.state === "open" && instance.status !== "connected") {
              let phoneNumber = instance.phoneNumber;
              
              try {
                const instanceInfo = await evolutionAPI.getInstanceInfo(instance.evolutionInstanceName);
                phoneNumber = instanceInfo.instance.owner || instanceInfo.instance.phoneNumber || null;
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
