# AgentCare API

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

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed

# Start development server
pnpm dev
```

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

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness check (includes DB)

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### More endpoints coming soon...

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
