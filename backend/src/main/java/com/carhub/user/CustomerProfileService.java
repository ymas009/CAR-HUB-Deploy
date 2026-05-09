package com.carhub.user;

import com.carhub.common.BusinessRuleException;
import com.carhub.user.dto.CustomerProfileRequest;
import com.carhub.user.dto.CustomerProfileResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CustomerProfileService {
    private final CustomerProfileRepository customerProfileRepository;
    private final AppUserRepository appUserRepository;

    public CustomerProfileService(CustomerProfileRepository customerProfileRepository, AppUserRepository appUserRepository) {
        this.customerProfileRepository = customerProfileRepository;
        this.appUserRepository = appUserRepository;
    }

    public CustomerProfileResponse get(UUID userId) {
        return customerProfileRepository.findByUserId(userId).map(this::toResponse)
                .orElseGet(() -> new CustomerProfileResponse(null, null, null, null, null, null, false));
    }

    @Transactional
    public CustomerProfileResponse update(UUID userId, CustomerProfileRequest request) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userId).orElseGet(() -> {
            AppUser user = appUserRepository.findById(userId)
                    .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "User not found."));
            CustomerProfile created = new CustomerProfile();
            created.setUser(user);
            created.setConsentTerms(true);
            created.setConsentPrivacy(true);
            created.setConsentControlledDataSharing(true);
            return created;
        });
        profile.setCity(request.city());
        profile.setState(request.state());
        profile.setCountry(request.country());
        profile.setPreferredTravelType(request.preferredTravelType());
        profile.setEmergencyContactName(request.emergencyContactName());
        profile.setEmergencyContactMobile(request.emergencyContactMobile());
        profile.setProfileCompleted(request.city() != null && request.country() != null && request.emergencyContactMobile() != null);
        profile.touch();
        return toResponse(customerProfileRepository.save(profile));
    }

    private CustomerProfileResponse toResponse(CustomerProfile profile) {
        return new CustomerProfileResponse(profile.getCity(), profile.getState(), profile.getCountry(),
                profile.getPreferredTravelType(), profile.getEmergencyContactName(),
                profile.getEmergencyContactMobile(), profile.isProfileCompleted());
    }
}
