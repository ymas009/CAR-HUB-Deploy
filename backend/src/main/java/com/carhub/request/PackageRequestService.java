package com.carhub.request;

import com.carhub.admin.dto.AdminReviewRequest;
import com.carhub.admin.dto.ProviderShareRequest;
import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.domain.RequestStatus;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.provider.ProviderAssignment;
import com.carhub.provider.ProviderAssignmentRepository;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.provider.ProviderSharedPayload;
import com.carhub.provider.ProviderSharedPayloadRepository;
import com.carhub.request.dto.CreatePackageRequest;
import com.carhub.request.dto.PackageRequestResponse;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PackageRequestService {
    private final AuditService auditService;
    private final AppUserRepository appUserRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final PackageRequestRepository packageRequestRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderAssignmentRepository providerAssignmentRepository;
    private final ProviderSharedPayloadRepository providerSharedPayloadRepository;

    public PackageRequestService(AuditService auditService, AppUserRepository appUserRepository,
                                 TravelPackageRepository travelPackageRepository,
                                 PackageRequestRepository packageRequestRepository,
                                 ProviderProfileRepository providerProfileRepository,
                                 ProviderAssignmentRepository providerAssignmentRepository,
                                 ProviderSharedPayloadRepository providerSharedPayloadRepository) {
        this.auditService = auditService;
        this.appUserRepository = appUserRepository;
        this.travelPackageRepository = travelPackageRepository;
        this.packageRequestRepository = packageRequestRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.providerAssignmentRepository = providerAssignmentRepository;
        this.providerSharedPayloadRepository = providerSharedPayloadRepository;
    }

    @Transactional
    public PackageRequestResponse createCustomerRequest(UUID customerId, CreatePackageRequest request) {
        if (request.travelEndDate().isBefore(request.travelStartDate())) {
            throw new BusinessRuleException("INVALID_TRAVEL_DATES", "Travel end date cannot be before start date.");
        }
        AppUser customer = appUserRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("CUSTOMER_NOT_FOUND", "Customer not found."));
        PackageRequest entity = new PackageRequest();
        entity.setCustomer(customer);
        if (request.packageId() != null) {
            entity.setTravelPackage(travelPackageRepository.findById(request.packageId()).orElse(null));
        }
        entity.setDestination(request.destination());
        entity.setCurrentLocation(request.currentLocation());
        entity.setTravelersCount(request.travelersCount());
        entity.setTravelStartDate(request.travelStartDate());
        entity.setTravelEndDate(request.travelEndDate());
        entity.setBudgetMin(request.budgetMin());
        entity.setBudgetMax(request.budgetMax());
        entity.setTripType(request.tripType());
        entity.setSpecialRequirements(request.specialRequirements());
        entity.setEmergencyContactName(request.emergencyContactName());
        entity.setEmergencyContactMobile(request.emergencyContactMobile());
        PackageRequest saved = packageRequestRepository.save(entity);
        auditService.recordWorkflowTransition(customerId, "CUSTOMER", "PACKAGE_REQUEST", saved.getId(),
                RequestStatus.DRAFT, RequestStatus.REQUEST_SUBMITTED, "Customer submitted package request");
        return toResponse(saved);
    }

    public List<PackageRequestResponse> customerRequests(UUID customerId) {
        return packageRequestRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream().map(this::toResponse).toList();
    }

    public List<PackageRequestResponse> adminRequests() {
        return packageRequestRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PackageRequestResponse adminReview(UUID adminId, UUID requestId, AdminReviewRequest reviewRequest) {
        if (reviewRequest.decision() == RequestStatus.FORWARDED_TO_PROVIDER) {
            throw new BusinessRuleException("PROVIDER_FORWARD_REQUIRES_SHARE_SCOPE",
                    "Provider forwarding requires an explicit provider share payload.");
        }
        PackageRequest request = packageRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessRuleException("REQUEST_NOT_FOUND", "Request not found."));
        RequestStatus previous = request.getStatus();
        request.setStatus(reviewRequest.decision());
        request.setAdminInternalNotes(reviewRequest.adminNotes());
        PackageRequest saved = packageRequestRepository.save(request);
        auditService.recordWorkflowTransition(adminId, "ADMIN", "PACKAGE_REQUEST", requestId,
                previous, reviewRequest.decision(), reviewRequest.reason());
        return toResponse(saved);
    }

    @Transactional
    public UUID approveAndShareWithProvider(UUID adminId, UUID requestId, ProviderShareRequest shareRequest) {
        if (shareRequest.visibleFields().isEmpty() || shareRequest.maskedPayload().isEmpty()) {
            throw new BusinessRuleException("EMPTY_PROVIDER_SHARE_SCOPE", "Admin must select limited provider-visible data.");
        }
        AppUser admin = appUserRepository.findById(adminId)
                .orElseThrow(() -> new BusinessRuleException("ADMIN_NOT_FOUND", "Admin not found."));
        PackageRequest request = packageRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessRuleException("REQUEST_NOT_FOUND", "Request not found."));
        ProviderProfile provider = providerProfileRepository.findById(shareRequest.providerId())
                .orElseThrow(() -> new BusinessRuleException("PROVIDER_NOT_FOUND", "Provider not found."));
        if (!"APPROVED".equals(provider.getVerificationStatus()) || provider.isSuspended()) {
            throw new BusinessRuleException("PROVIDER_NOT_APPROVED", "Provider must be approved and active before assignment.");
        }
        RequestStatus previous = request.getStatus();
        request.setStatus(RequestStatus.FORWARDED_TO_PROVIDER);
        packageRequestRepository.save(request);

        ProviderAssignment assignment = new ProviderAssignment();
        assignment.setRequest(request);
        assignment.setProvider(provider);
        assignment.setAssignedBy(admin);
        assignment.setAccessExpiresAt(shareRequest.expiresAt());
        ProviderAssignment savedAssignment = providerAssignmentRepository.save(assignment);

        ProviderSharedPayload payload = new ProviderSharedPayload();
        payload.setAssignment(savedAssignment);
        payload.setApprovedBy(admin);
        payload.setVisibleFields(String.join(",", shareRequest.visibleFields()));
        payload.setMaskedPayload(shareRequest.maskedPayload().toString());
        payload.setPurpose(shareRequest.purpose());
        payload.setExpiresAt(shareRequest.expiresAt());
        providerSharedPayloadRepository.save(payload);

        auditService.recordAccessDecision(adminId, "ADMIN", "PROVIDER_PAYLOAD_SHARED", requestId,
                "Scoped provider payload created for assignment " + savedAssignment.getId());
        auditService.recordWorkflowTransition(adminId, "ADMIN", "PACKAGE_REQUEST", requestId,
                previous, RequestStatus.FORWARDED_TO_PROVIDER, shareRequest.purpose());
        return savedAssignment.getId();
    }

    private PackageRequestResponse toResponse(PackageRequest request) {
        return new PackageRequestResponse(request.getId(), request.getStatus(), request.getDestination(),
                request.getTravelersCount(), request.getTravelStartDate(), request.getTravelEndDate(),
                request.getTripType(), request.getCreatedAt());
    }
}
