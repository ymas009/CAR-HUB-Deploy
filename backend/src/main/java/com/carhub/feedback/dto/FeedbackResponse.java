package com.carhub.feedback.dto;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(UUID id, UUID requestId, int packageRating, int supportRating, String moderationStatus, Instant createdAt) {
}
