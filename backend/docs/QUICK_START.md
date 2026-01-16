# CosmicForge RTC - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Rust 1.70+ installed
- PostgreSQL 14+ database
- Visual Studio Build Tools (Windows)

### Initial Setup

1. **Clone and navigate to backend**:

   ```bash
   cd backend
   ```

2. **Configure environment variables**:
   Create/edit `.env` file with your database credentials:

   ```env
   DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
   ```

3. **Build the project**:

   ```bash
   cargo build
   ```

4. **Run migrations**:

   ```bash
   cd migration
   cargo run -- up
   cd ..
   ```

5. **Start the server**:
   ```bash
   cargo run
   ```

## 📊 Database Migrations

### Running Migrations

```bash
# Navigate to migration directory
cd migration

# Apply all pending migrations
cargo run -- up

# Rollback last migration
cargo run -- down

# Check migration status
cargo run -- status

# Refresh database (rollback all + reapply)
cargo run -- refresh

# Reset database (drop all + reapply)
cargo run -- fresh
```

### Migration Order

The migrations run in this order:

1. ✅ Tenants
2. ✅ Users
3. ✅ Meetings
4. ✅ Participants
5. ✅ Audio/Video Devices
6. ✅ Chat Messages
7. ✅ Session Logs
8. ✅ Webhooks
9. ✅ API Keys

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/          # SeaORM entity models
│   │   ├── mod.rs
│   │   ├── tenants.rs
│   │   ├── users.rs
│   │   ├── meetings.rs
│   │   ├── participants.rs
│   │   ├── audio_video_devices.rs
│   │   ├── chat_messages.rs
│   │   ├── session_logs.rs
│   │   ├── webhooks.rs
│   │   └── api_keys.rs
│   ├── handlers/        # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── lib.rs           # Library root
│   └── main.rs          # Application entry point
├── migration/
│   └── src/
│       ├── lib.rs       # Migration registry
│       ├── main.rs      # Migration CLI
│       └── m2026*.rs    # Individual migrations
├── Cargo.toml
├── .env
├── DATABASE_SCHEMA.md   # Full schema documentation
└── QUICK_START.md       # This file
```

## 🗄️ Database Schema Overview

### Core Tables

| Table                   | Purpose                    | Key Features                           |
| ----------------------- | -------------------------- | -------------------------------------- |
| **tenants**             | Multi-tenant organizations | UUID PK, domain support                |
| **users**               | User accounts & admins     | Local + OAuth auth, email verification |
| **meetings**            | Video conferences          | Lifecycle status, metadata, privacy    |
| **participants**        | Meeting attendees          | Guest support, real-time states        |
| **audio_video_devices** | Media devices              | Device tracking per participant        |
| **chat_messages**       | In-meeting chat            | Text communication                     |
| **session_logs**        | Event logging              | Comprehensive audit trail              |
| **webhooks**            | Event notifications        | Tenant-specific, signed payloads       |
| **api_keys**            | API access                 | Usage tracking, expiration             |

### Key Relationships

```
Tenants → Users → Meetings → Participants → Devices/Chat/Logs
   ↓         ↓
Webhooks  API Keys
```

## 🔑 Key Concepts

### 1. Multi-Tenancy

- All data is scoped to tenants via `tenant_id`
- Always filter queries by tenant for data isolation
- Tenants can have custom domains

### 2. Authentication Types

- **Local**: Email/password with verification workflow
- **Google OAuth**: Passwordless authentication

### 3. User Roles

- **User**: Regular user (default)
- **Admin**: Administrative privileges

### 4. Meeting Lifecycle

1. **Scheduled** → Meeting created
2. **Ongoing** → Meeting in progress
3. **Ended** → Meeting completed
4. **Cancelled** → Meeting cancelled

### 5. Guest Participants

- `participants.user_id` can be NULL
- Allows anonymous users to join meetings
- Only requires `display_name`

## 💻 Common Code Examples

### Create a Tenant

```rust
use sea_orm::*;
use uuid::Uuid;
use crate::models::tenants::{self, Entity as Tenants};

let tenant = tenants::ActiveModel {
    id: Set(Uuid::new_v4()),
    name: Set("Acme Corp".to_owned()),
    domain: Set(Some("acme.example.com".to_owned())),
    status: Set(tenants::TenantStatus::Active),
    ..Default::default()
};

let result = tenant.insert(db).await?;
```

### Create a User (Local Auth)

```rust
use crate::models::users::{self, Entity as Users};

let user = users::ActiveModel {
    id: Set(Uuid::new_v4()),
    tenant_id: Set(tenant_id),
    username: Set("john_doe".to_owned()),
    email: Set("john@example.com".to_owned()),
    password_hash: Set(Some(hash_password("secret123"))),
    auth_type: Set(users::AuthType::Local),
    role: Set(users::UserRole::User),
    status: Set(users::UserStatus::PendingVerification),
    ..Default::default()
};

let result = user.insert(db).await?;
```

### Create a Meeting

```rust
use crate::models::meetings::{self, Entity as Meetings};

let meeting = meetings::ActiveModel {
    id: Set(Uuid::new_v4()),
    meeting_identifier: Set("MTG-12345".to_owned()),
    tenant_id: Set(tenant_id),
    host_id: Set(user_id),
    title: Set("Team Standup".to_owned()),
    is_private: Set(false),
    start_time: Set(chrono::Utc::now()),
    status: Set(meetings::MeetingStatus::Scheduled),
    ..Default::default()
};

let result = meeting.insert(db).await?;
```

### Add a Guest Participant

```rust
use crate::models::participants::{self, Entity as Participants};

let participant = participants::ActiveModel {
    id: Set(Uuid::new_v4()),
    meeting_id: Set(meeting_id),
    user_id: Set(None), // NULL for guests
    role: Set(participants::ParticipantRole::Participant),
    display_name: Set("Guest User".to_owned()),
    status: Set(participants::ParticipantStatus::Joined),
    ..Default::default()
};

let result = participant.insert(db).await?;
```

### Query with Filters

```rust
use sea_orm::*;
use crate::models::{meetings, participants};

// Get all ongoing meetings for a tenant
let ongoing_meetings = meetings::Entity::find()
    .filter(meetings::Column::TenantId.eq(tenant_id))
    .filter(meetings::Column::Status.eq(meetings::MeetingStatus::Ongoing))
    .all(db)
    .await?;

// Get all participants in a meeting
let participants = participants::Entity::find()
    .filter(participants::Column::MeetingId.eq(meeting_id))
    .filter(participants::Column::Status.eq(participants::ParticipantStatus::Joined))
    .all(db)
    .await?;
```

## 🔒 Security Best Practices

### 1. Password Hashing

```rust
use bcrypt::{hash, verify, DEFAULT_COST};

// Hash password
let hashed = hash("user_password", DEFAULT_COST)?;

// Verify password
let valid = verify("user_password", &hashed)?;
```

### 2. Tenant Isolation

```rust
// ✅ Always filter by tenant_id
let meetings = Meetings::find()
    .filter(meetings::Column::TenantId.eq(current_tenant_id))
    .all(db)
    .await?;

// ❌ Never query without tenant filter (security risk!)
// let meetings = Meetings::find().all(db).await?;
```

### 3. API Key Validation

```rust
// Check if key is valid and not expired
let api_key = ApiKeys::find()
    .filter(api_keys::Column::ApiKey.eq(provided_key))
    .filter(api_keys::Column::Status.eq(ApiKeyStatus::Active))
    .filter(api_keys::Column::ExpiresAt.gt(chrono::Utc::now()))
    .one(db)
    .await?;

if let Some(key) = api_key {
    // Check usage limit
    if key.used_count >= key.usage_limit {
        return Err("Usage limit exceeded");
    }
    // Increment usage
    // ... proceed with request
}
```

## 📚 Documentation

- **Full Schema Documentation**: See `DATABASE_SCHEMA.md`
- **SeaORM Docs**: https://www.sea-ql.org/SeaORM/
- **PostgreSQL UUID**: https://www.postgresql.org/docs/current/datatype-uuid.html

## 🛠️ Development Commands

```bash
# Build project
cargo build

# Run in development mode
cargo run

# Run tests
cargo test

# Format code
cargo fmt

# Lint code
cargo clippy

# Check without building
cargo check

# Build for production
cargo build --release
```

## 🐛 Troubleshooting

### Migration Issues

**Problem**: "relation already exists"

```bash
# Check migration status
cd migration
cargo run -- status

# If needed, reset (CAUTION: destroys data)
cargo run -- fresh
```

**Problem**: "could not connect to database"

- Check `.env` file has correct `DATABASE_URL`
- Verify database is running and accessible
- Check SSL mode matches your database configuration

### Build Issues

**Problem**: "linking with link.exe failed"

- Install Visual Studio Build Tools with "C++ build tools" workload
- Restart terminal after installation

**Problem**: "could not compile due to previous error"

- Run `cargo clean` then `cargo build`
- Check Rust version: `rustc --version` (should be 1.70+)

## 📞 Support

For detailed information, refer to:

1. `DATABASE_SCHEMA.md` - Complete schema documentation
2. Migration files in `migration/src/`
3. Model definitions in `src/models/`

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-16
