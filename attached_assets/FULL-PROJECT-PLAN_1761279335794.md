# 🚀 WhatsApp-GHL SaaS Platform - React Version

## 📋 PROYECTO COMPLETO DETECTADO

Este documento describe el proyecto completo que se va a recrear en React basado en el proyecto original de Node.js.

---

## 🎯 OVERVIEW DEL PROYECTO ORIGINAL

**Nombre:** WhatsApp-GHL Multi-Tenant SaaS Platform v2.0.0
**Backend:** Node.js + Express.js + PostgreSQL + Prisma ORM
**Frontend Original:** HTML + Tailwind CSS + Vanilla JavaScript

### Características Principales:
- ✅ **19 Tablas PostgreSQL** con Prisma ORM
- ✅ **6 Dashboards** diferentes
- ✅ **Sistema de Autenticación** JWT + Google OAuth 2.0
- ✅ **Multi-Tenant** completo
- ✅ **Sistema de Facturación** y Reseller
- ✅ **Panel de Super Admin** con impersonación
- ✅ **Integración Evolution API** (WhatsApp)
- ✅ **Integración GoHighLevel** (CRM)
- ✅ **Sistema de Billing** automático
- ✅ **62 Endpoints API**

---

## 📊 ARQUITECTURA DE BASE DE DATOS (19 TABLAS)

### Tablas Core:
1. **User** - Usuarios/empresas del sistema
2. **GHLConnection** - Conexiones con GoHighLevel OAuth
3. **Location** - Subcuentas/ubicaciones
4. **WhatsAppInstance** - Instancias de WhatsApp
5. **Message** - Mensajes WhatsApp
6. **MessageStats** - Estadísticas de mensajes

### Tablas de Usuarios y Grupos:
7. **InstanceUser** - Usuarios asignados a instancias
8. **WhatsAppGroup** - Grupos de WhatsApp

### Tablas de Sistema:
9. **WebhookLog** - Logs de webhooks
10. **SystemStats** - Estadísticas globales
11. **SystemConfig** - Configuración del sistema
12. **AuditLog** - Logs de auditoría

### Tablas de Facturación:
13. **Billing** - Planes y suscripciones
14. **PricingTier** - Niveles de precios
15. **ResellerConfig** - Configuración de resellers
16. **Invoice** - Facturas
17. **Transaction** - Transacciones
18. **UsageMetrics** - Métricas de uso
19. **SubaccountBilling** - Facturación por subcuenta

---

## 🎨 DASHBOARDS A CREAR

### 1. **Login/Register Page** (`/`)
- Login con email/password
- Login con Google OAuth
- Registro de nuevos usuarios
- Recuperación de contraseña

### 2. **Super Admin Dashboard** (`/superadmin`)
- Vista de todas las empresas
- Gestión de usuarios
- Sistema de impersonación
- Audit logs
- Configuración del sistema
- Estadísticas globales
- Gestión de facturación

### 3. **Agency Dashboard** (`/agency`)
- Vista de locations/subcuentas propias
- Crear/editar/eliminar subcuentas
- Estadísticas de la empresa
- Configuración de cuenta
- Conexión con GoHighLevel

### 4. **Location Dashboard** (`/location/:locationId`)
- **Tab 1: WhatsApp**
  - Instancias de WhatsApp
  - Generar QR codes
  - Gestionar usuarios
  - Sincronizar grupos
- **Tab 2: SMS** (Twilio)
- **Tab 3: Ajustes**
  - Notificaciones
  - Webhooks
  - OpenAI settings

### 5. **Reseller Dashboard** (`/reseller`)
- **Tab 1: Mis Clientes**
  - Lista de subcuentas
  - Estadísticas por cliente
  - Suspender/activar
- **Tab 2: Configuración de Precios**
  - Precio mayorista
  - Precio de reventa
  - Márgenes de ganancia
- **Tab 3: Facturación**
  - Calcular facturación
  - Ver ingresos/gastos
  - Desglose detallado

### 6. **Onboarding** (`/onboarding`)
- Setup inicial después de OAuth
- Configuración de empresa
- Tour del sistema

---

## 🗂️ ESTRUCTURA REACT PROPUESTA

```
src/
├── components/
│   ├── common/              # Componentes compartidos
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Modal.js
│   │   ├── Table.js
│   │   ├── Tabs.js
│   │   ├── Sidebar.js
│   │   └── Header.js
│   │
│   ├── auth/                # Autenticación
│   │   ├── LoginForm.js
│   │   ├── RegisterForm.js
│   │   ├── GoogleOAuthButton.js
│   │   └── ProtectedRoute.js
│   │
│   ├── superadmin/          # Super Admin
│   │   ├── CompanyList.js
│   │   ├── CompanyCard.js
│   │   ├── ImpersonationBanner.js
│   │   ├── AuditLogTable.js
│   │   ├── StatsCards.js
│   │   └── SystemConfig.js
│   │
│   ├── agency/              # Agency Dashboard
│   │   ├── LocationsList.js
│   │   ├── LocationCard.js
│   │   ├── CreateLocationModal.js
│   │   └── GHLConnection.js
│   │
│   ├── location/            # Location Dashboard
│   │   ├── WhatsAppTab.js
│   │   ├── InstanceCard.js
│   │   ├── InstanceModal.js
│   │   ├── UsersTab.js
│   │   ├── GroupsTab.js
│   │   ├── SMSTab.js
│   │   └── SettingsTab.js
│   │
│   └── reseller/            # Reseller Dashboard
│       ├── ClientsList.js
│       ├── PricingConfig.js
│       ├── BillingCalculation.js
│       └── StatsCards.js
│
├── pages/
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── SuperAdminPage.js
│   ├── AgencyPage.js
│   ├── LocationPage.js
│   ├── ResellerPage.js
│   └── OnboardingPage.js
│
├── services/
│   ├── api.js               # Axios instance
│   ├── authService.js       # Login, Register, OAuth
│   ├── superadminService.js # Super admin API calls
│   ├── agencyService.js     # Agency API calls
│   ├── locationService.js   # Location API calls
│   ├── resellerService.js   # Reseller API calls
│   ├── instanceService.js   # WhatsApp instances
│   └── billingService.js    # Billing calculations
│
├── context/
│   ├── AuthContext.js       # Auth state global
│   ├── ImpersonationContext.js
│   └── NotificationContext.js
│
├── hooks/
│   ├── useAuth.js
│   ├── useImpersonation.js
│   ├── useLocations.js
│   └── useInstances.js
│
├── utils/
│   ├── constants.js
│   ├── formatters.js
│   └── validators.js
│
└── styles/
    ├── globals.css
    ├── components.css
    └── dashboards.css
```

---

## 🔧 DEPENDENCIAS A INSTALAR

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.4",
    "axios": "^1.12.2",
    "jwt-decode": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "date-fns": "^2.30.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "qrcode.react": "^3.1.0",
    "react-hot-toast": "^2.4.0"
  }
}
```

---

## 📡 API ENDPOINTS (62 TOTAL)

### Autenticación (6)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/auth/google
GET    /api/auth/google/callback
POST   /api/auth/impersonate
```

### Super Admin (15)
```
GET    /api/superadmin/stats
GET    /api/superadmin/companies
POST   /api/superadmin/users
PUT    /api/superadmin/users/:userId
DELETE /api/superadmin/users/:userId
GET    /api/superadmin/users/:userId
PUT    /api/superadmin/companies/:userId/toggle
PUT    /api/superadmin/companies/:userId/locations/:locationId/toggle
GET    /api/superadmin/companies/:userId/billing
POST   /api/superadmin/companies/:userId/billing
PUT    /api/superadmin/billing/:billingId
GET    /api/superadmin/audit-logs
GET    /api/superadmin/system-config
PUT    /api/superadmin/system-config/:key
GET    /api/superadmin/system-stats
```

### Agency Dashboard (5)
```
GET    /api/dashboard/agency
POST   /api/dashboard/locations/add
PUT    /api/dashboard/locations/:locationId
DELETE /api/dashboard/locations/:locationId
GET    /api/dashboard/locations/:locationId/stats
```

### Location Dashboard (10)
```
GET    /api/dashboard/location/:locationId
GET    /api/dashboard/location/:locationId/settings
PUT    /api/dashboard/location/:locationId/settings
GET    /api/dashboard/location/:locationId/stats
GET    /api/dashboard/location/:locationId/messages
POST   /api/dashboard/location/:locationId/messages/send
GET    /api/dashboard/location/:locationId/contacts
GET    /api/dashboard/location/:locationId/analytics
POST   /api/dashboard/location/:locationId/webhook
GET    /api/dashboard/location/:locationId/audit-log
```

### WhatsApp Instances (8)
```
GET    /api/instances/:locationId
POST   /api/instances/:locationId/add
PUT    /api/instances/:locationId/:number
DELETE /api/instances/:locationId/:number/delete
POST   /api/instances/:locationId/:number/qr
POST   /api/instances/:locationId/:number/logout
GET    /api/instances/:locationId/:number/status
POST   /api/instances/:locationId/:number/phone
```

### Instance Users (4)
```
GET    /api/dashboard/instance/:instanceId/users
POST   /api/dashboard/instance/:instanceId/users
PUT    /api/dashboard/instance/:instanceId/users/:email
DELETE /api/dashboard/instance/:instanceId/users/:email
```

### WhatsApp Groups (3)
```
POST   /api/dashboard/instance/:instanceId/groups/sync
GET    /api/dashboard/instance/:instanceId/groups
PUT    /api/dashboard/instance/:instanceId/groups/:id/toggle
```

### Reseller/Billing (8)
```
GET    /api/reseller/config
PUT    /api/reseller/config
GET    /api/reseller/clients
GET    /api/reseller/clients/:locationId
POST   /api/reseller/clients/:locationId/toggle
PUT    /api/reseller/clients/:locationId/config
GET    /api/reseller/billing/calculate
GET    /api/reseller/dashboard/stats
```

### Webhooks (3)
```
POST   /api/webhook/evolution
POST   /api/webhook/ghl
POST   /api/webhook/custom/:locationId
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### JWT
- Token válido por 30 días
- Almacenado en `localStorage` como `token`
- Incluye: `userId`, `email`, `is_admin`

### Google OAuth
- Passport.js + Google Strategy
- Auto-creación de usuarios verificados
- Flujo completo de callback

### Impersonación
- Solo para super admins
- Token original guardado como `admin_token`
- Flag `impersonating: true`
- Banner amarillo en UI
- Botón "Volver al Panel Admin"

---

## 🎨 DISEÑO Y UX

### Colores
- **Primary:** `#667eea` (Purple)
- **Secondary:** `#764ba2` (Dark Purple)
- **Success:** `#25d366` (WhatsApp Green)
- **Warning:** `#ffc107` (Yellow)
- **Danger:** `#dc3545` (Red)

### Componentes Base
- Tailwind CSS para estilos
- Componentes reutilizables
- Sistema de diseño consistente
- Responsive design
- Dark mode ready

---

## 📝 PLAN DE IMPLEMENTACIÓN

### Fase 1: Setup Base (AHORA)
- [x] Leer proyecto original completo
- [ ] Instalar dependencias necesarias
- [ ] Crear estructura de carpetas
- [ ] Configurar React Router
- [ ] Configurar Axios y API base

### Fase 2: Autenticación
- [ ] Context de autenticación
- [ ] Login/Register pages
- [ ] Google OAuth button
- [ ] Protected routes
- [ ] Impersonation system

### Fase 3: Dashboards Core
- [ ] Super Admin Dashboard
- [ ] Agency Dashboard
- [ ] Location Dashboard (tab principal)

### Fase 4: Features Avanzados
- [ ] Reseller Dashboard
- [ ] Sistema de facturación
- [ ] Gestión de grupos
- [ ] Usuarios por instancia

### Fase 5: Integraciones
- [ ] Evolution API (QR codes)
- [ ] GoHighLevel OAuth
- [ ] Webhooks
- [ ] Charts y analytics

### Fase 6: Polish y Optimización
- [ ] Error handling
- [ ] Loading states
- [ ] Notificaciones
- [ ] Documentación completa

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. ✅ Leer documentación completa
2. ⏳ Instalar dependencias adicionales
3. ⏳ Crear estructura de carpetas
4. ⏳ Crear servicios API
5. ⏳ Crear Context de autenticación
6. ⏳ Crear páginas base
7. ⏳ Implementar routing
8. ⏳ Crear componentes comunes

---

**Este documento será la guía completa para recrear la plataforma SaaS en React**
