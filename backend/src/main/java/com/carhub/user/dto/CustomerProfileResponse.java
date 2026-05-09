package com.carhub.user.dto;

public record CustomerProfileResponse(
        String city,
        String state,
        String country,
        String preferredTravelType,
        String emergencyContactName,
        String emergencyContactMobile,
        boolean profileCompleted
) {
}
