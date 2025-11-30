package com.learnix.services;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;

import com.learnix.models.Announcement;
import com.learnix.models.Course;
import com.learnix.models.Users;
import com.learnix.repositories.*;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class AnnouncementService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private MyResponseWrapper responseWrapper;

    // Create Announcement
    public ResponseEntity<?> createAnnouncement(Principal principal, String title, String message, Long courseId) {
        try {
            Users teacher = userRepository.findByEmail(principal.getName());
            if (teacher == null)
                return error("Teacher not found", HttpStatus.NOT_FOUND);

            Course course = (courseId != null)
                    ? courseRepository.findById(courseId).orElse(null)
                    : null;

            Announcement announcement = Announcement.builder()
                    .title(title)
                    .message(message)
                    .teacher(teacher)
                    .course(course)
                    .build();

            Announcement saved = announcementRepository.save(announcement);

            // Send email notifications
            try {
                var students = (course != null)
                        ? enrollmentRepository.findByCourse(course).stream().map(e -> e.getStudent()).toList()
                        : userRepository.findAll().stream()
                                .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                                .toList();

                students.stream()
                        .filter(s -> s != null && s.getEmail() != null)
                        .forEach(s -> emailService.sendAnnouncementEmail(s, saved));
            } catch (Exception ignore) { }

            return success("Announcement created successfully", saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return error("Error creating announcement: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // List Announcements by Teacher
    public ResponseEntity<?> listMyAnnouncements(Principal principal) {
        try {
            Users teacher = userRepository.findByEmail(principal.getName());
            if (teacher == null)
                return error("Teacher not found", HttpStatus.NOT_FOUND);

            List<Announcement> list = announcementRepository.findByTeacherOrderByCreatedAtDesc(teacher);
            return success("Announcements fetched successfully", list, HttpStatus.OK);
        } catch (Exception e) {
            return error("Error fetching announcements: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Delete Announcement
    public ResponseEntity<?> deleteAnnouncement(Principal principal, Long id) {
        try {
            Users teacher = userRepository.findByEmail(principal.getName());
            if (teacher == null)
                return error("Teacher not found", HttpStatus.NOT_FOUND);

            Announcement ann = announcementRepository.findById(id).orElse(null);
            if (ann == null)
                return error("Announcement not found", HttpStatus.NOT_FOUND);

            if (ann.getTeacher() == null || !ann.getTeacher().getId().equals(teacher.getId()))
                return error("Not authorized to delete this announcement", HttpStatus.FORBIDDEN);

            announcementRepository.deleteById(id);
            return success("Announcement deleted successfully", null, HttpStatus.OK);
        } catch (Exception e) {
            return error("Error deleting announcement: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // List Announcements for Student
    public ResponseEntity<?> listAnnouncementsForStudent() {
        try {
            List<Announcement> list = announcementRepository.findAllByOrderByCreatedAtDesc();
            return success("Announcements fetched successfully", list, HttpStatus.OK);
        } catch (Exception e) {
            return error("Error fetching announcements: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Helper methods
    private ResponseEntity<?> success(String message, Object data, HttpStatus status) {
        responseWrapper.setMessage(message);
        responseWrapper.setData(data);
        return new ResponseEntity<>(responseWrapper, status);
    }

    private ResponseEntity<?> error(String message, HttpStatus status) {
        responseWrapper.setMessage(message);
        responseWrapper.setData(null);
        return new ResponseEntity<>(responseWrapper, status);
    }
}
