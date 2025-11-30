package com.learnix.services;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/profiles/";

    public String storeFile(MultipartFile file, String userId) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // Get original filename
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isEmpty()) {
            throw new IOException("File name is empty");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Use original filename
        Path filePath = Paths.get(UPLOAD_DIR, originalFileName);
        
        // Save file with original filename (will replace if exists)
        Files.write(filePath, file.getBytes());

        // Return relative path for URL (profiles/filename)
        return "profiles/" + originalFileName;
    }

    public boolean deleteFile(String filePath) {
        try {
            // Handle both "profiles/filename" and full path formats
            Path path;
            if (filePath.startsWith("profiles/")) {
                String filename = filePath.substring("profiles/".length());
                path = Paths.get(UPLOAD_DIR, filename);
            } else {
                path = Paths.get(UPLOAD_DIR, filePath);
            }
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            return false;
        }
    }
    
//    Download an email profile-picture and saved it
    public String downloadAndSaveImage(String imageUrl, Long userId) throws IOException {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IOException("Image URL is empty");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Extract file extension from URL or default to jpg
        String extension = "jpg";
        try {
            String urlPath = new URL(imageUrl).getPath();
            if (urlPath.contains(".")) {
                String urlExtension = urlPath.substring(urlPath.lastIndexOf(".") + 1).toLowerCase();
                // Validate extension is an image format
                if (urlExtension.matches("jpg|jpeg|png|gif|webp")) {
                    extension = urlExtension.equals("jpeg") ? "jpg" : urlExtension;
                }
            }
        } catch (Exception e) {
            // Use default extension if URL parsing fails
        }

        // Generate filename: userId_timestamp.extension
        String filename = userId + "_" + System.currentTimeMillis() + "." + extension;
        Path filePath = Paths.get(UPLOAD_DIR, filename);

        // Download and save the image
        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.copy(in, filePath);
        }

        // Return relative path for URL (profiles/filename)
        return "profiles/" + filename;
    }
}

