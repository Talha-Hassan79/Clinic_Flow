# ClinicFlow — memory.md
Version: 1.0 | Last Updated: 2026-07-16

> This file is the single source of truth for AI agents and contributors.
> Read this BEFORE writing any code.

---

# 1. Project Overview

**Name:** ClinicFlow
**Tagline:** Modern Clinic Management Simplified
**Type:** Cloud-based Multi-Tenant Clinic Management SaaS
**Status:** Phase 1 (Project Foundation) in progress

ClinicFlow replaces paper records, Excel sheets, and WhatsApp-based record-keeping with a modern, secure, cloud-based clinic management platform designed for small and medium-sized clinics.

---

# 2. Confirmed Tech Stack

## Frontend
| Package | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Language |
| Vite | Build tool |
| Tailwind CSS v4 + @tailwindcss/vite | Styling |
| React Router v7 | Routing |
| TanStack Query | Server state management |
| Zustand | Client state management |
| React Hook Form | Form handling |
| Zod | Validation |
| Framer Motion | Animations |
| Recharts | Charts |
| Lucide React | Icons (ONLY icon library) |
| Axios | HTTP client |

## Backend
| Package | Purpose |
|---|---|
| NestJS | Backend framework |
| Prisma ORM | Database ORM |
| PostgreSQL | Database |
| @nestjs/jwt + passport-jwt | JWT authentication |
| @nestjs/passport | Auth middleware |
| @nestjs/swagger | API documentation |
| BullMQ + ioredis | Background queues |
| class-validator + class-transformer | Validation |
| bcrypt | Password hashing |

## Infrastructure
| Service | Purpose |
|---|---|
| Docker | Local services orchestration |
| GitHub Actions | CI/CD |
| Vercel | Frontend deployment |
| Railway or Render | Backend deployment |
| Cloudflare R2 | File storage |
| Resend | Email sending |
| Neon PostgreSQL | Production database |
| Upstash Redis | Production Redis |

---

# 3. Project Folder Structure

```
clinicflow/                          ← Workspace root
├── .gitignore
├── README.md
├── docker/
│   └── docker-compose.yml           ← PostgreSQL (5433) + Redis (6379)
├── frontend/                        ← React Vite app
│   ├── vite.config.ts               ← @tailwindcss/vite plugin configured
│   ├── src/
│   │   ├── index.css                ← Tailwind v4 + design tokens
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── billing/
│   │   │   ├── reports/
│   │   │   └── common/
│   │   ├── layout/
│   │   ├── pages/
│   │   │   ├── landing/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── calendar/
│   │   │   ├── prescriptions/
│   │   │   ├── billing/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── profile/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── styles/
└── backend/                         ← NestJS app
    ├── src/
    │   ├── main.ts
    │   ├── app.module.ts
    │   ├── app.controller.ts
    │   └── app.service.ts
    ├── prisma/
    │   └── schema.prisma            ← (to be initialized)
    └── test/
```

---

# 4. Design System Tokens

## Colors
| Token | Value | Usage |
|---|---|---|
| Primary | #2563EB | Buttons, links, highlights, active nav |
| Secondary | #14B8A6 | Success indicators, medical highlights |
| Background | #FFFFFF | Page background |
| Surface | #F8FAFC | Page surface / subtle backgrounds |
| Card | #FFFFFF | Card backgrounds |
| Border | #E5E7EB | Borders everywhere |
| Text Primary | #111827 | Main text |
| Text Secondary | #6B7280 | Muted text, labels |
| Success | #22C55E | Success states |
| Warning | #F59E0B | Warning states |
| Danger | #EF4444 | Error states, delete actions |

## Typography
- **Font:** Inter (Google Fonts), fallback: system-ui
- **Weights:** 400, 500, 600, 700
- **Sizes:** 72px Hero → 12px Small (see design doc)

## Border Radius
| Element | Radius |
|---|---|
| Buttons | 16px |
| Cards | 20px |
| Inputs | 16px |
| Modals | 24px |
| Charts | 20px |

## Shadows
| Name | Value |
|---|---|
| Shadow Small | 0 2px 10px rgba(0,0,0,.05) |
| Shadow Medium | 0 10px 30px rgba(0,0,0,.08) |
| Shadow Large | 0 30px 60px rgba(0,0,0,.10) |

---

# 5. Design Principles

1. **Minimal** — No unnecessary UI elements
2. **Spacious** — Generous whitespace, never crowded
3. **Fast** — Instant interactions, optimistic UI
4. **Calm** — Healthcare software should reduce stress, avoid clutter
5. **Consistent** — Same typography, spacing, cards, buttons across all pages

Design inspiration: **Linear, Stripe, Apple, Notion, Vercel**

---

# 6. Architecture Rules

- Frontend ↔ Axios ↔ NestJS Controllers ↔ Services ↔ Prisma ↔ PostgreSQL
- **Business logic MUST live in Services only** — never in Controllers
- Controllers only: Validate, Authorize, Call Service, Return Response
- Server state: TanStack Query | Local state: Zustand | Forms: React Hook Form + Zod
- **Never call fetch() directly** — always use Axios through centralized API client
- Every API must be documented with Swagger
- All routes must verify: Authentication + Permissions + Clinic ownership

---

# 7. Multi-Tenancy Rules (CRITICAL)

- Every database table includes `clinicId`
- **Every query MUST filter by `clinicId`**
- Cross-clinic data access is strictly FORBIDDEN
- Never trust IDs coming from the client

---

# 8. Database Rules

- ORM: Prisma (never raw SQL unless absolutely necessary)
- Primary keys: UUID v4
- Soft deletes: `deletedAt` timestamp (never permanently delete production data)
- Every table has: `id`, `clinicId`, `createdAt`, `updatedAt`, `deletedAt`
- Password hashing: bcrypt (NEVER store plaintext passwords)
- Always use transactions for: Billing, Appointments, Payments, Prescriptions

---

# 9. Authentication

- JWT Access Token: **15 minutes** expiry
- Refresh Token: **7 days** expiry
- Never store tokens in localStorage — prefer secure HTTP-only cookies

---

# 10. User Roles (RBAC)

| Role | Scope |
|---|---|
| Super Admin | Full system access |
| Clinic Admin/Owner | Everything inside one clinic |
| Doctor | Appointments, prescriptions, patient records |
| Receptionist | Patient registration, appointments, invoices |
| Nurse | Vitals, patient record prep |
| Patient (Future) | Book appointments, view prescriptions |

---

# 11. Key Entity Relationships

- Clinic → many Users, Doctors, Patients, Medicines, Appointments, Invoices
- Patient → many Appointments, Medical Records, Prescriptions, Invoices
- Doctor → many Appointments, Prescriptions, Medical Records
- Appointment → 1 Invoice, 1 Prescription
- Invoice → many Payments
- Prescription → many Prescription Items
- Role ↔ many Permissions (via role_permissions)

---

# 12. API Standards

- Base URL: `/api/v1`
- RESTful, plural resources (e.g., `/api/v1/patients`)
- Auth: Bearer JWT
- Content-Type: `application/json`
- Standard response: `{ success, message, data, meta }`
- Error format: `{ success: false, message, errors[] }`
- Pagination: `?page=1&limit=20`
- Sorting: `?sort=name&order=asc`

---

# 13. Appointment Statuses
`Scheduled` | `Confirmed` | `Waiting` | `In Consultation` | `Completed` | `Cancelled` | `No Show`

---

# 14. Invoice Statuses
`Pending` | `Paid` | `Partially Paid` | `Cancelled`

---

# 15. Payment Methods
`Cash` | `Card` | `JazzCash` | `Easypaisa` | `Bank Transfer`

---

# 16. Development Rules (Mandatory)

### DO
- Use TypeScript strict mode always
- Use functional components only (React)
- Keep components under 250 lines
- Organize by feature
- Debounce search (300ms)
- Use Framer Motion for animations (200–300ms duration)
- Use skeleton loaders (never full-screen spinners)
- Use Lucide icons ONLY
- Validate on BOTH frontend (Zod) and backend (class-validator)
- Use React Hook Form for all forms
- Log with Pino (backend) — never log in production (frontend)

### DON'T
- Use `any` in TypeScript
- Use class components
- Use jQuery, Bootstrap, Material UI
- Use inline SQL
- Use inline CSS (except dynamic values)
- Store server state in Zustand
- Hardcode credentials
- Leave console.log in production code

---

# 17. Naming Conventions

| Context | Convention | Example |
|---|---|---|
| React Components | PascalCase | `PatientCard.tsx` |
| Hooks | camelCase with `use` prefix | `usePatients.ts` |
| Functions/Variables | camelCase | `getPatientById` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| DB Tables | snake_case | `medical_records` |
| DB Columns | snake_case | `first_name`, `created_at` |
| NestJS Modules | kebab-case | `patients.module.ts` |

---

# 18. Development Phases (Current: Phase 12)

| Phase | Module | Status |
|---|---|---|
| 1 | Project Foundation | ✅ Complete |
| 2 | Authentication | ✅ Complete |
| 3 | Landing Website | ✅ Complete |
| 4 | Dashboard | ✅ Complete |
| 5 | Clinic Settings | ✅ Complete |
| 6 | User Management | ✅ Complete |
| 7 | Patient Management & Lab Reports | ✅ Complete |
| 8 | Doctor Management | ✅ Complete |
| 9 | Appointment Management | ✅ Complete |
| 10 | Calendar | ✅ Complete |
| 11 | Medical Records | ✅ Complete |
| 12 | Prescriptions | ⏳ Pending |
| 13 | Billing | ⏳ Pending |
| 14 | Reports | ⏳ Pending |
| 15+ | Notifications, Files, Search, Audit, Perf, Tests, Deploy, SaaS, Admin | ⏳ Pending |

---

# 19. Environment

## Local Machine
- OS: Windows
- Node.js: v22.20.0
- npm: 11.6.2
- Git: 2.51.1 (Windows)
- Docker: **NOT installed**
- PostgreSQL: **Running locally** on default port 5432 (Service: postgresql-x64-18)
- Redis: **NOT running locally** → Use Upstash Redis for dev or install locally

## Commands
- Frontend dev: `cd frontend && npm run dev` (port 5173)
- Backend dev: `cd backend && npm run start:dev` (port 3000)
- PowerShell execution policy blocks npm.ps1 → use `cmd /c npm ...` instead

---

# 20. Completed Milestones (Phases 1-11)

### ✅ Phase 1: Project Foundation Complete
- Root workspace settings, configurations, Vite React app, NestJS API, folder structure, Prisma initialization, and builds verified.

### ✅ Phase 2: Authentication Complete
- Database seed script with default roles.
- NestJS authentication module with JWT strategy and session management.
- React onboarding page structures and token refresh interceptors.

### ✅ Phase 3: Landing Website Complete
- Marketing page with responsive navbar, bento features grid, pricing tables, active FAQ accordion, and CTA blocks.

### ✅ Phase 4: Dashboard Workspace Complete
- Collapsible sidebar dashboard layout ([DashboardLayout.tsx](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/layout/DashboardLayout.tsx)).
- NestJS analytics endpoints returning active metrics partitioned by clinic tenant ID.
- Dashboard panel ([DashboardPage.tsx](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/dashboard/DashboardPage.tsx)) with interactive area/bar graphs, waiting list status controls, and recent activity logs.

### ✅ Phase 5: Clinic Settings Complete
- `ClinicsModule` (Controller + Service + DTO) exposed via `GET/PATCH /clinics/my-clinic` with Clinic Owner role guard.
- Frontend tabbed [`SettingsPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/settings/SettingsPage.tsx) with Profile, Localization (Timezone/Currency/Opening Hours), and Billing (plan tier + invoice history) panels.
- Settings link enabled in sidebar navigation and `/settings` route registered.

### ✅ Phase 6: User Management Complete
- `UsersModule` (Controller + Service + DTOs) exposed via `GET /users`, `GET /users/roles`, `POST /users/invite`, `PATCH /users/:id/role`, `PATCH /users/:id/deactivate`, `PATCH /users/:id/reactivate` with Clinic Owner role guards.
- Frontend [`UsersPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/users/UsersPage.tsx) with stats cards, filterable staff table, role color badges, invite modal with temp password generation, and active/inactive status toggles.
- Users nav item added to sidebar navigation and `/users` route registered.

### ✅ Phase 7: Patient Management & Lab Diagnostics Complete
- `PatientsModule` (Controller + Service + DTOs) with full CRUD, search by name/phone/email/CNIC, gender/blood group filters, and summary stats.
- `LabModule` (Controller + Service + DTOs) with doctor test ordering workflow, priority tagging (Routine/Urgent), sample collection statuses, technician parameter result entries, reference ranges, and printable official diagnostic slip generation.
- Frontend [`PatientsPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/patients/PatientsPage.tsx) with stats strip, search & blood group filters, patient directory table, and comprehensive registration modal.
- Frontend [`PatientDetailPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/patients/PatientDetailPage.tsx) with clinical overview, allergies warning banner, and full diagnostic test histories.
- Frontend [`LabPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/lab/LabPage.tsx) providing a full clinic laboratory queue, Order Test modal (CBC, LFT, RFT, Lipid, HbA1c, etc.), Technician Results entry with High/Low flags, and Official Printable Lab Report Slip.
- Unlocked `Patients` and added `Lab & Diagnostics` navigation items in `DashboardLayout.tsx`.

### ✅ Phase 8: Doctor Management Complete
- `DoctorsModule` (Controller + Service + DTOs) with physician directory CRUD, medical departments list & auto-creation, consultation fee configuration, and availability status toggling.
- Frontend [`DoctorsPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/doctors/DoctorsPage.tsx) with metrics cards (Total, Available Now, On Leave, Departments), search & department filters, doctor cards grid with availability switch, and Register Doctor modal.
- Frontend [`DoctorDetailPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/doctors/DoctorDetailPage.tsx) displaying physician credentials, weekly consultation hours, consultation fee, and patient consultation timeline.
- Added `Doctors` navigation item in `DashboardLayout.tsx` and registered `/doctors` & `/doctors/:id` routes in `App.tsx`.

### ✅ Phase 9: Appointment Scheduling Complete
- `AppointmentsModule` (Controller + Service + DTOs) with appointment booking, automated daily token sequence generation (`Token #01`), available slots calculation, status lifecycle transitions (`SCHEDULED` ➔ `CONFIRMED` ➔ `WAITING` ➔ `IN_CONSULTATION` ➔ `COMPLETED` / `CANCELLED`), and clinic KPI analytics.
- Frontend [`AppointmentsPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/appointments/AppointmentsPage.tsx) with metrics cards, quick date filters (Today/All/Custom), doctor filter, status tabs, live queue table with single-click check-in & consultation call-in triggers, and Book Appointment modal.
- Unlocked `Appointments` navigation item in `DashboardLayout.tsx` and registered `/appointments` in `App.tsx`.

### ✅ Phase 10: Calendar View Complete
- Enhanced `AppointmentsService` & `QueryAppointmentsDto` with `startDate` and `endDate` range query support.
- Frontend [`CalendarPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/calendar/CalendarPage.tsx) with Month, Week, and Day views, doctor schedule overlays, status-colored appointment blocks, date cell click-to-book triggers, and quick inspection popovers with instant status changes (`Check In`, `Call In`, `Complete`).
- Added `Calendar` navigation item with `CalendarDays` icon in `DashboardLayout.tsx` and registered `/calendar` route in `App.tsx`.

### ✅ Phase 11: Medical Records (EMR) Complete
- `MedicalRecordsModule` (Controller + Service + DTOs) with structured clinical encounter recording (SOAP: Subjective, Objective, Assessment, Plan), vital signs serialization (BP, Pulse, Temp, Weight, SpO2), common diagnoses aggregation, and soft delete.
- Frontend [`MedicalRecordsPage.tsx`](file:///c:/Users/Faheem%20Chaudary/Desktop/clinic_flow/frontend/src/pages/records/MedicalRecordsPage.tsx) with KPI metric cards (Encounters, Patients Treated, Today's Visits, Top Diagnoses), search & doctor filter, clinical encounter table, Record Encounter modal with vitals strip, and official printable clinical consultation slip with clinic letterhead.
- Unlocked `Medical Records` navigation item in `DashboardLayout.tsx` and registered `/records` route in `App.tsx`.

Next: **Phase 12 — Prescriptions (Rx)** (Medication prescriptions, dosage, frequency, duration, instructions, printable Rx slip)

---

# 21. MVP Scope

### Included ✅
Authentication, Role Management, Dashboard, Patient Management, Appointment Scheduling, Prescriptions, Billing, Reports

### Excluded ❌
AI Diagnosis, Telemedicine, Mobile App, WhatsApp Integration, Lab Integration, Pharmacy Module

---

# 22. Monetization Plans

| Plan | Price | Limits |
|---|---|---|
| Starter | PKR 2,999/mo | 1 Doctor, 2 Staff, Basic Reports |
| Professional | PKR 6,999/mo | Unlimited Doctors & Patients, Advanced Reports, Email |
| Enterprise | Custom | Multi-branch, Priority Support, Custom Features |
