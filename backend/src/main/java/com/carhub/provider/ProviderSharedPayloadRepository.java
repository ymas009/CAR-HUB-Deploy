package com.carhub.provider;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProviderSharedPayloadRepository extends JpaRepository<ProviderSharedPayload, UUID> {
    Optional<ProviderSharedPayload> findByAssignmentIdAndRevokedAtIsNull(UUID assignmentId);
}
