# CosmicForge RTC - Migration & Model Setup Complete! ✅

## 🎉 What's Been Created

### ✅ Database Migrations (9 tables)

All migration files have been created in `migration/src/`:

1. **m20260116_000001_create_tenants.rs** - Multi-tenant organizations
2. **m20260116_000002_create_users.rs** - User accounts with local/OAuth auth
3. **m20260116_000003_create_meetings.rs** - Video conference meetings
4. **m20260116_000004_create_participants.rs** - Meeting participants (with guest support)
5. **m20260116_000005_create_audio_video_devices.rs** - Media device tracking
6. **m20260116_000006_create_chat_messages.rs** - In-meeting chat
7. **m20260116_000007_create_session_logs.rs** - Event logging
8. **m20260116_000008_create_webhooks.rs** - Webhook notifications
9. **m20260116_000009_create_api_keys.rs** - API access keys

### ✅ SeaORM Entity Models

All model files have been created in `src/models/`:

- `tenants.rs` - Tenant entity with status enum
- `users.rs` - User entity with auth types, roles, and status
- `meetings.rs` - Meeting entity with lifecycle status
- `participants.rs` - Participant entity with media states
- `audio_video_devices.rs` - Device entity
- `chat_messages.rs` - Chat message entity
- `session_logs.rs` - Event log entity with event types
- `webhooks.rs` - Webhook entity
- `api_keys.rs` - API key entity with usage tracking

### ✅ Documentation

- **DATABASE_SCHEMA.md** - Comprehensive 500+ line documentation
- **QUICK_START.md** - Quick reference guide
- **README_MIGRATIONS.md** - This file

## 🚀 Running Migrations

### Option 1: Using Cargo (Recommended)

From the `backend` directory:

```bash
# Run all migrations
cd migration
cargo run -- up

# Check status
cargo run -- status

# Rollback last migration
cargo run -- down

# Refresh (rollback all + reapply)
cargo run -- refresh
```

### Option 2: Using the Binary

From the `backend` directory:

```bash
# Build the migration binary
cargo build

# Run migrations
./target/debug/migration up

# Check status
./target/debug/migration status
```

## 📋 Migration Features

### UUID Primary Keys

All tables use PostgreSQL's `gen_random_uuid()` for automatic UUID generation:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Key Constraints

- **CASCADE**: Deleting parent deletes children (most relationships)
- **SET NULL**: Deleting parent sets FK to NULL (guest participants, optional logs)

### Indexes

All critical query paths have indexes:

- Foreign keys
- Unique constraints
- Status fields
- Frequently queried columns

### Enums

Type-safe enums for all status/type fields:

- `tenant_status`: active, inactive
- `auth_type`: local, google
- `user_role`: user, admin
- `user_status`: pending_verification, active, inactive
- `meeting_status`: scheduled, ongoing, ended, cancelled
- `participant_role`: host, participant, viewer
- `participant_status`: waiting, joined, kicked
- `device_type`: audio_input, audio_output, video_input
- `event_type`: meeting_start, meeting_end, participant_join, etc.
- `webhook_event_type`: meeting_start, meeting_end, participant_join, participant_leave
- `webhook_status`: active, inactive
- `api_key_status`: active, revoked

## 🔑 Key Features

### 1. Multi-Tenancy

- All data scoped to `tenant_id`
- Enforced at database level via foreign keys
- Cascade deletes maintain data integrity

### 2. Guest Support

- `participants.user_id` is nullable
- Allows anonymous users to join meetings
- Only requires `display_name`

### 3. Dual Authentication

- **Local**: Email/password with verification tokens
- **OAuth**: Google authentication (password_hash is NULL)

### 4. Comprehensive Logging

- All meeting events tracked in `session_logs`
- JSON metadata for additional context
- Nullable `participant_id` for meeting-level events

### 5. API Usage Tracking

- Usage limits per API key
- Automatic usage counting
- Expiration dates
- Revocation support

## 📊 Database Schema Overview

```
Tenants (1:N)
├── Users (1:N)
│   ├── Meetings (as host) (1:N)
│   │   ├── Participants (1:N)
│   │   │   ├── AudioVideoDevices (1:N)
│   │   │   ├── ChatMessages (1:N)
│   │   │   └── SessionLogs (1:N)
│   │   ├── ChatMessages (1:N)
│   │   └── SessionLogs (1:N)
│   ├── Participants (nullable for guests) (1:N)
│   └── ApiKeys (1:N)
├── Meetings (1:N)
└── Webhooks (1:N)
```

## 💻 Using the Models

### Example: Create a Tenant

```rust
use sea_orm::*;
use uuid::Uuid;
use crate::models::tenants::{self, Entity as Tenants};

let tenant = tenants::ActiveModel {
    id: Set(Uuid::new_v4()),
    name: Set("Acme Corp".to_owned()),
    status: Set(tenants::TenantStatus::Active),
    ..Default::default()
};

tenant.insert(db).await?;
```

### Example: Create a User

```rust
use crate::models::users::{self, Entity as Users};

let user = users::ActiveModel {
    id: Set(Uuid::new_v4()),
    tenant_id: Set(tenant_id),
    username: Set("john_doe".to_owned()),
    email: Set("john@example.com".to_owned()),
    auth_type: Set(users::AuthType::Local),
    role: Set(users::UserRole::User),
    status: Set(users::UserStatus::Active),
    ..Default::default()
};

user.insert(db).await?;
```

### Example: Query with Relationships

```rust
use sea_orm::*;
use crate::models::{meetings, users};

// Get meeting with host info
let result = meetings::Entity::find_by_id(meeting_id)
    .find_also_related(users::Entity)
    .one(db)
    .await?;

if let Some((meeting, Some(host))) = result {
    println!("Meeting: {} hosted by {}", meeting.title, host.username);
}
```

## 🔒 Security Notes

### 1. Always Filter by Tenant

```rust
// ✅ Good
Meetings::find()
    .filter(meetings::Column::TenantId.eq(current_tenant_id))
    .all(db).await?;

// ❌ Bad - Security risk!
Meetings::find().all(db).await?;
```

### 2. Hash Passwords

```rust
use bcrypt::{hash, DEFAULT_COST};
let hashed = hash("password", DEFAULT_COST)?;
```

### 3. Validate API Keys

- Check `status == 'active'`
- Check `expires_at > now()`
- Check `used_count < usage_limit`

## 📚 Documentation Files

1. **DATABASE_SCHEMA.md** - Complete schema documentation with:

   - Table definitions
   - Relationships
   - Indexes
   - Usage examples
   - Best practices
   - Security considerations

2. **QUICK_START.md** - Quick reference with:

   - Common commands
   - Code snippets
   - Troubleshooting
   - Development workflow

3. **README_MIGRATIONS.md** - This file

## ✅ Next Steps

1. **Run the migrations**:

   ```bash
   cd migration
   cargo run -- up
   ```

2. **Verify tables were created**:
   Connect to your PostgreSQL database and check:

   ```sql
   \dt  -- List all tables
   ```

3. **Start building your API**:
   - Use the models in `src/models/`
   - Create handlers in `src/handlers/`
   - Define routes in `src/routes/`
   - Implement business logic in `src/services/`

## 🐛 Troubleshooting

### Migration Fails

**Error**: "relation already exists"

```bash
# Check what's been applied
cargo run -- status

# Reset if needed (CAUTION: destroys data)
cargo run -- fresh
```

**Error**: "could not connect to database"

- Verify `.env` file has correct `DATABASE_URL`
- Check database is running
- Verify SSL mode matches your setup

### Build Errors

**Error**: "could not compile"

```bash
# Clean and rebuild
cargo clean
cargo build
```

## 📞 Support

For detailed information:

- See `DATABASE_SCHEMA.md` for complete schema documentation
- See `QUICK_START.md` for quick reference
- Check migration files in `migration/src/`
- Review model definitions in `src/models/`

---

**Status**: ✅ All migrations and models created successfully  
**Tables**: 9 tables with full relationships  
**Models**: 9 SeaORM entities with type-safe enums  
**Documentation**: 3 comprehensive guides  
**Last Updated**: 2026-01-16
