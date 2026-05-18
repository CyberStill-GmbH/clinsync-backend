# ClinSync Backend API 🚀

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

An enterprise-grade, high-performance RESTful API powering **ClinSync**, a modern healthcare appointment scheduling ecosystem. Designed to automate clinical operations, reduce scheduling conflicts, and deliver real-time operational metrics for clinics and healthcare providers.

---

## 🏥 Real-World Healthcare Impact

In modern clinical environments, operational delays and double-bookings translate directly to patient frustration and sub-optimal resource allocation. **ClinSync Backend** eliminates these bottlenecks by introducing:
* **Atomic Schedule Locking:** Transitioning schedule slots to `OCCUPIED` dynamically, preventing 409 scheduling conflicts.
* **Role-Based Workflows:** Distinct boundaries between Patient self-scheduling and Administrator/Receptionist clinical coordination.
* **Transactional Reliability:** Backed by PostgreSQL and Prisma ORM to ensure patient records, clinical schedules, and doctor availability are synchronized atomically.

---

## 🏗️ System Architecture & Data Flow

ClinSync Backend follows the **NestJS Modular Layered Architecture**, enforcing a strict separation of concerns through modules, controllers, services, and data repositories.

### Modular Architecture Map
```text
                  [ HTTP Clients / Frontend ]
                              │
                    ┌─────────▼─────────┐
                    │    Global DTOs    │
                    │  ValidationPipe   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │    Controllers    │ (Routes, Request Mapping, Swagger Docs)
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │     Services      │ (Business Logic, Auth Guards, Transaction Control)
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Prisma Client   │ (Database Transactions, ORM Layer)
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ PostgreSQL Engine │
                    └───────────────────┘
```

* **Modules:** Highly decoupled domains (`AuthModule`, `PatientsModule`, `AreasModule`, `DoctorsModule`, `SchedulesModule`, `AppointmentsModule`, `AdminModule`).
* **Controllers:** Expose standard REST endpoints, enforce validation via `class-validator` DTOs, and auto-generate OpenAPI/Swagger documentation.
* **Services:** Enforce business rules, validate state transitions, and calculate administrative dashboard analytics.
* **Prisma Service:** Database abstraction extending `PrismaClient` with automatic `$connect` lifecycle management.

---

## 🔒 Security & Compliance

The backend implements a multi-tier security framework to protect patient privacy and clinical operations:
* **JWT Bearer Authentication:** Secure stateless session handling via Passport JWT strategy. Access tokens contain `sub` (userId), `email`, and `role` claims.
* **Role-Based Access Control (RBAC):** Strict routing authorization using `@Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)` and `@UseGuards(JwtAuthGuard, RolesGuard)`.
* **Cors Validation:** Preflight `OPTIONS` requests allowed with credentials mapping back to trusted clinical frontends (`process.env.FRONTEND_URL`).
* **Input Sanitization:** Global `ValidationPipe` with `transform: true` and `whitelist: true` prevents SQL injection, parameter tampering, and exposes exact client error feedback.

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL instance running locally or via Docker
* npm or yarn

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinsync?schema=public"

# Authentication secret
JWT_SECRET="clinsync_ultra_secure_jwt_secret_2026_key"

# CORS policy configuration
FRONTEND_URL="http://localhost:5173"

# Operational PORT
PORT=3000
```

### 2. Installation & Setup
```bash
# Clone the repository and install dependencies
cd clinsync-backend
npm install

# Generate Prisma Client and apply migrations
npx prisma generate
npx prisma db push
```

### 3. Database Seeding (Idempotent)
Generate **252 real doctor schedules** spanning a **12-day consecutive window** (May 18 to May 29, 2026), along with clinical areas, default administrative profiles, and test accounts:
```bash
npx prisma db seed
```

### 4. Running the Server
```bash
# Development mode with hot-reload
npm run start:dev

# Production build and execution
npm run build
npm run start:prod
```

---

## 📡 API Endpoints Reference

### 🔐 Authentication Module (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register a new Patient profile + User credentials |
| **POST** | `/api/auth/login` | Public | Authenticate user; returns JWT token + user details |
| **GET** | `/api/auth/me` | User | Get currently authenticated profile details |
| **POST** | `/api/auth/logout` | User | Terminate session and invalidate client tokens |

### 👨‍⚕️ Clinical Directories (`/api/areas`, `/api/doctors`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/areas` | User | Retrieve list of active medical specialties |
| **GET** | `/api/doctors` | User | List all active medical professionals |
| **GET** | `/api/doctors?areaId=:id` | User | Filter active professionals by clinical area |

### 📅 Patient Scheduling (`/api/schedules`, `/api/appointments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/schedules/available` | User | List active unbooked slot dates and hours |
| **POST** | `/api/appointments` | Patient | Reserve a schedule slot (transitions slot to `OCCUPIED`) |
| **GET** | `/api/appointments/me` | Patient | List scheduling history for the logged-in Patient |

### 🏢 Administrative Portal (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/dashboard` | Admin | Fetch aggregate clinical performance metrics |
| **GET** | `/api/admin/appointments` | Admin | Retrieve all patient bookings in the clinic |
| **PATCH** | `/api/admin/appointments/:id/validate` | Admin | Verify and validate a pending patient booking |
| **PATCH** | `/api/admin/appointments/:id/reschedule` | Admin | Reprogram booking (releases old slot, locks new one) |
| **PATCH** | `/api/admin/appointments/:id/cancel` | Admin | Cancel appointment with reason (releases schedule slot) |
| **PATCH** | `/api/admin/appointments/:id/attendance` | Admin | Mark patient attendance (`ATTENDED` / `NO_SHOW`) |

---

## ✅ Validation & Build Verification Results

ClinSync Backend compiles with **strict type-checking constraints** and complies with the NestJS operational compiler standards:

* **Prisma Schema Validation:**
  ```bash
  > npx prisma validate
  Prisma schema loaded from prisma\schema.prisma.
  The schema at prisma\schema.prisma is valid 🚀
  ```
* **Prisma Client Generation:**
  ```bash
  > npx prisma generate
  ✔ Generated Prisma Client (v7.8.0) to .\node_modules\@prisma\client in 202ms
  ```
* **NestJS Production Compile:**
  ```bash
  > npm run build
  nest build
  Exit code: 0 (SUCCESS)
  ```

---

## 📈 Roadmap & Contributions
1. **Multi-Factor Auth (MFA):** Extra security layer for clinic operators.
2. **Automated Queue Management:** Live tracking of patient delays in reception.
3. **Medical Auditing Logs:** Comprehensive logging of schedule changes for audit trails.

To contribute, please open a feature branch and submit a PR against `main`. Enforce ESLint/Prettier formatting standards before committing.
