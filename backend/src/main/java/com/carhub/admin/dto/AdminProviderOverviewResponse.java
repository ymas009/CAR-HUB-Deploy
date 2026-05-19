package com.carhub.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AdminProviderOverviewResponse(
        UUID id,
        UUID userId,
        String businessName,
        String contactPerson,
        String email,
        String mobile,
        String businessAddress,
        String pinCode,
        String serviceLocations,
        String categories,
        String rcNumber,
        boolean rcDocumentUploaded,
        String verificationStatus,
        boolean suspended,
        BigDecimal qualityScore,
        int complaintCount,
        LocalDate documentExpiryDate,
        long packageCount,
        long bookingCount,
        Instant createdAt,
        Instant updatedAt
) {
}
