package com.carhub.packagecatalog;

import com.carhub.packagecatalog.dto.ProviderPackageSubmissionRequest;
import com.carhub.packagecatalog.dto.TravelPackageResponse;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
