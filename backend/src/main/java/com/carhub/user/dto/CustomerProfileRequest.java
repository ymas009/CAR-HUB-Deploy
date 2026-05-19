package com.carhub.user.dto;

public record CustomerProfileRequest(
        String city,
        String state,
        String country,
        String address,
        String pinCode,
        String latitude,
        String longitude,
        String preferredTravelType,
        String emergencyContactName,
        String emergencyContactMobile
) {
}
