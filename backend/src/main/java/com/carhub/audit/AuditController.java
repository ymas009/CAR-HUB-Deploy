package com.carhub.audit;

import com.carhub.audit.dto.AuditLogResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit")
public class AuditController {
    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    List<AuditLogResponse> latest() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(log -> new AuditLogResponse(log.getId(),
                        log.getActor() == null ? null : log.getActor().getId(),
                        log.getActorRole(),
                        log.getEntityType(),
                        log.getEntityId(),
                        log.getAction(),
                        log.getPreviousState(),
                        log.getNewState(),
                        log.getReason(),
                        log.getCreatedAt()))
                .toList();
    }
}
