# GoHighLevel Developer Documentation - Complete Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Platform Architecture](#platform-architecture)
3. [OAuth 2.0 Implementation](#oauth-20-implementation)
4. [SDK Overview](#sdk-overview)
5. [App Distribution Model](#app-distribution-model)
6. [Webhook Integration](#webhook-integration)
7. [Billing Integration](#billing-integration)
8. [Private Integration Tokens](#private-integration-tokens)
9. [Payment Integration](#payment-integration)
10. [API Endpoints](#api-endpoints)
11. [Developer Glossary](#developer-glossary)

---

## Getting Started

### Platform Overview

**HighLevel Scale:**
- Over 70,000+ agencies utilizing the platform
- Approximately 600,000+ businesses actively engage with HighLevel's product

**Developer Marketplace Definition:**
"A platform provided by HighLevel where developers can create and distribute their custom applications and integrations for use with the HighLevel CRM."

### Purpose

The HighLevel Developer Marketplace enables developers to:
- Build custom applications and integrations
- Distribute apps to agencies and businesses
- Monetize solutions through the marketplace
- Access comprehensive API capabilities

---

## Platform Architecture

### Agency vs Sub-Account Model

#### Go-To-Market Structure

HighLevel operates through a multi-tiered business model:

**Agencies (Primary Customers):**
- Purchase HighLevel licenses at the agency level
- Host multiple sub-accounts (typically one per small business client)
- Control the entire client relationship and revenue streams
- Act as gatekeepers to SMB end users

**Sub-Accounts:**
- Typically represent individual small businesses
- Are managed by their parent agency
- Have location-specific settings and data

#### Revenue Channels for Agencies

1. Monthly platform subscription fees
2. Marketplace app purchases (per sub-account or usage-based)
3. Managed services and consulting add-ons

#### White-Labeling Capabilities

Agencies can rebrand the entire platform through:
- Custom logos, colors, and email/SMS sender identities
- Custom domain mapping (e.g., `crm.agencyname.com`)
- UI modifications that hide HighLevel's branding from end clients

**Result:** SMB clients believe they're using proprietary agency software rather than a third-party solution.

#### Implications for App Developers

**Direct Relationship:** "All communication, billing discussions, and support happen through the agency."

**Revenue Model:** HighLevel collects payment from agencies, then distributes developer payouts based on sub-account installations or usage metrics.

#### Success Strategies

- Design flexible, usage-based pricing for resale
- Create white-label compatible assets and documentation
- Develop features that respect agency branding settings
- Partner with agencies for joint marketing initiatives

---

## OAuth 2.0 Implementation

### Overview

HighLevel implements OAuth 2.0 using the **Authorization Code Grant** flow, enabling third-party applications to access user resources securely without exposing passwords.

### Complete Authorization Flow

#### 1. App Registration

Developers must register applications through the HighLevel Marketplace:

**App Configuration:**
- Create an app in "My Apps" section
- Specify app type:
  - **Private**: Internal use only
  - **Public**: Marketplace distribution
- Define target users (recommended: "Sub-account")
- Choose installation visibility (recommended: "Both Agency & Sub-account")

#### 2. OAuth Configuration

In Advanced Settings > Auth section, configure:

**Scopes:**
- Request minimum necessary permissions from available scope list
- Permissions define what data and actions your app can access

**Redirect URI:**
- Callback destination for authorization codes
- Must be HTTPS in production

**Client Keys:**
- Generate Client ID and Client Secret
- **CRITICAL**: Store Secret securely immediately (cannot be retrieved later)

#### 3. Installation URL

Access the installation link from Auth pane settings. Users visit this URL to:
- Authorize app installation
- Select their account/location
- Grant permissions

#### 4. Authorization Code Exchange

After user authorization, the browser redirects to your redirect URI with an authorization code:

```
https://myapp.com/oauth/callback/highlevel?code=7676cjcbdc6t76cdcbkjcd09821jknnkj
```

**Exchange Code for Tokens:**

**Endpoint:** `POST https://services.leadconnectorhq.com/oauth/token`

**Request Parameters:**
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "authorization_code",
  "code": "7676cjcbdc6t76cdcbkjcd09821jknnkj",
  "user_type": "Company",
  "redirect_uri": "https://myapp.com/oauth/callback/highlevel"
}
```

**Response Includes:**
```json
{
  "access_token": "Bearer_token_for_API_calls",
  "refresh_token": "Long-lived_token",
  "expires_in": 86399,
  "userType": "Company",
  "companyId": "GNb7aIv4rQFV9iwNl5K",
  "locationId": "HjiMUOsCCHCjtxEf8PR",
  "scope": "authorized_permissions"
}
```

**Token Expiration:** ~86,399 seconds (24 hours)

### Token Types

#### Agency-Level Token (`userType: "Company"`)

**Purpose:**
- Manages agency functionalities
- Create sub-accounts
- Manage company-wide settings

**Contains:**
- `companyId`
- Agency-level permissions

#### Location-Level Token (`userType: "Location"`)

**Purpose:**
- Manages sub-account/location operations
- Create contacts
- Manage location-specific features

**Contains:**
- `locationId`
- `companyId`
- Location-level permissions

### Token Refresh Process

Access tokens expire after ~24 hours. Use the refresh token to obtain new credentials without reinstalling:

**Endpoint:** `POST https://services.leadconnectorhq.com/oauth/token`

**Request Parameters:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "your_refresh_token",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "user_type": "Company"
}
```

**Important:**
- Refresh tokens remain valid for one year or until used
- Each refresh generates a new refresh token
- The original refresh token becomes invalid after use

### Agency-to-Location Token Conversion

Generate location-specific tokens from agency credentials:

**Endpoint:** `POST https://services.leadconnectorhq.com/oauth/locationToken`

**Headers:**
```
Authorization: Bearer [agency_access_token]
Content-Type: application/json
```

**Request Body:**
```json
{
  "companyId": "GNb7aIv4rQFV9iwNl5K",
  "locationId": "HjiMUOsCCHCjtxEf8PR"
}
```

### Handling Access Tokens for Target User: Agency

For apps designated for Agency-level targeting:

**Key Points:**
- "The app will only be visible to the Agency Admin/Owner, and only they can install it"
- The Agency admin/owner installs the application on their Agency account
- After installation, the redirect URL is triggered with the authorization code
- The Access Token generated will be of user type `company` (Agency Level Token)

**Token Exchange:**
```
POST https://services.leadconnectorhq.com/oauth/token
user_type=Company
grant_type=authorization_code
```

**Response includes:**
- Bearer token with metadata
- Expiration duration (86399 seconds)
- Refresh token
- Associated company ID
- User identification information

### Get Location Access Token from Agency Token

**API Endpoint:**
- **Method:** POST
- **Path:** `/oauth/locationToken`
- **Purpose:** "This API allows you to generate locationAccessToken from AgencyAccessToken"

**Response Status Codes:**
- **200:** Successful response
- **400:** Bad Request
- **401:** Unauthorized
- **422:** Unprocessable Entity

### Webhook Events

Apps can subscribe to real-time events. Critical event: **App Install**

**Sample Install Webhook Payload:**
```json
{
  "type": "INSTALL",
  "appId": "665c6bb13d4e5364bdec0e2f",
  "locationId": "HjiMUOsCCHCjtxzEf8PR",
  "companyId": "GNb7aIv4rQFVb9iwNl5K",
  "timestamp": "2025-06-25T06:57:06.225Z"
}
```

### Best Practices

✅ **Do:**
- Request minimum scopes necessary for functionality
- Store Client Secrets securely server-side
- Implement refresh token rotation for security
- Monitor token expiration and refresh proactively
- Start applications as Private before publishing as Public

❌ **Don't:**
- Expose Client Secrets in client-side code
- Store secrets in version control
- Request unnecessary scopes
- Forget to handle token expiration

---

## SDK Overview

### Installation

The SDK is available via npm and yarn:

```bash
npm i @gohighlevel/api-client
```

or

```bash
yarn add @gohighlevel/api-client
```

### Initialization

The SDK requires instantiation with authentication credentials:

```javascript
const HighLevel = require('@gohighlevel/api-client');

// Initialize with credentials
const client = new HighLevel({
  // Authentication options here
});
```

### Authentication Methods

#### Private Integration Token (PIT)

Uses a single token passed directly during initialization for direct API access without OAuth flows:

```javascript
const client = new HighLevel({
  token: 'your_private_integration_token'
});
```

#### OAuth 2.0 Flow

Required for marketplace applications and public integrations:

```javascript
const client = new HighLevel({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  locationId: 'location_id', // or companyId
});
```

**Key Feature:** "SDK will auto refresh the token whenever it is expired"

### Key Features

- **Built-in authentication management** across all API calls
- **Automatic token refresh** capability when credentials expire
- **Comprehensive coverage** of HighLevel API endpoints
- **TypeScript support** with type definitions
- **Error handling** with detailed error messages

### Additional Resources

The documentation directs developers to the **HighLevel SDK Examples GitHub repository**, which contains:
- Complete Node.js applications
- OAuth implementation examples
- Practical use case guides
- Integration best practices

---

## App Distribution Model

### Core Configuration Fields

The distribution model relies on three primary configuration options:

#### 1. Target User

Determines who ultimately uses the app:
- **Agency**: Agency-level users only
- **Sub-account**: Sub-account users (recommended for most applications)

⚠️ **This setting is permanent once established**

#### 2. Installation Permissions

Specifies visibility and installation rights:
- **Both Agency and Sub-account**: Maximizes market reach (recommended)
- **Agency Only**: Restricted to agency administrators

#### 3. Bulk Installation Support

Indicates whether agencies can deploy the app across multiple sub-accounts simultaneously:
- New marketplace apps default to **Yes**
- Enables agencies to install across their sub-account networks

### Three Primary Distribution Scenarios

#### Scenario 1: Agency-Focused Apps

**Configuration:**
- Target User: Agency
- Installation: Agency Only

**Characteristics:**
- Limited to agency-level users
- Appears only in agency marketplaces
- Installation and payments exclusive to agency administrators

#### Scenario 2: Sub-account Apps (Dual Installation)

**Configuration:**
- Target User: Sub-account
- Installation: Both Agency and Sub-account

**Characteristics:**
- Available to both audiences
- Shared listing visibility
- Agencies can enable bulk deployment
- Sub-accounts assume payment responsibility

#### Scenario 3: Sub-account Apps (Agency Installation Only)

**Configuration:**
- Target User: Sub-account
- Installation: Agency Only

**Characteristics:**
- Restricted visibility within agency marketplaces exclusively
- Agencies manage installation on behalf of sub-accounts
- Agencies maintain resale opportunities

### Access Token Management

Different installation contexts require distinct token handling:

#### Single Installations
```json
{
  "isBulkInstallation": false,
  "userType": "Location"
}
```

#### Bulk Agency Installations
```json
{
  "isBulkInstallation": true,
  "userType": "Company"
}
```

#### Sub-account Installations
```json
{
  "userType": "Location"
}
```

**Important:** Bulk scenarios necessitate retrieving location tokens for each installed account using the agency's primary token.

---

## Webhook Integration

### What Are Webhooks?

Webhooks enable real-time application communication through automatic notifications when events occur in the HighLevel platform, eliminating the need for constant polling.

### Setting Up Your Endpoint

Developers can establish webhook endpoints using:
- **Cloud services**: Heroku, AWS Lambda, Google Cloud Functions, Vercel
- **Testing utilities**: webhook.site, ngrok
- **Custom servers**: With HTTPS access

#### Basic Node.js/Express Handler Example

```javascript
const express = require('express');
const app = express();

app.post('/webhooks', express.json(), (req, res) => {
  const event = req.body;

  // Process event types
  switch(event.type) {
    case 'ContactCreate':
      // Handle contact creation
      break;
    case 'ContactUpdate':
      // Handle contact update
      break;
    default:
      console.log('Unknown event type:', event.type);
  }

  // Return immediate 200 OK
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

### Security Verification

HighLevel uses SHA256 digital signatures in the `x-wh-signature` header.

#### Verification Process

1. Use the provided public key for decryption
2. Create a crypto verifier with SHA256 algorithm
3. Update the verifier with the payload
4. Verify the base64-encoded signature

#### Node.js Verification Example

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, publicKey) {
  const verifier = crypto.createVerify('SHA256');
  verifier.update(JSON.stringify(payload));

  const isValid = verifier.verify(
    publicKey,
    signature,
    'base64'
  );

  return isValid;
}

// Usage
app.post('/webhooks', express.json(), (req, res) => {
  const signature = req.headers['x-wh-signature'];
  const payload = req.body;
  const publicKey = process.env.HIGHLEVEL_PUBLIC_KEY;

  if (!verifyWebhookSignature(payload, signature, publicKey)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  res.status(200).send('OK');
});
```

**Common Issues:**
- "Invalid signature errors" typically stem from:
  - Using incorrect public keys
  - Incomplete payload verification
  - Modifying the payload before verification

### Available Webhook Events (60+ Types)

#### App Management
- `AppInstall`: Application installed
- `AppUninstall`: Application removed

#### Contact Operations
- `ContactCreate`: New contact created
- `ContactDelete`: Contact removed
- `ContactUpdate`: Contact information modified
- `ContactDndUpdate`: Do Not Disturb status changed
- `ContactTagUpdate`: Tags modified

#### Appointment Management
- `AppointmentCreate`: New appointment scheduled
- `AppointmentDelete`: Appointment canceled
- `AppointmentUpdate`: Appointment details changed

#### Opportunity Tracking
- `OpportunityCreate`: New opportunity created
- `OpportunityDelete`: Opportunity removed
- `OpportunityStageUpdate`: Pipeline stage changed
- `OpportunityStatusUpdate`: Status modified
- `OpportunityMonetaryValueUpdate`: Value changed
- `OpportunityAssignedToUpdate`: Assignment changed

#### Invoice Processing
- `InvoiceCreate`: New invoice created
- `InvoiceDelete`: Invoice removed
- `InvoiceUpdate`: Invoice modified
- `InvoicePaid`: Full payment received
- `InvoicePartiallyPaid`: Partial payment received
- `InvoiceVoid`: Invoice voided

#### Messaging
- `InboundMessage`: Incoming message received
- `OutboundMessage`: Outgoing message sent
- `ProviderOutboundMessage`: Custom provider message

#### Business Objects
- `ProductCreate`: New product added
- `PriceCreate`: New pricing created
- `OrderCreate`: New order placed
- `TaskCreate`: New task created
- `NoteCreate`: New note added
- `RecordCreate`: New record created

#### Additional Integrations
- `ExternalAuthConnected`: OAuth2 or Basic authentication established
- `LCEmailStats`: Email delivery metrics
- `VoiceAiCallEnd`: Voice AI call terminated

### Configuration Process

#### Steps to Enable Webhooks

1. **Create OAuth Application**: In the HighLevel marketplace
2. **Define Scopes**: Select data access permissions
3. **Configure Webhook URLs**: In advanced settings
4. **Toggle Specific Events**: Choose which notifications to receive

### Reliable Handling Best Practices

✅ **Required:**
- **Immediate 200 OK responses** (process asynchronously)
- **Duplicate detection** using stored webhook IDs
- **Comprehensive logging** for debugging
- **Idempotent operations** for safe re-execution

#### Example with Duplicate Detection

```javascript
const processedWebhooks = new Set();

app.post('/webhooks', express.json(), async (req, res) => {
  const webhookId = req.body.id;

  // Return 200 immediately
  res.status(200).send('OK');

  // Check for duplicates
  if (processedWebhooks.has(webhookId)) {
    console.log('Duplicate webhook ignored:', webhookId);
    return;
  }

  // Process asynchronously
  processedWebhooks.add(webhookId);

  try {
    await processWebhook(req.body);
  } catch (error) {
    console.error('Webhook processing failed:', error);
  }
});
```

### Retry Mechanism

**Important:** HighLevel retries webhook deliveries only upon receiving **429 (rate limit)** responses.

**Retry Details:**
- **Retry interval**: 10-minute spacing plus random jitter
- **Maximum attempts**: 6 attempts
- **Total duration**: Approximately 1 hour 10 minutes
- **Jitter purpose**: Distributes retries to prevent simultaneous server overloads

**No retries for:**
- 200-299 responses (success)
- 400-499 responses except 429 (client errors)
- 500-599 responses (server errors)

### Testing Approaches

#### 1. Webhook.site
- Real-time observation of webhook payloads
- No coding required
- Instant setup

#### 2. Ngrok
- Expose local development server
- Test with actual application code
- Debug in real-time

```bash
ngrok http 3000
```

#### 3. Sample JSON Payloads
- Test handler validation
- Unit testing
- Mock webhook scenarios

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Invalid signatures | Verify public key and complete payload verification |
| Duplicate processing | Implement deduplication using webhook IDs |
| Timeout problems | Return 200 immediately, process asynchronously |
| Missing events | Confirm subscription and scope authorization |
| Scope limitations | Update OAuth scopes in app configuration |

---

## Billing Integration

### Overview

The billing webhook captures and updates payment information for externally-billed, paid marketplace apps that don't use HighLevel's internal billing system.

### Prerequisites

✅ **Required:**
- App with "Paid" business model designation
- External Billing enabled in marketplace configuration
- Billing URL entered in app settings

### Parameter Retrieval Flow

When users install your app, they're redirected to your Billing URL with these parameters:

| Parameter | Values | Context |
|-----------|--------|---------|
| `clientId` | `<client_id>` | Validation purposes |
| `installType` | `location`, `agency`, or both | Installation scope |
| `locationId` | `<location_id>` | Provided for location/hybrid installs |
| `companyId` | `<agency_id>` | Provided for agency/hybrid installs |

**Note:** "You will receive a list of locationIds in a comma-separated format" when handling multiple installations.

### Webhook Endpoint & Request Details

**Endpoint:** `https://services.leadconnectorhq.com/oauth/billing/webhook`

**Method:** POST

#### Required Headers

```
x-ghl-client-key: your_client_key
x-ghl-client-secret: your_client_secret
Content-Type: application/json
```

#### Request Body Parameters

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `clientId` | string | Yes | Your client identifier |
| `authType` | enum | Yes | `company` or `location` |
| `locationId` | string | Conditional | Required when authType is `location` |
| `companyId` | string | Conditional | Required when authType is `company` |
| `subscriptionId` | string | Optional | For subscription models |
| `paymentId` | string | Optional | For one-time payments |
| `amount` | number | Yes | Billed amount |
| `status` | enum | Yes | `COMPLETED` or `FAILED` |
| `paymentType` | enum | Yes | `one_time` or `recurring` |

#### Example Request

```javascript
const axios = require('axios');

async function reportBillingEvent(billingData) {
  try {
    const response = await axios.post(
      'https://services.leadconnectorhq.com/oauth/billing/webhook',
      {
        clientId: billingData.clientId,
        authType: 'location',
        locationId: billingData.locationId,
        amount: 29.99,
        status: 'COMPLETED',
        paymentType: 'recurring',
        subscriptionId: 'sub_12345'
      },
      {
        headers: {
          'x-ghl-client-key': process.env.GHL_CLIENT_KEY,
          'x-ghl-client-secret': process.env.GHL_CLIENT_SECRET,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Billing event reported:', response.data);
  } catch (error) {
    console.error('Billing webhook failed:', error);
  }
}
```

### Key Limitation

⚠️ **Important:** "You need to trigger the webhook for each location and company separately"

Batch updates are NOT supported. Each billing event requires a separate webhook call.

---

## Private Integration Tokens

### What Are Private Integrations?

Private Integrations enable secure custom connections between HighLevel accounts and third-party applications. They function as "static/fixed OAuth2 Access Tokens" that users generate directly from their account settings.

### Creation Process

Users follow four straightforward steps:

1. Click "Create new Integration"
2. Provide a name and description
3. Select specific scopes/permissions needed
4. Copy and securely share the generated token

⚠️ **Important:** The token cannot be retrieved after initial generation, so copying it immediately is essential.

### Key Advantages

Private Integrations offer:

- ✅ **Enhanced security** through restricted scope management
- ✅ **Modern API access** to state-of-the-art API v2.0 (versus outdated v1.0)
- ✅ **More robust features** compared to legacy API keys

### Usage Implementation

Tokens integrate into API requests via the Authorization header:

```bash
curl -X GET \
  https://services.leadconnectorhq.com/contacts/ \
  -H 'Authorization: Bearer YOUR_PRIVATE_TOKEN' \
  -H 'Content-Type: application/json'
```

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    'Authorization': `Bearer ${process.env.HIGHLEVEL_PRIVATE_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Use the client
async function getContacts() {
  const response = await client.get('/contacts/');
  return response.data;
}
```

### Critical Security Practices

#### Token Rotation

- **Recommended schedule**: Every 90 days
- **Compromise response**: Use "Rotate and expire this token now" option
- **Grace period**: 7-day window where old and new tokens function simultaneously

#### Permission Management

- **Updates**: Can be modified without regenerating the token
- **Principle of least privilege**: Only grant necessary scopes

### Access Control

**Default:**
- Agency admins create and manage integrations by default

**Customization:**
- Permissions customizable at individual user levels
- Managed through: **Settings > Team > Roles & Permissions**

### Private Integration vs OAuth

| Feature | Private Integration | OAuth 2.0 |
|---------|-------------------|-----------|
| Use Case | Internal integrations | Marketplace apps |
| Token Type | Static/permanent | Temporary with refresh |
| Expiration | Manual rotation | Automatic (24 hours) |
| Setup Complexity | Simple | Complex |
| User Authorization | Not required | Required |
| API Version | v2.0 | v2.0 |

---

## Payment Integration

### Architecture Overview

The integration framework enables developers to connect custom payment gateways to GoHighLevel through a marketplace app model. The system operates via:
- OAuth authentication
- Webhook events
- Iframe-based custom pages for credential management

### Prerequisites

✅ **Required:**
- Active HighLevel account with marketplace access
- Cloud-hosted backend service to process payment requests
- Publicly accessible pages for payment UI and authentication flows

### Setup Requirements

#### 1. Marketplace App Configuration

**Required OAuth Scopes:**
- Payment orders
- Subscriptions
- Transactions
- Custom provider access
- Product management capabilities

**App Configuration:**

| Setting | Description |
|---------|-------------|
| **Redirect URL** | Receives OAuth authorization code after installation |
| **Client Keys** | Stored securely server-side for token exchange |
| **Webhook URL** | Notified of app installation/uninstallation events |
| **SSO Key** | Decrypts authentication tokens for custom pages |

#### 2. Payment Provider Settings

Specify provider details:

**Basic Information:**
- Provider name
- Description
- Logo imagery for marketplace visibility

**Supported Payment Types:**
- **OneTime**: Single fixed payments
- **Recurring**: Subscription-based charges
- **Off Session**: Stored payment method charging

#### 3. App Profile Classification

Set category as **"Third Party Provider"** to ensure proper placement in:
- App Marketplace
- Payments > Integrations section

### Payment Flow Architecture

#### Initiation Phase

**Step 1:** Your hosted `paymentsUrl` dispatches a `custom_provider_ready` event

```javascript
window.parent.postMessage({
  type: 'custom_provider_ready',
  data: {
    addCardOnFileSupported: true,
    refundSupported: true
  }
}, '*');
```

**Step 2:** HighLevel responds with `payment_initiate_props`

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'payment_initiate_props') {
    const {
      publishableKey,
      amount,
      currency,
      contactId,
      orderId,
      locationId,
      productDetails
    } = event.data;

    // Initialize payment form
    initializePayment(event.data);
  }
});
```

#### Response Handling

Upon payment completion, dispatch one of three events:

**Success:**
```javascript
window.parent.postMessage({
  type: 'custom_element_success_response',
  data: {
    chargeId: 'ch_12345',
    transactionId: 'txn_67890',
    amount: 99.99,
    currency: 'USD'
  }
}, '*');
```

**Failure:**
```javascript
window.parent.postMessage({
  type: 'custom_element_error_response',
  data: {
    error: 'Card declined',
    errorCode: 'card_declined'
  }
}, '*');
```

**Cancellation:**
```javascript
window.parent.postMessage({
  type: 'custom_element_close_response'
}, '*');
```

#### Verification Process

HighLevel queries your backend's `queryUrl` endpoint:

**POST Request:**
```json
{
  "type": "verify_payment",
  "chargeId": "ch_12345",
  "apiKey": "your_api_key"
}
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "amount": 99.99,
  "currency": "USD",
  "timestamp": "2025-10-29T00:00:00Z"
}
```

or

```json
{
  "success": false,
  "status": "failed",
  "error": "Payment not found"
}
```

or

```json
{
  "success": true,
  "status": "pending"
}
```

### Payment Method Management

#### Card Storage Setup

Enable card-on-file functionality:

```javascript
window.parent.postMessage({
  type: 'custom_provider_ready',
  data: {
    addCardOnFileSupported: true
  }
}, '*');
```

HighLevel sends `setup_initiate_props` for credential collection:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'setup_initiate_props') {
    const {
      publishableKey,
      contactId,
      locationId
    } = event.data;

    // Show card collection form
    showCardForm(event.data);
  }
});
```

#### Method Retrieval

HighLevel requests stored payment methods via POST to your `queryUrl`:

**Request:**
```json
{
  "type": "get_payment_methods",
  "contactId": "contact_123",
  "apiKey": "your_api_key"
}
```

**Response:**
```json
{
  "paymentMethods": [
    {
      "id": "pm_12345",
      "type": "card",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "customerId": "cus_67890"
    }
  ]
}
```

#### Off-Session Charging

When charging stored methods:

**Request to Your Backend:**
```json
{
  "type": "charge_payment_method",
  "paymentMethodId": "pm_12345",
  "contactId": "contact_123",
  "amount": 49.99,
  "currency": "USD",
  "apiKey": "your_api_key"
}
```

**Response:**
```json
{
  "success": true,
  "chargeId": "ch_98765",
  "status": "completed",
  "amount": 49.99,
  "currency": "USD",
  "timestamp": "2025-10-29T00:00:00Z"
}
```

### Refund Processing

Handle refund events from HighLevel:

**Request:**
```json
{
  "type": "refund",
  "chargeId": "ch_12345",
  "amount": 49.99,
  "apiKey": "your_api_key"
}
```

**Support Requirements:**
- ✅ Partial refunds supported
- ✅ Multiple refund requests on single transactions permitted
- ❌ Cumulative amounts must not exceed original charge

**Response:**
```json
{
  "success": true,
  "refundId": "ref_54321",
  "amount": 49.99,
  "status": "completed",
  "timestamp": "2025-10-29T00:00:00Z"
}
```

### Webhook Integration

HighLevel posts events to your webhook endpoint:

#### Subscription Events

**subscription.trialing:**
```json
{
  "type": "subscription.trialing",
  "chargeId": "ch_12345",
  "transactionId": "txn_67890",
  "locationId": "loc_abc",
  "apiKey": "your_api_key",
  "chargeSnapshot": {
    "amount": 29.99,
    "currency": "USD",
    "status": "trialing"
  }
}
```

**subscription.active:**
```json
{
  "type": "subscription.active",
  "chargeId": "ch_12345",
  "locationId": "loc_abc",
  "chargeSnapshot": {
    "amount": 29.99,
    "status": "active"
  }
}
```

**subscription.updated:**
```json
{
  "type": "subscription.updated",
  "chargeId": "ch_12345",
  "chargeSnapshot": {
    "amount": 49.99,
    "previousAmount": 29.99
  }
}
```

**subscription.charged:**
```json
{
  "type": "subscription.charged",
  "chargeId": "ch_12345",
  "transactionId": "txn_new",
  "chargeSnapshot": {
    "amount": 29.99,
    "billingCycle": "monthly"
  }
}
```

#### Payment Events

**payment.captured:**
```json
{
  "type": "payment.captured",
  "chargeId": "ch_12345",
  "transactionId": "txn_67890",
  "locationId": "loc_abc",
  "apiKey": "your_api_key",
  "chargeSnapshot": {
    "amount": 99.99,
    "currency": "USD",
    "status": "captured"
  }
}
```

### Configuration API Requirements

After installation, call the config connection endpoint:

**POST Request:**
```json
{
  "name": "MyPayment Gateway",
  "description": "Fast and secure payments",
  "imageUrl": "https://example.com/logo.png",
  "locationId": "loc_abc123",
  "queryUrl": "https://api.mypayment.com/highlevel/query",
  "paymentsUrl": "https://pay.mypayment.com/highlevel/checkout"
}
```

**Separate Configuration for API Keys:**

**Test Mode:**
```json
{
  "mode": "test",
  "apiKey": "sk_test_12345",
  "publishableKey": "pk_test_67890"
}
```

**Live Mode:**
```json
{
  "mode": "live",
  "apiKey": "sk_live_12345",
  "publishableKey": "pk_live_67890"
}
```

**Purpose:**
- `apiKey`: Authenticates backend requests
- `publishableKey`: Enables frontend verification

### Testing Methodology

✅ **Before Marketplace Launch:**

1. Validate integration across different payment channels in test mode
2. Confirm all event dispatching works correctly
3. Test verification callbacks
4. Verify error handling functions properly
5. Test refund processing
6. Validate webhook delivery
7. Test card-on-file functionality

### Security Considerations

🔒 **Critical Security Practices:**

- ✅ Store client keys and SSO keys exclusively on backend servers
- ✅ Use HTTPS for all endpoints
- ✅ Implement OAuth token exchange securely
- ✅ Validate API keys in webhook requests
- ✅ Encrypt sensitive payment data per PCI compliance
- ❌ Never expose secrets in client-side code
- ❌ Never log full payment card numbers
- ❌ Never store raw card data on your servers

---

## API Endpoints

### Overview

The HighLevel API provides comprehensive REST endpoints for managing CRM operations, automation, and integrations.

**Base URL:** `https://services.leadconnectorhq.com`

**API Version:** 2.0

### Contacts API

The Contacts API enables management of contact data within the system.

#### Available Endpoints

1. **Get Contact** - Retrieve individual contact details
2. **Create Contact** - Add new contacts to the system
3. **Update Contact** - Modify existing contact information
4. **Delete Contact** - Remove contacts
5. **Upsert Contact** - Create or update contacts based on existing data
6. **Get Contacts** - Retrieve multiple contacts
7. **Get Contacts By BusinessId** - Fetch contacts filtered by business identifier

#### Key Features

**Duplicate Handling:**
- The Upsert endpoint respects "Allow Duplicate Contact" settings configured at the location level
- Checks both email and phone fields according to a priority sequence
- Prevents duplicate creation automatically

**Field Specifications:**
- Accepts a "country" field with specific acceptable values
- Supports custom fields
- Tags management
- DND (Do Not Disturb) settings

#### Related Sub-Categories

- Tasks
- Appointments
- Tags
- Notes
- Campaigns
- Workflows
- Bulk operations
- Search
- Follower management

### Conversations API

The Conversations API manages messaging and communication threads.

#### Available Endpoints

1. **Get Conversation** - "Get the conversation details based on the conversation ID"
2. **Update Conversation** - "Update the conversation details based on the conversation ID"
3. **Delete Conversation** - "Delete the conversation details based on the conversation ID"
4. **Create Conversation** - "Creates a new conversation with the data provided"

#### Additional Features

- **Search functionality** - Query and filter conversations
- **Email operations** - Email-specific conversation handling
- **Messages** - Manage individual messages within conversations
- **Providers** - Integration with multiple messaging providers

### Calendar API

Manage calendar events and appointments programmatically.

#### Available Endpoints

- **Get Calendars** - Retrieve calendar list
- **Create Calendar Group** - Organize calendars
- **Get Calendar Events** - Fetch scheduled events

### Opportunities API

Track sales pipeline and manage deals.

#### Available Endpoints

- **Get Opportunity** - Retrieve opportunity details
- **Update Opportunity Status** - Modify pipeline status

### Additional API Modules

The HighLevel API documentation includes **25+ API modules**:

- Business
- Campaigns
- Companies
- Objects
- Associations
- Custom Fields V2
- Courses
- Email
- Forms
- Invoices
- Trigger Links
- Sub-Accounts
- Media Storage
- Developer Marketplace
- Blogs
- Funnels
- Payments
- Products
- SaaS
- Snapshots
- Social Planner
- Surveys
- Users
- Workflows
- LC Email
- Custom Menus
- Voice AI
- Proposals
- Knowledge Base
- Conversation AI
- Phone System
- Store
- AI Agent Studio

---

## Developer Glossary

### Core Concepts

**Developer's Marketplace**
"A platform within GoHighLevel that allows developers to build and integrate their applications"

**API**
"A set of rules and protocols that allows different software applications to communicate with each other"

**OAuth**
"An industry-standard protocol that enables secure app authorization and authentication"

### Authentication & Authorization

**Access Token**
Credential apps use to access protected resources; obtained through OAuth and included in request headers

**Refresh Token**
"A credential that can be used to obtain a new Access Token without requiring the user to reauthorize"

**Authorization Code**
"A short-lived credential obtained after a user successfully authorizes an app"

**Authorization Header**
"An HTTP header that includes authentication credentials in API requests, such as an Access Token"

**API Key**
"A unique identifier or code provided to developers granting API access"

### OAuth Flow Components

**Redirect URI**
"The URL that GoHighLevel will send users after authorizing the app's access"

**Callback URL**
"The endpoint that receives the authorization code or access token after the user grants permission"

**Scopes**
"Define the specific permissions and access rights an app requires to interact with GoHighLevel"

### Identifiers

**AppID**
"The unique identifier for your marketplace application"

**Conversation Provider ID**
"The unique identifier for the type of provider a user installs"

**Location ID**
"A unique identifier assigned to a specific location within a GoHighLevel account"

**Company ID**
"A unique identifier assigned to a GoHighLevel company or account"

### API Operations

**Endpoint**
"A specific URL or URI representing an API resource or functionality"

**Request**
Communication to the API including HTTP method, URL, headers, and parameters

**Response**
"The server's reply to a request made by an app" containing data and status codes

**Status Code**
"A three-digit number returned by the server to indicate the outcome of an HTTP request"

**Parameters**
"Additional values included in an API request to provide specific instructions or filter data"

**Pagination**
"Dividing a large data set into smaller, more manageable parts called pages"

**Rate Limiting**
"A mechanism APIs use to restrict client or user's requests within a specific period"

### HTTP Methods

**GET**
Retrieves data from a server

**POST**
Submits data to create new resources

**PUT**
Updates or replaces existing server data

**DELETE**
Removes resources from a server

### Event-Driven Architecture

**Webhooks**
"HTTP callbacks or notifications sent from one application to another when a specific event occurs"

**Event**
"A specific occurrence or action within an application or system" that triggers webhooks

### Data Format

**JSON**
"A lightweight data-interchange format that is easy for humans to read and write"

### Distribution & Deployment

**Distribution Type**
Specifies app availability—either Agency-wide or Sub-Account specific

**Live Server**
"The actual production environment where the app interacts with GoHighLevel's API"

### Development Frameworks

**SDK**
"A set of tools, libraries, and documentation developers use to build applications"

### Development Disciplines

**Front-End Development**
"Building the user-facing components of a software application" using HTML, CSS, JavaScript

**Back-End Development**
"Server-side components" handling logic, storage, and processing

---

## Complete Webhook Event Reference

### App Events
- `AppInstall`
- `AppUninstall`

### Contact Events
- `ContactCreate`
- `ContactDelete`
- `ContactUpdate`
- `ContactDndUpdate`
- `ContactTagUpdate`

### Appointment Events
- `AppointmentCreate`
- `AppointmentDelete`
- `AppointmentUpdate`

### Opportunity Events
- `OpportunityCreate`
- `OpportunityDelete`
- `OpportunityStageUpdate`
- `OpportunityStatusUpdate`
- `OpportunityMonetaryValueUpdate`
- `OpportunityAssignedToUpdate`

### Invoice Events
- `InvoiceCreate`
- `InvoiceDelete`
- `InvoiceUpdate`
- `InvoicePaid`
- `InvoicePartiallyPaid`
- `InvoiceVoid`

### Messaging Events
- `InboundMessage`
- `OutboundMessage`
- `ProviderOutboundMessage`

### Business Object Events
- `ProductCreate`
- `ProductUpdate`
- `ProductDelete`
- `PriceCreate`
- `PriceUpdate`
- `PriceDelete`
- `OrderCreate`
- `OrderUpdate`
- `OrderDelete`
- `TaskCreate`
- `TaskUpdate`
- `TaskDelete`
- `NoteCreate`
- `NoteUpdate`
- `NoteDelete`
- `RecordCreate`
- `RecordUpdate`
- `RecordDelete`

### Integration Events
- `ExternalAuthConnected`
- `LCEmailStats`
- `VoiceAiCallEnd`

---

## Quick Reference

### Essential URLs

**OAuth Token Endpoint:**
```
POST https://services.leadconnectorhq.com/oauth/token
```

**Location Token Endpoint:**
```
POST https://services.leadconnectorhq.com/oauth/locationToken
```

**Billing Webhook Endpoint:**
```
POST https://services.leadconnectorhq.com/oauth/billing/webhook
```

**API Base URL:**
```
https://services.leadconnectorhq.com
```

### Authentication Headers

**OAuth:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Private Integration:**
```
Authorization: Bearer YOUR_PRIVATE_TOKEN
Content-Type: application/json
```

**Billing Webhook:**
```
x-ghl-client-key: YOUR_CLIENT_KEY
x-ghl-client-secret: YOUR_CLIENT_SECRET
Content-Type: application/json
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Resources

### Official Documentation
- **Main Portal**: https://marketplace.gohighlevel.com/docs/
- **OAuth Guide**: https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html
- **SDK Guide**: https://marketplace.gohighlevel.com/docs/oauth/GettingStartedSDK/index.html
- **Webhook Guide**: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html

### SDK Installation
```bash
npm i @gohighlevel/api-client
```

### Support
- HighLevel SDK Examples: GitHub repository
- Developer Community: HighLevel Marketplace
- Technical Support: Through marketplace portal

---

## Changelog

This documentation was compiled from the official HighLevel API documentation on October 29, 2025.

For the latest updates and changes, refer to:
- **Changelog**: https://marketplace.gohighlevel.com/docs/category/changelog

---

## Summary

This comprehensive guide covers:
- ✅ OAuth 2.0 implementation with complete authorization flows
- ✅ SDK setup and usage with TypeScript/JavaScript
- ✅ App distribution strategies and configuration
- ✅ Webhook integration with 60+ event types
- ✅ Billing integration for paid marketplace apps
- ✅ Private integration tokens for internal use
- ✅ Custom payment gateway integration
- ✅ Complete API endpoint reference
- ✅ Developer glossary with all key terms

**Next Steps:**
1. Set up your OAuth application in the marketplace
2. Install the SDK and configure authentication
3. Implement webhook handlers for real-time events
4. Test in development environment
5. Submit to marketplace for review

Happy building! 🚀
# Authorization

HighLevel supports the Authorization Code Grant flow with v2 APIs. Please find the step-by-step procedure to use and understand the OAuth 2.0 flow.

Here's a [Loom Video](https://www.loom.com/share/f32384758de74a4dbb647e0b7962c4ea?sid=0907a66d-a160-4b51-bcd4-c47ebae37fca) to walk you through the entire process.

### 1. Register an OAuth app

1. Go to the [Marketplace](https://marketplace.gohighlevel.com)
2. Sign up for a developer account.
3. Go to "My Apps," and click on "Create App."
4. Fill up the required details in the form, then your app will be created.
5. Click on the app, and it will take you to settings where you can configure the scopes, generate the keys, etc.

### 2. Add the app to your desired location

1. Make the location/agency Admin go to the app's Authorization Page URL.
2. They select the location they want to connect.
3. They are redirected to the redirect URL with the Authorization Code.
4. Use the Authorization Code to get the Access token via the Get Access Token API under OAuth 2.0.
5. Use the Access Token to call any API.

### 3. Get the app's Authorization Page URL

To generate the Authorization Page URL for an app, replace the `client_id`, `redirect_uri`, and `scope` in the template below. Then, redirect the location/agency admin trying to install your app to the URL.

1. For standard Auth URL flow:

```
https://marketplace.gohighlevel.com/oauth/chooselocation?
response_type=code&
redirect_uri=https://myapp.com/oauth/callback/gohighlevel&
client_id=CLIENT_ID&
scope=conversations/message.readonly conversations/message.write
```

2. For White-labeled Auth URL flow:

```
https://marketplace.leadconnectorhq.com/oauth/chooselocation?
response_type=code&
redirect_uri=https://myapp.com/oauth/callback/gohighlevel&
client_id=CLIENT_ID&
scope=conversations/message.readonly conversations/message.write
```

<b>NOTE:</b> For the users who are not logged in to the application at the time of giving consent, developer has option to initiate login in new tab or in same tab. For initiating login in same tab, developer need to append `&loginWindowOpenMode=self` to authorization url. If the query param not passed, login in new tab would be default.

When a user grants access, their browser is redirected to the specified redirect URI, and the Authorization Code is passed inside the code query parameter.

```
https://myapp.com/oauth/callback/gohighlevel?code=7676cjcbdc6t76cdcbkjcd09821jknnkj
```

## OAuth FAQs

### How long are the access tokens valid?

The access tokens are valid for a day. After that, you can use the refresh token to get a new access token which will be valid for another day.

### How long are the refresh tokens valid?

The refresh tokens are valid for a year unless they are used. If they are used, the new refresh token is valid for a year as well.

### How should we handle token expiry?

You should:

1. Make a request to any of our APIs using the accessToken.
2. If you get a response saying that the token is expired, refresh the token using our API and save the new access token and refresh token in your database.
3. Make the request again with the new accessToken.

You can write a wrapper function on your end to achieve this. You can use it for all the API calls you make to our APIs.

### What are current rate limits for API 2.0?

GHL has implemented rate limits on our public V2 APIs using OAuth to ensure optimal performance and stability. These limits have been adjusted to:

Burst limit: A maximum of 100 API requests per 10 seconds for each Marketplace app (i.e., client) per resource (i.e., Location or Company).
Daily limit: 200,000 API requests per day for each Marketplace app (i.e., client) per resource (i.e., Location or Company).

These new limits contribute to better overall performance and stability of our system.

To monitor your limited usage, refer to the following API response headers:

'X-RateLimit-Limit-Daily': Your daily limit
'X-RateLimit-Daily-Remaining': The remaining number of requests for the day
'X-RateLimit-Interval-Milliseconds': The time interval for burst requests
'X-RateLimit-Max': The maximum request limit in the specified time interval
'X-RateLimit-Remaining': The remaining number of requests in the current time interval

Example: If the 'GHL-APP' is installed on two locations (Sub-account A and Sub-account B) on the GHL Marketplace, the rate limits for each location would be as follows:

1. Sub-account A: 'GHL-APP' can make 200,000 API requests per day and 100 API requests per 10 seconds.
2. Sub-account B: 'GHL-APP' can make 200,000 API requests per day and 100 API requests per 10 seconds.
# Billing Webhook

This webhook is essential for externally billed apps within our marketplace. It must be accessed by developers to authorize the installation of the app.

The primary purpose of this webhook is to capture and update payment information for apps that employ a Paid business model and do not utilize HighLevel's internal billing mechanism.

## 1. Prerequisites for using this webhook

Before using this webhook, ensure that you meet the following prerequisites on the [Marketplace](https://marketplace.gohighlevel.com):

1. You should have an app with a Business Model marked as Paid.
2. External Billing must be enabled for your app.
3. You must have entered the Billing URL.

## 2. Retrieving Parameters from the Billing URL

When an Agency or Location installs your app, they will be redirected to the Billing URL specified in the configuration. You will receive the following parameters in the URL:

| Parameter Name | Possible Values      | Notes                                                                   |
| -------------- | -------------------- | ----------------------------------------------------------------------- |
| clientId       | `<client_id>`        | Used for validation.                                                    |
| installType    | `location`, `agency` | You will receive `agency,location` in case of both agency and location. |
| locationId     | `<location_id>`      | You will receive this in case of `location` or `agency,location`.       |
| companyId      | `<agency_id>`        | You will receive this in case of `agency` or `agency,location`.         |

## 3. Using The Webhook

After successfully processing the payment on your end, you need to make a request to our billing webhook endpoint:

```
https://services.leadconnectorhq.com/oauth/billing/webhook
```

The parameters you need to include in the webhook request are as follows:

**Request Method:**
POST

**Request Headers:**

| Name                | Value              | Notes                                                                          |
| ------------------- | ------------------ | ------------------------------------------------------------------------------ |
| x-ghl-client-key    | Your client key    | This should be from the same client for which you are authorizing the payment. |
| x-ghl-client-secret | Your Client Secret | The corresponding client secret for the client key used.                       |
| Content-Type        | application/json   |

**Request Body:**

| Name           | Value                | Notes                                                             |
| -------------- | -------------------- | ----------------------------------------------------------------- |
| clientId       | Your client ID       |                                                                   |
| authType       | Enum                 | Possible values are `company` and `location`.                     |
| locationId     | `<location_id>`      | Required when authType is `location`.                             |
| companyId      | `<company_id>`       | Required when authType is `company`.                              |
| subscriptionId | Your subscription ID | You can include this if you have configured a subscription model. |
| paymentId      | Your Payment ID      | In case of a one-time payment model, you can send this parameter. |
| amount         | Billed Amount        | Required.                                                         |
| status         | Enum                 | Possible values are `COMPLETED` and `FAILED`.                     |
| paymentType    | Enum                 | Possible values are `one_time` and `recurring`.                   |

### Example

Here is a sample cURL command for the webhook request:

```shell
curl --location 'https://services.leadconnectorhq.com/oauth/billing/webhook' \
--header 'x-ghl-client-key: <client_key>' \
--header 'x-ghl-client-secret: <client_secret>' \
--header 'Content-Type: application/json' \
--data '{
    "clientId": "<client_id>",
    "authType": "location",
    "locationId": "<location_id>",
    "subscriptionId": "<subscription_id>",
    "paymentId": "<payment_id>",
    "amount": 12,
    "status": "COMPLETED",
    "paymentType": "recurring"
}'
```

## Webhook FAQs

### Can I get multiple location ids in the Billing URL?

Yes, in the case of multiple installations, you will receive a list of locationIds in a comma-separated format in the billing URL.

### Can I update for multiple locations in one call?

No, you need to trigger the webhook for each location and company separately.
# External Authentication

External authentication enables developers to authenticate HighLevel users using their credentials with the developer’s system before installing the application on HighLevel.

This feature allows you to configure custom authentication fields as necessary, such as:

- apiKey
- username
- password
- oauth 2.0

###### How to enable external authentication on the application?

Navigate to Developer Marketplace > My Apps > select your app and click on ‘External Authentication’ tab in the navigation pane. We support API Key/Basic Auth and OAuth2.0

## OAuth 2.0

Adding OAuth v2 Authentication to Marketplace Apps
This document outlines the process of configuring OAuth 2.0 authentication for external calls within Marketplace apps. Currently, only the "Authorization Code" grant type is supported. HighLevel manages token pairs and includes them in custom actions and triggers, enabling a wide range of integration possibilities.

### 1. Configuration

Follow these steps to configure OAuth v2 authentication:

<ol type="a">
<li> 
<b>App Details and Scopes:</b>

Provide the name of your third-party app, client key, and client secret.
Specify the required scopes for your third-party integration. Separate scopes with spaces or commas. Include only the necessary scopes for the integration.

</li>

<li> 
<b>Redirect URL:</b>

Copy the redirect URL provided in your Marketplace app configuration and paste it into your third-party app's configuration settings.

</li>

<li> 
<b>Authorization URL Configuration:</b>

Configure the authorization URL. Marketplace pre-populates some standard fields, which you can adjust based on the third-party app's documentation.
The state parameter is a standard OAuth2 security feature that prevents authorization requests from being initiated by unauthorized parties. Marketplace uses the state parameter to verify the validity of callback requests. Ensure this parameter is not modified for seamless integration.

</li>

<li> 
<b>Access & Refresh Token Request Configuration:</b>

Configure the access and refresh token request settings according to the third-party app's documentation. Marketplace pre-populates some standard configurations, which you can modify as needed. Click the "More Options" button to add any additional call details required.

Example Expected Response:

```
{
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "expires_in": 3600, // Example expiry time in seconds
}
```

</li>

<li> 
<b>Auto Refresh Token:</b>

Enable the "Auto refresh token" option to automatically fetch new token pairs using the refresh API when tokens expire.
If auto-refresh is disabled, the connection will break after token expiration. The user will need to re-authorize to re-establish the connection. We recommend to enable this option for smooth hustle free experience.

</li>

<li> 
<b>Test API:</b>

Configure a test API endpoint (ideally a GET call requiring no special configuration) to validate the token. HighLevel will call this API to check token validity. If the test fails and auto-refresh is enabled, Marketplace will attempt to refresh the token.
The access token is included by default in all API calls. If your API requires additional configuration for the test call, click the "More Options" button to add the necessary options.

</li>
</ol>

Refresh Mechanism:
The refresh mechanism is triggered only when a workflow with custom actions/triggers is about to execute. The access token is passed to all external calls involved in Marketplace custom action/trigger configurations.

#### Glossary

##### OAuth Parameters

The following table describes the essential OAuth parameters used in the authorization flow:

| Parameter       | System Value                            | Description                                                                                                                                                                                                                                            |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `client_id`     | `{{externalApp.clientId}}`              | Unique identifier issued by the third-party application. This ID is used to identify your application during the OAuth process.                                                                                                                        |
| `client_secret` | `{{externalApp.clientSecret}}`          | A confidential key issued alongside the client_id. This secret key is used to authenticate your application when exchanging the authorization code for tokens. Must be kept secure and never exposed to clients.                                       |
| `scope`         | `{{externalApp.scope}}`                 | A space-separated list of permissions that your application requires to access the third-party application's resources. These scopes determine the level of access granted to your application.                                                        |
| `response_type` | `code`                                  | Specifies the type of response expected from the authorization server. GHL exclusively supports the `code` response type, which returns an authorization code that can be exchanged for access and refresh tokens.                                     |
| `state`         | `{{bundle.state}}`                      | A security token generated by GHL to prevent CSRF attacks. This value must be returned unchanged in the callback response. The request will be rejected if the state parameter doesn't match the original value.                                       |
| `redirect_uri`  | `{{bundle.redirectUrl}}`                | The callback URL where the third-party application will send the authorization response. This URL must be pre-registered and must match exactly with the URL provided during the OAuth configuration.                                                  |
| `grant_type`    | `authorization_code` or `refresh_token` | Specifies the type of grant being requested from the authorization server:<br>- `authorization_code`: Used when exchanging the authorization code for access tokens<br>- `refresh_token`: Used when requesting new access tokens using a refresh token |

##### Token Parameters

These parameters are used during the OAuth token exchange process:

| Parameter       | System Value              | Description                                                                                                                                                                            |
| --------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`          | `{{bundle.code}}`         | The authorization code received from the third-party application after successful authorization. This code is temporary and can only be used once to obtain access and refresh tokens. |
| `access_token`  | `{{bundle.accessToken}}`  | The token used to authenticate requests to the third-party API. This token has a limited lifetime and needs to be refreshed periodically.                                              |
| `refresh_token` | `{{bundle.refreshToken}}` | A long-lived token used to obtain new access tokens when the current access token expires. This token remains valid until explicitly revoked.                                          |

### 2. Testing the Integration

Developers can test their configurations using the built-in test functionality. This initiates the OAuth process with the third-party app. Once the token is generated, the configured test API is called. Ensure all configurations are saved before testing.

<b>Important Note:</b> Switching between external authentication types (e.g., from Basic to OAuth) is currently not supported.[Coming soon]

<hr/>

## API Key or Basic Auth

<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/sdItFxW.png"  alt="drawing" width="600"/>
</div>
</br>
There are three sections available.

</br>
</br>
<b>Section 1:</b> Configure your fields
This section contains all the fields that developers want to ask from users while installing the application.
</br>
</br>
<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/T6EtbvW.png"  alt="drawing" width="600"/>
</div>
</br>
To add a field to the user’s authentication form, you may configure the following:

- <b>Label:</b> It is a helpful text describing the field.
- <b>Key:</b> The key that holds the value of the user's input. You may pass the user’s input to your authentication endpoint in the header or body by using the key.
- <b>Type:</b> The type of input shown to the user. Currently, two field types are supported: "text" and "password."
- <b>Required:</b> Is the field required?
- <b>Help Text:</b> A brief about the field that is displayed to the user. You can
- <b>Default field:</b> Default value to be sent in case the user leaves the field empty.

###### NOTE: We currently support a maximum of three fields only.

</br>
<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/HN83bMw.png"  alt="drawing" width="600" height="500"/>
</div>
</br>

<b>Section 2:</b> Configure authentication endpoint
This section lets you configure the HTTP request template that would be made when a user tries to install the application.

</br>
</br>
<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/w72X9ZV.png"  alt="drawing" width="600"/>
</div>
</br>

<b>Type of request:</b> The request can be one of "GET", "POST", "PUT" or "PATCH" (When GET is selected, you will not be able to configure the request body)
<b>URL:</b> It is the URL that would be hit with the request.
<b>URL params:</b> The params that need to be sent with the request.
<b>HTTP headers:</b> The headers that need to be sent with the request.
<b>Request Body:</b> The body that needs to be sent with the request.

###### IMPORTANT NOTE:

1. You may need to pass the user-entered value, such as API Key/ Username / Password for authentication. You can easily access user input data from the userData object, which has the key of field and value entered by the users and can be accessed with {{userData.key}}.
   For example, if your field’s key is ‘apiKey’, then you may access the user-entered value for the ‘apiKey’ using {{userData.apiKey}}.
2. For external auth verification to complete the authentication url should return one of the following status codes: 200, 201, 202, 204.

</br>
<div></div>
<b>Section 3:</b> Test your authentication </br>
This section will allow developers to test the authentication flow with sample values.

</br>
</br>
<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/rq8D1YC.png"  alt="drawing" width="600"/>
</div>
</br>
</br>
</br>
<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/EwoJXAz.png"  alt="drawing" width="600"/>
</div>
</br>

Installation of the application
At the time of installation, user would be asked to enter the fields that you have configured.
Here’s a sample authentication form displayed to the user at the time of installation.

<div style="display: flex; justify-content: center">
  <img src="https://i.imgur.com/gCWXURo.png"  alt="drawing" width="600"/>
</div>
</br>

###### External auth request parameters

| Key                 | Type     | Details                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| companyId           | string   | <ul> <li>This parameter is set to agencyId if the application was installed by an agency; </li> <li>It will be null if the application was installed by a location</li></ul>                                                                                                                                                                                   |
| {field_key}         | string   | <ul> <li> Key: The key for the parameter is the key of the field. </li><li>There can be a maximum of three fields and hence three keys in the request parameter.</li><li>The value for the parmeters will be as per the agency user’s response</li></ul>                                                                                                       |
| approveAllLocations | boolean  | <div> <div><ul> <li> True - if “Select all N sub-accounts” checkbox was selected during installation</li> <li> False - if “Select all N sub-accounts” checkbox was not selected during installation</li></ul></div> <div style="display: flex; justify-content: center"> <img src="https://i.imgur.com/jkB3WZ3.png"  alt="drawing" width="600"/> </div> </div> |
| locationId          | string[] | <ul> <li>If approveAllLocations = false, this parameter contains an array of locationIds selected during installation </li> <li>If approveAllLocation = true, this parameter is set to null. </li></ul>                                                                                                                                                        |
| excludedLocations   | string[] | <ul> <li>If approveAllLocations = false, this parameter is set to null. </li> <li>If approveAllLocation = true, this parameter contains an array of locationIds which were not selected during installation </li></ul>                                                                                                                                         |

###### NOTE:

- In the POST, PATCH, and PUT requests, the above fields would be sent as part of the body
- In the GET request, the fields would be passed as params

###### Examples:

- Say an agency has 5 locations - A,B,C,D,E
- Let’s assume that the app requires two fields, “username” and “password”.
- Scenario 1: User selects location A while installing the app
  <br>

```js
{
"companyId": "123",
"locationId": {"A"},
"username" : "user1",
"password" : "password123",
"approveAllLocations": false,
"excludedLocations": null
}
```

- Scenario 2: User selects locations A and B while installing the app

```js
{
"companyId": "123",
"locationId": {"A","B"},
"username" : "user1",
"password" : "password123",
"approveAllLocations": false,
"excludedLocations": null
}

```

- Scenario 3: User selects “Select all 5 locations”

```js
{
"companyId": "123",
"locationId": null,
"username" : "user1",
"password" : "password123",
"approveAllLocations": true,
"excludedLocations": null
}

```

- Scenario 4: User selects “Select all 5 locations”, but unchecks location C and D

```js
{
"companyId": "123",
"locationId": null,
"username" : "user1",
"password" : "password123",
"approveAllLocations": true,
"excludedLocations": {"C","D"}
}

```

<!-- <strong >Some important notes for the external authentication: </strong>:

- The new External Authentication feature is backward compatible. Existing apps with the existing external auth setup will continue to work without any action required by developers or app users.
- If you update external auth settings, existing app users would need to re-install the application for new external auth to take place. This is a current limitation in beta that will be addressed shortly. -->
# FAQs

Here you will find answers to commonly encountered questions.

> If you are having trouble and cannot find a suitable answer, please reach out to support.

### How do I listen to webhook events?

For listening to the webhook events -

1. Register for an app.
2. Go to the app settings and update the webhook url (where you want to listen for events)
3. Under the settings, also add the scope needed for the webhook event under the scopes section.
4. Ask the location/agency admin to go to the app page in marketplace and click on "Add App".
5. Select the location, it will redirect you to the redirect uri with the authorization code.
6. Use the authorization code to get the access token.
7. You would start receiving the webhook event for the location.## Overview

These APIs use OAuth 2.0 flow for authentication.

To get started, please follow [Authorization steps](docs/oauth/Authorization.md).

### Standard Response Fields

Below we have listed the standard fields you would receive with every request.

#### TraceId

A traceId represents a unique id for every request and is returned with every response. It is useful in pinpointing the exact request and helps while debugging.
---
tags: [OAuth 2.0]
stoplight-id: vcctp9t1w8hja
---

# **Scopes**

Here is a list of the scopes you require to access the API Endpoints and Webhook Events.

| Scope                           | API Endpoints                                                                      | Webhook Events                      | Access Type         |
| ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------- | ------------------- |
| businesses.readonly             | GET /businesses                                                                    |                                     | Sub-Account         |
| &nbsp;                          | GET /businesses/:businessId                                                        |                                     | Sub-Account         |
| businesses.write                | POST /businesses                                                                   |                                     | Sub-Account         |
| &nbsp;                          | PUT /businesses/:businessId                                                        |                                     | Sub-Account         |
| &nbsp;                          | DELETE /businesses/:businessId                                                     |                                     | Sub-Account         |
| calendars.write                 | POST /calendars/                                                                   |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/:calendarId                                                         |                                     | Sub-Account         |
| &nbsp;                          | DELETE /calendars/:calendarId                                                      |                                     | Sub-Account         |
| calendars.readonly              | GET /calendars/                                                                    |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/:calendarId                                                         |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/:calendarId/free-slots                                              |                                     | Sub-Account         |
| calendars/groups.readonly       | GET /calendars/groups                                                              |                                     | Sub-Account         |
| calendars/groups.write          | POST /calendars/groups                                                             |                                     | Sub-Account         |
| &nbsp;                          | POST /calendars/groups/validate-slug                                               |                                     | Sub-Account         |
| &nbsp;                          | DELETE /calendars/groups/:groupId                                                  |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/groups/:groupId                                                     |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/groups/:groupId/status                                              |                                     | Sub-Account         |
| calendars/resources.readonly    | GET /calendars/resources/:resourceType                                             |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/resources/:resourceType/:id                                         |                                     | Sub-Account         |
| calendars/resources.write       | POST /calendars/resources                                                          |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/resources/:resourceType/:id                                         |                                     | Sub-Account         |
| &nbsp;                          | DELETE /calendars/resources/:resourceType/:id                                      |                                     | Sub-Account         |
| calendars/events.readonly       | GET /calendars/events/appointments/:eventId                                        |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/events                                                              |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/blocked-slots                                                       |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/appointments/:appointmentId/notes                                   |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/:calendarId/notifications/:notificationId                           |                                     | Sub-Account         |
| &nbsp;                          | GET /calendars/:calendarId/notifications                                           |                                     | Sub-Account         |
| calendars/events.write          | DELETE /calendars/events/:eventId                                                  |                                     | Sub-Account         |
| &nbsp;                          | POST /calendars/events/block-slots                                                 |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/events/block-slots/:eventId                                         |                                     | Sub-Account         |
| &nbsp;                          | POST /calendars/events/appointments                                                |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/events/appointments/:eventId                                        |                                     | Sub-Account         |
| &nbsp;                          | POST /calendars/appointments/:appointmentId/notes                                  |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/appointments/:appointmentId/notes/:noteId                           |                                     | Sub-Account         |
| &nbsp;                          | DELETE /calendars/appointments/:appointmentId/notes/:noteId                        |                                     | Sub-Account         |
| &nbsp;                          | POST /calendars/:calendarId/notifications                                          |                                     | Sub-Account         |
| &nbsp;                          | PUT /calendars/:calendarId/notifications/:notificationId                           |                                     | Sub-Account         |
| &nbsp;                          | DELETE /calendars/:calendarId/notifications/:notificationId                        |                                     | Sub-Account         |
| campaigns.readonly              | GET /campaigns/                                                                    | CampaignStatusUpdate                | Sub-Account         |
| contacts.readonly               | GET /contacts/:contactId                                                           | ContactCreate                       | Sub-Account         |
| &nbsp;                          | GET /contacts/:contactId/tasks                                                     | ContactDelete                       | Sub-Account         |
| &nbsp;                          | GET /contacts/:contactId/tasks/:taskId                                             | ContactDndUpdate                    | Sub-Account         |
| &nbsp;                          | GET /contacts/:contactId/notes                                                     | ContactTagUpdate                    | Sub-Account         |
| &nbsp;                          | GET /contacts/:contactId/notes/:id                                                 | NoteCreate                          | Sub-Account         |
| &nbsp;                          | GET /contacts/:contactId/appointments                                              | NoteDelete                          | Sub-Account         |
| &nbsp;                          | GET /contacts/                                                                     | TaskCreate                          | Sub-Account         |
| &nbsp;                          | GET /contacts/business/:businessId                                                 | TaskDelete                          | Sub-Account         |
| contacts.write                  | POST /contacts/                                                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /contacts/:contactId                                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId                                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /contacts/:contactId/tasks                                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /contacts/:contactId/tasks/:taskId                                             | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /contacts/:contactId/tasks/:taskId/completed                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId/tasks/:taskId                                          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /contacts/:contactId/tags                                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId/tags                                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /contacts/:contactId/notes                                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /contacts/:contactId/notes/:id                                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId/notes/:id                                              | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /contacts/:contactId/campaigns/:campaignId                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId/campaigns/removeAll                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId/campaigns/:campaignId                                  | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /contacts/:contactId/workflow/:workflowId                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /contacts/:contactId/workflow/:workflowId                                   | &nbsp;                              | Sub-Account         |
| objects/schema.readonly         | GET /objects/:key                                                                  | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /objects                                                                       | &nbsp;                              | Sub-Account         |
| objects/schema.write            |                                                                                    | &nbsp;                              | Sub-Account         |
| objects/record.readonly         | GET /objects/:schemaKey/records/:id                                                | &nbsp;                              | Sub-Account         |
| objects/record.write            | POST /objects/:schemaKey/records                                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /objects/:schemaKey/records/:id                                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /objects/:schemaKey/records/:id                                             | &nbsp;                              | Sub-Account         |
| conversations.readonly          | GET /conversations/:conversationsId                                                | ConversationUnreadWebhook           | Sub-Account         |
| &nbsp;                          | GET /conversations/search                                                          | &nbsp;                              | Sub-Account         |
| conversations.write             | POST /conversations/                                                               | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /conversations/:conversationsId                                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /conversations/:conversationsId                                             | &nbsp;                              | Sub-Account         |
| conversations/message.readonly  | GET conversations/messages/:messageId/locations/:locationId/recording              | InboundMessage                      | Sub-Account         |
| &nbsp;                          |                                                                                    | OutboundMessage                     | Sub-Account         |
| &nbsp;                          | GET conversations/locations/:locationId/messages/:messageId/transcription          | InboundMessage                      | Sub-Account         |
| &nbsp;                          |                                                                                    | OutboundMessage                     | Sub-Account         |
| &nbsp;                          | GET conversations/locations/:locationId/messages/:messageId/transcription/download | InboundMessage                      | Sub-Account         |
| &nbsp;                          |                                                                                    | OutboundMessage                     |
| conversations/message.write     | POST /conversations/messages                                                       | ConversationProviderOutboundMessage | Sub-Account         |
| &nbsp;                          | POST /conversations/messages/inbound                                               | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /conversations/messages/upload                                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /conversations/messages/:messageId/status                                      | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /conversations/messages/:messageId/schedule                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /conversations/messages/email/:emailMessageId/schedule                      | &nbsp;                              | Sub-Account         |
| conversations/livechat.write    | POST /conversations/providers/live-chat/typing                                     | &nbsp;                              | Sub-Account         |
| forms.readonly                  | GET /forms/                                                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /forms/submissions                                                             | &nbsp;                              | Sub-Account         |
| invoices.readonly               | GET /invoices/                                                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /invoices/:invoiceId                                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /invoices/generate-invoice-number                                              | &nbsp;                              | Sub-Account         |
| invoices.write                  | POST /invoices                                                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /invoices/:invoiceId                                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /invoices/:invoiceId                                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/:invoiceId/send                                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/:invoiceId/void                                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/:invoiceId/record-payment                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/text2pay                                                            | &nbsp;                              | Sub-Account         |
| invoices/schedule.readonly      | GET /invoices/schedule/                                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /invoices/schedule/:scheduleId                                                 | &nbsp;                              | Sub-Account         |
| invoices/schedule.write         | POST /invoices/schedule                                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /invoices/schedule/:scheduleId                                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /invoices/schedule/:scheduleId                                              | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/schedule/:scheduleId/schedule                                       | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/schedule/:scheduleId/auto-payment                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /invoices/schedule/:scheduleId/cancel                                         | &nbsp;                              | Sub-Account         |
| invoices/template.readonly      | GET /invoices/template/                                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /invoices/template/:templateId                                                 | &nbsp;                              | Sub-Account         |
| invoices/template.write         | POST /invoices/template/                                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /invoices/template/:templateId                                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /invoices/template/:templateId                                              | &nbsp;                              | Sub-Account         |
| links.readonly                  | GET /links/                                                                        | &nbsp;                              | Sub-Account         |
| links.write                     | POST /links/                                                                       | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /links/:linkId                                                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /links/:linkId                                                              | &nbsp;                              | Sub-Account         |
| locations.readonly              | GET /locations/:locationId                                                         | LocationCreate                      | Sub-Account, Agency |
|                                 |                                                                                    | LocationUpdate                      | Sub-Account, Agency |
|                                 | GET /locations/search                                                              | &nbsp;                              | Sub-Account, Agency |
|                                 | GET /locations/timeZones                                                           | &nbsp;                              | Sub-Account         |
| locations.write                 | POST /locations/                                                                   | &nbsp;                              | Agency              |
|                                 | PUT /locations/:locationId                                                         | &nbsp;                              | Agency              |
|                                 | DELETE /locations/:locationId                                                      | &nbsp;                              | Agency              |
| locations/customValues.readonly | GET /locations/:locationId/customValues                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /locations/:locationId/customValues/:id                                        | &nbsp;                              | Sub-Account         |
| locations/customValues.write    | POST /locations/:locationId/customValues                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /locations/:locationId/customValues/:id                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /locations/:locationId/customValues/:id                                     | &nbsp;                              | Sub-Account         |
| locations/customFields.readonly | GET /locations/:locationId/customFields                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /locations/:locationId/customFields/:id                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /custom-fields/:id                                                             | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /custom-field/object-key/:key                                                  | &nbsp;                              | Sub-Account         |
| locations/customFields.write    | POST /locations/:locationId/customFields                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /locations/:locationId/customFields/:id                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /locations/:locationId/customFields/:id                                     | &nbsp;                              | Sub-Account         |
| locations/tags.readonly         | GET /locations/:locationId/tags                                                    | &nbsp;                              | Sub-Account         |
|                                 | GET /locations/:locationId/tags/:tagId                                             | &nbsp;                              | Sub-Account         |
| locations/tags.write            | POST /locations/:locationId/tags/                                                  | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /locations/:locationId/tags/:tagId                                             | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /locations/:locationId/tags/:tagId                                          | &nbsp;                              | Sub-Account         |
| locations/templates.readonly    | GET /locations/:locationId/templates                                               | &nbsp;                              | Sub-Account         |
| locations/tasks.readonly        | POST /locations/:locationId/tasks/search                                           | &nbsp;                              | Sub-Account         |
| medias.readonly                 | GET /medias/files                                                                  | &nbsp;                              | Sub-Account         |
| medias.write                    | POST /medias/upload-file                                                           | &nbsp;                              | Sub-Account         |
| funnels/redirect.readonly       | GET /funnels/lookup/redirect/list                                                  | &nbsp;                              | Sub-Account         |
| funnels/redirect.write          | POST /funnels/lookup/redirect                                                      | &nbsp;                              | Sub-Account         |
| funnels/page.readonly           | GET /funnels/page                                                                  | &nbsp;                              | Sub-Account         |
| funnels/funnel.readonly         | GET /funnels/funnel/list                                                           | &nbsp;                              | Sub-Account         |
| funnels/pagecount.readonly      | GET /funnels/page/count                                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /funnels/lookup/redirect/:id                                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PATCH /funnels/lookup/redirect/:id                                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /medias/:fileId                                                             | &nbsp;                              | Sub-Account         |
| opportunities.readonly          | GET /opportunities/search                                                          | OpportunityCreate                   | Sub-Account         |
| &nbsp;                          | GET /opportunities/:id                                                             | OpportunityDelete                   | Sub-Account         |
| &nbsp;                          | GET /opportunities/pipelines                                                       | OpportunityStageUpdate              | Sub-Account         |
| &nbsp;                          | &nbsp;                                                                             | OpportunityStatusUpdate             | Sub-Account         |
| &nbsp;                          | &nbsp;                                                                             | OpportunityMonetaryValueUpdate      | Sub-Account         |
| opportunities.write             | DELETE /opportunities/:id                                                          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /opportunities/:id/status                                                      | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /opportunities                                                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /opportunities/:id                                                             | &nbsp;                              | Sub-Account         |
| payments/integration.readonly   | GET /payments/integrations/provider/whitelabel                                     | &nbsp;                              | Sub-Account         |
| payments/integration.write      | POST /payments/integrations/provider/whitelabel                                    | &nbsp;                              | Sub-Account         |
| payments/orders.readonly        | GET /payments/orders/                                                              | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /payments/orders/:orderId                                                      | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /payments/orders/:orderId/fulfillments                                         | &nbsp;                              | Sub-Account         |
| payments/orders.write           | POST /payments/orders/:orderId/fulfillments                                        | &nbsp;                              | Sub-Account         |
| payments/transactions.readonly  | GET /payments/transactions/                                                        | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /payments/transactions/:transactionId                                          | &nbsp;                              | Sub-Account         |
| payments/subscriptions.readonly | GET /payments/subscriptions/                                                       | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /payments/subscriptions/:subscriptionId                                        | &nbsp;                              | Sub-Account         |
| products.readonly               | GET /products/                                                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /products/:productId                                                           | &nbsp;                              | Sub-Account         |
| products.write                  | POST /products/                                                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /products/:productId                                                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /products/:productId                                                        | &nbsp;                              | Sub-Account         |
| products/prices.readonly        | GET /products/:productId/price/                                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /products/:productId/price/:priceId                                            | &nbsp;                              | Sub-Account         |
| products/prices.write           | POST /products/:productId/price/                                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /products/:productId/price/:priceId                                            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /products/:productId/price/:priceId                                         | &nbsp;                              | Sub-Account         |
| oauth.readonly                  | GET /oauth/installedLocations                                                      | &nbsp;                              | Agency              |
| oauth.write                     | POST /oauth/locationToken                                                          | &nbsp;                              | Agency              |
| saas/location.write             | PUT /update-saas-subscription/:locationId                                          | &nbsp;                              | Agency              |
| &nbsp;                          | POST /enable-saas/:locationId                                                      | &nbsp;                              | Sub-Account, Agency |
| saas/location.read              | GET /locations                                                                     | &nbsp;                              | Sub-Account, Agency |
| saas/company.write              | POST /bulk-disable-saas/:companyId                                                 | &nbsp;                              | Sub-Account, Agency |
| snapshots.readonly              | GET /snapshots                                                                     | &nbsp;                              | Agency              |
| socialplanner/account.readonly  | GET /social-media-posting/:locationId/accounts                                     | &nbsp;                              | Sub-Account         |
| socialplanner/account.write     | DELETE /social-media-posting/:locationId/accounts/:id                              | &nbsp;                              | Sub-Account         |
| socialplanner/csv.readonly      | GET /social-media-posting/:locationId/csv                                          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/:locationId/csv/:id                                      | &nbsp;                              | Sub-Account         |
| socialplanner/csv.write         | POST /social-media-posting/:locationId/csv                                         | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/:locationId/set-accounts                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /social-media-posting/:locationId/csv/:id                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PATCH /social-media-posting/:locationId/csv/:id                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/:locationId/posts/bulk-delete                           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /social-media-posting/:locationId/csv/:csvId/post/:postId                   | &nbsp;                              | Sub-Account         |
| socialplanner/category.readonly | GET /social-media-posting/:locationId/categories                                   | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/:locationId/categories/:id                               | &nbsp;                              | Sub-Account         |
| socialplanner/oauth.readonly    | GET /social-media-posting/oauth/facebook/start                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/facebook/accounts/:accountId           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/google/start                                       | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/google/locations/:accountId            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/instagram/start                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/instagram/accounts/:accountId          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/linkedin/start                                     | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/linkedin/accounts/:accountId           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/tiktok/start                                       | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/tiktok/accounts/:accountId             | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/tiktok-business/start                              | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/tiktok-business/accounts/:accountId    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/twitter/start                                      | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /social-media-posting/oauth/:locationId/twitter/accounts/:accountId            | &nbsp;                              | Sub-Account         |
| socialplanner/oauth.write       | POST /social-media-posting/oauth/:locationId/facebook/accounts/:accountId          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/oauth/:locationId/google/locations/:accountId           | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/oauth/:locationId/instagram/accounts/:accountId         | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/oauth/:locationId/linkedin/accounts/:accountId          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/oauth/:locationId/tiktok/accounts/:accountId            | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/oauth/:locationId/twitter/accounts/:accountId           | &nbsp;                              | Sub-Account         |
| socialplanner/post.readonly     | GET /social-media-posting/:locationId/posts/:id                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/:locationId/posts/list                                  | &nbsp;                              | Sub-Account         |
| socialplanner/post.write        | POST /social-media-posting/:locationId/posts                                       | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PUT /social-media-posting/:locationId/posts/:id                                    | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /social-media-posting/:locationId/posts/:id                                 | &nbsp;                              | Sub-Account         |
| &nbsp;                          | PATCH /social-media-posting/:locationId/posts/:id                                  | &nbsp;                              | Sub-Account         |
| socialplanner/tag.readonly      | GET /social-media-posting/:locationId/tags                                         | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /social-media-posting/:locationId/tags/details                                | &nbsp;                              | Sub-Account         |
| surveys.readonly                | GET /surveys/                                                                      | &nbsp;                              | Sub-Account         |
| &nbsp;                          | GET /surveys/submissions                                                           | &nbsp;                              | Sub-Account         |
| users.readonly                  | GET /users/                                                                        | &nbsp;                              | Sub-Account, Agency |
| &nbsp;                          | GET /users/:userId                                                                 | &nbsp;                              | Sub-Account, Agency |
| users.write                     | POST /users/                                                                       | &nbsp;                              | Sub-Account, Agency |
| &nbsp;                          | DELETE /users/:userId                                                              | &nbsp;                              | Sub-Account, Agency |
| &nbsp;                          | PUT /users/:userId                                                                 | &nbsp;                              | Sub-Account, Agency |
| workflows.readonly              | GET /workflows/                                                                    | &nbsp;                              | Sub-Account         |
| courses.write                   | POST courses/courses-exporter/public/import                                        | &nbsp;                              | Sub-Account         |
| emails/builder.readonly         | GET emails/builder                                                                 | &nbsp;                              | Sub-Account         |
| emails/builder.write            | POST emails/builder                                                                | &nbsp;                              | Sub-Account         |
| &nbsp;                          | POST /emails/builder/data                                                          | &nbsp;                              | Sub-Account         |
| &nbsp;                          | DELETE /emails/builder/:locationId/:templateId                                     | &nbsp;                              | Sub-Account         |
| emails/schedule.readonly        | GET emails/schedule                                                                | &nbsp;                              | Sub-Account, Agency |
| blogs/post.write                | POST /blogs/posts                                                                  | &nbsp;                              | Sub-Account         |
| blogs/post-update.write         | PUT /blogs/posts/:postId                                                           | &nbsp;                              | Sub-Account         |
| blogs/check-slug.readonly       | GET /blogs/posts/url-slug-exists                                                   | &nbsp;                              | Sub-Account         |
| blogs/category.readonly         | GET /blogs/categories                                                              | &nbsp;                              | Sub-Account         |
| blogs/author.readonly           | GET /blogs/authors                                                                 | &nbsp;                              | Sub-Account         |
| blogs/posts.readonly            | GET /blogs/posts/all                                                               | &nbsp;                              | Sub-Account         |
| blogs/list.readonly             | GET /blogs/site/all                                                                | &nbsp;                              | Sub-Account         |
---
tags: [OAuth 2.0]
---

# **Scopes**

Here is a list of the scopes you require to access the API Endpoints and Webhook Events.

| Scope                           | API Endpoints                                                 | Webhook Events                      | Access Type          |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------- | -------------------- |
| businesses.readonly             | GET /businesses                                               |                                     | Sub-Account          |
| &nbsp;                          | GET /businesses/:businessId                                   |                                     | Sub-Account          |
| businesses.write                | POST /businesses                                              |                                     | Sub-Account          |
| &nbsp;                          | PUT /businesses/:businessId                                   |                                     | Sub-Account          |
| &nbsp;                          | DELETE /businesses/:businessId                                |                                     | Sub-Account          |
| calendars.write                 | POST /calendars/                                              |                                     | Sub-Account          |
| &nbsp;                          | PUT /calendars/:calendarId                                    |                                     | Sub-Account          |
| &nbsp;                          | DELETE /calendars/:calendarId                                 |                                     | Sub-Account          |
| calendars.readonly              | GET /calendars/                                               |                                     | Sub-Account          |
| &nbsp;                          | GET /calendars/groups                                         |                                     | Sub-Account          |
| &nbsp;                          | GET /calendars/:calendarId                                    |                                     | Sub-Account          |
| &nbsp;                          | GET /calendars/:calendarId/free-slots                         |                                     | Sub-Account          |
| calendars/events.readonly       | GET /calendars/events/appointments/:eventId                   |                                     | Sub-Account          |
| calendars/events.write          | DELETE /calendars/events/:eventId                             |                                     | Sub-Account          |
| &nbsp;                          | POST /calendars/events/block-slots                            |                                     | Sub-Account          |
| &nbsp;                          | PUT /calendars/events/block-slots/:eventId                    |                                     | Sub-Account          |
| &nbsp;                          | POST /calendars/events/appointments                           |                                     | Sub-Account          |
| &nbsp;                          | PUT /calendars/events/appointments /:eventId                  |                                     | Sub-Account          |
| campaigns.readonly              | GET /campaigns/                                               | CampaignStatusUpdate                | Sub-Account          |
| contacts.readonly               | GET /contacts/:contactId                                      | ContactCreate                       | Sub-Account          |
| &nbsp;                          | GET /contacts/:contactId/tasks                                | ContactDelete                       | Sub-Account          |
| &nbsp;                          | GET /contacts/:contactId/tasks/:taskId                        | ContactDndUpdate                    | Sub-Account          |
| &nbsp;                          | GET /contacts/:contactId/notes                                | ContactTagUpdate                    | Sub-Account          |
| &nbsp;                          | GET /contacts/:contactId/notes/:id                            | NoteCreate                          | Sub-Account          |
| &nbsp;                          | GET /contacts/:contactId/appointments                         | NoteDelete                          | Sub-Account          |
| &nbsp;                          | GET /contacts/                                                | TaskCreate                          | Sub-Account          |
| &nbsp;                          | GET /contacts/business/:businessId                            | TaskDelete                          | Sub-Account          |
| contacts.write                  | POST /contacts/                                               | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /contacts/:contactId                                      | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId                                   | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /contacts/:contactId/tasks                               | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /contacts/:contactId/tasks/:taskId                        | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /contacts/:contactId/tasks/:taskId/completed              | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId/tasks/:taskId                     | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /contacts/:contactId/tags                                | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId/tags                              | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /contacts/:contactId/notes                               | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /contacts/:contactId/notes/:id                            | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId/notes/:id                         | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /contacts/:contactId/campaigns/:campaignId               | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId/campaigns/removeAll               | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId/campaigns/:campaignId             | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /contacts/:contactId/workflow/:workflowId                | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /contacts/:contactId/workflow/:workflowId              | &nbsp;                              | Sub-Account          |
| conversations.readonly          | GET /conversations/:conversationsId                           | ConversationUnreadWebhook           | Sub-Account          |
| &nbsp;                          | GET /conversations/search                                     | &nbsp;                              | Sub-Account          |
| conversations.write             | POST /conversations/                                          | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /conversations/:conversationsId                           | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /conversations/:conversationsId                        | &nbsp;                              | Sub-Account          |
| conversations/message.readonly  |                                                               | InboundMessage                      | Sub-Account          |
| &nbsp;                          |                                                               | OutboundMessage                     | Sub-Account          |
| conversations/message.write     | POST /conversations/messages                                  | ConversationProviderOutboundMessage | Sub-Account          |
| &nbsp;                          | POST /conversations/messages/inbound                          | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /conversations/messages/upload                           | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /conversations/messages/:messageId/status                 | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /conversations/messages/:messageId/schedule            | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /conversations/messages/email/:emailMessageId/schedule | &nbsp;                              | Sub-Account          |
| forms.readonly                  | GET /forms/                                                   | &nbsp;                              | Sub-Account          |
| &nbsp;                          | GET /forms/submissions                                        | &nbsp;                              | Sub-Account          |
| links.readonly                  | GET /links/                                                   | &nbsp;                              | Sub-Account          |
| links.write                     | POST /links/                                                  | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /links/:linkId                                            | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /links/:linkId                                         | &nbsp;                              | Sub-Account          |
| locations.readonly              | GET /locations/:locationId                                    | &nbsp;                              | Sub-Account, Company |
|                                 | GET /locations/search                                         | &nbsp;                              | Sub-Account, Company |
| locations.write                 | POST /locations/                                              | &nbsp;                              | Company              |
|                                 | PUT /locations/:locationId                                    | &nbsp;                              | Company              |
|                                 | DELETE /locations/:locationId                                 | &nbsp;                              | Company              |
| locations/customValues.readonly | GET /locations/:locationId/customValues                       | &nbsp;                              | Sub-Account          |
| &nbsp;                          | GET /locations/:locationId/customValues/:id                   | &nbsp;                              | Sub-Account          |
| locations/customValues.write    | POST /locations/:locationId/customValues                      | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /locations/:locationId/customValues/:id                   | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /locations/:locationId/customValues/:id                | &nbsp;                              | Sub-Account          |
| locations/customFields.readonly | GET /locations/:locationId/customFields                       | &nbsp;                              | Sub-Account          |
| &nbsp;                          | GET /locations/:locationId/customFields/:id                   | &nbsp;                              | Sub-Account          |
| locations/customFields.write    | POST /locations/:locationId/customFields                      | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /locations/:locationId/customFields/:id                   | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /locations/:locationId/customFields/:id                | &nbsp;                              | Sub-Account          |
| locations/tags.readonly         | GET /locations/:locationId/tags                               | &nbsp;                              | Sub-Account          |
|                                 | GET /locations/:locationId/tags/:tagId                        | &nbsp;                              | Sub-Account          |
| locations/tags.write            | POST /locations/:locationId/tags/                             | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /locations/:locationId/tags/:tagId                        | &nbsp;                              | Sub-Account          |
| &nbsp;                          | DELETE /locations/:locationId/tags/:tagId                     | &nbsp;                              | Sub-Account          |
| locations/templates.readonly    | GET /locations/:locationId/templates                          | &nbsp;                              | Sub-Account          |
| locations/tasks.readonly        | POST /locations/:locationId/tasks/search                      | &nbsp;                              | Sub-Account          |
| opportunities.readonly          | GET /opportunities/search                                     | OpportunityCreate                   | Sub-Account          |
| &nbsp;                          | GET /opportunities/:id                                        | OpportunityDelete                   | Sub-Account          |
| &nbsp;                          | GET /opportunities/pipelines                                  | OpportunityStageUpdate              | Sub-Account          |
| &nbsp;                          | &nbsp;                                                        | OpportunityStatusUpdate             | Sub-Account          |
| &nbsp;                          | &nbsp;                                                        | OpportunityMonetaryValueUpdate      | Sub-Account          |
| opportunities.write             | DELETE /opportunities/:id                                     | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /opportunities/:id/status                                 | &nbsp;                              | Sub-Account          |
| &nbsp;                          | POST /opportunities                                           | &nbsp;                              | Sub-Account          |
| &nbsp;                          | PUT /opportunities/:id                                        | &nbsp;                              | Sub-Account          |
| snapshots.readonly              | GET /snapshots                                                | &nbsp;                              | Company              |
| surveys.readonly                | GET /surveys/                                                 | &nbsp;                              | Sub-Account          |
| &nbsp;                          | GET /surveys/submissions                                      | &nbsp;                              | Sub-Account          |
| users.readonly                  | GET /users/                                                   | &nbsp;                              | Sub-Account, Company |
| &nbsp;                          | GET /users/:userId                                            | &nbsp;                              | Sub-Account, Company |
| users.write                     | POST /users/                                                  | &nbsp;                              | Sub-Account, Company |
| &nbsp;                          | DELETE /users/:userId                                         | &nbsp;                              | Sub-Account, Company |
| &nbsp;                          | PUT /users/:userId                                            | &nbsp;                              | Sub-Account, Company |
| workflows.readonly              | GET /workflows/                                               | &nbsp;                              | Sub-Account          |---
stoplight-id: vyc3gbbez52ip
---

# Webhook Authentication Guide

## How It Works

### 1. Receiving the Webhook

When your endpoint receives a webhook request, it will include the following:

- **Headers**:

  - `x-wh-signature`: The digital signature of the payload.

- **Body**: The payload containing the timestamp, webhook ID, and data.

Example payload:

    {
      "timestamp": "2025-01-28T14:35:00Z",
      "webhookId": "abc123xyz",
      ...<add_other_webhook_data>
    }


### 2. Verifying the Signature

To verify the authenticity of the webhook request:

1. Retrieve the `x-wh-signature` header from the request.

2. Use the public key mentioned below to verify the signature:

3. Compute the signature on your end using the payload and the public key.

4. Compare your computed signature with the `x-wh-signature` header.

```
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----
```

If they match, the payload is valid and comes from a trusted source.

### 3. Handling Replay Attacks

To protect against replay attacks:

- Ensure the `timestamp` in the payload is within an acceptable time window (e.g., 5 minutes).

- Reject any requests with duplicate `webhookId` values.

### 4. Handling Public Key Rotation

Please keep an eye on your email and [our social channels](https://ghl-developer-council.slack.com/archives/C01F43GUJV6) for notices regarding public key rotation to stay updated. The public key in this doc is the one to use to validate the webhook payload.

***


## Example Code

Here’s an example of how to verify the signature in Node.js:

    const crypto = require('crypto');

    const publicKey = `<use_the_above_key>`;

    function verifySignature(payload, signature) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(payload);
        verifier.end();

        return verifier.verify(publicKey, signature, 'base64');
    }

    // Example usage
    const payload = JSON.stringify({
      "timestamp": "2025-01-28T14:35:00Z",
      "webhookId": "abc123xyz",
      ...<add_other_webhook_data>
    });

    const signature = "<received-x-wh-signature>";
    const isValid = verifySignature(payload, signature);

    return isValid;


## Summary

These new features significantly enhance the security of webhook integrations. By including a timestamp, webhook ID, and a digitally signed payload, we ensure your data remains secure and trusted. Implement these changes today to keep your integrations robust and secure!
