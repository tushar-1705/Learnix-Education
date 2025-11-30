package com.learnix.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequest {
    private String idToken; // Google ID token
    private String email; // User-entered email (for verification)
    private String name; // User name from Google
    private String role; // Optional role (default STUDENT)
}

