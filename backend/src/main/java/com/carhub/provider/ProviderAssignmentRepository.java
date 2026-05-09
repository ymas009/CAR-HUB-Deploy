package com.carhub.provider;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProviderAssignmentRepository extends JpaRepository<ProviderAssignment, UUID> {
    List<ProviderAssignment> findByProvider_User_IdAndRevokedAtIsNullOrderByAssignedAtDesc(UUID userId);
}
