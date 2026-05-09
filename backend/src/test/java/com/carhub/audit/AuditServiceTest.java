package com.carhub.audit;

import com.carhub.domain.RequestStatus;
import com.carhub.user.AppUserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditServiceTest {
    @Test
    void workflowTransitionPersistsAuditLog() {
        AuditLogRepository auditLogRepository = mock(AuditLogRepository.class);
        AppUserRepository appUserRepository = mock(AppUserRepository.class);
        when(appUserRepository.findById(any())).thenReturn(Optional.empty());

        AuditService service = new AuditService(auditLogRepository, appUserRepository);
        service.recordWorkflowTransition(UUID.randomUUID(), "ADMIN", "PACKAGE_REQUEST", UUID.randomUUID(),
                RequestStatus.UNDER_REVIEW, RequestStatus.APPROVED_BY_COMPANY, "Feasible");

        verify(auditLogRepository).save(any(AuditLog.class));
    }
}
