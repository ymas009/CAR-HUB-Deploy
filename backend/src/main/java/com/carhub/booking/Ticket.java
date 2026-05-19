package com.carhub.booking;

import com.carhub.packagecatalog.TravelPackage;
import com.carhub.provider.ProviderProfile;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tickets")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_number", nullable = false, unique = true)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private TravelPackage travelPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "car_type", nullable = false)
    private CarType carType;

    @Column(name = "travellers_count", nullable = false)
    private int travellersCount;

    @Column(name = "travellers_details", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String travellersDetails;

    @Column(name = "special_requests")
    private String specialRequests;

    @Column(name = "pickup_location")
    private String pickupLocation;

    @Column(name = "pickup_date")
    private java.time.LocalDate pickupDate;

    @Column(name = "pickup_time")
    private String pickupTime;

    @Column(name = "payment_reference")
    private String paymentReference;

    @Column(name = "provider_mobile_snapshot")
    private String providerMobileSnapshot;

    @Column(name = "car_photo_url")
    private String carPhotoUrl;

    @Column(name = "car_number")
    private String carNumber;

    @Column(name = "car_model")
    private String carModel;

    @Column(name = "car_color")
    private String carColor;

    @Column(name = "masked_customer_ref", nullable = false)
    private String maskedCustomerRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.BOOKED;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
    public AppUser getCustomer() { return customer; }
    public void setCustomer(AppUser customer) { this.customer = customer; }
    public TravelPackage getTravelPackage() { return travelPackage; }
    public void setTravelPackage(TravelPackage travelPackage) { this.travelPackage = travelPackage; }
    public ProviderProfile getProvider() { return provider; }
    public void setProvider(ProviderProfile provider) { this.provider = provider; }
    public CarType getCarType() { return carType; }
    public void setCarType(CarType carType) { this.carType = carType; }
    public int getTravellersCount() { return travellersCount; }
    public void setTravellersCount(int travellersCount) { this.travellersCount = travellersCount; }
    public String getTravellersDetails() { return travellersDetails; }
    public void setTravellersDetails(String travellersDetails) { this.travellersDetails = travellersDetails; }
    public String getSpecialRequests() { return specialRequests; }
    public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }
    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }
    public java.time.LocalDate getPickupDate() { return pickupDate; }
    public void setPickupDate(java.time.LocalDate pickupDate) { this.pickupDate = pickupDate; }
    public String getPickupTime() { return pickupTime; }
    public void setPickupTime(String pickupTime) { this.pickupTime = pickupTime; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public String getProviderMobileSnapshot() { return providerMobileSnapshot; }
    public void setProviderMobileSnapshot(String providerMobileSnapshot) { this.providerMobileSnapshot = providerMobileSnapshot; }
    public String getCarPhotoUrl() { return carPhotoUrl; }
    public void setCarPhotoUrl(String carPhotoUrl) { this.carPhotoUrl = carPhotoUrl; }
    public String getCarNumber() { return carNumber; }
    public void setCarNumber(String carNumber) { this.carNumber = carNumber; }
    public String getCarModel() { return carModel; }
    public void setCarModel(String carModel) { this.carModel = carModel; }
    public String getCarColor() { return carColor; }
    public void setCarColor(String carColor) { this.carColor = carColor; }
    public String getMaskedCustomerRef() { return maskedCustomerRef; }
    public void setMaskedCustomerRef(String maskedCustomerRef) { this.maskedCustomerRef = maskedCustomerRef; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void touch() { this.updatedAt = Instant.now(); }
}
