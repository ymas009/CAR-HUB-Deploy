package com.carhub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordChangeConfirmRequest(
        @NotBlank @Email String email,
        @NotBlank String otp,
        @NotBlank String newPassword
) {
}
