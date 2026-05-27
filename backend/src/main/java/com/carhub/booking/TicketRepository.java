package com.carhub.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    boolean existsByTicketNumber(String ticketNumber);
    boolean existsByCustomerIdAndTravelPackageId(UUID customerId, UUID packageId);
    boolean existsByTravelPackageId(UUID packageId);
    long countByCustomerId(UUID customerId);
    long countByProvider_User_Id(UUID providerUserId);
    long countByStatus(TicketStatus status);
    long countByStatusIn(List<TicketStatus> statuses);
    List<Ticket> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<Ticket> findByProvider_User_IdOrderByCreatedAtDesc(UUID providerUserId);
    Optional<Ticket> findByIdAndCustomerId(UUID id, UUID customerId);
    Optional<Ticket> findByIdAndProvider_User_Id(UUID id, UUID providerUserId);

    @Query("select coalesce(sum(t.travelPackage.startingPrice), 0) from Ticket t where t.status = 'COMPLETED'")
    long sumRevenueFromCompleted();
}
