package com.carhub.support.dto;

import java.time.Instant;
import java.util.UUID;

public record SupportTicketResponse(UUID id, String category, String priority, String status, String subject, Instant slaDueAt, Instant createdAt) {
}
