package com.carhub.security;

import com.carhub.domain.RoleCode;

import java.util.Set;
import java.util.UUID;

public record AuthenticatedUser(UUID id, UUID sessionId, String email, String name, Set<RoleCode> roles) {
    public boolean hasRole(RoleCode role) {
        return roles.contains(role);
    }
}
