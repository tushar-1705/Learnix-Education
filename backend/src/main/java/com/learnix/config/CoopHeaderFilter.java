package com.learnix.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class CoopHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        // Set Cross-Origin-Opener-Policy to allow Google OAuth popups
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        // Set Cross-Origin-Embedder-Policy for compatibility
        response.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        filterChain.doFilter(request, response);
    }
}

