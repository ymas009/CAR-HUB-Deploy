package com.carhub.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
        @NotBlank String identity,
        @NotBlank String otp,
        @NotBlank String newPassword
) {
}
