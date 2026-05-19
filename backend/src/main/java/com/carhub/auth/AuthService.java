package com.carhub.auth;

import com.carhub.auth.dto.AdminIdChangeConfirmRequest;
import com.carhub.auth.dto.AdminIdChangeRequest;
import com.carhub.auth.dto.AdminIdCurrentOtpConfirmRequest;
import com.carhub.auth.dto.AdminIdNewOtpRequest;
import com.carhub.auth.dto.AuthResponse;
import com.carhub.auth.dto.ForgotPasswordRequest;
import com.carhub.auth.dto.LoginRequest;
import com.carhub.auth.dto.LogoutResponse;
import com.carhub.auth.dto.OtpResponse;
import com.carhub.auth.dto.PasswordChangeConfirmRequest;
import com.carhub.auth.dto.PasswordChangeRequest;
import com.carhub.auth.dto.PasswordResetRequest;
import com.carhub.auth.dto.RegistrationConfirmRequest;
import com.carhub.auth.dto.RegisterRequest;
import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.domain.RoleCode;
import com.carhub.security.AuthenticatedUser;
import com.carhub.security.AuthSession;
import com.carhub.security.AuthSessionRepository;
import com.carhub.security.TokenService;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import com.carhub.user.CustomerProfile;
import com.carhub.user.CustomerProfileRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Set;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class AuthService {
    private final AppUserRepository appUserRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthSessionRepository authSessionRepository;
    private final AuditService auditService;
    private final ProviderProfileRepository providerProfileRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentMap<String, OtpChallenge> otpChallenges = new ConcurrentHashMap<>();

    public AuthService(AppUserRepository appUserRepository, CustomerProfileRepository customerProfileRepository,
                       PasswordEncoder passwordEncoder, TokenService tokenService,
                       AuthSessionRepository authSessionRepository, AuditService auditService,
                       ProviderProfileRepository providerProfileRepository,
                       JavaMailSender mailSender) {
        this.appUserRepository = appUserRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.authSessionRepository = authSessionRepository;
        this.auditService = auditService;
        this.providerProfileRepository = providerProfileRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public OtpResponse register(RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessRuleException("EMAIL_ALREADY_REGISTERED", "Email is already registered.");
        }
        if (appUserRepository.existsByMobile(request.mobile())) {
            throw new BusinessRuleException("MOBILE_ALREADY_REGISTERED", "Mobile number is already registered.");
        }
        String otp = createOtp();
        otpChallenges.put(challengeKey("REGISTRATION", request.email()), new OtpChallenge(otp, Instant.now().plus(Duration.ofMinutes(10)), request));
        sendOtp(request.email(), "CarHub registration verification OTP", otp);
        return new OtpResponse(true, "Verification code sent to your email.");
    }

    @Transactional
    public AuthResponse confirmRegistration(RegistrationConfirmRequest request) {
        OtpChallenge challenge = verifyOtp("REGISTRATION", request.email(), request.otp());
        RegisterRequest registration = (RegisterRequest) challenge.pendingValue();
        if (appUserRepository.existsByEmailIgnoreCase(registration.email())) {
            throw new BusinessRuleException("EMAIL_ALREADY_REGISTERED", "Email is already registered.");
        }
        if (appUserRepository.existsByMobile(registration.mobile())) {
            throw new BusinessRuleException("MOBILE_ALREADY_REGISTERED", "Mobile number is already registered.");
        }
        AppUser user = new AppUser();
        user.setFullName(registration.fullName());
        user.setEmail(registration.email().toLowerCase());
        user.setMobile(registration.mobile());
        user.setPasswordHash(passwordEncoder.encode(registration.password()));
        RoleCode role = "PROVIDER".equalsIgnoreCase(registration.accountType()) ? RoleCode.PROVIDER : RoleCode.CUSTOMER;
        user.setRoles(Set.of(role));
        AppUser saved = appUserRepository.save(user);

        if (role == RoleCode.PROVIDER) {
            ProviderProfile profile = new ProviderProfile();
            profile.setUser(saved);
            profile.setBusinessName(registration.fullName().trim());
            profile.setContactPerson(registration.fullName().trim());
            profile.setBusinessAddress(registration.address());
            profile.setPinCode(registration.pinCode());
            profile.setLatitude(registration.latitude());
            profile.setLongitude(registration.longitude());
            profile.setRcNumber(registration.rcNumber());
            profile.setRcDocumentImage(registration.rcDocumentImage());
            profile.setVerificationStatus("PENDING");
            profile.setSuspended(false);
            providerProfileRepository.save(profile);
            auditService.recordAccessDecision(saved.getId(), "PROVIDER", "PROVIDER_REGISTERED", saved.getId(), "Provider registered");
        } else {
            CustomerProfile profile = new CustomerProfile();
            profile.setUser(saved);
            profile.setCity(registration.city());
            profile.setState(registration.state());
            profile.setCountry(registration.country());
            profile.setAddress(registration.address());
            profile.setPinCode(registration.pinCode());
            profile.setLatitude(registration.latitude());
            profile.setLongitude(registration.longitude());
            profile.setPreferredTravelType(registration.preferredTravelType());
            profile.setEmergencyContactName(registration.emergencyContactName());
            profile.setEmergencyContactMobile(registration.emergencyContactMobile());
            profile.setConsentTerms(registration.consentTerms());
            profile.setConsentPrivacy(registration.consentPrivacy());
            profile.setConsentControlledDataSharing(registration.consentControlledDataSharing());
            profile.setProfileCompleted(registration.address() != null && registration.emergencyContactMobile() != null);
            customerProfileRepository.save(profile);
            auditService.recordAccessDecision(saved.getId(), "CUSTOMER", "CUSTOMER_REGISTERED", saved.getId(), "Customer registered");
        }
        return response(saved);
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessRuleException("EMAIL_NOT_REGISTERED", "Email is not registered."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditService.recordAccessDecision(user.getId(), "UNKNOWN", "LOGIN_FAILED", user.getId(), "Invalid password");
            throw new BusinessRuleException("WRONG_PASSWORD", "Wrong password.");
        }
        auditService.recordAccessDecision(user.getId(), user.getRoles().toString(), "LOGIN_SUCCESS", user.getId(), "User logged in");
        return response(user);
    }

    public OtpResponse forgotPassword(ForgotPasswordRequest request) {
        AppUser user = findByEmailOrMobile(request.identity());
        String otp = createOtp();
        otpChallenges.put(challengeKey("PASSWORD_RESET", user.getEmail()), new OtpChallenge(otp, Instant.now().plus(Duration.ofMinutes(10)), null));
        sendOtp(user.getEmail(), "CarHub password reset OTP", otp);
        return new OtpResponse(true, "Verification code sent to registered email.");
    }

    @Transactional
    public OtpResponse resetPassword(PasswordResetRequest request) {
        AppUser user = findByEmailOrMobile(request.identity());
        verifyOtp("PASSWORD_RESET", user.getEmail(), request.otp());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        appUserRepository.save(user);
        auditService.recordAccessDecision(user.getId(), user.getRoles().toString(), "PASSWORD_RESET", user.getId(), "Password reset with email OTP");
        return new OtpResponse(true, "Password reset complete.");
    }

    public OtpResponse requestPasswordChangeOtp(PasswordChangeRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "No user found for this email."));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("INVALID_CREDENTIALS", "Current password is incorrect.");
        }
        String otp = createOtp();
        otpChallenges.put(challengeKey("PASSWORD_CHANGE", user.getEmail()), new OtpChallenge(otp, Instant.now().plus(Duration.ofMinutes(10)), request.newPassword()));
        sendOtp(user.getEmail(), "CarHub password change OTP", otp);
        return new OtpResponse(true, "Verification code sent to registered email.");
    }

    @Transactional
    public OtpResponse confirmPasswordChange(PasswordChangeConfirmRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "No user found for this email."));
        OtpChallenge challenge = verifyOtp("PASSWORD_CHANGE", user.getEmail(), request.otp());
        String password = challenge.pendingValue() == null ? request.newPassword() : challenge.pendingValue().toString();
        user.setPasswordHash(passwordEncoder.encode(password));
        appUserRepository.save(user);
        auditService.recordAccessDecision(user.getId(), user.getRoles().toString(), "PASSWORD_CHANGED", user.getId(), "Password changed with email OTP");
        return new OtpResponse(true, "Password updated successfully.");
    }

    public OtpResponse requestAdminIdChangeOtp(AdminIdChangeRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.currentAdminId())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Current admin ID was not found."));
        requireAdmin(user);
        String otp = createOtp();
        otpChallenges.put(challengeKey("ADMIN_ID_CURRENT_VERIFY", user.getEmail()), new OtpChallenge(otp, Instant.now().plus(Duration.ofMinutes(10)), null));
        sendOtp(user.getEmail(), "CarHub current admin email verification OTP", otp);
        return new OtpResponse(true, "Verification code sent to current admin email.");
    }

    public OtpResponse confirmCurrentAdminIdOtp(AdminIdCurrentOtpConfirmRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.currentAdminId())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Current admin ID was not found."));
        requireAdmin(user);
        verifyOtp("ADMIN_ID_CURRENT_VERIFY", user.getEmail(), request.otp());
        otpChallenges.put(challengeKey("ADMIN_ID_CURRENT_VERIFIED", user.getEmail()), new OtpChallenge("VERIFIED", Instant.now().plus(Duration.ofMinutes(10)), null));
        return new OtpResponse(true, "Current email verified.");
    }

    public OtpResponse requestNewAdminIdOtp(AdminIdNewOtpRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.currentAdminId())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Current admin ID was not found."));
        requireAdmin(user);
        requireCurrentAdminIdVerified(user);
        String newAdminId = request.newAdminId().toLowerCase();
        if (appUserRepository.existsByEmailIgnoreCase(newAdminId)) {
            throw new BusinessRuleException("EMAIL_ALREADY_REGISTERED", "New admin ID is already registered.");
        }
        String otp = createOtp();
        otpChallenges.put(challengeKey("ADMIN_ID_NEW_VERIFY", newAdminId), new OtpChallenge(otp, Instant.now().plus(Duration.ofMinutes(10)), user.getEmail()));
        sendOtp(newAdminId, "CarHub new admin email verification OTP", otp);
        return new OtpResponse(true, "Verification code sent to new admin email.");
    }

    @Transactional
    public OtpResponse confirmAdminIdChange(AdminIdChangeConfirmRequest request) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(request.currentAdminId())
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Current admin ID was not found."));
        requireAdmin(user);
        String newAdminId = request.newAdminId().toLowerCase();
        if (appUserRepository.existsByEmailIgnoreCase(newAdminId)) {
            throw new BusinessRuleException("EMAIL_ALREADY_REGISTERED", "New admin ID is already registered.");
        }
        requireCurrentAdminIdVerified(user);
        OtpChallenge challenge = verifyOtp("ADMIN_ID_NEW_VERIFY", newAdminId, request.otp());
        if (!user.getEmail().equalsIgnoreCase(String.valueOf(challenge.pendingValue()))) {
            throw new BusinessRuleException("OTP_INVALID", "Verification code is incorrect.");
        }
        otpChallenges.remove(challengeKey("ADMIN_ID_CURRENT_VERIFIED", user.getEmail()));
        user.setEmail(newAdminId);
        appUserRepository.save(user);
        auditService.recordAccessDecision(user.getId(), user.getRoles().toString(), "ADMIN_ID_CHANGED", user.getId(), "Admin ID changed with email OTP");
        return new OtpResponse(true, "Admin ID updated successfully.");
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

    private void requireAdmin(AppUser user) {
        if (!user.getRoles().contains(RoleCode.ADMIN) && !user.getRoles().contains(RoleCode.SUB_ADMIN)) {
            throw new BusinessRuleException("FORBIDDEN", "Only admin users can change the admin ID.");
        }
    }

    private void requireCurrentAdminIdVerified(AppUser user) {
        OtpChallenge challenge = otpChallenges.get(challengeKey("ADMIN_ID_CURRENT_VERIFIED", user.getEmail()));
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            throw new BusinessRuleException("CURRENT_EMAIL_NOT_VERIFIED", "Verify the current admin email first.");
        }
    }

    private String createOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private String challengeKey(String purpose, String email) {
        return purpose + ":" + email.toLowerCase();
    }

    private AppUser findByEmailOrMobile(String identity) {
        String value = identity.trim();
        return appUserRepository.findByEmailIgnoreCase(value)
                .or(() -> appUserRepository.findByMobile(value))
                .orElseThrow(() -> new BusinessRuleException("ACCOUNT_NOT_FOUND", "Account not found."));
    }

    private OtpChallenge verifyOtp(String purpose, String email, String otp) {
        String key = challengeKey(purpose, email);
        OtpChallenge challenge = otpChallenges.get(key);
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            otpChallenges.remove(key);
            throw new BusinessRuleException("OTP_EXPIRED", "Verification code expired. Request a new code.");
        }
        if (!challenge.otp().equals(otp.trim())) {
            throw new BusinessRuleException("OTP_INVALID", "Verification code is incorrect.");
        }
        otpChallenges.remove(key);
        return challenge;
    }

    private void sendOtp(String to, String subject, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText("Your CarHub verification code is " + otp + ". It expires in 10 minutes.");
        mailSender.send(message);
    }

    private record OtpChallenge(String otp, Instant expiresAt, Object pendingValue) {
    }
}
