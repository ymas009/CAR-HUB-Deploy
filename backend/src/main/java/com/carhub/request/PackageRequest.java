package com.carhub.request;

import com.carhub.domain.RequestStatus;
import com.carhub.packagecatalog.TravelPackage;
import com.carhub.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "package_request")
public class PackageRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private TravelPackage travelPackage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.REQUEST_SUBMITTED;

    @Column(nullable = false)
    private String destination;

    @Column(name = "current_location", nullable = false)
    private String currentLocation;

    @Column(name = "travelers_count", nullable = false)
    private int travelersCount;

    @Column(name = "travel_start_date", nullable = false)
    private LocalDate travelStartDate;

    @Column(name = "travel_end_date", nullable = false)
    private LocalDate travelEndDate;

    @Column(name = "budget_min")
    private BigDecimal budgetMin;

    @Column(name = "budget_max")
    private BigDecimal budgetMax;

    @Column(name = "trip_type", nullable = false)
    private String tripType;

    @Column(name = "special_requirements")
    private String specialRequirements;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_mobile")
    private String emergencyContactMobile;

    @Column(name = "admin_internal_notes")
    private String adminInternalNotes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public AppUser getCustomer() { return customer; }
    public void setCustomer(AppUser customer) { this.customer = customer; }
    public TravelPackage getTravelPackage() { return travelPackage; }
    public void setTravelPackage(TravelPackage travelPackage) { this.travelPackage = travelPackage; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; this.updatedAt = Instant.now(); }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }
    public int getTravelersCount() { return travelersCount; }
    public void setTravelersCount(int travelersCount) { this.travelersCount = travelersCount; }
    public LocalDate getTravelStartDate() { return travelStartDate; }
    public void setTravelStartDate(LocalDate travelStartDate) { this.travelStartDate = travelStartDate; }
    public LocalDate getTravelEndDate() { return travelEndDate; }
    public void setTravelEndDate(LocalDate travelEndDate) { this.travelEndDate = travelEndDate; }
    public BigDecimal getBudgetMin() { return budgetMin; }
    public void setBudgetMin(BigDecimal budgetMin) { this.budgetMin = budgetMin; }
    public BigDecimal getBudgetMax() { return budgetMax; }
    public void setBudgetMax(BigDecimal budgetMax) { this.budgetMax = budgetMax; }
    public String getTripType() { return tripType; }
    public void setTripType(String tripType) { this.tripType = tripType; }
    public String getSpecialRequirements() { return specialRequirements; }
    public void setSpecialRequirements(String specialRequirements) { this.specialRequirements = specialRequirements; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    public String getEmergencyContactMobile() { return emergencyContactMobile; }
    public void setEmergencyContactMobile(String emergencyContactMobile) { this.emergencyContactMobile = emergencyContactMobile; }
    public String getAdminInternalNotes() { return adminInternalNotes; }
    public void setAdminInternalNotes(String adminInternalNotes) { this.adminInternalNotes = adminInternalNotes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
