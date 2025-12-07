package com.learnix.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.learnix.models.Announcement;
import com.learnix.models.Attendance;
import com.learnix.models.Course;
import com.learnix.models.Enrollment;
import com.learnix.models.Grade;
import com.learnix.models.Student;
import com.learnix.models.Teacher;
import com.learnix.models.TeacherSubject;
import com.learnix.models.UpcomingEvent;
import com.learnix.models.Users;
import com.learnix.repositories.AnnouncementRepository;
import com.learnix.repositories.AttendanceRepository;
import com.learnix.repositories.CourseProgressRepository;
import com.learnix.repositories.CourseRepository;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.GradeRepository;
import com.learnix.repositories.OnlineTestRepository;
import com.learnix.repositories.OnlineTestSubmissionRepository;
import com.learnix.repositories.StudentHelpRepository;
import com.learnix.repositories.StudentRepository;
import com.learnix.repositories.TeacherRepository;
import com.learnix.repositories.TeacherSubjectRepository;
import com.learnix.repositories.UpcomingEventRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;
import com.learnix.specification.SpecificationUtils;
import com.learnix.specification.UserSpecification;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TeacherSubjectRepository teacherSubjectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MyResponseWrapper responseWrapper;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private com.learnix.repositories.PaymentRepository paymentRepository;

    @Autowired
    private UpcomingEventRepository upcomingEventRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private StudentHelpRepository studentHelpRepository;

    @Autowired
    private CourseProgressRepository courseProgressRepository;

    @Autowired
    private OnlineTestSubmissionRepository onlineTestSubmissionRepository;
    
    @Autowired
    private OnlineTestRepository onlineTestRepository;

    // Get all students
    public ResponseEntity<?> getAllStudents(String search, String sortField, String sortDirection) {
        try {
            Specification<Users> baseSpec = SpecificationUtils.and(
                    UserSpecification.hasRole("STUDENT"),
                    UserSpecification.keywordLike(search));

            long total = userRepository.count(UserSpecification.hasRole("STUDENT"));
            List<Users> filtered = userRepository.findAll(
                    SpecificationUtils.and(baseSpec, UserSpecification.sortBy(sortField, sortDirection)));
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("items", filtered);
            payload.put("total", total);
            payload.put("matched", filtered.size());

            return universalResponse("Students fetched successfully", payload, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching students: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all teachers
    public ResponseEntity<?> getAllTeachers(String search, String sortField, String sortDirection) {
        try {
            Specification<Users> baseSpec = SpecificationUtils.and(
                    UserSpecification.hasRole("TEACHER"),
                    UserSpecification.keywordLike(search));
            
            long total = userRepository.count(UserSpecification.hasRole("TEACHER"));
            List<Users> filtered = userRepository.findAll(
                    SpecificationUtils.and(baseSpec, UserSpecification.sortBy(sortField, sortDirection)));
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("items", filtered);
            payload.put("total", total);
            payload.put("matched", filtered.size());

            return universalResponse("Teachers fetched successfully", payload, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching teachers: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Create new teacher 
    public ResponseEntity<?> createTeacher(Users teacher, String qualification, String address) {
        try {
            if (userRepository.findByEmail(teacher.getEmail()) != null) {
            	return universalResponse("Email already exists", null, HttpStatus.BAD_REQUEST);
            }

            teacher.setRole("TEACHER");
            // Validate password presence
            if (teacher.getPassword() == null || teacher.getPassword().isEmpty()) {
            	return universalResponse("Password is required for teacher", null, HttpStatus.BAD_REQUEST);
            }
            // Encode password and set meta fields
            teacher.setPassword(passwordEncoder.encode(teacher.getPassword()));
            teacher.setIsApproved(true);            // teachers are auto-approved
            teacher.setLoggedBy("EMAIL");           // created via email by admin

            Users savedTeacher = userRepository.save(teacher);

            // Create teacher-specific record in Teacher table
            Teacher teacherRecord = new Teacher();
            teacherRecord.setUser(savedTeacher);
            teacherRecord.setContact(teacher.getPhoneNumber()); 
            if (qualification != null && !qualification.trim().isEmpty()) {
                teacherRecord.setQualification(qualification.trim());
            }
            if (address != null && !address.trim().isEmpty()) {
                teacherRecord.setAddress(address.trim());
            }
            teacherRepository.save(teacherRecord);

            return universalResponse("Teacher created successfully", savedTeacher, HttpStatus.CREATED);
        } catch (Exception e) {
        	return universalResponse("Error creating teacher: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Dashboard statistics
    public ResponseEntity<?> getDashboardStats() {
        try {
            long totalStudents = userRepository.findAll().stream()
                    .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                    .count();
            long totalTeachers = userRepository.findAll().stream()
                    .filter(u -> "TEACHER".equalsIgnoreCase(u.getRole()))
                    .count();
            long totalCourses = courseRepository.count();
            long totalEnrollments = enrollmentRepository.count();
            long activeStudents = enrollmentRepository.findAll().stream()
                    .map(Enrollment::getStudent)
                    .distinct()
                    .count();

            // Calculate pending admissions (students not approved)
            long pendingAdmissions = userRepository.findAll().stream()
                    .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                    .filter(student -> {
                        Boolean isApproved = student.getIsApproved();
                        return isApproved == null || !isApproved;
                    })
                    .count();

            // Calculate average attendance
            List<Attendance> allAttendances = attendanceRepository.findAll();
            long totalPresent = allAttendances.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                .count();
            double avgAttendance = allAttendances.isEmpty() ? 0.0 :
                (totalPresent * 100.0) / allAttendances.size();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalStudents", totalStudents);
            stats.put("totalTeachers", totalTeachers);
            stats.put("totalCourses", totalCourses);
            stats.put("totalEnrollments", totalEnrollments);
            stats.put("activeStudents", activeStudents);
            stats.put("pendingAdmissions", pendingAdmissions);
            stats.put("avgAttendance", Math.round(avgAttendance));
            
            // Get revenue from PaymentService
            Map<String, Object> revenueStats = paymentService.getRevenueStats();
            stats.put("totalRevenue", revenueStats.get("totalRevenue"));
            stats.put("monthlyRevenue", revenueStats.get("monthlyRevenue"));
            stats.put("yearlyRevenue", revenueStats.get("yearlyRevenue"));

            return universalResponse("Statistics fetched successfully", stats, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching statistics: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Analytics
    public ResponseEntity<?> getAnalytics() {
        try {
            Map<String, Object> analytics = new HashMap<>();

            List<Course> courses = courseRepository.findAll();
            Map<String, Long> courseDistribution = new HashMap<>();
            for (Course course : courses) {
                String category = course.getCategory() != null ? course.getCategory() : "Others";
                courseDistribution.put(category, courseDistribution.getOrDefault(category, 0L) + 1);
            }

            // Calculate actual enrollment trends based on enrolledAt date
            List<Enrollment> allEnrollments = enrollmentRepository.findAll();
            java.time.LocalDate now = java.time.LocalDate.now();
            java.time.YearMonth currentYearMonth = java.time.YearMonth.from(now);
            
            List<Map<String, Object>> enrollmentTrends = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                java.time.YearMonth targetYearMonth = currentYearMonth.minusMonths(i);
                int targetMonth = targetYearMonth.getMonthValue();
                int targetYear = targetYearMonth.getYear();
                
                // Count enrollments for this specific month
                long count = allEnrollments.stream()
                    .filter(e -> e.getEnrolledAt() != null)
                    .filter(e -> {
                        java.time.LocalDate enrolledDate = e.getEnrolledAt().toLocalDate();
                        return enrolledDate.getYear() == targetYear && 
                               enrolledDate.getMonthValue() == targetMonth;
                    })
                    .count();
                
                Map<String, Object> trend = new HashMap<>();
                trend.put("month", getMonthName(i));
                trend.put("enrollments", count);
                enrollmentTrends.add(trend);
            }

            // Calculate attendance trends (monthly average attendance)
            List<Attendance> allAttendances = attendanceRepository.findAll();
            List<Map<String, Object>> attendanceTrends = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                java.time.YearMonth targetYearMonth = currentYearMonth.minusMonths(i);
                int targetMonth = targetYearMonth.getMonthValue();
                int targetYear = targetYearMonth.getYear();
                
                // Filter attendances for this month
                List<Attendance> monthAttendances = allAttendances.stream()
                    .filter(a -> a.getDate() != null)
                    .filter(a -> {
                        java.time.LocalDate attendanceDate = a.getDate();
                        return attendanceDate.getYear() == targetYear && 
                               attendanceDate.getMonthValue() == targetMonth;
                    })
                    .collect(Collectors.toList());
                
                // Calculate average attendance percentage for this month
                long presentCount = monthAttendances.stream()
                    .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                    .count();
                double attendancePercent = monthAttendances.isEmpty() ? 0.0 :
                    (presentCount * 100.0) / monthAttendances.size();
                
                Map<String, Object> trend = new HashMap<>();
                trend.put("month", getMonthName(i));
                trend.put("attendance", Math.round(attendancePercent));
                attendanceTrends.add(trend);
            }

            // Calculate revenue trends (monthly revenue)
            List<com.learnix.models.Payment> allPayments = paymentRepository.findByStatus("SUCCESS");
            List<Map<String, Object>> revenueTrends = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                java.time.YearMonth targetYearMonth = currentYearMonth.minusMonths(i);
                int targetMonth = targetYearMonth.getMonthValue();
                int targetYear = targetYearMonth.getYear();
                
                // Filter payments for this month
                double monthRevenue = allPayments.stream()
                    .filter(p -> p.getCreatedAt() != null)
                    .filter(p -> {
                        java.time.LocalDate paymentDate = p.getCreatedAt().toLocalDate();
                        return paymentDate.getYear() == targetYear && 
                               paymentDate.getMonthValue() == targetMonth;
                    })
                    .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
                    .sum();
                
                Map<String, Object> trend = new HashMap<>();
                trend.put("month", getMonthName(i));
                trend.put("revenue", monthRevenue);
                revenueTrends.add(trend);
            }

            // Calculate overall average attendance
            long totalPresent = allAttendances.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                .count();
            double avgAttendance = allAttendances.isEmpty() ? 0.0 :
                (totalPresent * 100.0) / allAttendances.size();

            analytics.put("courseDistribution", courseDistribution);
            analytics.put("enrollmentTrends", enrollmentTrends);
            analytics.put("attendanceTrends", attendanceTrends);
            analytics.put("revenueTrends", revenueTrends);
            analytics.put("avgAttendance", Math.round(avgAttendance));
            analytics.put("totalEnrollments", enrollmentRepository.count());
            analytics.put("totalCourses", courseRepository.count());
            analytics.put("totalStudents", userRepository.findAll().stream()
                    .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole())).count());
            analytics.put("totalTeachers", userRepository.findAll().stream()
                    .filter(u -> "TEACHER".equalsIgnoreCase(u.getRole())).count());

            return universalResponse("Analytics fetched successfully", analytics, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching analytics: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Upcoming Events 
    public ResponseEntity<?> createUpcomingEvent(String title, String description, String eventAtIso) {
        try {
            if (title == null || title.trim().isEmpty()) {
            	return universalResponse("Title is required", null, HttpStatus.BAD_REQUEST);
            }
            java.time.LocalDateTime eventAt = null;
            try {
                eventAt = eventAtIso != null ? java.time.LocalDateTime.parse(eventAtIso) : null;
            } catch (Exception e) {
                // ignore parse error
            }
            UpcomingEvent ev = UpcomingEvent.builder()
                    .title(title.trim())
                    .description(description)
                    .eventAt(eventAt != null ? eventAt : java.time.LocalDateTime.now().plusDays(1))
                    .enabled(true)
                    .build();
            UpcomingEvent saved = upcomingEventRepository.save(ev);
            
            // Send email notifications to all students
            try {
                List<Users> students = userRepository.findAll().stream()
                        .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase("STUDENT"))
                        .filter(s -> s.getEmail() != null && !s.getEmail().trim().isEmpty())
                        .collect(Collectors.toList());
                
                for (Users student : students) {
                    emailService.sendEventNotificationEmail(student, saved);
                }
            } catch (Exception e) {
                // Log the error but don't fail the event creation
                System.err.println("Error sending event notification emails: " + e.getMessage());
            }
            
            return universalResponse("Event Created", saved, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error creating event: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> listUpcomingEvents(boolean onlyFuture) {
        try {
            List<UpcomingEvent> events;
            if (onlyFuture) {
                events = upcomingEventRepository.findByEnabledTrueAndEventAtAfterOrderByEventAtAsc(java.time.LocalDateTime.now());
            } else {
                events = upcomingEventRepository.findByEnabledTrueOrderByCreatedAtDesc();
            }
            return universalResponse("Events fetched", events, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching events: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    public ResponseEntity<?> listAllEventsForAdmin(boolean onlyFuture) {
        try {
            List<UpcomingEvent> events = onlyFuture
                    ? upcomingEventRepository.findByEventAtAfterOrderByEventAtAsc(java.time.LocalDateTime.now())
                    : upcomingEventRepository.findAll();
            // Sort by createdAt descending (newest first)
            events.sort((a, b) -> {
                if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return universalResponse("Events fetched", events, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching events: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> deleteUpcomingEvent(Long id) {
        try {
            upcomingEventRepository.deleteById(id);
            return universalResponse("Event deleted", null, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error deleting event: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> updateUpcomingEvent(Long id, String title, String description, String eventAtIso) {
        try {
            UpcomingEvent ev = upcomingEventRepository.findById(id).orElse(null);
            if (ev == null) {
            	return universalResponse("Event not found", null, HttpStatus.NOT_FOUND);
            }
            if (title != null && !title.trim().isEmpty()) {
                ev.setTitle(title.trim());
            }
            if (description != null) {
                ev.setDescription(description);
            }
            if (eventAtIso != null && !eventAtIso.isEmpty()) {
                try {
                    ev.setEventAt(java.time.LocalDateTime.parse(eventAtIso));
                } catch (Exception ignored) {}
            }
            UpcomingEvent saved = upcomingEventRepository.save(ev);
            return universalResponse("Event updated", saved, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error updating event: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    public void deleteEventsPast24HoursAfterEventDate() {
        try {
            // Get current time minus 24 hours
            java.time.LocalDateTime twentyFourHoursAgo = java.time.LocalDateTime.now().minusHours(24);
            
            // Find all events where eventAt is more than 24 hours in the past
            List<UpcomingEvent> pastEvents = upcomingEventRepository.findByEventAtBefore(twentyFourHoursAgo);
            
            if (!pastEvents.isEmpty()) {
                upcomingEventRepository.deleteAll(pastEvents);
            }
        } catch (Exception e) {
            System.err.println("Error deleting past events: " + e.getMessage());
        }
    }
    // Delete student 
    public ResponseEntity<?> deleteStudent(Long id) {
        try {
            Users student = userRepository.findById(id).orElse(null);
            if (student == null || !"STUDENT".equalsIgnoreCase(student.getRole())) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            // Get Student entity if exists
            Student studentRecord = studentRepository.findByUser(student);

            // Step 1: Delete all OnlineTestSubmission records (uses Student entity)
            if (studentRecord != null) {
                var testSubmissions = onlineTestSubmissionRepository.findByStudent(studentRecord);
                if (testSubmissions != null && !testSubmissions.isEmpty()) {
                    onlineTestSubmissionRepository.deleteAll(testSubmissions);
                }
            }

            // Step 2: Delete all CourseProgress records
            var allCourseProgresses = courseProgressRepository.findAll().stream()
                    .filter(cp -> cp.getStudent() != null && cp.getStudent().getId().equals(student.getId()))
                    .collect(Collectors.toList());
            if (!allCourseProgresses.isEmpty()) {
                courseProgressRepository.deleteAll(allCourseProgresses);
            }

            // Step 3: Delete all StudentHelp records
            var studentHelps = studentHelpRepository.findByStudent(student);
            if (studentHelps != null && !studentHelps.isEmpty()) {
                studentHelpRepository.deleteAll(studentHelps);
            }

            // Step 4: Preserve Payment records for revenue history
            var payments = paymentRepository.findByStudent(student);
            if (payments != null && !payments.isEmpty()) {
                for (var payment : payments) {
                    payment.setStudent(null); 
                }
                paymentRepository.saveAll(payments);
            }

            // Step 5: Delete all Enrollment records
            var enrollments = enrollmentRepository.findByStudent(student);
            if (enrollments != null && !enrollments.isEmpty()) {
                enrollmentRepository.deleteAll(enrollments);
            }

            // Step 6: Delete all Attendance records
            var attendances = attendanceRepository.findByStudent(student);
            if (attendances != null && !attendances.isEmpty()) {
                attendanceRepository.deleteAll(attendances);
            }

            // Step 7: Delete all Grade records
            var grades = gradeRepository.findByStudent(student);
            if (grades != null && !grades.isEmpty()) {
                gradeRepository.deleteAll(grades);
            }

            // Step 8: Delete Student entity
            if (studentRecord != null) {
                studentRepository.delete(studentRecord);
            }

            // Step 9: Finally delete the Users entity
            userRepository.delete(student);
            
            return universalResponse("Student deleted successfully", null, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error deleting student: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Delete teacher 
    public ResponseEntity<?> deleteTeacher(Long id) {
        try {
            Users teacher = userRepository.findById(id).orElse(null);
            if (teacher == null || !"TEACHER".equalsIgnoreCase(teacher.getRole())) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }
            
            // Get Teacher record
            Teacher teacherRecord = teacherRepository.findByUser(teacher);
            
            // Step 1: Delete all TeacherSubject records for this teacher
            if (teacherRecord != null) {
                List<TeacherSubject> teacherSubjects = teacherSubjectRepository.findByTeacher(teacherRecord);
                if (teacherSubjects != null && !teacherSubjects.isEmpty()) {
                    teacherSubjectRepository.deleteAll(teacherSubjects);
                }
            }
            
            // Step 2: Set teacher to null for all Courses (since teacher is optional in Course)
            List<Course> courses = courseRepository.findByTeacher(teacher);
            if (courses != null && !courses.isEmpty()) {
                for (Course course : courses) {
                    course.setTeacher(null);
                    courseRepository.save(course);
                }
            }
            
            // Step 3: Delete all Grades for this teacher (teacher is required in Grade)
            List<Grade> grades = gradeRepository.findByTeacher(teacher);
            if (grades != null && !grades.isEmpty()) {
                gradeRepository.deleteAll(grades);
            }
            
            // Step 4: Delete all Announcements for this teacher (teacher is required in Announcement)
            List<Announcement> announcements = announcementRepository.findByTeacherOrderByCreatedAtDesc(teacher);
            if (announcements != null && !announcements.isEmpty()) {
                announcementRepository.deleteAll(announcements);
            }
            
            // Step 5: Delete all Attendance records for this teacher (teacher is required in Attendance)
            List<Attendance> attendances = attendanceRepository.findByTeacher(teacher);
            if (attendances != null && !attendances.isEmpty()) {
                attendanceRepository.deleteAll(attendances);
            }
            
            // Step 6: Delete all OnlineTest records and their submissions for this teacher
            if (teacherRecord != null && teacher.getId() != null) {
                List<com.learnix.models.OnlineTest> onlineTests = onlineTestRepository.findByTeacherUserId(teacher.getId());
                if (onlineTests != null && !onlineTests.isEmpty()) {
                    for (com.learnix.models.OnlineTest test : onlineTests) {
                        // Delete all submissions for this test (which will cascade delete answers)
                        List<com.learnix.models.OnlineTestSubmission> submissions = onlineTestSubmissionRepository.findByTest(test);
                        if (submissions != null && !submissions.isEmpty()) {
                            onlineTestSubmissionRepository.deleteAll(submissions);
                        }
                        // Delete the test (which will cascade delete questions)
                        onlineTestRepository.delete(test);
                    }
                }
            }
            
            // Step 7: Delete the Teacher record
            if (teacherRecord != null) {
                teacherRepository.delete(teacherRecord);
            }
            
            // Step 8: Delete the Users record
            userRepository.delete(teacher);
            
            return universalResponse("Teacher deleted successfully", null, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error deleting teacher: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get recent admissions 
    public ResponseEntity<?> getRecentAdmissions(int limit) {
        try {
            List<Map<String, Object>> admissions = userRepository.findAll().stream()
                    .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                    .sorted((a, b) -> {
                        if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                        if (a.getCreatedAt() == null) return 1;
                        if (b.getCreatedAt() == null) return -1;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    })
                    .limit(limit)
                    .map(student -> {
                        Map<String, Object> admission = new HashMap<>();
                        admission.put("id", student.getId());
                        admission.put("name", student.getName());
                        admission.put("email", student.getEmail());
                        admission.put("phoneNumber", student.getPhoneNumber());
                        admission.put("date", student.getCreatedAt() != null ? 
                            student.getCreatedAt().toLocalDate().toString() : "");
                        admission.put("createdAt", student.getCreatedAt());
                        
                        // Check approval status
                        Boolean isApproved = student.getIsApproved();
                        admission.put("status", (isApproved != null && isApproved) ? "approved" : "pending");
                        
                        // Get course name if enrolled
                        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
                        String courseName = "Not enrolled";
                        if (!enrollments.isEmpty()) {
                            Course course = enrollments.get(0).getCourse();
                            if (course != null) {
                                courseName = course.getTitle() != null ? course.getTitle() : "Unknown Course";
                            }
                        }
                        admission.put("course", courseName);
                        
                        return admission;
                    })
                    .collect(Collectors.toList());

            return universalResponse("Recent admissions fetched successfully", admissions, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching recent admissions: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Approve admission
    public ResponseEntity<?> approveAdmission(Long studentId) {
        try {
            Users student = userRepository.findById(studentId).orElse(null);
            if (student == null || !"STUDENT".equalsIgnoreCase(student.getRole())) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            // Set approval status to true
            student.setIsApproved(true);
            Users approvedStudent = userRepository.save(student);
            approvedStudent.setPassword(null); // Don't return password
            
            return universalResponse("Admission approved successfully", approvedStudent, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error approving admission: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // List all pending admissions
    public ResponseEntity<?> getPendingAdmissions(String search) {
        try {
            Specification<Users> pendingSpec = SpecificationUtils.and(
                    UserSpecification.hasRole("STUDENT"),
                    UserSpecification.isApproved(false));
            
            long total = userRepository.count(pendingSpec);
            List<Users> pendingUsers = userRepository
                    .findAll(SpecificationUtils.and(
                            SpecificationUtils.and(pendingSpec, UserSpecification.keywordLike(search)),
                            UserSpecification.sortBy("createdAt", "desc")));
            
            List<Map<String, Object>> result = pendingUsers.stream()
            		.map(student -> {
            			Map<String, Object> item = new HashMap<>();
                        item.put("id", student.getId());
                        item.put("name", student.getName());
                        item.put("email", student.getEmail());
                        item.put("phoneNumber", student.getPhoneNumber());
                        item.put("createdAt", student.getCreatedAt());
                        item.put("profilePhoto", student.getProfilePhoto());
                        return item;
            		})
            		.collect(Collectors.toList());
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("items", result);
            payload.put("total", total);
            payload.put("matched", result.size());

            return universalResponse("Pending admissions fetched successfully", payload, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching pending admissions: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get top performers by attendance 
    public ResponseEntity<?> getTopPerformers(int limit) {
        try {
            List<Users> students = userRepository.findAll().stream()
                    .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                    .collect(Collectors.toList());

            List<Map<String, Object>> performers = students.stream()
                    .map(student -> {
                        Map<String, Object> performer = new HashMap<>();
                        performer.put("id", student.getId());
                        performer.put("name", student.getName());
                        performer.put("email", student.getEmail());
                        
                        // Calculate attendance percentage
                        List<Attendance> attendances = attendanceRepository.findByStudent(student);
                        long presentCount = attendances.stream()
                                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                                .count();
                        double attendancePercent = attendances.isEmpty() ? 0.0 :
                            (presentCount * 100.0) / attendances.size();
                        // Store as Integer to avoid ClassCastException in comparator
                        performer.put("attendance", (int) Math.round(attendancePercent));
                        
                        // Get course name if enrolled
                        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
                        String courseName = "Not enrolled";
                        if (!enrollments.isEmpty()) {
                            Course course = enrollments.get(0).getCourse();
                            if (course != null) {
                                courseName = course.getTitle() != null ? course.getTitle() : "Unknown Course";
                            }
                        }
                        performer.put("course", courseName);
                        
                        // Calculate average score (placeholder - you might want to get from grades)
                        performer.put("score", 0); // TODO: Calculate from grades if available
                        
                        return performer;
                    })
                    .sorted((a, b) -> {
                        Integer attendanceA = ((Number) a.get("attendance")).intValue();
                        Integer attendanceB = ((Number) b.get("attendance")).intValue();
                        return attendanceB.compareTo(attendanceA); // Descending order
                    })
                    .limit(limit)
                    .collect(Collectors.toList());

            // Add rank
            for (int i = 0; i < performers.size(); i++) {
                performers.get(i).put("rank", i + 1);
            }

            return universalResponse("Top performers fetched successfully", performers, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching top performers: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getMonthName(int monthsAgo) {
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        int currentMonth = java.time.LocalDate.now().getMonthValue() - 1;
        int targetMonth = (currentMonth - monthsAgo + 12) % 12;
        return months[targetMonth];
    }

    //  Get student attendance (for student panel) 
    public ResponseEntity<?> getStudentAttendance(String email) {
        try {
            Users student = userRepository.findByEmail(email);
            if (student == null || student.getRole() == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            List<Attendance> attendanceList = attendanceRepository.findByStudent(student);
            
            // Calculate statistics
            long presentCount = attendanceList.stream()
                    .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                    .count();
            long absentCount = attendanceList.size() - presentCount;
            double attendancePercent = attendanceList.isEmpty() ? 0.0 :
                    (presentCount * 100.0) / attendanceList.size();

            // Build attendance records with teacher and class info
            List<Map<String, Object>> records = attendanceList.stream()
                    .sorted((a, b) -> b.getDate().compareTo(a.getDate())) // Most recent first
                    .map(attendance -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("id", attendance.getId());
                        record.put("date", attendance.getDate().toString());
                        record.put("status", attendance.getStatus());
                        
                        Users teacher = attendance.getTeacher();
                        String teacherName = "Unknown";
                        String className = "General";
                        
                        if (teacher != null) {
                            teacherName = teacher.getName() != null ? teacher.getName() : "Unknown";
                            
                            // Get class name - prefer subject from attendance (the specific subject for which attendance was marked)
                            if (attendance.getSubject() != null && !attendance.getSubject().trim().isEmpty()) {
                                // Use the specific subject for which attendance was marked (new records)
                                className = attendance.getSubject();
                            } else if (attendance.getCourse() != null && attendance.getCourse().getTitle() != null) {
                                // Fall back to course title if subject is not available
                                className = attendance.getCourse().getTitle();
                            } else {
                                // For old records without subject, try to get teacher's assigned subjects
                                Teacher teacherRecord = teacherRepository.findByUser(teacher);
                                if (teacherRecord != null) {
                                    List<TeacherSubject> teacherSubjects = teacherSubjectRepository.findByTeacher(teacherRecord);
                                    if (teacherSubjects != null && !teacherSubjects.isEmpty()) {
                                        // Get all assigned subjects, filter out null/empty, and join with comma
                                        String subjects = teacherSubjects.stream()
                                                .map(TeacherSubject::getSubject)
                                                .filter(s -> s != null && !s.trim().isEmpty())
                                                .collect(Collectors.joining(", "));
                                        
                                        if (!subjects.isEmpty()) {
                                            className = subjects;
                                        }
                                    }
                                }
                                // If still "General", it means teacher has no subjects assigned
                            }
                        }
                        
                        record.put("teacherName", teacherName);
                        record.put("className", className);
                        return record;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("records", records);
            data.put("total", attendanceList.size());
            data.put("present", presentCount);
            data.put("absent", absentCount);
            data.put("attendancePercent", Math.round(attendancePercent));

            return universalResponse("Student attendance fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching student attendance: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get student attendance summary (for student dashboard)
    public ResponseEntity<?> getStudentAttendanceSummary(String email) {
        try {
            Users student = userRepository.findByEmail(email);
            if (student == null || student.getRole() == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            List<Attendance> attendanceList = attendanceRepository.findByStudent(student);
            
            // Calculate statistics
            long presentCount = attendanceList.stream()
                    .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
                    .count();
            double attendancePercent = attendanceList.isEmpty() ? 0.0 :
                    (presentCount * 100.0) / attendanceList.size();

            Map<String, Object> data = new HashMap<>();
            data.put("attendancePercent", Math.round(attendancePercent));
            data.put("total", attendanceList.size());
            data.put("present", presentCount);
            data.put("absent", attendanceList.size() - presentCount);

            return universalResponse("Student attendance summary fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching student attendance summary: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get student grades/marks (for student panel)
    public ResponseEntity<?> getStudentGrades(String email) {
        try {
            Users student = userRepository.findByEmail(email);
            if (student == null || student.getRole() == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            List<Grade> gradesList = gradeRepository.findByStudent(student);
            
            // Build grade records with subject info
            List<Map<String, Object>> records = gradesList.stream()
                    .sorted((a, b) -> {
                        // Sort by created date (most recent first)
                        if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                        if (a.getCreatedAt() == null) return 1;
                        if (b.getCreatedAt() == null) return -1;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    })
                    .map(grade -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("id", grade.getId());
                        record.put("grade", grade.getGrade());
                        record.put("remarks", grade.getRemarks());
                        record.put("createdAt", grade.getCreatedAt() != null ? grade.getCreatedAt().toString() : null);
                        record.put("teacherName", grade.getTeacher() != null ? grade.getTeacher().getName() : "Unknown");
                        
                        // Get subject name - prefer course from grade, otherwise get teacher's assigned subjects
                        String subjectName = "General";
                        if (grade.getCourse() != null && grade.getCourse().getTitle() != null) {
                            // If grade has a course, use that course's title
                            subjectName = grade.getCourse().getTitle();
                        } else if (grade.getTeacher() != null && grade.getTeacher().getId() != null) {
                            // Get teacher's assigned subjects from TeacherSubject model
                            List<TeacherSubject> teacherSubjects = teacherSubjectRepository.findByTeacherUserId(grade.getTeacher().getId());
                            if (!teacherSubjects.isEmpty()) {
                                // Show all subjects assigned to this teacher, comma-separated
                                subjectName = teacherSubjects.stream()
                                        .filter(ts -> ts.getSubject() != null && !ts.getSubject().trim().isEmpty())
                                        .map(TeacherSubject::getSubject)
                                        .collect(Collectors.joining(", "));
                                // If all subjects had null/empty values, fall back to "General"
                                if (subjectName.isEmpty()) {
                                    subjectName = "General";
                                }
                            }
                        }
                        record.put("subject", subjectName);
                        
                        return record;
                    })
                    .collect(Collectors.toList());

            // Calculate statistics
            int totalGrades = records.size();
            double averageGrade = 0.0;
            if (totalGrades > 0) {
                // Try to parse numeric grades and calculate average
                List<Double> numericGrades = records.stream()
                        .map(r -> {
                            String gradeStr = (String) r.get("grade");
                            if (gradeStr == null) return null;
                            try {
                                // Try to parse as number
                                return Double.parseDouble(gradeStr);
                            } catch (NumberFormatException e) {
                                // If not a number, try to convert letter grades (A+, A, B+, etc.) to numbers
                                return convertLetterGradeToNumber(gradeStr);
                            }
                        })
                        .filter(g -> g != null)
                        .collect(Collectors.toList());
                
                if (!numericGrades.isEmpty()) {
                    averageGrade = numericGrades.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                }
            }

            Map<String, Object> data = new HashMap<>();
            data.put("records", records);
            data.put("total", totalGrades);
            data.put("averageGrade", Math.round(averageGrade * 10.0) / 10.0); // Round to 1 decimal place

            return universalResponse("Student grades fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching student grades: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Helper method to convert letter grades to numbers
    private Double convertLetterGradeToNumber(String letterGrade) {
        if (letterGrade == null) return null;
        String grade = letterGrade.trim().toUpperCase();
        switch (grade) {
            case "A+": case "O": return 10.0;
            case "A": return 9.0;
            case "B+": return 8.0;
            case "B": return 7.0;
            case "C+": return 6.0;
            case "C": return 5.0;
            case "D+": return 4.0;
            case "D": return 3.0;
            case "E": return 2.0;
            case "F": return 1.0;
            default: return null;
        }
    }

    // Get student profile info (for student dashboard)
    public ResponseEntity<?> getStudentProfileInfo(String email) {
        try {
            Users student = userRepository.findByEmail(email);
            if (student == null || student.getRole() == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
            	return universalResponse("Students not found", null, HttpStatus.NOT_FOUND);
            }

            // Get Student record
            Student studentRecord = studentRepository.findByUser(student);

            Map<String, Object> data = new HashMap<>();
            // Use student ID as roll number
            data.put("rollNumber", "ST00" + student.getId());
            data.put("address", (studentRecord != null) ? studentRecord.getAddress() : null);
            data.put("batch", "2025");
            data.put("id", student.getId());
            data.put("name", student.getName());
            data.put("email", student.getEmail());

            return universalResponse("Student profile info fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching student profile info: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Assign/Unassign classes (courses) to teachers 
    public ResponseEntity<?> assignClassToTeacher(Long teacherId, Long courseId) {
        try {
            Users teacher = userRepository.findById(teacherId).orElse(null);
            if (teacher == null || teacher.getRole() == null || !teacher.getRole().equalsIgnoreCase("TEACHER")) {
            	return universalResponse("Teacher not found or invalid role", null, HttpStatus.NOT_FOUND);
            }

            Course course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
            	return universalResponse("Course not found", null, HttpStatus.NOT_FOUND);
            }

            course.setTeacher(teacher);
            Course saved = courseRepository.save(course);

            Map<String, Object> data = new HashMap<>();
            data.put("courseId", saved.getId());
            data.put("courseTitle", saved.getTitle());
            data.put("teacherId", teacher.getId());
            data.put("teacherName", teacher.getName());

            return universalResponse("Class assigned to teacher successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error assigning class: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> unassignClassFromTeacher(Long courseId) {
        try {
            Course course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
            	return universalResponse("Course not found", null, HttpStatus.NOT_FOUND);
            }

            course.setTeacher(null);
            Course saved = courseRepository.save(course);

            Map<String, Object> data = new HashMap<>();
            data.put("courseId", saved.getId());
            data.put("courseTitle", saved.getTitle());
            data.put("teacherId", null);

            return universalResponse("Class unassigned from teacher successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error unassigning class: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> getTeacherClasses(Long teacherId) {
        try {
            Users teacher = userRepository.findById(teacherId).orElse(null);
            if (teacher == null || teacher.getRole() == null || !teacher.getRole().equalsIgnoreCase("TEACHER")) {
            	return universalResponse("Teacher not found or invalid role", null, HttpStatus.NOT_FOUND);
            }

            List<Course> courses = courseRepository.findByTeacher(teacher);
            List<Map<String, Object>> result = courses.stream().map(c -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", c.getId());
                m.put("title", c.getTitle());
                m.put("category", c.getCategory());
                return m;
            }).collect(Collectors.toList());

            return universalResponse("Teacher classes fetched successfully", result, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching teacher classes: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Subjects (free text) assignment to teachers
    public ResponseEntity<?> assignSubjectToTeacher(Long teacherId, String subject) {
        try {
            if (subject == null || subject.trim().isEmpty()) {
            	return universalResponse("Subject is required", null, HttpStatus.BAD_REQUEST);
            }
            Users teacherUser = userRepository.findById(teacherId).orElse(null);
            if (teacherUser == null || teacherUser.getRole() == null || !teacherUser.getRole().equalsIgnoreCase("TEACHER")) {
            	return universalResponse("Teacher not found or invalid role", null, HttpStatus.NOT_FOUND);
            }

            // Get Teacher record from Users
            Teacher teacher = teacherRepository.findByUser(teacherUser);
            if (teacher == null) {
            	return universalResponse("Teacher record not found", null, HttpStatus.NOT_FOUND);
            }

            if (teacherSubjectRepository.existsByTeacherAndSubjectIgnoreCase(teacher, subject.trim())) {
            	return universalResponse("Subject already assigned to this teacher", null, HttpStatus.CONFLICT);
            }

            TeacherSubject ts = new TeacherSubject();
            ts.setTeacher(teacher);
            ts.setSubject(subject.trim());
            TeacherSubject saved = teacherSubjectRepository.save(ts);

            Map<String, Object> data = new HashMap<>();
            data.put("id", saved.getId());
            data.put("teacherId", teacherUser.getId());
            data.put("subject", saved.getSubject());

            return universalResponse("Subject assigned to teacher successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error assigning subject: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> getTeacherSubjects(Long teacherId) {
        try {
            Users teacherUser = userRepository.findById(teacherId).orElse(null);
            if (teacherUser == null || teacherUser.getRole() == null || !teacherUser.getRole().equalsIgnoreCase("TEACHER")) {
            	return universalResponse("Teacher not found or invalid role", null, HttpStatus.NOT_FOUND);
            }
            
            // Get Teacher record from Users
            Teacher teacher = teacherRepository.findByUser(teacherUser);
            if (teacher == null) {
            	return universalResponse("Teacher record not found", null, HttpStatus.BAD_REQUEST);
            }
            
            List<TeacherSubject> list = teacherSubjectRepository.findByTeacher(teacher);
            List<Map<String, Object>> result = list.stream().map(ts -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", ts.getId());
                m.put("subject", ts.getSubject());
                return m;
            }).collect(Collectors.toList());
            return universalResponse("Teacher subjects fetched successfully", result, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching teacher subjects: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> unassignSubject(Long assignmentId) {
        try {
            TeacherSubject ts = teacherSubjectRepository.findById(assignmentId).orElse(null);
            if (ts == null) {
            	return universalResponse("Subject assignment not found", null, HttpStatus.NOT_FOUND);
            }
            teacherSubjectRepository.delete(ts);
            return universalResponse("Subject unassigned successfully", null, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error unassigning subject: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get all payments with student and course details 
    public ResponseEntity<?> getAllPayments(String search, String category) {
        try {
            List<com.learnix.models.Payment> payments = paymentRepository.findAll();

            // Build payment records with student and course details
            List<Map<String, Object>> paymentRecords = payments.stream()
                    .filter(payment -> payment.getStatus() != null && "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                    .map(payment -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("id", payment.getId());
                        record.put("amount", payment.getAmount());
                        record.put("currency", payment.getCurrency());
                        record.put("status", payment.getStatus());
                        record.put("transactionId", payment.getRazorpayPaymentId());
                        record.put("orderId", payment.getRazorpayOrderId());
                        record.put("createdAt", payment.getCreatedAt());
                        record.put("paidAt", payment.getPaidAt());
                        
                        // Student details
                        Users student = payment.getStudent();
                        if (student != null) {
                            Map<String, Object> studentInfo = new HashMap<>();
                            studentInfo.put("id", student.getId());
                            studentInfo.put("name", student.getName());
                            studentInfo.put("email", student.getEmail());
                            studentInfo.put("rollNumber", "ST00" + student.getId());
                            record.put("student", studentInfo);
                        }
                        
                        // Course details
                        Course course = payment.getCourse();
                        if (course != null) {
                            Map<String, Object> courseInfo = new HashMap<>();
                            courseInfo.put("id", course.getId());
                            courseInfo.put("title", course.getTitle());
                            courseInfo.put("category", course.getCategory());
                            courseInfo.put("price", course.getPrice());
                            record.put("course", courseInfo);
                        }
                        
                        return record;
                    })
                    .collect(Collectors.toList());

            int total = paymentRecords.size();
            
            List<Map<String, Object>> filteredRecords = paymentRecords.stream()
            		.filter(record -> matchesPaymentCategory(record, category))
            		.filter(record -> matchesPaymentSearch(record, search))
            		.collect(Collectors.toList());
            
            Map<String, Object> statistics = buildPaymentStatistics(paymentRecords);
            List<String> categories = paymentRecords.stream()
            		.map(record -> {
            			Map<?, ?> course = safeMap(record.get("course"));
            			Object categoryValue = course != null ? course.get("category") : null;
            			return categoryValue instanceof String ? ((String) categoryValue) : null;
            		})
            		.filter(cat -> cat != null && !cat.isBlank())
            		.map(String::trim)
            		.distinct()
            		.sorted()
            		.collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("items", filteredRecords);
            data.put("total", total);
            data.put("matched", filteredRecords.size());
            data.put("statistics", statistics);
            data.put("categories", categories);

            return universalResponse("Payments fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching payments: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Online test reports for admin
    public ResponseEntity<?> getOnlineTestReports(String studentName, Long testId) {
        try {
            List<com.learnix.models.OnlineTestSubmission> submissions = onlineTestSubmissionRepository.findAll();

            List<Map<String, Object>> items = submissions.stream()
                    .filter(sub -> {
                        if (studentName != null && !studentName.trim().isEmpty()) {
                            String keyword = studentName.trim().toLowerCase();
                            return sub.getStudent() != null
                                    && sub.getStudent().getUser() != null
                                    && sub.getStudent().getUser().getName() != null
                                    && sub.getStudent().getUser().getName().toLowerCase().contains(keyword);
                        }
                        return true;
                    })
                    .filter(sub -> {
                        if (testId != null) {
                            return sub.getTest() != null && testId.equals(sub.getTest().getId());
                        }
                        return true;
                    })
                    .map(sub -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("submissionId", sub.getId());
                        row.put("score", sub.getScore());
                        row.put("totalCorrect", sub.getTotalCorrect());
                        row.put("submittedAt", sub.getSubmittedAt());

                        if (sub.getStudent() != null && sub.getStudent().getUser() != null) {
                            Users u = sub.getStudent().getUser();
                            Map<String, Object> studentInfo = new HashMap<>();
                            studentInfo.put("id", u.getId());
                            studentInfo.put("name", u.getName());
                            studentInfo.put("email", u.getEmail());
                            studentInfo.put("rollNumber", "ST00" + u.getId());
                            row.put("student", studentInfo);
                        }

                        if (sub.getTest() != null) {
                            Map<String, Object> testInfo = new HashMap<>();
                            testInfo.put("id", sub.getTest().getId());
                            testInfo.put("title", sub.getTest().getTitle());
                            testInfo.put("subject", sub.getTest().getSubject());
                            testInfo.put("maxMarks", sub.getTest().getMaxMarks());
                            testInfo.put("startTime", sub.getTest().getStartTime());
                            testInfo.put("endTime", sub.getTest().getEndTime());

                            if (sub.getTest().getTeacher() != null && sub.getTest().getTeacher().getUser() != null) {
                                Users t = sub.getTest().getTeacher().getUser();
                                Map<String, Object> teacherInfo = new HashMap<>();
                                teacherInfo.put("id", t.getId());
                                teacherInfo.put("name", t.getName());
                                teacherInfo.put("email", t.getEmail());
                                testInfo.put("teacher", teacherInfo);
                            }

                            row.put("test", testInfo);
                        }

                        return row;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("items", items);
            data.put("total", items.size());

            return universalResponse("Online test reports fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Error fetching online test reports: " + e.getMessage(), null,
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get students who bought a specific course
    public ResponseEntity<?> getCourseBuyers(Long courseId) {
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isEmpty()) {
            	return universalResponse("Course not found", null, HttpStatus.NOT_FOUND);
            }

            Course course = courseOpt.get();
            List<com.learnix.models.Payment> payments = paymentRepository.findByCourse(course);
            
            List<Map<String, Object>> buyers = payments.stream()
                    .filter(payment -> payment.getStatus() != null && "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                    .map(payment -> {
                        Map<String, Object> buyer = new HashMap<>();
                        Users student = payment.getStudent();
                        if (student != null) {
                            buyer.put("id", student.getId());
                            buyer.put("name", student.getName());
                            buyer.put("email", student.getEmail());
                            buyer.put("rollNumber", "ST00" + student.getId());
                            buyer.put("paidAt", payment.getPaidAt());
                            buyer.put("amount", payment.getAmount());
                            buyer.put("transactionId", payment.getRazorpayPaymentId());
                        }
                        return buyer;
                    })
                    .filter(buyer -> !buyer.isEmpty())
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("courseId", course.getId());
            data.put("courseTitle", course.getTitle());
            data.put("buyerCount", buyers.size());
            data.put("buyers", buyers);

            return universalResponse("Course buyers fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching course buyers: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private boolean matchesPaymentCategory(Map<String, Object> record, String category) {
    	if (!StringUtils.hasText(category)) {
    		return true;
    	}
    	Map<?, ?> course = safeMap(record.get("course"));
    	if (course == null) return false;
    	Object categoryValue = course.get("category");
    	String recordCategory = categoryValue instanceof String ? (String) categoryValue : null;
    	return recordCategory != null && recordCategory.equalsIgnoreCase(category.trim());
    }
    
    private boolean matchesPaymentSearch(Map<String, Object> record, String search) {
    	if (!StringUtils.hasText(search)) {
    		return true;
    	}
    	String keyword = search.trim().toLowerCase();
    	Map<?, ?> student = safeMap(record.get("student"));
    	Map<?, ?> course = safeMap(record.get("course"));
    	
    	return (student != null && (
    				matchString(student.get("name"), keyword) ||
    				matchString(student.get("email"), keyword) ||
    				matchString(student.get("rollNumber"), keyword)
    			)) ||
    			(course != null && matchString(course.get("title"), keyword)) ||
    			matchString(record.get("transactionId"), keyword) ||
    			matchString(record.get("orderId"), keyword);
    }
    
    private boolean matchString(Object value, String keyword) {
    	if (value == null) return false;
    	return value.toString().toLowerCase().contains(keyword);
    }
    
    private Map<?, ?> safeMap(Object value) {
    	return (value instanceof Map<?, ?> map) ? map : null;
    }
    
    private Map<String, Object> buildPaymentStatistics(List<Map<String, Object>> paymentRecords) {
    	long totalCourses = courseRepository.count();
        long soldCourses = paymentRecords.stream()
                .map(record -> safeMap(record.get("course")))
                .filter(course -> course != null)
                .map(course -> course.get("id"))
                .filter(id -> id instanceof Long)
                .map(id -> (Long) id)
                .distinct()
                .count();
        
        double totalAmount = paymentRecords.stream()
                .mapToDouble(record -> {
                    Object amount = record.get("amount");
                    return amount != null ? ((Number) amount).doubleValue() : 0.0;
                })
                .sum();
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalCourses", totalCourses);
        statistics.put("soldCourses", soldCourses);
        statistics.put("totalAmount", totalAmount);
        return statistics;
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}
