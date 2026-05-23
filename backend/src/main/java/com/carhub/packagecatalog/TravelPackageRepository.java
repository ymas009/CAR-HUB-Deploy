package com.carhub.packagecatalog;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    long countBySourceProvider_User_Id(UUID providerUserId);
    long countBySourceProvider_User_IdAndAvailabilityStatus(UUID providerUserId, String status);

    @Query("""
            select pack from TravelPackage pack
            where pack.availabilityStatus = 'AVAILABLE'
            and not exists (
                select ticket.id from Ticket ticket
                where ticket.travelPackage = pack
            )
            order by pack.featured desc, pack.title asc
            """)
    List<TravelPackage> findPubliclyBookablePackages();

    @Query("""
            select pack from TravelPackage pack
            where pack.id = :id
            and pack.availabilityStatus = 'AVAILABLE'
            and not exists (
                select ticket.id from Ticket ticket
                where ticket.travelPackage = pack
            )
            """)
    Optional<TravelPackage> findPubliclyBookableById(@Param("id") UUID id);

    @Query("""
            select pack from TravelPackage pack
            where pack.availabilityStatus = 'AVAILABLE'
            and pack.region = :region
            and not exists (
                select ticket.id from Ticket ticket
                where ticket.travelPackage = pack
            )
            order by pack.featured desc, pack.title asc
            """)
    List<TravelPackage> findPubliclyBookableByRegion(@Param("region") String region);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select pack from TravelPackage pack
            where pack.id = :id
            and pack.availabilityStatus = 'AVAILABLE'
            """)
    Optional<TravelPackage> findAvailableByIdForUpdate(@Param("id") UUID id);
}
