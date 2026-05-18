# ClinSync Backend API 🚀

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![Helmet](https://img.shields.io/badge/Helmet-informational?style=for-the-badge)](https://helmetjs.github.io/)

Enterprise-grade RESTful API powering **ClinSync** — a modern healthcare appointment scheduling system. Built to automate clinical workflows, eliminate scheduling conflicts, and give clinic administrators real-time operational visibility.

---

## 🏥 Why ClinSync?

Healthcare scheduling systems fail at predictable places: double-bookings, cancelled appointments without traceability, and no real-time data for administrators. ClinSync solves all three:

- **Atomic Schedule Locking** via Prisma transactions — no double-bookings, ever
- **Full Audit Trail** — every appointment status change is logged in `AppointmentHistory`
- **Role-Gated Access** — Patients, Admins, and Receptionists have strictly enforced access boundaries
- **Terminal Status Guards** — cannot re-validate an attended or cancelled appointment
- **Clean Error Surface** — a global exception filter maps every Prisma and HTTP error to a structured, user-facing response with no stack traces

---

## 🏗️ System Architecture

```
HTTP Client (Frontend / Swagger)
         │
         ▼
┌─────────────────────────────────────────────┐
│           NestJS Application                │
│                                             │
│  helmet()  ─  CORS  ─  GlobalExFilter       │
│  ValidationPipe  ─  JwtAuthGuard            │
│  RolesGuard  ─  @Roles(ADMIN, PATIENT...)   │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ Appoints │  │  Admin   │  │
│  │ Module   │  │ Module   │  │  Module  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │        │
│  ┌────▼─────────────▼──────────────▼─────┐  │
│  │            PrismaService              │  │
│  └────────────────────┬──────────────────┘  │
└───────────────────────┼─────────────────────┘
                        │
                   PostgreSQL
```

---

## 🔒 Security Layers

| Layer | Implementation |
|---|---|
| **HTTP Headers** | `helmet()` — sets `X-Frame-Options`, `X-XSS-Protection`, `Content-Security-Policy`, etc. |
| **CORS** | Env-driven `FRONTEND_URL` with explicit methods and headers whitelist |
| **Authentication** | Passport JWT strategy — `sub`, `email`, `role` claims in token |
| **Authorization** | `@Roles()` + `RolesGuard` — endpoint-level role enforcement |
| **Input Validation** | Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| **Error Handling** | `GlobalExceptionFilter` — Prisma errors mapped to 404/409/400, never exposing internal details |
| **Password Storage** | `bcrypt` with `saltRounds: 10` |
| **Data Exposure** | `me()` uses `select` — `passwordHash` is never returned to clients |

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/clinsync?schema=public"

# JWT
JWT_SECRET="clinsync_ultra_secure_jwt_secret_2026"

# CORS — must match the frontend origin exactly
FRONTEND_URL="http://localhost:5173"

PORT=3000
```

### 2. Install & Initialize
```bash
npm install
npx prisma generate
npx prisma db push        # or: npx prisma migrate dev
npx prisma db seed        # seeds 252 schedules across 12 days
```

### 3. Run
```bash
npm run start:dev    # development with hot-reload
npm run build        # production compile (exit 0)
npm run start:prod   # run production build
```

### 4. Verify
| URL | Purpose |
|---|---|
| `http://localhost:3000/health` | Health check — returns `{ status: "ok" }` |
| `http://localhost:3000/api/docs` | Interactive Swagger UI |

---

## 📡 API Reference

### 🔐 Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register patient (creates User + Patient atomically) |
| POST | `/api/auth/login` | Public | Returns JWT + user with real `firstName lastName` |
| GET | `/api/auth/me` | Any | Current user profile — never exposes `passwordHash` |
| POST | `/api/auth/logout` | Any | Session termination signal |

### 📅 Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/appointments` | PATIENT | Book appointment — atomic schedule lock |
| GET | `/api/appointments/me` | PATIENT | My appointment history |
| GET | `/api/admin/appointments` | ADMIN/RECEPTIONIST | All appointments (filterable by status, area, date) |
| PATCH | `/api/admin/appointments/:id/validate` | ADMIN/RECEPTIONIST | Validate — guards terminal statuses |
| PATCH | `/api/admin/appointments/:id/reschedule` | ADMIN/RECEPTIONIST | Reschedule — releases old slot, locks new one |
| PATCH | `/api/admin/appointments/:id/cancel` | ADMIN/RECEPTIONIST | Cancel with mandatory reason |
| PATCH | `/api/admin/appointments/:id/attendance` | ADMIN/RECEPTIONIST | Mark ATTENDED or NO_SHOW |

### 🏢 Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | ADMIN/RECEPTIONIST | Today's stats, pending, validated, no-shows, totalPatients |
| GET | `/api/admin/patients` | ADMIN/RECEPTIONIST | Paginated patient list with `?page=&limit=&search=` |
| GET | `/api/admin/patients/:id` | ADMIN/RECEPTIONIST | Patient detail |
| GET | `/api/admin/patients/:id/appointments` | ADMIN/RECEPTIONIST | Patient appointment history |

### 🏥 Clinical Directory
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/areas` | User | Active medical specialties |
| GET | `/api/doctors` | User | All active doctors (filterable by `?areaId=`) |
| GET | `/api/schedules/available` | User | Available time slots |

---

## ✅ Build Verification

```bash
npx prisma validate    # ✅ The schema is valid 🚀
npx prisma generate    # ✅ Prisma Client v7.8.0 generated in 202ms
npm run build          # ✅ nest build — Exit code: 0
npx prisma db seed     # ✅ 252 schedules seeded across 12 days
```

---

## 🗺️ Roadmap

| Version | Feature |
|---|---|
| **v1.1** | Refresh token rotation + session revocation |
| **v1.2** | Email notifications on booking confirmed/cancelled (SMTP ready) |
| **v1.3** | Doctor user accounts (scheduling self-management) |
| **v2.0** | WebSocket-based real-time updates (replaces BroadcastChannel) |
