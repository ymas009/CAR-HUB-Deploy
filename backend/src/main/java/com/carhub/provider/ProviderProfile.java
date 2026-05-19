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

    @Column(name = "pin_code")
    private String pinCode;

    private String latitude;

    private String longitude;

    @Column(name = "service_locations")
    private String serviceLocations;

    private String categories;

    @Column(name = "rc_number")
    private String rcNumber;

    @Column(name = "rc_document_image", columnDefinition = "TEXT")
    private String rcDocumentImage;

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
    public String getBusinessAddress() { return businessAddress; }
    public void setBusinessAddress(String businessAddress) { this.businessAddress = businessAddress; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public String getLatitude() { return latitude; }
    public void setLatitude(String latitude) { this.latitude = latitude; }
    public String getLongitude() { return longitude; }
    public void setLongitude(String longitude) { this.longitude = longitude; }
    public String getRcNumber() { return rcNumber; }
    public void setRcNumber(String rcNumber) { this.rcNumber = rcNumber; }
    public String getRcDocumentImage() { return rcDocumentImage; }
    public void setRcDocumentImage(String rcDocumentImage) { this.rcDocumentImage = rcDocumentImage; }
    public String getServiceLocations() { return serviceLocations; }
    public void setServiceLocations(String serviceLocations) { this.serviceLocations = serviceLocations; }
    public String getCategories() { return categories; }
    public void setCategories(String categories) { this.categories = categories; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public BigDecimal getQualityScore() { return qualityScore; }
    public void setQualityScore(BigDecimal qualityScore) { this.qualityScore = qualityScore; }
    public int getComplaintCount() { return complaintCount; }
    public void setComplaintCount(int complaintCount) { this.complaintCount = complaintCount; }
    public boolean isSuspended() { return suspended; }
    public void setSuspended(boolean suspended) { this.suspended = suspended; }
    public LocalDate getDocumentExpiryDate() { return documentExpiryDate; }
    public void setDocumentExpiryDate(LocalDate documentExpiryDate) { this.documentExpiryDate = documentExpiryDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void touch() { this.updatedAt = Instant.now(); }
}
