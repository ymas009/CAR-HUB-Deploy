package com.carhub.booking;

import com.carhub.booking.dto.TicketDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tickets")
public class AdminTicketController {
    private final BookingService bookingService;

    public AdminTicketController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    List<TicketDTO> list() {
        return bookingService.adminTickets();
    }

    @GetMapping("/{ticketId}")
    TicketDTO get(@PathVariable UUID ticketId) {
        return bookingService.adminTicket(ticketId);
    }
}
