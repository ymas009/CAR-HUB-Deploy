package com.carhub.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record FeedbackModerationRequest(
        @NotBlank @Pattern(regexp = "APPROVED|REJECTED|PENDING") String moderationStatus
) {
}
