import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

// Rate limiter para endpoints públicos
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Rate limiter para autenticación (anti brute force)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login', code: 'AUTH_RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para WhatsApp
export const whatsappRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Límite de mensajes excedido', code: 'WHATSAPP_RATE_LIMIT' },
});

// Helmet config
// IMPORTANTE: Permitir que GHL (incluyendo dominios white-label) cargue la app en iframe
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://static.cloudflareinsights.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://evolution.cloude.es", "https://cloudflareinsights.com", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      // Permitir CUALQUIER origen para iframes (necesario para dominios white-label de GHL)
      frameAncestors: ["*"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Desactivar X-Frame-Options porque usamos frame-ancestors en CSP
  frameguard: false,
});

export function setupSecurityMiddleware(app: Express): void {
  console.log('🔒 Configurando seguridad...');
  app.use(cookieParser());
  app.use(helmetConfig);
  app.use('/api/', publicRateLimiter);
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
  console.log('🔒 Seguridad configurada');
}
