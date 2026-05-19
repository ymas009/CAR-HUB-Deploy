package com.carhub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegistrationConfirmRequest(
        @Email @NotBlank String email,
        @NotBlank String otp
) {
}
