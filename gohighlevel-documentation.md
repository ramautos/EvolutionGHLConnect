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
