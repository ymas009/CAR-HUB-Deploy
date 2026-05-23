package com.carhub.feedback.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FeedbackRequest(
        UUID requestId,
        UUID ticketId,
        @Min(1) @Max(5) int packageRating,
        @Min(1) @Max(5) int providerRating,
        @Min(1) @Max(5) int supportRating,
        String comment
) {
}
