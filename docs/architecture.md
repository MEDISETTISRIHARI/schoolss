# School Management System - Architecture Overview

## 1. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Monorepo | pnpm + Turborepo | Fast installs, efficient caching, workspace management |
| Web | Next.js 14 + TypeScript + Tailwind CSS | SSR/SSG, excellent DX, strong TS support, SEO-friendly |
| Admin | Next.js 14 + TypeScript + Tailwind CSS | Shared component library with web, distinct UX for platform admins |
| Mobile | React Native + Expo | Shared types/domain logic, native performance, single codebase |
| Backend | NestJS + TypeScript | Modular monolith, built-in DI, guards, interceptors, proven at scale |
| Database | PostgreSQL 16 | ACID compliance, complex relational queries, proven at scale |
| ORM | Prisma | Type-safe queries, excellent migrations, great TS integration |
| Cache | Redis | Sessions, permissions, rate limiting, frequent query caching |
| Auth | Passport + JWT | Industry standard, stateless, supports refresh tokens |
| Validation | Zod + class-validator | Shared schemas, runtime validation, type inference |
| State Mgmt | Zustand + TanStack Query | Lightweight global state, powerful server state caching |
| File Storage | S3-compatible (MinIO/AWS/R2) | Scalable, CDN-ready, standard protocol |
| Queue | BullMQ + Redis | Background jobs, email, notifications, backups |
| Testing | Jest + Supertest + Playwright | Unit, integration, E2E coverage |
| Linting | ESLint + Prettier | Code quality, consistency |

## 2. Domain Modules

### Core Domains
- **Authentication** - Login, registration, password reset, token refresh
- **Authorization** - RBAC, permissions, school/tenant isolation
- **Users** - User accounts, profiles, status management
- **Schools** - Multi-tenant school management, settings, branding
- **Academic Structure** - Academic years, classes, sections, subjects
- **Students** - Enrollment, profiles, guardians, academic records
- **Teachers** - Profiles, assignments, qualifications
- **Assignments** - Teacher-to-class/subject mappings
- **Attendance** - Daily attendance, corrections, finalization
- **Examinations** - Tests, schedules, types, publication workflow
- **Marks** - Mark entry, validation, correction audit
- **Results** - Computed results, grades, CGPA, publication, finalization
- **Awards** - Award proposals, approval workflow
- **Certificates** - Certificate generation, issuance, download
- **Homework** - Assignment creation, publishing, tracking
- **Timetable** - Class schedules, room assignments
- **Notifications** - School-wide, class-specific, personal notifications
- **Reports** - Academic, administrative, attendance reports
- **Files** - Document upload, management, access control
- **Settings** - School configuration, feature flags
- **Branding** - School logos, colors, themes
- **Audit** - Comprehensive audit logging for all sensitive actions
- **Backup** - Backup scheduling, execution, recovery metadata

## 3. Security Model

### Authentication
- JWT access tokens (short-lived, 15 min)
- Refresh tokens (long-lived, 7 days, stored in Redis + DB)
- bcrypt/argon2 password hashing
- Password reset via secure token
- Strong confirmation for sensitive operations

### Authorization
- Server-side RBAC enforced on every endpoint
- Never trust client-supplied role or school IDs
- `@RequirePermissions()` decorator for endpoint protection
- `PermissionsGuard` validates against database-stored permissions
- `TenantGuard` enforces school boundary
- Super Admin bypasses tenant guard for platform operations only

### Data Isolation
- Every query scoped to `schoolId` for school-scoped roles
- Soft deletes (`deletedAt`) for historical data protection
- Audit logs append-only, immutable
- No cross-school access without explicit Super Admin authorization

## 4. API Design

- RESTful JSON API under `/api/v1`
- OpenAPI/Swagger documentation
- Consistent response envelopes: `{ success, data, meta, error }`
- Pagination: `page`, `limit`, `total`
- Filtering via query params
- WebSocket endpoint for real-time notifications

## 5. Database Design Principles

- All tables include `id`, `createdAt`, `updatedAt`, `deletedAt`
- School-scoped entities include `schoolId`
- UUIDs for public identifiers, CUIDs for internal
- Soft deletes for academic/historical data
- Indexes on all foreign keys and frequently queried fields
- Unique constraints on business keys (admission number, employee ID, etc.)

## 6. Frontend Architecture

### Web (apps/web)
- Next.js App Router with Server Components where possible
- Route groups for role-based layouts
- TanStack Query for server state
- Zustand for client state
- React Hook Form + Zod for forms
- Tailwind CSS + custom design system
- Role-specific navigation and dashboards

### Admin (apps/admin)
- Same tech stack as web
- Distinct branding (platform-level)
- Super Admin and support workflows
- School management, global settings

### Mobile (apps/mobile)
- Expo managed workflow
- React Navigation
- Shared types via monorepo
- Platform-specific UI components
- Offline-ready architecture foundation

## 7. Shared Packages

- `@packages/database` - Prisma client, schema, migrations
- `@packages/shared-types` - TypeScript interfaces, Zod schemas
- `@packages/shared-utils` - Helper functions, formatters, validators
- `@packages/ui-components` - Reusable UI components (React + Tailwind)

## 8. Observability

- Winston logger with structured JSON logs
- Request/response logging middleware
- Audit logging for all privileged actions
- Error tracking ready (Sentry integration point)
- Health check endpoints

## 9. Scalability

- Stateless backend instances behind load balancer
- Redis for session and cache clustering
- Database connection pooling
- Read replicas for reporting (future)
- Background workers for async tasks
- CDN for static assets and files

## 10. Deployment

- Docker containers for all services
- docker-compose for local development
- CI/CD pipeline (GitHub Actions)
- Environment-based configuration
- Health checks and graceful shutdowns
