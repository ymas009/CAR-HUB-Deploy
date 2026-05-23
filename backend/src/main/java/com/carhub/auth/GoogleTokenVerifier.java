package com.carhub.auth;

import com.carhub.common.BusinessRuleException;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;

@Service
public class GoogleTokenVerifier {
    private final RestTemplate restTemplate;

    public GoogleTokenVerifier(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(5))
                .build();
    }

    public GoogleTokenInfo verify(String credential) {
        String url = UriComponentsBuilder
                .fromUriString("https://oauth2.googleapis.com/tokeninfo")
                .queryParam("id_token", credential)
                .toUriString();
        try {
            GoogleTokenInfo tokenInfo = restTemplate.getForObject(url, GoogleTokenInfo.class);
            if (tokenInfo == null) {
                throw new BusinessRuleException("GOOGLE_TOKEN_INVALID", "Google sign-in could not be verified.");
            }
            return tokenInfo;
        } catch (RestClientException exception) {
            throw new BusinessRuleException("GOOGLE_TOKEN_INVALID", "Google sign-in could not be verified.");
        }
    }
}
