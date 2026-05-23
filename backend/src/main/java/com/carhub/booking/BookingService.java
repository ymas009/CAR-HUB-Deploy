package com.carhub.booking;

import com.carhub.audit.AuditService;
import com.carhub.booking.dto.BookingRequestDTO;
import com.carhub.booking.dto.CompletionOtpResponse;
import com.carhub.booking.dto.LocationUpdateRequest;
import com.carhub.booking.dto.ProviderTicketDTO;
import com.carhub.booking.dto.TicketDTO;
import com.carhub.common.BusinessRuleException;
import com.carhub.packagecatalog.TravelPackage;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {
    private final TicketRepository ticketRepository;
    private final AppUserRepository appUserRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final TicketEmailService ticketEmailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public BookingService(TicketRepository ticketRepository, AppUserRepository appUserRepository,
                          TravelPackageRepository travelPackageRepository, ProviderProfileRepository providerProfileRepository,
                          AuditService auditService, ObjectMapper objectMapper, TicketEmailService ticketEmailService) {
        this.ticketRepository = ticketRepository;
        this.appUserRepository = appUserRepository;
        this.travelPackageRepository = travelPackageRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.ticketEmailService = ticketEmailService;
    }

    @Transactional
    public TicketDTO createBooking(UUID customerId, BookingRequestDTO request) {
        validateBooking(request);
        if (ticketRepository.existsByCustomerIdAndTravelPackageId(customerId, request.packageId())) {
            throw new BusinessRuleException("PACKAGE_ALREADY_BOOKED", "This package is already booked for this customer.");
        }
        AppUser customer = appUserRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Customer not found."));
        TravelPackage travelPackage = travelPackageRepository.findAvailableByIdForUpdate(request.packageId())
                .orElseThrow(() -> new BusinessRuleException("PACKAGE_NOT_FOUND", "Package is not available."));
        if (ticketRepository.existsByTravelPackageId(request.packageId())) {
            travelPackage.setAvailabilityStatus("BOOKED");
            travelPackage.setFeatured(false);
            travelPackage.touch();
            travelPackageRepository.save(travelPackage);
            throw new BusinessRuleException("PACKAGE_ALREADY_BOOKED", "This package has already been booked.");
        }
        validatePickupAvailability(travelPackage, request.pickupTime());
        ProviderProfile provider = selectProvider(travelPackage);

        Ticket ticket = new Ticket();
        ticket.setTicketNumber(generateTicketNumber());
        ticket.setCustomer(customer);
        ticket.setTravelPackage(travelPackage);
        ticket.setProvider(provider);
        ticket.setCarType(request.carType());
        ticket.setTravellersCount(request.travellersCount());
        ticket.setTravellersDetails(toJson(request.travellers()));
        ticket.setSpecialRequests(request.specialRequests());
        ticket.setPickupLocation(request.pickupLocation());
        ticket.setPickupDate(request.pickupDate());
        ticket.setPickupTime(request.pickupTime());
        ticket.setPaymentReference(request.paymentReference());
        ticket.setProviderMobileSnapshot(provider.getUser().getMobile());
        ticket.setCarPhotoUrl(travelPackage.getCarPhotoUrl());
        ticket.setCarNumber(travelPackage.getCarNumber());
        ticket.setCarModel(travelPackage.getCarModel());
        ticket.setCarColor(travelPackage.getCarColor());
        ticket.setMaskedCustomerRef(maskedReference());
        ticket.setStatus(TicketStatus.ASSIGNED);
        Ticket saved = ticketRepository.save(ticket);
        travelPackage.setAvailabilityStatus("BOOKED");
        travelPackage.setFeatured(false);
        travelPackage.touch();
        travelPackageRepository.save(travelPackage);
        auditService.recordAccessDecision(customerId, "CUSTOMER", "PAYMENT_COMPLETED", saved.getId(), "Customer payment completed for booking");
        auditService.recordAccessDecision(customerId, "CUSTOMER", "BOOKING_BOOKED", saved.getId(), "Customer booked package");
        auditService.recordAccessDecision(customerId, "SYSTEM", "BOOKING_ASSIGNED", saved.getId(), "Ticket assigned to provider");
        ticketEmailService.sendTicket(saved);
        return toCustomerTicket(saved, true);
    }

    @Transactional(readOnly = true)
    public TicketDTO customerTicket(UUID customerId, UUID ticketId) {
        Ticket ticket = ticketRepository.findByIdAndCustomerId(ticketId, customerId)
                .orElseThrow(() -> new BusinessRuleException("TICKET_NOT_FOUND", "Ticket not found."));
        return toCustomerTicket(ticket, false);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> customerTickets(UUID customerId) {
        return ticketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(ticket -> toCustomerTicket(ticket, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProviderTicketDTO> providerTickets(UUID providerUserId) {
        return ticketRepository.findByProvider_User_IdOrderByCreatedAtDesc(providerUserId).stream()
                .map(this::toProviderTicket)
                .toList();
    }

    @Transactional
    public ProviderTicketDTO startJourney(UUID providerUserId, UUID ticketId) {
        Ticket ticket = providerTicketForUpdate(providerUserId, ticketId);
        if (ticket.getStatus() != TicketStatus.ASSIGNED && ticket.getStatus() != TicketStatus.BOOKED) {
            throw new BusinessRuleException("JOURNEY_NOT_STARTABLE", "Journey can be started only for assigned tickets.");
        }
        TicketStatus previous = ticket.getStatus();
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setJourneyStartedAt(Instant.now());
        ticket.touch();
        auditService.recordAccessDecision(providerUserId, "PROVIDER", "JOURNEY_STARTED", ticket.getId(), previous + " -> " + ticket.getStatus());
        return toProviderTicket(ticket);
    }

    @Transactional
    public ProviderTicketDTO updateProviderLocation(UUID providerUserId, UUID ticketId, LocationUpdateRequest request) {
        Ticket ticket = providerTicketForUpdate(providerUserId, ticketId);
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS && ticket.getStatus() != TicketStatus.COMPLETION_OTP_PENDING) {
            throw new BusinessRuleException("LOCATION_NOT_ALLOWED", "Location can be updated only while the journey is active.");
        }
        ticket.setProviderLatitude(request.latitude().trim());
        ticket.setProviderLongitude(request.longitude().trim());
        ticket.setProviderLocationUpdatedAt(Instant.now());
        ticket.touch();
        return toProviderTicket(ticket);
    }

    @Transactional
    public CompletionOtpResponse requestCompletionOtp(UUID providerUserId, UUID ticketId) {
        Ticket ticket = providerTicketForUpdate(providerUserId, ticketId);
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new BusinessRuleException("OTP_NOT_ALLOWED", "Completion OTP can be requested only for an active journey.");
        }
        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        Instant expiresAt = Instant.now().plusSeconds(600);
        ticket.setCompletionOtp(otp);
        ticket.setCompletionOtpExpiresAt(expiresAt);
        ticket.setStatus(TicketStatus.COMPLETION_OTP_PENDING);
        ticket.touch();
        auditService.recordAccessDecision(providerUserId, "PROVIDER", "COMPLETION_OTP_REQUESTED", ticket.getId(), "OTP generated for customer verification");
        return new CompletionOtpResponse(true, expiresAt, "Share this OTP with the customer to complete the journey.", otp);
    }

    @Transactional
    public TicketDTO verifyCompletionOtp(UUID customerId, UUID ticketId, String otp) {
        Ticket ticket = ticketRepository.findByIdAndCustomerId(ticketId, customerId)
                .orElseThrow(() -> new BusinessRuleException("TICKET_NOT_FOUND", "Ticket not found."));
        if (ticket.getStatus() != TicketStatus.COMPLETION_OTP_PENDING) {
            throw new BusinessRuleException("OTP_NOT_PENDING", "No completion OTP is pending for this journey.");
        }
        if (ticket.getCompletionOtpExpiresAt() == null || ticket.getCompletionOtpExpiresAt().isBefore(Instant.now())) {
            throw new BusinessRuleException("OTP_EXPIRED", "Completion OTP expired. Ask the provider to generate a new OTP.");
        }
        if (ticket.getCompletionOtp() == null || !ticket.getCompletionOtp().equals(otp.trim())) {
            throw new BusinessRuleException("OTP_INVALID", "Completion OTP is incorrect.");
        }
        ticket.setStatus(TicketStatus.COMPLETED);
        ticket.setCompletedAt(Instant.now());
        ticket.setCompletionOtp(null);
        ticket.touch();
        auditService.recordAccessDecision(customerId, "CUSTOMER", "JOURNEY_COMPLETED", ticket.getId(), "Customer verified completion OTP");
        return toCustomerTicket(ticket, false);
    }

    @Transactional(readOnly = true)
    public TicketDTO adminTicket(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessRuleException("TICKET_NOT_FOUND", "Ticket not found."));
        return toCustomerTicket(ticket, true);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> adminTickets() {
        return ticketRepository.findAll().stream().map(ticket -> toCustomerTicket(ticket, true)).toList();
    }

    private Ticket providerTicketForUpdate(UUID providerUserId, UUID ticketId) {
        return ticketRepository.findByIdAndProvider_User_Id(ticketId, providerUserId)
                .orElseThrow(() -> new BusinessRuleException("TICKET_NOT_FOUND", "Provider ticket not found."));
    }

    private void validateBooking(BookingRequestDTO request) {
        if (request.travellers() == null || request.travellers().size() != request.travellersCount()) {
            throw new BusinessRuleException("INVALID_TRAVELLERS", "Traveller details must match traveller count.");
        }
        if (request.travellersCount() > 4 && request.carType() == CarType.FOUR_SEATER) {
            throw new BusinessRuleException("INVALID_CAR_TYPE", "4-seater is not available for more than 4 travellers.");
        }
    }

    private void validatePickupAvailability(TravelPackage travelPackage, String pickupTime) {
        if (!"SPECIFIC".equalsIgnoreCase(travelPackage.getPickupAvailabilityMode())) {
            return;
        }
        if (travelPackage.getPickupStartTime() == null || travelPackage.getPickupEndTime() == null) {
            return;
        }
        try {
            LocalTime requested = LocalTime.parse(pickupTime);
            LocalTime start = LocalTime.parse(travelPackage.getPickupStartTime());
            LocalTime end = LocalTime.parse(travelPackage.getPickupEndTime());
            boolean allowed = start.equals(end)
                    || (start.isBefore(end)
                    ? !requested.isBefore(start) && !requested.isAfter(end)
                    : !requested.isBefore(start) || !requested.isAfter(end));
            if (!allowed) {
                throw new BusinessRuleException("PICKUP_TIME_UNAVAILABLE",
                        "Provider pickup time is available between " + travelPackage.getPickupStartTime() + " and " + travelPackage.getPickupEndTime() + ".");
            }
        } catch (DateTimeParseException exception) {
            throw new BusinessRuleException("INVALID_PICKUP_TIME", "Pickup time is invalid.");
        }
    }

    private ProviderProfile selectProvider(TravelPackage travelPackage) {
        if (travelPackage.getSourceProvider() != null
                && "APPROVED".equals(travelPackage.getSourceProvider().getVerificationStatus())
                && !travelPackage.getSourceProvider().isSuspended()) {
            return travelPackage.getSourceProvider();
        }
        return providerProfileRepository.findFirstByVerificationStatusAndSuspendedFalseOrderByCreatedAtAsc("APPROVED")
                .orElseThrow(() -> new BusinessRuleException("PROVIDER_NOT_FOUND", "No approved provider is available for this package."));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new BusinessRuleException("INVALID_TRAVELLERS", "Traveller details could not be processed.");
        }
    }

    private String generateTicketNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String ticketNumber;
        do {
            ticketNumber = "TKT-" + date + "-" + randomToken(4);
        } while (ticketRepository.existsByTicketNumber(ticketNumber));
        return ticketNumber;
    }

    private String maskedReference() {
        return "CHR-" + randomToken(10);
    }

    private String randomToken(int bytes) {
        byte[] buffer = new byte[bytes];
        secureRandom.nextBytes(buffer);
        return HexFormat.of().formatHex(buffer).toUpperCase();
    }

    private TicketDTO toCustomerTicket(Ticket ticket, boolean includeAdminOnly) {
        TravelPackage pack = ticket.getTravelPackage();
        ProviderProfile provider = ticket.getProvider();
        AppUser providerUser = provider.getUser();
        AppUser customer = ticket.getCustomer();
        return new TicketDTO(ticket.getId(), ticket.getTicketNumber(), pack.getId(), pack.getTitle(), pack.getDestination(),
                pack.getDestination(), ticket.getTravellersCount(), ticket.getCarType(), carDetails(ticket.getCarType()),
                ticket.getCarPhotoUrl(), ticket.getCarNumber(), ticket.getCarModel(), ticket.getCarColor(),
                ticket.getSpecialRequests(), ticket.getPickupLocation(),
                ticket.getPickupDate() == null ? null : ticket.getPickupDate().toString(), ticket.getPickupTime(), ticket.getPaymentReference(),
                ticket.getStatus(), provider.getBusinessName(), ticket.getProviderMobileSnapshot() == null ? providerUser.getMobile() : ticket.getProviderMobileSnapshot(),
                includeAdminOnly ? customer.getFullName() : null,
                includeAdminOnly ? customer.getEmail() : null,
                includeAdminOnly ? customer.getMobile() : null,
                includeAdminOnly ? ticket.getTravellersDetails() : null,
                ticket.getProviderLatitude(), ticket.getProviderLongitude(), ticket.getProviderLocationUpdatedAt(),
                ticket.getJourneyStartedAt(), ticket.getCompletionOtpExpiresAt(), ticket.getCompletedAt(),
                ticket.getCreatedAt());
    }

    private ProviderTicketDTO toProviderTicket(Ticket ticket) {
        TravelPackage pack = ticket.getTravelPackage();
        return new ProviderTicketDTO(ticket.getId(), ticket.getTicketNumber(), pack.getTitle(), pack.getDestination(),
                pack.getDestination(), ticket.getTravellersCount(), ticket.getCarType(), ticket.getCarPhotoUrl(),
                ticket.getCarNumber(), ticket.getCarModel(), ticket.getCarColor(), ticket.getSpecialRequests(),
                ticket.getPickupLocation(), ticket.getPickupDate() == null ? null : ticket.getPickupDate().toString(), ticket.getPickupTime(),
                ticket.getMaskedCustomerRef(), ticket.getStatus(), ticket.getProviderLatitude(), ticket.getProviderLongitude(),
                ticket.getProviderLocationUpdatedAt(), ticket.getJourneyStartedAt(), ticket.getCompletionOtpExpiresAt(),
                ticket.getCompletedAt(), ticket.getCreatedAt());
    }

    private String carDetails(CarType carType) {
        return carType == CarType.FOUR_SEATER ? "4-seater private car" : "6-seater private car";
    }
}
