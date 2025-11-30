package com.learnix.controllers;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.learnix.models.Users;
import com.learnix.repositories.UserRepository;
import com.learnix.services.UserService;
import com.learnix.services.FileStorageService;

@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	UserService userService;
	
	@Autowired
	UserRepository userRepository;
	
	@Autowired
	FileStorageService fileStorageService;
	
	@PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Users updatedUser) {
        return userService.updateUser(id, updatedUser);
    }
	
	@PostMapping("/{id}/upload-photo")
	public ResponseEntity<?> uploadProfilePhoto(
			@PathVariable Long id,
			@RequestParam("file") MultipartFile file) {
		try {
			if (file.isEmpty()) {
				userService.getResponseWrapper().setMessage("File is empty");
				userService.getResponseWrapper().setData(null);
				return ResponseEntity.badRequest().body(userService.getResponseWrapper());
			}
			
			// Validate file type
			String contentType = file.getContentType();
			if (contentType == null || !contentType.startsWith("image/")) {
				userService.getResponseWrapper().setMessage("File must be an image");
				userService.getResponseWrapper().setData(null);
				return ResponseEntity.badRequest().body(userService.getResponseWrapper());
			}
			
			// Store file and get path
			String filePath = fileStorageService.storeFile(file, id.toString());
			
			// Update user's profile photo
			return userService.updateProfilePhoto(id, filePath);
		} catch (IOException e) {
			userService.getResponseWrapper().setMessage("Failed to upload file: " + e.getMessage());
			userService.getResponseWrapper().setData(null);
			return ResponseEntity.status(500).body(userService.getResponseWrapper());
		}
	}
	
	@DeleteMapping("/{id}/remove-photo")
	public ResponseEntity<?> removeProfilePhoto(@PathVariable Long id) {
		try {
			// Get user to find photo path before deletion
			Users user = userRepository.findById(id).orElse(null);
			if (user != null && user.getProfilePhoto() != null && !user.getProfilePhoto().isEmpty()) {
				// Delete file from file system
				fileStorageService.deleteFile(user.getProfilePhoto());
			}
			
			// Remove photo from user record
			return userService.removeProfilePhoto(id);
		} catch (Exception e) {
			userService.getResponseWrapper().setMessage("Failed to remove photo: " + e.getMessage());
			userService.getResponseWrapper().setData(null);
			return ResponseEntity.status(500).body(userService.getResponseWrapper());
		}
	}
}
