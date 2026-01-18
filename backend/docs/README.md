# CosmicForge RTC - Documentation

This directory contains documentation for the CosmicForge RTC backend.

## Documentation Files

### [QUICK_START.md](./QUICK_START.md)

**Quick Reference Guide**

- Project setup and configuration
- Running migrations
- Project structure overview
- Common code examples
- Development commands
- Troubleshooting

**Use this when**: You want to get the project running quickly or need quick code snippets.

---

### [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**Complete Database Schema Documentation**

- All 9 database tables with field descriptions
- Entity relationships and foreign keys
- Indexes and constraints
- SeaORM model usage examples
- Security best practices

**Use this when**: You need detailed information about the database structure or how to work with models.

---

### [README_MIGRATIONS.md](./README_MIGRATIONS.md)

**Migration Guide**

- List of all migrations
- Migration commands
- How to create new migrations
- Troubleshooting migration issues

**Use this when**: You need to run, modify, or create database migrations.

---

### [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)

**API Documentation Guide**

- How Swagger/OpenAPI works in this project
- Adding new endpoints to documentation
- Using utoipa macros
- Testing with Swagger UI

**Use this when**: You need to document new API endpoints or understand the API structure.

---

### [EMAIL_QUEUE.md](./EMAIL_QUEUE.md)

**Email Queue System**

- Architecture overview
- Adding new email types
- Email templates
- Worker configuration
- Monitoring and debugging

**Use this when**: You need to add new email types or debug email delivery.

---

## Database Tables

The schema includes 9 tables:

1. **users** - User accounts with local/OAuth authentication
2. **meetings** - Video conference meetings
3. **participants** - Meeting attendees (supports guests)
4. **audio_video_devices** - Media device tracking
5. **chat_messages** - In-meeting text chat
6. **session_logs** - Event logging and audit trail
7. **webhooks** - User-specific event notifications
8. **api_keys** - API access with usage tracking
9. **email_jobs** - Email queue for async delivery

## Key Features

- **UUID Primary Keys** - All tables use PostgreSQL UUIDs
- **Dual Authentication** - Local (email/password) + Google OAuth
- **Guest Support** - Anonymous users can join meetings
- **Type-Safe Models** - SeaORM entities with Rust enums
- **Email Queue** - Async email delivery with retry and dead-letter queue
- **API Management** - Usage tracking and rate limiting

## Project Structure

```
backend/
├── src/
│   ├── config/         # App and email configuration
│   ├── dto/            # Request/Response DTOs
│   ├── handlers/       # Request handlers (controllers)
│   ├── middleware/     # Auth middleware
│   ├── models/         # SeaORM entities
│   ├── queues/         # Job queues (email)
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   ├── swagger/        # OpenAPI documentation
│   ├── templates/      # Email templates
│   ├── workers/        # Background workers
│   ├── error.rs        # Error types
│   ├── state.rs        # App state
│   ├── lib.rs          # Module exports
│   └── main.rs         # Entry point
├── migration/          # Database migrations
├── docs/               # This folder
├── Cargo.toml
└── .env
```

## Reading Order

**New to the project?** Read in this order:

1. Start with **QUICK_START.md** to get the project running
2. Read **DATABASE_SCHEMA.md** for schema details
3. Check **SWAGGER_GUIDE.md** for API documentation
4. See **EMAIL_QUEUE.md** if working with emails

---

**Last Updated**: 2026-01-17
