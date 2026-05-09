package com.carhub.request;

import com.carhub.request.dto.CreatePackageRequest;
import com.carhub.request.dto.PackageRequestResponse;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer/requests")
public class PackageRequestController {
    private final PackageRequestService packageRequestService;
    private final CurrentUser currentUser;

    public PackageRequestController(PackageRequestService packageRequestService, CurrentUser currentUser) {
        this.packageRequestService = packageRequestService;
        this.currentUser = currentUser;
    }

    @PostMapping
    PackageRequestResponse create(@Valid @RequestBody CreatePackageRequest request) {
        return packageRequestService.createCustomerRequest(currentUser.require().id(), request);
    }

    @GetMapping
    List<PackageRequestResponse> mine() {
        return packageRequestService.customerRequests(currentUser.require().id());
    }
}
