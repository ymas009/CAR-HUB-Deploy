package com.carhub.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank String mobile,
        @Size(min = 8) String password,
        String accountType,
        String city,
        String state,
        String country,
        String address,
        String pinCode,
        String latitude,
        String longitude,
        String rcNumber,
        String rcDocumentImage,
        String preferredTravelType,
        String emergencyContactName,
        String emergencyContactMobile,
        @AssertTrue boolean consentTerms,
        @AssertTrue boolean consentPrivacy,
        @AssertTrue boolean consentControlledDataSharing
) {
}
