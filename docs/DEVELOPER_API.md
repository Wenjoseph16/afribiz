# Developer Extended API Documentation

## Overview

This API extends the developer platform with module permissions, licenses, API keys, webhooks, analytics, validation, configuration, and activity logging.

**Base URL**: `/api/developer`
**Auth**: Bearer token (JWT) in `Authorization` header

---

## 1. Module Permissions

### GET /api/developer/modules/:id/permissions
Get all permissions for a module.

**Response**:
```json
{
  "success": true,
  "data": [{
    "id": "string",
    "moduleId": "string",
    "resource": "PRODUCTS|SERVICES|BOOKINGS|...",
    "accessLevel": "READ|WRITE|ADMIN",
    "description": "string | null",
    "isRequired": true
  }]
}
```

### POST /api/developer/modules/:id/permissions
Add a permission to a module.

**Body**:
```json
{
  "resource": "PRODUCTS",
  "accessLevel": "READ",
  "description": "Read product data",
  "isRequired": true
}
```

### DELETE /api/developer/permissions/:id
Remove a permission.

### GET /api/developer/modules/:id/permissions/check?businessId=xxx
Check if a business has the required permissions.

### GET /api/developer/modules/:id/permissions/summary
Get permission summary grouped by access level.

---

## 2. Licenses

### POST /api/developer/licenses
Create a new license.

**Body**:
```json
{
  "moduleId": "uuid",
  "businessId": "uuid",
  "licenseType": "STANDARD",
  "price": 50000,
  "currency": "FCFA",
  "expiresAt": "2025-12-31T23:59:59Z",
  "autoRenew": false
}
```

### POST /api/developer/licenses/activate
Activate a license by key.

**Body**: `{ "licenseKey": "XXXX-YYYY-ZZZZ" }`

### POST /api/developer/licenses/:id/revoke
Revoke a license.

**Body**: `{ "reason": "Non-payment" }`

### POST /api/developer/licenses/:id/renew
Renew a license.

**Body**: `{ "durationDays": 365 }`

### GET /api/developer/licenses/check/:moduleId/:businessId
Check if a business has a valid license.

### GET /api/developer/modules/:id/licenses
Get all licenses for a module (developer view).

### GET /api/developer/licenses/business/:businessId
Get all licenses for a business.

### GET /api/developer/licenses/stats
Get license statistics (total, active, expired, revoked, monthly revenue).

---

## 3. API Keys

### GET /api/developer/api-keys
List all API keys for the authenticated developer.

### POST /api/developer/api-keys
Create a new API key.

**Body**:
```json
{
  "name": "Production Key",
  "scopes": ["PRODUCTS", "ORDERS"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

### DELETE /api/developer/api-keys/:id
Revoke an API key.

---

## 4. Webhooks

### GET /api/developer/webhooks
List all webhooks for the developer.

### POST /api/developer/webhooks
Create a new webhook.

**Body**:
```json
{
  "url": "https://myapp.com/webhook",
  "events": ["MODULE_INSTALLED", "MODULE_SOLD"],
  "moduleId": "uuid (optional)"
}
```

### DELETE /api/developer/webhooks/:id
Delete a webhook.

### GET /api/developer/webhooks/:id/deliveries?limit=20
Get delivery logs for a webhook.

---

## 5. Analytics

### GET /api/developer/analytics/overview
Get analytics overview for all modules.

### POST /api/developer/modules/:id/analytics/track
Track an analytics event.

### GET /api/developer/modules/:id/analytics?startDate=&endDate=
Get analytics for a specific module.

### POST /api/developer/modules/:id/errors
Log a module error.

### GET /api/developer/modules/:id/errors?resolved=&limit=
Get errors for a module.

### POST /api/developer/errors/:id/resolve
Mark an error as resolved.

---

## 6. Module Validation

### POST /api/developer/modules/:id/validation/submit
Submit a module for validation.

### GET /api/developer/modules/:id/validation
Get current validation status.

### GET /api/developer/modules/:id/validation/history
Get validation history.

### GET /api/developer/validations/pending
Get all pending validations (admin).

### POST /api/developer/validation-checks/:id/approve
Approve a validation check (admin).

**Body**: `{ "score": 85, "details": "Code quality approved" }`

### POST /api/developer/validation-checks/:id/reject
Reject a validation check (admin).

**Body**: `{ "details": "Security issues found" }`

### POST /api/developer/validations/:id/complete
Complete a validation review (admin).

**Body**: `{ "status": "APPROVED", "notes": "All good!" }`

---

## 7. Module Configuration

### POST /api/developer/modules/:id/configuration
Save module configuration for a business.

**Body**:
```json
{
  "businessId": "uuid",
  "installationId": "uuid",
  "settings": { "theme": "dark", "notifications": true }
}
```

### GET /api/developer/modules/:id/configuration/:businessId
Get configuration for a specific business.

### PUT /api/developer/modules/:id/configuration/:businessId/toggle
Toggle module active state for a business.

**Body**: `{ "isActive": true }`

### GET /api/developer/modules/:id/configurations
Get all configurations for a module (developer view).

### GET /api/developer/configurations/business/:businessId
Get all installed modules for a business.

---

## 8. Activity Log

### POST /api/developer/modules/:id/activity
Log an activity event.

**Body**:
```json
{
  "activityType": "MODULE_INSTALLED",
  "businessId": "uuid (optional)",
  "description": "Module installed on Test Business",
  "metadata": {}
}
```

### GET /api/developer/modules/:id/activity?limit=50
Get activity for a module.

### GET /api/developer/activity/feed?limit=50
Get activity feed for the developer (all modules).

### GET /api/developer/activity/business/:businessId?limit=50
Get activity for a specific business.

### GET /api/developer/modules/:id/activity/stats
Get activity statistics for a module.

---

## Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

HTTP Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (invalid input)
- `401` - Unauthenticated
- `403` - Forbidden
- `404` - Not found
- `409` - Conflict (duplicate)
