package com.learnix.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learnix.dto.AuthRequest;
import com.learnix.dto.ForgotPasswordRequest;
import com.learnix.dto.RegisterRequest;
import com.learnix.dto.ResetPasswordRequest;
import com.learnix.dto.VerifyOtpRequest;
import com.learnix.services.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google/register")
    public ResponseEntity<?> registerWithGoogle(@RequestBody com.learnix.dto.GoogleAuthRequest request) {
        return authService.registerWithGoogle(request);
    }

    @PostMapping("/google/login")
    public ResponseEntity<?> loginWithGoogle(@RequestBody com.learnix.dto.GoogleAuthRequest request) {
        return authService.loginWithGoogle(request);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return authService.verifyOtp(request);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}
