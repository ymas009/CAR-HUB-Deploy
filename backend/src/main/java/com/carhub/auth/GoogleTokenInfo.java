package com.carhub.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleTokenInfo(
        String sub,
        String email,
        @JsonProperty("email_verified") Boolean emailVerified,
        String name,
        String aud,
        String picture
) {
}
