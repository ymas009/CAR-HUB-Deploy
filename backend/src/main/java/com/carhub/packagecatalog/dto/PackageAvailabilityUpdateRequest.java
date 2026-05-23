package com.carhub.packagecatalog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PackageAvailabilityUpdateRequest(
        @Size(max = 160) String title,
        @Size(max = 240) String destination,
        @Size(max = 120) String category,
        @Size(max = 2000) String summary,
        @Size(max = 6000) String description,
        @Min(0) BigDecimal startingPrice,
        @Min(1) @Max(30) Integer durationDays,
        @Size(max = 6_000_000) String imageUrl,
        @Size(max = 2000) String localPlaces,
        @NotBlank String availabilityStatus,
        @Size(max = 1000) String reviewNotes,
        boolean featured,
        @Size(max = 6_000_000) String videoUrl,
        @Size(max = 6_000_000) String carPhotoUrl,
        @Size(max = 40) String carNumber,
        @Size(max = 120) String carModel,
        @Size(max = 80) String carColor,
        @Min(1) @Max(6) Integer seatsAvailable,
        @Min(0) BigDecimal distanceKm,
        @Min(0) BigDecimal pricePerKm,
        @Size(max = 2000) String providerNotes,
        @Size(max = 20) String region,
        String routeOrder,
        @Min(0) Integer totalDistanceKm,
        String subPlaces
) {
}
