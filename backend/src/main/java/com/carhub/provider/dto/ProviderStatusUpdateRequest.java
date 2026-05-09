package com.carhub.provider.dto;

import com.carhub.domain.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProviderStatusUpdateRequest(@NotNull RequestStatus status, @NotBlank String reason) {
}
