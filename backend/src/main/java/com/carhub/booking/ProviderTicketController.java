package com.carhub.booking;

import com.carhub.booking.dto.ProviderTicketDTO;
import com.carhub.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
