package com.carhub.packagecatalog;

import com.carhub.packagecatalog.dto.TravelPackageResponse;
import com.carhub.domain.RoleCode;
import com.carhub.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/packages")
public class PackageCatalogController {
    private final PackageCatalogService packageCatalogService;
    private final CurrentUser currentUser;

    public PackageCatalogController(PackageCatalogService packageCatalogService, CurrentUser currentUser) {
        this.packageCatalogService = packageCatalogService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<TravelPackageResponse> list(@RequestParam(required = false) String region) {
        if (region != null && !region.isBlank()) {
            return packageCatalogService.publicPackagesByRegion(region);
        }
        return currentUser.optional()
                .filter(user -> user.hasRole(RoleCode.CUSTOMER))
                .map(user -> packageCatalogService.publicPackages(user.id()))
                .orElseGet(packageCatalogService::publicPackages);
    }

    @GetMapping("/{id}")
    TravelPackageResponse get(@PathVariable UUID id) {
        return packageCatalogService.get(id);
    }
}
