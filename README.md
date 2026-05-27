# CarHub

CarHub is a production-grade, company-controlled travel package discovery and request platform. Customers can browse curated packages and submit trip requests. Every customer request is reviewed by the company before any provider receives an assigned, limited, masked execution payload.

## Workspace Structure

- `docs/` - product, architecture, security, workflow, and roadmap documentation.
- `database/` - PostgreSQL-first schema with audit, RBAC, request workflow, provider isolation, support, and feedback foundations.
- `frontend/` - React, TypeScript, Vite public customer and provider application foundation.
- `admin-frontend/` - Separate React, TypeScript, Vite company admin control center.
- `backend/` - Spring Boot Java 21 API foundation with layered packages, DTOs, RBAC, workflow, and audit structure.

## Non-Negotiable Rule

The company/admin is the single controlling authority. Providers are execution partners only. Providers never see unapproved requests and never receive sensitive customer data unless an admin explicitly approves, assigns, scopes, masks, and audits the shared payload.

## Local Tooling Note

Node.js LTS, Git, Java 21, and a local Apache Maven copy are expected for development. If the current terminal has not refreshed PATH after installation, use the helper scripts:

```powershell
.\scripts\verify.ps1
```

```powershell
.\scripts\dev-frontend.ps1
```

```powershell
.\scripts\dev-admin-frontend.ps1
```

```powershell
.\scripts\dev-backend.ps1
```

For a backend preview without PostgreSQL, use the local in-memory profile:

```powershell
.\scripts\dev-backend-local.ps1
```

PostgreSQL via Docker Compose:

```powershell
docker compose up -d postgres
```

Full-stack Docker Compose deployment preview:

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:8088`
- Admin frontend: `http://localhost:8089`
- Backend: `http://localhost:8081`
- Health: `http://localhost:8081/actuator/health`

Local in-memory backend preview:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev-backend-local.ps1
```

Seeded demo users:

- Admin: `admin@carhub.local` / `Admin@12345`
- Customer: `customer@carhub.local` / `Customer@12345`
- Provider: `provider@carhub.local` / `Provider@12345`

Manual commands:

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd admin-frontend
npm install
npm run dev
```

```powershell
cd backend
mvn spring-boot:run
```

## Key Acceptance Behaviors

- Guests can browse public discovery pages.
- Admin control center runs as a separate frontend from the customer/provider app.
- Protected actions redirect to authentication and resume the intended action.
- Customer requests go only to admin first.
- Providers see assigned approved work only.
- Provider-visible data is generated from an admin-approved sharing scope, never raw customer records.
- Workflow state changes are audit logged.
- UI uses a modern travel-tech design system with accessible colors, responsive layout, and lightweight animation.

## Production Readiness Status

Current level: organization-ready foundation, not final production launch.

Ready:

- Modular monolith structure with React frontend and Spring Boot backend.
- Real auth/session foundation with BCrypt and revocable bearer sessions.
- Customer request, admin review, provider scoped payload sharing, provider assignment updates.
- Audit persistence for important auth/workflow/access actions.
- Support ticket and feedback foundations.
- Dockerfiles, Docker Compose, CI workflow, env sample, and verification scripts.

Still required before launch:

- Deploy against managed PostgreSQL and verify migrations in staging.
- Replace development secrets and configure production CORS/HTTPS.
- Add deeper integration/E2E tests and security testing.
- Harden token lifecycle further with refresh rotation or secure cookie sessions.
- Add real notification, file upload scanning, payment, backup/restore, monitoring, and alerting.

## Production Deployment For aitourism.in

The production Docker setup serves:

- Customer website: `https://aitourism.in` and `https://www.aitourism.in`
- Admin portal: `https://admin.aitourism.in`
- Provider portal: `https://provider.aitourism.in`
- Spring Boot API: `https://aitourism.in/api/v1`

Point DNS `A` records for `@`, `www`, `admin`, and `provider` to the VPS. On the VPS install Git and Docker Compose, clone this repository, then create the secret environment file:

```bash
cp .env.production.example .env.production
nano .env.production
```

Do not commit `.env.production`. Set a strong `POSTGRES_PASSWORD` and a long random `CARHUB_JWT_SECRET`; fill Google, mail, and Razorpay values when those features are enabled.

First HTTPS certificate setup:

```bash
mkdir -p certbot/www certbot/conf
NGINX_CONF=./nginx/aitourism.bootstrap.conf docker compose --env-file .env.production -f docker-compose.prod.yml up -d nginx
docker compose --env-file .env.production -f docker-compose.prod.yml --profile certificate run --rm certbot certonly --webroot -w /var/www/certbot -d aitourism.in -d www.aitourism.in -d admin.aitourism.in -d provider.aitourism.in --email YOUR_EMAIL --agree-tos --no-eff-email
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Renew the Let's Encrypt certificate from cron, then reload Nginx:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile certificate run --rm certbot renew
docker compose --env-file .env.production -f docker-compose.prod.yml exec nginx nginx -s reload
```

For GitHub Actions deployment, add repository environment `production` with secrets `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`, and `DEPLOY_PATH`. The deployment path must be the cloned repository directory on the VPS and must already contain `.env.production` and the issued TLS certificate. Every successful `main` CI run then builds and restarts the production Docker stack on the VPS.
