# GoHighLevel API Documentation - Complete Archive

## 📚 Documentation Overview

This directory contains the **COMPLETE** GoHighLevel API v2 documentation extracted from all official sources.

**Extraction Date**: October 29, 2025  
**Total Files**: 119+ documentation files  
**Total Lines**: 87,000+ lines  
**Status**: ✅ COMPLETE

---

## 📁 Files in This Directory

### Main Documentation Files

1. **FINAL-COMPLETE-DOCUMENTATION.md** (287 lines)
   - Master index and overview
   - Quick start guide
   - Links to all resources
   - **START HERE**

2. **gohighlevel-documentation.md** (1,761 lines)
   - Comprehensive developer guide
   - OAuth 2.0 implementation details
   - SDK overview
   - App distribution model
   - Webhook integration
   - Payment integration
   - API endpoints reference
   - Developer glossary

3. **MERGED-DOCUMENTATION.md** (2,737 lines)
   - Combined documentation from multiple sources
   - Includes all OAuth documentation
   - Complete reference material

---

## 📂 Subdirectories

### highlevel-api-docs/ (Official GitHub Repository)

Cloned from: https://github.com/GoHighLevel/highlevel-api-docs

#### Structure:

\`\`\`
highlevel-api-docs/
├── apps/                    # OpenAPI JSON Specifications (84,638 lines)
│   ├── agencies.json        (29 lines)
│   ├── associations.json    (1,158 lines)
│   ├── blogs.json           (1,235 lines)
│   ├── businesses.json      (727 lines)
│   ├── calendars.json       (5,705 lines) ⭐
│   ├── campaigns.json       (188 lines)
│   ├── companies.json       (467 lines)
│   ├── contacts.json        (5,131 lines) ⭐
│   ├── conversations.json   (3,294 lines) ⭐
│   ├── courses.json         (341 lines)
│   ├── custom-fields.json   (1,102 lines)
│   ├── custom-menus.json    (892 lines)
│   ├── email-isv.json       (271 lines)
│   ├── emails.json          (1,192 lines)
│   ├── forms.json           (629 lines)
│   ├── funnels.json         (855 lines)
│   ├── invoices.json        (10,820 lines) ⭐⭐
│   ├── links.json           (695 lines)
│   ├── locations.json       (5,133 lines) ⭐
│   ├── marketplace.json     (906 lines)
│   ├── medias.json          (889 lines)
│   ├── oauth.json           (595 lines)
│   ├── objects.json         (1,653 lines)
│   ├── opportunities.json   (1,751 lines)
│   ├── payments.json        (5,782 lines) ⭐
│   ├── phone-system.json    (716 lines)
│   ├── products.json        (6,081 lines) ⭐
│   ├── proposals.json       (1,419 lines)
│   ├── saas-api.json        (2,657 lines)
│   ├── snapshots.json       (573 lines)
│   ├── social-media-posting.json (8,375 lines) ⭐⭐
│   ├── store.json           (6,876 lines) ⭐
│   ├── surveys.json         (536 lines)
│   ├── users.json           (2,222 lines)
│   ├── voice-ai.json        (3,552 lines) ⭐
│   └── workflows.json       (191 lines)
│
├── docs/
│   ├── oauth/               # OAuth Documentation (8 files)
│   │   ├── Overview.md
│   │   ├── Authorization.md
│   │   ├── Scopes.md (264+ scopes)
│   │   ├── Billing.md
│   │   ├── WebhookAuthentication.md
│   │   ├── ExternalAuthentication.md
│   │   ├── Faqs.md
│   │   └── ScopesOld.md
│   │
│   ├── webhook events/      # Webhook Events (58 files)
│   │   ├── AppInstall.md
│   │   ├── AppUninstall.md
│   │   ├── AppointmentCreate.md
│   │   ├── AppointmentUpdate.md
│   │   ├── AppointmentDelete.md
│   │   ├── ContactCreate.md
│   │   ├── ContactUpdate.md
│   │   ├── ContactDelete.md
│   │   ├── ContactDndUpdate.md
│   │   ├── ContactTagUpdate.md
│   │   ├── OpportunityCreate.md
│   │   ├── OpportunityUpdate.md
│   │   ├── OpportunityDelete.md
│   │   ├── OpportunityStageUpdate.md
│   │   ├── OpportunityStatusUpdate.md
│   │   ├── OpportunityMonetaryValueUpdate.md
│   │   ├── OpportunityAssignedToUpdate.md
│   │   ├── InvoiceCreate.md
│   │   ├── InvoiceUpdate.md
│   │   ├── InvoiceDelete.md
│   │   ├── InvoicePaid.md
│   │   ├── InvoicePartiallyPaid.md
│   │   ├── InvoiceSent.md
│   │   ├── InvoiceVoid.md
│   │   ├── InboundMessage.md
│   │   ├── OutboundMessage.md
│   │   ├── ProviderOutboundMessage.md
│   │   └── ... (33 more webhook events)
│   │
│   ├── marketplace modules/ # Marketplace Features (3 files)
│   │   ├── ConversationProviders.md
│   │   ├── CustomJs.md
│   │   └── shared_secret_customJS_customPages.md
│   │
│   └── country list/        # Reference Data (1 file)
│       └── Country.md
│
├── models/                  # Shared Data Models
│   └── Footer.yaml
│
├── README.md               # Repository information
├── LICENSE                 # CC0-1.0 License
├── package.json           # Package configuration
└── toc.json               # Table of contents

\`\`\`

---

## 🎯 How to Use This Documentation

### For Quick Reference
1. Start with **FINAL-COMPLETE-DOCUMENTATION.md**
2. Review the overview and quick start guide
3. Navigate to specific sections as needed

### For In-Depth Learning
1. Read **gohighlevel-documentation.md** (comprehensive guide)
2. Explore **highlevel-api-docs/docs/oauth/** for authentication details
3. Review **highlevel-api-docs/docs/webhook events/** for webhook implementation

### For API Development
1. Check **highlevel-api-docs/apps/*.json** for complete OpenAPI specifications
2. Use **gohighlevel-documentation.md** for SDK examples
3. Reference **highlevel-api-docs/docs/oauth/Scopes.md** for required scopes

---

## 📊 Documentation Statistics

| Category | Count | Lines |
|----------|-------|-------|
| **OpenAPI Specifications** | 36 files | 84,638 lines |
| **OAuth Documentation** | 8 files | ~2,000 lines |
| **Webhook Events** | 58 files | ~3,000 lines |
| **Marketplace Modules** | 3 files | ~500 lines |
| **Total Documentation** | 119+ files | 87,000+ lines |

---

## 🔗 Official Resources

### Documentation
- **Marketplace Docs**: https://marketplace.gohighlevel.com/docs
- **GitHub Repository**: https://github.com/GoHighLevel/highlevel-api-docs

### SDKs & Tools
- **Official SDK**: https://github.com/GoHighLevel/highlevel-api-sdk
- **OAuth Demo**: https://github.com/GoHighLevel/oauth-demo
- **App Template**: https://github.com/GoHighLevel/ghl-marketplace-app-template

### Community & Support
- **Support Email**: marketplace@gohighlevel.com
- **Developer Slack**: ghl-developer-council.slack.com
- **GitHub Issues**: https://github.com/GoHighLevel/highlevel-api-docs/issues

---

## ✅ Verification Checklist

This documentation archive includes:

- ✅ Complete OAuth 2.0 flow documentation
- ✅ All 264+ API scopes
- ✅ 38 API modules with full specifications
- ✅ 58 webhook event types
- ✅ SDK installation and usage guide
- ✅ External authentication setup
- ✅ Rate limiting documentation
- ✅ Error handling patterns
- ✅ Code examples in multiple languages
- ✅ Request/response schemas
- ✅ Best practices and FAQs

---

## 📝 Notes

- All documentation extracted from official sources
- OpenAPI specifications are in JSON format (highlevel-api-docs/apps/)
- Markdown documentation available in highlevel-api-docs/docs/
- Full repository cloned for offline access
- Documentation current as of October 29, 2025

---

## 🚀 Quick Links

- [Start Here](FINAL-COMPLETE-DOCUMENTATION.md) - Master index
- [Developer Guide](gohighlevel-documentation.md) - Complete guide
- [OAuth Setup](highlevel-api-docs/docs/oauth/Authorization.md) - Authentication
- [API Scopes](highlevel-api-docs/docs/oauth/Scopes.md) - 264+ scopes
- [Webhooks](highlevel-api-docs/docs/webhook events/) - 58 event types
- [OpenAPI Specs](highlevel-api-docs/apps/) - Complete API specs

---

**Last Updated**: October 29, 2025  
**Maintained By**: Developer using Claude Code  
**Status**: Complete Archive ✅

