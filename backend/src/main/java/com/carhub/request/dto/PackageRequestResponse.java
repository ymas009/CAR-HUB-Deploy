package com.carhub.request.dto;

import com.carhub.domain.RequestStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PackageRequestResponse(
        UUID id,
        RequestStatus status,
        String destination,
        int travelersCount,
        LocalDate travelStartDate,
        LocalDate travelEndDate,
        String tripType,
        Instant createdAt
) {
}
