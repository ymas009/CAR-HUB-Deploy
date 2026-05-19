package com.carhub.admin.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record AdminProviderUpdateRequest(
        @NotBlank @Pattern(regexp = "APPROVED|PENDING|REJECTED|NEEDS_REVIEW") String verificationStatus,
        boolean suspended,
        @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal qualityScore
) {
}
