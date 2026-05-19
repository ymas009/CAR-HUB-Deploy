package com.carhub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminIdNewOtpRequest(
        @NotBlank @Email String currentAdminId,
        @NotBlank @Email String newAdminId
) {
}
