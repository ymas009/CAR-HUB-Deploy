package com.carhub.payment.dto;

public record VerifyPaymentResponse(boolean verified, String paymentReference) {
}
