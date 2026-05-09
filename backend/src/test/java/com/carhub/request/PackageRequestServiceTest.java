package com.carhub.request;

import com.carhub.admin.dto.ProviderShareRequest;
import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.provider.ProviderAssignmentRepository;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.provider.ProviderSharedPayloadRepository;
import com.carhub.user.AppUserRepository;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class PackageRequestServiceTest {
    private final PackageRequestService service = new PackageRequestService(
            mock(AuditService.class),
            mock(AppUserRepository.class),
            mock(TravelPackageRepository.class),
            mock(PackageRequestRepository.class),
            mock(ProviderProfileRepository.class),
            mock(ProviderAssignmentRepository.class),
            mock(ProviderSharedPayloadRepository.class)
    );

    @Test
    void providerShareRequiresExplicitVisibleFieldsAndMaskedPayload() {
        ProviderShareRequest request = new ProviderShareRequest(
                UUID.randomUUID(),
                Set.of(),
                Map.of(),
                "Execution only",
                null
        );

        assertThrows(BusinessRuleException.class,
                () -> service.approveAndShareWithProvider(UUID.randomUUID(), UUID.randomUUID(), request));
    }
}
