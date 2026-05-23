package com.carhub.feedback.dto;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(UUID id, UUID requestId, UUID ticketId, int packageRating, int providerRating,
                               int supportRating, String comment, String moderationStatus, Instant createdAt) {
}
