# ADR-001: Technology Stack Selection

## Status

Accepted

## Context

We need to select a production-grade technology stack for a scalable school management system supporting 60,000+ users across web, mobile, and admin interfaces. The system requires strong type safety, multi-tenancy, RBAC, relational data, and long-term maintainability.

## Decision

| Component | Technology |
|-----------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Web/Admin | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Mobile | React Native + Expo |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Cache | Redis |
| Auth | Passport + JWT |
| Validation | Zod + class-validator |
| Queue | BullMQ |

## Rationale

### Monorepo (pnpm + Turborepo)
- pnpm provides deterministic installs and efficient disk usage
- Turborepo offers intelligent caching and task pipelining
- Enables shared types and utilities across web, mobile, and backend

### Next.js (Web + Admin)
- Industry-standard React framework with excellent TypeScript support
- App Router provides SSR/SSG for performance and SEO
- Large ecosystem, strong community, proven at scale
- Allows distinct admin panel with shared component library

### React Native + Expo (Mobile)
- Shares TypeScript types and domain logic with web
- Expo managed workflow reduces native configuration complexity
- Single codebase for iOS and Android
- Strong performance for data-heavy school applications

### NestJS (Backend)
- Built for modular monoliths with dependency injection
- Native support for guards, interceptors, pipes, decorators
- Excellent TypeScript support and code organization
- Proven in enterprise applications
- Easily extractable to microservices if needed in future

### PostgreSQL
- ACID-compliant relational database
- Handles complex joins and aggregations for reports
- Proven at scale (60,000+ users)
- Rich extension ecosystem

### Prisma
- Type-safe database access with auto-generated types
- Excellent migration system
- Works seamlessly with TypeScript
- Reduces boilerplate and SQL errors

### Redis
- In-memory performance for sessions, caching, and queues
- Industry standard for caching and background jobs
- Supports pub/sub for notifications

## Consequences

- TypeScript across all layers provides end-to-end type safety
- Shared packages reduce duplication between web and mobile
- NestJS modular architecture keeps code maintainable
- Prisma migrations provide reliable schema evolution
- Redis adds operational complexity but is justified by performance needs

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|-----------------|
| Express/Fastify backend | Less opinionated, requires more custom security/auth plumbing |
| TypeORM | Prisma offers better TypeScript integration and migration experience |
| MongoDB | Relational data (attendance, marks, results) requires ACID guarantees |
| Vue.js/Svelte | React chosen for shared component library and larger talent pool |
| Flutter | React Native allows better code sharing with existing React web ecosystem |
| Microservices | Premature for this stage; modular monolith is simpler and faster to develop |

## Date

2026-09-06
