package com.carhub.auth;

import com.carhub.auth.dto.AuthResponse;
import com.carhub.auth.dto.LoginRequest;
import com.carhub.auth.dto.LogoutResponse;
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
    AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
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
}
