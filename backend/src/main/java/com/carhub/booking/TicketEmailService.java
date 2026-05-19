package com.carhub.booking;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class TicketEmailService {
    private final JavaMailSender mailSender;
    private final TicketPdfService ticketPdfService;
    private final String fromAddress;

    public TicketEmailService(JavaMailSender mailSender, TicketPdfService ticketPdfService,
                              @Value("${spring.mail.username:}") String fromAddress) {
        this.mailSender = mailSender;
        this.ticketPdfService = ticketPdfService;
        this.fromAddress = fromAddress;
    }

    public void sendTicket(Ticket ticket) {
        if (ticket.getCustomer().getEmail() == null || ticket.getCustomer().getEmail().isBlank()
                || fromAddress == null || fromAddress.isBlank()) {
            return;
        }
        try {
            byte[] pdf = ticketPdfService.generate(ticket);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(ticket.getCustomer().getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("CarHub ticket " + ticket.getTicketNumber());
            helper.setText("""
                    Hello,

                    Your CarHub payment is confirmed and your travel ticket is attached as a PDF.

                    Ticket: %s
                    Package: %s
                    Pickup: %s on %s at %s

                    Please keep this PDF available during pickup.

                    Thank you,
                    CarHub
                    """.formatted(
                    ticket.getTicketNumber(),
                    ticket.getTravelPackage().getTitle(),
                    ticket.getPickupLocation() == null ? "Pickup point" : ticket.getPickupLocation(),
                    ticket.getPickupDate() == null ? "scheduled date" : ticket.getPickupDate(),
                    ticket.getPickupTime() == null ? "scheduled time" : ticket.getPickupTime()
            ));
            helper.addAttachment("carhub-ticket-" + ticket.getTicketNumber() + ".pdf", new ByteArrayResource(pdf));
            mailSender.send(message);
        } catch (Exception ignored) {
            // Booking should not fail if SMTP is unavailable.
        }
    }
}
