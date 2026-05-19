package com.carhub.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record TravellerDTO(
        @NotBlank String fullName,
        @Min(1) int age,
        @NotBlank String gender
) {
}
