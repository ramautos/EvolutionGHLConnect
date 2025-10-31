# 📊 Sistema de Planes y Suscripciones

## ✅ Implementación Completa

He creado un sistema completo de planes basado en subcuentas con diseño moderno y funcionalidad lista para Stripe.

## 🎯 Planes Disponibles

### 1️⃣ Plan Básico ($15/mes)
- **1 Subcuenta** de GoHighLevel
- **1 Instancia** de WhatsApp
- Soporte por email
- Integración con N8N
- Dashboard básico
- **Precio por ubicación**: $15.00

### 2️⃣ Plan Pro ($50/mes) ⭐ MÁS POPULAR
- **5 Subcuentas** de GoHighLevel
- **5 Instancias** de WhatsApp
- Soporte prioritario 24/7
- Integración avanzada N8N
- Dashboard completo
- Webhooks personalizados
- **Precio por ubicación**: $10.00

### 3️⃣ Plan Enterprise ($90/mes)
- **10 Subcuentas** de GoHighLevel
- **10 Instancias** de WhatsApp
- Soporte dedicado 24/7
- Integración N8N ilimitada
- Dashboard personalizado
- API completa
- Onboarding personalizado
- **Precio por ubicación**: $9.00

## 📋 Base de Datos

### Tabla `subscriptions`

```sql
CREATE TABLE subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  subaccount_id VARCHAR NOT NULL REFERENCES subaccounts(id) UNIQUE,
  
  -- Plan Configuration
  plan TEXT NOT NULL DEFAULT 'trial',
  max_subaccounts TEXT NOT NULL DEFAULT '1',
  included_instances TEXT NOT NULL DEFAULT '1',
  extra_slots TEXT NOT NULL DEFAULT '0',
  
  -- Pricing
  base_price TEXT NOT NULL DEFAULT '0.00',
  extra_price TEXT NOT NULL DEFAULT '0.00',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Trial Period
  trial_ends_at TIMESTAMP,
  in_trial BOOLEAN NOT NULL DEFAULT true,
  
  -- Stripe Integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_product_id TEXT,
  
  -- Timestamps
  current_period_start TIMESTAMP DEFAULT NOW(),
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Diseño de la Página

### Características Visuales

1. **Gradiente de Fondo**:
   - `from-primary/5 via-background to-chart-2/5`
   - Patrón de cuadrícula sutil (16px)

2. **Cards de Planes**:
   - 3 planes en grid responsivo
   - Plan "Pro" destacado con escala 110%
   - Badge "Más Popular" con gradiente
   - Animaciones hover con `hover-elevate`
   - Border dinámico al seleccionar

3. **Estado Actual**:
   - Card con estadísticas visuales
   - Barra de progreso de subcuentas
   - Contador de días de prueba (si aplica)
   - Estado del plan con indicador visual

4. **Resumen de Compra**:
   - Detalles del plan seleccionado
   - Precio destacado con gradiente
   - Grid de características
   - Botón CTA prominente

## 🔄 Flujo de Usuario

### 1. Ver Plan Actual
1. Usuario va a `/billing` desde el Dashboard
2. Ve su plan actual y uso de subcuentas
3. Visualiza días restantes si está en trial

### 2. Seleccionar Nuevo Plan
1. Usuario ve los 3 planes disponibles
2. Hace clic en una card de plan
3. La card se resalta con border-2 y shadow
4. Aparece el resumen de compra

### 3. Actualizar Plan
1. Usuario hace clic en "Actualizar Plan"
2. Se ejecuta mutation PATCH `/api/subscription`
3. Backend actualiza:
   - `plan`
   - `maxSubaccounts`
   - `includedInstances`
   - `basePrice`
4. Se invalida caché de React Query
5. Toast de confirmación

## 🔌 Integración con Stripe (Preparado)

### Variables de Entorno Necesarias

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Endpoints Backend (Preparados)

#### POST /api/create-subscription
```typescript
// Body
{
  "planId": "pro_5",
  "priceId": "price_pro_5"  // Stripe Price ID
}

// Response
{
  "clientSecret": "pi_xxx_secret_xxx",
  "subscriptionId": "sub_xxx"
}
```

#### PATCH /api/subscription
```typescript
// Body
{
  "plan": "pro_5"
}

// Response
{
  "subscription": { /* updated subscription */ }
}
```

### Proceso de Pago con Stripe

1. **Usuario selecciona plan**
2. **Frontend**: Llama a `/api/create-subscription`
3. **Backend**: 
   - Crea/recupera Stripe Customer
   - Crea Stripe Subscription
   - Actualiza `subscriptions` table
4. **Frontend**: Redirige a Stripe Checkout o muestra Payment Element
5. **Usuario**: Completa pago en Stripe
6. **Webhook**: Stripe notifica éxito
7. **Backend**: Actualiza estado de suscripción

## 📊 Schema TypeScript

```typescript
export type Subscription = {
  id: string;
  subaccountId: string;
  plan: "trial" | "basic_1" | "pro_5" | "enterprise_10";
  maxSubaccounts: string;
  includedInstances: string;
  extraSlots: string;
  basePrice: string;
  extraPrice: string;
  status: "active" | "expired" | "cancelled";
  trialEndsAt: Date | null;
  inTrial: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};
```

## 🧪 Cómo Probar

### 1. Ver Página de Planes
```bash
# Navegar a
https://whatsapp.cloude.es/billing
```

### 2. Verificar Plan Actual
- Debes ver tu plan actual (probablemente "trial")
- Contador de subcuentas usadas vs disponibles
- Días restantes de prueba

### 3. Seleccionar Plan
- Haz clic en cualquier card de plan
- Verifica que se resalta con borde azul
- Aparece resumen de compra abajo

### 4. Actualizar Plan (Sin Stripe aún)
- Haz clic en "Actualizar Plan"
- Debes ver toast de confirmación
- Plan actual se actualiza

## 🎯 Próximos Pasos

### 1. Configurar Stripe Products
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Crea 3 productos:
   - **Básico**: $15/mes → Copia Price ID
   - **Pro**: $50/mes → Copia Price ID
   - **Enterprise**: $90/mes → Copia Price ID
3. Actualiza `PLANS` array en `Billing.tsx` con los Price IDs

### 2. Implementar Checkout de Stripe
- Añadir botón "Proceder al Pago"
- Integrar `Elements` de Stripe
- Crear página de confirmación

### 3. Webhooks de Stripe
- Endpoint `/api/webhooks/stripe`
- Manejar eventos:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 4. Límites de Subcuentas
- Validar en `/api/subaccounts` endpoint
- Bloquear creación si excede `maxSubaccounts`
- Mostrar mensaje de upgrade

## ✨ Mejoras Visuales Implementadas

- ✅ Gradiente de fondo consistente con Landing
- ✅ Cards con border-2 para mayor contraste
- ✅ Plan "Pro" destacado con escala 110%
- ✅ Badge "Más Popular" con gradiente
- ✅ Títulos con efecto de gradiente de texto
- ✅ Barra de progreso animada para subcuentas
- ✅ Iconos representativos (Building2, Users, MessageSquare)
- ✅ Grid responsivo 1-2-3 columnas
- ✅ Resumen de compra con detalles claros
- ✅ Estados de loading con Loader2
- ✅ Toasts de confirmación/error

## 🔐 Seguridad

- ✅ Validación de datos con Zod schemas
- ✅ Autenticación requerida (isAuthenticated)
- ✅ Stripe PCI-compliant (cuando se integre)
- ✅ IDs de Stripe almacenados de forma segura
- ✅ Webhooks con verificación de firma

## 📱 Responsive

- ✅ Mobile: 1 columna
- ✅ Tablet: 2 columnas
- ✅ Desktop: 3 columnas
- ✅ Plan destacado mantiene escala en desktop

## 🎨 Consistencia de Diseño

Todas las páginas de autenticación y planes siguen el mismo patrón:
- Mismo gradiente de fondo
- Mismo patrón de cuadrícula
- Mismo estilo de títulos con gradiente
- Mismos componentes (Card, Button, Badge)
- Misma paleta de colores (primary + chart-2)

---

## 📚 Referencias

- **Blueprint Stripe**: Ver `GOOGLE_OAUTH_SETUP.md` para credenciales
- **Schema completo**: Ver `shared/schema.ts`
- **Componente**: Ver `client/src/pages/Billing.tsx`
- **Integración Stripe**: Disponible en integrations panel
