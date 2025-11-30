package com.learnix.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Student;
import com.learnix.models.Users;
import com.learnix.repositories.StudentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    // Update student profile (address only)
    public ResponseEntity<?> updateStudentProfile(Long userId, String address, String contact) {
        try {
            Optional<Users> optionalUser = userRepository.findById(userId);
            if (optionalUser.isEmpty()) {
            	return universalResponse("User not found", null, HttpStatus.NOT_FOUND);
            }

            Users user = optionalUser.get();
            if (!"STUDENT".equalsIgnoreCase(user.getRole())) {
            	return universalResponse("User is not a student", null, HttpStatus.BAD_REQUEST);
            }

            // Find or create Student record
            Student student = studentRepository.findByUser(user);
            if (student == null) {
                student = new Student();
                student.setUser(user);
            }

            // Update address
            if (address != null) {
                student.setAddress(address);
            }
            if(contact != null) {
            	student.setContact(contact);
            }

            Student savedStudent = studentRepository.save(student);

            return universalResponse("Student profile updated successfully!", savedStudent, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Error updating student profile: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}

