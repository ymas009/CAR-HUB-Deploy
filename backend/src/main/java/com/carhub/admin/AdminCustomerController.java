package com.carhub.admin;

import com.carhub.admin.dto.AdminCustomerOverviewResponse;
import com.carhub.admin.dto.AdminCustomerUpdateRequest;
import com.carhub.booking.TicketRepository;
import com.carhub.common.BusinessRuleException;
import com.carhub.user.CustomerProfile;
import com.carhub.user.CustomerProfileRepository;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/customers")
public class AdminCustomerController {
    private final CustomerProfileRepository customerProfileRepository;
    private final TicketRepository ticketRepository;

    public AdminCustomerController(CustomerProfileRepository customerProfileRepository, TicketRepository ticketRepository) {
        this.customerProfileRepository = customerProfileRepository;
        this.ticketRepository = ticketRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    List<AdminCustomerOverviewResponse> list() {
        return customerProfileRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @PutMapping("/{customerId}")
    @Transactional
    AdminCustomerOverviewResponse update(@PathVariable UUID customerId, @Valid @RequestBody AdminCustomerUpdateRequest request) {
        CustomerProfile customer = customerProfileRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("CUSTOMER_NOT_FOUND", "Customer profile was not found."));
        customer.getUser().setStatus(request.status());
        customer.getUser().touch();
        customer.touch();
        return toResponse(customerProfileRepository.save(customer));
    }

    private AdminCustomerOverviewResponse toResponse(CustomerProfile customer) {
        return new AdminCustomerOverviewResponse(customer.getId(), customer.getUser().getId(),
                customer.getUser().getFullName(), customer.getUser().getEmail(), customer.getUser().getMobile(),
                customer.getUser().getStatus(), customer.getAddress(), customer.getCity(), customer.getState(),
                customer.getCountry(), customer.getPinCode(), customer.getPreferredTravelType(),
                customer.getEmergencyContactName(), customer.getEmergencyContactMobile(), customer.isProfileCompleted(),
                ticketRepository.countByCustomerId(customer.getUser().getId()), customer.getCreatedAt(), customer.getUpdatedAt());
    }
}
