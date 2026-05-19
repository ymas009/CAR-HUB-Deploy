package com.carhub.payment;

import com.carhub.payment.dto.CreatePaymentOrderRequest;
import com.carhub.payment.dto.PaymentOrderResponse;
import com.carhub.payment.dto.VerifyPaymentRequest;
import com.carhub.payment.dto.VerifyPaymentResponse;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {
    private final PaymentService paymentService;
    private final CurrentUser currentUser;

    public PaymentController(PaymentService paymentService, CurrentUser currentUser) {
        this.paymentService = paymentService;
        this.currentUser = currentUser;
    }

    @PostMapping("/api/v1/payments/create-order")
    PaymentOrderResponse createOrder(@Valid @RequestBody CreatePaymentOrderRequest request) {
        return paymentService.createOrder(currentUser.require().id(), request);
    }

    @PostMapping("/api/v1/payments/verify")
    VerifyPaymentResponse verify(@Valid @RequestBody VerifyPaymentRequest request) {
        return paymentService.verify(request);
    }
}
