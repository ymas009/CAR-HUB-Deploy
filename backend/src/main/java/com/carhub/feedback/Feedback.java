package com.carhub.feedback;

import com.carhub.request.PackageRequest;
import com.carhub.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private PackageRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @Column(name = "package_rating")
    private int packageRating;

    @Column(name = "support_rating")
    private int supportRating;

    private String comment;

    @Column(name = "moderation_status", nullable = false)
    private String moderationStatus = "PENDING";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public PackageRequest getRequest() { return request; }
    public void setRequest(PackageRequest request) { this.request = request; }
    public AppUser getCustomer() { return customer; }
    public void setCustomer(AppUser customer) { this.customer = customer; }
    public int getPackageRating() { return packageRating; }
    public void setPackageRating(int packageRating) { this.packageRating = packageRating; }
    public int getSupportRating() { return supportRating; }
    public void setSupportRating(int supportRating) { this.supportRating = supportRating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getModerationStatus() { return moderationStatus; }
    public Instant getCreatedAt() { return createdAt; }
}
