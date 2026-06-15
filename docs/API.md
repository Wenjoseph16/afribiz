# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

## Endpoints

### Health Check
Check if server is running.

**GET** `/health`

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 123.45
}
```

---

### Sign Up
Create a new user account.

**POST** `/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "client"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "CLIENT"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - Email already exists

---

### Login
Login with email and password.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "CLIENT"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Cookies:**
- `refreshToken`: HTTP-only, secure, 7 days expiry

**Error Responses:**
- `401` - Invalid credentials

---

### Refresh Token
Get a new access token using refresh token.

**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### Logout
Logout and revoke refresh token.

**POST** `/auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per window
- **Headers**: `X-RateLimit-*` in response

## Data Types

### User
```typescript
{
  id: string;          // UUID
  email: string;       // Email address
  name: string;        // Full name
  role: UserRole;      // CLIENT | BUSINESS | DEVELOPER | ADMIN
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### Token
- **Access Token**: 15 minutes validity
- **Refresh Token**: 7 days validity, stored as HTTP-only cookie

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Examples

### cURL

```bash
# Sign up
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Health check
curl http://localhost:3001/api/health
```

### JavaScript/Fetch

```javascript
// Sign up
const response = await fetch('http://localhost:3001/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    role: 'client'
  }),
  credentials: 'include'
});

const data = await response.json();
const { accessToken, refreshToken } = data.data;
```
