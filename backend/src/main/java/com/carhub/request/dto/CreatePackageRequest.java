package com.carhub.request.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePackageRequest(
        UUID packageId,
        @NotBlank String destination,
        @NotBlank String currentLocation,
        @Min(1) int travelersCount,
        @NotNull @FutureOrPresent LocalDate travelStartDate,
        @NotNull LocalDate travelEndDate,
        BigDecimal budgetMin,
        BigDecimal budgetMax,
        @NotBlank String tripType,
        String specialRequirements,
        @NotBlank String emergencyContactName,
        @NotBlank String emergencyContactMobile
) {
}
