package com.carhub.support;

import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.request.PackageRequest;
import com.carhub.request.PackageRequestRepository;
import com.carhub.support.dto.SupportTicketRequest;
import com.carhub.support.dto.SupportTicketResponse;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SupportTicketService {
    private final SupportTicketRepository supportTicketRepository;
    private final PackageRequestRepository packageRequestRepository;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    public SupportTicketService(SupportTicketRepository supportTicketRepository, PackageRequestRepository packageRequestRepository,
                                AppUserRepository appUserRepository, AuditService auditService) {
        this.supportTicketRepository = supportTicketRepository;
        this.packageRequestRepository = packageRequestRepository;
        this.appUserRepository = appUserRepository;
        this.auditService = auditService;
    }

    @Transactional
    public SupportTicketResponse create(UUID customerId, SupportTicketRequest request) {
        AppUser customer = appUserRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("CUSTOMER_NOT_FOUND", "Customer not found."));
        PackageRequest packageRequest = null;
        if (request.requestId() != null) {
            packageRequest = packageRequestRepository.findById(request.requestId())
                    .orElseThrow(() -> new BusinessRuleException("REQUEST_NOT_FOUND", "Request not found."));
            if (!packageRequest.getCustomer().getId().equals(customerId)) {
                throw new BusinessRuleException("REQUEST_NOT_VISIBLE", "Customer can create support only for owned requests.");
            }
        }
        SupportTicket ticket = new SupportTicket();
        ticket.setCustomer(customer);
        ticket.setRequest(packageRequest);
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setSubject(request.subject());
        ticket.setDescription(request.description());
        ticket.setSlaDueAt(Instant.now().plusSeconds("EMERGENCY".equalsIgnoreCase(request.priority()) ? 1800 : 86400));
        SupportTicket saved = supportTicketRepository.save(ticket);
        auditService.recordAccessDecision(customerId, "CUSTOMER", "SUPPORT_TICKET_CREATED", saved.getId(), request.category());
        return toResponse(saved);
    }

    public List<SupportTicketResponse> mine(UUID customerId) {
        return supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream().map(this::toResponse).toList();
    }

    public List<SupportTicketResponse> all() {
        return supportTicketRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        return new SupportTicketResponse(ticket.getId(), ticket.getCategory(), ticket.getPriority(), ticket.getStatus(),
                ticket.getSubject(), ticket.getSlaDueAt(), ticket.getCreatedAt());
    }
}
