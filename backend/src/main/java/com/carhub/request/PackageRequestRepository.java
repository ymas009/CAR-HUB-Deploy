package com.carhub.request;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PackageRequestRepository extends JpaRepository<PackageRequest, UUID> {
    List<PackageRequest> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<PackageRequest> findAllByOrderByCreatedAtDesc();
}
