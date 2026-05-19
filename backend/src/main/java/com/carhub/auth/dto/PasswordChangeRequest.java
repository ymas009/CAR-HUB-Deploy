package com.carhub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequest(
        @NotBlank @Email String email,
        @NotBlank String currentPassword,
        @NotBlank String newPassword
) {
}
