package com.carhub.provider.dto;

import java.util.UUID;

public record ProviderProfileResponse(UUID id, String businessName, String contactPerson, String verificationStatus, boolean suspended) {
}
