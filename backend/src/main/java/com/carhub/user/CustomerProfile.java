package com.carhub.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customer_profile")
public class CustomerProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    private String city;
    private String state;
    private String country;
    private String address;

    @Column(name = "pin_code")
    private String pinCode;

    private String latitude;
    private String longitude;

    @Column(name = "preferred_travel_type")
    private String preferredTravelType;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_mobile")
    private String emergencyContactMobile;

    @Column(name = "consent_terms", nullable = false)
    private boolean consentTerms;

    @Column(name = "consent_privacy", nullable = false)
    private boolean consentPrivacy;

    @Column(name = "consent_controlled_data_sharing", nullable = false)
    private boolean consentControlledDataSharing;

    @Column(name = "profile_completed", nullable = false)
    private boolean profileCompleted;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public String getLatitude() { return latitude; }
    public void setLatitude(String latitude) { this.latitude = latitude; }
    public String getLongitude() { return longitude; }
    public void setLongitude(String longitude) { this.longitude = longitude; }
    public String getPreferredTravelType() { return preferredTravelType; }
    public void setPreferredTravelType(String preferredTravelType) { this.preferredTravelType = preferredTravelType; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    public String getEmergencyContactMobile() { return emergencyContactMobile; }
    public void setEmergencyContactMobile(String emergencyContactMobile) { this.emergencyContactMobile = emergencyContactMobile; }
    public boolean isConsentTerms() { return consentTerms; }
    public void setConsentTerms(boolean consentTerms) { this.consentTerms = consentTerms; }
    public boolean isConsentPrivacy() { return consentPrivacy; }
    public void setConsentPrivacy(boolean consentPrivacy) { this.consentPrivacy = consentPrivacy; }
    public boolean isConsentControlledDataSharing() { return consentControlledDataSharing; }
    public void setConsentControlledDataSharing(boolean consentControlledDataSharing) { this.consentControlledDataSharing = consentControlledDataSharing; }
    public boolean isProfileCompleted() { return profileCompleted; }
    public void setProfileCompleted(boolean profileCompleted) { this.profileCompleted = profileCompleted; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void touch() { this.updatedAt = Instant.now(); }
}
