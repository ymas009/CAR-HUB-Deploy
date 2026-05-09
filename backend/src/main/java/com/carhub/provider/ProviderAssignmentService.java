package com.carhub.provider;

import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.domain.RequestStatus;
import com.carhub.provider.dto.ProviderAssignmentResponse;
import com.carhub.provider.dto.ProviderStatusUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProviderAssignmentService {
    private final ProviderAssignmentRepository providerAssignmentRepository;
    private final ProviderSharedPayloadRepository providerSharedPayloadRepository;
    private final AuditService auditService;

    public ProviderAssignmentService(ProviderAssignmentRepository providerAssignmentRepository,
                                     ProviderSharedPayloadRepository providerSharedPayloadRepository,
                                     AuditService auditService) {
        this.providerAssignmentRepository = providerAssignmentRepository;
        this.providerSharedPayloadRepository = providerSharedPayloadRepository;
        this.auditService = auditService;
    }

    public List<ProviderAssignmentResponse> assignmentsForProvider(UUID providerUserId) {
        return providerAssignmentRepository.findByProvider_User_IdAndRevokedAtIsNullOrderByAssignedAtDesc(providerUserId).stream()
                .filter(this::isActive)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProviderAssignmentResponse updateStatus(UUID providerUserId, UUID assignmentId, ProviderStatusUpdateRequest request) {
        ProviderAssignment assignment = providerAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new BusinessRuleException("ASSIGNMENT_NOT_FOUND", "Assignment not found."));
        if (!assignment.getProvider().getUser().getId().equals(providerUserId)) {
            throw new BusinessRuleException("ASSIGNMENT_NOT_VISIBLE", "Provider can update only assigned work.");
        }
        if (!isActive(assignment)) {
            throw new BusinessRuleException("ASSIGNMENT_ACCESS_EXPIRED", "Assignment access is expired or revoked.");
        }
        RequestStatus previous = assignment.getStatus();
        if (request.status() != RequestStatus.ACCEPTED_BY_PROVIDER
                && request.status() != RequestStatus.IN_PROGRESS
                && request.status() != RequestStatus.COMPLETED
                && request.status() != RequestStatus.SUPPORT_ESCALATION) {
            throw new BusinessRuleException("INVALID_PROVIDER_STATUS", "Provider can only update execution statuses.");
        }
        assignment.setStatus(request.status());
        providerAssignmentRepository.save(assignment);
        auditService.recordWorkflowTransition(providerUserId, "PROVIDER", "PROVIDER_ASSIGNMENT", assignmentId,
                previous, request.status(), request.reason());
        return toResponse(assignment);
    }

    private boolean isActive(ProviderAssignment assignment) {
        return assignment.getRevokedAt() == null
                && (assignment.getAccessExpiresAt() == null || assignment.getAccessExpiresAt().isAfter(Instant.now()));
    }

    private ProviderAssignmentResponse toResponse(ProviderAssignment assignment) {
        ProviderSharedPayload payload = providerSharedPayloadRepository.findByAssignmentIdAndRevokedAtIsNull(assignment.getId())
                .orElseThrow(() -> new BusinessRuleException("PROVIDER_PAYLOAD_NOT_FOUND", "Provider payload is not available."));
        if (payload.getExpiresAt() != null && payload.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessRuleException("PROVIDER_PAYLOAD_EXPIRED", "Provider payload access is expired.");
        }
        return new ProviderAssignmentResponse(assignment.getId(), assignment.getStatus(), payload.getVisibleFields(),
                payload.getMaskedPayload(), payload.getExpiresAt(),
                "Provider sees assigned, approved, masked payload only. Raw customer request data is never exposed.");
    }
}
