package com.carhub.security;

import com.carhub.domain.RoleCode;
import com.carhub.user.AppUser;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenServiceTest {
    @Test
    void issuedTokenCarriesUserRoles() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("customer@carhub.local");
        user.setFullName("Customer");
        user.setMobile("9999999999");
        user.setPasswordHash("hash");
        user.setRoles(Set.of(RoleCode.CUSTOMER));

        TokenService tokenService = new TokenService("test-secret-for-token-service", 1);
        UUID sessionId = UUID.randomUUID();
        AuthenticatedUser parsed = tokenService.parse(tokenService.issue(user, sessionId));

        assertEquals("customer@carhub.local", parsed.email());
        assertEquals(sessionId, parsed.sessionId());
        assertTrue(parsed.roles().contains(RoleCode.CUSTOMER));
    }
}
