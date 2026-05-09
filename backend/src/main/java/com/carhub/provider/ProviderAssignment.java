package com.carhub.provider;

import com.carhub.domain.RequestStatus;
import com.carhub.request.PackageRequest;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "provider_assignment")
public class ProviderAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private PackageRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.FORWARDED_TO_PROVIDER;

    @Column(name = "access_expires_at")
    private Instant accessExpiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by")
    private AppUser revokedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private AppUser assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToOne(mappedBy = "assignment", fetch = FetchType.LAZY)
    private ProviderSharedPayload sharedPayload;

    public UUID getId() { return id; }
    public PackageRequest getRequest() { return request; }
    public void setRequest(PackageRequest request) { this.request = request; }
    public ProviderProfile getProvider() { return provider; }
    public void setProvider(ProviderProfile provider) { this.provider = provider; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; this.updatedAt = Instant.now(); }
    public Instant getAccessExpiresAt() { return accessExpiresAt; }
    public void setAccessExpiresAt(Instant accessExpiresAt) { this.accessExpiresAt = accessExpiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public void revoke(AppUser actor) { this.revokedBy = actor; this.revokedAt = Instant.now(); this.updatedAt = Instant.now(); }
    public AppUser getAssignedBy() { return assignedBy; }
    public void setAssignedBy(AppUser assignedBy) { this.assignedBy = assignedBy; }
    public ProviderSharedPayload getSharedPayload() { return sharedPayload; }
}
