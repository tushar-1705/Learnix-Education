package com.learnix.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Course;
import com.learnix.models.CourseContent;
import com.learnix.models.Users;
import com.learnix.repositories.AnnouncementRepository;
import com.learnix.repositories.AttendanceRepository;
import com.learnix.repositories.CourseContentRepository;
import com.learnix.repositories.CourseRepository;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.GradeRepository;
import com.learnix.repositories.PaymentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;
import com.learnix.specification.CourseSpecification;
import com.learnix.specification.SpecificationUtils;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseContentRepository courseContentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private com.learnix.repositories.CourseProgressRepository courseProgressRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    // Helper to calculate course stats
    private Map<String, Object> calculateCourseStats(Course course) {
        var contents = courseContentRepository.findByCourseOrderByOrderIndexAsc(course);
        int lessonCount = contents.size();
        int totalMinutes = contents.stream()
            .filter(c -> c.getDurationMinutes() != null)
            .mapToInt(CourseContent::getDurationMinutes)
            .sum();
        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;
        String duration = hours > 0 ? hours + " hr " + (minutes > 0 ? minutes + " min" : "") : (minutes > 0 ? minutes + " min" : "");
        Map<String, Object> stats = new HashMap<>();
        stats.put("lessonCount", lessonCount);
        stats.put("totalDurationMinutes", totalMinutes);
        stats.put("durationFormatted", duration);
        return stats;
    }

    // Create a course (ADMIN only)
    public ResponseEntity<?> createCourse(Course course, String creatorEmail) {
        Users creator = userRepository.findByEmail(creatorEmail);

        if (creator == null) {
        	return universalResponse("User not found for email: " + creatorEmail, null, HttpStatus.NOT_FOUND);
        }

        // Enforce ADMIN-only 
        if (creator.getRole() == null || !creator.getRole().equalsIgnoreCase("ADMIN")) {
        	return universalResponse("Only ADMIN can create courses", null, HttpStatus.FORBIDDEN);
        }
        Course savedCourse = courseRepository.save(course);

        return universalResponse("Course created successfully by " + creator.getName(), savedCourse, HttpStatus.CREATED);
    }

    // Get all courses with server-side search/filter/sort
    public ResponseEntity<?> getAllCourses(String search, String category, String sortField, String sortDirection) {
    	Specification<Course> spec = SpecificationUtils.and(
    			CourseSpecification.keywordLike(search),
    			CourseSpecification.hasCategory(category));
    	
    	long totalCount = courseRepository.count();
    	List<Course> filteredCourses = courseRepository
    			.findAll(SpecificationUtils.and(spec, CourseSpecification.sortBy(sortField, sortDirection)));
    	
    	List<Map<String, Object>> courseItems = filteredCourses.stream().map(c -> {
    		Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("title", c.getTitle());
            m.put("description", c.getDescription());
            m.put("category", c.getCategory());
            m.put("price", c.getPrice());
            m.put("thumbnail", c.getThumbnail());
            m.put("createdAt", c.getCreatedAt());
            Map<String, Object> stats = calculateCourseStats(c);
            m.put("lessonCount", stats.get("lessonCount"));
            m.put("durationFormatted", stats.get("durationFormatted"));
            m.put("totalDurationMinutes", stats.get("totalDurationMinutes"));
            return m;
    	}).collect(Collectors.toList());
    	
    	Map<String, Object> payload = new HashMap<>();
    	payload.put("items", courseItems);
    	payload.put("total", totalCount);
    	payload.put("matched", courseItems.size());
    	
    	return universalResponse("Fetched courses successfully", payload, HttpStatus.OK);
    }

    // Delete a course
    public ResponseEntity<?> deleteCourse(Long id) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(id);

            if (courseOpt.isEmpty()) {
            	return universalResponse("Course not found with ID: " + id, null, HttpStatus.NOT_FOUND);
            }

            Course course = courseOpt.get();

            // Delete course progress and contents
            var progresses = courseProgressRepository.findByCourse(course);
            if (!progresses.isEmpty()) {
                courseProgressRepository.deleteAll(progresses);
            }

            var contents = courseContentRepository.findByCourseOrderByOrderIndexAsc(course);
            if (!contents.isEmpty()) {
                courseContentRepository.deleteAll(contents);
            }

            // Delete enrollments for this course
            var enrollments = enrollmentRepository.findByCourse(course);
            if (!enrollments.isEmpty()) {
                enrollmentRepository.deleteAll(enrollments);
            }

            // Detach payments to preserve revenue history
            var payments = paymentRepository.findByCourse(course);
            if (!payments.isEmpty()) {
                payments.forEach(p -> p.setCourse(null));
                paymentRepository.saveAll(payments);
            }

            // Detach attendance records linked to this course
            var attendanceRecords = attendanceRepository.findByCourse(course);
            if (!attendanceRecords.isEmpty()) {
                attendanceRecords.forEach(a -> a.setCourse(null));
                attendanceRepository.saveAll(attendanceRecords);
            }

            // Detach grades linked to this course
            var grades = gradeRepository.findByCourse(course);
            if (!grades.isEmpty()) {
                grades.forEach(g -> g.setCourse(null));
                gradeRepository.saveAll(grades);
            }

            // Detach announcements linked to this course
            var announcements = announcementRepository.findByCourse(course);
            if (!announcements.isEmpty()) {
                announcements.forEach(a -> a.setCourse(null));
                announcementRepository.saveAll(announcements);
            }

            courseRepository.delete(course);
            return universalResponse("Course deleted successfully with ID: " + id, null, HttpStatus.OK);
        } catch (DataIntegrityViolationException ex) {
            return universalResponse("Cannot delete course because related records reference it. Please remove linked records and try again.", null, HttpStatus.CONFLICT);
        } catch (Exception ex) {
            return universalResponse("Failed to delete course: " + ex.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get a course by ID
    public ResponseEntity<?> getCourseById(Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);

        if (courseOpt.isEmpty()) {
        	return universalResponse("Course not found with ID: " + id, null, HttpStatus.NOT_FOUND);
        }

        Course course = courseOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("id", course.getId());
        result.put("title", course.getTitle());
        result.put("description", course.getDescription());
        result.put("category", course.getCategory());
        result.put("price", course.getPrice());
        if (course.getThumbnail() != null) {
            result.put("thumbnail", course.getThumbnail());
        }
        result.put("createdAt", course.getCreatedAt());
        Map<String, Object> stats = calculateCourseStats(course);
        result.put("lessonCount", stats.get("lessonCount"));
        result.put("durationFormatted", stats.get("durationFormatted"));
        result.put("totalDurationMinutes", stats.get("totalDurationMinutes"));

        return universalResponse("Course found successfully", result, HttpStatus.OK);
    }

    // Add content item to a course
    public ResponseEntity<?> addCourseContent(Long courseId, CourseContent content) {
        var courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
        	return universalResponse("Course not found with ID: " + courseId, null, HttpStatus.NOT_FOUND);
        }
        content.setCourse(courseOpt.get());
        CourseContent saved = courseContentRepository.save(content);
        return universalResponse("Content added successfully", saved, HttpStatus.CREATED);
    }

    // List course contents (with access control and progressive unlocking)
    public ResponseEntity<?> getCourseContents(Long courseId, String studentEmail) {
        var courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return universalResponse("Course not found with ID: " + courseId, null, HttpStatus.NOT_FOUND);
        }

        Users student = null;

        // Check if student is enrolled and paid
        if (studentEmail != null) {
            var studentOpt = userRepository.findByEmail(studentEmail);
            if (studentOpt != null && "STUDENT".equalsIgnoreCase(studentOpt.getRole())) {
                var enrollmentOpt = enrollmentRepository.findByStudentAndCourse(studentOpt, courseOpt.get());

                // If not enrolled/paid, return read-only preview of course content (no video URLs)
                if (enrollmentOpt == null || !Boolean.TRUE.equals(enrollmentOpt.getIsPaid())) {
                    var previewList = courseContentRepository.findByCourseOrderByOrderIndexAsc(courseOpt.get());
                    List<Map<String, Object>> preview = previewList.stream().map(content -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", content.getId());
                        m.put("title", content.getTitle());
                        m.put("durationMinutes", content.getDurationMinutes());
                        m.put("orderIndex", content.getOrderIndex());
                        // For not-enrolled students, everything is locked and not watched
                        m.put("isUnlocked", false);
                        m.put("isWatched", false);
                        return m;
                    }).collect(Collectors.toList());

                    return universalResponse("Course contents fetched successfully", preview, HttpStatus.OK);
                }

                // Student is enrolled & paid
                student = studentOpt;
            }
        }

        var list = courseContentRepository.findByCourseOrderByOrderIndexAsc(courseOpt.get());

        // If student is enrolled, add unlock status for progressive unlocking
        if (student != null) {
            List<Map<String, Object>> contentsWithStatus = new java.util.ArrayList<>();
            for (int i = 0; i < list.size(); i++) {
                CourseContent content = list.get(i);
                Map<String, Object> contentMap = new HashMap<>();
                contentMap.put("id", content.getId());
                contentMap.put("title", content.getTitle());
                contentMap.put("videoUrl", content.getVideoUrl());
                contentMap.put("durationMinutes", content.getDurationMinutes());
                contentMap.put("orderIndex", content.getOrderIndex());

                // First video is always unlocked if enrolled
                boolean isUnlocked = (i == 0);
                boolean isWatched = false;

                if (i > 0) {
                    // Check if previous content is completed
                    CourseContent previousContent = list.get(i - 1);
                    var prevProgress = courseProgressRepository.findByStudentAndContent(student, previousContent);
                    if (prevProgress.isPresent() && Boolean.TRUE.equals(prevProgress.get().getIsCompleted())) {
                        isUnlocked = true;
                    }
                }

                // Check if current content is watched
                var currentProgress = courseProgressRepository.findByStudentAndContent(student, content);
                if (currentProgress.isPresent() && Boolean.TRUE.equals(currentProgress.get().getIsCompleted())) {
                    isWatched = true;
                }

                contentMap.put("isUnlocked", isUnlocked);
                contentMap.put("isWatched", isWatched);
                contentsWithStatus.add(contentMap);
            }
            return universalResponse("Course contents fetched successfully", contentsWithStatus, HttpStatus.OK);
        }

        // For non-students or when no email is provided, return raw list (existing behaviour)
        return universalResponse("Course contents fetched successfully", list, HttpStatus.OK);
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
	}
}
