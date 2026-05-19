package com.carhub.packagecatalog;

import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.packagecatalog.dto.ProviderPackageSubmissionRequest;
import com.carhub.packagecatalog.dto.TravelPackageResponse;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PackageCatalogServiceTest {
    private final TravelPackageRepository packages = mock(TravelPackageRepository.class);
    private final ProviderProfileRepository providers = mock(ProviderProfileRepository.class);
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final PackageCatalogService service = new PackageCatalogService(packages, providers, users, audit);

    @Test
    void pendingRegisteredProviderCanSubmitPackageForAdminReview() {
        UUID providerUserId = UUID.randomUUID();
        ProviderProfile provider = provider(providerUserId, "PENDING", false);
        AppUser user = user(providerUserId);

        when(providers.findByUserId(providerUserId)).thenReturn(Optional.of(provider));
        when(users.findById(providerUserId)).thenReturn(Optional.of(user));
        when(packages.existsBySlug(any())).thenReturn(false);
        when(packages.save(any(TravelPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TravelPackage packageResult = captureSubmittedPackage(providerUserId);

        assertEquals("PENDING_ADMIN_REVIEW", packageResult.getAvailabilityStatus());
        verify(packages).save(packageResult);
    }

    @Test
    void suspendedProviderCannotSubmitPackage() {
        UUID providerUserId = UUID.randomUUID();
        when(providers.findByUserId(providerUserId)).thenReturn(Optional.of(provider(providerUserId, "PENDING", true)));

        assertThrows(BusinessRuleException.class, () -> service.submitProviderPackage(providerUserId, request()));
    }

    @Test
    void providerCanRepostCompletedPackage() {
        UUID providerUserId = UUID.randomUUID();
        ProviderProfile provider = provider(providerUserId, "APPROVED", false);
        AppUser user = user(providerUserId);

        TravelPackage bookedPackage = new TravelPackage();
        bookedPackage.setSlug("lonavala-four-seater");
        bookedPackage.setTitle("Lonavala - 4 seater");
        bookedPackage.setDestination("Lonavala");
        bookedPackage.setCategory("Provider car");
        bookedPackage.setSummary("Bhushi Dam, Tiger Point");
        bookedPackage.setDescription("Bhushi Dam, Tiger Point");
        bookedPackage.setStartingPrice(BigDecimal.ONE);
        bookedPackage.setCurrency("INR");
        bookedPackage.setDurationDays(1);
        bookedPackage.setCarType("FOUR_SEATER");
        bookedPackage.setCarNumber("MH12AB1234");
        bookedPackage.setCarModel("Swift Dzire");
        bookedPackage.setLicenseNumber("DL1234567890");
        bookedPackage.setAvailabilityStatus("BOOKED");
        bookedPackage.setSourceProvider(provider);

        UUID packageId = UUID.randomUUID();
        when(packages.findById(packageId)).thenReturn(Optional.of(bookedPackage));
        when(users.findById(providerUserId)).thenReturn(Optional.of(user));
        when(packages.existsBySlug(any())).thenReturn(false);
        when(packages.save(any(TravelPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(packages.countBySourceProvider_User_IdAndAvailabilityStatus(eq(providerUserId), eq("BOOKED"))).thenReturn(1L);

        TravelPackageResponse response = service.repostPackage(providerUserId, packageId);

        assertEquals("PENDING_ADMIN_REVIEW", response.availabilityStatus());
        assertEquals(1L, response.providerCompletedCount());
        // repostedFromId equals original.getId() — null in unit test because JPA @GeneratedValue is not active
        assertEquals(bookedPackage.getId(), response.repostedFromId());
    }

    @Test
    void repostFailsForNonBookedPackage() {
        UUID providerUserId = UUID.randomUUID();
        ProviderProfile provider = provider(providerUserId, "APPROVED", false);

        TravelPackage pendingPackage = new TravelPackage();
        pendingPackage.setAvailabilityStatus("PENDING_ADMIN_REVIEW");
        pendingPackage.setSourceProvider(provider);

        UUID packageId = UUID.randomUUID();
        when(packages.findById(packageId)).thenReturn(Optional.of(pendingPackage));

        assertThrows(BusinessRuleException.class, () -> service.repostPackage(providerUserId, packageId));
    }

    private TravelPackage captureSubmittedPackage(UUID providerUserId) {
        service.submitProviderPackage(providerUserId, request());
        return org.mockito.Mockito.mockingDetails(packages)
                .getInvocations()
                .stream()
                .filter(invocation -> "save".equals(invocation.getMethod().getName()))
                .map(invocation -> (TravelPackage) invocation.getArgument(0))
                .findFirst()
                .orElseThrow();
    }

    private ProviderPackageSubmissionRequest request() {
        return new ProviderPackageSubmissionRequest(
                "Lonavala",
                "Bhushi Dam, Tiger Point",
                "FOUR_SEATER",
                "ALWAYS",
                null,
                null,
                "car-photo",
                4,
                "MH12AB1234",
                "Swift Dzire",
                "DL1234567890",
                "Driver Name",
                "license-file",
                BigDecimal.valueOf(12),
                "RC123456",
                "rc-file"
        );
    }

    private ProviderProfile provider(UUID userId, String status, boolean suspended) {
        ProviderProfile provider = new ProviderProfile();
        provider.setUser(user(userId));
        provider.setBusinessName("Provider Business");
        provider.setContactPerson("Provider User");
        provider.setVerificationStatus(status);
        provider.setSuspended(suspended);
        return provider;
    }

    private AppUser user(UUID id) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setEmail("provider@example.com");
        user.setMobile("9000000003");
        user.setFullName("Provider User");
        user.setPasswordHash("hashed");
        return user;
    }
}
