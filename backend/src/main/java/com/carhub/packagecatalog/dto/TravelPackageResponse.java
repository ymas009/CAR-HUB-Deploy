package com.carhub.packagecatalog.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TravelPackageResponse(
        UUID id,
        String slug,
        String title,
        String destination,
        String category,
        String summary,
        String description,
        BigDecimal startingPrice,
        String currency,
        int durationDays,
        String imageUrl,
        boolean featured,
        String availabilityStatus,
        String providerBusinessName,
        String reviewNotes
) {
}
