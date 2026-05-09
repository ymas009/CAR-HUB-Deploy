# CarHub Architecture

## Product Intent

CarHub is a curated travel package platform for tourism, spiritual destinations, holidays, and destination-based experiences. It is intentionally not an open marketplace. The company owns the customer relationship, commercial rules, request review, provider assignment, support workflow, and final customer communication.

## Sitemap

Public:
- `/` - home and destination discovery
- `/packages` - searchable package catalog
- `/packages/:id` - package details and request CTA
- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/cancellation-refund`
- `/login`
- `/register`
- `/forgot-password`

Customer:
- `/customer/requests`
- `/customer/bookings`
- `/customer/profile`
- `/customer/support`
- `/customer/feedback`
- `/customer/notifications`
- `/request/:packageId`

Company/Admin:
- `/admin`
- `/admin/requests`
- `/admin/requests/:id/review`
- `/admin/packages`
- `/admin/providers`
- `/admin/support`
- `/admin/audit`
- `/admin/settings`

Provider:
- `/provider`
- `/provider/assignments`
- `/provider/profile`
- `/provider/escalations`

Support:
- `/support`
- `/support/tickets`
- `/support/escalations`

## Role-Based Flows

Guest:
1. Browse destinations and packages.
2. Click protected action.
3. Redirect to login/register with `returnTo`.
4. Resume intended action after authentication.

Customer:
1. Register with minimal required profile and consent.
2. Complete profile if required.
3. Submit a validated step-based request.
4. Track request and booking status.
5. Raise support tickets during trip.
6. Submit moderated feedback after completion.

Admin:
1. Review all submitted requests first.
2. Approve, reject, hold, modify, clarify, cancel, reschedule, or escalate.
3. Select provider-visible fields and masking rules.
4. Assign/reassign providers.
5. Control communications, support cases, refunds, disputes, and closure.

Provider:
1. Register and wait for company verification.
2. Login only after approval.
3. View assigned approved work only.
4. See minimum required masked customer/trip data.
5. Accept, update progress, upload proof, or raise escalation.

Support:
1. Triage tickets with SLA.
2. View emergency data only when authorized.
3. Coordinate provider issues under company control.
4. Escalate, resolve, and audit outcomes.

## Approval Workflow

Statuses:
- `DRAFT`
- `REQUEST_SUBMITTED`
- `UNDER_REVIEW`
- `CLARIFICATION_REQUESTED`
- `APPROVED_BY_COMPANY`
- `REJECTED_BY_COMPANY`
- `PAYMENT_PENDING`
- `FORWARDED_TO_PROVIDER`
- `ACCEPTED_BY_PROVIDER`
- `IN_PROGRESS`
- `SUPPORT_ESCALATION`
- `COMPLETED`
- `CANCELLED`
- `RESCHEDULED`
- `REFUND_INITIATED`
- `REFUND_COMPLETED`

Every transition writes an audit event containing actor, role, timestamp, previous state, new state, reason, and request metadata.

## Provider Data-Sharing Control

Provider visibility is not a join against raw customer request data. Provider visibility is a separate `provider_assignment` plus `provider_shared_payload` record produced by an admin action.

Shared payloads are:
- admin-approved
- assignment-bound
- field-scoped
- masked
- revocable
- expiring
- audited

## Security Model

- Passwords are hashed with BCrypt.
- Spring Security enforces authentication and role checks.
- API routes are versioned under `/api/v1`.
- DTOs prevent accidental entity exposure.
- Provider APIs query assignments and shared payloads, not customer records.
- Admin APIs require admin/sub-admin permissions.
- Support emergency fields require explicit support/admin authorization.
- Audit logs are append-only at the application level.
- Sensitive fields are masked in UI and API responses unless purpose-bound access is granted.

## RBAC Model

Roles:
- `CUSTOMER`
- `ADMIN`
- `SUB_ADMIN`
- `SUPPORT`
- `PROVIDER`

Permission examples:
- `REQUEST_CREATE`
- `REQUEST_REVIEW`
- `REQUEST_ASSIGN_PROVIDER`
- `PROVIDER_PAYLOAD_SHARE`
- `PROVIDER_ASSIGNMENT_VIEW`
- `SUPPORT_TICKET_MANAGE`
- `AUDIT_VIEW`
- `CONTENT_MANAGE`

## API Modules

- Auth and session
- Users and profiles
- Package catalog
- Customer requests
- Admin review workflow
- Provider onboarding
- Provider assignments
- Support tickets and escalations
- Feedback moderation
- Notifications
- Audit logs
- Settings/content

## Error Handling

Use structured API errors:

```json
{
  "code": "REQUEST_NOT_PROVIDER_VISIBLE",
  "message": "This request is not visible to the provider.",
  "traceId": "generated-trace-id",
  "details": {}
}
```

## Performance Strategy

- Route-level frontend lazy loading.
- Small API payloads with DTOs.
- Pagination and filtering for dashboards.
- Index request status, customer, provider assignment, workflow state, and audit timestamps.
- Cache public package catalog data.
- Use async jobs for notification and workflow side effects.
- Keep mobile app compatibility through stable REST contracts.

## Deployment Strategy

MVP:
- Single Spring Boot service
- PostgreSQL
- Vite static frontend
- Basic observability

Growth:
- Redis cache
- Background worker/queue
- CDN
- Read replicas
- Feature flags

Enterprise:
- SSO/MFA
- Multi-region readiness
- Advanced audit retention
- WAF/rate limiting
- CRM/support integrations

Ultra-scale:
- Domain-separated services
- Event-driven workflow
- Partitioned audit/request data
- Multi-region active-active planning
