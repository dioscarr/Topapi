# API Endpoints Reference

Quick reference for all available API endpoints in Topapi.

## Base URL

- **Local Development:** `http://localhost:3000`
- **Production:** `https://phpstack-868870-5982515.cloudwaysapps.com`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Health & Status

### Check API Health
```http
GET /api/health
```
**Authentication:** Not required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Check Database Health
```http
GET /api/health/db
```
**Authentication:** Not required

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Authentication Endpoints

### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "metadata": {
    "full_name": "John Doe"
  }
}
```
**Authentication:** Not required

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```
**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      ...
    }
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```
**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "session": { ... }
  }
}
```

### Request Password Reset
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```
**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

## User Endpoints

### Get All Users
```http
GET /api/users?page=1&limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```
**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    ...
  }
}
```

### Update User
```http
PATCH /api/users/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "email": "newemail@example.com",
  "metadata": {
    "key": "value"
  }
}
```
**Authentication:** Required
**Note:** Users can only update their own profile

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { ... }
}
```

### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```
**Authentication:** Required
**Note:** Users can only delete their own profile

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Profile Endpoints

### Get All Profiles
```http
GET /api/profiles?page=1&limit=10
```
**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Get Profile by ID
```http
GET /api/profiles/:id
```
**Authentication:** Optional

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "bio": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Create Profile
```http
POST /api/profiles
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "user_id": "USER_UUID",
  "username": "johndoe",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "bio": "Software developer"
}
```
**Authentication:** Required

**Response (201):**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": { ... }
}
```

### Update Profile
```http
PATCH /api/profiles/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "bio": "Updated bio"
}
```
**Authentication:** Required
**Note:** Users can only update their own profile

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

### Delete Profile
```http
DELETE /api/profiles/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```
**Authentication:** Required
**Note:** Users can only delete their own profile

**Response (200):**
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "stack": "..." // Only in development mode
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error

---

## Rate Limiting

- **Rate:** 100 requests per 15 minutes per IP address
- **Scope:** All `/api/*` endpoints
- **Response on Limit:** 429 Too Many Requests

---

## Testing Tools

### Swagger UI
Interactive API documentation and testing:
```
http://localhost:3000/api-docs
```

### Postman Collection
Import the collection from:
```
Topapi.postman_collection.json
```

### cURL Examples
See `QUICKSTART.md` for complete cURL examples.

---

## Need Help?

- 📖 Full documentation: `README.md`
- 🚀 Quick start: `QUICKSTART.md`
- 🌐 Deployment: `DEPLOYMENT.md`
- 🤝 Contributing: `CONTRIBUTING.md`
