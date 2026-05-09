package com.carhub.support.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record SupportTicketRequest(
        UUID requestId,
        @NotBlank String category,
        @NotBlank String priority,
        @NotBlank String subject,
        @NotBlank String description
) {
}
