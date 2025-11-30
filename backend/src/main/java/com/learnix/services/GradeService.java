package com.learnix.services;

import java.security.Principal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Course;
import com.learnix.models.Grade;
import com.learnix.models.Users;
import com.learnix.repositories.CourseRepository;
import com.learnix.repositories.GradeRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class GradeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    public ResponseEntity<?> assignGrade(Principal principal, Long studentId, String gradeValue, String remarks, Long courseId) {
        try {
            Users teacher = userRepository.findByEmail(principal.getName());
            if (teacher == null) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            Users student = userRepository.findById(studentId).orElse(null);
            if (student == null) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            Course course = null;
            if (courseId != null) {
                course = courseRepository.findById(courseId).orElse(null);
            }

            Grade grade = Grade.builder()
                    .student(student)
                    .teacher(teacher)
                    .course(course)
                    .grade(gradeValue)
                    .remarks(remarks)
                    .build();

            Grade saved = gradeRepository.save(grade);
            return universalResponse("Grade assigned successfully", saved, HttpStatus.CREATED);
        } catch (Exception e) {
        	return universalResponse("Error assigning grade: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> recentStudents(int limit) {
        try {
            List<Users> students = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase("STUDENT"))
                    .sorted(Comparator.comparing(Users::getCreatedAt).reversed())
                    .limit(limit)
                    .collect(Collectors.toList());

            return universalResponse("Recent students fetched successfully", students, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching recent students: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
    }
    
}


