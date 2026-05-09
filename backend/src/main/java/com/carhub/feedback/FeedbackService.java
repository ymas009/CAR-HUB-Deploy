package com.carhub.feedback;

import com.carhub.audit.AuditService;
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
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    public FeedbackService(FeedbackRepository feedbackRepository, PackageRequestRepository packageRequestRepository,
                           AppUserRepository appUserRepository, AuditService auditService) {
        this.feedbackRepository = feedbackRepository;
        this.packageRequestRepository = packageRequestRepository;
        this.appUserRepository = appUserRepository;
        this.auditService = auditService;
    }

    @Transactional
    public FeedbackResponse create(UUID customerId, FeedbackRequest request) {
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
        AppUser customer = appUserRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("CUSTOMER_NOT_FOUND", "Customer not found."));
        Feedback feedback = new Feedback();
        feedback.setCustomer(customer);
        feedback.setRequest(packageRequest);
        feedback.setPackageRating(request.packageRating());
        feedback.setSupportRating(request.supportRating());
        feedback.setComment(request.comment());
        Feedback saved = feedbackRepository.save(feedback);
        auditService.recordAccessDecision(customerId, "CUSTOMER", "FEEDBACK_SUBMITTED", saved.getId(), "Moderation pending");
        return toResponse(saved);
    }

    public List<FeedbackResponse> all() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        return new FeedbackResponse(feedback.getId(), feedback.getRequest().getId(), feedback.getPackageRating(),
                feedback.getSupportRating(), feedback.getModerationStatus(), feedback.getCreatedAt());
    }
}
