package com.carhub.packagecatalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProviderPackageSubmissionRequest(
        @NotBlank @Size(max = 180) String destination,
        @NotBlank @Size(max = 2000) String localPlaces,
        @NotBlank @Size(max = 20) String carType,
        @NotBlank @Size(max = 20) String pickupAvailabilityMode,
        @Size(max = 5) String pickupStartTime,
        @Size(max = 5) String pickupEndTime,
        @Size(max = 6_000_000) String carPhotoUrl,
        @Min(1) @Max(6) Integer seatsAvailable,
        @NotBlank @Size(max = 40) String carNumber,
        @NotBlank @Size(max = 120) String carModel,
        @NotBlank @Size(max = 80) String licenseNumber,
        @Size(max = 160) String licenseHolderName,
        @Size(max = 6_000_000) String licenseDocumentUrl,
        @DecimalMin(value = "0.01", message = "Price per km must be greater than zero.") BigDecimal pricePerKm,
        @Size(max = 60) String rcNumber,
        @Size(max = 6_000_000) String rcDocumentUrl
) {
}
