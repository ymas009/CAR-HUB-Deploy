package com.carhub.admin;

import com.carhub.provider.ProviderProfileRepository;
import com.carhub.provider.dto.ProviderProfileResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/providers")
public class AdminProviderController {
    private final ProviderProfileRepository providerProfileRepository;

    public AdminProviderController(ProviderProfileRepository providerProfileRepository) {
        this.providerProfileRepository = providerProfileRepository;
    }

    @GetMapping
    List<ProviderProfileResponse> list() {
        return providerProfileRepository.findAll().stream()
                .map(provider -> new ProviderProfileResponse(provider.getId(), provider.getBusinessName(),
                        provider.getContactPerson(), provider.getVerificationStatus(), provider.isSuspended()))
                .toList();
    }
}
