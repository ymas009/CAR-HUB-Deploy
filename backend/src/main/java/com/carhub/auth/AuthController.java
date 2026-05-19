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
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final CurrentUser currentUser;

    public AuthController(AuthService authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    OtpResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/register/confirm")
    AuthResponse confirmRegistration(@Valid @RequestBody RegistrationConfirmRequest request) {
        return authService.confirmRegistration(request);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    AuthResponse me() {
        return authService.me(currentUser.require());
    }

    @PostMapping("/logout")
    LogoutResponse logout() {
        return authService.logout(currentUser.require());
    }

    @PostMapping("/password/forgot")
    OtpResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/password/reset")
    OtpResponse resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        return authService.resetPassword(request);
    }

    @PostMapping("/password/change/request-otp")
    OtpResponse requestPasswordChangeOtp(@Valid @RequestBody PasswordChangeRequest request) {
        return authService.requestPasswordChangeOtp(request);
    }

    @PostMapping("/password/change/confirm")
    OtpResponse confirmPasswordChange(@Valid @RequestBody PasswordChangeConfirmRequest request) {
        return authService.confirmPasswordChange(request);
    }

    @PostMapping("/admin-id/change/request-otp")
    OtpResponse requestAdminIdChangeOtp(@Valid @RequestBody AdminIdChangeRequest request) {
        return authService.requestAdminIdChangeOtp(request);
    }

    @PostMapping("/admin-id/change/confirm")
    OtpResponse confirmAdminIdChange(@Valid @RequestBody AdminIdChangeConfirmRequest request) {
        return authService.confirmAdminIdChange(request);
    }

    @PostMapping("/admin-id/change/confirm-current")
    OtpResponse confirmCurrentAdminIdOtp(@Valid @RequestBody AdminIdCurrentOtpConfirmRequest request) {
        return authService.confirmCurrentAdminIdOtp(request);
    }

    @PostMapping("/admin-id/change/request-new-otp")
    OtpResponse requestNewAdminIdOtp(@Valid @RequestBody AdminIdNewOtpRequest request) {
        return authService.requestNewAdminIdOtp(request);
    }
}
