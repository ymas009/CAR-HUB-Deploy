package com.carhub.audit;

import com.carhub.domain.RequestStatus;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;
    private final AppUserRepository appUserRepository;

    public AuditService(AuditLogRepository auditLogRepository, AppUserRepository appUserRepository) {
        this.auditLogRepository = auditLogRepository;
        this.appUserRepository = appUserRepository;
    }

    public AuditLog recordWorkflowTransition(UUID actorId, String actorRole, String entityType, UUID entityId,
                                         RequestStatus previousState, RequestStatus newState, String reason) {
        AuditLog log = base(actorId, actorRole, entityType, entityId, "WORKFLOW_TRANSITION", reason);
        log.setPreviousState(previousState == null ? null : previousState.name());
        log.setNewState(newState == null ? null : newState.name());
        return auditLogRepository.save(log);
    }

    public AuditLog recordAccessDecision(UUID actorId, String actorRole, String action, UUID entityId, String reason) {
        return auditLogRepository.save(base(actorId, actorRole, "PACKAGE_REQUEST", entityId, action, reason));
    }

    public AuditLog recordCatalogAction(UUID actorId, String actorRole, String action, UUID packageId,
                                        String previousState, String newState, String reason) {
        AuditLog log = base(actorId, actorRole, "TRAVEL_PACKAGE", packageId, action, reason);
        log.setPreviousState(previousState);
        log.setNewState(newState);
        return auditLogRepository.save(log);
    }

    public AuditLog recordContentAction(UUID actorId, String actorRole, String action, UUID contentId,
                                        String previousState, String newState, String reason) {
        AuditLog log = base(actorId, actorRole, "CONTENT_PAGE", contentId, action, reason);
        log.setPreviousState(previousState);
        log.setNewState(newState);
        return auditLogRepository.save(log);
    }

    private AuditLog base(UUID actorId, String actorRole, String entityType, UUID entityId, String action, String reason) {
        AuditLog log = new AuditLog();
        AppUser actor = appUserRepository.findById(actorId).orElse(null);
        log.setActor(actor);
        log.setActorRole(actorRole);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setAction(action);
        log.setReason(reason);
        return log;
    }
}
