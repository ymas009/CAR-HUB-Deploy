package com.carhub.payment.dto;

public record PaymentOrderResponse(
        String keyId,
        String orderId,
        long amount,
        String currency,
        String packageName
) {
}
