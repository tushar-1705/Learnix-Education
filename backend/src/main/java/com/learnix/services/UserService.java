package com.learnix.services;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Users;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class UserService {

	@Autowired
    private UserRepository userRepository;
	
	@Autowired
	MyResponseWrapper responseWrapper;
	
	public MyResponseWrapper getResponseWrapper() {
		return responseWrapper;
	}
    
    // Update user details
    public ResponseEntity<?> updateUser(Long userId, Users updatedUser) {
        Optional<Users> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
        	return universalResponse("User not found", null, HttpStatus.NOT_FOUND);
        }

        Users existingUser = optionalUser.get();

        // Update only allowed fields
        existingUser.setName(updatedUser.getName());
        existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
        existingUser.setEmail(updatedUser.getEmail());
        if (updatedUser.getProfilePhoto() != null) {
            existingUser.setProfilePhoto(updatedUser.getProfilePhoto());
        }
        existingUser.setUpdatedAt(LocalDateTime.now());

        Users savedUser = userRepository.save(existingUser);

        return universalResponse("User updated successfully!", savedUser, HttpStatus.OK);
    }
    
    // Update profile photo
    public ResponseEntity<?> updateProfilePhoto(Long userId, String photoPath) {
        Optional<Users> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
        	return universalResponse("User not found", null, HttpStatus.NOT_FOUND);
        }

        Users existingUser = optionalUser.get();
        
        // Delete old photo if exists
        if (existingUser.getProfilePhoto() != null && !existingUser.getProfilePhoto().isEmpty()) {
            // Optionally delete old file - could implement fileStorageService.deleteFile()
        }
        
        existingUser.setProfilePhoto(photoPath);
        existingUser.setUpdatedAt(LocalDateTime.now());

        Users savedUser = userRepository.save(existingUser);

        return universalResponse("Profile photo updated successfully!", savedUser, HttpStatus.OK);
    }
    
    public ResponseEntity<?> removeProfilePhoto(Long userId) {
        Optional<Users> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
        	return universalResponse("User not found", null, HttpStatus.NOT_FOUND);
        }

        Users existingUser = optionalUser.get();
        
        // Delete photo file if exists
        if (existingUser.getProfilePhoto() != null && !existingUser.getProfilePhoto().isEmpty()) {
            // Will be handled by FileStorageService in controller
        }
        
        existingUser.setProfilePhoto(null);
        existingUser.setUpdatedAt(LocalDateTime.now());

        Users savedUser = userRepository.save(existingUser);

        return universalResponse("Profile photo removed successfully!", savedUser, HttpStatus.OK);
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}
