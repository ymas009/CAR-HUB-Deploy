package com.carhub.packagecatalog;

import com.carhub.packagecatalog.dto.TravelPackageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/packages")
public class PackageCatalogController {
    private final PackageCatalogService packageCatalogService;

    public PackageCatalogController(PackageCatalogService packageCatalogService) {
        this.packageCatalogService = packageCatalogService;
    }

    @GetMapping
    List<TravelPackageResponse> list() {
        return packageCatalogService.publicPackages();
    }

    @GetMapping("/{id}")
    TravelPackageResponse get(@PathVariable UUID id) {
        return packageCatalogService.get(id);
    }
}
