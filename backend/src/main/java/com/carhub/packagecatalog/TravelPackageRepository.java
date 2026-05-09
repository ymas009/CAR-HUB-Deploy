package com.carhub.packagecatalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TravelPackageRepository extends JpaRepository<TravelPackage, UUID> {
    Optional<TravelPackage> findBySlug(String slug);
    Optional<TravelPackage> findByIdAndAvailabilityStatus(UUID id, String availabilityStatus);
    boolean existsBySlug(String slug);
    List<TravelPackage> findByAvailabilityStatusOrderByFeaturedDescTitleAsc(String availabilityStatus);
    List<TravelPackage> findByAvailabilityStatusOrderByCreatedAtDesc(String availabilityStatus);
    List<TravelPackage> findBySourceProvider_User_IdOrderByCreatedAtDesc(UUID providerUserId);
}
