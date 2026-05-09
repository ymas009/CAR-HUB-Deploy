package com.carhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record ProviderShareRequest(
        @NotNull UUID providerId,
        @NotNull Set<String> visibleFields,
        @NotNull Map<String, Object> maskedPayload,
        @NotBlank String purpose,
        Instant expiresAt
) {
}
