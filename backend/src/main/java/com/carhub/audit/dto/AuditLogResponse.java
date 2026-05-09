package com.carhub.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorRole,
        String entityType,
        UUID entityId,
        String action,
        String previousState,
        String newState,
        String reason,
        Instant createdAt
) {
}
