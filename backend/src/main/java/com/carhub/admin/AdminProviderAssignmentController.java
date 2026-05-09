package com.carhub.admin;

import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.provider.ProviderAssignment;
import com.carhub.provider.ProviderAssignmentRepository;
import com.carhub.security.CurrentUser;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/provider-assignments")
public class AdminProviderAssignmentController {
    private final ProviderAssignmentRepository providerAssignmentRepository;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;
    private final CurrentUser currentUser;

    public AdminProviderAssignmentController(ProviderAssignmentRepository providerAssignmentRepository,
                                             AppUserRepository appUserRepository,
                                             AuditService auditService,
                                             CurrentUser currentUser) {
        this.providerAssignmentRepository = providerAssignmentRepository;
        this.appUserRepository = appUserRepository;
        this.auditService = auditService;
        this.currentUser = currentUser;
    }

    @PostMapping("/{assignmentId}/revoke")
    Map<String, Boolean> revoke(@PathVariable UUID assignmentId) {
        AppUser actor = appUserRepository.findById(currentUser.require().id())
                .orElseThrow(() -> new BusinessRuleException("ADMIN_NOT_FOUND", "Admin not found."));
        ProviderAssignment assignment = providerAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new BusinessRuleException("ASSIGNMENT_NOT_FOUND", "Assignment not found."));
        assignment.revoke(actor);
        providerAssignmentRepository.save(assignment);
        auditService.recordAccessDecision(actor.getId(), "ADMIN", "PROVIDER_ASSIGNMENT_REVOKED", assignmentId,
                "Admin revoked provider access");
        return Map.of("revoked", true);
    }
}
