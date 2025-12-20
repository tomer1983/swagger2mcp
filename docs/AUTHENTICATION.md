# Authentication Guide - Swagger2MCP

## Overview

Swagger2MCP supports both authenticated and anonymous access:

- **Username/Password Authentication**: Register and login with email and password
- **Microsoft OAuth2**: Sign in with Microsoft Account
- **JWT Tokens**: All authenticated requests use JWT bearer tokens
- **Anonymous Access**: Can be enabled/disabled via `ALLOW_ANONYMOUS` environment variable

## Default Admin Credentials

When the application starts for the first time, a default administrator account is created:

- **Email**: `admin@swagger2mcp.local`
- **Password**: `changeme123`

> [!WARNING]
> Please change this password immediately after logging in for the first time via the Settings page.

## Authentication Flow

### 1. Local Authentication (Username/Password)

#### Register a New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "myusername"  # optional
}

Response:
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "myusername",
    "displayName": "myusername",
    "provider": "local"
  }
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "sessionId": "optional-to-migrate-anonymous-data"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "myusername",
    "displayName": "myusername",
    "provider": "local"
  }
}
```

### 2. Microsoft OAuth2

#### Initiate OAuth Flow

```bash
GET /api/auth/microsoft
# User is redirected to Microsoft login page
# After authentication, redirected to: /api/auth/microsoft/callback
# Then redirected to frontend with token: /?auth_token=JWT_TOKEN
```

**Setup Required:**
1. Register app at [Azure Portal](https://portal.azure.com/)
2. Set redirect URI: `http://localhost:3000/api/auth/microsoft/callback`
3. Add environment variables:
   ```
   MICROSOFT_CLIENT_ID=your-client-id
   MICROSOFT_CLIENT_SECRET=your-client-secret
   MICROSOFT_CALLBACK_URL=http://localhost:3000/api/auth/microsoft/callback
   ```

### 3. Using JWT Tokens

All authenticated API calls require the JWT token in the Authorization header:

```bash
GET /api/schemas
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## User Management Endpoints

### Get Current User

```bash
GET /api/auth/me
Authorization: Bearer JWT_TOKEN

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "myusername",
    "displayName": "myusername",
    "provider": "local",
    "createdAt": "2025-12-03T21:00:00.000Z",
    "lastLoginAt": "2025-12-03T21:30:00.000Z"
  }
}
```

### Verify Token

```bash
POST /api/auth/verify-token
Authorization: Bearer JWT_TOKEN

Response:
{
  "valid": true,
  "user": { /* user object */ }
}
```

### Logout

```bash
POST /api/auth/logout

Response:
{
  "message": "Logout successful"
}
```

## Data Isolation

### Authenticated Users
- Can only see and manage their own schemas
- Can view anonymous/example schemas (userId = null)

### Anonymous Users (when `ALLOW_ANONYMOUS=true`)
- Can create and view anonymous schemas (userId = null)
- Cannot access schemas owned by registered users
- Anonymous data can be migrated to user account on login

### Blocking Anonymous Access

Set `ALLOW_ANONYMOUS=false` to require authentication for all endpoints.

## Session Migration

When an anonymous user registers or logs in, their existing anonymous session data can be migrated:

```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password",
  "sessionId": "anonymous-session-uuid"  # Migrates all schemas from this session
}
```

## Environment Variables

```bash
# Required
JWT_SECRET=long-random-string-change-in-production
JWT_EXPIRES_IN=7d  # Token expiration (default: 7 days)

# Optional - Anonymous Access
ALLOW_ANONYMOUS=true  # Allow anonymous users (default: true)

# Optional - Microsoft OAuth
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:3000/api/auth/microsoft/callback

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:5173
```

## Security Best Practices

1. **JWT Secret**: Use a long, random string in production (32+ characters)
2. **HTTPS**: Always use HTTPS in production for secure token transmission
3. **Token Storage**: Frontend stores tokens in localStorage with httpOnly cookies for sessions
4. **Password Requirements**: Minimum 8 characters enforced
5. **CORS**: Restrict `ALLOWED_ORIGINS` in production
6. **Rate Limiting**: 100 requests per 15 minutes per IP (already configured)

## Error Responses

### Authentication Required (401)
```json
{
  "error": "Authentication required",
  "message": "No valid authentication token provided"
}
```

### Access Denied (403)
```json
{
  "error": "Access denied: You can only update your own schemas"
}
```

### User Already Exists (409)
```json
{
  "error": "User with this email already exists"
}
```

## Frontend Integration

The frontend includes:
- `AuthContext` for authentication state management
- `LoginForm` and `RegisterForm` components
- `UserProfile` component for authenticated users
- Automatic token refresh and management
- OAuth callback handling

## Testing Authentication

### Test with curl

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Use token for authenticated requests
curl -X GET http://localhost:3000/api/schemas \
  -H "Authorization: Bearer $TOKEN"
```

### Test Microsoft OAuth

1. Visit: http://localhost:3000/api/auth/microsoft
2. Login with Microsoft Account
3. You'll be redirected to frontend with token in URL

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String?   @unique
  passwordHash  String?   // null for OAuth users
  provider      String    @default("local")  // "local" or "microsoft"
  providerId    String?   // OAuth provider user ID
  displayName   String?
  createdAt     DateTime  @default(now())
  lastLoginAt   DateTime?
  sessions      Session[]
  schemas       Schema[]
}
```

### Session & Schema Links
- Sessions can have optional `userId` (null for anonymous)
- Schemas have optional `userId` (null for anonymous/example data)
- Existing anonymous data remains accessible to all users
