package com.carhub.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record LocationUpdateRequest(
        @NotBlank String latitude,
        @NotBlank String longitude
) {
}
