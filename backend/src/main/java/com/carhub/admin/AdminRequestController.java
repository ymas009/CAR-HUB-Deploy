package com.carhub.admin;

import com.carhub.admin.dto.AdminReviewRequest;
import com.carhub.admin.dto.ProviderShareRequest;
import com.carhub.request.PackageRequestService;
import com.carhub.request.dto.PackageRequestResponse;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/requests")
public class AdminRequestController {
    private final PackageRequestService packageRequestService;
    private final CurrentUser currentUser;

    public AdminRequestController(PackageRequestService packageRequestService, CurrentUser currentUser) {
        this.packageRequestService = packageRequestService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<PackageRequestResponse> list() {
        return packageRequestService.adminRequests();
    }

    @PostMapping("/{requestId}/review")
    PackageRequestResponse review(@PathVariable UUID requestId, @Valid @RequestBody AdminReviewRequest request) {
        return packageRequestService.adminReview(currentUser.require().id(), requestId, request);
    }

    @PostMapping("/{requestId}/provider-share")
    Map<String, UUID> shareWithProvider(@PathVariable UUID requestId, @Valid @RequestBody ProviderShareRequest request) {
        UUID assignmentId = packageRequestService.approveAndShareWithProvider(currentUser.require().id(), requestId, request);
        return Map.of("assignmentId", assignmentId);
    }
}
