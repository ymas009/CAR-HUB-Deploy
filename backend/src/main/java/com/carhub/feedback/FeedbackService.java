package com.carhub.feedback;

import com.carhub.audit.AuditService;
import com.carhub.booking.Ticket;
import com.carhub.booking.TicketRepository;
import com.carhub.booking.TicketStatus;
import com.carhub.common.BusinessRuleException;
import com.carhub.domain.RequestStatus;
import com.carhub.feedback.dto.FeedbackRequest;
import com.carhub.feedback.dto.FeedbackResponse;
import com.carhub.request.PackageRequest;
import com.carhub.request.PackageRequestRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;
    private final PackageRequestRepository packageRequestRepository;
    private final TicketRepository ticketRepository;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    public FeedbackService(FeedbackRepository feedbackRepository, PackageRequestRepository packageRequestRepository,
                           TicketRepository ticketRepository, AppUserRepository appUserRepository, AuditService auditService) {
        this.feedbackRepository = feedbackRepository;
        this.packageRequestRepository = packageRequestRepository;
        this.ticketRepository = ticketRepository;
        this.appUserRepository = appUserRepository;
        this.auditService = auditService;
    }

    @Transactional
    public FeedbackResponse create(UUID customerId, FeedbackRequest request) {
        AppUser customer = appUserRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("CUSTOMER_NOT_FOUND", "Customer not found."));
        Feedback feedback = new Feedback();
        feedback.setCustomer(customer);
        if (request.ticketId() != null) {
            Ticket ticket = ticketRepository.findByIdAndCustomerId(request.ticketId(), customerId)
                    .orElseThrow(() -> new BusinessRuleException("TICKET_NOT_FOUND", "Ticket not found."));
            if (ticket.getStatus() != TicketStatus.COMPLETED) {
                throw new BusinessRuleException("FEEDBACK_NOT_ALLOWED", "Feedback is allowed only after journey completion.");
            }
            if (feedbackRepository.existsByTicketIdAndCustomerId(request.ticketId(), customerId)) {
                throw new BusinessRuleException("FEEDBACK_ALREADY_SUBMITTED", "Feedback already submitted for this journey.");
            }
            feedback.setTicket(ticket);
        } else if (request.requestId() != null) {
            PackageRequest packageRequest = packageRequestRepository.findById(request.requestId())
                    .orElseThrow(() -> new BusinessRuleException("REQUEST_NOT_FOUND", "Request not found."));
            if (!packageRequest.getCustomer().getId().equals(customerId)) {
                throw new BusinessRuleException("REQUEST_NOT_VISIBLE", "Customer can provide feedback only for owned requests.");
            }
            if (packageRequest.getStatus() != RequestStatus.COMPLETED) {
                throw new BusinessRuleException("FEEDBACK_NOT_ALLOWED", "Feedback is allowed only after trip completion.");
            }
            if (feedbackRepository.existsByRequestIdAndCustomerId(request.requestId(), customerId)) {
                throw new BusinessRuleException("FEEDBACK_ALREADY_SUBMITTED", "Feedback already submitted for this request.");
            }
            feedback.setRequest(packageRequest);
        } else {
            throw new BusinessRuleException("FEEDBACK_TARGET_REQUIRED", "Feedback must reference a completed journey.");
        }
        feedback.setPackageRating(request.packageRating());
        feedback.setProviderRating(request.providerRating());
        feedback.setSupportRating(request.supportRating());
        feedback.setComment(request.comment());
        Feedback saved = feedbackRepository.save(feedback);
        auditService.recordAccessDecision(customerId, "CUSTOMER", "FEEDBACK_SUBMITTED", saved.getId(), "Moderation pending");
        return toResponse(saved);
    }

    public List<FeedbackResponse> all() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public FeedbackResponse moderate(UUID adminId, UUID feedbackId, String moderationStatus) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new BusinessRuleException("FEEDBACK_NOT_FOUND", "Feedback not found."));
        feedback.setModerationStatus(moderationStatus);
        Feedback saved = feedbackRepository.save(feedback);
        auditService.recordAccessDecision(adminId, "ADMIN", "FEEDBACK_MODERATED", saved.getId(), moderationStatus);
        return toResponse(saved);
    }

    public List<FeedbackResponse> approved() {
        return feedbackRepository.findByModerationStatusOrderByCreatedAtDesc("APPROVED").stream().map(this::toResponse).toList();
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        return new FeedbackResponse(feedback.getId(),
                feedback.getRequest() == null ? null : feedback.getRequest().getId(),
                feedback.getTicket() == null ? null : feedback.getTicket().getId(),
                feedback.getPackageRating(), feedback.getProviderRating(), feedback.getSupportRating(), feedback.getComment(),
                feedback.getModerationStatus(), feedback.getCreatedAt());
    }
}
