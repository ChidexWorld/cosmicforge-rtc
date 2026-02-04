# CosmicForge RTC

Enterprise-grade, self-hosted real-time video communication platform powering CosmicForge products and external integrations.

## 🚀 Overview

CosmicForge RTC is a robust real-time communication platform built for high performance and scalability. It combines a high-speed Rust backend with a modern Next.js frontend to deliver seamless video conferencing, chat, and collaboration features.

## 🛠️ Tech Stack

### Backend

- **Language:** Rust (Edition 2021)
- **Framework:** Axum
- **Database ORM:** SeaORM (PostgreSQL)
- **Real-time Engine:** LiveKit (livekit-api)
- **Docs:** Utoipa (Swagger UI)
- **Auth:** JWT, OAuth2

### Frontend

- **Framework:** Next.js 15 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** TanStack Query
- **UI Components:** Radix UI, Lucide React
- **RTC Client:** LiveKit React Components

## 📚 Documentation

Detailed documentation is available in the `docs` directory:

- [**Getting Started**](docs/GETTING_STARTED.md) - Full guide to setting up the project locally.
- [**Windows Setup**](docs/WINDOWS_SETUP.md) - Specific instructions for Windows development environments.
- [**Timezone Handling**](docs/TIMEZONE.md) - Explanation of how timezones are managed in the application.

## ⚡ Quick Start

### Prerequisites

- Rust & Cargo
- Node.js & npm/pnpm
- Docker (for PostgreSQL & Redis)
- LiveKit Server (local or cloud)

### running the Backend

```bash
cd backend
# Setup environment variables
cp .env.example .env

# Run migrations
cargo run --bin migration

# Start server
cargo run
```

### Running the Frontend

```bash
cd frontend
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:3000` to view the application.
API Documentation is available at `http://localhost:8080/swagger-ui/` (default port).

## 📄 License

Proprietary. Copyright © 2026 CosmicForge. All rights reserved.
