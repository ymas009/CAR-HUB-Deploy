package com.carhub.booking;

import com.carhub.audit.AuditService;
import com.carhub.booking.dto.BookingRequestDTO;
import com.carhub.booking.dto.TravellerDTO;
import com.carhub.common.BusinessRuleException;
import com.carhub.packagecatalog.TravelPackage;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingServiceTest {
    private final TicketRepository tickets = mock(TicketRepository.class);
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final TravelPackageRepository packages = mock(TravelPackageRepository.class);
    private final ProviderProfileRepository providers = mock(ProviderProfileRepository.class);
    private final AuditService audit = mock(AuditService.class);
    private final TicketEmailService ticketEmail = mock(TicketEmailService.class);
    private final BookingService service = new BookingService(
            tickets,
            users,
            packages,
            providers,
            audit,
            new ObjectMapper(),
            ticketEmail
    );

    @Test
    void createBookingLocksAndRetiresPackageFromPublicCatalog() {
        UUID customerId = UUID.randomUUID();
        UUID packageId = UUID.randomUUID();
        AppUser customer = user("customer@carhub.local", "9000000002", "Customer");
        AppUser providerUser = user("provider@carhub.local", "9000000003", "Provider");
        ProviderProfile provider = provider(providerUser);
        TravelPackage pack = packageWithProvider(provider);
        pack.setFeatured(true);

        when(tickets.existsByCustomerIdAndTravelPackageId(customerId, packageId)).thenReturn(false);
        when(users.findById(customerId)).thenReturn(Optional.of(customer));
        when(packages.findAvailableByIdForUpdate(packageId)).thenReturn(Optional.of(pack));
        when(tickets.existsByTravelPackageId(packageId)).thenReturn(false);
        when(tickets.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createBooking(customerId, bookingRequest(packageId));

        verify(packages).findAvailableByIdForUpdate(packageId);
        assertEquals("BOOKED", pack.getAvailabilityStatus());
        assertFalse(pack.isFeatured());
        verify(packages).save(pack);
        verify(ticketEmail).sendTicket(any(Ticket.class));
    }

    @Test
    void createBookingRejectsPackageThatAlreadyHasATicket() {
        UUID customerId = UUID.randomUUID();
        UUID packageId = UUID.randomUUID();
        TravelPackage pack = packageWithProvider(provider(user("provider@carhub.local", "9000000003", "Provider")));

        when(tickets.existsByCustomerIdAndTravelPackageId(customerId, packageId)).thenReturn(false);
        when(users.findById(customerId)).thenReturn(Optional.of(user("customer@carhub.local", "9000000002", "Customer")));
        when(packages.findAvailableByIdForUpdate(packageId)).thenReturn(Optional.of(pack));
        when(tickets.existsByTravelPackageId(packageId)).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> service.createBooking(customerId, bookingRequest(packageId)));

        assertEquals("BOOKED", pack.getAvailabilityStatus());
        verify(packages).save(pack);
        verify(tickets, never()).save(any(Ticket.class));
    }

    private BookingRequestDTO bookingRequest(UUID packageId) {
        return new BookingRequestDTO(
                packageId,
                1,
                CarType.FOUR_SEATER,
                List.of(new TravellerDTO("Aarav Sharma", 28, "MALE")),
                null,
                "Pune Station",
                LocalDate.now().plusDays(1),
                "10:00",
                "pay_test"
        );
    }

    private TravelPackage packageWithProvider(ProviderProfile provider) {
        TravelPackage pack = new TravelPackage();
        pack.setSlug("sample-package");
        pack.setTitle("Sample package");
        pack.setDestination("Sample destination");
        pack.setCategory("Provider car");
        pack.setSummary("Sample local places");
        pack.setDescription("Sample local places");
        pack.setCurrency("INR");
        pack.setDurationDays(1);
        pack.setAvailabilityStatus("AVAILABLE");
        pack.setSourceProvider(provider);
        return pack;
    }

    private ProviderProfile provider(AppUser providerUser) {
        ProviderProfile provider = new ProviderProfile();
        provider.setUser(providerUser);
        provider.setBusinessName("CarHub Verified Travel Partner");
        provider.setContactPerson("Provider Operations");
        provider.setVerificationStatus("APPROVED");
        provider.setSuspended(false);
        return provider;
    }

    private AppUser user(String email, String mobile, String name) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setMobile(mobile);
        user.setFullName(name);
        user.setPasswordHash("hashed");
        return user;
    }
}
