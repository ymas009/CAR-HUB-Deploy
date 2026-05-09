package com.carhub.auth;

import com.carhub.auth.dto.AuthResponse;
import com.carhub.auth.dto.LoginRequest;
import com.carhub.auth.dto.LogoutResponse;
import com.carhub.auth.dto.RegisterRequest;
import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.domain.RoleCode;
import com.carhub.security.AuthenticatedUser;
import com.carhub.security.AuthSession;
import com.carhub.security.AuthSessionRepository;
import com.carhub.security.TokenService;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import com.carhub.user.CustomerProfile;
import com.carhub.user.CustomerProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.time.Instant;

@Service
public class AuthService {
    private final AppUserRepository appUserRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthSessionRepository authSessionRepository;
    private final AuditService auditService;

    public AuthService(AppUserRepository appUserRepository, CustomerProfileRepository customerProfileRepository,
                       PasswordEncoder passwordEncoder, TokenService tokenService,
                       AuthSessionRepository authSessionRepository, AuditService auditService) {
        this.appUserRepository = appUserRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.authSessionRepository = authSessionRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessRuleException("EMAIL_ALREADY_REGISTERED", "Email is already registered.");
        }
        if (appUserRepository.existsByMobile(request.mobile())) {
            throw new BusinessRuleException("MOBILE_ALREADY_REGISTERED", "Mobile number is already registered.");
        }
        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        user.setMobile(request.mobile());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(RoleCode.CUSTOMER));
        AppUser saved = appUserRepository.save(user);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(saved);
        profile.setCity(request.city());
        profile.setState(request.state());
        profile.setCountry(request.country());
        profile.setPreferredTravelType(request.preferredTravelType());
        profile.setEmergencyContactName(request.emergencyContactName());
        profile.setEmergencyContactMobile(request.emergencyContactMobile());
        profile.setConsentTerms(request.consentTerms());
        profile.setConsentPrivacy(request.consentPrivacy());
        profile.setConsentControlledDataSharing(request.consentControlledDataSharing());
        profile.setProfileCompleted(request.city() != null && request.country() != null && request.emergencyContactMobile() != null);
        customerProfileRepository.save(profile);
        auditService.recordAccessDecision(saved.getId(), "CUSTOMER", "CUSTOMER_REGISTERED", saved.getId(), "Customer registered");
        return response(saved);
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessRuleException("INVALID_CREDENTIALS", "Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditService.recordAccessDecision(user.getId(), "UNKNOWN", "LOGIN_FAILED", user.getId(), "Invalid password");
            throw new BusinessRuleException("INVALID_CREDENTIALS", "Invalid email or password.");
        }
        auditService.recordAccessDecision(user.getId(), user.getRoles().toString(), "LOGIN_SUCCESS", user.getId(), "User logged in");
        return response(user);
    }

    public AuthResponse me(AuthenticatedUser currentUser) {
        AppUser user = appUserRepository.findById(currentUser.id())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "User not found."));
        return response(user);
    }

    @Transactional
    public LogoutResponse logout(AuthenticatedUser currentUser) {
        authSessionRepository.findById(currentUser.sessionId()).ifPresent(session -> {
            session.revoke();
            authSessionRepository.save(session);
        });
        auditService.recordAccessDecision(currentUser.id(), currentUser.roles().toString(), "LOGOUT", currentUser.id(), "User logged out");
        return new LogoutResponse(true);
    }

    private AuthResponse response(AppUser user) {
        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setExpiresAt(Instant.now().plusSeconds(12 * 3600));
        AuthSession savedSession = authSessionRepository.save(session);
        return new AuthResponse(user.getId(), savedSession.getId(), user.getFullName(), user.getEmail(), user.getRoles(), tokenService.issue(user, savedSession.getId()));
    }
}
