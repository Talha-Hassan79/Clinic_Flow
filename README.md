# ClinicFlow

Modern Clinic Management SaaS.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, TanStack Query, Zustand, React Hook Form, Zod
- **Backend**: NestJS, Prisma ORM, PostgreSQL, Passport JWT, BullMQ, Redis
- **Local Services**: Docker / Local PostgreSQL & Redis

## Project Structure
```
clinicflow/
├── docker/                 # Docker configuration files
│   └── docker-compose.yml  # Local services (Postgres, Redis)
├── backend/                # NestJS API backend service
└── frontend/               # Vite React frontend web application
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v10 or higher)
- PostgreSQL running locally (port 5432) or a remote instance (e.g., Neon)
- Redis running locally or remote instance (e.g., Upstash)

### 1. Database Setup
Ensure PostgreSQL is running. Copy the `.env.example` to `.env` (both in backend/ and root if needed) and configure the database URL.

### 2. Backend Installation & Start
```bash
cd backend
npm install
npm run db:migrate  # Run Prisma migrations
npm run start:dev   # Start NestJS development server
```

### 3. Frontend Installation & Start
```bash
cd frontend
npm install
npm run dev         # Start Vite development server
```
