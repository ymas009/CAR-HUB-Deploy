package com.carhub.packagecatalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProviderPackageSubmissionRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 180) String destination,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 500) String summary,
        @NotBlank @Size(max = 4000) String description,
        @NotNull @DecimalMin("1.00") BigDecimal startingPrice,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @Min(1) @Max(60) int durationDays,
        @Size(max = 1000) String imageUrl
) {
}
