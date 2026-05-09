package com.carhub.user.dto;

public record CustomerProfileRequest(
        String city,
        String state,
        String country,
        String preferredTravelType,
        String emergencyContactName,
        String emergencyContactMobile
) {
}
