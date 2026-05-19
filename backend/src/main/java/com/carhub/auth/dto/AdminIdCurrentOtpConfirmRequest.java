package com.carhub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminIdCurrentOtpConfirmRequest(
        @NotBlank @Email String currentAdminId,
        @NotBlank String otp
) {
}
