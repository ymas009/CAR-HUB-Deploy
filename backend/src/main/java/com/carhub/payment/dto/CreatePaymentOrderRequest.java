package com.carhub.payment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreatePaymentOrderRequest(@NotNull UUID packageId) {
}
