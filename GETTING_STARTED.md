# CosmicForge RTC - Getting Started Guide

## 📋 Prerequisites

- **Rust** (1.70+) - [Install from rustup.rs](https://rustup.rs/)
- **PostgreSQL** (14+) - Running locally or via Docker
- **Node.js** (18+) - For frontend (if applicable)

## 🚀 Quick Start

### 1. **Database Setup**

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name cosmicforge-postgres \
  -e POSTGRES_USER=cosmicforge \
  -e POSTGRES_PASSWORD=cosmicforge123 \
  -e POSTGRES_DB=cosmicforge_rtc \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Local PostgreSQL

Create a database manually:

```sql
CREATE DATABASE cosmicforge_rtc;
```

### 2. **Environment Configuration**

Copy the example environment file and update it with your database credentials:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL` with your actual database credentials:

```
DATABASE_URL=postgresql://cosmicforge:cosmicforge123@localhost:5432/cosmicforge_rtc
```

### 3. **Install Dependencies & Run Migrations**

```bash
# Navigate to backend directory
cd backend

# Build the project (this will download dependencies)
cargo build

# Run database migrations
cargo run
```

The `main.rs` file is currently set up to:

- Connect to the database
- Run migrations automatically
- Confirm successful setup

### 4. **Development Workflow**

```bash
# Run the backend server
cargo run

# Run in watch mode (auto-reload on changes)
cargo install cargo-watch
cargo watch -x run

# Run tests
cargo test

# Check code without building
cargo check

# Format code
cargo fmt

# Lint code
cargo clippy
```

## 📁 Project Structure

```
cosmicforge-rtc/
├── backend/
│   ├── src/
│   │   └── main.rs          # Application entry point
│   ├── migration/           # Database migrations (SeaORM)
│   ├── Cargo.toml           # Rust dependencies
│   └── .env                 # Environment variables (not in git)
├── frontend/                # Frontend application (if applicable)
└── README.md
```

## 🔧 Common Commands

```bash
# Create a new migration
sea-orm-cli migrate generate <migration_name>

# Run migrations
cargo run  # (migrations run automatically in main.rs)

# Rollback last migration
sea-orm-cli migrate down

# Generate entities from database
sea-orm-cli generate entity -o src/entities
```

## 🛠️ Tech Stack

- **Framework**: Rust with Tokio (async runtime)
- **ORM**: SeaORM
- **Database**: PostgreSQL
- **Environment**: dotenvy

## 📝 Next Steps

1. ✅ Set up database (PostgreSQL)
2. ✅ Configure `.env` file
3. ✅ Run `cargo build`
4. ✅ Run `cargo run` to execute migrations
5. 🔨 Start building your RTC features!

## 🐛 Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `psql -U postgres -l`
- Check `DATABASE_URL` in `.env` is correct
- Ensure database exists: `createdb cosmicforge_rtc`

### Build Errors

- Update Rust: `rustup update`
- Clean build: `cargo clean && cargo build`

### Migration Errors

- Check migration files in `migration/src/`
- Verify database schema compatibility

## 📚 Resources

- [SeaORM Documentation](https://www.sea-ql.org/SeaORM/)
- [Tokio Documentation](https://tokio.rs/)
- [Rust Book](https://doc.rust-lang.org/book/)

---

**Need help?** Check the project documentation or open an issue.
