package com.carhub.admin;

import com.carhub.booking.TicketRepository;
import com.carhub.booking.TicketStatus;
import com.carhub.packagecatalog.TravelPackageRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/stats")
public class AdminStatsController {

    private final TravelPackageRepository packageRepo;
    private final TicketRepository ticketRepo;

    public AdminStatsController(TravelPackageRepository packageRepo, TicketRepository ticketRepo) {
        this.packageRepo = packageRepo;
        this.ticketRepo = ticketRepo;
    }

    record AdminStatsResponse(
        long totalPackages,
        long availablePackages,
        long pendingReview,
        long activeBookings,
        long completedTrips,
        long totalRevenue
    ) {}

    @GetMapping
    AdminStatsResponse stats() {
        long totalPackages = packageRepo.count();
        long availablePackages = packageRepo.findByAvailabilityStatusOrderByFeaturedDescTitleAsc("AVAILABLE").size();
        long pendingReview = packageRepo.findByAvailabilityStatusOrderByCreatedAtDesc("PENDING_ADMIN_REVIEW").size();
        long activeBookings = ticketRepo.countByStatusIn(List.of(
            TicketStatus.BOOKED, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS
        ));
        long completedTrips = ticketRepo.countByStatus(TicketStatus.COMPLETED);
        long totalRevenue = ticketRepo.sumRevenueFromCompleted();
        return new AdminStatsResponse(
            totalPackages, availablePackages, pendingReview,
            activeBookings, completedTrips, totalRevenue
        );
    }
}
