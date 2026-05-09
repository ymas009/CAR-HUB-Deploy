package com.carhub.content.dto;

import java.time.Instant;
import java.util.UUID;

public record ContentPageResponse(
        UUID id,
        String slug,
        String title,
        String summary,
        String body,
        String contactEmail,
        String contactPhone,
        String supportHours,
        boolean published,
        Instant updatedAt
) {
}
