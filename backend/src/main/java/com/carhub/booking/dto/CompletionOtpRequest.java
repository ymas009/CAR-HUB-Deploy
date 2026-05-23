package com.carhub.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record CompletionOtpRequest(@NotBlank String otp) {
}
