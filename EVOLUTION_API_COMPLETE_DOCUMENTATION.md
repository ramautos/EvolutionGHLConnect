# EVOLUTION API - COMPREHENSIVE DOCUMENTATION

**Repository:** https://github.com/EvolutionAPI/evolution-api
**Version:** 2.3.6 (Latest Release: October 21, 2025)
**License:** Apache License 2.0 with Additional Conditions
**Official Documentation:** https://doc.evolution-api.com
**Postman Collection:** https://evolution-api.com/postman
**Discord Community:** https://evolution-api.com/discord

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Repository Statistics](#repository-statistics)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Installation & Setup](#installation--setup)
6. [Environment Configuration](#environment-configuration)
7. [API Endpoints](#api-endpoints)
8. [Integrations](#integrations)
9. [Features](#features)
10. [Database Schema](#database-schema)
11. [Docker Configuration](#docker-configuration)
12. [Code Structure](#code-structure)
13. [Security](#security)
14. [Examples](#examples)

---

## PROJECT OVERVIEW

### Description
Evolution API is an open-source, production-ready REST API for WhatsApp communication that supports multiple messaging services and integrations. Originally based on CodeChat and the Baileys library, it has evolved into a comprehensive multi-tenant platform supporting various WhatsApp providers and extensive integrations.

### Purpose
Built to empower small businesses, entrepreneurs, freelancers, and individuals with limited resources by providing free WhatsApp messaging functionality via API.

### Main Features
- **Multi-tenant SaaS Architecture** - Complete instance isolation with per-tenant authentication
- **Multiple WhatsApp Providers** - Baileys (WhatsApp Web), Meta Business API, Evolution API
- **Extensive Integrations** - Typebot, Chatwoot, OpenAI, Dify, RabbitMQ, Kafka, Amazon SQS, and more
- **Event-Driven Architecture** - Real-time event streaming via WebSocket, RabbitMQ, SQS, NATS, Pusher
- **Media Storage** - AWS S3 and MinIO support
- **Multi-Database Support** - PostgreSQL and MySQL via Prisma ORM
- **Audio Conversion** - Support for audio transcription via OpenAI Whisper

---

## REPOSITORY STATISTICS

- **Stars:** 6,000
- **Forks:** 4,700
- **Contributors:** 143
- **Commits:** 2,518
- **Releases:** 51
- **Primary Language:** TypeScript (98.7%)
- **Default Branch:** main

### Latest Release: v2.3.6 (October 21, 2025)
**Key Updates:**
- Fixed cache for PN, LID and g.us numbers
- Fixed audio and document sending via Chatwoot in Baileys channel
- Multiple Chatwoot integration fixes
- Fixed buffer storage in database
- Updated Baileys dependency to 7.0.0-rc.6

---

## TECHNOLOGY STACK

### Core Technologies
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5+
- **Framework:** Express.js
- **ORM:** Prisma (PostgreSQL & MySQL)
- **Caching:** Redis + Node-cache (fallback)
- **Build Tool:** tsup
- **Package Manager:** npm

### Key Dependencies
```json
{
  "baileys": "7.0.0-rc.6",
  "express": "^4.21.2",
  "@prisma/client": "^6.16.2",
  "axios": "^1.7.9",
  "redis": "^4.7.0",
  "openai": "^4.77.3",
  "socket.io": "^4.8.1",
  "kafkajs": "^2.2.4",
  "amqplib": "^0.10.5",
  "@aws-sdk/client-sqs": "^3.891.0",
  "minio": "^8.0.3",
  "qrcode": "^1.5.4",
  "sharp": "^0.34.2",
  "ffmpeg-installer": "^1.1.0"
}
```

### Development Tools
- **Linting:** ESLint + Prettier
- **Commits:** Commitizen + Commitlint (Conventional Commits)
- **Hooks:** Husky
- **Testing:** tsx watch mode
- **Error Tracking:** Sentry
- **Telemetry:** Custom analytics (non-sensitive data)

---

## ARCHITECTURE

### Multi-Tenant Architecture
- **Instance Isolation:** Each WhatsApp connection is a separate "instance" with unique name
- **Database-Level Isolation:** All queries scoped by `instanceId` or `instanceName`
- **Authentication:** API key-based (global or per-instance)
- **Resource Management:** Independent webhook, event, and integration settings per instance

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Requests                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Routes (RouterBroker)                  │
│         - Input validation (JSONSchema7)            │
│         - Authentication guards                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Controllers (Thin Layer)                  │
│         - Route handler orchestration               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Services (Business Logic)              │
│         - WhatsApp operations                       │
│         - Message processing                        │
│         - Integration management                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│          Repository (Data Access Layer)             │
│         - Prisma ORM operations                     │
│         - Database transactions                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Database (PostgreSQL/MySQL)            │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
evolution-api/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── api/
│   │   ├── controllers/           # HTTP route handlers (thin layer)
│   │   │   ├── instance.controller.ts
│   │   │   ├── sendMessage.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── business.controller.ts
│   │   │   ├── template.controller.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── proxy.controller.ts
│   │   │   ├── label.controller.ts
│   │   │   └── call.controller.ts
│   │   │
│   │   ├── services/              # Business logic
│   │   │   ├── monitor.service.ts
│   │   │   ├── channel.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── proxy.service.ts
│   │   │   └── template.service.ts
│   │   │
│   │   ├── routes/                # Express route definitions
│   │   │   ├── index.router.ts
│   │   │   ├── instance.router.ts
│   │   │   ├── sendMessage.router.ts
│   │   │   ├── chat.router.ts
│   │   │   ├── group.router.ts
│   │   │   ├── business.router.ts
│   │   │   ├── template.router.ts
│   │   │   ├── settings.router.ts
│   │   │   ├── proxy.router.ts
│   │   │   ├── label.router.ts
│   │   │   ├── call.router.ts
│   │   │   └── view.router.ts
│   │   │
│   │   ├── integrations/          # External service integrations
│   │   │   ├── channel/           # WhatsApp providers
│   │   │   │   ├── whatsapp/      # Baileys integration
│   │   │   │   │   └── baileys.router.ts
│   │   │   │   ├── meta/          # WhatsApp Business API
│   │   │   │   │   └── meta.router.ts
│   │   │   │   ├── evolution/     # Evolution API channel
│   │   │   │   │   └── evolution.router.ts
│   │   │   │   └── channel.router.ts
│   │   │   │
│   │   │   ├── chatbot/           # AI/Bot integrations
│   │   │   │   ├── chatwoot/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── dto/
│   │   │   │   │   ├── validate/
│   │   │   │   │   ├── utils/
│   │   │   │   │   └── libs/
│   │   │   │   ├── typebot/       # Visual chatbot builder
│   │   │   │   ├── openai/        # GPT & Whisper integration
│   │   │   │   ├── dify/          # AI agent workflow
│   │   │   │   ├── evolutionBot/  # Native chatbot
│   │   │   │   ├── flowise/       # LangChain builder
│   │   │   │   ├── n8n/           # Workflow automation
│   │   │   │   ├── evoai/         # Custom AI integration
│   │   │   │   └── chatbot.router.ts
│   │   │   │
│   │   │   ├── event/             # Event systems
│   │   │   │   ├── webhook/
│   │   │   │   ├── websocket/
│   │   │   │   ├── rabbitmq/
│   │   │   │   ├── kafka/
│   │   │   │   ├── sqs/
│   │   │   │   ├── nats/
│   │   │   │   ├── pusher/
│   │   │   │   └── event.router.ts
│   │   │   │
│   │   │   └── storage/           # File storage
│   │   │       ├── s3/
│   │   │       └── storage.router.ts
│   │   │
│   │   ├── dto/                   # Data Transfer Objects
│   │   │   ├── instance.dto.ts
│   │   │   ├── sendMessage.dto.ts
│   │   │   ├── chat.dto.ts
│   │   │   ├── group.dto.ts
│   │   │   ├── business.dto.ts
│   │   │   ├── template.dto.ts
│   │   │   ├── settings.dto.ts
│   │   │   ├── proxy.dto.ts
│   │   │   ├── label.dto.ts
│   │   │   ├── call.dto.ts
│   │   │   └── chatbot.dto.ts
│   │   │
│   │   ├── guards/                # Auth/Authorization middleware
│   │   ├── repository/            # Data access layer (Prisma)
│   │   ├── abstract/              # Base classes
│   │   ├── provider/              # Session providers
│   │   └── types/                 # TypeScript types
│   │
│   ├── config/                    # Configuration
│   │   ├── env.config.ts
│   │   ├── logger.config.ts
│   │   ├── error.config.ts
│   │   ├── event.config.ts
│   │   └── path.config.ts
│   │
│   ├── cache/                     # Caching implementations
│   │   ├── cacheengine.ts
│   │   ├── rediscache.ts
│   │   ├── rediscache.client.ts
│   │   └── localcache.ts
│   │
│   ├── validate/                  # JSONSchema7 validation
│   │   ├── validate.schema.ts
│   │   ├── instance.schema.ts
│   │   ├── message.schema.ts
│   │   ├── chat.schema.ts
│   │   ├── group.schema.ts
│   │   ├── business.schema.ts
│   │   ├── template.schema.ts
│   │   ├── settings.schema.ts
│   │   ├── proxy.schema.ts
│   │   └── label.schema.ts
│   │
│   ├── utils/                     # Shared utilities
│   │   ├── onWhatsappCache.ts
│   │   ├── createJid.ts
│   │   ├── errorResponse.ts
│   │   ├── sendTelemetry.ts
│   │   ├── instrumentSentry.ts
│   │   ├── makeProxyAgent.ts
│   │   ├── i18n.ts
│   │   └── server-up.ts
│   │
│   └── exceptions/                # HTTP exceptions
│       ├── 400.exception.ts
│       ├── 401.exception.ts
│       ├── 403.exception.ts
│       ├── 404.exception.ts
│       └── 500.exception.ts
│
├── prisma/                        # Database schemas & migrations
│   ├── postgresql-schema.prisma
│   ├── mysql-schema.prisma
│   ├── postgresql-migrations/
│   └── mysql-migrations/
│
├── Docker/                        # Docker configurations
│   ├── kafka/
│   ├── minio/
│   ├── mysql/
│   ├── postgres/
│   ├── rabbitmq/
│   ├── redis/
│   ├── scripts/
│   └── swarm/
│
├── public/                        # Static assets
├── manager/                       # Evolution Manager v2 (frontend)
├── .env.example                   # Environment template
├── docker-compose.yaml            # Production stack
├── docker-compose.dev.yaml        # Development stack
├── Dockerfile                     # Main Docker image
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config
```

---

## INSTALLATION & SETUP

### Prerequisites
- Node.js 20+ (LTS recommended)
- PostgreSQL 15+ OR MySQL 8+
- Redis 7+ (optional but recommended)
- Docker & Docker Compose (for containerized deployment)

### Installation Methods

#### 1. Docker Installation (Recommended)

**Quick Start:**
```bash
# Clone repository
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Copy environment file
cp .env.example .env

# Edit .env file and set your AUTHENTICATION_API_KEY
nano .env

# Start services
docker-compose up -d
```

**Access Points:**
- API: `http://localhost:8080`
- Manager UI: `http://localhost:3000`
- Swagger Docs: `http://localhost:8080/docs`

**Docker Compose Stack Includes:**
- Evolution API (main application)
- Evolution Manager (web interface)
- PostgreSQL (database)
- Redis (cache)

#### 2. Manual Installation

```bash
# Clone repository
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Install dependencies
npm ci

# Set database provider
export DATABASE_PROVIDER=postgresql  # or mysql

# Copy and configure environment
cp .env.example .env
nano .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:deploy

# Build application
npm run build

# Start production server
npm run start:prod
```

#### 3. Development Setup

```bash
# Install dependencies
npm install

# Set database provider
export DATABASE_PROVIDER=postgresql

# Configure environment
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Start development server with hot reload
npm run dev:server
```

### Database Setup

**PostgreSQL:**
```bash
# Create database
createdb evolution_api

# Set connection string in .env
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://user:password@localhost:5432/evolution_api?schema=evolution_api
```

**MySQL:**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE evolution_api;"

# Set connection string in .env
DATABASE_PROVIDER=mysql
DATABASE_CONNECTION_URI=mysql://user:password@localhost:3306/evolution_api
```

### Redis Setup (Optional but Recommended)

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:latest

# Configure in .env
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://localhost:6379
```

---

## ENVIRONMENT CONFIGURATION

### Complete Environment Variables

```bash
# ===========================================
# SERVER
# ===========================================
SERVER_NAME=evolution
SERVER_TYPE=http                    # http or https
SERVER_PORT=8080
SERVER_URL=http://localhost:8080
SERVER_DISABLE_DOCS=false           # Disable /docs endpoint
SERVER_DISABLE_MANAGER=false        # Disable /manager endpoint

# SSL Configuration (for HTTPS)
SSL_CONF_PRIVKEY=/path/to/privkey.pem
SSL_CONF_FULLCHAIN=/path/to/fullchain.pem

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=*                       # * or comma-separated domains
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

# ===========================================
# DATABASE
# ===========================================
DATABASE_PROVIDER=postgresql        # postgresql or mysql
DATABASE_CONNECTION_URI=postgresql://user:pass@localhost:5432/evolution_db?schema=evolution_api
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange

# Data Saving Options
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_DATA_HISTORIC=true
DATABASE_SAVE_IS_ON_WHATSAPP=true
DATABASE_SAVE_IS_ON_WHATSAPP_DAYS=7
DATABASE_DELETE_MESSAGE=false      # Physical deletion vs logical

# ===========================================
# REDIS CACHE
# ===========================================
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://localhost:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_TTL=604800              # 7 days in seconds
CACHE_REDIS_SAVE_INSTANCES=false

# Local Cache (Fallback)
CACHE_LOCAL_ENABLED=false

# ===========================================
# AUTHENTICATION
# ===========================================
AUTHENTICATION_API_KEY=your_secure_api_key_here
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS,WEBSOCKET
LOG_COLOR=true
LOG_BAILEYS=error                   # fatal|error|warn|info|debug|trace

# ===========================================
# INSTANCE MANAGEMENT
# ===========================================
DEL_INSTANCE=false                  # Auto-delete disconnected instances
EVENT_EMITTER_MAX_LISTENERS=50

# ===========================================
# LANGUAGE
# ===========================================
LANGUAGE=en                         # en, pt-BR, es, fr

# ===========================================
# PROXY
# ===========================================
PROXY_HOST=
PROXY_PORT=
PROXY_PROTOCOL=http                 # http or https or socks
PROXY_USERNAME=
PROXY_PASSWORD=

# ===========================================
# WEBHOOK - GLOBAL
# ===========================================
WEBHOOK_GLOBAL_ENABLED=false
WEBHOOK_GLOBAL_URL=https://your-webhook-url.com
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false

# Webhook Events (enable specific events)
WEBHOOK_EVENTS_APPLICATION_STARTUP=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_SET=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_EDITED=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_MESSAGES_DELETE=true
WEBHOOK_EVENTS_SEND_MESSAGE=true
WEBHOOK_EVENTS_SEND_MESSAGE_UPDATE=true
WEBHOOK_EVENTS_CONTACTS_SET=true
WEBHOOK_EVENTS_CONTACTS_UPSERT=true
WEBHOOK_EVENTS_CONTACTS_UPDATE=true
WEBHOOK_EVENTS_PRESENCE_UPDATE=true
WEBHOOK_EVENTS_CHATS_SET=true
WEBHOOK_EVENTS_CHATS_UPSERT=true
WEBHOOK_EVENTS_CHATS_UPDATE=true
WEBHOOK_EVENTS_CHATS_DELETE=true
WEBHOOK_EVENTS_GROUPS_UPSERT=true
WEBHOOK_EVENTS_GROUPS_UPDATE=true
WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_LABELS_EDIT=true
WEBHOOK_EVENTS_LABELS_ASSOCIATION=true
WEBHOOK_EVENTS_CALL=true
WEBHOOK_EVENTS_TYPEBOT_START=false
WEBHOOK_EVENTS_TYPEBOT_CHANGE_STATUS=false
WEBHOOK_EVENTS_ERRORS=false
WEBHOOK_EVENTS_ERRORS_WEBHOOK=

# Webhook Retry Configuration
WEBHOOK_REQUEST_TIMEOUT_MS=60000
WEBHOOK_RETRY_MAX_ATTEMPTS=10
WEBHOOK_RETRY_INITIAL_DELAY_SECONDS=5
WEBHOOK_RETRY_USE_EXPONENTIAL_BACKOFF=true
WEBHOOK_RETRY_MAX_DELAY_SECONDS=300
WEBHOOK_RETRY_JITTER_FACTOR=0.2
WEBHOOK_RETRY_NON_RETRYABLE_STATUS_CODES=400,401,403,404,422

# ===========================================
# WEBSOCKET
# ===========================================
WEBSOCKET_ENABLED=false
WEBSOCKET_GLOBAL_EVENTS=false
WEBSOCKET_ALLOWED_HOSTS=127.0.0.1,::1,::ffff:127.0.0.1

# ===========================================
# RABBITMQ
# ===========================================
RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://localhost
RABBITMQ_EXCHANGE_NAME=evolution
RABBITMQ_FRAME_MAX=8192
RABBITMQ_GLOBAL_ENABLED=false
RABBITMQ_PREFIX_KEY=evolution

# RabbitMQ Events
RABBITMQ_EVENTS_APPLICATION_STARTUP=false
RABBITMQ_EVENTS_INSTANCE_CREATE=false
RABBITMQ_EVENTS_INSTANCE_DELETE=false
RABBITMQ_EVENTS_QRCODE_UPDATED=false
RABBITMQ_EVENTS_MESSAGES_SET=false
RABBITMQ_EVENTS_MESSAGES_UPSERT=false
RABBITMQ_EVENTS_MESSAGES_EDITED=false
RABBITMQ_EVENTS_MESSAGES_UPDATE=false
RABBITMQ_EVENTS_MESSAGES_DELETE=false
RABBITMQ_EVENTS_SEND_MESSAGE=false
RABBITMQ_EVENTS_CONTACTS_SET=false
RABBITMQ_EVENTS_CONTACTS_UPSERT=false
RABBITMQ_EVENTS_CONTACTS_UPDATE=false
RABBITMQ_EVENTS_PRESENCE_UPDATE=false
RABBITMQ_EVENTS_CHATS_SET=false
RABBITMQ_EVENTS_CHATS_UPSERT=false
RABBITMQ_EVENTS_CHATS_UPDATE=false
RABBITMQ_EVENTS_CHATS_DELETE=false
RABBITMQ_EVENTS_GROUPS_UPSERT=false
RABBITMQ_EVENTS_GROUP_UPDATE=false
RABBITMQ_EVENTS_GROUP_PARTICIPANTS_UPDATE=false
RABBITMQ_EVENTS_CONNECTION_UPDATE=false
RABBITMQ_EVENTS_CALL=false
RABBITMQ_EVENTS_TYPEBOT_START=false
RABBITMQ_EVENTS_TYPEBOT_CHANGE_STATUS=false

# ===========================================
# KAFKA
# ===========================================
KAFKA_ENABLED=false
KAFKA_CLIENT_ID=evolution-api
KAFKA_BROKERS=localhost:9092
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_GLOBAL_ENABLED=false
KAFKA_CONSUMER_GROUP_ID=evolution-api-consumers
KAFKA_TOPIC_PREFIX=evolution
KAFKA_NUM_PARTITIONS=1
KAFKA_REPLICATION_FACTOR=1
KAFKA_AUTO_CREATE_TOPICS=false

# Kafka SASL Authentication (Optional)
KAFKA_SASL_ENABLED=false
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=

# Kafka SSL Configuration (Optional)
KAFKA_SSL_ENABLED=false
KAFKA_SSL_REJECT_UNAUTHORIZED=true
KAFKA_SSL_CA=
KAFKA_SSL_KEY=
KAFKA_SSL_CERT=

# Kafka Events
KAFKA_EVENTS_APPLICATION_STARTUP=false
KAFKA_EVENTS_INSTANCE_CREATE=false
KAFKA_EVENTS_INSTANCE_DELETE=false
KAFKA_EVENTS_QRCODE_UPDATED=false
KAFKA_EVENTS_MESSAGES_SET=false
KAFKA_EVENTS_MESSAGES_UPSERT=false
# ... (similar to RabbitMQ events)

# ===========================================
# AMAZON SQS
# ===========================================
SQS_ENABLED=false
SQS_ACCESS_KEY_ID=
SQS_SECRET_ACCESS_KEY=
SQS_ACCOUNT_ID=
SQS_REGION=us-east-1
SQS_GLOBAL_ENABLED=false
SQS_GLOBAL_FORCE_SINGLE_QUEUE=false

# ===========================================
# PUSHER
# ===========================================
PUSHER_ENABLED=false
PUSHER_GLOBAL_ENABLED=false
PUSHER_GLOBAL_APP_ID=
PUSHER_GLOBAL_KEY=
PUSHER_GLOBAL_SECRET=
PUSHER_GLOBAL_CLUSTER=
PUSHER_GLOBAL_USE_TLS=true

# ===========================================
# WHATSAPP BUSINESS API
# ===========================================
WA_BUSINESS_TOKEN_WEBHOOK=evolution
WA_BUSINESS_URL=https://graph.facebook.com
WA_BUSINESS_VERSION=v20.0
WA_BUSINESS_LANGUAGE=en_US

# ===========================================
# SESSION CONFIGURATION
# ===========================================
CONFIG_SESSION_PHONE_CLIENT=Evolution API
CONFIG_SESSION_PHONE_NAME=Chrome    # Chrome|Firefox|Edge|Opera|Safari

# ===========================================
# QR CODE
# ===========================================
QRCODE_LIMIT=30                     # Max QR code generation attempts
QRCODE_COLOR=#175197                # QR code color in hex

# ===========================================
# TYPEBOT INTEGRATION
# ===========================================
TYPEBOT_ENABLED=false
TYPEBOT_API_VERSION=latest          # old or latest

# ===========================================
# CHATWOOT INTEGRATION
# ===========================================
CHATWOOT_ENABLED=false
CHATWOOT_MESSAGE_READ=true
CHATWOOT_MESSAGE_DELETE=true
CHATWOOT_BOT_CONTACT=true
CHATWOOT_IMPORT_DATABASE_CONNECTION_URI=postgresql://user:pass@host:5432/chatwoot?sslmode=disable
CHATWOOT_IMPORT_PLACEHOLDER_MEDIA_MESSAGE=true

# ===========================================
# OPENAI INTEGRATION
# ===========================================
OPENAI_ENABLED=false

# ===========================================
# DIFY INTEGRATION
# ===========================================
DIFY_ENABLED=false

# ===========================================
# N8N INTEGRATION
# ===========================================
N8N_ENABLED=false

# ===========================================
# EVOAI INTEGRATION
# ===========================================
EVOAI_ENABLED=false

# ===========================================
# S3 / MINIO STORAGE
# ===========================================
S3_ENABLED=false
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=evolution
S3_PORT=443
S3_ENDPOINT=s3.domain.com
S3_REGION=eu-west-3
S3_USE_SSL=true

# ===========================================
# AUDIO CONVERTER
# ===========================================
API_AUDIO_CONVERTER=http://localhost:4040/process-audio
API_AUDIO_CONVERTER_KEY=

# ===========================================
# PROMETHEUS METRICS
# ===========================================
PROMETHEUS_METRICS=false
METRICS_AUTH_REQUIRED=true
METRICS_USER=prometheus
METRICS_PASSWORD=secure_password
METRICS_ALLOWED_IPS=127.0.0.1,10.0.0.100

# ===========================================
# TELEMETRY
# ===========================================
TELEMETRY_ENABLED=true
TELEMETRY_URL=

# ===========================================
# SENTRY ERROR TRACKING
# ===========================================
SENTRY_DSN=
```

---

## API ENDPOINTS

### Base URL
```
http://localhost:8080
```

### Authentication
All API requests require authentication via `apikey` header:
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### Endpoint Categories

#### 1. INSTANCE MANAGEMENT

**POST** `/instance/create`
- Create new WhatsApp instance
- Request body:
```json
{
  "instanceName": "my_instance",
  "token": "optional_custom_token",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}
```

**GET** `/instance/connect/:instanceName`
- Connect instance to WhatsApp
- Returns QR code for scanning

**GET** `/instance/connectionState/:instanceName`
- Get connection status of instance
- Returns: `open`, `close`, or `connecting`

**GET** `/instance/fetchInstances`
- Fetch all instances
- Optional query param: `instanceName`

**POST** `/instance/restart/:instanceName`
- Restart WhatsApp instance

**POST** `/instance/setPresence/:instanceName`
- Set presence status
- Body: `{ "presence": "available" | "unavailable" | "composing" | "recording" }`

**DELETE** `/instance/logout/:instanceName`
- Logout from WhatsApp (keeps instance)

**DELETE** `/instance/delete/:instanceName`
- Delete instance completely

---

#### 2. MESSAGE SENDING

**POST** `/message/sendText/:instanceName`
```json
{
  "number": "5511999999999",
  "text": "Hello from Evolution API!",
  "delay": 1000,
  "linkPreview": true,
  "quoted": {
    "key": {
      "id": "message_id",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    }
  },
  "mentioned": ["5511888888888"],
  "everyOne": false
}
```

**POST** `/message/sendMedia/:instanceName`
- Send image, video, audio, or document
- Supports: base64, URL, or file upload (multipart/form-data)
```json
{
  "number": "5511999999999",
  "mediatype": "image",
  "media": "https://example.com/image.jpg",
  "caption": "Check this out!",
  "fileName": "photo.jpg",
  "mimetype": "image/jpeg"
}
```

**POST** `/message/sendWhatsAppAudio/:instanceName`
- Send voice message (PTT)
```json
{
  "number": "5511999999999",
  "audio": "base64_audio_data_or_url"
}
```

**POST** `/message/sendPtv/:instanceName`
- Send PTV (round video message)
```json
{
  "number": "5511999999999",
  "video": "base64_video_or_url"
}
```

**POST** `/message/sendLocation/:instanceName`
```json
{
  "number": "5511999999999",
  "latitude": -23.5505199,
  "longitude": -46.6333094,
  "name": "São Paulo",
  "address": "São Paulo, Brazil"
}
```

**POST** `/message/sendContact/:instanceName`
```json
{
  "number": "5511999999999",
  "contact": [
    {
      "fullName": "John Doe",
      "phoneNumber": "5511888888888",
      "wuid": "5511888888888",
      "organization": "Company Name",
      "email": "john@example.com",
      "url": "https://example.com"
    }
  ]
}
```

**POST** `/message/sendReaction/:instanceName`
```json
{
  "key": {
    "id": "message_id",
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": false
  },
  "reaction": "👍"
}
```

**POST** `/message/sendPoll/:instanceName`
```json
{
  "number": "5511999999999",
  "name": "What's your favorite color?",
  "selectableCount": 1,
  "values": ["Red", "Blue", "Green", "Yellow"]
}
```

**POST** `/message/sendList/:instanceName`
```json
{
  "number": "5511999999999",
  "title": "Menu",
  "description": "Choose an option",
  "footerText": "Powered by Evolution API",
  "buttonText": "View Options",
  "sections": [
    {
      "title": "Main Menu",
      "rows": [
        {
          "title": "Option 1",
          "description": "First option",
          "rowId": "opt1"
        },
        {
          "title": "Option 2",
          "description": "Second option",
          "rowId": "opt2"
        }
      ]
    }
  ]
}
```

**POST** `/message/sendButtons/:instanceName`
```json
{
  "number": "5511999999999",
  "title": "Select Payment Method",
  "description": "Choose how you want to pay",
  "footer": "Evolution API",
  "buttons": [
    {
      "type": "reply",
      "displayText": "Credit Card",
      "id": "credit"
    },
    {
      "type": "reply",
      "displayText": "PIX",
      "id": "pix"
    },
    {
      "type": "url",
      "displayText": "Visit Website",
      "url": "https://evolution-api.com"
    }
  ]
}
```

**POST** `/message/sendSticker/:instanceName`
- Send sticker (converts image to WebP)
```json
{
  "number": "5511999999999",
  "sticker": "base64_image_or_url"
}
```

**POST** `/message/sendStatus/:instanceName`
- Send WhatsApp Status (Story)
```json
{
  "type": "text",
  "content": "Hello from Evolution API!",
  "backgroundColor": "#0000FF",
  "font": 1,
  "statusJidList": ["5511999999999@s.whatsapp.net"],
  "allContacts": false
}
```

**POST** `/message/sendTemplate/:instanceName`
- Send WhatsApp Business template (Meta API)
```json
{
  "number": "5511999999999",
  "name": "template_name",
  "language": "en_US",
  "components": [],
  "webhookUrl": "https://your-webhook.com/template-status"
}
```

---

#### 3. CHAT OPERATIONS

**POST** `/chat/whatsappNumbers/:instanceName`
- Check if numbers are on WhatsApp
```json
{
  "numbers": ["5511999999999", "5511888888888"]
}
```
Response:
```json
[
  {
    "jid": "5511999999999@s.whatsapp.net",
    "exists": true,
    "lid": "lid_number_if_available"
  }
]
```

**POST** `/chat/markMessageAsRead/:instanceName`
```json
{
  "readMessages": [
    {
      "id": "message_id",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    }
  ]
}
```

**POST** `/chat/archiveChat/:instanceName`
```json
{
  "archive": true,
  "lastMessage": {
    "key": {
      "id": "message_id",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": true
    }
  }
}
```

**POST** `/chat/markChatUnread/:instanceName`
```json
{
  "lastMessage": {
    "key": {
      "id": "message_id",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    }
  }
}
```

**DELETE** `/chat/deleteMessageForEveryone/:instanceName`
```json
{
  "id": "message_id",
  "remoteJid": "5511999999999@s.whatsapp.net",
  "fromMe": true
}
```

**POST** `/chat/fetchProfilePictureUrl/:instanceName`
```json
{
  "number": "5511999999999"
}
```

**POST** `/chat/getBase64FromMediaMessage/:instanceName`
- Download and convert media to base64
```json
{
  "message": {
    "key": {
      "id": "message_id",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    }
  },
  "convertToMp4": true
}
```

**POST** `/chat/updateMessage/:instanceName`
- Edit sent message
```json
{
  "number": "5511999999999",
  "text": "Updated message text",
  "key": {
    "id": "message_id",
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true
  }
}
```

**POST** `/chat/sendPresence/:instanceName`
```json
{
  "number": "5511999999999",
  "delay": 1000,
  "presence": "composing"
}
```

**POST** `/chat/updateBlockStatus/:instanceName`
```json
{
  "number": "5511999999999",
  "status": "block"
}
```

**POST** `/chat/findContacts/:instanceName`
- Search contacts in database
```json
{
  "where": {
    "remoteJid": {
      "contains": "5511"
    }
  }
}
```

**POST** `/chat/findMessages/:instanceName`
- Search messages in database
```json
{
  "where": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    }
  },
  "limit": 50
}
```

**POST** `/chat/findChats/:instanceName`
- Search chats in database
```json
{
  "where": {
    "remoteJid": {
      "contains": "5511"
    }
  }
}
```

**GET** `/chat/findChatByRemoteJid/:instanceName?remoteJid=5511999999999@s.whatsapp.net`
- Get specific chat by remote JID

**POST** `/chat/fetchProfile/:instanceName`
```json
{
  "number": "5511999999999"
}
```

**POST** `/chat/fetchBusinessProfile/:instanceName`
```json
{
  "number": "5511999999999"
}
```

**POST** `/chat/updateProfileName/:instanceName`
```json
{
  "name": "My New Name"
}
```

**POST** `/chat/updateProfileStatus/:instanceName`
```json
{
  "status": "Available for chat!"
}
```

**POST** `/chat/updateProfilePicture/:instanceName`
```json
{
  "picture": "base64_image_data"
}
```

**DELETE** `/chat/removeProfilePicture/:instanceName`
- Remove profile picture

**GET** `/chat/fetchPrivacySettings/:instanceName`
- Get privacy settings

**POST** `/chat/updatePrivacySettings/:instanceName`
```json
{
  "privacySettings": {
    "readReceipts": "all",
    "profile": "contacts",
    "status": "contacts",
    "online": "all",
    "last": "contacts_except",
    "groupAdd": "contacts"
  }
}
```

---

#### 4. GROUP MANAGEMENT

**POST** `/group/create/:instanceName`
```json
{
  "subject": "My Group",
  "description": "Group description",
  "participants": ["5511999999999", "5511888888888"],
  "profilePicture": "base64_image_or_url"
}
```

**POST** `/group/updateGroupSubject/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us",
  "subject": "New Group Name"
}
```

**POST** `/group/updateGroupPicture/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us",
  "image": "base64_image_or_url"
}
```

**POST** `/group/updateGroupDescription/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us",
  "description": "New group description"
}
```

**GET** `/group/findGroupInfos/:instanceName?groupJid=120363XXXXX@g.us`
- Get group metadata

**GET** `/group/fetchAllGroups/:instanceName?getParticipants=true`
- Fetch all groups (optionally with participants)

**GET** `/group/participants/:instanceName?groupJid=120363XXXXX@g.us`
- Get group participants

**GET** `/group/inviteCode/:instanceName?groupJid=120363XXXXX@g.us`
- Get group invite link

**GET** `/group/inviteInfo/:instanceName?inviteCode=XXXXXXXXXXXXX`
- Get invite code info

**GET** `/group/acceptInviteCode/:instanceName?inviteCode=XXXXXXXXXXXXX`
- Join group via invite code

**POST** `/group/sendInvite/:instanceName`
- Send group invite to contact
```json
{
  "groupJid": "120363XXXXX@g.us",
  "numbers": ["5511999999999"],
  "description": "Join our group!"
}
```

**POST** `/group/revokeInviteCode/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us"
}
```

**POST** `/group/updateParticipant/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us",
  "action": "add",
  "participants": ["5511999999999", "5511888888888"]
}
```
Actions: `add`, `remove`, `promote`, `demote`

**POST** `/group/updateSetting/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us",
  "action": "announcement"
}
```
Actions: `announcement`, `not_announcement`, `locked`, `unlocked`

**POST** `/group/toggleEphemeral/:instanceName`
```json
{
  "groupJid": "120363XXXXX@g.us",
  "expiration": 86400
}
```
Expiration: `0` (off), `86400` (24h), `604800` (7d), `7776000` (90d)

**DELETE** `/group/leaveGroup/:instanceName?groupJid=120363XXXXX@g.us`
- Leave group

---

#### 5. BUSINESS / CATALOG

**POST** `/business/getCatalog/:instanceName`
```json
{
  "number": "5511999999999"
}
```

**POST** `/business/getCollections/:instanceName`
```json
{
  "number": "5511999999999"
}
```

---

#### 6. TEMPLATE MANAGEMENT (Meta API)

**POST** `/template/create/:instanceName`
```json
{
  "name": "welcome_message",
  "category": "MARKETING",
  "language": "en_US",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Welcome!"
    },
    {
      "type": "BODY",
      "text": "Hello {{1}}, welcome to our service!"
    }
  ]
}
```

**GET** `/template/find/:instanceName`
- Get all templates for instance

---

#### 7. SETTINGS

**POST** `/settings/set/:instanceName`
```json
{
  "rejectCall": true,
  "msgCall": "I'm busy, please send a message",
  "groupsIgnore": false,
  "alwaysOnline": true,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": false
}
```

**GET** `/settings/find/:instanceName`
- Get instance settings

---

#### 8. PROXY

**POST** `/proxy/set/:instanceName`
```json
{
  "enabled": true,
  "host": "proxy.example.com",
  "port": "8080",
  "protocol": "http",
  "username": "user",
  "password": "pass"
}
```

**GET** `/proxy/find/:instanceName`
- Get proxy settings

---

#### 9. LABELS

**POST** `/label/create/:instanceName`
```json
{
  "name": "Important",
  "color": "#FF0000",
  "predefinedId": "1"
}
```

**GET** `/label/find/:instanceName`
- Get all labels

**POST** `/label/update/:instanceName`
```json
{
  "labelId": "label_id",
  "name": "Updated Name",
  "color": "#00FF00"
}
```

**DELETE** `/label/delete/:instanceName?labelId=label_id`
- Delete label

---

#### 10. WEBHOOK INTEGRATION

**POST** `/webhook/set/:instanceName`
```json
{
  "url": "https://your-webhook.com/evolution",
  "webhookByEvents": false,
  "webhookBase64": true,
  "events": [
    "QRCODE_UPDATED",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "SEND_MESSAGE",
    "CONNECTION_UPDATE"
  ],
  "headers": {
    "Authorization": "Bearer your_token",
    "Custom-Header": "value"
  }
}
```

**GET** `/webhook/find/:instanceName`
- Get webhook configuration

---

#### 11. RABBITMQ INTEGRATION

**POST** `/rabbitmq/set/:instanceName`
```json
{
  "enabled": true,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```

**GET** `/rabbitmq/find/:instanceName`
- Get RabbitMQ configuration

---

#### 12. KAFKA INTEGRATION

**POST** `/kafka/set/:instanceName`
```json
{
  "enabled": true,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```

**GET** `/kafka/find/:instanceName`
- Get Kafka configuration

---

#### 13. SQS INTEGRATION

**POST** `/sqs/set/:instanceName`
```json
{
  "enabled": true,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```

**GET** `/sqs/find/:instanceName`
- Get SQS configuration

---

#### 14. WEBSOCKET INTEGRATION

**POST** `/websocket/set/:instanceName`
```json
{
  "enabled": true,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```

**GET** `/websocket/find/:instanceName`
- Get WebSocket configuration

---

#### 15. PUSHER INTEGRATION

**POST** `/pusher/set/:instanceName`
```json
{
  "enabled": true,
  "appId": "your_app_id",
  "key": "your_key",
  "secret": "your_secret",
  "cluster": "us2",
  "useTLS": true,
  "events": [
    "MESSAGES_UPSERT",
    "CONNECTION_UPDATE"
  ]
}
```

**GET** `/pusher/find/:instanceName`
- Get Pusher configuration

---

#### 16. CHATWOOT INTEGRATION

**POST** `/chatwoot/set/:instanceName`
```json
{
  "enabled": true,
  "accountId": "1",
  "token": "your_chatwoot_token",
  "url": "https://chatwoot.example.com",
  "nameInbox": "WhatsApp Inbox",
  "signMsg": true,
  "signDelimiter": "\n",
  "number": "5511999999999",
  "reopenConversation": true,
  "conversationPending": false,
  "mergeBrazilContacts": true,
  "importContacts": true,
  "importMessages": true,
  "daysLimitImportMessages": 30,
  "organization": "My Company",
  "logo": "https://example.com/logo.png",
  "ignoreJids": []
}
```

**GET** `/chatwoot/find/:instanceName`
- Get Chatwoot configuration

**POST** `/chatwoot/webhook/:instanceName`
- Receive webhook from Chatwoot (for two-way messaging)

---

#### 17. TYPEBOT INTEGRATION

**POST** `/typebot/create/:instanceName`
```json
{
  "enabled": true,
  "description": "Customer Support Bot",
  "url": "https://typebot.example.com",
  "typebot": "bot_id",
  "expire": 20,
  "keywordFinish": "#EXIT",
  "delayMessage": 1000,
  "unknownMessage": "I didn't understand. Please try again.",
  "listeningFromMe": false,
  "stopBotFromMe": true,
  "keepOpen": false,
  "debounceTime": 10,
  "ignoreJids": [],
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "help",
  "splitMessages": true,
  "timePerChar": 100
}
```

**GET** `/typebot/find/:instanceName`
- Get all Typebot configurations

**GET** `/typebot/fetch/:instanceName/:typebotId`
- Get specific Typebot

**PUT** `/typebot/update/:instanceName/:typebotId`
- Update Typebot configuration

**DELETE** `/typebot/delete/:instanceName/:typebotId`
- Delete Typebot

**POST** `/typebot/settings/:instanceName`
- Set global Typebot settings
```json
{
  "expire": 20,
  "keywordFinish": "#EXIT",
  "delayMessage": 1000,
  "unknownMessage": "Default unknown message",
  "listeningFromMe": false,
  "stopBotFromMe": true,
  "keepOpen": false,
  "debounceTime": 10,
  "typebotIdFallback": "fallback_bot_id",
  "ignoreJids": [],
  "splitMessages": true,
  "timePerChar": 100
}
```

**GET** `/typebot/fetchSettings/:instanceName`
- Get global Typebot settings

**POST** `/typebot/start/:instanceName`
- Manually start Typebot session
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "typebotId": "bot_id",
  "startSession": true,
  "variables": [
    {
      "name": "user_name",
      "value": "John Doe"
    }
  ]
}
```

**POST** `/typebot/changeStatus/:instanceName`
- Change Typebot session status
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "status": "closed"
}
```

**GET** `/typebot/fetchSessions/:instanceName/:typebotId`
- Get active Typebot sessions

**POST** `/typebot/ignoreJid/:instanceName`
- Add JID to ignore list
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "action": "add",
  "typebotId": "bot_id"
}
```

---

#### 18. OPENAI INTEGRATION

**POST** `/openai/creds/:instanceName`
- Create OpenAI credentials
```json
{
  "name": "My OpenAI Key",
  "apiKey": "sk-..."
}
```

**GET** `/openai/creds/:instanceName`
- Get all OpenAI credentials

**DELETE** `/openai/creds/:instanceName/:openaiCredsId`
- Delete OpenAI credentials

**POST** `/openai/create/:instanceName`
- Create OpenAI bot
```json
{
  "enabled": true,
  "description": "AI Assistant",
  "botType": "chatCompletion",
  "openaiCredsId": "creds_id",
  "model": "gpt-4",
  "systemMessages": ["You are a helpful assistant"],
  "maxTokens": 2000,
  "expire": 20,
  "keywordFinish": "#EXIT",
  "delayMessage": 1000,
  "unknownMessage": "Processing...",
  "listeningFromMe": false,
  "stopBotFromMe": true,
  "keepOpen": false,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 100,
  "ignoreJids": [],
  "triggerType": "all",
  "triggerOperator": "contains",
  "triggerValue": ""
}
```

**GET** `/openai/find/:instanceName`
- Get all OpenAI bots

**GET** `/openai/fetch/:instanceName/:openaiBotId`
- Get specific OpenAI bot

**PUT** `/openai/update/:instanceName/:openaiBotId`
- Update OpenAI bot

**DELETE** `/openai/delete/:instanceName/:openaiBotId`
- Delete OpenAI bot

**POST** `/openai/settings/:instanceName`
- Set global OpenAI settings

**GET** `/openai/fetchSettings/:instanceName`
- Get global OpenAI settings

**POST** `/openai/changeStatus/:instanceName`
- Change OpenAI bot status

**GET** `/openai/fetchSessions/:instanceName/:openaiBotId`
- Get active OpenAI sessions

**POST** `/openai/ignoreJid/:instanceName`
- Add JID to ignore list

**GET** `/openai/getModels/:instanceName?openaiCredsId=creds_id`
- Get available OpenAI models

---

#### 19. DIFY INTEGRATION

Similar endpoints structure as OpenAI and Typebot:
- POST `/dify/create/:instanceName`
- GET `/dify/find/:instanceName`
- GET `/dify/fetch/:instanceName/:difyId`
- PUT `/dify/update/:instanceName/:difyId`
- DELETE `/dify/delete/:instanceName/:difyId`
- POST `/dify/settings/:instanceName`
- GET `/dify/fetchSettings/:instanceName`
- POST `/dify/changeStatus/:instanceName`
- GET `/dify/fetchSessions/:instanceName/:difyId`
- POST `/dify/ignoreJid/:instanceName`

---

#### 20. N8N INTEGRATION

Similar endpoints structure:
- POST `/n8n/create/:instanceName`
- GET `/n8n/find/:instanceName`
- GET `/n8n/fetch/:instanceName/:n8nId`
- PUT `/n8n/update/:instanceName/:n8nId`
- DELETE `/n8n/delete/:instanceName/:n8nId`
- POST `/n8n/settings/:instanceName`
- GET `/n8n/fetchSettings/:instanceName`
- POST `/n8n/changeStatus/:instanceName`
- GET `/n8n/fetchSessions/:instanceName/:n8nId`
- POST `/n8n/ignoreJid/:instanceName`

---

#### 21. EVOAI INTEGRATION

Similar endpoints structure:
- POST `/evoai/create/:instanceName`
- GET `/evoai/find/:instanceName`
- GET `/evoai/fetch/:instanceName/:evoaiId`
- PUT `/evoai/update/:instanceName/:evoaiId`
- DELETE `/evoai/delete/:instanceName/:evoaiId`
- POST `/evoai/settings/:instanceName`
- GET `/evoai/fetchSettings/:instanceName`
- POST `/evoai/changeStatus/:instanceName`
- GET `/evoai/fetchSessions/:instanceName/:evoaiId`
- POST `/evoai/ignoreJid/:instanceName`

---

#### 22. EVOLUTION BOT INTEGRATION

Similar endpoints structure:
- POST `/evolutionBot/create/:instanceName`
- GET `/evolutionBot/find/:instanceName`
- GET `/evolutionBot/fetch/:instanceName/:botId`
- PUT `/evolutionBot/update/:instanceName/:botId`
- DELETE `/evolutionBot/delete/:instanceName/:botId`
- POST `/evolutionBot/settings/:instanceName`
- GET `/evolutionBot/fetchSettings/:instanceName`
- POST `/evolutionBot/changeStatus/:instanceName`
- GET `/evolutionBot/fetchSessions/:instanceName/:botId`
- POST `/evolutionBot/ignoreJid/:instanceName`

---

#### 23. FLOWISE INTEGRATION

Similar endpoints structure:
- POST `/flowise/create/:instanceName`
- GET `/flowise/find/:instanceName`
- GET `/flowise/fetch/:instanceName/:flowiseId`
- PUT `/flowise/update/:instanceName/:flowiseId`
- DELETE `/flowise/delete/:instanceName/:flowiseId`
- POST `/flowise/settings/:instanceName`
- GET `/flowise/fetchSettings/:instanceName`
- POST `/flowise/changeStatus/:instanceName`
- GET `/flowise/fetchSessions/:instanceName/:flowiseId`
- POST `/flowise/ignoreJid/:instanceName`

---

#### 24. S3/MINIO STORAGE

**POST** `/s3/set/:instanceName`
```json
{
  "enabled": true,
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key",
  "bucket": "evolution-media",
  "endpoint": "s3.amazonaws.com",
  "region": "us-east-1",
  "port": 443,
  "useSSL": true
}
```

**GET** `/s3/find/:instanceName`
- Get S3/MinIO configuration

---

#### 25. CALL MANAGEMENT

**POST** `/call/offerCall/:instanceName`
- Initiate fake call (for testing/automation)
```json
{
  "number": "5511999999999",
  "isVideo": false,
  "callDuration": 10
}
```

---

## INTEGRATIONS

### 1. CHATWOOT
**Purpose:** Customer service platform integration
**Features:**
- Two-way messaging between Chatwoot and WhatsApp
- Auto-create inbox and contacts
- Message read/delete synchronization
- Contact import from WhatsApp
- Conversation management
- Support for multiple languages
- Custom organization branding

**Configuration:**
```env
CHATWOOT_ENABLED=true
```

**Use Cases:**
- Customer support teams
- Multi-agent conversations
- Ticket management
- Contact management
- Message history

---

### 2. TYPEBOT
**Purpose:** Visual chatbot flow builder
**Features:**
- Drag-and-drop flow creation
- Conditional logic and branching
- Variable management
- Session persistence
- Trigger-based activation (keyword, regex, advanced)
- Fallback bot support
- Message splitting for long responses
- Typing simulation with configurable speed

**Configuration:**
```env
TYPEBOT_ENABLED=true
TYPEBOT_API_VERSION=latest
```

**Trigger Types:**
- `all` - Respond to all messages
- `keyword` - Respond to specific keywords
- `none` - Manual activation only
- `advanced` - Custom trigger logic

**Use Cases:**
- Customer onboarding flows
- FAQ automation
- Lead qualification
- Survey collection
- Appointment booking

---

### 3. OPENAI
**Purpose:** AI-powered conversations using GPT models
**Features:**
- GPT-3.5, GPT-4 support
- Assistant API integration
- Custom system messages
- Function calling support
- Speech-to-text (Whisper) for voice messages
- Context management
- Token limit control
- Multiple OpenAI credentials per instance

**Bot Types:**
- `assistant` - OpenAI Assistant API
- `chatCompletion` - Chat Completion API

**Configuration:**
```env
OPENAI_ENABLED=true
```

**Use Cases:**
- Intelligent customer support
- Natural language processing
- Voice message transcription
- Content generation
- Smart recommendations

---

### 4. DIFY
**Purpose:** AI agent workflow platform
**Features:**
- Multiple bot types (chatbot, text generator, agent, workflow)
- Custom AI workflows
- Knowledge base integration
- Session management
- Trigger-based activation

**Bot Types:**
- `chatBot` - Conversational AI
- `textGenerator` - Text generation
- `agent` - AI agent with tools
- `workflow` - Automated workflows

**Configuration:**
```env
DIFY_ENABLED=true
```

**Use Cases:**
- Complex AI workflows
- Knowledge base queries
- Multi-step automation
- Custom AI agents

---

### 5. N8N
**Purpose:** Workflow automation platform
**Features:**
- Webhook-based integration
- Custom workflow triggers
- Basic authentication support
- Session management

**Configuration:**
```env
N8N_ENABLED=true
```

**Use Cases:**
- Custom automation workflows
- Integration with third-party services
- Data processing pipelines
- Event-driven automation

---

### 6. EVOLUTION BOT
**Purpose:** Native chatbot system
**Features:**
- Built-in bot capabilities
- API-based conversation management
- Trigger system
- Session handling

**Configuration:**
```env
# Enabled by default
```

**Use Cases:**
- Simple bot interactions
- Custom bot logic via API
- Quick automation without external services

---

### 7. FLOWISE
**Purpose:** LangChain visual builder
**Features:**
- Visual LangChain flow creation
- AI model integration
- Custom chains and agents
- Session management

**Configuration:**
```env
FLOWISE_ENABLED=true
```

**Use Cases:**
- LangChain workflows
- Complex AI chains
- RAG implementations
- Custom AI tools

---

### 8. EVOAI
**Purpose:** Custom AI integration
**Features:**
- Custom AI agent integration
- Flexible configuration
- Session management
- Trigger system

**Configuration:**
```env
EVOAI_ENABLED=true
```

---

### 9. RABBITMQ
**Purpose:** Message queue for event streaming
**Features:**
- AMQP protocol support
- Event-based message delivery
- Global or instance-specific events
- Exchange and queue management
- Frame size configuration

**Configuration:**
```env
RABBITMQ_ENABLED=true
RABBITMQ_URI=amqp://localhost
RABBITMQ_EXCHANGE_NAME=evolution
RABBITMQ_GLOBAL_ENABLED=false
```

**Use Cases:**
- Asynchronous event processing
- Microservices communication
- Event-driven architecture
- Reliable message delivery

---

### 10. APACHE KAFKA
**Purpose:** Distributed event streaming platform
**Features:**
- High-throughput message streaming
- Topic-based partitioning
- Consumer group management
- SASL/SSL authentication support
- Auto-topic creation
- Global and instance-specific topics

**Configuration:**
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=evolution-api
KAFKA_TOPIC_PREFIX=evolution
```

**Use Cases:**
- Real-time event streaming
- High-volume message processing
- Event sourcing
- Data pipeline integration

---

### 11. AMAZON SQS
**Purpose:** Cloud message queue service
**Features:**
- AWS SQS integration
- FIFO and standard queues
- Dead letter queue support
- Message batching
- Regional deployment

**Configuration:**
```env
SQS_ENABLED=true
SQS_ACCESS_KEY_ID=your_key
SQS_SECRET_ACCESS_KEY=your_secret
SQS_REGION=us-east-1
SQS_ACCOUNT_ID=your_account_id
```

**Use Cases:**
- Cloud-native event processing
- AWS ecosystem integration
- Scalable message queuing
- Serverless architectures

---

### 12. WEBSOCKET (Socket.io)
**Purpose:** Real-time bidirectional communication
**Features:**
- Real-time event delivery
- Socket.io protocol
- Global event broadcasting
- Host-based access control
- Low-latency messaging

**Configuration:**
```env
WEBSOCKET_ENABLED=true
WEBSOCKET_GLOBAL_EVENTS=true
WEBSOCKET_ALLOWED_HOSTS=127.0.0.1,::1
```

**Use Cases:**
- Real-time dashboards
- Live chat interfaces
- Instant notifications
- Real-time monitoring

---

### 13. PUSHER
**Purpose:** Real-time push notifications
**Features:**
- Pusher Channels integration
- Multi-channel support
- TLS encryption
- Global configuration
- Event-based delivery

**Configuration:**
```env
PUSHER_ENABLED=true
PUSHER_GLOBAL_APP_ID=your_app_id
PUSHER_GLOBAL_KEY=your_key
PUSHER_GLOBAL_SECRET=your_secret
PUSHER_GLOBAL_CLUSTER=us2
```

**Use Cases:**
- Mobile push notifications
- Web push notifications
- Real-time updates
- Cross-platform messaging

---

### 14. AWS S3 / MINIO
**Purpose:** Object storage for media files
**Features:**
- S3-compatible storage
- MinIO support
- Automatic media upload
- URL generation
- Bucket policy management
- Regional deployment

**Configuration:**
```env
S3_ENABLED=true
S3_ACCESS_KEY=your_key
S3_SECRET_KEY=your_secret
S3_BUCKET=evolution-media
S3_ENDPOINT=s3.amazonaws.com
S3_REGION=us-east-1
S3_USE_SSL=true
```

**Use Cases:**
- Media file storage
- CDN integration
- Backup and archival
- Distributed file access

---

### 15. WEBHOOK
**Purpose:** HTTP callbacks for events
**Features:**
- Custom webhook URLs
- Event filtering
- Base64 media option
- Custom headers
- Retry mechanism with exponential backoff
- Status code-based retry control
- Per-event webhook URLs

**Retry Configuration:**
- Max attempts: 10 (configurable)
- Initial delay: 5 seconds
- Exponential backoff: Yes
- Max delay: 300 seconds
- Jitter factor: 0.2
- Non-retryable codes: 400, 401, 403, 404, 422

**Configuration:**
```env
WEBHOOK_GLOBAL_ENABLED=false
WEBHOOK_GLOBAL_URL=https://your-webhook.com
WEBHOOK_REQUEST_TIMEOUT_MS=60000
WEBHOOK_RETRY_MAX_ATTEMPTS=10
```

**Use Cases:**
- Custom integrations
- Third-party notifications
- Event logging
- Business logic triggers

---

## FEATURES

### Core Features

#### 1. Multi-Provider WhatsApp Support
- **Baileys (WhatsApp Web):** Free, QR code-based authentication
- **Meta Business API:** Official API with advanced features
- **Evolution API Channel:** Custom WhatsApp integration

#### 2. Message Types
- Text messages with formatting
- Media (images, videos, audio, documents)
- Voice messages (PTT)
- PTV (round video messages)
- Stickers
- Locations
- Contacts (single or multiple)
- Reactions
- Polls
- Lists
- Buttons
- WhatsApp Status (Stories)
- Templates (Meta Business API)

#### 3. Group Management
- Create groups
- Update group info (name, description, picture)
- Add/remove participants
- Promote/demote admins
- Group settings (announcement, locked)
- Ephemeral messages
- Invite links
- Join via invite code

#### 4. Contact Management
- Fetch contacts
- Check WhatsApp numbers
- Block/unblock users
- Profile picture management
- Business profile queries

#### 5. Chat Operations
- Mark as read/unread
- Archive chats
- Delete messages
- Edit messages
- Presence (typing, recording, online)
- Privacy settings
- Message search and filtering

#### 6. Instance Management
- Create multiple instances
- Connection state monitoring
- QR code generation
- Restart instances
- Logout
- Delete instances
- Custom tokens

#### 7. Session Management
- Database persistence (PostgreSQL/MySQL)
- File-based persistence
- Redis caching
- Session recovery
- Multi-device support

#### 8. Event System
- 25+ event types
- Multiple delivery methods (Webhook, WebSocket, RabbitMQ, Kafka, SQS, Pusher)
- Event filtering
- Global or instance-specific
- Retry mechanisms

#### 9. Media Handling
- Auto-download media
- Base64 conversion
- S3/MinIO storage
- Audio conversion
- Video conversion to MP4
- Sticker creation

#### 10. Chatbot Integration
- Multiple bot platforms
- Trigger system (keyword, regex, advanced)
- Session management
- Fallback bots
- Message splitting
- Typing simulation
- Ignore lists

#### 11. Security
- API key authentication
- Instance-level isolation
- Webhook signature validation
- Rate limiting
- CORS configuration
- SSL/TLS support
- Proxy support

#### 12. Monitoring & Observability
- Prometheus metrics
- Sentry error tracking
- Structured logging (Pino)
- Telemetry (opt-in)
- Health checks

#### 13. Scalability
- Redis caching
- Database connection pooling
- Event-driven architecture
- Microservices-ready
- Docker support
- Horizontal scaling

---

## DATABASE SCHEMA

### Key Models (PostgreSQL/MySQL)

#### Instance
```prisma
model Instance {
  id                      String
  name                    String @unique
  connectionStatus        InstanceConnectionStatus
  ownerJid                String?
  profileName             String?
  profilePicUrl           String?
  integration             String?
  number                  String?
  businessId              String?
  token                   String?
  clientName              String?
  disconnectionReasonCode Int?
  disconnectionObject     Json?
  disconnectionAt         DateTime?
  createdAt               DateTime?
  updatedAt               DateTime?

  // Relations
  Chat                    Chat[]
  Contact                 Contact[]
  Message                 Message[]
  Webhook                 Webhook?
  Chatwoot                Chatwoot?
  Typebot                 Typebot[]
  OpenaiBot               OpenaiBot[]
  Dify                    Dify[]
  // ... (many more integrations)
}
```

#### Message
```prisma
model Message {
  id                           String
  key                          Json
  pushName                     String?
  participant                  String?
  messageType                  String
  message                      Json
  contextInfo                  Json?
  source                       DeviceMessage
  messageTimestamp             Int
  chatwootMessageId            Int?
  chatwootInboxId              Int?
  chatwootConversationId       Int?
  chatwootContactInboxSourceId String?
  chatwootIsRead               Boolean?
  instanceId                   String
  webhookUrl                   String?
  status                       String?
  sessionId                    String?
}
```

#### Contact
```prisma
model Contact {
  id            String
  remoteJid     String
  pushName      String?
  profilePicUrl String?
  instanceId    String
  createdAt     DateTime?
  updatedAt     DateTime?
}
```

#### Chat
```prisma
model Chat {
  id             String
  remoteJid      String
  name           String?
  labels         Json?
  instanceId     String
  unreadMessages Int
  createdAt      DateTime?
  updatedAt      DateTime?
}
```

#### Webhook
```prisma
model Webhook {
  id              String
  url             String
  headers         Json?
  enabled         Boolean?
  events          Json?
  webhookByEvents Boolean?
  webhookBase64   Boolean?
  instanceId      String @unique
  createdAt       DateTime?
  updatedAt       DateTime
}
```

#### Chatwoot
```prisma
model Chatwoot {
  id                      String
  enabled                 Boolean?
  accountId               String?
  token                   String?
  url                     String?
  nameInbox               String?
  signMsg                 Boolean?
  signDelimiter           String?
  number                  String?
  reopenConversation      Boolean?
  conversationPending     Boolean?
  mergeBrazilContacts     Boolean?
  importContacts          Boolean?
  importMessages          Boolean?
  daysLimitImportMessages Int?
  organization            String?
  logo                    String?
  ignoreJids              Json?
  instanceId              String @unique
  createdAt               DateTime?
  updatedAt               DateTime
}
```

#### Typebot
```prisma
model Typebot {
  id              String
  enabled         Boolean
  description     String?
  url             String
  typebot         String
  expire          Int?
  keywordFinish   String?
  delayMessage    Int?
  unknownMessage  String?
  listeningFromMe Boolean?
  stopBotFromMe   Boolean?
  keepOpen        Boolean?
  debounceTime    Int?
  ignoreJids      Json?
  triggerType     TriggerType?
  triggerOperator TriggerOperator?
  triggerValue    String?
  splitMessages   Boolean?
  timePerChar     Int?
  instanceId      String
  createdAt       DateTime?
  updatedAt       DateTime?
}
```

#### OpenaiBot
```prisma
model OpenaiBot {
  id                String
  enabled           Boolean
  description       String?
  botType           OpenaiBotType
  assistantId       String?
  functionUrl       String?
  model             String?
  systemMessages    Json?
  assistantMessages Json?
  userMessages      Json?
  maxTokens         Int?
  expire            Int?
  keywordFinish     String?
  delayMessage      Int?
  unknownMessage    String?
  listeningFromMe   Boolean?
  stopBotFromMe     Boolean?
  keepOpen          Boolean?
  debounceTime      Int?
  splitMessages     Boolean?
  timePerChar       Int?
  ignoreJids        Json?
  triggerType       TriggerType?
  triggerOperator   TriggerOperator?
  triggerValue      String?
  openaiCredsId     String
  instanceId        String
  createdAt         DateTime?
  updatedAt         DateTime
}
```

#### IntegrationSession
```prisma
model IntegrationSession {
  id         String
  sessionId  String
  remoteJid  String
  pushName   String?
  status     SessionStatus
  awaitUser  Boolean
  context    Json?
  type       String?
  instanceId String
  parameters Json?
  botId      String?
  createdAt  DateTime?
  updatedAt  DateTime
}
```

### Enums

```prisma
enum InstanceConnectionStatus {
  open
  close
  connecting
}

enum DeviceMessage {
  ios
  android
  web
  unknown
  desktop
}

enum SessionStatus {
  opened
  closed
  paused
}

enum TriggerType {
  all
  keyword
  none
  advanced
}

enum TriggerOperator {
  contains
  equals
  startsWith
  endsWith
  regex
}

enum OpenaiBotType {
  assistant
  chatCompletion
}

enum DifyBotType {
  chatBot
  textGenerator
  agent
  workflow
}
```

---

## DOCKER CONFIGURATION

### Dockerfile
Multi-stage build for optimized image size:
- **Stage 1 (builder):** Node 24 Alpine, installs dependencies, builds application
- **Stage 2 (final):** Node 24 Alpine, copies built artifacts, runs production

**Key Features:**
- FFmpeg included for media processing
- Timezone: America/Sao_Paulo (configurable via TZ env)
- Exposes port 8080
- Auto-runs database migrations on startup
- OpenSSL support for SSL/TLS

### docker-compose.yaml (Production)
```yaml
services:
  api:
    container_name: evolution_api
    image: evoapicloud/evolution-api:latest
    restart: always
    depends_on:
      - redis
      - evolution-postgres
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - evolution-net
    env_file:
      - .env

  frontend:
    container_name: evolution_frontend
    image: evoapicloud/evolution-manager:latest
    restart: always
    ports:
      - "3000:80"
    networks:
      - evolution-net

  redis:
    container_name: evolution_redis
    image: redis:latest
    restart: always
    command: redis-server --port 6379 --appendonly yes
    volumes:
      - evolution_redis:/data
    networks:
      - evolution-net
    expose:
      - "6379"

  evolution-postgres:
    container_name: evolution_postgres
    image: postgres:15
    restart: always
    command:
      - postgres
      - -c
      - max_connections=1000
    environment:
      - POSTGRES_DB=${POSTGRES_DATABASE}
      - POSTGRES_USER=${POSTGRES_USERNAME}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-net
    expose:
      - "5432"

volumes:
  evolution_instances:
  evolution_redis:
  postgres_data:

networks:
  evolution-net:
    name: evolution-net
    driver: bridge
```

### Additional Docker Configurations

**Docker/kafka/** - Apache Kafka setup
**Docker/minio/** - MinIO object storage
**Docker/mysql/** - MySQL database
**Docker/postgres/** - PostgreSQL database
**Docker/rabbitmq/** - RabbitMQ message broker
**Docker/redis/** - Redis cache
**Docker/swarm/** - Docker Swarm deployment

---

## CODE STRUCTURE

### Design Patterns

#### 1. RouterBroker Pattern
```typescript
export class ExampleRouter extends RouterBroker {
  constructor(...guards: RequestHandler[]) {
    super();
    this.router.post(this.routerPath('create'), ...guards, async (req, res) => {
      const response = await this.dataValidate<ExampleDto>({
        request: req,
        schema: exampleSchema,
        ClassRef: ExampleDto,
        execute: (instance, data) => controller.create(instance, data),
      });
      res.status(HttpStatus.CREATED).json(response);
    });
  }
}
```

#### 2. Service Layer Pattern
```typescript
export class ExampleService {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  private readonly logger = new Logger('ExampleService');

  public async create(instance: InstanceDto, data: ExampleDto) {
    // Business logic
    return { example: { ...instance, data } };
  }

  public async find(instance: InstanceDto): Promise<ExampleDto | null> {
    try {
      const waInstance = this.waMonitor.waInstances[instance.instanceName];
      return await waInstance.findData();
    } catch (error) {
      this.logger.error('Error:', error);
      return null;
    }
  }
}
```

#### 3. DTO Pattern (No Decorators)
```typescript
export class ExampleDto {
  name: string;
  description?: string;
  enabled: boolean;
}
```

#### 4. Validation Pattern (JSONSchema7)
```typescript
export const exampleSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    enabled: { type: 'boolean' },
  },
  required: ['name', 'enabled'],
};
```

### Key Services

#### WAMonitoringService
- Manages all WhatsApp instance connections
- Connection lifecycle management
- QR code generation
- Message routing
- Event emission

#### ChannelService
- WhatsApp provider abstraction
- Supports Baileys, Meta Business API, Evolution Channel
- Provider-specific implementations

#### CacheService
- Redis primary caching
- Node-cache fallback
- TTL management
- Instance data caching

#### EventManager
- Centralized event distribution
- Multiple delivery methods (Webhook, WebSocket, RabbitMQ, etc.)
- Event filtering
- Retry logic

#### RepositoryService
- Prisma ORM wrapper
- Database operations
- Transaction management
- Multi-provider support

---

## SECURITY

### Security Policy

**Supported Versions:**
- 2.3.x: Full support
- 2.2.x: Full support
- 2.1.x: Critical fixes only
- < 2.1: Not supported

**Reporting Vulnerabilities:**
- Email: contato@evolution-api.com
- DO NOT create public GitHub issues
- Response time: Within 48 hours
- Resolution: 30-90 days (varies by complexity)

### Security Features

1. **API Key Authentication**
   - Global API key
   - Instance-specific tokens
   - Header-based authentication

2. **Input Validation**
   - JSONSchema7 validation
   - Type safety via TypeScript
   - Sanitization of user input

3. **Rate Limiting**
   - Configurable per endpoint
   - DDoS protection
   - Fair usage enforcement

4. **Instance Isolation**
   - Multi-tenant architecture
   - Database-level isolation
   - Resource separation

5. **Webhook Security**
   - Custom headers support
   - HTTPS enforcement
   - Retry with exponential backoff

6. **CORS Configuration**
   - Configurable origins
   - Method restrictions
   - Credentials handling

7. **SSL/TLS Support**
   - HTTPS server mode
   - Certificate management
   - Secure connections

8. **Proxy Support**
   - HTTP/HTTPS/SOCKS protocols
   - Authentication support
   - Connection anonymization

9. **File Path Security**
   - Path traversal protection
   - Validated file access
   - Secure asset serving

10. **Error Handling**
    - Sentry integration
    - Error webhook delivery
    - Sensitive data masking

---

## EXAMPLES

### 1. Create Instance and Send Message

```bash
# Create instance
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "my_bot",
    "qrcode": true
  }'

# Connect to WhatsApp (returns QR code)
curl -X GET http://localhost:8080/instance/connect/my_bot \
  -H "apikey: YOUR_API_KEY"

# Send text message
curl -X POST http://localhost:8080/message/sendText/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Hello from Evolution API!"
  }'
```

### 2. Send Media with Caption

```bash
curl -X POST http://localhost:8080/message/sendMedia/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "mediatype": "image",
    "media": "https://example.com/image.jpg",
    "caption": "Check out this image!"
  }'
```

### 3. Configure Webhook

```bash
curl -X POST http://localhost:8080/webhook/set/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-webhook.com/evolution",
    "webhookByEvents": false,
    "webhookBase64": true,
    "events": [
      "QRCODE_UPDATED",
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE"
    ]
  }'
```

### 4. Setup Typebot

```bash
curl -X POST http://localhost:8080/typebot/create/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "description": "Support Bot",
    "url": "https://typebot.example.com",
    "typebot": "my-typebot-id",
    "expire": 20,
    "keywordFinish": "#EXIT",
    "triggerType": "keyword",
    "triggerOperator": "contains",
    "triggerValue": "help",
    "stopBotFromMe": true
  }'
```

### 5. Create Group and Send Message

```bash
# Create group
curl -X POST http://localhost:8080/group/create/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "My Group",
    "description": "Group for testing",
    "participants": ["5511999999999", "5511888888888"]
  }'

# Send message to group
curl -X POST http://localhost:8080/message/sendText/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "120363XXXXX@g.us",
    "text": "Hello group members!",
    "mentioned": ["5511999999999"]
  }'
```

### 6. Setup Chatwoot Integration

```bash
curl -X POST http://localhost:8080/chatwoot/set/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "accountId": "1",
    "token": "your_chatwoot_token",
    "url": "https://chatwoot.example.com",
    "nameInbox": "WhatsApp Support",
    "reopenConversation": true,
    "conversationPending": false
  }'
```

### 7. Configure S3 Storage

```bash
curl -X POST http://localhost:8080/s3/set/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "accessKey": "your_access_key",
    "secretKey": "your_secret_key",
    "bucket": "evolution-media",
    "endpoint": "s3.amazonaws.com",
    "region": "us-east-1",
    "useSSL": true
  }'
```

### 8. Send Poll

```bash
curl -X POST http://localhost:8080/message/sendPoll/my_bot \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "name": "What is your favorite programming language?",
    "selectableCount": 1,
    "values": ["JavaScript", "Python", "TypeScript", "Go", "Rust"]
  }'
```

### 9. Webhook Event Example

When you receive a webhook for `MESSAGES_UPSERT`:

```json
{
  "event": "messages.upsert",
  "instance": "my_bot",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "pushName": "John Doe",
    "message": {
      "conversation": "Hello!"
    },
    "messageType": "conversation",
    "messageTimestamp": 1698765432,
    "instanceId": "instance_id",
    "source": "android"
  },
  "date_time": "2025-10-21T10:30:45.123Z",
  "sender": "5511999999999@s.whatsapp.net",
  "server_url": "http://localhost:8080",
  "apikey": "YOUR_API_KEY"
}
```

### 10. Database Query Examples

Using Prisma:

```typescript
// Find messages from a specific contact
const messages = await prisma.message.findMany({
  where: {
    instanceId: 'instance_id',
    key: {
      path: ['remoteJid'],
      equals: '5511999999999@s.whatsapp.net'
    }
  },
  orderBy: {
    messageTimestamp: 'desc'
  },
  take: 50
});

// Get instance with all integrations
const instance = await prisma.instance.findUnique({
  where: { name: 'my_bot' },
  include: {
    Webhook: true,
    Chatwoot: true,
    Typebot: true,
    OpenaiBot: true
  }
});
```

---

## DEVELOPMENT COMMANDS

### Build & Run
```bash
# Development with hot reload
npm run dev:server

# Production build
npm run build
npm run start:prod

# Direct execution
npm start
```

### Code Quality
```bash
# Lint with auto-fix
npm run lint

# Lint check only
npm run lint:check

# Conventional commit
npm run commit
```

### Database
```bash
# Set provider first
export DATABASE_PROVIDER=postgresql

# Generate Prisma client
npm run db:generate

# Development migrations
npm run db:migrate:dev

# Production deployment
npm run db:deploy

# Database studio
npm run db:studio
```

### Testing
```bash
npm test
```

---

## WEBHOOK EVENTS

### Available Events

1. **APPLICATION_STARTUP** - API started
2. **INSTANCE_CREATE** - New instance created
3. **INSTANCE_DELETE** - Instance deleted
4. **QRCODE_UPDATED** - QR code generated/updated
5. **MESSAGES_SET** - Initial message sync
6. **MESSAGES_UPSERT** - New message received
7. **MESSAGES_EDITED** - Message edited
8. **MESSAGES_UPDATE** - Message status updated
9. **MESSAGES_DELETE** - Message deleted
10. **SEND_MESSAGE** - Message sent successfully
11. **SEND_MESSAGE_UPDATE** - Sent message status updated
12. **CONTACTS_SET** - Initial contact sync
13. **CONTACTS_UPSERT** - Contact added/updated
14. **CONTACTS_UPDATE** - Contact information updated
15. **PRESENCE_UPDATE** - Contact presence changed
16. **CHATS_SET** - Initial chat sync
17. **CHATS_UPSERT** - Chat added/updated
18. **CHATS_UPDATE** - Chat information updated
19. **CHATS_DELETE** - Chat deleted
20. **GROUPS_UPSERT** - Group added/updated
21. **GROUPS_UPDATE** - Group information updated
22. **GROUP_PARTICIPANTS_UPDATE** - Group participants changed
23. **CONNECTION_UPDATE** - Connection status changed
24. **LABELS_EDIT** - Label edited
25. **LABELS_ASSOCIATION** - Label associated/disassociated
26. **CALL** - Incoming call
27. **TYPEBOT_START** - Typebot session started
28. **TYPEBOT_CHANGE_STATUS** - Typebot session status changed
29. **ERRORS** - Error occurred

---

## POSTMAN COLLECTION

Official Postman collection available at:
https://evolution-api.com/postman

Contains all endpoints with examples and documentation.

---

## OFFICIAL DOCUMENTATION

Full documentation available at:
https://doc.evolution-api.com

Includes:
- Detailed installation guides
- API reference
- Integration tutorials
- Best practices
- Troubleshooting

---

## COMMUNITY & SUPPORT

- **WhatsApp Group:** https://evolution-api.com/whatsapp
- **Discord Community:** https://evolution-api.com/discord
- **GitHub Issues:** https://github.com/EvolutionAPI/evolution-api/issues
- **Feature Requests:** https://evolutionapi.canny.io/feature-requests
- **Roadmap:** https://evolutionapi.canny.io/feature-requests
- **Changelog:** https://evolutionapi.canny.io/changelog
- **Premium Support:** https://evolution-api.com/suporte-pro

---

## LICENSE

Apache License 2.0 with additional conditions:

1. **LOGO and Copyright:** Do not remove or modify LOGO or copyright in frontend components
2. **Usage Notification:** Systems using Evolution API must display notification to administrators

Contact for licensing: contato@evolution-api.com

---

## DONATIONS & SPONSORSHIP

- **GitHub Sponsors:** https://github.com/sponsors/EvolutionAPI
- **PicPay:** https://app.picpay.com/user/davidsongomes1998

---

## RELATED PROJECTS

- **Evolution API Lite:** https://github.com/EvolutionAPI/evolution-api-lite
  Lightweight version optimized for microservices

- **Evolution Manager v2:** https://github.com/EvolutionAPI/evolution-manager-v2
  Web-based management interface (included in main repo as submodule)

---

**Last Updated:** October 30, 2025
**Documentation Version:** 2.3.6
**Compiled by:** Claude AI (Technical Researcher)
