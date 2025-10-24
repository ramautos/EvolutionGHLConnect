import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
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
        await evolutionAPI.createInstance(whatsappInstance.instanceName);
      } catch (error) {
        console.log("Instance may already exist, continuing...");
      }

      const qrData = await evolutionAPI.getQRCode(whatsappInstance.instanceName);

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
        const stateData = await evolutionAPI.getInstanceState(whatsappInstance.instanceName);
        
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
            const stateData = await evolutionAPI.getInstanceState(instance.instanceName);
            
            if (stateData.instance.state === "open" && instance.status !== "connected") {
              let phoneNumber = instance.phoneNumber;
              
              try {
                const instanceInfo = await evolutionAPI.getInstanceInfo(instance.instanceName);
                phoneNumber = instanceInfo.instance.owner || instanceInfo.instance.phoneNumber || null;
              } catch (infoError) {
                console.error(`Could not fetch instance info for ${instance.instanceName}:`, infoError);
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
            console.error(`Error checking instance ${instance.instanceName}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error in status check interval:", error);
    }
  }, 5000);

  return httpServer;
}
