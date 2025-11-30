package com.learnix.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.learnix.models.StudentHelp;
import com.learnix.models.Users;
import com.learnix.repositories.StudentHelpRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class StudentHelpService {

    @Autowired
    private StudentHelpRepository studentHelpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    // Submit a help request
    public ResponseEntity<?> submitHelpRequest(String studentEmail, String issue) {
        try {
            Users student = userRepository.findByEmail(studentEmail);
            if (student == null) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }
            if (!"STUDENT".equalsIgnoreCase(student.getRole())) {
            	return universalResponse("User is not a student", null, HttpStatus.BAD_REQUEST);
            }

            StudentHelp helpRequest = StudentHelp.builder()
                    .student(student)
                    .issue(issue)
                    .status("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build();

            StudentHelp saved = studentHelpRepository.save(helpRequest);

            return universalResponse("Help request submitted successfully", saved, HttpStatus.CREATED);
        } catch (Exception e) {
        	return universalResponse("Error submitting help request: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all help requests for a student
    public ResponseEntity<?> getStudentHelpRequests(String studentEmail) {
        try {
            Users student = userRepository.findByEmail(studentEmail);
            if (student == null) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }
            List<StudentHelp> helpRequests = studentHelpRepository.findByStudent(student);

            return universalResponse("Help requests fetched successfully", helpRequests, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching help requests: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all help requests (for admin) with filtering
    public ResponseEntity<?> getAllHelpRequests(String status, String search) {
        try {
            List<StudentHelp> helpRequests = studentHelpRepository.findAllByOrderByCreatedAtDesc();
            int total = helpRequests.size();
            
            java.util.stream.Stream<StudentHelp> stream = helpRequests.stream();
            
            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
            	stream = stream.filter(req -> status.equalsIgnoreCase(req.getStatus()));
            }
            
            if (StringUtils.hasText(search)) {
            	String keyword = search.trim().toLowerCase();
            	stream = stream.filter(req -> {
            		Users student = req.getStudent();
            		return (student != null && (
            				student.getName() != null && student.getName().toLowerCase().contains(keyword) ||
            				student.getEmail() != null && student.getEmail().toLowerCase().contains(keyword)
            		)) || (req.getIssue() != null && req.getIssue().toLowerCase().contains(keyword));
            	});
            }
            
            List<StudentHelp> filtered = stream.collect(Collectors.toList());
            long pendingCount = helpRequests.stream().filter(r -> "PENDING".equalsIgnoreCase(r.getStatus())).count();
            long resolvedCount = helpRequests.stream().filter(r -> "RESOLVED".equalsIgnoreCase(r.getStatus())).count();
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("items", filtered);
            payload.put("total", total);
            payload.put("matched", filtered.size());
            payload.put("statusCounts", Map.of(
            		"PENDING", pendingCount,
            		"RESOLVED", resolvedCount
            ));

            return universalResponse("Help requests fetched successfully", payload, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Error fetching help requests: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Update help request status (for admin)
    public ResponseEntity<?> updateHelpRequestStatus(Long helpId, String status) {
        try {
            Optional<StudentHelp> optionalHelp = studentHelpRepository.findById(helpId);
            if (optionalHelp.isEmpty()) {
            	return universalResponse("Help request not found", null, HttpStatus.NOT_FOUND);
            }

            StudentHelp helpRequest = optionalHelp.get();
            helpRequest.setStatus(status);
            if ("RESOLVED".equalsIgnoreCase(status)) {
                helpRequest.setResolvedAt(LocalDateTime.now());
            }

            StudentHelp updated = studentHelpRepository.save(helpRequest);

            return universalResponse("Help request status updated successfully", updated, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error updating help request: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Add reply to help request (for admin) - Only allow one reply per request
    public ResponseEntity<?> addReplyToHelpRequest(Long helpId, String reply) {
        try {
            Optional<StudentHelp> optionalHelp = studentHelpRepository.findById(helpId);
            if (optionalHelp.isEmpty()) {
            	return universalResponse("Help request not found", null, HttpStatus.NOT_FOUND);
            }

            StudentHelp helpRequest = optionalHelp.get();
            
            // Prevent updating if reply already exists
            if (helpRequest.getReply() != null && !helpRequest.getReply().isEmpty()) {
            	return universalResponse("Reply already exists. Cannot update reply.", null, HttpStatus.BAD_REQUEST);
            }

            helpRequest.setReply(reply);
            helpRequest.setRepliedAt(LocalDateTime.now());
            // Mark as resolved when admin replies
            helpRequest.setStatus("RESOLVED");
            helpRequest.setResolvedAt(LocalDateTime.now());

            StudentHelp updated = studentHelpRepository.save(helpRequest);

            return universalResponse("Reply added successfully", updated, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error adding reply: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}

