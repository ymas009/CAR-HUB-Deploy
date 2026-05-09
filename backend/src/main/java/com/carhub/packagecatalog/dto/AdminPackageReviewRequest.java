package com.carhub.packagecatalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminPackageReviewRequest(
        @NotBlank @Pattern(regexp = "APPROVED|REJECTED|NEEDS_CHANGES") String decision,
        @Size(max = 1000) String reviewNotes,
        boolean featured
) {
}
