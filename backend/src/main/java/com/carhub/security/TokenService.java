package com.carhub.security;

import com.carhub.domain.RoleCode;
import com.carhub.user.AppUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TokenService {
    private final String secret;
    private final long tokenHours;

    public TokenService(@Value("${carhub.security.jwt-secret}") String secret,
                        @Value("${carhub.security.token-hours}") long tokenHours) {
        this.secret = secret;
        this.tokenHours = tokenHours;
    }

    public String issue(AppUser user, UUID sessionId) {
        long expiresAt = Instant.now().plusSeconds(tokenHours * 3600).getEpochSecond();
        String roles = user.getRoles().stream().map(Enum::name).sorted().collect(Collectors.joining(","));
        String payload = "%s|%s|%s|%s|%s".formatted(user.getId(), sessionId, user.getEmail(), roles, expiresAt);
        String encodedPayload = base64Url(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "." + sign(encodedPayload);
    }

    public AuthenticatedUser parse(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 2 || !sign(parts[0]).equals(parts[1])) {
            throw new IllegalArgumentException("Invalid token");
        }
        String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        String[] values = payload.split("\\|");
        if (values.length != 5 || Long.parseLong(values[4]) < Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("Expired token");
        }
        Set<RoleCode> roles = Arrays.stream(values[3].split(","))
                .filter(value -> !value.isBlank())
                .map(RoleCode::valueOf)
                .collect(Collectors.toSet());
        return new AuthenticatedUser(UUID.fromString(values[0]), UUID.fromString(values[1]), values[2], values[2], roles);
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return base64Url(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign token", exception);
        }
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
