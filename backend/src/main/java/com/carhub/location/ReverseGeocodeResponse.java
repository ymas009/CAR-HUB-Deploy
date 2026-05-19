package com.carhub.location;

public record ReverseGeocodeResponse(
        String displayName,
        String area,
        String city,
        String state,
        String pinCode,
        String latitude,
        String longitude
) {
}
