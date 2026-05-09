package com.carhub.admin.dto;

import com.carhub.domain.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminReviewRequest(
        @NotNull RequestStatus decision,
        @NotBlank String reason,
        String adminNotes
) {
}
