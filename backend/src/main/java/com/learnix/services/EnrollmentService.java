package com.learnix.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Course;
import com.learnix.models.Enrollment;
import com.learnix.models.Users;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class EnrollmentService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;
    
    @Autowired
    MyResponseWrapper responseWrapper;

    // View Enrolled Courses (only paid enrollments)
    public ResponseEntity<?> getEnrolledCourses(String studentEmail) {
        Users student = userRepository.findByEmail(studentEmail);
        if (student == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
        	return universalResponse("Invalid student email or role", null, HttpStatus.BAD_REQUEST);
        }

        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        // Filter only paid enrollments
        List<Course> courses = enrollments.stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsPaid()))
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
