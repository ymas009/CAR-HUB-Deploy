package com.carhub.provider;

import com.carhub.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "provider_shared_payload")
public class ProviderSharedPayload {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private ProviderAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", nullable = false)
    private AppUser approvedBy;

    @Column(name = "visible_fields", nullable = false)
    private String visibleFields;

    @Column(name = "masked_payload", nullable = false)
    private String maskedPayload;

    @Column(nullable = false)
    private String purpose;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public ProviderAssignment getAssignment() { return assignment; }
    public void setAssignment(ProviderAssignment assignment) { this.assignment = assignment; }
    public AppUser getApprovedBy() { return approvedBy; }
    public void setApprovedBy(AppUser approvedBy) { this.approvedBy = approvedBy; }
    public String getVisibleFields() { return visibleFields; }
    public void setVisibleFields(String visibleFields) { this.visibleFields = visibleFields; }
    public String getMaskedPayload() { return maskedPayload; }
    public void setMaskedPayload(String maskedPayload) { this.maskedPayload = maskedPayload; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
}
