package com.carhub.packagecatalog.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TravelPackageResponse(
        UUID id,
        String slug,
        String title,
        String destination,
        String category,
        String summary,
        String description,
        BigDecimal startingPrice,
        BigDecimal distanceKm,
        BigDecimal pricePerKm,
        BigDecimal providerPayout,
        String currency,
        int durationDays,
        String imageUrl,
        String videoUrl,
        String carPhotoUrl,
        String localPlaces,
        String carType,
        String licenseNumber,
        String licenseHolderName,
        String licenseDetails,
        String licenseDocumentUrl,
        String carNumber,
        String carModel,
        String carColor,
        Integer seatsAvailable,
        String providerNotes,
        String pickupAvailabilityMode,
        String pickupStartTime,
        String pickupEndTime,
        boolean featured,
        String availabilityStatus,
        String providerBusinessName,
        String reviewNotes,
        String rcNumber,
        String rcDocumentUrl,
        UUID repostedFromId,
        long providerCompletedCount
) {
}
