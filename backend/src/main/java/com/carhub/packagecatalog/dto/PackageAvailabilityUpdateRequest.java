package com.carhub.packagecatalog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PackageAvailabilityUpdateRequest(
        @NotBlank String availabilityStatus,
        @Size(max = 1000) String reviewNotes,
        boolean featured,
        @Size(max = 1000) String videoUrl,
        @Size(max = 6_000_000) String carPhotoUrl,
        @Size(max = 40) String carNumber,
        @Size(max = 120) String carModel,
        @Size(max = 80) String carColor,
        @Min(1) @Max(6) Integer seatsAvailable,
        @Min(0) BigDecimal distanceKm,
        @Min(0) BigDecimal pricePerKm,
        @Size(max = 2000) String providerNotes
) {
}
