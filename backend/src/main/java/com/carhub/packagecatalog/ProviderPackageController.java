package com.carhub.packagecatalog;

import com.carhub.packagecatalog.dto.ProviderPackageSubmissionRequest;
import com.carhub.packagecatalog.dto.TravelPackageResponse;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/provider/packages")
public class ProviderPackageController {
    private final PackageCatalogService packageCatalogService;
    private final CurrentUser currentUser;

    public ProviderPackageController(PackageCatalogService packageCatalogService, CurrentUser currentUser) {
        this.packageCatalogService = packageCatalogService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<TravelPackageResponse> mine() {
        return packageCatalogService.providerPackages(currentUser.require().id());
    }

    @PostMapping
    TravelPackageResponse submit(@Valid @RequestBody ProviderPackageSubmissionRequest request) {
        return packageCatalogService.submitProviderPackage(currentUser.require().id(), request);
    }

    @PutMapping("/{packageId}")
    TravelPackageResponse update(@PathVariable UUID packageId, @Valid @RequestBody ProviderPackageSubmissionRequest request) {
        return packageCatalogService.updateProviderPackage(currentUser.require().id(), packageId, request);
    }

    @PostMapping("/{packageId}/repost")
    TravelPackageResponse repost(@PathVariable UUID packageId) {
        return packageCatalogService.repostPackage(currentUser.require().id(), packageId);
    }

    @PostMapping("/{packageId}/cancel-request")
    TravelPackageResponse cancelRequest(@PathVariable UUID packageId, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        return packageCatalogService.providerCancelRequest(currentUser.require().id(), packageId, reason);
    }
}
