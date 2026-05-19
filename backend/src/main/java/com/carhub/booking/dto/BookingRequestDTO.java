package com.carhub.booking.dto;

import com.carhub.booking.CarType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BookingRequestDTO(
        @NotNull UUID packageId,
        @Min(1) @Max(6) int travellersCount,
        @NotNull CarType carType,
        @Valid List<TravellerDTO> travellers,
        String specialRequests,
        @NotBlank String pickupLocation,
        @NotNull LocalDate pickupDate,
        @NotBlank String pickupTime,
        @NotBlank String paymentReference
) {
}
