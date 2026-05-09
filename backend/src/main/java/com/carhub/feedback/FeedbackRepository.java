package com.carhub.feedback;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
    boolean existsByRequestIdAndCustomerId(UUID requestId, UUID customerId);
    List<Feedback> findAllByOrderByCreatedAtDesc();
}
