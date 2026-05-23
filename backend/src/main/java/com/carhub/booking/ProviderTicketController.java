package com.carhub.booking;

import com.carhub.booking.dto.ProviderTicketDTO;
import com.carhub.booking.dto.CompletionOtpResponse;
import com.carhub.booking.dto.LocationUpdateRequest;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/provider/tickets")
public class ProviderTicketController {
    private final BookingService bookingService;
    private final CurrentUser currentUser;

    public ProviderTicketController(BookingService bookingService, CurrentUser currentUser) {
        this.bookingService = bookingService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<ProviderTicketDTO> mine() {
        return bookingService.providerTickets(currentUser.require().id());
    }

    @PostMapping("/{ticketId}/start")
    ProviderTicketDTO start(@PathVariable UUID ticketId) {
        return bookingService.startJourney(currentUser.require().id(), ticketId);
    }

    @PostMapping("/{ticketId}/location")
    ProviderTicketDTO location(@PathVariable UUID ticketId, @Valid @RequestBody LocationUpdateRequest request) {
        return bookingService.updateProviderLocation(currentUser.require().id(), ticketId, request);
    }

    @PostMapping("/{ticketId}/completion-otp")
    CompletionOtpResponse completionOtp(@PathVariable UUID ticketId) {
        return bookingService.requestCompletionOtp(currentUser.require().id(), ticketId);
    }
}
