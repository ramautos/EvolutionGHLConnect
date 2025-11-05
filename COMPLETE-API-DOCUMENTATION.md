# GoHighLevel Complete API Documentation
## Comprehensive Developer Reference Guide

**Last Updated**: October 29, 2025  
**Source**: Official GoHighLevel API v2 Documentation  
**Repository**: https://github.com/GoHighLevel/highlevel-api-docs

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication & Authorization](#authentication--authorization)
4. [Rate Limits](#rate-limits)
5. [OAuth 2.0 Implementation](#oauth-20-implementation)
6. [API Scopes Complete Reference](#api-scopes-complete-reference)
7. [External Authentication](#external-authentication)
8. [Webhook Integration](#webhook-integration)
9. [SDK Usage](#sdk-usage)
10. [API Endpoints by Module](#api-endpoints-by-module)
11. [Webhook Events Reference](#webhook-events-reference)
12. [Error Handling](#error-handling)
13. [Best Practices](#best-practices)

---

## Introduction

### Platform Overview

**GoHighLevel** is a comprehensive CRM and marketing automation platform serving:
- **70,000+** agencies
- **600,000+** businesses

### API Documentation

This documentation covers the complete GoHighLevel API v2, including:
- ✅ Full OpenAPI specifications (84,000+ lines)
- ✅ Complete endpoint reference
- ✅ Request/response schemas
- ✅ Authentication flows
- ✅ Webhook events (58 types)
- ✅ SDK examples
- ✅ Code samples in multiple languages

### Base URLs

**API Base**: `https://services.leadconnectorhq.com`  
**OAuth Base**: `https://marketplace.gohighlevel.com`

---

## Getting Started

### Developer Account Setup

1. Go to [HighLevel Marketplace](https://marketplace.gohighlevel.com)
2. Sign up for a developer account
3. Navigate to "My Apps"
4. Click "Create App"
5. Configure your application settings

### Standard Response Fields

All API responses include:

**traceId**: Unique identifier for each request (useful for debugging)

```json
{
  "traceId": "uuid-string",
  "data": {},
  ...
}
```

---

## Authentication & Authorization

### Authentication Types

GoHighLevel supports three token types with different access levels:

| Token Type | Priority | Access Level | Use Case |
|------------|----------|--------------|----------|
| **Private Integration Token** | Highest | Full API access | Internal integrations |
| **Agency Access Token** | Medium | Agency + Sub-account data | OAuth marketplace apps |
| **Location Access Token** | Standard | Single location data | OAuth marketplace apps |

### Token Management

**Access Token Validity**: 24 hours (86,399 seconds)  
**Refresh Token Validity**: 1 year (or until used)

#### Token Refresh Process

When an access token expires:
1. Make API request with access token
2. If response indicates token expired (401)
3. Use refresh token to get new access token
4. Save new access token and refresh token
5. Retry original request

---

## Rate Limits

### Current Rate Limits (API 2.0)

**Burst Limit**: 100 requests per 10 seconds (per client per resource)  
**Daily Limit**: 200,000 requests per day (per client per resource)

### Rate Limit Headers

Monitor your usage via these response headers:

```
X-RateLimit-Limit-Daily: 200000
X-RateLimit-Daily-Remaining: 195000
X-RateLimit-Interval-Milliseconds: 10000
X-RateLimit-Max: 100
X-RateLimit-Remaining: 95
```

### Example Scenario

If "GHL-APP" is installed on two locations:

**Sub-account A**: 
- 200,000 API requests/day
- 100 API requests/10 seconds

**Sub-account B**:
- 200,000 API requests/day  
- 100 API requests/10 seconds

Each resource has independent rate limits.

---

## OAuth 2.0 Implementation

### Authorization Flow Overview

HighLevel uses the **Authorization Code Grant** flow.

[Watch Loom Video Tutorial](https://www.loom.com/share/f32384758de74a4dbb647e0b7962c4ea?sid=0907a66d-a160-4b51-bcd4-c47ebae37fca)

### Step 1: Register OAuth App

1. Go to [Marketplace](https://marketplace.gohighlevel.com)
2. Sign up for developer account
3. Go to "My Apps" → "Create App"
4. Fill required details
5. Configure scopes and generate keys

### Step 2: Authorization Page URL

#### Standard Auth URL

```
https://marketplace.gohighlevel.com/oauth/chooselocation?
response_type=code&
redirect_uri=https://myapp.com/oauth/callback/gohighlevel&
client_id=CLIENT_ID&
scope=conversations/message.readonly conversations/message.write
```

#### White-labeled Auth URL

```
https://marketplace.leadconnectorhq.com/oauth/chooselocation?
response_type=code&
redirect_uri=https://myapp.com/oauth/callback/gohighlevel&
client_id=CLIENT_ID&
scope=conversations/message.readonly conversations/message.write
```

#### Login Window Mode

**Default**: Login opens in new tab  
**Same Tab**: Append `&loginWindowOpenMode=self` to URL

### Step 3: Authorization Code Exchange

When user grants access, they're redirected:

```
https://myapp.com/oauth/callback/gohighlevel?code=7676cjcbdc6t76cdcbkjcd09821jknnkj
```

#### Get Access Token API

**Endpoint**: `POST https://services.leadconnectorhq.com/oauth/token`

**Request Parameters**:
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "authorization_code",
  "code": "7676cjcbdc6t76cdcbkjcd09821jknnkj",
  "user_type": "Company",
  "redirect_uri": "https://myapp.com/oauth/callback/gohighlevel"
}
```

**Response**:
```json
{
  "access_token": "Bearer_token",
  "refresh_token": "Long-lived_token",
  "expires_in": 86399,
  "userType": "Company",
  "companyId": "GNb7aIv4rQFV9iwNl5K",
  "locationId": "HjiMUOsCCHCjtxEf8PR",
  "scope": "authorized_permissions"
}
```

### Step 4: Refresh Access Token

**Endpoint**: `POST https://services.leadconnectorhq.com/oauth/token`

**Request Parameters**:
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "your_refresh_token",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "user_type": "Company"
}
```

**Important**: Each refresh generates a new refresh token; the old one becomes invalid.

### Step 5: Get Location Token from Agency Token

**Endpoint**: `POST https://services.leadconnectorhq.com/oauth/locationToken`

**Headers**:
```
Authorization: Bearer [agency_access_token]
Content-Type: application/json
```

**Request Body**:
```json
{
  "companyId": "GNb7aIv4rQFV9iwNl5K",
  "locationId": "HjiMUOsCCHCjtxEf8PR"
}
```

**Response Codes**:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 422: Unprocessable Entity

---

## API Scopes Complete Reference

