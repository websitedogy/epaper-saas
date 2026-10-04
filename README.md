# Dogy ePaper SaaS

## Architecture decisions

This foundation follows a scalable multi-tenant SaaS pattern with a separate Laravel API and Next.js frontend.

### Backend defaults
- Laravel 12 on PHP 8.3
- PostgreSQL as the primary database for tenant and account data
- Redis for cache, queue, and session storage
- Laravel Sanctum for API token authentication
- Service layer for business logic, with controllers handling transport concerns only
- API versioning under `/api/v1`
- Role and permission model prepared for future permission expansion

### Tenant model
The platform uses a customer-first tenant model:
- Dogy Super Admin is the platform owner
- Customer owns the brand and ePaper data
- Domains map to customers through `domains.customer_id`

Request-level tenant resolution is centralized in `ResolveTenantFromRequest`, which reads a company domain or tenant headers and attaches the active tenant identifiers to the request.

### Frontend defaults
- Next.js App Router
- TypeScript + Tailwind CSS
- Reusable admin dashboard primitives built in a shadcn-inspired style
- Separate routes for `/super-admin`, `/tenant-admin`, and `/customer`
- No business modules added yet; only the shell and foundation pages are present

### Security and operational baseline
- Environment-based secrets and config
- Form requests for request validation
- Policy-based authorization scaffolding
- Queue and scheduler ready for background jobs and recurring tasks
- Local storage for files, but the storage abstraction is ready for S3 in production

## Local development

Backend:
- cd backend
- php artisan serve

Frontend:
- cd frontend
- npm run dev

## Current status
The project currently contains the foundation and architecture required for the next phases:
- Laravel backend scaffolded
- Next.js frontend scaffolded
- PostgreSQL and Redis config prepared
- API versioning and auth foundation added
- Multi-tenant and role foundation created
- Database migrations for core SaaS tables prepared
- Reusable admin UI foundation created

Additional domain-specific business modules will be added in the next phase.
