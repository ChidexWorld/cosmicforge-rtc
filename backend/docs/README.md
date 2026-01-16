# CosmicForge RTC - Documentation

This directory contains comprehensive documentation for the CosmicForge RTC backend.

## 📚 Documentation Files

### [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**Complete Database Schema Documentation** (500+ lines)

Comprehensive guide covering:

- All 9 database tables with detailed field descriptions
- Entity relationships and foreign key constraints
- Indexes and performance optimization
- Migration instructions
- SeaORM model usage examples
- Security best practices
- Multi-tenant architecture
- Query examples and patterns
- Troubleshooting guide

**Use this when**: You need detailed information about the database structure, relationships, or how to work with the models.

---

### [QUICK_START.md](./QUICK_START.md)

**Quick Reference Guide**

Fast reference for common tasks:

- Project setup and configuration
- Running migrations
- Database table overview
- Common code examples (create tenant, user, meeting, etc.)
- Security best practices
- Development commands
- Troubleshooting common issues

**Use this when**: You need quick code snippets or want to get started quickly without reading the full documentation.

---

### [README_MIGRATIONS.md](./README_MIGRATIONS.md)

**Migration & Model Setup Guide**

Overview of the migration system:

- List of all 9 migrations created
- List of all 9 SeaORM entity models
- Migration features (UUIDs, foreign keys, indexes, enums)
- Key features (multi-tenancy, guest support, dual auth)
- Database schema overview diagram
- Usage examples
- Next steps and troubleshooting

**Use this when**: You want to understand what migrations have been created and how to run them.

---

## 🗄️ Database Tables

The schema includes 9 tables:

1. **tenants** - Multi-tenant organizations
2. **users** - User accounts with local/OAuth authentication
3. **meetings** - Video conference meetings
4. **participants** - Meeting attendees (supports guests)
5. **audio_video_devices** - Media device tracking
6. **chat_messages** - In-meeting text chat
7. **session_logs** - Event logging and audit trail
8. **webhooks** - Tenant-specific event notifications
9. **api_keys** - API access with usage tracking

## 🚀 Quick Links

- **Full Schema Details**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Getting Started**: [QUICK_START.md](./QUICK_START.md)
- **Migration Guide**: [README_MIGRATIONS.md](./README_MIGRATIONS.md)

## 🔑 Key Features

- ✅ **UUID Primary Keys** - All tables use PostgreSQL UUIDs
- ✅ **Multi-Tenancy** - Complete tenant isolation
- ✅ **Dual Authentication** - Local (email/password) + Google OAuth
- ✅ **Guest Support** - Anonymous users can join meetings
- ✅ **Type-Safe Models** - SeaORM entities with Rust enums
- ✅ **Comprehensive Logging** - All events tracked with metadata
- ✅ **API Management** - Usage tracking and rate limiting

## 📖 Reading Order

**New to the project?** Read in this order:

1. Start with **QUICK_START.md** to get the project running
2. Read **README_MIGRATIONS.md** to understand the migration system
3. Refer to **DATABASE_SCHEMA.md** for detailed schema information

**Need specific information?**

- Creating entities? → See code examples in **QUICK_START.md**
- Understanding relationships? → See **DATABASE_SCHEMA.md** relationships section
- Running migrations? → See **README_MIGRATIONS.md** or **QUICK_START.md**
- Security concerns? → See **DATABASE_SCHEMA.md** security section

---

**Last Updated**: 2026-01-16  
**Schema Version**: 1.0.0
