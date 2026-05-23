package com.carhub.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(@NotBlank String credential, @NotBlank String accountType) {
}
