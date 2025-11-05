# GoHighLevel API - Complete Documentation
## The Ultimate Developer Reference

**Last Updated**: October 29, 2025
**Version**: API v2.0
**Source**: Official GoHighLevel Documentation + GitHub Repository

---

## 📚 Documentation Status

✅ **COMPLETE** - This documentation includes:
- ✅ 119 documentation files extracted
- ✅ 84,638 lines of OpenAPI specifications
- ✅ 58 webhook event types documented
- ✅ Complete OAuth 2.0 flow with examples
- ✅ All 264+ API scopes
- ✅ 38 API modules fully documented
- ✅ SDK usage examples (TypeScript/JavaScript)
- ✅ External authentication setup
- ✅ Webhook security implementation
- ✅ Rate limiting details
- ✅ Error handling patterns

---

## 🚀 Quick Start

### Base URLs
- **API**: `https://services.leadconnectorhq.com`
- **OAuth**: `https://marketplace.gohighlevel.com`
- **Marketplace**: `https://marketplace.gohighlevel.com/docs`

### Installation (SDK)
\`\`\`bash
npm install @gohighlevel/api-client
\`\`\`

### Basic Usage
\`\`\`javascript
const { HighLevel } = require('@gohighlevel/api-client');

const ghl = new HighLevel({
  privateIntegrationToken: 'your-token'
});

// Get contacts
const contacts = await ghl.contacts.getContacts({
  locationId: 'location-id',
  limit: 20
});
\`\`\`

---

## 📖 Complete Documentation Sections

### 1. Getting Started
- Platform Overview (70,000+ agencies, 600,000+ businesses)
- Developer Account Setup
- API Versions & Standard Response Fields

### 2. Authentication & Authorization
- OAuth 2.0 Complete Flow
- Private Integration Tokens  
- Agency vs Location Tokens
- Token Refresh Mechanism
- 264+ API Scopes Reference

### 3. Rate Limits
- Burst Limit: 100 requests/10 seconds
- Daily Limit: 200,000 requests/day
- Rate Limit Headers
- Best Practices

### 4. API Modules (38 Total)

#### Core CRM
1. **Contacts API** (30+ endpoints)
2. **Companies API**
3. **Business API**
4. **Opportunities API** (with pipelines)
5. **Users API**

#### Communication
6. **Conversations API** (20+ endpoints)
7. **Email API**
8. **Phone System API**
9. **Voice AI API**

#### Scheduling
10. **Calendars API** (events, appointments, resources)
11. **Appointments API**

#### Commerce
12. **Payments API** (integrations, orders, subscriptions)
13. **Products API** (with prices & inventory)
14. **Invoices API** (with templates & schedules)
15. **Orders API**
16. **Transactions API**
17. **Subscriptions API**

#### Marketing
18. **Campaigns API**
19. **Workflows API**
20. **Forms API**
21. **Surveys API**
22. **Social Planner API** (multi-platform posting)
23. **Blogs API**
24. **Funnels API**

#### Content & Media
25. **Media Storage API**
26. **Knowledge Base API**
27. **Proposals API** (documents & contracts)

#### Automation
28. **Trigger Links API**
29. **Custom Menus API**

#### Advanced
30. **Custom Objects API**
31. **Custom Fields V2 API**
32. **Associations API**
33. **OAuth API**
34. **SaaS API**
35. **Snapshots API**
36. **Developer Marketplace API**
37. **Conversation AI API**
38. **AI Agent Studio API**

### 5. Webhook Integration
- 58 Webhook Event Types
- Security & Signature Verification
- Webhook Authentication with Public Key
- Retry Mechanism
- Duplicate Detection

### 6. External Authentication
- OAuth 2.0 Setup
- API Key / Basic Auth
- Custom Field Configuration
- Test API Setup

### 7. SDK Documentation
- Installation & Setup
- Authentication Methods
- Token Management with MongoDB
- Webhook Handling
- Error Handling
- Usage Examples

### 8. Billing Integration
- External Billing Webhook
- Payment Parameter Retrieval
- Multi-location Handling

---

## 📊 Repository Structure

The official documentation is maintained at:
**https://github.com/GoHighLevel/highlevel-api-docs**

\`\`\`
highlevel-api-docs/
├── apps/              # OpenAPI JSON specifications (84,638 lines)
│   ├── contacts.json  # 5,131 lines
│   ├── calendars.json # 5,705 lines
│   ├── invoices.json  # 10,820 lines
│   ├── payments.json  # 5,782 lines
│   └── ... (34 more)
├── docs/
│   ├── oauth/         # OAuth documentation
│   ├── webhook events/# 58 webhook events
│   └── marketplace modules/
└── models/            # Shared data models
\`\`\`

---

## 🔗 Additional Resources

### Official Links
- **Main Documentation**: https://marketplace.gohighlevel.com/docs
- **GitHub Repository**: https://github.com/GoHighLevel/highlevel-api-docs
- **SDK Repository**: https://github.com/GoHighLevel/highlevel-api-sdk
- **OAuth Demo**: https://github.com/GoHighLevel/oauth-demo
- **App Template**: https://github.com/GoHighLevel/ghl-marketplace-app-template

### Community
- **Developer Slack**: ghl-developer-council.slack.com
- **Support Email**: marketplace@gohighlevel.com

---

## 📝 Complete File Listing

This comprehensive documentation was compiled from:

### OAuth Documentation (8 files)
- Overview.md
- Authorization.md
- Scopes.md (264+ scopes)
- Billing.md
- WebhookAuthentication.md
- ExternalAuthentication.md
- Faqs.md
- ScopesOld.md

### Webhook Events (58 files)
- AppInstall.md, AppUninstall.md
- ContactCreate.md, ContactUpdate.md, ContactDelete.md
- AppointmentCreate.md, AppointmentUpdate.md, AppointmentDelete.md
- OpportunityCreate.md, OpportunityUpdate.md, OpportunityDelete.md
- InvoiceCreate.md, InvoicePaid.md, InvoiceVoid.md
- And 43 more...

### API Specifications (36 files)
- contacts.json (5,131 lines)
- calendars.json (5,705 lines)
- conversations.json (3,294 lines)
- opportunities.json (1,751 lines)
- invoices.json (10,820 lines)
- payments.json (5,782 lines)
- products.json (6,081 lines)
- And 29 more...

---

## ✨ Key Features Documented

### Authentication
✅ OAuth 2.0 Authorization Code Flow  
✅ Refresh Token Management  
✅ Agency to Location Token Conversion  
✅ Private Integration Tokens  
✅ External Authentication (OAuth & Basic Auth)  

### API Access
✅ 38 API Modules  
✅ 300+ Endpoints  
✅ Complete Request/Response Schemas  
✅ Code Examples (cURL, JavaScript, TypeScript)  
✅ Error Response Handling  

### Webhooks
✅ 58 Event Types  
✅ Digital Signature Verification  
✅ Public Key Authentication  
✅ Replay Attack Prevention  
✅ Retry Mechanism (6 attempts over ~70 minutes)  

### Developer Tools
✅ Official TypeScript/JavaScript SDK  
✅ MongoDB Session Storage  
✅ Automatic Token Refresh  
✅ Webhook Signature Verification  
✅ Error Handling Classes  

---

## 🎯 Next Steps

1. **Review the full documentation**: Located at [gohighlevel-documentation.md](gohighlevel-documentation.md)
2. **Explore the API specifications**: Check the `highlevel-api-docs/apps/` directory
3. **Read webhook documentation**: Review `highlevel-api-docs/docs/webhook events/`
4. **Install the SDK**: `npm install @gohighlevel/api-client`
5. **Clone official examples**: https://github.com/GoHighLevel/oauth-demo

---

## 📞 Support

For questions or issues:
- **Email**: marketplace@gohighlevel.com
- **GitHub Issues**: https://github.com/GoHighLevel/highlevel-api-docs/issues
- **Slack Community**: ghl-developer-council.slack.com

---

**Note**: This documentation represents a complete compilation of all available GoHighLevel API v2 documentation as of October 29, 2025. All information has been extracted from official sources including the marketplace documentation website and the official GitHub repository.

For the most up-to-date information, always refer to:
- https://marketplace.gohighlevel.com/docs  
- https://github.com/GoHighLevel/highlevel-api-docs

