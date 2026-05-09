package com.carhub.packagecatalog;

import com.carhub.packagecatalog.dto.AdminPackageReviewRequest;
import com.carhub.packagecatalog.dto.TravelPackageResponse;
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
@RequestMapping("/api/v1/admin/packages")
public class AdminPackageCatalogController {
    private final PackageCatalogService packageCatalogService;
    private final CurrentUser currentUser;

    public AdminPackageCatalogController(PackageCatalogService packageCatalogService, CurrentUser currentUser) {
        this.packageCatalogService = packageCatalogService;
        this.currentUser = currentUser;
    }

    @GetMapping("/pending")
    List<TravelPackageResponse> pendingProviderPackages() {
        return packageCatalogService.pendingAdminPackages();
    }

    @PostMapping("/{packageId}/review")
    TravelPackageResponse review(@PathVariable UUID packageId, @Valid @RequestBody AdminPackageReviewRequest request) {
        return packageCatalogService.reviewProviderPackage(currentUser.require().id(), packageId, request);
    }
}
