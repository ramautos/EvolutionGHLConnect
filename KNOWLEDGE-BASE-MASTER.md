# MASTER KNOWLEDGE BASE - COMPLETE RESEARCH

**Last Updated:** October 30, 2025
**Purpose:** Comprehensive knowledge repository for GoHighLevel and Evolution API integration projects
**Status:** Complete and ready for context recovery

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [GoHighLevel API Documentation](#gohighlevel-api-documentation)
3. [Evolution API Documentation](#evolution-api-documentation)
4. [Integration Strategies](#integration-strategies)
5. [Database Schemas](#database-schemas)
6. [Webhook Configurations](#webhook-configurations)
7. [Authentication & Security](#authentication--security)
8. [Implementation Examples](#implementation-examples)
9. [Quick Reference](#quick-reference)
10. [File Locations](#file-locations)

---

## PROJECT OVERVIEW

### Research Summary

This knowledge base contains complete research and documentation for:

1. **GoHighLevel (GHL) API v2.0**
   - CRM and marketing automation platform
   - OAuth 2.0 implementation
   - 38 API modules with 264+ scopes
   - Webhook system with 58 event types
   - Token refresh mechanism

2. **Evolution API v2.3.6**
   - Open-source WhatsApp REST API
   - Multi-tenant architecture
   - 100+ REST endpoints
   - 15+ chatbot integrations
   - Multiple event streaming systems

3. **Integration Components**
   - Token refresh automation (PostgreSQL + n8n)
   - Webhook configurations
   - Database schemas
   - Security implementations

### Use Cases

- WhatsApp automation with GoHighLevel CRM
- Customer communication workflows
- Lead management and nurturing
- Multi-channel messaging systems
- Automated customer support

---

## GOHIGHLEVEL API DOCUMENTATION

### Quick Facts

- **Version:** v2.0 (v1.0 deprecated 2024-04-30)
- **Base URL:** `https://services.leadconnectorhq.com`
- **Authentication:** OAuth 2.0 Authorization Code Grant
- **Rate Limits:** 100 requests/10 seconds burst, 200,000/day
- **SDKs:** TypeScript/JavaScript, Python, Go, Ruby
- **Documentation:** https://marketplace.gohighlevel.com/docs/oauth/GettingStarted

### Authentication Flow

```javascript
// Step 1: Authorization URL
const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?` +
  `response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&client_id=${CLIENT_ID}` +
  `&scope=${encodeURIComponent(SCOPES.join(' '))}`;

// Step 2: Exchange code for tokens
const tokenResponse = await axios.post(
  'https://services.leadconnectorhq.com/oauth/token',
  {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: authorizationCode,
    user_type: 'Company', // or 'Location'
    redirect_uri: REDIRECT_URI
  }
);

// Response
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 86399, // 24 hours
  "refresh_token": "def50200...",
  "scope": "contacts.readonly contacts.write",
  "userType": "Company",
  "locationId": "ve9EPM428h8vShlRW1KT",
  "companyId": "ve9EPM428h8vShlRW1KT",
  "approvedLocations": ["locationId1", "locationId2"]
}

// Step 3: Refresh token (before expiration)
const refreshResponse = await axios.post(
  'https://services.leadconnectorhq.com/oauth/token',
  {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    user_type: 'Company',
    redirect_uri: REDIRECT_URI
  }
);
```

### Token Management

**Access Token:**
- Validity: 24 hours (86,399 seconds)
- Format: JWT (eyJhbGc...)
- Usage: `Authorization: Bearer {access_token}` header

**Refresh Token:**
- Validity: 1 year
- Single-use: Invalidated immediately after use
- Must refresh before access token expires

### Key API Modules (38 Total)

1. **Contacts** - CRUD operations, upsert, bulk actions
2. **Conversations** - Messages, emails, SMS
3. **Opportunities** - Pipeline management
4. **Calendars** - Appointments, events, slots
5. **Campaigns** - Email/SMS campaigns
6. **Forms** - Submission tracking
7. **Invoices** - Billing and payments
8. **Payments** - Payment processing (10,820 lines spec)
9. **Social Media** - Posting and management (8,375 lines)
10. **Workflows** - Automation triggers

### Important Scopes

```javascript
// Core scopes
const COMMON_SCOPES = [
  'contacts.readonly',
  'contacts.write',
  'conversations.readonly',
  'conversations.write',
  'conversations/message.readonly',
  'conversations/message.write',
  'opportunities.readonly',
  'opportunities.write',
  'calendars.readonly',
  'calendars.write',
  'webhooks.readonly',
  'webhooks.write'
];

// Total available: 264+ scopes
```

### Webhook System

**58 Event Types Including:**
- Contact events (create, update, delete)
- Opportunity events (create, status change, delete)
- Appointment events (scheduled, confirmed, cancelled)
- Conversation events (new message, inbound, outbound)
- Payment events (received, failed)
- Form submissions
- Campaign events
- SMS/Email events

**Webhook Signature Verification:**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  return signature === calculatedSignature;
}
```

### Rate Limits

- **Burst:** 100 requests per 10 seconds
- **Daily:** 200,000 requests per day
- **Headers Returned:**
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## EVOLUTION API DOCUMENTATION

### Quick Facts

- **Version:** 2.3.6 (October 21, 2025)
- **Repository:** https://github.com/EvolutionAPI/evolution-api
- **License:** Apache 2.0 with additional conditions
- **Base URL:** `http://localhost:8080` (default)
- **Authentication:** API Key header
- **Stars:** 6,000+ | Forks: 4,700+ | Contributors: 143

### Technology Stack

```json
{
  "runtime": "Node.js 20+",
  "language": "TypeScript 5+",
  "framework": "Express.js",
  "orm": "Prisma (PostgreSQL/MySQL)",
  "cache": "Redis + Node-cache",
  "whatsapp_providers": [
    "Baileys 7.0.0-rc.6 (WhatsApp Web)",
    "Meta Business API",
    "Evolution Channel"
  ],
  "key_dependencies": {
    "baileys": "7.0.0-rc.6",
    "express": "^4.21.2",
    "@prisma/client": "^6.16.2",
    "axios": "^1.7.9",
    "redis": "^4.7.0",
    "openai": "^4.77.3",
    "socket.io": "^4.8.1",
    "kafkajs": "^2.2.4",
    "amqplib": "^0.10.5"
  }
}
```

### Architecture

**Multi-Tenant Design:**
- Each WhatsApp connection = separate "instance"
- Database-level isolation by `instanceId`
- API key authentication (global or per-instance)
- Independent webhook/event settings per instance

**Layered Pattern:**
```
HTTP Request
    ↓
Routes (RouterBroker) - Validation + Auth
    ↓
Controllers - Orchestration
    ↓
Services - Business Logic
    ↓
Repository - Data Access (Prisma)
    ↓
Database (PostgreSQL/MySQL)
```

### Installation

**Docker (Recommended):**
```bash
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
cp .env.example .env
# Edit .env and set AUTHENTICATION_API_KEY
docker-compose up -d
```

**Access Points:**
- API: http://localhost:8080
- Manager UI: http://localhost:3000
- Swagger Docs: http://localhost:8080/docs

### Core API Endpoints

#### Instance Management

```bash
# Create instance
POST /instance/create
{
  "instanceName": "my_instance",
  "token": "optional_custom_token",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}

# Connect (returns QR code)
GET /instance/connect/:instanceName

# Connection state
GET /instance/connectionState/:instanceName
# Returns: "open" | "close" | "connecting"

# Fetch all instances
GET /instance/fetchInstances?instanceName=optional

# Restart instance
POST /instance/restart/:instanceName

# Logout
DELETE /instance/logout/:instanceName

# Delete instance
DELETE /instance/delete/:instanceName
```

#### Message Sending (15+ Types)

```bash
# Text message
POST /message/sendText/:instanceName
{
  "number": "5511999999999",
  "text": "Hello from Evolution API!",
  "delay": 1000,
  "linkPreview": true
}

# Media (image, video, audio, document)
POST /message/sendMedia/:instanceName
{
  "number": "5511999999999",
  "mediatype": "image",
  "media": "https://example.com/image.jpg",
  "caption": "Check this out!",
  "fileName": "photo.jpg"
}

# Voice message (PTT)
POST /message/sendWhatsAppAudio/:instanceName

# Location
POST /message/sendLocation/:instanceName
{
  "number": "5511999999999",
  "latitude": -23.5505199,
  "longitude": -46.6333094,
  "name": "São Paulo"
}

# Contact
POST /message/sendContact/:instanceName
{
  "number": "5511999999999",
  "contact": [{
    "fullName": "John Doe",
    "phoneNumber": "5511888888888"
  }]
}

# Reaction
POST /message/sendReaction/:instanceName
{
  "key": { "id": "msg_id", "remoteJid": "...", "fromMe": false },
  "reaction": "👍"
}

# Poll
POST /message/sendPoll/:instanceName
{
  "number": "5511999999999",
  "name": "What's your favorite color?",
  "selectableCount": 1,
  "values": ["Red", "Blue", "Green"]
}

# List
POST /message/sendList/:instanceName
{
  "number": "5511999999999",
  "title": "Menu",
  "buttonText": "View Options",
  "sections": [...]
}

# Buttons
POST /message/sendButtons/:instanceName
{
  "number": "5511999999999",
  "title": "Select Payment",
  "buttons": [...]
}

# Sticker
POST /message/sendSticker/:instanceName

# Status (Story)
POST /message/sendStatus/:instanceName
```

#### Chat Operations

```bash
# Check if number is on WhatsApp
POST /chat/whatsappNumbers/:instanceName
{
  "numbers": ["5511999999999", "5511888888888"]
}

# Mark as read
POST /chat/markMessageAsRead/:instanceName

# Archive chat
POST /chat/archiveChat/:instanceName

# Delete message
DELETE /chat/deleteMessageForEveryone/:instanceName

# Update/edit message
POST /chat/updateMessage/:instanceName

# Send presence (typing, recording)
POST /chat/sendPresence/:instanceName
{
  "number": "5511999999999",
  "presence": "composing"
}

# Block/unblock
POST /chat/updateBlockStatus/:instanceName

# Search messages
POST /chat/findMessages/:instanceName

# Search contacts
POST /chat/findContacts/:instanceName

# Profile operations
POST /chat/fetchProfilePictureUrl/:instanceName
POST /chat/updateProfileName/:instanceName
POST /chat/updateProfileStatus/:instanceName
POST /chat/updateProfilePicture/:instanceName
```

#### Group Management

```bash
# Create group
POST /group/create/:instanceName
{
  "subject": "My Group",
  "participants": ["5511999999999"]
}

# Update group info
POST /group/updateGroupSubject/:instanceName
POST /group/updateGroupPicture/:instanceName
POST /group/updateGroupDescription/:instanceName

# Get group info
GET /group/findGroupInfos/:instanceName?groupJid=...
GET /group/fetchAllGroups/:instanceName?getParticipants=true

# Participants
GET /group/participants/:instanceName?groupJid=...
POST /group/updateParticipant/:instanceName
{
  "groupJid": "120363XXXXX@g.us",
  "action": "add", // or "remove", "promote", "demote"
  "participants": ["5511999999999"]
}

# Invite management
GET /group/inviteCode/:instanceName?groupJid=...
POST /group/revokeInviteCode/:instanceName
GET /group/acceptInviteCode/:instanceName?inviteCode=...

# Group settings
POST /group/updateSetting/:instanceName
{
  "groupJid": "...",
  "action": "announcement" // or "not_announcement", "locked", "unlocked"
}

# Leave group
DELETE /group/leaveGroup/:instanceName?groupJid=...
```

### Integrations (15+)

#### 1. Webhook Integration

```bash
POST /webhook/set/:instanceName
{
  "url": "https://your-webhook.com/evolution",
  "webhookByEvents": false,
  "webhookBase64": true,
  "events": [
    "QRCODE_UPDATED",
    "MESSAGES_UPSERT",
    "CONNECTION_UPDATE"
  ],
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

**Global Webhook (.env):**
```bash
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://your-webhook.com
WEBHOOK_EVENTS_INSTANCE_CREATE=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
```

#### 2. Chatwoot Integration

```bash
POST /chatwoot/set/:instanceName
{
  "enabled": true,
  "accountId": "1",
  "token": "chatwoot_token",
  "url": "https://chatwoot.example.com",
  "nameInbox": "WhatsApp Support",
  "reopenConversation": true,
  "importContacts": true,
  "importMessages": true
}
```

#### 3. Typebot Integration

```bash
POST /typebot/create/:instanceName
{
  "enabled": true,
  "url": "https://typebot.example.com",
  "typebot": "bot_id",
  "expire": 20,
  "keywordFinish": "#EXIT",
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "help"
}
```

#### 4. OpenAI Integration

```bash
# Create credentials
POST /openai/creds/:instanceName
{
  "name": "My OpenAI Key",
  "apiKey": "sk-..."
}

# Create bot
POST /openai/create/:instanceName
{
  "enabled": true,
  "botType": "chatCompletion",
  "model": "gpt-4",
  "systemMessages": ["You are a helpful assistant"],
  "maxTokens": 2000
}
```

#### 5. Event Systems

**RabbitMQ:**
```bash
RABBITMQ_ENABLED=true
RABBITMQ_URI=amqp://localhost
RABBITMQ_EXCHANGE_NAME=evolution
```

**Kafka:**
```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_PREFIX=evolution
```

**Amazon SQS:**
```bash
SQS_ENABLED=true
SQS_ACCESS_KEY_ID=your_key
SQS_SECRET_ACCESS_KEY=your_secret
SQS_REGION=us-east-1
```

**WebSocket:**
```bash
WEBSOCKET_ENABLED=true
WEBSOCKET_GLOBAL_EVENTS=true
```

### Webhook Events (29 Available)

```javascript
const EVOLUTION_EVENTS = [
  'APPLICATION_STARTUP',
  'INSTANCE_CREATE',
  'INSTANCE_DELETE',
  'QRCODE_UPDATED',
  'MESSAGES_SET',
  'MESSAGES_UPSERT',
  'MESSAGES_EDITED',
  'MESSAGES_UPDATE',
  'MESSAGES_DELETE',
  'SEND_MESSAGE',
  'CONTACTS_SET',
  'CONTACTS_UPSERT',
  'CONTACTS_UPDATE',
  'PRESENCE_UPDATE',
  'CHATS_SET',
  'CHATS_UPSERT',
  'CHATS_UPDATE',
  'CHATS_DELETE',
  'GROUPS_UPSERT',
  'GROUPS_UPDATE',
  'GROUP_PARTICIPANTS_UPDATE',
  'CONNECTION_UPDATE',
  'LABELS_EDIT',
  'LABELS_ASSOCIATION',
  'CALL',
  'TYPEBOT_START',
  'TYPEBOT_CHANGE_STATUS',
  'ERRORS'
];
```

---

## INTEGRATION STRATEGIES

### Strategy 1: GHL + Evolution API Direct Integration

**Use Case:** Send WhatsApp messages from GHL workflows

```javascript
// GHL Workflow Webhook → Your Server → Evolution API

app.post('/ghl-webhook', async (req, res) => {
  const { contact, event } = req.body;

  // Get valid GHL access token
  const ghlToken = await getValidGHLToken(contact.locationId);

  // Send WhatsApp via Evolution API
  await axios.post(
    `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`,
    {
      number: contact.phone,
      text: `Hi ${contact.firstName}, thanks for your interest!`
    },
    {
      headers: { 'apikey': EVOLUTION_API_KEY }
    }
  );

  res.status(200).send('OK');
});
```

### Strategy 2: Bidirectional Sync

**Use Case:** WhatsApp messages create/update GHL contacts

```javascript
// Evolution Webhook → Process → Update GHL

app.post('/evolution-webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'messages.upsert' && !data.key.fromMe) {
    const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');
    const message = data.message?.conversation || '';

    // Get GHL token
    const ghlToken = await getValidGHLToken(locationId);

    // Upsert contact in GHL
    await axios.post(
      'https://services.leadconnectorhq.com/contacts/upsert',
      {
        phone: phone,
        lastMessageReceived: message,
        source: 'WhatsApp'
      },
      {
        headers: { 'Authorization': `Bearer ${ghlToken}` }
      }
    );
  }

  res.status(200).json({ received: true });
});
```

### Strategy 3: n8n Automation Bridge

**Workflow:**
1. GHL triggers webhook on new opportunity
2. n8n receives webhook
3. n8n calls Evolution API to send WhatsApp
4. Evolution webhook confirms delivery
5. n8n updates GHL opportunity with note

```json
{
  "nodes": [
    {
      "name": "GHL Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Get GHL Token",
      "type": "n8n-nodes-base.postgres"
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://evolution:8080/message/sendText/instance",
        "method": "POST"
      }
    },
    {
      "name": "Update GHL",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

---

## DATABASE SCHEMAS

### GoHighLevel Token Management

```sql
-- GHL Installations Table
CREATE TABLE ghl_installations (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) UNIQUE NOT NULL,
    company_id VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP NOT NULL,
    user_type VARCHAR(50), -- 'Company' or 'Location'
    scopes TEXT,
    is_bulk_installation BOOLEAN DEFAULT false,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_token_refresh TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token Refresh Log
CREATE TABLE ghl_token_refresh_log (
    id SERIAL PRIMARY KEY,
    installation_id INTEGER REFERENCES ghl_installations(id),
    location_id VARCHAR(255),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    old_expires_at TIMESTAMP,
    new_expires_at TIMESTAMP,
    refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ghl_location_id ON ghl_installations(location_id);
CREATE INDEX idx_ghl_expires_at ON ghl_installations(expires_at);
CREATE INDEX idx_ghl_active ON ghl_installations(is_active);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_ghl_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ghl_installations_updated_at
BEFORE UPDATE ON ghl_installations
FOR EACH ROW
EXECUTE FUNCTION update_ghl_updated_at();
```

### Evolution API Instances Tracking

```sql
-- Evolution Instances Table
CREATE TABLE evolution_instances (
    id SERIAL PRIMARY KEY,
    instance_name VARCHAR(255) UNIQUE NOT NULL,
    evolution_id VARCHAR(255),
    status VARCHAR(50), -- 'open', 'close', 'connecting'
    integration VARCHAR(100), -- 'WHATSAPP-BAILEYS', 'META-BUSINESS', etc.
    owner_jid VARCHAR(255),
    profile_name VARCHAR(255),
    phone_number VARCHAR(50),
    qr_code TEXT,
    webhook_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    connected_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    last_message_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Evolution Messages Log (optional)
CREATE TABLE evolution_messages (
    id SERIAL PRIMARY KEY,
    instance_name VARCHAR(255),
    message_id VARCHAR(255),
    remote_jid VARCHAR(255),
    from_me BOOLEAN,
    message_type VARCHAR(50),
    message_content JSONB,
    timestamp BIGINT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_evolution_instance_name ON evolution_instances(instance_name);
CREATE INDEX idx_evolution_status ON evolution_instances(status);
CREATE INDEX idx_evolution_messages_remote_jid ON evolution_messages(remote_jid);
CREATE INDEX idx_evolution_messages_timestamp ON evolution_messages(timestamp);
```

### Integration Mapping Table

```sql
-- Link GHL locations with Evolution instances
CREATE TABLE ghl_evolution_mapping (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(255) UNIQUE REFERENCES ghl_installations(location_id),
    instance_name VARCHAR(255) REFERENCES evolution_instances(instance_name),
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_contacts BOOLEAN DEFAULT true,
    sync_conversations BOOLEAN DEFAULT true,
    webhook_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mapping_location ON ghl_evolution_mapping(location_id);
CREATE INDEX idx_mapping_instance ON ghl_evolution_mapping(instance_name);
```

---

## WEBHOOK CONFIGURATIONS

### Evolution API → Your Server

**Receive all instance events:**

```javascript
// Express endpoint
app.post('/webhooks/evolution', async (req, res) => {
  try {
    const { event, instance, data, date_time, apikey } = req.body;

    console.log(`📨 Evolution Event: ${event} from ${instance}`);

    switch(event) {
      case 'instance.create':
        await handleInstanceCreated(instance, data);
        break;

      case 'qrcode.updated':
        await handleQRCode(instance, data.qrcode);
        break;

      case 'connection.update':
        await handleConnectionUpdate(instance, data.state);
        break;

      case 'messages.upsert':
        if (!data.key.fromMe) {
          await handleIncomingMessage(instance, data);
        }
        break;

      case 'messages.update':
        await handleMessageStatusUpdate(instance, data);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Evolution webhook:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

async function handleIncomingMessage(instance, data) {
  const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');
  const message = data.message?.conversation ||
                  data.message?.extendedTextMessage?.text || '';

  // Find GHL location for this instance
  const mapping = await db.query(`
    SELECT m.location_id, g.access_token
    FROM ghl_evolution_mapping m
    JOIN ghl_installations g ON g.location_id = m.location_id
    WHERE m.instance_name = $1
  `, [instance]);

  if (mapping.rows[0]) {
    const { location_id, access_token } = mapping.rows[0];

    // Create/update contact in GHL
    await axios.post(
      `https://services.leadconnectorhq.com/contacts/upsert`,
      {
        locationId: location_id,
        phone: phone,
        tags: ['WhatsApp'],
        customFields: [
          {
            key: 'last_whatsapp_message',
            value: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Version': '2021-07-28'
        }
      }
    );
  }
}
```

### GoHighLevel → Your Server

**Receive GHL webhooks:**

```javascript
app.post('/webhooks/gohighlevel', async (req, res) => {
  try {
    const signature = req.headers['x-ghl-signature'];
    const payload = req.body;

    // Verify webhook signature
    if (!verifyGHLWebhook(payload, signature, GHL_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { type, location_id, contact, opportunity } = payload;

    console.log(`📨 GHL Event: ${type} for location ${location_id}`);

    switch(type) {
      case 'ContactCreate':
      case 'ContactUpdate':
        await handleGHLContact(location_id, contact);
        break;

      case 'OpportunityCreate':
        await handleGHLOpportunity(location_id, opportunity);
        break;

      case 'InboundMessage':
        // Handle incoming SMS/Email
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing GHL webhook:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

async function handleGHLOpportunity(locationId, opportunity) {
  // Find Evolution instance for this location
  const mapping = await db.query(`
    SELECT instance_name
    FROM ghl_evolution_mapping
    WHERE location_id = $1
  `, [locationId]);

  if (mapping.rows[0]) {
    const instanceName = mapping.rows[0].instance_name;

    // Send WhatsApp notification
    await axios.post(
      `${EVOLUTION_URL}/message/sendText/${instanceName}`,
      {
        number: opportunity.contact.phone,
        text: `Hi ${opportunity.contact.firstName}! Your ${opportunity.pipelineStage} is being processed.`
      },
      {
        headers: { 'apikey': EVOLUTION_API_KEY }
      }
    );
  }
}

function verifyGHLWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex') === signature;
}
```

---

## AUTHENTICATION & SECURITY

### GoHighLevel Token Manager Class

```javascript
class GHLTokenManager {
  constructor(dbPool, clientId, clientSecret, redirectUri) {
    this.db = dbPool;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  // Save initial tokens after OAuth flow
  async saveInitialTokens(authorizationCode, userType = 'Company') {
    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: authorizationCode,
        user_type: userType,
        redirect_uri: this.redirectUri
      }
    );

    const { access_token, refresh_token, expires_in, locationId, companyId, scope } = tokenResponse.data;

    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    await this.db.query(`
      INSERT INTO ghl_installations
      (location_id, company_id, access_token, refresh_token, expires_at, user_type, scopes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (location_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        last_token_refresh = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `, [locationId, companyId, access_token, refresh_token, expiresAt, userType, scope]);

    return { locationId, expiresAt };
  }

  // Get valid access token (auto-refresh if needed)
  async getValidAccessToken(locationId) {
    const result = await this.db.query(`
      SELECT access_token, refresh_token, expires_at
      FROM ghl_installations
      WHERE location_id = $1 AND is_active = true
    `, [locationId]);

    if (!result.rows[0]) {
      throw new Error('Installation not found');
    }

    const installation = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(installation.expires_at);

    // Refresh if expires in less than 2 hours
    if (expiresAt - now < 2 * 60 * 60 * 1000) {
      return await this.refreshAccessToken(installation);
    }

    return installation.access_token;
  }

  // Refresh access token
  async refreshAccessToken(installation) {
    try {
      const tokenResponse = await axios.post(
        'https://services.leadconnectorhq.com/oauth/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: installation.refresh_token,
          redirect_uri: this.redirectUri
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const newExpiresAt = new Date(Date.now() + (expires_in * 1000));

      await this.db.query(`
        UPDATE ghl_installations
        SET access_token = $1,
            refresh_token = $2,
            expires_at = $3,
            last_token_refresh = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE location_id = $4
      `, [access_token, refresh_token, newExpiresAt, installation.location_id]);

      // Log successful refresh
      await this.db.query(`
        INSERT INTO ghl_token_refresh_log
        (location_id, success, old_expires_at, new_expires_at)
        VALUES ($1, true, $2, $3)
      `, [installation.location_id, installation.expires_at, newExpiresAt]);

      return access_token;

    } catch (error) {
      // Log failed refresh
      await this.db.query(`
        INSERT INTO ghl_token_refresh_log
        (location_id, success, error_message)
        VALUES ($1, false, $2)
      `, [installation.location_id, error.message]);

      throw error;
    }
  }

  // Make authenticated API call to GHL
  async makeAPICall(locationId, method, endpoint, data = null) {
    const accessToken = await this.getValidAccessToken(locationId);

    const config = {
      method: method,
      url: `https://services.leadconnectorhq.com${endpoint}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    return await axios(config);
  }
}

// Usage
const tokenManager = new GHLTokenManager(dbPool, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// After OAuth callback
await tokenManager.saveInitialTokens(authCode);

// Make API calls
const contacts = await tokenManager.makeAPICall(
  locationId,
  'GET',
  '/contacts/'
);
```

### Evolution API Security

```javascript
// API Key authentication
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function callEvolutionAPI(endpoint, method = 'GET', data = null) {
  const config = {
    method: method,
    url: `${EVOLUTION_URL}${endpoint}`,
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  return await axios(config);
}

// Verify webhook authenticity (custom implementation)
function verifyEvolutionWebhook(req) {
  const apikey = req.body.apikey;
  return apikey === EVOLUTION_API_KEY;
}
```

---

## IMPLEMENTATION EXAMPLES

### Complete Integration Example

```javascript
const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize token manager
const ghlTokenManager = new GHLTokenManager(
  db,
  process.env.GHL_CLIENT_ID,
  process.env.GHL_CLIENT_SECRET,
  process.env.GHL_REDIRECT_URI
);

// ==========================================
// GHL OAuth Flow
// ==========================================

app.get('/auth/ghl', (req, res) => {
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(process.env.GHL_REDIRECT_URI)}&` +
    `client_id=${process.env.GHL_CLIENT_ID}&` +
    `scope=${encodeURIComponent('contacts.write conversations.write')}`;

  res.redirect(authUrl);
});

app.get('/auth/ghl/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const result = await ghlTokenManager.saveInitialTokens(code, 'Company');
    res.send(`Installation successful! Location ID: ${result.locationId}`);
  } catch (error) {
    res.status(500).send('Installation failed: ' + error.message);
  }
});

// ==========================================
// Evolution API Setup
// ==========================================

app.post('/setup/evolution-instance', async (req, res) => {
  try {
    const { locationId, instanceName } = req.body;

    // Create Evolution instance
    const createResponse = await axios.post(
      `${process.env.EVOLUTION_URL}/instance/create`,
      {
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      },
      {
        headers: { 'apikey': process.env.EVOLUTION_API_KEY }
      }
    );

    // Configure webhook
    await axios.post(
      `${process.env.EVOLUTION_URL}/webhook/set/${instanceName}`,
      {
        url: `${process.env.BASE_URL}/webhooks/evolution`,
        webhookByEvents: false,
        webhookBase64: true,
        events: [
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT'
        ]
      },
      {
        headers: { 'apikey': process.env.EVOLUTION_API_KEY }
      }
    );

    // Save mapping
    await db.query(`
      INSERT INTO ghl_evolution_mapping (location_id, instance_name)
      VALUES ($1, $2)
      ON CONFLICT (location_id) DO UPDATE SET instance_name = EXCLUDED.instance_name
    `, [locationId, instanceName]);

    // Get QR code
    const connectResponse = await axios.get(
      `${process.env.EVOLUTION_URL}/instance/connect/${instanceName}`,
      {
        headers: { 'apikey': process.env.EVOLUTION_API_KEY }
      }
    );

    res.json({
      success: true,
      instanceName: instanceName,
      qrcode: connectResponse.data.qrcode
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GHL Webhooks → Send WhatsApp
// ==========================================

app.post('/webhooks/gohighlevel', async (req, res) => {
  try {
    const { type, location_id, contact, opportunity } = req.body;

    // Get Evolution instance for this location
    const mapping = await db.query(`
      SELECT instance_name FROM ghl_evolution_mapping WHERE location_id = $1
    `, [location_id]);

    if (!mapping.rows[0]) {
      return res.status(404).json({ error: 'No Evolution instance configured' });
    }

    const instanceName = mapping.rows[0].instance_name;

    // Handle different GHL events
    if (type === 'OpportunityCreate') {
      await axios.post(
        `${process.env.EVOLUTION_URL}/message/sendText/${instanceName}`,
        {
          number: opportunity.contact.phone.replace(/\D/g, ''),
          text: `Hi ${opportunity.contact.firstName}! ` +
                `We received your inquiry for ${opportunity.name}. ` +
                `Our team will contact you soon!`
        },
        {
          headers: { 'apikey': process.env.EVOLUTION_API_KEY }
        }
      );
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('GHL webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Evolution Webhooks → Update GHL
// ==========================================

app.post('/webhooks/evolution', async (req, res) => {
  try {
    const { event, instance, data } = req.body;

    // Get location for this instance
    const mapping = await db.query(`
      SELECT location_id FROM ghl_evolution_mapping WHERE instance_name = $1
    `, [instance]);

    if (!mapping.rows[0]) {
      return res.status(200).json({ received: true });
    }

    const locationId = mapping.rows[0].location_id;

    // Handle incoming WhatsApp messages
    if (event === 'messages.upsert' && !data.key.fromMe) {
      const phone = data.key.remoteJid.replace('@s.whatsapp.net', '');
      const messageText = data.message?.conversation ||
                          data.message?.extendedTextMessage?.text || '';

      // Get GHL access token
      const accessToken = await ghlTokenManager.getValidAccessToken(locationId);

      // Create/update contact in GHL
      await axios.post(
        'https://services.leadconnectorhq.com/contacts/upsert',
        {
          locationId: locationId,
          phone: phone,
          tags: ['WhatsApp'],
          customFields: [
            {
              key: 'last_whatsapp_message',
              value: messageText
            },
            {
              key: 'last_whatsapp_contact',
              value: new Date().toISOString()
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28'
          }
        }
      );

      // Send message to GHL conversation
      const contactResponse = await axios.get(
        `https://services.leadconnectorhq.com/contacts/lookup?phone=${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28'
          }
        }
      );

      if (contactResponse.data.contacts?.length > 0) {
        const contactId = contactResponse.data.contacts[0].id;

        await axios.post(
          `https://services.leadconnectorhq.com/conversations/messages`,
          {
            type: 'SMS',
            contactId: contactId,
            message: `[WhatsApp] ${messageText}`
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Version': '2021-07-28'
            }
          }
        );
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Evolution webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Manual Message Sending
// ==========================================

app.post('/send-whatsapp', async (req, res) => {
  try {
    const { locationId, phone, message, mediaUrl } = req.body;

    // Get Evolution instance
    const mapping = await db.query(`
      SELECT instance_name FROM ghl_evolution_mapping WHERE location_id = $1
    `, [locationId]);

    if (!mapping.rows[0]) {
      return res.status(404).json({ error: 'No instance configured' });
    }

    const instanceName = mapping.rows[0].instance_name;

    // Send message or media
    let endpoint, payload;

    if (mediaUrl) {
      endpoint = `/message/sendMedia/${instanceName}`;
      payload = {
        number: phone.replace(/\D/g, ''),
        mediatype: 'image',
        media: mediaUrl,
        caption: message
      };
    } else {
      endpoint = `/message/sendText/${instanceName}`;
      payload = {
        number: phone.replace(/\D/g, ''),
        text: message
      };
    }

    const response = await axios.post(
      `${process.env.EVOLUTION_URL}${endpoint}`,
      payload,
      {
        headers: { 'apikey': process.env.EVOLUTION_API_KEY }
      }
    );

    res.json({ success: true, messageId: response.data.key?.id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Health Check & Status
// ==========================================

app.get('/status/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;

    // Get mapping
    const mapping = await db.query(`
      SELECT instance_name FROM ghl_evolution_mapping WHERE location_id = $1
    `, [locationId]);

    if (!mapping.rows[0]) {
      return res.status(404).json({ error: 'Not configured' });
    }

    const instanceName = mapping.rows[0].instance_name;

    // Check Evolution instance status
    const statusResponse = await axios.get(
      `${process.env.EVOLUTION_URL}/instance/connectionState/${instanceName}`,
      {
        headers: { 'apikey': process.env.EVOLUTION_API_KEY }
      }
    );

    // Check GHL token status
    const tokenResult = await db.query(`
      SELECT expires_at, last_token_refresh
      FROM ghl_installations
      WHERE location_id = $1
    `, [locationId]);

    res.json({
      locationId: locationId,
      instanceName: instanceName,
      whatsappStatus: statusResponse.data.state,
      ghlTokenExpiresAt: tokenResult.rows[0]?.expires_at,
      lastTokenRefresh: tokenResult.rows[0]?.last_token_refresh
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## QUICK REFERENCE

### Essential URLs

**GoHighLevel:**
- Auth: `https://marketplace.gohighlevel.com/oauth/chooselocation`
- API Base: `https://services.leadconnectorhq.com`
- Token: `https://services.leadconnectorhq.com/oauth/token`
- Docs: `https://marketplace.gohighlevel.com/docs`

**Evolution API:**
- GitHub: `https://github.com/EvolutionAPI/evolution-api`
- Docs: `https://doc.evolution-api.com`
- Postman: `https://evolution-api.com/postman`
- Discord: `https://evolution-api.com/discord`

### Environment Variables Template

```bash
# ===========================================
# GHL Configuration
# ===========================================
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_REDIRECT_URI=https://yourdomain.com/auth/ghl/callback
GHL_WEBHOOK_SECRET=your_webhook_secret

# ===========================================
# Evolution API
# ===========================================
EVOLUTION_URL=http://localhost:8080
EVOLUTION_API_KEY=your_secure_api_key

# ===========================================
# Database
# ===========================================
DATABASE_URL=postgresql://user:pass@localhost:5432/integration_db

# ===========================================
# Server
# ===========================================
BASE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
```

### Common Phone Number Formats

```javascript
// GHL uses various formats
const ghlPhone = "+1 (555) 123-4567";

// Evolution needs clean format
const evolutionPhone = ghlPhone.replace(/\D/g, ''); // "15551234567"

// WhatsApp JID format
const whatsappJid = `${evolutionPhone}@s.whatsapp.net`;

// Group JID format
const groupJid = "120363XXXXX@g.us";
```

### Rate Limit Handling

```javascript
// GHL rate limits
async function callGHLWithRetry(config, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 10;
        await sleep(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## FILE LOCATIONS

All research documentation files are located at: `/Users/rayalvarado/Desktop/ghl/`

### Primary Documentation Files

1. **gohighlevel-documentation.md** (1,761 lines, 42KB)
   - Complete GHL developer guide
   - OAuth 2.0 implementation
   - SDK examples
   - Webhook integration
   - All API endpoints

2. **EVOLUTION_API_COMPLETE_DOCUMENTATION.md** (3,335 lines)
   - Complete Evolution API documentation
   - All 100+ endpoints with examples
   - Integration guides
   - Database schemas
   - Docker configuration

3. **REFRESH-TOKEN-IMPLEMENTATION.md**
   - PostgreSQL schema for token management
   - GHLTokenManager JavaScript class
   - Express routes
   - Security best practices

4. **N8N-TOKEN-REFRESH-WORKFLOW.md**
   - 4 complete n8n workflows
   - Auto-refresh configuration
   - PostgreSQL integration
   - Webhook handlers

5. **n8n-ghl-token-refresh.json**
   - Importable n8n workflow
   - Ready-to-use automation

6. **EXTRACTION-SUMMARY.md**
   - Research statistics
   - File structure
   - API module breakdown

7. **README.md** (8.3KB)
   - Navigation guide
   - Quick links
   - Documentation index

8. **KNOWLEDGE-BASE-MASTER.md** (this file)
   - Consolidated knowledge base
   - Quick reference
   - Integration strategies

### Repository Directories

- **highlevel-api-docs/** (119+ files, 4.2MB)
  - Complete GHL API specifications
  - OAuth documentation
  - Webhook event definitions

- **evolution-api/** (Git repository)
  - Complete Evolution API source code
  - Docker configurations
  - Prisma schemas

---

## NEXT STEPS & RECOMMENDATIONS

### For New Projects

1. **Setup Phase:**
   - Deploy Evolution API (Docker recommended)
   - Configure PostgreSQL databases
   - Set up GHL OAuth application
   - Configure webhook endpoints

2. **Integration Phase:**
   - Implement token refresh automation
   - Create webhook handlers
   - Map GHL locations to Evolution instances
   - Test bidirectional sync

3. **Production Phase:**
   - Monitor token expiration
   - Log all webhook events
   - Implement error handling
   - Set up alerts for failures

### For Context Recovery

If you lose context or need to refresh knowledge:

1. Read this file: **KNOWLEDGE-BASE-MASTER.md**
2. Reference specific docs:
   - GHL: **gohighlevel-documentation.md**
   - Evolution: **EVOLUTION_API_COMPLETE_DOCUMENTATION.md**
3. Check implementation examples:
   - **REFRESH-TOKEN-IMPLEMENTATION.md**
   - **N8N-TOKEN-REFRESH-WORKFLOW.md**

### Common Issues & Solutions

**Issue: GHL token expired**
- Solution: Run token refresh workflow (see REFRESH-TOKEN-IMPLEMENTATION.md)

**Issue: Evolution instance disconnected**
- Solution: Check QR code expiration, restart instance

**Issue: Webhook not receiving events**
- Solution: Verify URL accessibility, check webhook configuration

**Issue: Message delivery failure**
- Solution: Verify phone number format, check instance connection status

---

## VERSION HISTORY

- **v1.0** (October 30, 2025) - Initial comprehensive knowledge base
  - Complete GHL API documentation (136 pages)
  - Complete Evolution API documentation (3,335 lines)
  - Token refresh implementation
  - n8n workflow automation
  - Integration strategies
  - Database schemas
  - Webhook configurations

---

## SUPPORT & RESOURCES

**GoHighLevel:**
- Support: https://support.gohighlevel.com
- Community: https://www.facebook.com/groups/gohighlevel
- API Status: https://status.gohighlevel.com

**Evolution API:**
- Discord: https://evolution-api.com/discord
- WhatsApp Group: https://evolution-api.com/whatsapp
- Issues: https://github.com/EvolutionAPI/evolution-api/issues
- Premium Support: https://evolution-api.com/suporte-pro

---

**END OF KNOWLEDGE BASE**

This document contains all critical information for GoHighLevel and Evolution API integration projects. All detailed specifications, code examples, and configurations are available in the referenced documentation files.
