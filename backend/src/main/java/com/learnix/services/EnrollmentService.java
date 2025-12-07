package com.learnix.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Course;
import com.learnix.models.Enrollment;
import com.learnix.models.Payment;
import com.learnix.models.Users;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.PaymentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class EnrollmentService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    MyResponseWrapper responseWrapper;

    // View Enrolled Courses (only paid enrollments with verified successful payments)
    public ResponseEntity<?> getEnrolledCourses(String studentEmail) {
        Users student = userRepository.findByEmail(studentEmail);
        if (student == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
        	return universalResponse("Invalid student email or role", null, HttpStatus.BAD_REQUEST);
        }

        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        
        // Filter only enrollments that:
        // 1. Are marked as paid (isPaid = true)
        // 2. Have at least one successful payment record
        List<Course> courses = enrollments.stream()
                .filter(e -> {
                    // First check if enrollment is marked as paid
                    if (!Boolean.TRUE.equals(e.getIsPaid())) {
                        return false;
                    }
                    
                    // Verify there's actually a successful payment for this enrollment
                    List<Payment> payments = paymentRepository.findByStudentAndCourse(e.getStudent(), e.getCourse());
                    boolean hasSuccessfulPayment = payments.stream()
                            .anyMatch(p -> "SUCCESS".equals(p.getStatus()));
                    
                    // If enrollment says paid but no successful payment exists, mark enrollment as unpaid
                    if (!hasSuccessfulPayment) {
                        e.setIsPaid(false);
                        enrollmentRepository.save(e);
                        return false;
                    }
                    
                    return true;
                })
                .map(Enrollment::getCourse)
                .collect(Collectors.toList());

        if (courses.isEmpty()) {
        	return universalResponse("No enrolled courses found", courses, HttpStatus.NO_CONTENT);
        }

        return universalResponse("Fetched enrolled courses successfully", courses, HttpStatus.OK);
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
	}
}
