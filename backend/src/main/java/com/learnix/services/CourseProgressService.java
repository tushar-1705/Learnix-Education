package com.learnix.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Course;
import com.learnix.models.CourseContent;
import com.learnix.models.CourseProgress;
import com.learnix.models.Users;
import com.learnix.repositories.CourseContentRepository;
import com.learnix.repositories.CourseProgressRepository;
import com.learnix.repositories.CourseRepository;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class CourseProgressService {

    @Autowired
    private CourseProgressRepository courseProgressRepository;

    @Autowired
    private CourseContentRepository courseContentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    // Mark content as watched
    public ResponseEntity<?> markContentAsWatched(String studentEmail, Long courseId, Long contentId) {
        try {
            Users student = userRepository.findByEmail(studentEmail);
            if (student == null) {
                return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isEmpty()) {
                return universalResponse("Course not found", null, HttpStatus.NOT_FOUND);
            }

            Optional<CourseContent> contentOpt = courseContentRepository.findById(contentId);
            if (contentOpt.isEmpty()) {
                return universalResponse("Content not found", null, HttpStatus.NOT_FOUND);
            }

            Course course = courseOpt.get();
            CourseContent content = contentOpt.get();

            // Check if student is enrolled
            var enrollment = enrollmentRepository.findByStudentAndCourse(student, course);
            if (enrollment == null || !Boolean.TRUE.equals(enrollment.getIsPaid())) {
                return universalResponse("Student is not enrolled in this course", null, HttpStatus.FORBIDDEN);
            }

            // Check if content belongs to course
            if (!content.getCourse().getId().equals(course.getId())) {
                return universalResponse("Content does not belong to this course", null, HttpStatus.BAD_REQUEST);
            }

            // Check if previous content is completed (for sequential unlocking)
            List<CourseContent> allContents = courseContentRepository.findByCourseOrderByOrderIndexAsc(course);
            int currentIndex = -1;
            for (int i = 0; i < allContents.size(); i++) {
                if (allContents.get(i).getId().equals(contentId)) {
                    currentIndex = i;
                    break;
                }
            }

            if (currentIndex > 0) {
                // Check if previous content is completed
                CourseContent previousContent = allContents.get(currentIndex - 1);
                var prevProgress = courseProgressRepository.findByStudentAndContent(student, previousContent);
                if (prevProgress.isEmpty() || !Boolean.TRUE.equals(prevProgress.get().getIsCompleted())) {
                    return universalResponse("Please complete the previous video first", null, HttpStatus.FORBIDDEN);
                }
            }

            // Find or create progress
            Optional<CourseProgress> progressOpt = courseProgressRepository.findByStudentAndContent(student, content);
            CourseProgress progress;
            if (progressOpt.isPresent()) {
                progress = progressOpt.get();
            } else {
                progress = CourseProgress.builder()
                    .student(student)
                    .course(course)
                    .content(content)
                    .isCompleted(true)
                    .build();
            }

            if (!Boolean.TRUE.equals(progress.getIsCompleted())) {
                progress.setIsCompleted(true);
                progress.setCompletedAt(LocalDateTime.now());
            }

            courseProgressRepository.save(progress);

            return universalResponse("Content marked as watched", null, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Error marking content as watched: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus) {
        responseWrapper.setMessage(message);
        responseWrapper.setData(data);
        return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}

