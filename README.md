# AgentCare Tenant API

Backend API for AgentCare - AI-Powered Maintenance Service Management Platform

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Cache/Queue:** Redis + Bull
- **Validation:** Zod
- **Auth:** JWT
- **API Docs:** Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- pnpm (recommended) or npm
- Docker (optional, for database)

### Quick Start with Docker

```bash
# Start PostgreSQL and Redis containers
docker compose up -d

# Install dependencies
pnpm install

# Setup database and start server
pnpm db:generate && pnpm db:push && pnpm db:seed && pnpm dev
```

### Manual Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Configure .env (see Environment Variables section below)

# 4. Generate Prisma client
pnpm db:generate

# 5. Run database migrations
pnpm db:push

# 6. Seed database with sample data
pnpm db:seed

# 7. Start development server
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/agentcare` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing tokens (min 32 chars) | Generate with `openssl rand -base64 32` |
| `INTERNAL_API_KEY` | API key for service-to-service auth | Generate with `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000,http://localhost:3002` |

**Important:** Never commit `.env` to git. Only `.env.example` should be tracked.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## API Documentation

Interactive API documentation is available at:
- **Swagger UI:** http://localhost:4001/api-docs
- **OpenAPI JSON:** http://localhost:4001/api-docs.json

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/me` | GET | Current user profile |
| `/api/v1/customers` | GET/POST | Customer management |
| `/api/v1/employees` | GET/POST | Employee management |
| `/api/v1/service-requests` | GET/POST | Service request management |
| `/api/v1/invoices` | GET/POST | Invoice management |
| `/api/v1/properties` | GET/POST | Property management |

See Swagger UI for complete endpoint documentation with request/response schemas.

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── modules/         # Feature modules
│   ├── auth/
│   ├── organization/
│   ├── employee/
│   ├── customer/
│   ├── property/
│   ├── asset/
│   ├── service-request/
│   └── ...
├── services/        # Shared services
├── jobs/            # Background jobs
├── utils/           # Utility functions
└── types/           # TypeScript types
```

## Related Repositories

- [agentcare-web](../agentcare-web) - Web applications
- [agentcare-ai](../agentcare-ai) - AI service
- [agentcare-docs](../agentcare-docs) - Documentation

## License

Proprietary - All rights reserved.
