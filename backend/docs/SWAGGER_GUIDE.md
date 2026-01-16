# 📚 Swagger Documentation System Guide

This guide explains how the CosmicForge RTC API documentation system works, how to maintain it, and how to extend it.

---

## 🎯 Overview

The CosmicForge RTC API uses a **modular YAML-based documentation system** that automatically generates OpenAPI 3.0 specification. This approach provides:

- ✅ **Easy Maintenance** - Small, focused files instead of one giant file
- ✅ **Better Organization** - Paths and schemas separated by feature
- ✅ **Version Control Friendly** - Easier to track changes and resolve conflicts
- ✅ **Auto-Generated** - Documentation builds automatically from YAML files
- ✅ **Type-Safe** - Validated against OpenAPI 3.0 specification
- ✅ **Rust Integration** - Uses `utoipa` for compile-time validation

---

## 📁 Documentation Structure

```
backend/
├── src/
│   └── swagger/                    # Swagger/OpenAPI documentation
│       ├── openapi.base.json       # Base OpenAPI template
│       ├── openapi.json            # Generated merged spec (auto-created)
│       ├── mod.rs                  # Rust module loader
│       ├── paths/                  # API endpoint documentation
│       │   ├── auth.paths.yaml     # Authentication endpoints
│       │   └── meetings.paths.yaml # Meeting endpoints
│       ├── components/             # Reusable schema definitions
│       │   ├── common.schemas.yaml # Common/shared schemas
│       │   ├── auth.schemas.yaml   # Auth-related schemas
│       │   └── meetings.schemas.yaml # Meeting schemas
│       └── examples/               # Request/response examples
│
└── docs/                           # Markdown documentation (separate)
    ├── README.md                   # Docs navigation
    ├── DATABASE_SCHEMA.md          # Database documentation
    ├── QUICK_START.md              # Quick start guide
    └── README_MIGRATIONS.md        # Migration guide
```

**Important**:

- `src/swagger/` = API/Swagger documentation (YAML/JSON)
- `docs/` = Markdown documentation files (.md)

---

## 🔄 How It Works

### 1. **Source Files (YAML)**

You write documentation in small, focused YAML files organized by feature:

```yaml
# src/swagger/paths/auth.paths.yaml
/api/auth/login:
  post:
    tags:
      - Authentication
    summary: Login user
    description: Authenticate user and receive JWT token
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/LoginRequest"
    responses:
      "200":
        description: Login successful
```

### 2. **Build Process**

When you run the build script:

1. **Reads** `openapi.base.json` (contains API info, servers, tags)
2. **Merges** all `*.paths.yaml` files from `paths/` directory
3. **Merges** all `*.schemas.yaml` files from `components/` directory
4. **Validates** the merged specification for errors
5. **Outputs** complete `openapi.json`

### 3. **Runtime Loading**

When the server starts:

1. Rust code loads the generated `openapi.json`
2. `utoipa-swagger-ui` serves it via Swagger UI
3. Available at `/swagger-ui` endpoint

### 4. **Swagger UI Display**

Users can view and interact with the API documentation at:

- `http://localhost:8080/swagger-ui`

---

## 🛠️ Available Commands

### Build Documentation (Node.js/Python Script)

Create a build script to merge YAML files:

```bash
# Using Python (recommended for Rust projects)
python scripts/build_swagger.py

# Or using Node.js
node scripts/build_swagger.js
```

### Validate Documentation

```bash
# Validate OpenAPI spec
python scripts/validate_swagger.py
```

---

## ✏️ How to Update Documentation

### Scenario 1: Add a New Endpoint

1. **Open the appropriate path file** (or create a new one)

   ```bash
   # Edit existing file
   vim src/swagger/paths/meetings.paths.yaml

   # Or create new feature file
   touch src/swagger/paths/chat.paths.yaml
   ```

2. **Add your endpoint definition**

   ```yaml
   /api/chat/messages:
     get:
       tags:
         - Chat
       summary: Get chat messages
       security:
         - bearerAuth: []
       parameters:
         - name: meeting_id
           in: query
           required: true
           schema:
             type: string
             format: uuid
       responses:
         "200":
           description: Messages retrieved successfully
   ```

3. **Build documentation**

   ```bash
   python scripts/build_swagger.py
   ```

4. **Restart server**

   ```bash
   cargo run
   ```

5. **View changes** at `http://localhost:8080/swagger-ui`

### Scenario 2: Add a New Schema

1. **Open the appropriate schema file**

   ```bash
   vim src/swagger/components/meetings.schemas.yaml
   ```

2. **Add your schema definition**

   ```yaml
   ChatMessage:
     type: object
     properties:
       id:
         type: string
         format: uuid
       message:
         type: string
       created_at:
         type: string
         format: date-time
   ```

3. **Reference it in your paths**

   ```yaml
   /api/chat/messages:
     get:
       responses:
         "200":
           content:
             application/json:
               schema:
                 type: array
                 items:
                   $ref: "#/components/schemas/ChatMessage"
   ```

4. **Build and restart**
   ```bash
   python scripts/build_swagger.py
   cargo run
   ```

---

## 📝 YAML File Structure

### Path Files (`paths/*.paths.yaml`)

```yaml
# Path key (the actual API endpoint)
/api/resource/{id}:
  # HTTP method
  get:
    # Metadata
    tags:
      - ResourceName
    summary: Short description
    description: Longer explanation
    operationId: getResource

    # Security (if authentication required)
    security:
      - bearerAuth: []

    # URL parameters
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
        description: Resource UUID

    # Request body (for POST, PUT, PATCH)
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ResourceRequest"

    # Responses
    responses:
      "200":
        description: Success response
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ResourceResponse"
      "400":
        $ref: "#/components/responses/ValidationError"
      "401":
        $ref: "#/components/responses/Unauthorized"
```

### Schema Files (`components/*.schemas.yaml`)

```yaml
# Schema name
ResourceRequest:
  type: object
  required:
    - name
    - email
  properties:
    name:
      type: string
      description: Resource name
      example: John Doe
    email:
      type: string
      format: email
      example: john@example.com
    age:
      type: integer
      minimum: 0
      maximum: 150
      example: 30

ResourceResponse:
  type: object
  properties:
    success:
      type: boolean
      example: true
    data:
      $ref: "#/components/schemas/Resource"
```

---

## 🎨 Best Practices

### 1. **Organize by Feature**

Group related endpoints in the same file:

- ✅ `auth.paths.yaml` - All authentication endpoints
- ✅ `meetings.paths.yaml` - All meeting endpoints
- ❌ Don't mix unrelated endpoints in one file

### 2. **Use Schema References**

Instead of repeating schemas, use `$ref`:

```yaml
# ✅ Good
schema:
  $ref: '#/components/schemas/User'

# ❌ Bad - Repeating the schema inline
schema:
  type: object
  properties:
    id: ...
    name: ...
```

### 3. **Add Descriptions Everywhere**

- Add descriptions to endpoints
- Add descriptions to parameters
- Add descriptions to schema properties
- Add examples wherever possible

### 4. **Use Reusable Responses**

Define common responses in `openapi.base.json`:

```json
{
  "components": {
    "responses": {
      "Unauthorized": {
        "description": "Unauthorized - Invalid or missing token"
      }
    }
  }
}
```

Then reference them:

```yaml
responses:
  "401":
    $ref: "#/components/responses/Unauthorized"
```

### 5. **Provide Request/Response Examples**

```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/LoginRequest"
      example:
        email: john@example.com
        password: password123
```

---

## 🚀 Integration with Rust

### Using utoipa for Type-Safe Documentation

The project uses `utoipa` for compile-time validated documentation:

```rust
use utoipa::{OpenApi, ToSchema};

#[derive(ToSchema)]
struct User {
    id: Uuid,
    username: String,
    email: String,
}

#[utoipa::path(
    get,
    path = "/api/users/{id}",
    responses(
        (status = 200, description = "User found", body = User),
        (status = 404, description = "User not found")
    )
)]
async fn get_user(id: Uuid) -> Result<Json<User>, StatusCode> {
    // Implementation
}
```

### Serving Swagger UI

```rust
use axum::Router;
use utoipa_swagger_ui::SwaggerUi;

let app = Router::new()
    .merge(SwaggerUi::new("/swagger-ui")
        .url("/api-docs/openapi.json", openapi_spec));
```

---

## 📊 Documentation Workflow

### For New Features

```
1. Write Code
2. Write Tests
3. Add API Endpoint
4. Create/Update YAML
5. Build Swagger Docs
6. Test in Swagger UI
7. Commit Changes
```

### Daily Development

```bash
# 1. Make changes to YAML files
vim src/swagger/paths/meetings.paths.yaml

# 2. Build documentation
python scripts/build_swagger.py

# 3. Restart server
cargo run

# 4. View at http://localhost:8080/swagger-ui
```

---

## 🐛 Troubleshooting

### Problem: "openapi.json not found"

**Solution:** Run the build script:

```bash
python scripts/build_swagger.py
```

### Problem: Changes not showing in Swagger UI

**Solution:**

1. Rebuild documentation: `python scripts/build_swagger.py`
2. Restart server: `cargo run`
3. Hard refresh browser: `Ctrl+Shift+R`

### Problem: YAML syntax errors

**Solution:**

- Check indentation (use 2 spaces, not tabs)
- Ensure colons have spaces after them: `key: value`
- Arrays use hyphens: `- item`
- Strings with special characters need quotes

---

## 📖 Quick Reference

### Common Schema Types

```yaml
# String
name:
  type: string
  example: John Doe

# UUID
id:
  type: string
  format: uuid
  example: "123e4567-e89b-12d3-a456-426614174000"

# Integer
age:
  type: integer
  minimum: 0
  maximum: 150

# Boolean
isActive:
  type: boolean
  example: true

# Date/Time
createdAt:
  type: string
  format: date-time
  example: "2026-01-16T10:00:00Z"

# Enum
status:
  type: string
  enum: [pending, approved, rejected]
  example: pending

# Array
tags:
  type: array
  items:
    type: string

# Object Reference
user:
  $ref: "#/components/schemas/User"
```

### HTTP Status Codes

| Code | Meaning      | When to Use                           |
| ---- | ------------ | ------------------------------------- |
| 200  | OK           | Successful GET, PUT, PATCH            |
| 201  | Created      | Successful POST (resource created)    |
| 204  | No Content   | Successful DELETE                     |
| 400  | Bad Request  | Validation error                      |
| 401  | Unauthorized | Missing/invalid auth token            |
| 403  | Forbidden    | Valid token, insufficient permissions |
| 404  | Not Found    | Resource doesn't exist                |
| 409  | Conflict     | Resource already exists               |
| 500  | Server Error | Internal server error                 |

---

## ✅ Checklist for Good Documentation

- [ ] Every endpoint has a summary and description
- [ ] Every endpoint has appropriate tags
- [ ] Every endpoint has an operationId
- [ ] Request bodies have schema references
- [ ] All responses are documented (200, 400, 401, 404, 500)
- [ ] Parameters have descriptions and examples
- [ ] Schemas have property descriptions
- [ ] Examples are provided for complex objects
- [ ] Security requirements are specified where needed
- [ ] Documentation builds without errors

---

**🎉 You're now ready to document your API! Happy documenting!**
