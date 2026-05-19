package com.carhub.payment;

import com.carhub.common.BusinessRuleException;
import com.carhub.booking.TicketRepository;
import com.carhub.packagecatalog.TravelPackage;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.payment.dto.CreatePaymentOrderRequest;
import com.carhub.payment.dto.PaymentOrderResponse;
import com.carhub.payment.dto.VerifyPaymentRequest;
import com.carhub.payment.dto.VerifyPaymentResponse;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class PaymentService {
    private final RazorpayProperties properties;
    private final TravelPackageRepository travelPackageRepository;
    private final TicketRepository ticketRepository;

    public PaymentService(RazorpayProperties properties, TravelPackageRepository travelPackageRepository, TicketRepository ticketRepository) {
        this.properties = properties;
        this.travelPackageRepository = travelPackageRepository;
        this.ticketRepository = ticketRepository;
    }

    public PaymentOrderResponse createOrder(UUID customerId, CreatePaymentOrderRequest request) {
        if (properties.getKeyId() == null || properties.getKeyId().isBlank()
                || properties.getKeySecret() == null || properties.getKeySecret().isBlank()) {
            throw new BusinessRuleException("PAYMENT_CONFIG_MISSING", "Razorpay test keys are not configured for the running backend profile.");
        }
        TravelPackage travelPackage = travelPackageRepository.findByIdAndAvailabilityStatus(request.packageId(), "AVAILABLE")
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package is not available."));
        if (ticketRepository.existsByTravelPackageId(request.packageId())) {
            throw new BusinessRuleException("PACKAGE_ALREADY_BOOKED", "This package has already been booked.");
        }
        BigDecimal startingPrice = travelPackage.getStartingPrice();
        if (startingPrice == null || startingPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("PRICE_NOT_AVAILABLE", "Package price is not available for online payment.");
        }
        long amountInPaise = startingPrice.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
        try {
            RazorpayClient client = new RazorpayClient(properties.getKeyId(), properties.getKeySecret());
            JSONObject options = new JSONObject();
            options.put("amount", amountInPaise);
            options.put("currency", properties.getCurrency());
            options.put("receipt", "ch_" + travelPackage.getId().toString().replace("-", ""));
            options.put("payment_capture", 1);
            Order order = client.orders.create(options);
            return new PaymentOrderResponse(properties.getKeyId(), order.get("id"), amountInPaise, properties.getCurrency(), travelPackage.getTitle());
        } catch (Exception exception) {
            throw new BusinessRuleException("PAYMENT_ORDER_FAILED", "Payment order could not be created: " + exception.getMessage());
        }
    }

    public VerifyPaymentResponse verify(VerifyPaymentRequest request) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.razorpayOrderId());
            attributes.put("razorpay_payment_id", request.razorpayPaymentId());
            attributes.put("razorpay_signature", request.razorpaySignature());
            boolean verified = Utils.verifyPaymentSignature(attributes, properties.getKeySecret());
            if (!verified) {
                throw new BusinessRuleException("PAYMENT_VERIFICATION_FAILED", "Payment verification failed.");
            }
            return new VerifyPaymentResponse(true, request.razorpayPaymentId());
        } catch (BusinessRuleException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessRuleException("PAYMENT_VERIFICATION_FAILED", "Payment verification failed.");
        }
    }
}
