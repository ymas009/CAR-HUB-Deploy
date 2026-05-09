package com.carhub.provider.dto;

import com.carhub.domain.RequestStatus;

import java.time.Instant;
import java.util.UUID;

public record ProviderAssignmentResponse(
        UUID assignmentId,
        RequestStatus status,
        String visibleFields,
        String maskedPayload,
        Instant expiresAt,
        String policy
) {
}
