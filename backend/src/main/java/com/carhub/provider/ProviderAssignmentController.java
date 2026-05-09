package com.carhub.provider;

import com.carhub.provider.dto.ProviderAssignmentResponse;
import com.carhub.provider.dto.ProviderStatusUpdateRequest;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/provider/assignments")
public class ProviderAssignmentController {
    private final ProviderAssignmentService providerAssignmentService;
    private final CurrentUser currentUser;

    public ProviderAssignmentController(ProviderAssignmentService providerAssignmentService, CurrentUser currentUser) {
        this.providerAssignmentService = providerAssignmentService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<ProviderAssignmentResponse> assignedWorkOnly() {
        return providerAssignmentService.assignmentsForProvider(currentUser.require().id());
    }

    @PostMapping("/{assignmentId}/status")
    ProviderAssignmentResponse updateStatus(@PathVariable UUID assignmentId,
                                            @Valid @RequestBody ProviderStatusUpdateRequest request) {
        return providerAssignmentService.updateStatus(currentUser.require().id(), assignmentId, request);
    }
}
