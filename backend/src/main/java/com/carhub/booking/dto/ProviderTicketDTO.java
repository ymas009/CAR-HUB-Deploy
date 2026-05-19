package com.carhub.booking.dto;

import com.carhub.booking.CarType;
import com.carhub.booking.TicketStatus;

import java.time.Instant;
import java.util.UUID;

public record ProviderTicketDTO(
        UUID id,
        String ticketNumber,
        String packageName,
        String destination,
        String route,
        int travellersCount,
        CarType carType,
        String carPhotoUrl,
        String carNumber,
        String carModel,
        String carColor,
        String specialRequests,
        String pickupLocation,
        String pickupDate,
        String pickupTime,
        String maskedCustomerRef,
        TicketStatus status,
        Instant createdAt
) {
}
