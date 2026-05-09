package com.carhub.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContentPageUpdateRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 500) String summary,
        @NotBlank @Size(max = 6000) String body,
        @Size(max = 180) String contactEmail,
        @Size(max = 60) String contactPhone,
        @Size(max = 160) String supportHours,
        boolean published
) {
}
