package com.carhub.admin;

import com.carhub.admin.dto.AdminProviderOverviewResponse;
import com.carhub.admin.dto.AdminProviderUpdateRequest;
import com.carhub.booking.TicketRepository;
import com.carhub.common.BusinessRuleException;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/providers")
public class AdminProviderController {
    private final ProviderProfileRepository providerProfileRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final TicketRepository ticketRepository;

    public AdminProviderController(ProviderProfileRepository providerProfileRepository,
                                   TravelPackageRepository travelPackageRepository,
                                   TicketRepository ticketRepository) {
        this.providerProfileRepository = providerProfileRepository;
        this.travelPackageRepository = travelPackageRepository;
        this.ticketRepository = ticketRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    List<AdminProviderOverviewResponse> list() {
        return providerProfileRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @PutMapping("/{providerId}")
    @Transactional
    AdminProviderOverviewResponse update(@PathVariable UUID providerId, @Valid @RequestBody AdminProviderUpdateRequest request) {
        ProviderProfile provider = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new BusinessRuleException("PROVIDER_NOT_FOUND", "Provider profile was not found."));
        provider.setVerificationStatus(request.verificationStatus());
        provider.setSuspended(request.suspended());
        if (request.qualityScore() != null) {
            provider.setQualityScore(request.qualityScore());
        }
        provider.touch();
        return toResponse(providerProfileRepository.save(provider));
    }

    private AdminProviderOverviewResponse toResponse(ProviderProfile provider) {
        return new AdminProviderOverviewResponse(provider.getId(), provider.getUser().getId(),
                provider.getBusinessName(), provider.getContactPerson(), provider.getUser().getEmail(),
                provider.getUser().getMobile(), provider.getBusinessAddress(), provider.getPinCode(),
                provider.getServiceLocations(), provider.getCategories(), provider.getRcNumber(),
                provider.getRcDocumentImage() != null && !provider.getRcDocumentImage().isBlank(),
                provider.getVerificationStatus(), provider.isSuspended(), provider.getQualityScore(),
                provider.getComplaintCount(), provider.getDocumentExpiryDate(),
                travelPackageRepository.countBySourceProvider_User_Id(provider.getUser().getId()),
                ticketRepository.countByProvider_User_Id(provider.getUser().getId()),
                provider.getCreatedAt(), provider.getUpdatedAt());
    }
}
