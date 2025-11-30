package com.learnix.services;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.learnix.config.CustomUserDetails;
import com.learnix.config.JwtUtil;
import com.learnix.dto.AuthRequest;
import com.learnix.dto.ForgotPasswordRequest;
import com.learnix.dto.GoogleAuthRequest;
import com.learnix.dto.RegisterRequest;
import com.learnix.dto.ResetPasswordRequest;
import com.learnix.dto.VerifyOtpRequest;
import com.learnix.models.Student;
import com.learnix.models.Users;
import com.learnix.repositories.StudentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class AuthService {

	@Autowired
    private AuthenticationManager authenticationManager;
	@Autowired
    private JwtUtil jwtUtil;
	@Autowired
    private UserRepository userRepository;
	@Autowired
    private StudentRepository studentRepository;
	@Autowired
    private PasswordEncoder passwordEncoder;
	@Autowired
    private MyResponseWrapper responseWrapper;
	@Autowired
    private EmailService emailService;
	@Autowired
    private FileStorageService fileStorageService;

    @org.springframework.beans.factory.annotation.Value("${google.client.id:}")
    private String googleClientId;

    // Google OAuth Helper Methods
    private GoogleIdTokenVerifier getGoogleIdTokenVerifier() {
        if (googleClientId == null || googleClientId.isEmpty()) {
            throw new RuntimeException("Google Client ID is not configured");
        }
        return new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(java.util.Collections.singletonList(googleClientId))
                .build();
    }

    private GoogleIdToken verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = getGoogleIdTokenVerifier();
            return verifier.verify(idToken);
        } catch (Exception e) {
            return null;
        }
    }

    // Google Register
    public ResponseEntity<?> registerWithGoogle(GoogleAuthRequest request) {
        try {
            // Verify Google ID token
            GoogleIdToken googleIdToken = verifyGoogleToken(request.getIdToken());
            if (googleIdToken == null) {
            	return universalResponse("Invalid Google token", null, HttpStatus.UNAUTHORIZED);
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            // Extract required fields: name, email, phone number, and profile picture
            String googleEmail = (String) payload.get("email");
            String googleName = (String) payload.get("name");
            String googlePicture = (String) payload.get("picture"); // Profile photo URL
            // Phone number is typically not available in ID token, will be null
            // To get phone number, OAuth 2.0 flow with People API is required
            String googlePhoneNumber = null;
            // Try to get phone number if available in token (unlikely but checking anyway)
            try {
                Object phoneObj = payload.get("phone_number");
                if (phoneObj != null) {
                    googlePhoneNumber = phoneObj.toString();
                }
            } catch (Exception e) {
                // Phone number not available in token
            }

            // Check if user-entered email matches Google email (only if email is provided)
            if (request.getEmail() != null && !request.getEmail().isEmpty() && !request.getEmail().equalsIgnoreCase(googleEmail)) {
            	return universalResponse("Email mismatch. Google email (" + googleEmail + ") does not match entered email (" + request.getEmail() + ")", null, HttpStatus.BAD_REQUEST);
            }

            // Check if user already exists
            Users existingUser = userRepository.findByEmail(googleEmail);
            if (existingUser != null) {
            	return universalResponse("User with email " + googleEmail + " already exists. Please login instead.", null, HttpStatus.CONFLICT);
            }

            // Create new user with name, email, phone number, and profile photo
            Users user = new Users();
            user.setName(googleName != null ? googleName : request.getName());
            user.setEmail(googleEmail);
            user.setPhoneNumber(googlePhoneNumber); // Will be null if not available
            user.setPassword(null); // No password for Google OAuth users
            String role = (request.getRole() != null && !request.getRole().isEmpty()) 
                    ? request.getRole().toUpperCase() 
                    : "STUDENT";
            user.setRole(role);
            user.setLoggedBy("GOOGLE"); // Set logged by Google

            // Set approval status
            if ("STUDENT".equalsIgnoreCase(role)) {
                user.setIsApproved(false); // Students need admin approval
            } else {
                user.setIsApproved(true); // TEACHER and ADMIN are auto-approved
            }

            Users savedUser = userRepository.save(user);

            // Download and save profile photo if available
            if (googlePicture != null && !googlePicture.isEmpty()) {
                try {
                    String profilePhotoPath = fileStorageService.downloadAndSaveImage(googlePicture, savedUser.getId());
                    savedUser.setProfilePhoto(profilePhotoPath);
                    userRepository.save(savedUser);
                } catch (Exception e) {
                    // Log error but don't fail registration if profile photo download fails
                    System.err.println("Failed to download Google profile photo: " + e.getMessage());
                }
            }

            // Create Student record if role is STUDENT
            if ("STUDENT".equalsIgnoreCase(role)) {
                Student student = new Student();
                student.setUser(savedUser);
                studentRepository.save(student);
            }

            return universalResponse("User registered successfully with Google: " + googleEmail, savedUser, HttpStatus.CREATED);

        } catch (Exception e) {
        	return universalResponse("Error during Google registration: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Google Login
    public ResponseEntity<?> loginWithGoogle(GoogleAuthRequest request) {
        try {
            // Verify Google ID token
            GoogleIdToken googleIdToken = verifyGoogleToken(request.getIdToken());
            if (googleIdToken == null) {
            	return universalResponse("Invalid Google token", null, HttpStatus.UNAUTHORIZED);
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            // Extract required fields: name, email, phone number, and profile picture
            String googleEmail = (String) payload.get("email");
            String googleName = (String) payload.get("name");
            String googlePicture = (String) payload.get("picture"); // Profile photo URL
            // Phone number is typically not available in ID token
            String googlePhoneNumber = null;
            try {
                Object phoneObj = payload.get("phone_number");
                if (phoneObj != null) {
                    googlePhoneNumber = phoneObj.toString();
                }
            } catch (Exception e) {
                // Phone number not available in token
            }

            // Check if user-entered email matches Google email
            if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(googleEmail)) {
            	return universalResponse("Email mismatch. Google email (" + googleEmail + ") does not match entered email (" + request.getEmail() + ")", null, HttpStatus.BAD_REQUEST);
            }

            // Find user by email
            Users user = userRepository.findByEmail(googleEmail);
            if (user == null) {
            	return universalResponse("User not found. Please register first.", null, HttpStatus.NOT_FOUND);
            }

            // Check if student is approved
            if ("STUDENT".equalsIgnoreCase(user.getRole())) {
                Boolean isApproved = user.getIsApproved();
                if (isApproved == null || !isApproved) {
                	return universalResponse("Your admission is pending approval. Please wait for admin approval.", null, HttpStatus.FORBIDDEN);
                }
            }

            // Update name, email, phone number, and profile photo (if available)
            if (googleName != null && !googleName.isEmpty()) {
                user.setName(googleName);
            }
            if (googlePhoneNumber != null && !googlePhoneNumber.isEmpty()) {
                user.setPhoneNumber(googlePhoneNumber);
            }
            
            // Update loggedBy if not set
            if (user.getLoggedBy() == null || user.getLoggedBy().isEmpty()) {
                user.setLoggedBy("GOOGLE");
            }
            
            userRepository.save(user);

            // Download and save/update profile photo if available from Google
            if (googlePicture != null && !googlePicture.isEmpty()) {
                try {
                    // Delete old profile photo if exists
                    if (user.getProfilePhoto() != null && !user.getProfilePhoto().isEmpty()) {
                        fileStorageService.deleteFile(user.getProfilePhoto());
                    }
                    // Download and save new profile photo
                    String profilePhotoPath = fileStorageService.downloadAndSaveImage(googlePicture, user.getId());
                    user.setProfilePhoto(profilePhotoPath);
                    userRepository.save(user);
                } catch (Exception e) {
                    // Log error but don't fail login if profile photo download fails
                    System.err.println("Failed to download Google profile photo: " + e.getMessage());
                }
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

            // Prepare response data
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("type", "Bearer");
            responseData.put("user", user);

            return universalResponse("Login successful with Google: " + googleEmail, responseData, HttpStatus.OK);

        } catch (Exception e) {
        	return universalResponse("Error during Google login: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Register 
	public ResponseEntity<?> register(RegisterRequest request) {
	    Users existingUser = userRepository.findByEmail(request.getEmail());
	    
	    if (existingUser != null) {
	    	return universalResponse(request.getEmail() + " email already exists", null, HttpStatus.CONFLICT);
	    } else {
	        // Encode password before saving
	        String encodedPassword = passwordEncoder.encode(request.getPassword());

	        Users user = new Users();
	        user.setName(request.getName());
	        user.setEmail(request.getEmail());
	        user.setPassword(encodedPassword);
	        String role = request.getRole() == null ? "STUDENT" : request.getRole().toUpperCase();
	        user.setRole(role);
	        user.setPhoneNumber(request.getPhoneNumber());
	        user.setLoggedBy("EMAIL"); // Set logged by Email
	        
	        // Set approval status: TEACHER and ADMIN are auto-approved, STUDENT needs admin approval
	        if ("STUDENT".equalsIgnoreCase(role)) {
	            user.setIsApproved(false); // Students need admin approval
	        } else {
	            user.setIsApproved(true); // TEACHER and ADMIN are auto-approved
	        }

	        Users savedUser = userRepository.save(user);

	        // Create Student record if role is STUDENT
	        if ("STUDENT".equalsIgnoreCase(role)) {
	            Student student = new Student();
	            student.setUser(savedUser);
	            studentRepository.save(student);
	        }

	        return universalResponse("User registered successfully: " + user.getEmail(), savedUser, HttpStatus.CREATED);
	    }
	}


    // Login
	public ResponseEntity<?> login(AuthRequest request) {
	    try {
	        // Authenticate user credentials
	        Authentication authentication = authenticationManager.authenticate(
	                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
	        );

	        // Get authenticated user details
	        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
	        Users user = userDetails.getUser();

	        // Update loggedBy if not set
	        if (user.getLoggedBy() == null || user.getLoggedBy().isEmpty()) {
	            user.setLoggedBy("EMAIL");
	            userRepository.save(user);
	        }

	        // Check if student is approved before allowing login
	        if ("STUDENT".equalsIgnoreCase(user.getRole())) {
	            Boolean isApproved = user.getIsApproved();
	            
	            // Student must be approved to login
	            if (isApproved == null || !isApproved) {
	            	return universalResponse("Your admission is pending approval. Please wait for admin approval.", null, HttpStatus.FORBIDDEN);
	            }
	        }

	        // Generate JWT token
	        String token = jwtUtil.generateToken(userDetails.getUsername(), user.getRole());

	        // Prepare response data
	        Map<String, Object> responseData = new HashMap<>();
	        responseData.put("token", token);
	        responseData.put("type", "Bearer");
	        responseData.put("user", user);

	        // Set wrapper response
	        return universalResponse("Login successful for: " + userDetails.getUsername(), responseData, HttpStatus.OK);

	    } catch (BadCredentialsException e) {
	        // Wrong email or password
	    	return universalResponse("Invalid email or password", null, HttpStatus.UNAUTHORIZED);
	    } catch (Exception e) {
	        // Any unexpected error
	    	return universalResponse("An unexpected error occurred: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	    
	}
	
	// Forgot Password 
	public ResponseEntity<?> forgotPassword(ForgotPasswordRequest request) {
		try {
			Users user = userRepository.findByEmail(request.getEmail());
			
			if (user == null) {
				// Don't reveal if user exists or not for security
				return universalResponse("If an account with that email exists, an OTP has been sent.", null, HttpStatus.OK);
			}
			
			// Check if user has a password (not Google-only user)
			if (user.getPassword() == null || user.getPassword().isEmpty()) {
				return universalResponse("This account is linked to Google. Please use Google Sign-In to access your account.", null, HttpStatus.BAD_REQUEST);
			}
			
			// Generate 6-digit OTP
			String otp = String.format("%06d", (int)(Math.random() * 1000000));
			LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(10); // OTP valid for 10 minutes
			
			// Save OTP to user
			user.setOtp(otp);
			user.setOtpExpiry(expiryTime);
			userRepository.save(user);
			
			// Send OTP email
			try {
				emailService.sendOtpEmail(user, otp);
			} catch (Exception e) {
				// Clear OTP if email fails
				user.setOtp(null);
				user.setOtpExpiry(null);
				userRepository.save(user);
				return universalResponse("Failed to send OTP email. Please try again later.", null, HttpStatus.INTERNAL_SERVER_ERROR);
			}
			
			return universalResponse("If an account with that email exists, an OTP has been sent.", null, HttpStatus.OK);
			
		} catch (Exception e) {
			return universalResponse("An error occurred: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	// Verify OTP 
	public ResponseEntity<?> verifyOtp(VerifyOtpRequest request) {
		try {
			Users user = userRepository.findByEmail(request.getEmail());
			
			if (user == null) {
				return universalResponse("Invalid email or OTP", null, HttpStatus.BAD_REQUEST);
			}
			
			// Check if OTP exists
			if (user.getOtp() == null || user.getOtp().isEmpty()) {
				return universalResponse("No OTP found. Please request a new one.", null, HttpStatus.BAD_REQUEST);
			}
			
			// Check if OTP is expired
			if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
				// Clear expired OTP
				user.setOtp(null);
				user.setOtpExpiry(null);
				userRepository.save(user);
				return universalResponse("OTP has expired. Please request a new one.", null, HttpStatus.BAD_REQUEST);
			}
			
			// Verify OTP
			if (!user.getOtp().equals(request.getOtp())) {
				return universalResponse("Invalid OTP. Please try again.", null, HttpStatus.BAD_REQUEST);
			}
			
			// OTP verified successfully - keep it for password reset
			// Don't clear it yet, will be cleared after password reset
			return universalResponse("OTP verified successfully", null, HttpStatus.OK);
			
		} catch (Exception e) {
			return universalResponse("An error occurred: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	// Reset Password
	public ResponseEntity<?> resetPassword(ResetPasswordRequest request) {
		try {
			// Find user by email
			Users user = userRepository.findByEmail(request.getEmail());
			
			if (user == null) {
				return universalResponse("User not found", null, HttpStatus.BAD_REQUEST);
			}
			
			// Check if OTP was verified (OTP should still be present)
			if (user.getOtp() == null || user.getOtp().isEmpty()) {
				return universalResponse("OTP not verified. Please verify OTP first.", null, HttpStatus.BAD_REQUEST);
			}
			
			// Check if OTP is expired
			if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
				// Clear expired OTP
				user.setOtp(null);
				user.setOtpExpiry(null);
				userRepository.save(user);
				return universalResponse("OTP has expired. Please request a new one.", null, HttpStatus.BAD_REQUEST);
			}
			
			// Validate password
			if (request.getPassword() == null || request.getPassword().length() < 6) {
				return universalResponse("Password must be at least 6 characters long", null, HttpStatus.BAD_REQUEST);
			}
			
			// Update password
			String encodedPassword = passwordEncoder.encode(request.getPassword());
			user.setPassword(encodedPassword);
			// Clear OTP after successful password reset
			user.setOtp(null);
			user.setOtpExpiry(null);
			userRepository.save(user);
			
			return universalResponse("Password has been reset successfully", null, HttpStatus.OK);
			
		} catch (Exception e) {
			return universalResponse("An error occurred: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
	}
	
}
