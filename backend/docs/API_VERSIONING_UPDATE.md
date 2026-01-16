# ✅ API Documentation Updated with Versioning!

## 🎯 Changes Made

### API Versioning

All endpoints now use `/api/v1/` prefix for proper API versioning.

### Updated Folder Structure

```
backend/src/
├── handlers/          # Request handlers (controllers)
├── routes/            # Route definitions
├── services/          # Business logic
├── models/            # SeaORM entities (database models)
└── swagger/           # API documentation
    ├── openapi.base.json
    ├── openapi.json   # ✅ Regenerated with v1 endpoints
    ├── mod.rs
    ├── paths/
    │   ├── auth.paths.yaml      # ✅ Updated to /api/v1/auth/*
    │   └── meetings.paths.yaml  # ✅ Updated to /api/v1/meetings/*
    └── components/
        ├── common.schemas.yaml
        ├── auth.schemas.yaml    # ✅ Updated with JWT tokens
        └── meetings.schemas.yaml
```

---

## 📋 Authentication Endpoints (Local)

### 1. Register User

**POST** `/api/v1/auth/register`

**Request:**

```json
{
  "username": "JohnDoe",
  "email": "john@example.com",
  "password": "securePassword",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201):**

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john@example.com",
  "role": "user",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending_verification"
}
```

**Notes:**

- Password is hashed with bcrypt before storage
- Sends email verification link
- User cannot login until verified

---

### 2. Verify Email

**POST** `/api/v1/auth/verify-email`

**Request:**

```json
{
  "token": "abc123def456ghi789"
}
```

**Response (200):**

```json
{
  "message": "Email verified successfully"
}
```

---

### 3. Login

**POST** `/api/v1/auth/login`

**Request:**

```json
{
  "email": "john@example.com",
  "password": "securePassword"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "JohnDoe",
    "role": "user",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Notes:**

- JWT access token expires in 5-15 minutes
- Refresh token can generate new access tokens
- User must be verified before logging in

---

### 4. Refresh Token

**POST** `/api/v1/auth/refresh`

**Request:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5. Logout

**POST** `/api/v1/auth/logout`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## 🎥 Meeting Endpoints

### 1. List Meetings

**GET** `/api/v1/meetings?page=1&limit=20&status=ongoing`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "meeting_identifier": "MTG-12345",
      "title": "Team Standup",
      "status": "ongoing",
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

### 2. Create Meeting

**POST** `/api/v1/meetings`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "title": "Team Standup",
  "is_private": false,
  "start_time": "2026-01-17T10:00:00Z",
  "metadata": {
    "agenda": "Daily sync",
    "department": "Engineering"
  }
}
```

---

### 3. Get Meeting Details

**GET** `/api/v1/meetings/{id}`

---

### 4. Update Meeting

**PUT** `/api/v1/meetings/{id}`

---

### 5. Delete Meeting

**DELETE** `/api/v1/meetings/{id}`

---

### 6. Start Meeting

**POST** `/api/v1/meetings/{id}/start`

---

### 7. End Meeting

**POST** `/api/v1/meetings/{id}/end`

---

### 8. Join Meeting

**POST** `/api/v1/meetings/{id}/join`

**Request (Guest):**

```json
{
  "display_name": "Guest User",
  "email": "guest@example.com"
}
```

**Request (Authenticated):**

```json
{
  "display_name": "John Doe"
}
```

---

## 🔑 Security

### JWT Authentication

- **Access Token**: Expires in 5-15 minutes
- **Refresh Token**: Used to generate new access tokens
- **Bearer Token**: Include in `Authorization` header

**Example:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Password Security

- Passwords are hashed with **bcrypt** before storage
- Never stored in plain text
- Minimum 8 characters required

---

## 📊 Statistics

- **Total Endpoints**: 13
  - Authentication: 5 endpoints
  - Meetings: 8 endpoints
- **Schemas**: 19 schemas defined
- **Tags**: 8 categories
- **Servers**: 3 (dev, staging, prod)

---

## 🚀 Next Steps

1. **View Updated Documentation:**

   ```
   http://localhost:8080/swagger-ui
   ```

2. **Implement Handlers:**

   - Create handlers in `src/handlers/auth.rs`
   - Create handlers in `src/handlers/meetings.rs`

3. **Define Routes:**

   - Set up routes in `src/routes/auth.rs`
   - Set up routes in `src/routes/meetings.rs`

4. **Implement Services:**
   - Business logic in `src/services/auth.rs`
   - Business logic in `src/services/meetings.rs`

---

## ✅ Checklist

- [x] API versioning added (`/api/v1/`)
- [x] Authentication endpoints documented
- [x] JWT token flow documented
- [x] Meeting endpoints documented
- [x] Request/response schemas defined
- [x] Swagger documentation rebuilt
- [ ] Implement authentication handlers
- [ ] Implement JWT token generation
- [ ] Implement meeting handlers
- [ ] Add route definitions
- [ ] Integrate with Axum server

---

**Last Updated**: 2026-01-16  
**API Version**: v1  
**Swagger**: Updated ✅
