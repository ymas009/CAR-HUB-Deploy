package com.carhub.booking;

import com.carhub.booking.dto.BookingRequestDTO;
import com.carhub.booking.dto.CompletionOtpRequest;
import com.carhub.booking.dto.TicketDTO;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class BookingController {
    private final BookingService bookingService;
    private final TicketPdfService ticketPdfService;
    private final TicketRepository ticketRepository;
    private final CurrentUser currentUser;

    public BookingController(BookingService bookingService, TicketPdfService ticketPdfService,
                             TicketRepository ticketRepository, CurrentUser currentUser) {
        this.bookingService = bookingService;
        this.ticketPdfService = ticketPdfService;
        this.ticketRepository = ticketRepository;
        this.currentUser = currentUser;
    }

    @PostMapping("/api/v1/bookings/submit")
    TicketDTO submit(@Valid @RequestBody BookingRequestDTO request) {
        return bookingService.createBooking(currentUser.require().id(), request);
    }

    @GetMapping("/api/v1/tickets")
    List<TicketDTO> mine() {
        return bookingService.customerTickets(currentUser.require().id());
    }

    @GetMapping("/api/v1/tickets/{ticketId}")
    TicketDTO get(@PathVariable UUID ticketId) {
        return bookingService.customerTicket(currentUser.require().id(), ticketId);
    }

    @PostMapping("/api/v1/tickets/{ticketId}/verify-completion")
    TicketDTO verifyCompletion(@PathVariable UUID ticketId, @Valid @RequestBody CompletionOtpRequest request) {
        return bookingService.verifyCompletionOtp(currentUser.require().id(), ticketId, request.otp());
    }

    @GetMapping("/api/v1/tickets/{ticketId}/pdf")
    @Transactional(readOnly = true)
    ResponseEntity<byte[]> pdf(@PathVariable UUID ticketId) {
        UUID customerId = currentUser.require().id();
        Ticket ticket = ticketRepository.findByIdAndCustomerId(ticketId, customerId)
                .orElseThrow(() -> new com.carhub.common.BusinessRuleException("TICKET_NOT_FOUND", "Ticket not found."));
        byte[] pdf = ticketPdfService.generate(ticket);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"carhub-ticket-" + ticket.getTicketNumber() + ".pdf\"")
                .body(pdf);
    }
}
