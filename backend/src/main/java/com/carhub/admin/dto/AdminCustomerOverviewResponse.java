package com.carhub.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminCustomerOverviewResponse(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        String mobile,
        String status,
        String address,
        String city,
        String state,
        String country,
        String pinCode,
        String preferredTravelType,
        String emergencyContactName,
        String emergencyContactMobile,
        boolean profileCompleted,
        long bookingCount,
        Instant createdAt,
        Instant updatedAt
) {
}
