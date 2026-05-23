package com.carhub.auth;

import com.carhub.audit.AuditService;
import com.carhub.auth.dto.GoogleAuthRequest;
import com.carhub.common.BusinessRuleException;
import com.carhub.domain.RoleCode;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.security.AuthSession;
import com.carhub.security.AuthSessionRepository;
import com.carhub.security.TokenService;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import com.carhub.user.CustomerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceGoogleTest {
    private AppUserRepository appUserRepository;
    private CustomerProfileRepository customerProfileRepository;
    private ProviderProfileRepository providerProfileRepository;
    private GoogleTokenVerifier googleTokenVerifier;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        appUserRepository = mock(AppUserRepository.class);
        customerProfileRepository = mock(CustomerProfileRepository.class);
        providerProfileRepository = mock(ProviderProfileRepository.class);
        googleTokenVerifier = mock(GoogleTokenVerifier.class);
        AuthSessionRepository authSessionRepository = mock(AuthSessionRepository.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

        when(authSessionRepository.save(any(AuthSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }
            return user;
        });

        authService = new AuthService(
                appUserRepository,
                customerProfileRepository,
                passwordEncoder,
                new TokenService("test-secret", 12),
                authSessionRepository,
                mock(AuditService.class),
                providerProfileRepository,
                mock(JavaMailSender.class),
                googleTokenVerifier,
                "client-123"
        );
    }

    @Test
    void createsCustomerFromGoogleToken() {
        when(googleTokenVerifier.verify("token")).thenReturn(token("customer@example.com", "Google Customer", "client-123", true));
        when(appUserRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(appUserRepository.findByEmailIgnoreCase("customer@example.com")).thenReturn(Optional.empty());

        var response = authService.google(new GoogleAuthRequest("token", "CUSTOMER"));

        assertEquals("customer@example.com", response.email());
        assertEquals(Set.of(RoleCode.CUSTOMER), response.roles());
        assertNotNull(response.token());
        verify(customerProfileRepository).save(any());
    }

    @Test
    void createsProviderFromGoogleToken() {
        when(googleTokenVerifier.verify("token")).thenReturn(token("provider@example.com", "Google Provider", "client-123", true));
        when(appUserRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(appUserRepository.findByEmailIgnoreCase("provider@example.com")).thenReturn(Optional.empty());

        var response = authService.google(new GoogleAuthRequest("token", "PROVIDER"));

        assertEquals("provider@example.com", response.email());
        assertEquals(Set.of(RoleCode.PROVIDER), response.roles());
        verify(providerProfileRepository).save(any());
    }

    @Test
    void linksExistingEmailAccount() {
        AppUser existing = user("linked@example.com", RoleCode.CUSTOMER);
        when(googleTokenVerifier.verify("token")).thenReturn(token("linked@example.com", "Linked User", "client-123", true));
        when(appUserRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(appUserRepository.findByEmailIgnoreCase("linked@example.com")).thenReturn(Optional.of(existing));

        authService.google(new GoogleAuthRequest("token", "CUSTOMER"));

        assertEquals("google-sub", existing.getGoogleId());
        verify(appUserRepository).save(existing);
    }

    @Test
    void rejectsWrongAudience() {
        when(googleTokenVerifier.verify("token")).thenReturn(token("customer@example.com", "Google Customer", "other-client", true));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> authService.google(new GoogleAuthRequest("token", "CUSTOMER")));

        assertEquals("GOOGLE_AUDIENCE_INVALID", exception.code());
    }

    @Test
    void rejectsUnverifiedEmail() {
        when(googleTokenVerifier.verify("token")).thenReturn(token("customer@example.com", "Google Customer", "client-123", false));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> authService.google(new GoogleAuthRequest("token", "CUSTOMER")));

        assertEquals("GOOGLE_EMAIL_NOT_VERIFIED", exception.code());
    }

    @Test
    void rejectsAdministrativeAccounts() {
        AppUser admin = user("admin@example.com", RoleCode.ADMIN);
        when(googleTokenVerifier.verify("token")).thenReturn(token("admin@example.com", "Admin User", "client-123", true));
        when(appUserRepository.findByGoogleId("google-sub")).thenReturn(Optional.empty());
        when(appUserRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(admin));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> authService.google(new GoogleAuthRequest("token", "CUSTOMER")));

        assertEquals("GOOGLE_ROLE_FORBIDDEN", exception.code());
    }

    @Test
    void rejectsRoleMismatch() {
        AppUser provider = user("provider@example.com", RoleCode.PROVIDER);
        when(googleTokenVerifier.verify("token")).thenReturn(token("provider@example.com", "Provider User", "client-123", true));
        when(appUserRepository.findByGoogleId("google-sub")).thenReturn(Optional.of(provider));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> authService.google(new GoogleAuthRequest("token", "CUSTOMER")));

        assertEquals("GOOGLE_ROLE_MISMATCH", exception.code());
    }

    private GoogleTokenInfo token(String email, String name, String audience, boolean emailVerified) {
        return new GoogleTokenInfo("google-sub", email, emailVerified, name, audience, null);
    }

    private AppUser user(String email, RoleCode role) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setFullName("Test User");
        user.setPasswordHash("hash");
        user.setRoles(Set.of(role));
        return user;
    }
}
