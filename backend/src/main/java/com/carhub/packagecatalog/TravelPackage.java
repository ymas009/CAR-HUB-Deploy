package com.carhub.packagecatalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.carhub.provider.ProviderProfile;
import com.carhub.user.AppUser;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "travel_package")
public class TravelPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String summary;

    @Column(nullable = false)
    private String description;

    @Column(name = "starting_price")
    private BigDecimal startingPrice;

    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    @Column(name = "price_per_km")
    private BigDecimal pricePerKm;

    @Column(name = "provider_payout")
    private BigDecimal providerPayout;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @Column(name = "availability_status", nullable = false)
    private String availabilityStatus = "AVAILABLE";

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "car_photo_url")
    private String carPhotoUrl;

    @Column(name = "local_places")
    private String localPlaces;

    @Column(name = "car_type")
    private String carType;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "license_holder_name")
    private String licenseHolderName;

    @Column(name = "license_details")
    private String licenseDetails;

    @Column(name = "license_document_url", columnDefinition = "TEXT")
    private String licenseDocumentUrl;

    @Column(name = "car_number")
    private String carNumber;

    @Column(name = "car_model")
    private String carModel;

    @Column(name = "car_color")
    private String carColor;

    @Column(name = "seats_available")
    private Integer seatsAvailable;

    @Column(name = "provider_notes")
    private String providerNotes;

    @Column(name = "pickup_availability_mode")
    private String pickupAvailabilityMode = "ALWAYS";

    @Column(name = "pickup_start_time")
    private String pickupStartTime;

    @Column(name = "pickup_end_time")
    private String pickupEndTime;

    private boolean featured;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_provider_id")
    private ProviderProfile sourceProvider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private AppUser submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private AppUser reviewedBy;

    @Column(name = "review_notes")
    private String reviewNotes;

    @Column(name = "rc_number")
    private String rcNumber;

    @Column(name = "rc_document_url", columnDefinition = "TEXT")
    private String rcDocumentUrl;

    @Column(name = "reposted_from_id")
    private UUID repostedFromId;

    @Column(name = "region")
    private String region;

    @Column(name = "route_order", columnDefinition = "TEXT")
    private String routeOrder;

    @Column(name = "total_distance_km")
    private Integer totalDistanceKm;

    @Column(name = "sub_places", columnDefinition = "TEXT")
    private String subPlaces;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getStartingPrice() { return startingPrice; }
    public void setStartingPrice(BigDecimal startingPrice) { this.startingPrice = startingPrice; }
    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }
    public BigDecimal getPricePerKm() { return pricePerKm; }
    public void setPricePerKm(BigDecimal pricePerKm) { this.pricePerKm = pricePerKm; }
    public BigDecimal getProviderPayout() { return providerPayout; }
    public void setProviderPayout(BigDecimal providerPayout) { this.providerPayout = providerPayout; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public int getDurationDays() { return durationDays; }
    public void setDurationDays(int durationDays) { this.durationDays = durationDays; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getCarPhotoUrl() { return carPhotoUrl; }
    public void setCarPhotoUrl(String carPhotoUrl) { this.carPhotoUrl = carPhotoUrl; }
    public String getLocalPlaces() { return localPlaces; }
    public void setLocalPlaces(String localPlaces) { this.localPlaces = localPlaces; }
    public String getCarType() { return carType; }
    public void setCarType(String carType) { this.carType = carType; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public String getLicenseHolderName() { return licenseHolderName; }
    public void setLicenseHolderName(String licenseHolderName) { this.licenseHolderName = licenseHolderName; }
    public String getLicenseDetails() { return licenseDetails; }
    public void setLicenseDetails(String licenseDetails) { this.licenseDetails = licenseDetails; }
    public String getLicenseDocumentUrl() { return licenseDocumentUrl; }
    public void setLicenseDocumentUrl(String licenseDocumentUrl) { this.licenseDocumentUrl = licenseDocumentUrl; }
    public String getCarNumber() { return carNumber; }
    public void setCarNumber(String carNumber) { this.carNumber = carNumber; }
    public String getCarModel() { return carModel; }
    public void setCarModel(String carModel) { this.carModel = carModel; }
    public String getCarColor() { return carColor; }
    public void setCarColor(String carColor) { this.carColor = carColor; }
    public Integer getSeatsAvailable() { return seatsAvailable; }
    public void setSeatsAvailable(Integer seatsAvailable) { this.seatsAvailable = seatsAvailable; }
    public String getProviderNotes() { return providerNotes; }
    public void setProviderNotes(String providerNotes) { this.providerNotes = providerNotes; }
    public String getPickupAvailabilityMode() { return pickupAvailabilityMode; }
    public void setPickupAvailabilityMode(String pickupAvailabilityMode) { this.pickupAvailabilityMode = pickupAvailabilityMode; }
    public String getPickupStartTime() { return pickupStartTime; }
    public void setPickupStartTime(String pickupStartTime) { this.pickupStartTime = pickupStartTime; }
    public String getPickupEndTime() { return pickupEndTime; }
    public void setPickupEndTime(String pickupEndTime) { this.pickupEndTime = pickupEndTime; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public ProviderProfile getSourceProvider() { return sourceProvider; }
    public void setSourceProvider(ProviderProfile sourceProvider) { this.sourceProvider = sourceProvider; }
    public AppUser getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(AppUser submittedBy) { this.submittedBy = submittedBy; }
    public AppUser getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(AppUser reviewedBy) { this.reviewedBy = reviewedBy; }
    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
    public String getRcNumber() { return rcNumber; }
    public void setRcNumber(String rcNumber) { this.rcNumber = rcNumber; }
    public String getRcDocumentUrl() { return rcDocumentUrl; }
    public void setRcDocumentUrl(String rcDocumentUrl) { this.rcDocumentUrl = rcDocumentUrl; }
    public UUID getRepostedFromId() { return repostedFromId; }
    public void setRepostedFromId(UUID repostedFromId) { this.repostedFromId = repostedFromId; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getRouteOrder() { return routeOrder; }
    public void setRouteOrder(String routeOrder) { this.routeOrder = routeOrder; }
    public Integer getTotalDistanceKm() { return totalDistanceKm; }
    public void setTotalDistanceKm(Integer totalDistanceKm) { this.totalDistanceKm = totalDistanceKm; }
    public String getSubPlaces() { return subPlaces; }
    public void setSubPlaces(String subPlaces) { this.subPlaces = subPlaces; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void touch() { this.updatedAt = Instant.now(); }
}
