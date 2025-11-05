# N8N COMPREHENSIVE REFERENCE GUIDE
## Complete API Documentation, Architecture & Integration Guide for OAuth/Webhook Projects

**Document Version:** 1.0
**Date:** 2025-11-02
**Target Use Case:** GoHighLevel OAuth Callbacks + n8n Middleware + External Backend Integration

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Repository Structure](#2-repository-structure)
3. [n8n REST API Reference](#3-n8n-rest-api-reference)
4. [Webhooks Deep Dive](#4-webhooks-deep-dive)
5. [OAuth & Credentials Management](#5-oauth--credentials-management)
6. [Workflow Execution & Data Flow](#6-workflow-execution--data-flow)
7. [Error Handling & Retry Logic](#7-error-handling--retry-logic)
8. [Self-Hosting Configuration](#8-self-hosting-configuration)
9. [HTTP Request Node & External APIs](#9-http-request-node--external-apis)
10. [Code/Function Nodes](#10-codefunction-nodes)
11. [Use Case Implementation Guide](#11-use-case-implementation-guide)
12. [Best Practices & Security](#12-best-practices--security)
13. [References & Resources](#13-references--resources)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 What is n8n?

n8n is a fair-code workflow automation platform designed for technical teams that provides:
- **Hybrid Development**: JavaScript/Python coding alongside visual workflow building
- **400+ Integrations**: Pre-built nodes for APIs, databases, and services
- **Native AI Capabilities**: LangChain-based agent workflows
- **Self-Hosting**: Fair-code license for complete control
- **Enterprise Features**: SSO, permissions, air-gapped deployments

### 1.2 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                         n8n Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   REST API   │  │   Webhooks   │      │
│  │  (Editor UI) │  │   Endpoints  │  │   Listener   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Workflow Execution Engine (Core)          │   │
│  │  - Node Processing  - Data Flow  - Error Handling   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Credentials │  │   Database   │  │   Nodes Base │      │
│  │    Store     │  │ (PostgreSQL/ │  │  (400+ nodes)│      │
│  │  (Encrypted) │  │   SQLite)    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Key Technical Characteristics

- **Language**: TypeScript (90.6%), Vue.js (7.8%)
- **Runtime**: Node.js (>=22.16 required)
- **Package Manager**: pnpm (>=10.2.1)
- **Build System**: Turbo (monorepo)
- **Default Port**: 5678
- **Repository**: https://github.com/n8n-io/n8n
- **Stars**: 154k+ | **Forks**: 49k+ | **Contributors**: 556+

---

## 2. REPOSITORY STRUCTURE

### 2.1 Monorepo Organization

n8n uses a **pnpm workspace monorepo** structure:

```
n8n-monorepo/
├── packages/                    # Main packages directory
│   ├── @n8n/                   # Scoped namespace packages
│   │   ├── api-types/          # API TypeScript definitions
│   │   ├── chat/               # Chat interface
│   │   ├── client-oauth2/      # OAuth2 client library
│   │   ├── codemirror-lang/    # Code editor language support
│   │   ├── composables/        # Vue composables
│   │   ├── config/             # Configuration utilities
│   │   ├── design-system/      # UI component library
│   │   ├── di/                 # Dependency injection
│   │   ├── eslint-config/      # Linting rules
│   │   ├── extension-sdk/      # Extensions SDK
│   │   ├── imap/               # IMAP protocol support
│   │   ├── json-schema-to-zod/ # Schema validation
│   │   ├── benchmark/          # Performance testing
│   │   ├── nodes-langchain/    # LangChain AI nodes
│   │   ├── permissions/        # RBAC permissions
│   │   ├── task-runner/        # Background tasks
│   │   └── utils/              # Shared utilities
│   │
│   ├── cli/                    # Command-line interface
│   │   ├── src/                # CLI source code
│   │   ├── commands/           # CLI commands
│   │   └── server/             # HTTP server setup
│   │
│   ├── core/                   # Core workflow engine
│   │   ├── src/                # Core logic
│   │   ├── WorkflowExecute.ts  # Execution orchestration
│   │   ├── NodeExecuteFunctions.ts # Node helpers
│   │   └── Webhook.ts          # Webhook handling
│   │
│   ├── editor-ui/              # Vue.js frontend editor
│   │   ├── src/                # Frontend source
│   │   ├── components/         # Vue components
│   │   ├── views/              # Page views
│   │   └── stores/             # Pinia state stores
│   │
│   ├── workflow/               # Workflow definitions
│   │   ├── src/                # Workflow logic
│   │   ├── Workflow.ts         # Workflow class
│   │   └── NodeHelpers.ts      # Node utilities
│   │
│   ├── nodes-base/             # Built-in nodes (400+)
│   │   ├── nodes/              # All node implementations
│   │   │   ├── Webhook/        # Webhook node
│   │   │   ├── HttpRequest/    # HTTP Request node
│   │   │   ├── Code/           # Code (JS/Python) node
│   │   │   ├── Function/       # Legacy Function node
│   │   │   ├── Set/            # Data transformation
│   │   │   ├── If/             # Conditional logic
│   │   │   └── ... (400+ more)
│   │   └── credentials/        # Credential definitions
│   │       ├── HttpBasicAuth.credentials.ts
│   │       ├── OAuth2Api.credentials.ts
│   │       ├── HighLevelOAuth2Api.credentials.ts
│   │       └── ... (many more)
│   │
│   ├── node-dev/               # Node development tools
│   ├── testing/                # Testing utilities
│   └── extensions/insights/    # Analytics extensions
│
├── docker/                      # Docker configurations
│   └── images/
│       └── n8n/                # n8n Docker image
│           ├── Dockerfile
│           └── docker-compose.yml
│
├── scripts/                     # Build & utility scripts
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turbo build config
├── package.json                # Root package.json
└── README.md                   # Main documentation
```

### 2.2 Key Packages Explained

| Package | Purpose | Key Files |
|---------|---------|-----------|
| **cli** | Entry point for n8n server, handles HTTP server, routes, and initialization | `src/Server.ts`, `src/WebhookServer.ts` |
| **core** | Workflow execution engine, processes nodes, manages data flow | `src/WorkflowExecute.ts`, `src/Webhook.ts` |
| **editor-ui** | Vue.js frontend application, visual workflow editor | `src/views/`, `src/components/` |
| **workflow** | Workflow definition logic, parsing, validation | `src/Workflow.ts`, `src/WorkflowDataProxy.ts` |
| **nodes-base** | All built-in nodes (Webhook, HTTP Request, Code, etc.) | `nodes/`, `credentials/` |
| **@n8n/api-types** | TypeScript types for API requests/responses | Type definitions |

### 2.3 Development Workflow

```bash
# Clone repository
git clone https://github.com/n8n-io/n8n.git
cd n8n

# Install dependencies (requires pnpm)
pnpm install

# Build all packages
pnpm build

# Start development mode (hot reload)
pnpm dev

# Run tests
pnpm test
```

---

## 3. N8N REST API REFERENCE

### 3.1 API Overview

**Base URL**: `https://your-n8n-instance.com/api/v1`
**Authentication**: API Key in header `X-N8N-API-KEY`
**Content-Type**: `application/json`

### 3.2 Authentication Setup

1. **Create API Key**:
   - Log in to n8n
   - Go to **Settings** > **n8n API**
   - Click **Create an API key**
   - Copy and securely store the key

2. **Use API Key in Requests**:
```bash
curl -X GET "https://your-n8n.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: your-api-key-here" \
  -H "Content-Type: application/json"
```

### 3.3 API Endpoints

#### 3.3.1 Workflows Management

**List All Workflows**
```http
GET /api/v1/workflows
```
```bash
curl -X GET "https://your-n8n.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: your_api_key"
```

**Get Workflow by ID**
```http
GET /api/v1/workflows/{id}
```

**Create Workflow**
```http
POST /api/v1/workflows
Content-Type: application/json

{
  "name": "My OAuth Workflow",
  "nodes": [
    {
      "id": "webhook-node",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "path": "oauth/callback",
        "httpMethod": "GET",
        "responseMode": "lastNode"
      }
    },
    {
      "id": "http-request",
      "name": "Save to Backend",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300],
      "parameters": {
        "url": "https://whatsapp.cloude.es/api/save-token",
        "method": "POST",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "code",
              "value": "={{$json.query.code}}"
            },
            {
              "name": "location_id",
              "value": "={{$json.query.location_id}}"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Save to Backend",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "active": true
}
```

**Update Workflow**
```http
PUT /api/v1/workflows/{id}
```

**Delete Workflow**
```http
DELETE /api/v1/workflows/{id}
```

**Activate/Deactivate Workflow**
```http
PATCH /api/v1/workflows/{id}

{
  "active": true
}
```

#### 3.3.2 Execute Workflow (NEW in recent versions)

```http
POST /api/v1/workflows/{id}/execute
```

**Example:**
```bash
curl -X POST "https://your-n8n.com/api/v1/workflows/123/execute" \
  -H "X-N8N-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "customParam": "value"
    }
  }'
```

**Response:**
```json
{
  "executionId": 456,
  "waitingForWebhook": false
}
```

#### 3.3.3 Executions Management

**List Executions**
```http
GET /api/v1/executions?workflowId={workflowId}
```

**Get Execution by ID**
```http
GET /api/v1/executions/{executionId}
```

**Delete Execution**
```http
DELETE /api/v1/executions/{executionId}
```

#### 3.3.4 Credentials Management

**List Credentials**
```http
GET /api/v1/credentials
```

**Create Credential**
```http
POST /api/v1/credentials

{
  "name": "My OAuth2 Credential",
  "type": "oAuth2Api",
  "data": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "accessTokenUrl": "https://api.service.com/oauth/token",
    "authUrl": "https://api.service.com/oauth/authorize",
    "grantType": "authorizationCode"
  }
}
```

**Note**: OAuth2 credential data schema is complex. For GoHighLevel:
```json
{
  "name": "GoHighLevel OAuth2",
  "type": "highLevelOAuth2Api",
  "data": {
    "clientId": "{{YOUR_CLIENT_ID}}",
    "clientSecret": "{{YOUR_CLIENT_SECRET}}",
    "scope": "locations.readonly contacts.readonly contacts.write opportunities.readonly opportunities.write users.readonly"
  }
}
```

### 3.4 API Playground (Swagger UI)

For **self-hosted instances**, n8n provides a built-in Swagger UI:

**URL**: `https://your-n8n-instance.com/api-docs`

This interactive playground allows you to:
- Browse all available endpoints
- Test API calls directly
- See request/response schemas
- Generate code examples

### 3.5 API Rate Limits & Pagination

- **Rate Limits**: No strict limits on self-hosted instances
- **Pagination**: Use `limit` and `offset` query parameters
```http
GET /api/v1/workflows?limit=50&offset=100
```

---

## 4. WEBHOOKS DEEP DIVE

### 4.1 Webhook Fundamentals

Webhooks in n8n allow external services to trigger workflows by making HTTP requests.

**Key Concepts:**
- **Test URL**: For development/debugging (`/webhook-test/path`)
- **Production URL**: For live usage (`/webhook/path`)
- **Response Modes**: Control how n8n responds to the caller
- **Authentication**: Optional security for webhook endpoints

### 4.2 Webhook URL Structure

#### Production Webhook
```
https://{N8N_HOST}/webhook/{custom-path}
```

#### Test Webhook
```
https://{N8N_HOST}/webhook-test/{custom-path}
```

**Example:**
- Production: `https://n8n.example.com/webhook/ghl-oauth-callback`
- Test: `https://n8n.example.com/webhook-test/ghl-oauth-callback`

### 4.3 Webhook Node Configuration

#### 4.3.1 Basic Settings

| Parameter | Description | Options |
|-----------|-------------|---------|
| **HTTP Method** | Request method to accept | GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS |
| **Path** | Custom URL path | e.g., `oauth/callback`, `ghl/webhook` |
| **Authentication** | Require auth for requests | None, Basic Auth, Header Auth |
| **Response Mode** | How to respond | See below |

#### 4.3.2 Response Modes Explained

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Immediately** | Returns `200 OK` with message "Workflow got started" instantly | Fire-and-forget, long-running workflows |
| **When Last Node Finishes** | Returns response from the last executed node | API endpoints, synchronous processing |
| **Using 'Respond to Webhook' Node** | Custom response via dedicated node | Advanced control over status, headers, body |
| **Streaming Response** | Real-time data streaming | AI agents, SSE (Server-Sent Events) |

#### 4.3.3 Response Data Options (for "Last Node" mode)

| Option | Description |
|--------|-------------|
| **All Entries** | Returns array of all items from last node |
| **First Entry JSON** | Returns first item as JSON object |
| **First Entry Binary** | Returns binary data (files) |
| **No Response Body** | Returns empty body with status code |

### 4.4 Webhook Authentication

#### 4.4.1 No Authentication
```javascript
// No auth - open endpoint (use with caution!)
```

#### 4.4.2 Basic Auth
```javascript
// Webhook Node Settings:
Authentication: Basic Auth
User: webhook_user
Password: secure_password_123

// Caller must send:
Authorization: Basic d2ViaG9va191c2VyOnNlY3VyZV9wYXNzd29yZF8xMjM=
```

#### 4.4.3 Header Auth
```javascript
// Webhook Node Settings:
Authentication: Header Auth
Header Name: X-Webhook-Token
Header Value: your-secret-token-here

// Caller must send:
X-Webhook-Token: your-secret-token-here
```

### 4.5 Accessing Webhook Data

#### Query Parameters (GET requests)
```javascript
// URL: https://n8n.com/webhook/callback?code=abc123&state=xyz
// Access in Code node:
const code = $input.item.json.query.code;        // "abc123"
const state = $input.item.json.query.state;      // "xyz"
```

#### Body Data (POST requests)
```javascript
// POST body: {"user_id": 456, "event": "purchase"}
// Access in Code node:
const userId = $input.item.json.body.user_id;    // 456
const event = $input.item.json.body.event;       // "purchase"
```

#### Headers
```javascript
// Access headers:
const userAgent = $input.item.json.headers['user-agent'];
const contentType = $input.item.json.headers['content-type'];
```

### 4.6 Respond to Webhook Node

For advanced response control, use the **Respond to Webhook** node:

#### Configuration
```javascript
// Webhook Node:
Response Mode: "Using 'Respond to Webhook' Node"

// Respond to Webhook Node (placed later in workflow):
Response Code: 200
Response Headers:
  Content-Type: application/json
Response Body:
{
  "success": true,
  "message": "OAuth callback received",
  "data": {
    "token_saved": true,
    "timestamp": "{{$now}}"
  }
}
```

#### Custom Status Codes
```javascript
// Success responses:
200 - OK
201 - Created
202 - Accepted

// Client errors:
400 - Bad Request
401 - Unauthorized
404 - Not Found

// Server errors:
500 - Internal Server Error
```

### 4.7 Webhook Best Practices

1. **Use Test URLs during development**
   - Easier debugging
   - View incoming data in editor
   - Test without affecting production

2. **Always authenticate production webhooks**
   - Prevent unauthorized access
   - Use strong tokens/passwords
   - Rotate credentials regularly

3. **Set appropriate response modes**
   - Use "Immediately" for async processing
   - Use "Last Node" for API endpoints
   - Use "Respond to Webhook" for custom responses

4. **Handle errors gracefully**
   - Use Error Trigger workflows
   - Return meaningful error messages
   - Log failures for debugging

5. **Validate incoming data**
   - Check for required fields
   - Sanitize inputs
   - Handle malformed requests

### 4.8 Webhook Troubleshooting

#### Common Issues

**1. Webhook URL shows `localhost`**
```bash
# Solution: Set WEBHOOK_URL environment variable
WEBHOOK_URL=https://your-public-domain.com
```

**2. Production webhook not triggering**
```bash
# Ensure workflow is activated
# Check workflow execution logs
# Verify webhook path is correct
```

**3. CORS errors**
```javascript
// Use Respond to Webhook node with headers:
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

**4. Payload too large (>16MB)**
```bash
# Increase max payload size in environment variables:
N8N_PAYLOAD_SIZE_MAX=32
```

---

## 5. OAUTH & CREDENTIALS MANAGEMENT

### 5.1 How Credentials Work in n8n

**Credentials** are securely stored authentication information used to connect workflows to external services.

**Key Features:**
- **Encrypted Storage**: All credentials are encrypted in the database
- **Shareable**: Credentials can be shared with team members (enterprise)
- **Reusable**: Same credential used across multiple workflows
- **Types**: OAuth2, API Key, Basic Auth, Custom, etc.

### 5.2 OAuth2 Flow in n8n

#### Standard OAuth2 Authorization Code Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User      │         │    n8n      │         │  OAuth      │
│  (Browser)  │         │  Instance   │         │  Provider   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  1. Click "Authorize" │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │                       │  2. Redirect to Auth  │
       │                       │──────────────────────>│
       │                       │                       │
       │  3. Authorization Page                        │
       │<──────────────────────────────────────────────┤
       │                       │                       │
       │  4. User Grants Access│                       │
       │──────────────────────────────────────────────>│
       │                       │                       │
       │                       │  5. Redirect with code│
       │                       │<──────────────────────┤
       │                       │                       │
       │                       │  6. Exchange code for │
       │                       │     access token      │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │  7. Return tokens     │
       │                       │<──────────────────────┤
       │                       │                       │
       │                       │  8. Store encrypted   │
       │                       │     tokens in DB      │
       │                       │                       │
```

### 5.3 OAuth2 Credential Setup

#### 5.3.1 Generic OAuth2 Credential

```javascript
// Credential Name: My OAuth2 Service
// Credential Type: OAuth2 API

// Grant Type: Authorization Code
{
  "authUrl": "https://provider.com/oauth/authorize",
  "accessTokenUrl": "https://provider.com/oauth/token",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "scope": "read write",
  "authQueryParameters": "",
  "authentication": "header" // or "body"
}
```

#### 5.3.2 GoHighLevel OAuth2 Setup

**Step 1: Create App in GoHighLevel**
1. Go to https://marketplace.gohighlevel.com/
2. Navigate to **My Apps** > **Create App**
3. Set **Distribution Type**: Sub-Account
4. Add **OAuth Redirect URL**: `https://your-n8n.com/rest/oauth2-credential/callback`

**Step 2: Create Credential in n8n**
```javascript
// Credential Name: GoHighLevel OAuth2
// Credential Type: HighLevel OAuth2 API

{
  "clientId": "{{GHL_CLIENT_ID}}",
  "clientSecret": "{{GHL_CLIENT_SECRET}}",
  "scope": "locations.readonly contacts.readonly contacts.write opportunities.readonly opportunities.write users.readonly"
}
```

**OAuth Callback URL Format:**
- **n8n Cloud**: `https://oauth.n8n.cloud/oauth2/callback`
- **Self-Hosted**: `https://your-n8n-domain.com/rest/oauth2-credential/callback`

### 5.4 Using OAuth2 Credentials in Workflows

#### 5.4.1 With Built-in Nodes
```javascript
// HighLevel Node
// Credential: Select your "GoHighLevel OAuth2" credential
// The node automatically handles token refresh
```

#### 5.4.2 With HTTP Request Node
```javascript
// HTTP Request Node
// Authentication: "Predefined Credential Type"
// Credential Type: "HighLevel OAuth2 API"
// Credential: Select your credential

// n8n will automatically:
// - Add Authorization header with access token
// - Refresh token when expired
// - Handle token rotation
```

### 5.5 Client Credentials Grant Type

For server-to-server communication (no user authorization):

```javascript
// OAuth2 Credential
// Grant Type: Client Credentials

{
  "accessTokenUrl": "https://api.service.com/oauth/token",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "scope": "api.read api.write",
  "authentication": "header" // Send credentials as Basic Auth header
}
```

**Use Case Example:**
```bash
# Token request (automatic by n8n):
POST /oauth/token
Authorization: Basic base64(clientId:clientSecret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=api.read api.write
```

### 5.6 Credential API Management

#### Create Credential via API
```bash
curl -X POST "https://your-n8n.com/api/v1/credentials" \
  -H "X-N8N-API-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Credential",
    "type": "httpBasicAuth",
    "data": {
      "user": "api_user",
      "password": "api_password"
    }
  }'
```

#### List Credentials
```bash
curl -X GET "https://your-n8n.com/api/v1/credentials" \
  -H "X-N8N-API-KEY: your_api_key"
```

### 5.7 Custom Authentication Methods

#### Header Authentication
```javascript
// HTTP Request Node
// Authentication: Generic Credential Type > Header Auth

// Credential Config:
{
  "name": "X-API-Key",
  "value": "your-api-key-here"
}

// Sent as:
X-API-Key: your-api-key-here
```

#### Custom Auth (Multiple Parameters)
```javascript
// Custom Auth Credential
{
  "headers": {
    "X-API-Key": "key123",
    "X-API-Secret": "secret456"
  },
  "qs": {
    "auth_token": "token789"
  }
}
```

### 5.8 Credential Security Best Practices

1. **Never hardcode credentials**
   - Always use n8n's credential system
   - Credentials are encrypted at rest

2. **Use least privilege scopes**
   - Request only necessary OAuth scopes
   - Minimize API permissions

3. **Rotate credentials regularly**
   - Update API keys periodically
   - Monitor for unauthorized access

4. **Share credentials carefully**
   - Use role-based access control (RBAC)
   - Audit credential usage

5. **Environment variable secrets**
   - Store sensitive config in env vars
   - Never commit secrets to version control

---

## 6. WORKFLOW EXECUTION & DATA FLOW

### 6.1 How Workflows Execute

**Execution Model:**
1. **Trigger**: Workflow starts (manual, webhook, schedule, etc.)
2. **Node Processing**: Nodes execute in order based on connections
3. **Data Passing**: Output of one node becomes input of next
4. **Completion**: Last node finishes, execution recorded

### 6.2 Data Structure in n8n

All data in n8n follows this structure:

```javascript
// Single item
{
  "json": {
    "key1": "value1",
    "key2": "value2"
  },
  "binary": {
    "data": {
      "data": "base64-encoded-data",
      "mimeType": "image/png",
      "fileName": "image.png"
    }
  }
}

// Array of items (standard n8n format)
[
  {
    "json": { "id": 1, "name": "John" }
  },
  {
    "json": { "id": 2, "name": "Jane" }
  }
]
```

### 6.3 Accessing Data Between Nodes

#### Expressions (Drag & Drop)
```javascript
// In any node parameter field:
{{ $json.fieldName }}              // Current item
{{ $json.user.email }}             // Nested field
{{ $json["field-with-dashes"] }}   // Field with special chars

// Previous node data:
{{ $('Previous Node').item.json.fieldName }}

// First item from previous node:
{{ $('Previous Node').first().json.fieldName }}

// All items:
{{ $('Previous Node').all() }}
```

#### In Code Node
```javascript
// Access input items
const items = $input.all();

// Single item mode (Run Once for Each Item)
const currentItem = $input.item.json;
const userId = currentItem.user_id;

// All items mode (Run Once for All Items)
const allItems = $input.all();
for (const item of allItems) {
  console.log(item.json.name);
}

// Return data (must be in this format!)
return [
  {
    json: {
      result: "success",
      processedData: yourData
    }
  }
];
```

### 6.4 Node Execution Modes

#### Run Once for All Items (Default)
```javascript
// Code runs ONCE regardless of input items
// Useful for: aggregation, batch processing

const items = $input.all();
const total = items.reduce((sum, item) => sum + item.json.amount, 0);

return [{ json: { total } }];
```

#### Run Once for Each Item
```javascript
// Code runs SEPARATELY for each input item
// Useful for: item-by-item transformations

const item = $input.item.json;
const fullName = `${item.firstName} ${item.lastName}`;

return { json: { ...item, fullName } };
```

### 6.5 Passing Data Between Workflows

#### Using Execute Workflow Node

**Parent Workflow:**
```javascript
// Execute Workflow Node
Workflow: "Child Workflow"
Mode: "Run Once for All Items"

// Pass data:
Source: "Define in Node"
Fields to Send:
  - user_id: {{ $json.id }}
  - email: {{ $json.email }}
```

**Child Workflow:**
```javascript
// Starts with: "Execute Workflow Trigger" node
// Access data:
const userId = $input.item.json.user_id;
const email = $input.item.json.email;

// Process and return
return [{ json: { status: "processed" } }];
```

**Parent Workflow (receiving response):**
```javascript
// Data from Execute Workflow node contains child's return value
const childResponse = $json.status; // "processed"
```

### 6.6 Context Variables

#### Built-in Variables

```javascript
// Workflow context
$workflow.id              // Current workflow ID
$workflow.name            // Current workflow name
$workflow.active          // Is workflow active

// Execution context
$execution.id             // Current execution ID
$execution.mode           // "manual", "trigger", "webhook"
$execution.resumeUrl      // URL to resume execution

// Date/Time
$now                      // Current timestamp (ISO format)
$today                    // Today's date (midnight)

// Node context
$nodeId                   // Current node ID
$runIndex                 // Current run index (for loops)

// Item context
$itemIndex                // Index of current item (starts at 0)
$items().length           // Total number of items

// Environment variables
$env.MY_VARIABLE          // Access env var MY_VARIABLE
```

### 6.7 Data Transformation Examples

#### Filter Items
```javascript
// If Node
Condition: {{ $json.status === "active" }}
// Only active items pass through
```

#### Map/Transform Items
```javascript
// Code Node
const items = $input.all();
const transformed = items.map(item => ({
  json: {
    id: item.json.id,
    fullName: `${item.json.firstName} ${item.json.lastName}`,
    email: item.json.email.toLowerCase(),
    timestamp: new Date().toISOString()
  }
}));

return transformed;
```

#### Aggregate Items
```javascript
// Code Node - Sum values
const items = $input.all();
const total = items.reduce((sum, item) => sum + (item.json.amount || 0), 0);

return [{ json: { total, count: items.length } }];
```

#### Merge Data from Multiple Nodes
```javascript
// Merge Node
Mode: "Combine"
// Combines all inputs into single output

// Or in Code Node:
const userData = $('Get User').first().json;
const ordersData = $('Get Orders').all();

return [{
  json: {
    user: userData,
    orders: ordersData.map(o => o.json),
    total_orders: ordersData.length
  }
}];
```

### 6.8 Execution Settings

#### Workflow Settings
```javascript
// Workflow Settings (gear icon in editor)
{
  "executionOrder": "v1",               // Execution order algorithm
  "executionTimeout": -1,               // Max execution time (seconds, -1 = no limit)
  "maxExecutionTimeout": 3600,          // Hard limit (1 hour)
  "saveExecutionProgress": true,        // Save intermediate results
  "saveDataErrorExecution": "all",      // Save data on error
  "saveDataSuccessExecution": "all"     // Save data on success
}
```

### 6.9 Debugging Data Flow

#### View Execution Data
1. **Run workflow** (Execute Workflow button)
2. Click on any node
3. View **Input** and **Output** tabs
4. See exact data passed between nodes

#### Logging
```javascript
// Code Node
console.log('Debug:', $json);           // Logs to n8n console
console.error('Error:', errorDetails);  // Log errors

// Check logs:
// Docker: docker logs n8n-container
// PM2: pm2 logs n8n
```

---

## 7. ERROR HANDLING & RETRY LOGIC

### 7.1 Error Handling Strategies

#### 7.1.1 Error Trigger Workflow

**Setup:**
1. Create a new workflow for error handling
2. Start with **Error Trigger** node
3. Configure error workflow in main workflow settings

**Main Workflow Settings:**
```javascript
// Workflow Settings > Error Workflow
Error Workflow: "Error Handler Workflow"
```

**Error Trigger Workflow:**
```javascript
// Error Trigger Node (start)
// Receives error data automatically:
{
  "execution": {
    "id": "123",
    "error": {
      "message": "Connection timeout",
      "stack": "...",
      "node": "HTTP Request"
    }
  },
  "workflow": {
    "id": "456",
    "name": "OAuth Workflow"
  }
}

// Then add:
// - Send email notification
// - Log to database
// - Send Slack alert
// - Retry logic
```

#### 7.1.2 Try/Catch Pattern with If Node

```javascript
// HTTP Request Node
Settings > Continue on Fail: true

// If Node (after HTTP Request)
Condition: {{ $json.error !== undefined }}

// If TRUE (error occurred):
// - Log error
// - Send notification
// - Return error response

// If FALSE (success):
// - Continue normal flow
```

#### 7.1.3 Node-Level Error Settings

**Continue on Fail:**
```javascript
// Node Settings (any node)
Settings > Continue On Fail: true

// If enabled:
// - Node doesn't stop workflow on error
// - Error data passed to next node
// - Check for errors in subsequent nodes
```

### 7.2 Retry Logic

#### 7.2.1 Built-in Retry (Limited)

Some nodes have basic retry settings:
```javascript
// HTTP Request Node
Settings > Retry On Fail: true
Max Retries: 3
Wait Between Tries (ms): 1000
```

**Limitations:**
- Fixed retry intervals (no exponential backoff)
- Limited to specific nodes
- No conditional retry logic

#### 7.2.2 Custom Retry Logic with Loop

**Approach 1: Function Node with Counter**
```javascript
// Set Node (initialize counter)
{
  "retryCount": 0,
  "maxRetries": 5,
  "success": false
}

// HTTP Request Node
Continue On Fail: true

// Code Node (check and retry)
const item = $input.item.json;

// Check if request succeeded
if (!item.error) {
  return { json: { ...item, success: true } };
}

// Check retry limit
if (item.retryCount >= item.maxRetries) {
  throw new Error('Max retries exceeded');
}

// Calculate exponential backoff
const delay = Math.pow(2, item.retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s

// Wait
await new Promise(resolve => setTimeout(resolve, delay));

// Increment counter and loop back
return {
  json: {
    ...item,
    retryCount: item.retryCount + 1
  }
};

// Connect this back to HTTP Request node
```

**Approach 2: Auto-Retry Workflow Template**

Use the community template: **"Auto-Retry Engine: Error Recovery Workflow"**

Features:
- Monitors failed executions
- Automatically retries on schedule
- Configurable retry conditions
- Exponential backoff support

#### 7.2.3 Conditional Retry (Only Specific Errors)

```javascript
// Code Node (after failed request)
const item = $input.item.json;
const error = item.error;

// Only retry on specific errors
const retryableErrors = [
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'socket hang up'
];

const statusCodesToRetry = [429, 500, 502, 503, 504];

const shouldRetry =
  retryableErrors.some(err => error.message?.includes(err)) ||
  statusCodesToRetry.includes(error.httpCode);

if (shouldRetry && item.retryCount < item.maxRetries) {
  // Exponential backoff
  const delay = Math.pow(2, item.retryCount) * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));

  return {
    json: {
      ...item,
      retryCount: (item.retryCount || 0) + 1
    }
  };
} else {
  throw new Error('Non-retryable error or max retries exceeded');
}
```

### 7.3 Error Handling Best Practices

#### 7.3.1 Always Validate Input
```javascript
// Code Node
const item = $input.item.json;

// Validate required fields
if (!item.user_id) {
  throw new Error('Missing required field: user_id');
}

if (!item.email || !item.email.includes('@')) {
  throw new Error('Invalid email address');
}

// Continue processing
```

#### 7.3.2 Graceful Degradation
```javascript
// Try primary API, fallback to secondary
// HTTP Request Node 1 (Primary API)
Continue On Fail: true

// If Node
Condition: {{ $json.error === undefined }}

// TRUE path: Process primary API response
// FALSE path: HTTP Request Node 2 (Fallback API)
```

#### 7.3.3 Comprehensive Error Logging
```javascript
// Code Node (in error branch)
const error = $input.item.json.error;
const errorLog = {
  timestamp: new Date().toISOString(),
  workflow_id: $workflow.id,
  workflow_name: $workflow.name,
  execution_id: $execution.id,
  node_name: error.node,
  error_message: error.message,
  error_stack: error.stack,
  input_data: $input.item.json
};

// HTTP Request to logging service
// Or write to database
return [{ json: errorLog }];
```

#### 7.3.4 User-Friendly Error Responses (for webhooks)
```javascript
// Respond to Webhook Node (in error branch)
Response Code: 500
Response Body:
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred processing your request",
    "details": "{{ $json.error.message }}"
  },
  "timestamp": "{{ $now }}"
}
```

### 7.4 Timeout Handling

#### Workflow-Level Timeout
```javascript
// Workflow Settings
Execution Timeout: 300  // 5 minutes

// When exceeded:
// - Execution stops
// - Error workflow triggered (if configured)
// - Status set to "timeout"
```

#### Node-Level Timeout
```javascript
// HTTP Request Node
Timeout: 30000  // 30 seconds

// If request takes longer:
// - Node throws timeout error
// - Can be caught with Continue On Fail
```

### 7.5 Monitoring & Alerting

#### Execution Status Monitoring
```javascript
// Scheduled workflow (runs hourly)
// HTTP Request to n8n API
GET /api/v1/executions?status=error&limit=100

// Filter recent failures
// Send alerts if failure rate > threshold
// Example: Slack notification, email, PagerDuty
```

#### Health Check Endpoint
```javascript
// Workflow with Webhook Trigger
Path: /health

// HTTP Request to external service (test connection)
// Return status:
{
  "status": "healthy",
  "timestamp": "{{ $now }}",
  "services": {
    "database": "connected",
    "api": "responding"
  }
}
```

---

## 8. SELF-HOSTING CONFIGURATION

### 8.1 Installation Methods

#### 8.1.1 Docker (Recommended)

**Quick Start:**
```bash
docker volume create n8n_data

docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

**Production with Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n_user
      POSTGRES_PASSWORD: n8n_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U n8n_user']
      interval: 10s
      timeout: 5s
      retries: 5

  n8n:
    image: docker.n8n.io/n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n_user
      - DB_POSTGRESDB_PASSWORD=n8n_password
      - N8N_PROTOCOL=https
      - N8N_HOST=n8n.example.com
      - WEBHOOK_URL=https://n8n.example.com
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_USER_MANAGEMENT_JWT_SECRET=${JWT_SECRET}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  n8n_data:
```

**Start Services:**
```bash
docker-compose up -d
```

#### 8.1.2 NPM (Direct Installation)

```bash
# Global installation
npm install n8n -g

# Start n8n
n8n start

# Access at http://localhost:5678
```

#### 8.1.3 NPX (No Installation)

```bash
npx n8n
```

### 8.2 Essential Environment Variables

#### 8.2.1 Database Configuration

**PostgreSQL (Recommended for Production):**
```bash
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=secure_password_here
DB_POSTGRESDB_SCHEMA=public
DB_POSTGRESDB_POOL_SIZE=2               # Number of parallel connections
DB_POSTGRESDB_SSL_CA=/path/to/ca.crt   # SSL certificate (optional)
DB_POSTGRESDB_SSL_CERT=/path/to/cert.crt
DB_POSTGRESDB_SSL_KEY=/path/to/key.key
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=true
```

**SQLite (Default, Development Only):**
```bash
DB_TYPE=sqlite
DB_SQLITE_VACUUM_ON_STARTUP=true
```

#### 8.2.2 Deployment Configuration

**Critical for Production:**
```bash
# Host Configuration
N8N_PROTOCOL=https                      # http or https
N8N_HOST=n8n.yourdomain.com            # Your public domain
N8N_PORT=5678                          # Internal port
N8N_LISTEN_ADDRESS=0.0.0.0             # Listen on all interfaces

# Webhook URL (MUST be set for reverse proxy setups)
WEBHOOK_URL=https://n8n.yourdomain.com

# Editor URL (if different from main URL)
N8N_EDITOR_BASE_URL=https://n8n.yourdomain.com
```

**Why WEBHOOK_URL is Critical:**
- n8n constructs webhook URLs from `N8N_PROTOCOL` + `N8N_HOST` + `N8N_PORT`
- Behind reverse proxy, this doesn't work (internal port ≠ public port)
- Setting `WEBHOOK_URL` explicitly ensures correct URLs
- External services (like OAuth providers) need the correct callback URL

#### 8.2.3 Security & Encryption

```bash
# Encryption Key (REQUIRED for production)
# Generate with: openssl rand -base64 32
N8N_ENCRYPTION_KEY=your-32-char-encryption-key-here

# JWT Secret (for user management)
# Generate with: openssl rand -base64 32
N8N_USER_MANAGEMENT_JWT_SECRET=your-jwt-secret-here

# Basic Auth (optional, for instance-level protection)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password

# Disable user management (single-user mode)
N8N_USER_MANAGEMENT_DISABLED=false
```

#### 8.2.4 Execution Settings

```bash
# Execution Mode
EXECUTIONS_MODE=regular                 # regular or queue
EXECUTIONS_PROCESS=main                # main or own (separate process)

# Execution Timeout (seconds, -1 = no limit)
EXECUTIONS_TIMEOUT=300                 # 5 minutes default
EXECUTIONS_TIMEOUT_MAX=3600            # Hard limit: 1 hour

# Save Execution Data
EXECUTIONS_DATA_SAVE_ON_ERROR=all      # all, none
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all    # all, none
EXECUTIONS_DATA_SAVE_ON_PROGRESS=false
EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true

# Execution Pruning (automatic cleanup)
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336            # Keep for 14 days (hours)
```

#### 8.2.5 Timezone & Localization

```bash
# Timezone (important for scheduled workflows)
GENERIC_TIMEZONE=America/New_York      # Or your timezone
TZ=America/New_York                    # System timezone

# Available timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
```

#### 8.2.6 Performance & Scaling

```bash
# Node.js Memory Limit
NODE_OPTIONS=--max-old-space-size=4096 # 4GB RAM

# Payload Size Limit (MB)
N8N_PAYLOAD_SIZE_MAX=16                # Default: 16MB

# Concurrency
N8N_CONCURRENCY_PRODUCTION_LIMIT=-1    # -1 = no limit
```

#### 8.2.7 Logging

```bash
# Log Level
N8N_LOG_LEVEL=info                     # error, warn, info, verbose, debug
N8N_LOG_OUTPUT=console                 # console, file
N8N_LOG_FILE_LOCATION=/var/log/n8n/    # Log file directory
N8N_LOG_FILE_COUNT_MAX=10              # Max log files
N8N_LOG_FILE_SIZE_MAX=10485760         # Max size per file (10MB)
```

#### 8.2.8 Credentials & Nodes

```bash
# External Secrets (for credentials from external sources)
N8N_EXTERNAL_SECRETS_UPDATE_INTERVAL=300 # Check every 5 minutes

# Disable specific nodes (security)
NODES_EXCLUDE=[n8n-nodes-base.executeCommand,n8n-nodes-base.readWriteFile]

# Custom nodes path
N8N_CUSTOM_EXTENSIONS=/path/to/custom/nodes
```

### 8.3 Complete Production .env Example

```bash
# .env file for production n8n deployment

# ===== DATABASE =====
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n_prod
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=super_secure_db_password_here
DB_POSTGRESDB_POOL_SIZE=4

# ===== DEPLOYMENT =====
N8N_PROTOCOL=https
N8N_HOST=n8n.example.com
N8N_PORT=5678
WEBHOOK_URL=https://n8n.example.com
N8N_EDITOR_BASE_URL=https://n8n.example.com

# ===== SECURITY =====
N8N_ENCRYPTION_KEY=your-32-char-key-here-generate-with-openssl
N8N_USER_MANAGEMENT_JWT_SECRET=your-jwt-secret-here
N8N_USER_MANAGEMENT_DISABLED=false

# ===== EXECUTION =====
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=600
EXECUTIONS_TIMEOUT_MAX=3600
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336

# ===== TIMEZONE =====
GENERIC_TIMEZONE=America/New_York
TZ=America/New_York

# ===== PERFORMANCE =====
NODE_OPTIONS=--max-old-space-size=4096
N8N_PAYLOAD_SIZE_MAX=32

# ===== LOGGING =====
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console

# ===== SMTP (for email notifications) =====
N8N_SMTP_HOST=smtp.gmail.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=your-email@gmail.com
N8N_SMTP_PASS=your-app-password
N8N_SMTP_SENDER=n8n@example.com
N8N_SMTP_SSL=false
```

### 8.4 Reverse Proxy Configuration

#### 8.4.1 Nginx Configuration

```nginx
# /etc/nginx/sites-available/n8n
server {
    listen 80;
    server_name n8n.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.example.com;

    ssl_certificate /etc/letsencrypt/live/n8n.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.example.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 8.4.2 Traefik Configuration

```yaml
# docker-compose.yml with Traefik
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt

  n8n:
    image: docker.n8n.io/n8nio/n8n
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(`n8n.example.com`)"
      - "traefik.http.routers.n8n.entrypoints=websecure"
      - "traefik.http.routers.n8n.tls.certresolver=letsencrypt"
      - "traefik.http.services.n8n.loadbalancer.server.port=5678"
    environment:
      - WEBHOOK_URL=https://n8n.example.com
      - N8N_PROTOCOL=https
      - N8N_HOST=n8n.example.com
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  letsencrypt:
  n8n_data:
```

### 8.5 Backup & Recovery

#### Database Backup (PostgreSQL)
```bash
# Backup
docker exec -t postgres pg_dump -U n8n_user n8n_prod > n8n_backup_$(date +%Y%m%d).sql

# Restore
cat n8n_backup_20250102.sql | docker exec -i postgres psql -U n8n_user n8n_prod
```

#### Workflows Export via API
```bash
# Export all workflows
curl -X GET "https://n8n.example.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: your_api_key" \
  > workflows_backup.json
```

#### Docker Volume Backup
```bash
# Backup n8n data volume
docker run --rm \
  -v n8n_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/n8n_data_backup.tar.gz -C /data .
```

---

## 9. HTTP REQUEST NODE & EXTERNAL APIS

### 9.1 HTTP Request Node Overview

The **HTTP Request** node is one of the most powerful and flexible nodes in n8n, allowing you to:
- Call any REST API
- Send HTTP requests (GET, POST, PUT, DELETE, PATCH, etc.)
- Handle authentication (OAuth2, API Key, Basic Auth, etc.)
- Process responses
- Handle errors

### 9.2 Basic Configuration

```javascript
// HTTP Request Node
Method: POST
URL: https://api.example.com/v1/users

// Authentication: Predefined Credential Type
// (Use existing OAuth2 or API Key credential)

// Or: Generic Credential Type
// (Configure custom auth)
```

### 9.3 Request Methods

| Method | Purpose | Body Allowed |
|--------|---------|--------------|
| **GET** | Retrieve data | No |
| **POST** | Create resource | Yes |
| **PUT** | Update (full replace) | Yes |
| **PATCH** | Update (partial) | Yes |
| **DELETE** | Delete resource | Optional |
| **HEAD** | Get headers only | No |
| **OPTIONS** | Get allowed methods | No |

### 9.4 Sending Data

#### 9.4.1 Query Parameters (URL)
```javascript
// URL with query params
https://api.example.com/users?status=active&limit=10

// Or use Query Parameters field:
Parameters:
  - status: active
  - limit: 10

// Dynamic values:
  - user_id: {{ $json.id }}
```

#### 9.4.2 JSON Body
```javascript
// Method: POST
// Send Body: true
// Body Content Type: JSON

// JSON Body:
{
  "name": "{{ $json.name }}",
  "email": "{{ $json.email }}",
  "status": "active",
  "metadata": {
    "source": "n8n",
    "timestamp": "{{ $now }}"
  }
}
```

#### 9.4.3 Form Data (URL Encoded)
```javascript
// Body Content Type: Form-Data (Urlencoded)

// Parameters:
  - name: {{ $json.name }}
  - email: {{ $json.email }}
  - token: {{ $json.oauth_token }}
```

#### 9.4.4 Multipart Form Data (File Uploads)
```javascript
// Body Content Type: Form-Data (Multipart)

// Parameters:
  - file: {{ $binary.data }}  // Binary data
  - name: {{ $json.fileName }}
  - description: File upload from n8n
```

### 9.5 Headers

#### 9.5.1 Custom Headers
```javascript
// Headers:
  - X-API-Key: your-api-key-here
  - X-Custom-Header: custom-value
  - Content-Type: application/json
  - User-Agent: n8n-automation/1.0
```

#### 9.5.2 Dynamic Headers
```javascript
// Headers:
  - Authorization: Bearer {{ $json.access_token }}
  - X-Request-ID: {{ $execution.id }}
  - X-Timestamp: {{ $now }}
```

### 9.6 Authentication Methods

#### 9.6.1 None (Open API)
```javascript
// No authentication configured
```

#### 9.6.2 Basic Auth
```javascript
// Authentication: Generic Credential Type > Basic Auth
Username: api_user
Password: api_password

// Sent as:
Authorization: Basic base64(username:password)
```

#### 9.6.3 API Key in Header
```javascript
// Authentication: Generic Credential Type > Header Auth
Name: X-API-Key
Value: your-api-key-here

// Sent as:
X-API-Key: your-api-key-here
```

#### 9.6.4 Bearer Token
```javascript
// Authentication: Generic Credential Type > Header Auth
Name: Authorization
Value: Bearer your-token-here

// Or use expression:
Value: Bearer {{ $json.access_token }}
```

#### 9.6.5 OAuth2
```javascript
// Authentication: Predefined Credential Type
Credential Type: HighLevel OAuth2 API (or custom OAuth2)

// n8n automatically:
// - Adds Authorization header with access token
// - Refreshes token when expired
// - Handles token rotation
```

### 9.7 Response Handling

#### 9.7.1 JSON Response (Default)
```javascript
// n8n automatically parses JSON responses
// Access response data:
{{ $json.id }}
{{ $json.user.email }}
{{ $json.data[0].name }}
```

#### 9.7.2 Full Response (Headers + Status)
```javascript
// Options > Response
Full Response: true

// Output includes:
{
  "statusCode": 200,
  "statusMessage": "OK",
  "headers": {
    "content-type": "application/json",
    "x-rate-limit-remaining": "99"
  },
  "body": {
    // Response data
  }
}
```

#### 9.7.3 Binary Response (Files)
```javascript
// For downloading files
Response Format: File

// Output stored in binary data:
$binary.data
```

### 9.8 Error Handling

#### 9.8.1 Continue on Fail
```javascript
// Options > Continue On Fail: true

// On error, node outputs:
{
  "error": {
    "message": "Request failed with status code 404",
    "httpCode": 404,
    "name": "NodeApiError"
  }
}

// Check for errors in next node:
{{ $json.error !== undefined }}
```

#### 9.8.2 Retry on Fail
```javascript
// Options > Retry On Fail: true
Max Retries: 3
Wait Between Tries (ms): 1000

// Automatically retries on:
// - Network errors
// - Timeout errors
// - 5xx server errors
```

### 9.9 Practical Examples

#### 9.9.1 Save OAuth Token to External Backend

**Use Case:** GoHighLevel OAuth callback → Save to backend

```javascript
// Webhook Node
HTTP Method: GET
Path: ghl/oauth/callback
Response Mode: lastNode

// HTTP Request Node
Method: POST
URL: https://whatsapp.cloude.es/api/oauth/save-token
Authentication: Header Auth (your backend API key)

// JSON Body:
{
  "code": "{{ $json.query.code }}",
  "location_id": "{{ $json.query.location_id }}",
  "state": "{{ $json.query.state }}",
  "timestamp": "{{ $now }}"
}

// Headers:
  - Content-Type: application/json
  - X-API-Key: your-backend-api-key
```

#### 9.9.2 Exchange OAuth Code for Access Token

```javascript
// HTTP Request Node
Method: POST
URL: https://services.leadconnectorhq.com/oauth/token

// Body Content Type: Form-Data (Urlencoded)
// Parameters:
  - client_id: {{ $env.GHL_CLIENT_ID }}
  - client_secret: {{ $env.GHL_CLIENT_SECRET }}
  - grant_type: authorization_code
  - code: {{ $json.query.code }}
  - redirect_uri: https://your-n8n.com/webhook/ghl/oauth/callback

// Response:
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "contacts.readonly contacts.write"
}
```

#### 9.9.3 Make Authenticated API Call with Saved Token

```javascript
// HTTP Request Node
Method: GET
URL: https://services.leadconnectorhq.com/locations/{{ $json.location_id }}/contacts

// Authentication: Header Auth
Name: Authorization
Value: Bearer {{ $json.access_token }}

// Query Parameters:
  - limit: 100
  - skip: 0
```

#### 9.9.4 Send Data to Multiple Endpoints

```javascript
// Split In Batches Node (optional, for rate limiting)
Batch Size: 10

// HTTP Request Node 1 (Primary backend)
URL: https://whatsapp.cloude.es/api/contacts
Method: POST

// HTTP Request Node 2 (Secondary/backup)
URL: https://backup.example.com/api/contacts
Method: POST

// Both receive same data, parallel processing
```

### 9.10 Rate Limiting & Throttling

#### 9.10.1 Built-in Rate Limiting
```javascript
// Options > Batching
Batch Size: 10                // Process 10 items at a time
Batch Interval: 1000          // Wait 1 second between batches
```

#### 9.10.2 Custom Rate Limiting with Function Node

```javascript
// Function Node (before HTTP Request)
const items = $input.all();
const delayMs = 100; // 10 requests per second

for (let i = 0; i < items.length; i++) {
  if (i > 0 && i % 10 === 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

return items;
```

### 9.11 Debugging HTTP Requests

#### 9.11.1 View Request Details
```javascript
// Enable in HTTP Request node:
Options > Full Response: true

// View in execution output:
// - Request URL
// - Request headers
// - Request body
// - Response status
// - Response headers
// - Response body
```

#### 9.11.2 Log Request/Response
```javascript
// Code Node (after HTTP Request)
const response = $input.item.json;

console.log('Response Status:', response.statusCode);
console.log('Response Headers:', response.headers);
console.log('Response Body:', response.body);

return [{ json: response }];
```

---

## 10. CODE/FUNCTION NODES

### 10.1 Code Node Overview

The **Code node** (replaces legacy Function and Function Item nodes as of v0.198.0) allows you to write custom **JavaScript** or **Python** code to:
- Transform data
- Perform complex logic
- Make calculations
- Parse/format strings
- Call external APIs (with fetch)
- Manipulate arrays/objects

### 10.2 Execution Modes

#### 10.2.1 Run Once for All Items (Default)
```javascript
// Mode: Run Once for All Items
// Code executes ONCE, receives all input items

// Access all items
const items = $input.all();

// Process all items
const total = items.reduce((sum, item) => {
  return sum + (item.json.amount || 0);
}, 0);

// Return result (must be array of items!)
return [
  {
    json: {
      total,
      count: items.length,
      average: total / items.length
    }
  }
];
```

#### 10.2.2 Run Once for Each Item
```javascript
// Mode: Run Once for Each Item
// Code executes SEPARATELY for each input item

// Access current item
const item = $input.item.json;

// Transform item
const fullName = `${item.firstName} ${item.lastName}`;
const age = new Date().getFullYear() - new Date(item.birthYear).getFullYear();

// Return transformed item (single object, not array!)
return {
  json: {
    id: item.id,
    fullName,
    age,
    email: item.email.toLowerCase(),
    processed_at: new Date().toISOString()
  }
};
```

### 10.3 Built-in Variables & Methods

#### 10.3.1 Input Access
```javascript
// Get all items
$input.all()                    // Array of all input items

// Get current item (in "Each Item" mode)
$input.item                     // Current item object
$input.item.json                // JSON data
$input.item.json.fieldName      // Specific field
$input.item.binary              // Binary data

// Get specific item by index
$input.item(0)                  // First item
$input.item(5)                  // Sixth item

// Get first/last item
$input.first()                  // First item
$input.last()                   // Last item
```

#### 10.3.2 Access Other Nodes' Data
```javascript
// Get data from specific node
$('Node Name').all()            // All items from "Node Name"
$('Node Name').first()          // First item from "Node Name"
$('Node Name').item             // Current item from "Node Name"

// Examples:
const webhookData = $('Webhook').first().json;
const userData = $('Get User').first().json;
const allOrders = $('Get Orders').all();
```

#### 10.3.3 Context Variables
```javascript
// Workflow info
$workflow.id                    // Workflow ID
$workflow.name                  // Workflow name
$workflow.active                // true/false

// Execution info
$execution.id                   // Execution ID
$execution.mode                 // "manual", "trigger", "webhook"
$execution.resumeUrl            // Resume URL

// Item info
$itemIndex                      // Current item index (0-based)
$items().length                 // Total number of items

// Node info
$nodeId                         // Current node ID

// Date/Time
$now                            // Current ISO timestamp
$today                          // Today at midnight

// Environment variables
$env.MY_VAR                     // Access env var MY_VAR
```

#### 10.3.4 Built-in Methods
```javascript
// Type helpers in editor (autocomplete)
_ (underscore)                  // Shows all built-in methods

// Common methods:
$jmespath(data, query)          // JMESPath query
$json                           // Current item's JSON data
```

### 10.4 Data Structure Requirements

#### 10.4.1 Return Format (All Items Mode)
```javascript
// CORRECT: Array of item objects
return [
  { json: { name: "John", age: 30 } },
  { json: { name: "Jane", age: 25 } }
];

// INCORRECT: Raw array
return [
  { name: "John", age: 30 },
  { name: "Jane", age: 25 }
];

// INCORRECT: Single object (not in array)
return { json: { name: "John" } };
```

#### 10.4.2 Return Format (Each Item Mode)
```javascript
// CORRECT: Single item object (no array!)
return {
  json: {
    name: "John",
    age: 30
  }
};

// INCORRECT: Array
return [{ json: { name: "John" } }];

// INCORRECT: Raw object
return { name: "John", age: 30 };
```

### 10.5 Common Data Transformations

#### 10.5.1 Filter Items
```javascript
// Keep only items matching condition
const items = $input.all();

const filtered = items.filter(item => {
  return item.json.status === 'active' && item.json.age >= 18;
});

return filtered;
```

#### 10.5.2 Map/Transform Items
```javascript
// Transform all items
const items = $input.all();

const transformed = items.map(item => {
  return {
    json: {
      id: item.json.id,
      fullName: `${item.json.firstName} ${item.json.lastName}`,
      email: item.json.email.toLowerCase(),
      createdAt: new Date().toISOString()
    }
  };
});

return transformed;
```

#### 10.5.3 Aggregate/Reduce
```javascript
// Sum, count, average
const items = $input.all();

const stats = items.reduce((acc, item) => {
  return {
    total: acc.total + (item.json.amount || 0),
    count: acc.count + 1,
    max: Math.max(acc.max, item.json.amount || 0)
  };
}, { total: 0, count: 0, max: 0 });

stats.average = stats.total / stats.count;

return [{ json: stats }];
```

#### 10.5.4 Group By
```javascript
// Group items by category
const items = $input.all();

const grouped = items.reduce((acc, item) => {
  const category = item.json.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(item.json);
  return acc;
}, {});

// Convert to array format
const result = Object.entries(grouped).map(([category, items]) => ({
  json: { category, items, count: items.length }
}));

return result;
```

#### 10.5.5 Flatten Nested Data
```javascript
// Flatten nested arrays
const items = $input.all();

const flattened = items.flatMap(item => {
  return item.json.orders.map(order => ({
    json: {
      user_id: item.json.id,
      user_name: item.json.name,
      order_id: order.id,
      order_total: order.total
    }
  }));
});

return flattened;
```

### 10.6 Working with Dates

```javascript
// Parse dates
const dateStr = $input.item.json.date_string;
const date = new Date(dateStr);

// Format dates
const formatted = date.toISOString();                    // 2025-11-02T10:30:00.000Z
const dateOnly = date.toISOString().split('T')[0];      // 2025-11-02
const localDate = date.toLocaleString('en-US');         // 11/2/2025, 10:30:00 AM

// Date calculations
const tomorrow = new Date(date);
tomorrow.setDate(tomorrow.getDate() + 1);

const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

// Timezone conversion (use libraries if needed)
const utcDate = new Date(date.toISOString());
```

### 10.7 String Manipulation

```javascript
const item = $input.item.json;

// Case conversion
const upper = item.name.toUpperCase();
const lower = item.email.toLowerCase();
const title = item.name.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

// Trim/Clean
const cleaned = item.text.trim();
const noSpaces = item.code.replace(/\s+/g, '');

// Extract patterns (regex)
const emailMatch = item.text.match(/[\w.-]+@[\w.-]+\.\w+/);
const email = emailMatch ? emailMatch[0] : null;

// Split/Join
const parts = item.fullName.split(' ');
const firstName = parts[0];
const lastName = parts.slice(1).join(' ');

// Template strings
const message = `Hello ${item.firstName}, your order #${item.orderId} is ready!`;

return { json: { upper, lower, cleaned, email, firstName, message } };
```

### 10.8 Working with JSON

```javascript
// Parse JSON string
const jsonString = $input.item.json.data;
const parsed = JSON.parse(jsonString);

// Stringify object
const obj = { name: "John", age: 30 };
const jsonStr = JSON.stringify(obj);
const prettyJson = JSON.stringify(obj, null, 2); // Indented

// Deep clone
const original = $input.item.json;
const clone = JSON.parse(JSON.stringify(original));

// Merge objects
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };
const merged = { ...obj1, ...obj2 };  // { a: 1, b: 3, c: 4 }

return { json: { parsed, jsonStr, merged } };
```

### 10.9 Making HTTP Requests in Code

```javascript
// Fetch API (available in Code node)
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${$env.API_TOKEN}`
  },
  body: JSON.stringify({
    user_id: $input.item.json.id,
    action: 'update'
  })
});

const data = await response.json();

return {
  json: {
    status: response.status,
    data: data
  }
};
```

### 10.10 Error Handling in Code

```javascript
try {
  const item = $input.item.json;

  // Validate input
  if (!item.email) {
    throw new Error('Email is required');
  }

  if (!item.email.includes('@')) {
    throw new Error('Invalid email format');
  }

  // Process data
  const result = processData(item);

  return { json: { success: true, result } };

} catch (error) {
  // Log error
  console.error('Processing error:', error.message);

  // Return error response
  return {
    json: {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  };
}
```

### 10.11 Advanced Examples

#### 10.11.1 Pagination Handler
```javascript
// Accumulate paginated API results
const allResults = [];
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await fetch(`https://api.example.com/data?page=${page}&limit=100`, {
    headers: {
      'Authorization': `Bearer ${$env.API_TOKEN}`
    }
  });

  const data = await response.json();
  allResults.push(...data.results);

  hasMore = data.has_more;
  page++;

  // Rate limiting
  if (hasMore) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

return allResults.map(item => ({ json: item }));
```

#### 10.11.2 Data Validation & Sanitization
```javascript
const items = $input.all();

const validated = items.map(item => {
  const data = item.json;

  // Validate required fields
  const errors = [];
  if (!data.email) errors.push('Missing email');
  if (!data.name) errors.push('Missing name');

  // Sanitize data
  const sanitized = {
    name: data.name?.trim() || '',
    email: data.email?.toLowerCase().trim() || '',
    age: parseInt(data.age) || 0,
    status: ['active', 'inactive'].includes(data.status) ? data.status : 'inactive'
  };

  return {
    json: {
      ...sanitized,
      valid: errors.length === 0,
      errors: errors
    }
  };
});

return validated;
```

---

## 11. USE CASE IMPLEMENTATION GUIDE

### 11.1 Your Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GoHighLevel App                          │
│                    (OAuth2 Provider)                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 1. User clicks "Install App"
                 │ 2. OAuth Authorization
                 │ 3. Redirect with code
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                           n8n Instance                          │
│                      (Middleware/Orchestrator)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Webhook Node: /webhook/ghl/oauth/callback            │   │
│  │  - Receives: code, location_id, state                 │   │
│  │  - Method: GET                                          │   │
│  └───────────────────┬────────────────────────────────────┘   │
│                      │                                          │
│                      ▼                                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  HTTP Request: Exchange Code for Tokens               │   │
│  │  POST https://services.leadconnectorhq.com/oauth/token│   │
│  │  - Gets: access_token, refresh_token                   │   │
│  └───────────────────┬────────────────────────────────────┘   │
│                      │                                          │
│                      ▼                                          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  HTTP Request: Save to External Backend               │   │
│  │  POST https://whatsapp.cloude.es/api/oauth/save       │   │
│  │  - Sends: tokens, location_id, metadata               │   │
│  └───────────────────┬────────────────────────────────────┘   │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  External Backend API                           │
│              (https://whatsapp.cloude.es)                       │
├─────────────────────────────────────────────────────────────────┤
│  - Stores access_token & refresh_token in database             │
│  - Associates tokens with location_id                          │
│  - Returns success confirmation to n8n                         │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Step-by-Step Implementation

#### 11.2.1 Configure GoHighLevel App

1. **Create App in GoHighLevel**
   - Go to: https://marketplace.gohighlevel.com/
   - Click: **My Apps** → **Create App**
   - **App Name**: Your App Name
   - **Distribution Type**: Sub-Account
   - **Scopes**: Select required permissions
     ```
     locations.readonly
     contacts.readonly
     contacts.write
     opportunities.readonly
     opportunities.write
     users.readonly
     calendars.readonly
     calendars.write
     ```

2. **Set OAuth Redirect URL**
   - **Redirect URL**: `https://your-n8n-domain.com/webhook/ghl/oauth/callback`
   - Click **Save**

3. **Copy Credentials**
   - **Client ID**: (copy this)
   - **Client Secret**: (copy this)
   - Store securely in your environment variables

#### 11.2.2 Configure n8n Environment

**Add to `.env` file:**
```bash
# GoHighLevel OAuth
GHL_CLIENT_ID=your-client-id-here
GHL_CLIENT_SECRET=your-client-secret-here

# Backend API
BACKEND_API_URL=https://whatsapp.cloude.es
BACKEND_API_KEY=your-backend-api-key

# n8n Configuration
WEBHOOK_URL=https://your-n8n-domain.com
N8N_PROTOCOL=https
N8N_HOST=your-n8n-domain.com
```

#### 11.2.3 Create n8n Workflow

**Workflow Name**: "GoHighLevel OAuth Handler"

**Node 1: Webhook (Trigger)**
```javascript
// Node: Webhook
HTTP Method: GET
Path: ghl/oauth/callback
Authentication: None (GHL callback is pre-authenticated via OAuth)
Response Mode: lastNode

// This receives:
// - code: OAuth authorization code
// - location_id: GHL location/sub-account ID
// - state: Optional state parameter (for CSRF protection)
```

**Node 2: Code - Validate Input**
```javascript
// Node: Code
// Mode: Run Once for Each Item

const query = $input.item.json.query;

// Validate required parameters
if (!query.code) {
  throw new Error('Missing authorization code');
}

if (!query.location_id) {
  throw new Error('Missing location_id');
}

// Return validated data
return {
  json: {
    code: query.code,
    location_id: query.location_id,
    state: query.state || '',
    timestamp: new Date().toISOString()
  }
};
```

**Node 3: HTTP Request - Exchange Code for Tokens**
```javascript
// Node: HTTP Request
Method: POST
URL: https://services.leadconnectorhq.com/oauth/token

// Authentication: None (using client credentials in body)

// Body Content Type: Form-Data (Urlencoded)
// Body Parameters:
{
  "client_id": "{{ $env.GHL_CLIENT_ID }}",
  "client_secret": "{{ $env.GHL_CLIENT_SECRET }}",
  "grant_type": "authorization_code",
  "code": "{{ $json.code }}",
  "redirect_uri": "{{ $env.WEBHOOK_URL }}/webhook/ghl/oauth/callback"
}

// Options:
// - Continue On Fail: false (stop on error)
// - Response: Simple (JSON body only)
```

**Node 4: Code - Parse Token Response**
```javascript
// Node: Code
// Mode: Run Once for Each Item

const tokenResponse = $input.item.json;
const originalData = $('Validate Input').first().json;

// Validate token response
if (!tokenResponse.access_token) {
  throw new Error('Failed to obtain access token');
}

// Prepare data for backend
return {
  json: {
    location_id: originalData.location_id,
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    token_type: tokenResponse.token_type,
    expires_in: tokenResponse.expires_in,
    scope: tokenResponse.scope,
    user_type: tokenResponse.userType,
    location_id: tokenResponse.locationId,
    company_id: tokenResponse.companyId,
    user_id: tokenResponse.userId,
    expires_at: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
    created_at: new Date().toISOString()
  }
};
```

**Node 5: HTTP Request - Save to Backend**
```javascript
// Node: HTTP Request
Method: POST
URL: {{ $env.BACKEND_API_URL }}/api/oauth/ghl/save-token

// Authentication: Header Auth
Name: X-API-Key
Value: {{ $env.BACKEND_API_KEY }}

// Headers:
Headers:
  - Content-Type: application/json
  - X-Request-ID: {{ $execution.id }}

// JSON Body:
{
  "location_id": "{{ $json.location_id }}",
  "access_token": "{{ $json.access_token }}",
  "refresh_token": "{{ $json.refresh_token }}",
  "token_type": "{{ $json.token_type }}",
  "expires_in": {{ $json.expires_in }},
  "expires_at": "{{ $json.expires_at }}",
  "scope": "{{ $json.scope }}",
  "user_id": "{{ $json.user_id }}",
  "company_id": "{{ $json.company_id }}",
  "metadata": {
    "source": "n8n",
    "workflow_id": "{{ $workflow.id }}",
    "execution_id": "{{ $execution.id }}",
    "timestamp": "{{ $json.created_at }}"
  }
}

// Options:
// - Continue On Fail: false
// - Retry On Fail: true
// - Max Retries: 3
// - Wait Between Tries: 2000
```

**Node 6: If - Check Backend Response**
```javascript
// Node: If
Conditions:
  - Value 1: {{ $json.success }}
  - Operation: is equal to
  - Value 2: true
```

**Node 7a: Respond to Webhook (Success)**
```javascript
// Node: Respond to Webhook (TRUE branch)
Response Code: 200

// Response Body:
{
  "success": true,
  "message": "OAuth authorization successful",
  "data": {
    "location_id": "{{ $('Parse Token Response').item.json.location_id }}",
    "expires_at": "{{ $('Parse Token Response').item.json.expires_at }}"
  },
  "timestamp": "{{ $now }}"
}
```

**Node 7b: Respond to Webhook (Error)**
```javascript
// Node: Respond to Webhook (FALSE branch)
Response Code: 500

// Response Body:
{
  "success": false,
  "error": {
    "code": "SAVE_FAILED",
    "message": "Failed to save OAuth tokens",
    "details": "{{ $json.error }}"
  },
  "timestamp": "{{ $now }}"
}
```

**Node 8: Error Trigger Workflow (Optional)**
```javascript
// Create separate workflow: "OAuth Error Handler"
// Start with: Error Trigger node

// HTTP Request: Notify Admin
POST https://api.slack.com/webhooks/your-webhook-url
Body:
{
  "text": "OAuth Error: {{ $json.execution.error.message }}",
  "workflow": "{{ $json.workflow.name }}",
  "execution_id": "{{ $json.execution.id }}"
}
```

#### 11.2.4 Backend API Implementation (Your Backend)

**Endpoint**: `POST /api/oauth/ghl/save-token`

**Required Headers**:
- `Content-Type: application/json`
- `X-API-Key: your-backend-api-key`

**Request Body**:
```json
{
  "location_id": "location_abc123",
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2025-11-03T10:30:00.000Z",
  "scope": "contacts.readonly contacts.write",
  "user_id": "user_123",
  "company_id": "company_456",
  "metadata": {
    "source": "n8n",
    "workflow_id": "workflow_789",
    "execution_id": "exec_012"
  }
}
```

**Backend Logic (Pseudocode)**:
```python
@app.route('/api/oauth/ghl/save-token', methods=['POST'])
@require_api_key
def save_ghl_token():
    data = request.json

    # Validate input
    if not data.get('location_id') or not data.get('access_token'):
        return {'success': False, 'error': 'Missing required fields'}, 400

    # Encrypt tokens before storage
    encrypted_access_token = encrypt(data['access_token'])
    encrypted_refresh_token = encrypt(data['refresh_token'])

    # Save to database
    token_record = {
        'location_id': data['location_id'],
        'access_token': encrypted_access_token,
        'refresh_token': encrypted_refresh_token,
        'token_type': data['token_type'],
        'expires_at': data['expires_at'],
        'scope': data['scope'],
        'user_id': data.get('user_id'),
        'company_id': data.get('company_id'),
        'metadata': data.get('metadata', {}),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    db.oauth_tokens.upsert(
        {'location_id': data['location_id']},
        token_record
    )

    # Log event
    log_oauth_event('token_saved', token_record)

    return {
        'success': True,
        'message': 'Token saved successfully',
        'location_id': data['location_id']
    }, 200
```

### 11.3 Token Refresh Workflow

**Workflow Name**: "GoHighLevel Token Refresh"

**Trigger**: Schedule (runs daily or when token expires)

**Node 1: HTTP Request - Get Expiring Tokens**
```javascript
// Query your backend for tokens expiring in next 24 hours
GET {{ $env.BACKEND_API_URL }}/api/oauth/ghl/expiring-tokens
```

**Node 2: Loop Through Tokens**
```javascript
// For each expiring token:
```

**Node 3: HTTP Request - Refresh Token**
```javascript
POST https://services.leadconnectorhq.com/oauth/token

Body:
{
  "client_id": "{{ $env.GHL_CLIENT_ID }}",
  "client_secret": "{{ $env.GHL_CLIENT_SECRET }}",
  "grant_type": "refresh_token",
  "refresh_token": "{{ $json.refresh_token }}"
}
```

**Node 4: HTTP Request - Save Refreshed Token**
```javascript
POST {{ $env.BACKEND_API_URL }}/api/oauth/ghl/save-token
// Same as before, updates existing record
```

### 11.4 Using Stored Tokens from Backend

**Workflow Name**: "Make Authenticated GHL Request"

**Node 1: HTTP Request - Get Token from Backend**
```javascript
GET {{ $env.BACKEND_API_URL }}/api/oauth/ghl/token?location_id={{ $json.location_id }}

// Response:
{
  "access_token": "eyJhbGciOi...",
  "expires_at": "2025-11-03T10:30:00.000Z"
}
```

**Node 2: HTTP Request - Call GHL API**
```javascript
GET https://services.leadconnectorhq.com/locations/{{ $json.location_id }}/contacts

Headers:
  - Authorization: Bearer {{ $('Get Token').item.json.access_token }}
  - Version: 2021-07-28
```

### 11.5 Testing the Integration

#### Test OAuth Flow
1. **Generate Authorization URL**:
```
https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https://your-n8n.com/webhook/ghl/oauth/callback&client_id=YOUR_CLIENT_ID&scope=contacts.readonly contacts.write
```

2. **Open in Browser**:
   - User selects location
   - User grants permissions
   - Redirects to n8n webhook with `code` parameter

3. **Monitor n8n Execution**:
   - View workflow execution in n8n
   - Check each node's output
   - Verify token exchange
   - Confirm backend storage

4. **Verify in Backend**:
   - Query database for saved token
   - Check encryption
   - Verify expiration time

#### Test Token Refresh
1. Manually trigger refresh workflow
2. Verify new tokens are saved
3. Test API call with refreshed token

---

## 12. BEST PRACTICES & SECURITY

### 12.1 Security Best Practices

#### 12.1.1 Credentials Management
```bash
# Never hardcode credentials
# BAD:
access_token = "eyJhbGciOiJI..."

# GOOD:
access_token = $env.ACCESS_TOKEN

# Use n8n credential system
# Use environment variables for sensitive config
# Rotate API keys regularly
```

#### 12.1.2 Webhook Security
```javascript
// Always authenticate production webhooks
// Use header authentication:
X-Webhook-Token: your-secret-token-here

// Or implement HMAC signature verification:
const crypto = require('crypto');
const receivedSignature = $input.item.json.headers['x-signature'];
const payload = JSON.stringify($input.item.json.body);
const secret = $env.WEBHOOK_SECRET;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

#### 12.1.3 Data Encryption
```bash
# Set encryption key for credentials
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# All credentials encrypted at rest in database
# Never expose encryption key
```

#### 12.1.4 HTTPS/TLS
```bash
# Always use HTTPS in production
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.example.com

# Configure SSL certificates properly
# Use reverse proxy (Nginx, Traefik) for TLS termination
```

#### 12.1.5 Rate Limiting
```javascript
// Implement rate limiting on webhook endpoints
// Use Redis or in-memory cache

const rateLimitKey = `rate_limit:${$input.item.json.headers['x-forwarded-for']}`;
const currentCount = await redis.incr(rateLimitKey);
await redis.expire(rateLimitKey, 60); // 60 seconds window

if (currentCount > 100) {
  throw new Error('Rate limit exceeded');
}
```

### 12.2 Performance Best Practices

#### 12.2.1 Workflow Design
```javascript
// Use "Run Once for All Items" when possible (more efficient)
// Avoid unnecessary node connections
// Use sub-workflows for reusability
// Minimize HTTP requests (batch when possible)
```

#### 12.2.2 Database Optimization
```bash
# Use PostgreSQL for production (better performance than SQLite)
DB_TYPE=postgresdb
DB_POSTGRESDB_POOL_SIZE=10  # Adjust based on load

# Enable execution pruning
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168  # 7 days
```

#### 12.2.3 Memory Management
```bash
# Increase Node.js memory limit for large workflows
NODE_OPTIONS=--max-old-space-size=4096  # 4GB

# Adjust payload size limit
N8N_PAYLOAD_SIZE_MAX=32  # 32MB
```

### 12.3 Monitoring & Logging

#### 12.3.1 Execution Monitoring
```javascript
// Create monitoring workflow
// Schedule: Every 5 minutes
// HTTP Request to n8n API:
GET /api/v1/executions?status=error&limit=50

// Parse response, send alerts if error rate > threshold
```

#### 12.3.2 Logging Best Practices
```bash
# Set appropriate log level
N8N_LOG_LEVEL=info  # error, warn, info, verbose, debug

# Log to file in production
N8N_LOG_OUTPUT=file
N8N_LOG_FILE_LOCATION=/var/log/n8n/

# Rotate logs
N8N_LOG_FILE_COUNT_MAX=10
N8N_LOG_FILE_SIZE_MAX=10485760  # 10MB
```

#### 12.3.3 External Logging (Recommended)
```javascript
// Send logs to external service (Datadog, Loggly, etc.)
// HTTP Request Node in error workflow:
POST https://logs.example.com/api/logs

Body:
{
  "level": "error",
  "workflow": "{{ $workflow.name }}",
  "execution_id": "{{ $execution.id }}",
  "error": "{{ $json.error }}",
  "timestamp": "{{ $now }}",
  "environment": "production"
}
```

### 12.4 Backup & Disaster Recovery

#### 12.4.1 Database Backups
```bash
# PostgreSQL backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="n8n_backup_${DATE}.sql"

docker exec postgres pg_dump -U n8n_user n8n > /backups/${BACKUP_FILE}

# Compress
gzip /backups/${BACKUP_FILE}

# Upload to S3 (optional)
aws s3 cp /backups/${BACKUP_FILE}.gz s3://my-backups/n8n/

# Cleanup old backups (keep last 30 days)
find /backups -name "n8n_backup_*.sql.gz" -mtime +30 -delete
```

#### 12.4.2 Workflow Export
```bash
# Export all workflows via API
curl -X GET "https://n8n.example.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  > workflows_backup_$(date +%Y%m%d).json
```

### 12.5 Error Handling Best Practices

```javascript
// 1. Always validate input
if (!$json.required_field) {
  throw new Error('Missing required field');
}

// 2. Use try/catch in Code nodes
try {
  // risky operation
} catch (error) {
  console.error('Error:', error);
  return { json: { error: error.message } };
}

// 3. Enable Continue On Fail for non-critical nodes
// Settings > Continue On Fail: true

// 4. Implement retry logic with exponential backoff
// See Section 7.2.2

// 5. Configure Error Trigger workflows
// See Section 7.1.1

// 6. Return meaningful error responses
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
}
```

### 12.6 API Best Practices

```javascript
// 1. Use predefined credentials when available
// Authentication: Predefined Credential Type > HighLevel OAuth2

// 2. Implement proper rate limiting
// See Section 9.10

// 3. Handle pagination
// See Section 10.11.1

// 4. Set reasonable timeouts
// HTTP Request Node > Options > Timeout: 30000 (30s)

// 5. Log API requests/responses (in development)
console.log('API Request:', {
  url: $node.parameters.url,
  method: $node.parameters.method,
  body: $json
});

// 6. Handle token refresh automatically
// Use OAuth2 credentials (n8n handles refresh)
```

---

## 13. REFERENCES & RESOURCES

### 13.1 Official Documentation

| Resource | URL |
|----------|-----|
| **n8n Docs** | https://docs.n8n.io |
| **n8n API Reference** | https://docs.n8n.io/api/ |
| **Webhook Node Docs** | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ |
| **HTTP Request Node Docs** | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/ |
| **Code Node Docs** | https://docs.n8n.io/code/code-node/ |
| **Credentials Docs** | https://docs.n8n.io/credentials/ |
| **Environment Variables** | https://docs.n8n.io/hosting/configuration/environment-variables/ |
| **Error Handling Docs** | https://docs.n8n.io/flow-logic/error-handling/ |

### 13.2 GitHub Repositories

| Repository | URL |
|------------|-----|
| **n8n Main Repository** | https://github.com/n8n-io/n8n |
| **n8n Documentation** | https://github.com/n8n-io/n8n-docs |
| **n8n Nodes Starter** | https://github.com/n8n-io/n8n-nodes-starter |

### 13.3 Community Resources

| Resource | URL |
|----------|-----|
| **n8n Community Forum** | https://community.n8n.io |
| **Workflow Templates** | https://n8n.io/workflows |
| **Integration Directory** | https://n8n.io/integrations |
| **n8n YouTube Channel** | https://www.youtube.com/@n8n-io |

### 13.4 GoHighLevel Resources

| Resource | URL |
|----------|-----|
| **GHL Docs** | https://highlevel.stoplight.io/ |
| **GHL OAuth Setup** | https://docs.n8n.io/integrations/builtin/credentials/highlevel/ |
| **GHL Marketplace** | https://marketplace.gohighlevel.com/ |

### 13.5 Key Workflow Templates

| Template | Use Case | URL |
|----------|----------|-----|
| **Creating an API Endpoint** | Build REST APIs with webhooks | https://n8n.io/workflows/1750 |
| **n8n Workflow Manager API** | Manage workflows programmatically | https://n8n.io/workflows/4166 |
| **Create Dynamic Workflows** | Create workflows via API | https://n8n.io/workflows/4544 |
| **Auto-Retry Engine** | Automatic error recovery | https://n8n.io/workflows/3144 |
| **OAuth2 Credential Creation** | Automate credential setup | https://n8n.io/workflows/2909 |

### 13.6 Tools & Extensions

| Tool | Description | URL |
|------|-------------|-----|
| **n8n Desktop App** | Desktop version of n8n | https://github.com/n8n-io/n8n-desktop |
| **n8n OpenAPI Node** | Generate nodes from OpenAPI specs | https://github.com/devlikeapro/n8n-openapi-node |
| **n8n-nodes-starter** | Template for custom nodes | https://github.com/n8n-io/n8n-nodes-starter |

### 13.7 Related Technologies

| Technology | Use Case | Documentation |
|------------|----------|---------------|
| **PostgreSQL** | Production database | https://www.postgresql.org/docs/ |
| **Docker** | Containerization | https://docs.docker.com/ |
| **Nginx** | Reverse proxy | https://nginx.org/en/docs/ |
| **Traefik** | Cloud-native proxy | https://doc.traefik.io/traefik/ |
| **Let's Encrypt** | Free SSL certificates | https://letsencrypt.org/docs/ |

### 13.8 Additional Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| **n8n Course (Level 1)** | Video Course | https://docs.n8n.io/courses/level-one/ |
| **n8n Course (Level 2)** | Video Course | https://docs.n8n.io/courses/level-two/ |
| **Code Node Tutorial** | Interactive Workflow | https://n8n.io/workflows/5407 |
| **JavaScript Data Processing** | Learning Workflow | https://n8n.io/workflows/5729 |

---

## APPENDIX A: QUICK REFERENCE CHEAT SHEET

### Common Code Snippets

#### Access Webhook Query Parameters
```javascript
const code = $input.item.json.query.code;
const locationId = $input.item.json.query.location_id;
```

#### Access Webhook Body Data
```javascript
const body = $input.item.json.body;
const userId = body.user_id;
```

#### Make HTTP Request in Code Node
```javascript
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${$env.API_TOKEN}`
  },
  body: JSON.stringify({ data: $input.item.json })
});
const result = await response.json();
return { json: result };
```

#### Filter Array
```javascript
const items = $input.all();
return items.filter(item => item.json.status === 'active');
```

#### Transform Array
```javascript
const items = $input.all();
return items.map(item => ({
  json: {
    id: item.json.id,
    name: item.json.name.toUpperCase()
  }
}));
```

#### Aggregate Data
```javascript
const items = $input.all();
const total = items.reduce((sum, item) => sum + item.json.amount, 0);
return [{ json: { total, count: items.length } }];
```

---

## APPENDIX B: TROUBLESHOOTING GUIDE

### Webhook Issues

**Problem**: Webhook URL shows `localhost`
**Solution**: Set `WEBHOOK_URL` environment variable
```bash
WEBHOOK_URL=https://your-public-domain.com
```

**Problem**: Webhook not receiving data
**Solutions**:
- Ensure workflow is activated
- Check webhook path is correct
- Verify authentication (if enabled)
- Check firewall rules

**Problem**: CORS errors
**Solution**: Add CORS headers in Respond to Webhook node
```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

### OAuth Issues

**Problem**: OAuth callback fails
**Solutions**:
- Verify redirect URL matches exactly in both n8n and OAuth provider
- Check client ID and client secret
- Ensure HTTPS is configured properly

**Problem**: Token refresh fails
**Solutions**:
- Verify refresh token is stored correctly
- Check token hasn't been revoked
- Ensure client credentials are valid

### Performance Issues

**Problem**: Slow workflow execution
**Solutions**:
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Optimize database queries
- Use PostgreSQL instead of SQLite
- Enable execution pruning

**Problem**: Out of memory errors
**Solutions**:
- Process data in batches
- Use "Run Once for Each Item" mode
- Increase memory limit
- Reduce payload size

---

## DOCUMENT END

**Last Updated**: 2025-11-02
**Version**: 1.0
**Maintained By**: Technical Researcher Agent

For questions or updates, refer to official n8n documentation at https://docs.n8n.io
