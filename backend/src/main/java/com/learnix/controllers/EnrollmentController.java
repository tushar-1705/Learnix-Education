package com.learnix.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.learnix.services.EnrollmentService;

@RestController
@RequestMapping("/api/student")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    // 🔹 View Enrolled Courses
    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getEnrolledCourses(@RequestParam String email) {
        return enrollmentService.getEnrolledCourses(email);
    }

}
