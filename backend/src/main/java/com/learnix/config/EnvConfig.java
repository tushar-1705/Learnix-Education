package com.learnix.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class EnvConfig {
    static {
        io.github.cdimascio.dotenv.Dotenv.configure().ignoreIfMissing().load();
    }
}

