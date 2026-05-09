package com.carhub.auth.dto;

import com.carhub.domain.RoleCode;

import java.util.Set;
import java.util.UUID;

public record AuthResponse(UUID userId, UUID sessionId, String fullName, String email, Set<RoleCode> roles, String token) {
}
