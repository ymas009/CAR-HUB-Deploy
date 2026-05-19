package com.carhub.packagecatalog;

import com.carhub.common.BusinessRuleException;
import com.carhub.audit.AuditService;
import com.carhub.packagecatalog.dto.AdminPackageReviewRequest;
import com.carhub.packagecatalog.dto.PackageAvailabilityUpdateRequest;
import com.carhub.packagecatalog.dto.ProviderPackageSubmissionRequest;
import com.carhub.packagecatalog.dto.TravelPackageResponse;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
        return travelPackageRepository.findPubliclyBookablePackages().stream()
                .map(pack -> toResponse(pack, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> publicPackages(UUID customerId) {
        return travelPackageRepository.findPubliclyBookablePackages().stream()
                .map(pack -> toResponse(pack, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public TravelPackageResponse get(UUID id) {
        return travelPackageRepository.findPubliclyBookableById(id).map(pack -> toResponse(pack, false))
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package not found."));
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> providerPackages(UUID providerUserId) {
        long completedCount = travelPackageRepository
                .countBySourceProvider_User_IdAndAvailabilityStatus(providerUserId, "BOOKED");
        return travelPackageRepository.findBySourceProvider_User_IdOrderByCreatedAtDesc(providerUserId).stream()
                .map(pack -> toResponse(pack, true, completedCount))
                .toList();
    }

    @Transactional
    public TravelPackageResponse submitProviderPackage(UUID providerUserId, ProviderPackageSubmissionRequest request) {
        ProviderProfile provider = providerProfileRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new BusinessRuleException("PROVIDER_PROFILE_NOT_FOUND", "Provider profile is not available."));
        if (provider.isSuspended()) {
            throw new BusinessRuleException("PROVIDER_SUSPENDED", "Your provider account is suspended. Contact admin support.");
        }
        AppUser submittedBy = appUserRepository.findById(providerUserId)
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Provider user not found."));

        TravelPackage pack = new TravelPackage();
        pack.setSlug(uniqueSlug(request.destination(), request.carType()));
        applyPackageDetails(pack, request);
        pack.setFeatured(false);
        pack.setAvailabilityStatus("PENDING_ADMIN_REVIEW");
        pack.setSourceProvider(provider);
        pack.setSubmittedBy(submittedBy);
        pack.setSubmittedAt(Instant.now());

        TravelPackage saved = travelPackageRepository.save(pack);
        auditService.recordCatalogAction(providerUserId, "PROVIDER", "PACKAGE_SUBMITTED_FOR_REVIEW", saved.getId(),
                null, saved.getAvailabilityStatus(), "Provider package submitted. Pending admin approval before going live.");
        return toResponse(saved, true);
    }

    private void applyPackageDetails(TravelPackage pack, ProviderPackageSubmissionRequest request) {
        String destination = request.destination().trim();
        String carType = normalizeCarType(request.carType());
        pack.setTitle(destination + " - " + ("SIX_SEATER".equals(carType) ? "6 seater" : "4 seater"));
        pack.setDestination(request.destination().trim());
        pack.setCategory("Provider car");
        pack.setSummary(request.localPlaces().trim());
        pack.setDescription(request.localPlaces().trim());
        pack.setStartingPrice(BigDecimal.ONE);
        pack.setCurrency("INR");
        pack.setDurationDays(1);
        pack.setImageUrl(normalizeImageUrl(request.carPhotoUrl()));
        pack.setVideoUrl(null);
        pack.setCarPhotoUrl(request.carPhotoUrl());
        pack.setLocalPlaces(request.localPlaces().trim());
        pack.setCarType(carType);
        pack.setSeatsAvailable(request.seatsAvailable() == null ? ("SIX_SEATER".equals(carType) ? 6 : 4) : request.seatsAvailable());
        pack.setCarNumber(request.carNumber());
        pack.setCarModel(request.carModel());
        pack.setDistanceKm(estimateDistanceKm(destination));
        if (request.pricePerKm() != null) {
            pack.setPricePerKm(request.pricePerKm());
        }
        recalculateProviderPayout(pack);
        pack.setLicenseNumber(request.licenseNumber());
        pack.setLicenseHolderName(request.licenseHolderName());
        pack.setLicenseDetails(null);
        pack.setLicenseDocumentUrl(request.licenseDocumentUrl());
        pack.setRcNumber(request.rcNumber());
        pack.setRcDocumentUrl(request.rcDocumentUrl());
        applyPickupAvailability(pack, request);
        pack.setProviderNotes("License: " + request.licenseNumber());
    }

    private void applyPickupAvailability(TravelPackage pack, ProviderPackageSubmissionRequest request) {
        String mode = "SPECIFIC".equalsIgnoreCase(request.pickupAvailabilityMode()) ? "SPECIFIC" : "ALWAYS";
        pack.setPickupAvailabilityMode(mode);
        if ("SPECIFIC".equals(mode)) {
            if (request.pickupStartTime() == null || request.pickupStartTime().isBlank()
                    || request.pickupEndTime() == null || request.pickupEndTime().isBlank()) {
                throw new BusinessRuleException("INVALID_PICKUP_AVAILABILITY", "Pickup start and end time are required for specific availability.");
            }
            pack.setPickupStartTime(request.pickupStartTime());
            pack.setPickupEndTime(request.pickupEndTime());
        } else {
            pack.setPickupStartTime(null);
            pack.setPickupEndTime(null);
        }
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> pendingAdminPackages() {
        List<TravelPackage> packages = travelPackageRepository.findByAvailabilityStatusOrderByCreatedAtDesc("PENDING_ADMIN_REVIEW");
        Map<UUID, Long> completedCounts = resolveCompletedCounts(packages);
        return packages.stream()
                .map(pack -> toResponse(pack, true, completedCountFor(pack, completedCounts)))
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
        return toResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public List<TravelPackageResponse> allAdminPackages() {
        List<TravelPackage> packages = travelPackageRepository.findAll();
        Map<UUID, Long> completedCounts = resolveCompletedCounts(packages);
        return packages.stream()
                .map(pack -> toResponse(pack, true, completedCountFor(pack, completedCounts)))
                .toList();
    }

    @Transactional
    public TravelPackageResponse updateProviderPackage(UUID providerUserId, UUID packageId, ProviderPackageSubmissionRequest request) {
        TravelPackage pack = travelPackageRepository.findById(packageId)
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package not found."));
        if (pack.getSourceProvider() == null || !pack.getSourceProvider().getUser().getId().equals(providerUserId)) {
            throw new BusinessRuleException("FORBIDDEN", "Provider cannot edit this package.");
        }
        applyPackageDetails(pack, request);
        pack.touch();
        return toResponse(travelPackageRepository.save(pack), true);
    }

    @Transactional
    public TravelPackageResponse updateAdminPackage(UUID adminId, UUID packageId, PackageAvailabilityUpdateRequest request) {
        TravelPackage pack = travelPackageRepository.findById(packageId)
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package not found."));
        String previous = pack.getAvailabilityStatus();
        if ("BOOKED".equals(previous) && "AVAILABLE".equals(request.availabilityStatus())) {
            throw new BusinessRuleException("BOOKED_PACKAGE_LOCKED",
                    "Booked packages cannot be made live again. Ask the provider to submit a new package for approval.");
        }
        pack.setAvailabilityStatus(request.availabilityStatus());
        pack.setFeatured(request.featured() && "AVAILABLE".equals(request.availabilityStatus()));
        pack.setReviewNotes(request.reviewNotes());
        pack.setVideoUrl(normalizeVideoUrl(request.videoUrl()));
        pack.setCarPhotoUrl(request.carPhotoUrl());
        pack.setCarNumber(request.carNumber());
        pack.setCarModel(request.carModel());
        pack.setCarColor(request.carColor());
        pack.setSeatsAvailable(request.seatsAvailable());
        pack.setDistanceKm(request.distanceKm() == null ? estimateDistanceKm(pack.getDestination()) : request.distanceKm());
        pack.setPricePerKm(request.pricePerKm());
        recalculateProviderPayout(pack);
        pack.setProviderNotes(request.providerNotes());
        pack.touch();
        TravelPackage saved = travelPackageRepository.save(pack);
        auditService.recordCatalogAction(adminId, "ADMIN", "PACKAGE_AVAILABILITY_UPDATED", saved.getId(),
                previous, saved.getAvailabilityStatus(), request.reviewNotes());
        return toResponse(saved, true);
    }

    public TravelPackageResponse toResponse(TravelPackage pack) {
        return toResponse(pack, false, 0L);
    }

    private TravelPackageResponse toResponse(TravelPackage pack, boolean includeProviderPricing) {
        return toResponse(pack, includeProviderPricing, 0L);
    }

    private TravelPackageResponse toResponse(TravelPackage pack, boolean includeProviderPricing, long completedCount) {
        return new TravelPackageResponse(pack.getId(), pack.getSlug(), pack.getTitle(), pack.getDestination(),
                pack.getCategory(), pack.getSummary(), pack.getDescription(), pack.getStartingPrice(),
                includeProviderPricing ? pack.getDistanceKm() : null,
                includeProviderPricing ? pack.getPricePerKm() : null,
                includeProviderPricing ? pack.getProviderPayout() : null,
                pack.getCurrency(), pack.getDurationDays(), pack.getImageUrl(), pack.getVideoUrl(), pack.getCarPhotoUrl(),
                pack.getLocalPlaces(), pack.getCarType(), pack.getLicenseNumber(), pack.getLicenseHolderName(), pack.getLicenseDetails(),
                pack.getLicenseDocumentUrl(),
                pack.getCarNumber(), pack.getCarModel(), pack.getCarColor(), pack.getSeatsAvailable(), pack.getProviderNotes(),
                pack.getPickupAvailabilityMode(), pack.getPickupStartTime(), pack.getPickupEndTime(), pack.isFeatured(),
                pack.getAvailabilityStatus(),
                pack.getSourceProvider() == null ? null : pack.getSourceProvider().getBusinessName(),
                pack.getReviewNotes(),
                pack.getRcNumber(),
                pack.getRcDocumentUrl(),
                pack.getRepostedFromId(),
                completedCount);
    }

    private Map<UUID, Long> resolveCompletedCounts(List<TravelPackage> packages) {
        Set<UUID> providerUserIds = packages.stream()
                .filter(p -> p.getSourceProvider() != null)
                .map(p -> p.getSourceProvider().getUser().getId())
                .collect(Collectors.toSet());
        return providerUserIds.stream().collect(Collectors.toMap(
                id -> id,
                id -> travelPackageRepository.countBySourceProvider_User_IdAndAvailabilityStatus(id, "BOOKED")
        ));
    }

    private long completedCountFor(TravelPackage pack, Map<UUID, Long> counts) {
        if (pack.getSourceProvider() == null) return 0L;
        return counts.getOrDefault(pack.getSourceProvider().getUser().getId(), 0L);
    }

    @Transactional
    public TravelPackageResponse repostPackage(UUID providerUserId, UUID packageId) {
        TravelPackage original = travelPackageRepository.findById(packageId)
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package not found."));
        if (original.getSourceProvider() == null || !original.getSourceProvider().getUser().getId().equals(providerUserId)) {
            throw new BusinessRuleException("FORBIDDEN", "Provider cannot repost this package.");
        }
        if (!"BOOKED".equals(original.getAvailabilityStatus())) {
            throw new BusinessRuleException("PACKAGE_NOT_COMPLETED", "Only successfully completed (booked) packages can be reposted.");
        }
        ProviderProfile provider = original.getSourceProvider();
        if (provider.isSuspended()) {
            throw new BusinessRuleException("PROVIDER_SUSPENDED", "Your provider account is suspended. Contact admin support.");
        }
        AppUser submittedBy = appUserRepository.findById(providerUserId)
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Provider user not found."));

        TravelPackage repost = new TravelPackage();
        repost.setSlug(uniqueSlug(original.getDestination(), original.getCarType()));
        repost.setTitle(original.getTitle());
        repost.setDestination(original.getDestination());
        repost.setCategory(original.getCategory());
        repost.setSummary(original.getSummary());
        repost.setDescription(original.getDescription());
        repost.setStartingPrice(original.getStartingPrice());
        repost.setCurrency(original.getCurrency());
        repost.setDurationDays(original.getDurationDays());
        repost.setImageUrl(original.getImageUrl());
        repost.setCarPhotoUrl(original.getCarPhotoUrl());
        repost.setLocalPlaces(original.getLocalPlaces());
        repost.setCarType(original.getCarType());
        repost.setSeatsAvailable(original.getSeatsAvailable());
        repost.setCarNumber(original.getCarNumber());
        repost.setCarModel(original.getCarModel());
        repost.setCarColor(original.getCarColor());
        repost.setDistanceKm(original.getDistanceKm());
        repost.setPricePerKm(original.getPricePerKm());
        repost.setLicenseNumber(original.getLicenseNumber());
        repost.setLicenseHolderName(original.getLicenseHolderName());
        repost.setLicenseDetails(original.getLicenseDetails());
        repost.setLicenseDocumentUrl(original.getLicenseDocumentUrl());
        repost.setRcNumber(original.getRcNumber());
        repost.setRcDocumentUrl(original.getRcDocumentUrl());
        repost.setPickupAvailabilityMode(original.getPickupAvailabilityMode());
        repost.setPickupStartTime(original.getPickupStartTime());
        repost.setPickupEndTime(original.getPickupEndTime());
        repost.setProviderNotes(original.getProviderNotes());
        repost.setFeatured(false);
        repost.setAvailabilityStatus("PENDING_ADMIN_REVIEW");
        repost.setSourceProvider(provider);
        repost.setSubmittedBy(submittedBy);
        repost.setSubmittedAt(Instant.now());
        repost.setRepostedFromId(original.getId());
        recalculateProviderPayout(repost);

        TravelPackage saved = travelPackageRepository.save(repost);
        auditService.recordCatalogAction(providerUserId, "PROVIDER", "PACKAGE_REPOSTED", saved.getId(),
                null, saved.getAvailabilityStatus(), "Reposted from completed package " + original.getId());
        long completedCount = travelPackageRepository
                .countBySourceProvider_User_IdAndAvailabilityStatus(providerUserId, "BOOKED");
        return toResponse(saved, true, completedCount);
    }

    private void recalculateProviderPayout(TravelPackage pack) {
        if (pack.getDistanceKm() == null || pack.getPricePerKm() == null) {
            pack.setProviderPayout(null);
            return;
        }
        pack.setProviderPayout(pack.getDistanceKm().multiply(pack.getPricePerKm()).setScale(2, RoundingMode.HALF_UP));
    }

    private BigDecimal estimateDistanceKm(String destination) {
        String value = destination == null ? "" : destination.toLowerCase(Locale.ROOT);
        if (value.contains("lonavala") || value.contains("khandala") || value.contains("karla")) return BigDecimal.valueOf(65);
        if (value.contains("mahabaleshwar")) return BigDecimal.valueOf(120);
        if (value.contains("panchgani")) return BigDecimal.valueOf(100);
        if (value.contains("alibaug") || value.contains("mandwa")) return BigDecimal.valueOf(140);
        if (value.contains("shirdi")) return BigDecimal.valueOf(190);
        if (value.contains("nashik")) return BigDecimal.valueOf(210);
        if (value.contains("kolad")) return BigDecimal.valueOf(120);
        if (value.contains("mumbai")) return BigDecimal.valueOf(162);
        if (value.contains("sinhagad")) return BigDecimal.valueOf(35);
        return BigDecimal.valueOf(100);
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

    private String normalizeCarType(String carType) {
        return "SIX_SEATER".equalsIgnoreCase(carType) || "6".equals(carType) ? "SIX_SEATER" : "FOUR_SEATER";
    }

    private String normalizeVideoUrl(String videoUrl) {
        if (videoUrl == null || videoUrl.isBlank()) {
            return null;
        }
        return videoUrl.trim();
    }
}
