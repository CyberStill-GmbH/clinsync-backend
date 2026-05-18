<div align="center">

# ClinSync · Backend API

**Production-grade REST API for clinical appointment management.**  
Built with NestJS, Prisma ORM, PostgreSQL, and TypeScript.

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)]()
[![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.8-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://swagger.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT_Bearer-black?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)]()

</div>

---

## Overview

ClinSync Backend is the data and business logic layer for a clinical appointment scheduling system. It handles patient registration, schedule availability, appointment lifecycle management, and administrative reporting — all through a well-structured, role-gated REST API.

The system is designed around three core constraints that matter in real clinical environments:

- **No double-bookings.** Schedule slots are locked atomically inside a database transaction. If two patients attempt to book the same slot concurrently, exactly one succeeds and the other receives a `409 Conflict`.
- **No data leakage.** The `passwordHash` field is structurally excluded from all API responses via Prisma `select`. A `GlobalExceptionFilter` ensures Prisma internals never surface to clients.
- **Full audit trail.** Every appointment status transition is recorded in `AppointmentHistory` with the previous state, new state, actor, and timestamp.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Request                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  helmet()       │  Security headers
                    │  CORS Policy    │  Origin-whitelisted
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ GlobalException │  Prisma errors → clean HTTP
                    │ Filter          │  P2025→404  P2002→409
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ ValidationPipe  │  DTO whitelist + transform
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ JwtAuthGuard    │  Passport JWT strategy
                    │ RolesGuard      │  @Roles(ADMIN, PATIENT...)
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐
   │ AuthModule  │   │Appointments  │   │ AdminModule │
   │ Areas       │   │ Schedules    │   │ Patients    │
   │ Doctors     │   │ Patients     │   │ Dashboard   │
   └──────┬──────┘   └───────┬──────┘   └──────┬──────┘
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PrismaService  │  Database abstraction
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

---

## Security

| Layer | Mechanism |
|---|---|
| HTTP Headers | `helmet()` — Content-Security-Policy, X-Frame-Options, X-XSS-Protection, HSTS |
| CORS | Origin-whitelisted from `FRONTEND_URL` env var; explicit methods and headers |
| Authentication | Passport JWT — `sub`, `email`, `role` claims; token signed with `JWT_SECRET` |
| Authorization | `@Roles()` decorator + `RolesGuard` — enforced at controller method level |
| Input Validation | `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| Error Responses | `GlobalExceptionFilter` — Prisma error codes mapped to HTTP semantics; no stack traces |
| Password Storage | `bcrypt` with `saltRounds: 10` |
| Data Exposure | `me()` and all user queries use explicit `select` — `passwordHash` never serialized |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/clinsync?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

### Installation

```sh
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

The seed script creates 3 users, 3 medical areas, 3 doctors, and **252 available schedule slots** spanning 12 consecutive days — idempotently.

### Running

```sh
# Development (hot-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Verification Endpoints

| URL | Purpose |
|---|---|
| `GET /health` | Health check — no auth required. Returns `{ status: "ok", timestamp }` |
| `GET /api/docs` | Swagger UI — interactive API documentation |

---

## API Reference

### Authentication  `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create patient account (User + Patient record, atomic transaction) |
| `POST` | `/auth/login` | Public | Authenticate; returns `{ token, user: { id, email, role, name } }` |
| `GET` | `/auth/me` | Authenticated | Current user profile — `passwordHash` structurally excluded |
| `POST` | `/auth/logout` | Authenticated | Session termination |

### Patient Self-Service  `/api/appointments`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/appointments` | PATIENT | Book appointment — atomic schedule lock; returns `409` if slot taken |
| `GET` | `/appointments/me` | PATIENT | Appointment history, ordered by creation date desc |
| `GET` | `/appointments/me/:id` | PATIENT | Single appointment detail |

### Clinical Directory  `/api/areas`, `/api/doctors`, `/api/schedules`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/areas` | Authenticated | Active medical specialties |
| `GET` | `/doctors` | Authenticated | Active doctors; filterable with `?areaId=` |
| `GET` | `/schedules/available` | Authenticated | Available time slots |
| `GET` | `/areas/:id/schedules` | Authenticated | Schedules for a specific area |

### Administration  `/api/admin`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard` | ADMIN, RECEPTIONIST | Operational metrics: today, pending, validated, no-shows, available slots, total patients |
| `GET` | `/admin/appointments` | ADMIN, RECEPTIONIST | All appointments; filterable by `?status=`, `?areaId=`, `?date=` |
| `PATCH` | `/admin/appointments/:id/validate` | ADMIN, RECEPTIONIST | Validate — rejects if status is already terminal |
| `PATCH` | `/admin/appointments/:id/reschedule` | ADMIN, RECEPTIONIST | Reschedule — releases previous slot, locks new slot atomically |
| `PATCH` | `/admin/appointments/:id/cancel` | ADMIN, RECEPTIONIST | Cancel with mandatory reason; releases schedule slot |
| `PATCH` | `/admin/appointments/:id/attendance` | ADMIN, RECEPTIONIST | Mark `ATTENDED` or `NO_SHOW` |
| `GET` | `/admin/patients` | ADMIN, RECEPTIONIST | Paginated patient list — `?page=`, `?limit=`, `?search=` (name, DNI, phone) |
| `GET` | `/admin/patients/:id` | ADMIN, RECEPTIONIST | Patient detail including contact and emergency info |
| `GET` | `/admin/patients/:id/appointments` | ADMIN, RECEPTIONIST | Full appointment history for a patient |

---

## Appointment State Machine

```
            CONFIRMED ──────────────────────────────────────────────┐
                │                                                    │
                │ admin: validate                                    │
                ▼                                                    │
    VALIDATED_BY_RECEPTION ──────────────────────────┐              │
                │                                    │              │
                │ admin: reschedule                  │ admin:       │ admin:
                ▼                                    │ attendance   │ cancel
         RESCHEDULED ──────────────────┐             │              │
                                       │             ▼              ▼
                                       │          ATTENDED    CANCELLED_BY_RECEPTION
                                       │
                                       └──────► NO_SHOW
```

Terminal states (`ATTENDED`, `NO_SHOW`, `CANCELLED_BY_RECEPTION`) cannot be transitioned. The service enforces this with a guard that throws `409 Conflict`.

---

## Build Validation

```
npx prisma validate   →  The schema at prisma/schema.prisma is valid
npx prisma generate   →  Prisma Client v7.8.0 generated in 202ms
npm run build         →  nest build — Exit code 0
npx prisma db seed    →  252 schedules across 12 days seeded
```

---

## Project Structure

```
src/
├── common/
│   ├── decorators/       # @CurrentUser(), @Roles()
│   ├── filters/          # GlobalExceptionFilter
│   ├── guards/           # JwtAuthGuard, RolesGuard
│   └── types/            # AuthUser interface
├── database/
│   ├── database.module.ts
│   └── prisma.service.ts
└── modules/
    ├── admin/            # Dashboard, patient management
    ├── appointments/     # Full appointment lifecycle
    ├── areas/            # Medical specialties
    ├── auth/             # JWT login, register, me
    ├── doctors/          # Medical professionals
    ├── patients/         # Patient profiles
    └── schedules/        # Time slot management
```

---

## Roadmap

| Version | Planned |
|---|---|
| v1.1 | Refresh token rotation + session revocation table |
| v1.2 | Transactional email notifications (SMTP-ready service skeleton) |
| v1.3 | Rate limiting per role and per endpoint (`@nestjs/throttler`) |
| v2.0 | WebSocket gateway for real-time appointment status push |
| v2.1 | Reporting module — daily summaries, no-show rate, area utilization |

---

## Contributing

1. Create a feature branch from `main`
2. Run `npx prisma validate` and `npm run build` before committing
3. Follow the existing module structure — controllers own routing, services own logic
4. Open a pull request with a clear description of what changed and why
