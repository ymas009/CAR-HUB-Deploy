package com.carhub.provider;

import com.carhub.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "provider_profile")
public class ProviderProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "contact_person", nullable = false)
    private String contactPerson;

    @Column(name = "business_address")
    private String businessAddress;

    @Column(name = "service_locations")
    private String serviceLocations;

    private String categories;

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus = "APPROVED";

    @Column(name = "quality_score")
    private BigDecimal qualityScore = BigDecimal.ZERO;

    @Column(name = "complaint_count", nullable = false)
    private int complaintCount;

    private boolean suspended;

    @Column(name = "document_expiry_date")
    private LocalDate documentExpiryDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public boolean isSuspended() { return suspended; }
    public void setSuspended(boolean suspended) { this.suspended = suspended; }
}
