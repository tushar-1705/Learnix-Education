package com.learnix.config;

import org.springframework.context.annotation.Configuration;

/**
 * Environment configuration class.
 * Note: .env file is loaded in LearnixBackendApplication.main() before Spring Boot starts
 * to ensure environment variables are available when application.properties is processed.
 */
@Configuration
public class EnvConfig {
    // .env loading is handled in LearnixBackendApplication.main() method
}

