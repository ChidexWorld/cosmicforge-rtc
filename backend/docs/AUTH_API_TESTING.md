# 🎉 Authentication API is Running!

## ✅ Server Status

- **Running**: http://127.0.0.1:8080
- **Database**: Connected ✅
- **Auth Endpoints**: Ready ✅

---

## 🔐 Test the Authentication Flow

### 1. Register a User

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser\",
    \"email\": \"test@example.com\",
    \"password\": \"password123\",
    \"tenant_id\": \"550e8400-e29b-41d4-a716-446655440000\"
  }"
```

**Expected Response:**

```json
{
  "user_id": "uuid",
  "email": "test@example.com",
  "role": "user",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending_verification"
}
```

---

### 2. Check Server Logs for Verification Token

Look in your terminal for:

```
Verification token for test@example.com: XXXXXXXXXXXXXX
```

---

### 3. Verify Email

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"YOUR_TOKEN_FROM_LOGS\"
  }"
```

**Expected Response:**

```json
{
  "message": "Email verified successfully"
}
```

---

### 4. Login

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"password\": \"password123\"
  }"
```

**Expected Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "role": "user",
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 5. Refresh Token

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh_token\": \"YOUR_REFRESH_TOKEN\"
  }"
```

---

### 6. Logout

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/logout
```

---

## 📋 Available Endpoints

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/api/v1/auth/register`     | Register new user        |
| POST   | `/api/v1/auth/verify-email` | Verify email with token  |
| POST   | `/api/v1/auth/login`        | Login and get JWT tokens |
| POST   | `/api/v1/auth/refresh`      | Refresh access token     |
| POST   | `/api/v1/auth/logout`       | Logout user              |

---

## ✅ What's Working

- ✅ User registration with bcrypt password hashing
- ✅ Email verification workflow (token in logs)
- ✅ Login with JWT tokens (15 min access, 7 days refresh)
- ✅ Token refresh
- ✅ Input validation
- ✅ Error handling
- ✅ Database connection
- ✅ Multi-tenant support

---

## 🎯 Quick Test (Copy & Paste)

**Windows PowerShell:**

```powershell
# Register
Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/v1/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"testuser","email":"test@example.com","password":"password123","tenant_id":"550e8400-e29b-41d4-a716-446655440000"}'
```

**Git Bash/WSL:**

```bash
curl -X POST http://127.0.0.1:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","tenant_id":"550e8400-e29b-41d4-a716-446655440000"}'
```

---

## 📝 Notes

- Verification tokens are logged to console (check your terminal)
- JWT access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Passwords are hashed with bcrypt
- All endpoints use `/api/v1/` prefix

---

**Status**: ✅ Running and Ready!  
**Port**: 8080  
**Database**: Connected  
**Auth Flow**: Complete
