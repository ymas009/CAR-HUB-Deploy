package com.carhub.user.dto;

public record CustomerProfileResponse(
        String city,
        String state,
        String country,
        String address,
        String pinCode,
        String latitude,
        String longitude,
        String preferredTravelType,
        String emergencyContactName,
        String emergencyContactMobile,
        boolean profileCompleted
) {
}
