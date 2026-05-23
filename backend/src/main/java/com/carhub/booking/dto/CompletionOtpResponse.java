package com.carhub.booking.dto;

import java.time.Instant;

public record CompletionOtpResponse(boolean generated, Instant expiresAt, String message, String otp) {
}
