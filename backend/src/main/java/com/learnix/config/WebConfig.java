package com.learnix.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use the same path as FileStorageService for consistency
        String uploadPath = System.getProperty("user.dir") + "/uploads";
        String fullPath = Paths.get(uploadPath).toAbsolutePath().toString();
        
        // Ensure the path ends with a separator
        if (!fullPath.endsWith("/") && !fullPath.endsWith("\\")) {
            fullPath += "/";
        }
        
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + fullPath)
                .setCachePeriod(3600);
        // Also support /uploads/** for backward compatibility
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + fullPath)
                .setCachePeriod(3600);
    }
}

