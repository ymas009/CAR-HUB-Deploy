package com.carhub.support;

import com.carhub.audit.AuditService;
import com.carhub.support.dto.SupportTicketRequest;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SupportTicketServiceTest {
    @Test
    void emergencyTicketGetsShortSla() {
        SupportTicketRepository tickets = mock(SupportTicketRepository.class);
        AppUserRepository users = mock(AppUserRepository.class);
        AppUser customer = new AppUser();
        customer.setId(UUID.randomUUID());
        when(users.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(tickets.save(any(SupportTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupportTicketService service = new SupportTicketService(tickets, mock(com.carhub.request.PackageRequestRepository.class), users, mock(AuditService.class));
        var response = service.create(customer.getId(), new SupportTicketRequest(null, "MEDICAL_EMERGENCY", "EMERGENCY", "Need help", "Urgent"));

        assertEquals("EMERGENCY", response.priority());
    }
}
