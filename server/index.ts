import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurityMiddleware } from "./security";

const app = express();

// Trust proxy for secure cookies behind Cloudflare/reverse proxy
app.set('trust proxy', 1);

// Security middleware (Rate Limiting, Helmet, CSRF)
setupSecurityMiddleware(app);

// Health check endpoint at / - smart routing to avoid intercepting SPA traffic
// Uses Express content negotiation to distinguish health checks from browser requests
// SLA: Responds in <1ms (no blocking operations, no database queries)
app.get('/', (req, res, next) => {
  // If client accepts HTML (browser/crawler), pass to Vite/static files
  if (req.accepts('html')) {
    return next();
  }
  
  // Otherwise, it's a health check probe - respond immediately with JSON
  // No await, no database, no I/O - guaranteed fast response
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Add process lifecycle logging
    process.on('beforeExit', (code) => {
      console.log('⚠️  Process beforeExit event fired with code:', code);
    });

    process.on('exit', (code) => {
      console.log('⚠️  Process exit event fired with code:', code);
    });

    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM received');
    });

    process.on('SIGINT', () => {
      console.log('⚠️  SIGINT received');
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Verify critical environment variables
    // Note: ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD are only required
    // for first-time database initialization, so they're validated in bootstrap.ts
    const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
      console.error('Please configure these secrets in your deployment settings');
      process.exit(1);
    }

    console.log('✅ Environment variables verified');
    console.log('🚀 Starting server initialization...');

    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log('🔧 Setting up Vite in development mode...');
      await setupVite(app, server);
      console.log('✅ Vite setup complete');
    } else {
      console.log('📦 Serving static files in production mode...');
      serveStatic(app);
      console.log('✅ Static files configured');
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`🌐 Attempting to listen on 0.0.0.0:${port}...`);

    // Wrap server.listen in a Promise to keep the async IIFE alive
    await new Promise<void>((resolve, reject) => {
      server.on('error', (error: any) => {
        console.error('❌ Server error during listen:', error);
        reject(error);
      });

      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        console.log(`✅ Server successfully started!`);
        log(`serving on port ${port}`);
        
        // Keep process alive explicitly
        // The HTTP server SHOULD keep the process alive, but this adds redundancy
        setInterval(() => {
          // This interval keeps the event loop active to prevent premature exit
          // Even if empty, it ensures the process stays alive
        }, 60000);
        
        console.log('🎯 Server is ready and will run indefinitely');
        
        // Ensure PENDING_CLAIM company is active (critical for webhooks)
        import('./db').then(({ db }) => {
          return import('../shared/schema').then(({ companies, oauthStates }) => {
            return import('drizzle-orm').then(({ sql }) => {
              console.log('🔧 Ensuring PENDING_CLAIM company is active...');
              return db.execute(sql`
                INSERT INTO companies (id, name, email, is_active, created_at, updated_at)
                VALUES ('PENDING_CLAIM', 'Pending Claim', 'pending@system.internal', true, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET is_active = true, updated_at = NOW()
              `).then(() => {
                console.log('✅ PENDING_CLAIM company is active');

                // Limpiar TODOS los OAuth states al iniciar el servidor
                // Esto permite reinstalaciones limpias sin errores de "state already used"
                console.log('🗑️ Cleaning up OAuth states...');
                return db.execute(sql`DELETE FROM ${oauthStates}`);
              }).then((result: any) => {
                console.log(`✅ OAuth states cleaned: ${result.rowCount || 0} states deleted`);
              }).catch((err: any) => {
                console.error('❌ Failed to ensure PENDING_CLAIM or clean OAuth states:', err.message);
              });
            });
          });
        }).catch((err: any) => {
          console.error('❌ Failed to import dependencies for PENDING_CLAIM check:', err);
        });
        
        // Run bootstrap in background without blocking (fire-and-forget)
        // This ensures health checks can respond immediately
        import('./bootstrap')
          .then(({ runBootstrap }) => {
            console.log('🔄 Running database bootstrap in background...');
            return runBootstrap();
          })
          .then(() => {
            console.log('✅ Database initialization complete');
          })
          .catch((bootstrapError) => {
            console.error('❌ Bootstrap failed:', bootstrapError);
            console.error('⚠️  Server is running but database may not be initialized properly');
            // Don't exit - server is already serving requests
          });
        
        // DON'T resolve the promise - this keeps the async IIFE alive indefinitely
        // The process will only exit on SIGTERM/SIGINT or uncaught errors
      });
    });

    // This line should never be reached because the Promise above never resolves
    console.log('⚠️  WARNING: Server listen promise resolved unexpectedly');

  } catch (error) {
    console.error('❌ Failed to start server:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
})();
