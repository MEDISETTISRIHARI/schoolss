# School Management System

Production-grade scalable school management platform supporting responsive web, mobile (Android/iOS), and admin interfaces.

## Quick Start

```bash
pnpm install
docker compose up -d
pnpm db:generate && pnpm db:push
pnpm dev
```

## Architecture

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Admin**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Mobile**: React Native + Expo + TypeScript
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Cache**: Redis
- **Storage**: S3-compatible object storage
- **Queue**: BullMQ
- **Auth**: JWT + Refresh Tokens + Passport
- **RBAC**: Server-side role-based access control

## Structure

- `apps/web` - Main web application
- `apps/admin` - Super Admin / Platform administration panel
- `apps/mobile` - React Native mobile application
- `backend` - NestJS API server
- `packages/database` - Prisma schema and migrations
- `packages/shared-types` - Shared TypeScript types
- `packages/shared-utils` - Shared utilities
- `packages/ui-components` - Shared UI component library
- `docs` - Architecture and decision records
- `tests` - Cross-package tests
- `infrastructure` - Deployment configs

## Roles

- Super Admin (Platform)
- Principal (School)
- School Admin (School)
- Teacher (Assigned classes/subjects)
- Student (Own data)
