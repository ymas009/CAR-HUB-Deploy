package com.carhub.packagecatalog;

import com.carhub.common.BusinessRuleException;
import com.carhub.audit.AuditService;
import com.carhub.packagecatalog.dto.AdminPackageReviewRequest;
import com.carhub.packagecatalog.dto.ProviderPackageSubmissionRequest;
import com.carhub.packagecatalog.dto.TravelPackageResponse;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PackageCatalogService {
    private final TravelPackageRepository travelPackageRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    public PackageCatalogService(TravelPackageRepository travelPackageRepository,
                                 ProviderProfileRepository providerProfileRepository,
                                 AppUserRepository appUserRepository,
                                 AuditService auditService) {
        this.travelPackageRepository = travelPackageRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.appUserRepository = appUserRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> publicPackages() {
        return travelPackageRepository.findByAvailabilityStatusOrderByFeaturedDescTitleAsc("AVAILABLE").stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TravelPackageResponse get(UUID id) {
        return travelPackageRepository.findByIdAndAvailabilityStatus(id, "AVAILABLE").map(this::toResponse)
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package not found."));
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> providerPackages(UUID providerUserId) {
        return travelPackageRepository.findBySourceProvider_User_IdOrderByCreatedAtDesc(providerUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TravelPackageResponse submitProviderPackage(UUID providerUserId, ProviderPackageSubmissionRequest request) {
        ProviderProfile provider = providerProfileRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new BusinessRuleException("PROVIDER_PROFILE_NOT_FOUND", "Provider profile is not available."));
        if (!"APPROVED".equals(provider.getVerificationStatus()) || provider.isSuspended()) {
            throw new BusinessRuleException("PROVIDER_NOT_APPROVED", "Only approved active providers can submit package proposals.");
        }
        AppUser submittedBy = appUserRepository.findById(providerUserId)
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Provider user not found."));

        TravelPackage pack = new TravelPackage();
        pack.setSlug(uniqueSlug(request.title(), request.destination()));
        pack.setTitle(request.title().trim());
        pack.setDestination(request.destination().trim());
        pack.setCategory(request.category().trim());
        pack.setSummary(request.summary().trim());
        pack.setDescription(request.description().trim());
        pack.setStartingPrice(request.startingPrice());
        pack.setCurrency(request.currency().trim().toUpperCase(Locale.ROOT));
        pack.setDurationDays(request.durationDays());
        pack.setImageUrl(normalizeImageUrl(request.imageUrl()));
        pack.setFeatured(false);
        pack.setAvailabilityStatus("PENDING_ADMIN_REVIEW");
        pack.setSourceProvider(provider);
        pack.setSubmittedBy(submittedBy);
        pack.setSubmittedAt(Instant.now());

        TravelPackage saved = travelPackageRepository.save(pack);
        auditService.recordCatalogAction(providerUserId, "PROVIDER", "PACKAGE_SUBMITTED_FOR_REVIEW", saved.getId(),
                null, saved.getAvailabilityStatus(), "Provider package proposal submitted for company review.");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> pendingAdminPackages() {
        return travelPackageRepository.findByAvailabilityStatusOrderByCreatedAtDesc("PENDING_ADMIN_REVIEW").stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TravelPackageResponse reviewProviderPackage(UUID adminId, UUID packageId, AdminPackageReviewRequest request) {
        TravelPackage pack = travelPackageRepository.findById(packageId)
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package proposal not found."));
        if (pack.getSourceProvider() == null) {
            throw new BusinessRuleException("PACKAGE_NOT_PROVIDER_SUBMITTED", "Only provider-submitted package proposals use this review flow.");
        }
        AppUser reviewer = appUserRepository.findById(adminId)
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Admin user not found."));
        String previous = pack.getAvailabilityStatus();
        String next = switch (request.decision()) {
            case "APPROVED" -> "AVAILABLE";
            case "REJECTED" -> "REJECTED_BY_COMPANY";
            case "NEEDS_CHANGES" -> "CHANGES_REQUESTED";
            default -> throw new BusinessRuleException("INVALID_PACKAGE_DECISION", "Unsupported package review decision.");
        };
        pack.setAvailabilityStatus(next);
        pack.setFeatured(request.featured() && "AVAILABLE".equals(next));
        pack.setReviewNotes(request.reviewNotes());
        pack.setReviewedBy(reviewer);
        pack.setReviewedAt(Instant.now());
        pack.touch();
        TravelPackage saved = travelPackageRepository.save(pack);
        auditService.recordCatalogAction(adminId, "ADMIN", "PACKAGE_REVIEW_DECISION", saved.getId(),
                previous, next, request.reviewNotes());
        return toResponse(saved);
    }

    public TravelPackageResponse toResponse(TravelPackage pack) {
        return new TravelPackageResponse(pack.getId(), pack.getSlug(), pack.getTitle(), pack.getDestination(),
                pack.getCategory(), pack.getSummary(), pack.getDescription(), pack.getStartingPrice(),
                pack.getCurrency(), pack.getDurationDays(), pack.getImageUrl(), pack.isFeatured(),
                pack.getAvailabilityStatus(),
                pack.getSourceProvider() == null ? null : pack.getSourceProvider().getBusinessName(),
                pack.getReviewNotes());
    }

    private String uniqueSlug(String title, String destination) {
        String base = slugify(title + "-" + destination);
        String slug = base;
        int suffix = 2;
        while (travelPackageRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix;
            suffix++;
        }
        return slug;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "provider-package" : normalized;
    }

    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
        }
        return imageUrl.trim();
    }
}
