package com.carhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AdminCustomerUpdateRequest(
        @NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED|BLOCKED") String status
) {
}
