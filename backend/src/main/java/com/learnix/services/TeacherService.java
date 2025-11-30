package com.learnix.services;

import java.security.Principal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.dto.AttendanceDTO.AttendanceEntry;
import com.learnix.dto.AttendanceDTO.AttendanceRequest;
import com.learnix.models.Attendance;
import com.learnix.models.Course;
import com.learnix.models.Enrollment;
import com.learnix.models.Student;
import com.learnix.models.Teacher;
import com.learnix.models.TeacherSubject;
import com.learnix.models.Users;
import com.learnix.repositories.AnnouncementRepository;
import com.learnix.repositories.AttendanceRepository;
import com.learnix.repositories.CourseRepository;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.GradeRepository;
import com.learnix.repositories.StudentRepository;
import com.learnix.repositories.TeacherRepository;
import com.learnix.repositories.TeacherSubjectRepository;
import com.learnix.repositories.UpcomingEventRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;
import com.learnix.specification.CourseSpecification;
import com.learnix.specification.SpecificationUtils;
import com.learnix.specification.UserSpecification;

@Service
public class TeacherService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    @Autowired
    private EmailService emailService;

    @Autowired
    private TeacherSubjectRepository teacherSubjectRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UpcomingEventRepository upcomingEventRepository;

    // Dashboard Logic
    public ResponseEntity<?> getTeacherDashboard(Principal principal) {
        try {
            String email = principal.getName();
            Users teacher = userRepository.findByEmail(email);
            if (teacher == null) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            // Active courses: all courses created by ADMIN
            int activeCourses = (int) courseRepository.findAll().stream()
                .filter(c -> c.getTeacher() != null &&
                        c.getTeacher().getRole() != null &&
                        c.getTeacher().getRole().equalsIgnoreCase("ADMIN"))
                .count();

            // Total students: all users with STUDENT role
            int totalStudents = (int) userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase("STUDENT"))
                .count();

            // Pending grading = enrollments without a grade for that course
            var teacherCourses = courseRepository.findByTeacher(teacher);
            int pendingGrading = 0;
            for (Course c : teacherCourses) {
                var enrolls = enrollmentRepository.findByCourse(c);
                for (Enrollment en : enrolls) {
                    Users s = en.getStudent();
                    if (s != null && !gradeRepository.existsByStudentAndCourse(s, c)) {
                        pendingGrading++;
                    }
                }
            }

            // Announcements count for this teacher
            int announcementsCount = announcementRepository.findByTeacherOrderByCreatedAtDesc(teacher).size();

            // Average attendance percentage for this teacher
            var attendanceList = attendanceRepository.findByTeacher(teacher);
            int present = (int) attendanceList.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
            int totalAttendance = attendanceList.size();
            int avgAttendance = totalAttendance == 0 ? 0 : (int) Math.round((present * 100.0) / totalAttendance);

            Map<String, Object> data = new HashMap<>();
            data.put("totalStudents", totalStudents);
            data.put("activeCourses", activeCourses);
            data.put("pendingGrading", pendingGrading);
            data.put("announcements", announcementsCount);
            data.put("avgAttendance", avgAttendance);
            data.put("upcomingClasses", 0);

            return universalResponse("Teacher dashboard fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching teacher dashboard: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Student Profile for Teacher
    public ResponseEntity<?> getStudentProfile(Long studentId) {
        try {
            Users student = userRepository.findById(studentId).orElse(null);
            if (student == null || student.getRole() == null || !student.getRole().equalsIgnoreCase("STUDENT")) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            // Get Student record
            Student studentRecord = studentRepository.findByUser(student);

            // Basic info
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", student.getId());
            profile.put("name", student.getName());
            profile.put("email", student.getEmail());
            profile.put("phoneNumber", student.getPhoneNumber());
            profile.put("profilePhoto", student.getProfilePhoto());
            profile.put("createdAt", student.getCreatedAt());
            
            // Use student ID as roll number and add address from Student table
            profile.put("rollNo", "ST00" + student.getId());
            if (studentRecord != null) {
                profile.put("address", studentRecord.getAddress());
            } else {
                profile.put("address", null);
            }

            // Enrollments
            List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
            List<Map<String, Object>> courses = enrollments.stream().map(en -> {
                Map<String, Object> c = new HashMap<>();
                Course course = en.getCourse();
                if (course != null) {
                    c.put("id", course.getId());
                    c.put("title", course.getTitle());
                    c.put("category", course.getCategory());
                }
                return c;
            }).collect(Collectors.toList());
            profile.put("courses", courses);

            // Attendance summary
            var attendanceList = attendanceRepository.findByStudent(student);
            long present = attendanceList.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
            double percent = attendanceList.isEmpty() ? 0.0 : (present * 100.0) / attendanceList.size();
            Map<String, Object> attendance = new HashMap<>();
            attendance.put("total", attendanceList.size());
            attendance.put("present", present);
            attendance.put("percentage", (int) Math.round(percent));
            profile.put("attendance", attendance);

            // Grades
            var grades = gradeRepository.findByStudent(student).stream().map(g -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", g.getId());
                m.put("grade", g.getGrade());
                m.put("remarks", g.getRemarks());
                Course course = g.getCourse();
                if (course != null) {
                    m.put("courseId", course.getId());
                    m.put("courseTitle", course.getTitle());
                }
                return m;
            }).collect(Collectors.toList());
            profile.put("grades", grades);

            return universalResponse("Student profile fetched successfully", profile, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching student profile: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Fetch Students Logic
    public ResponseEntity<?> getMyStudents(Principal principal, String search, String sortField, String sortDirection) {
        try {
            Users teacher = userRepository.findByEmail(principal.getName());
            if (teacher == null) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            Specification<Users> spec = SpecificationUtils.and(
                    UserSpecification.hasRole("STUDENT"),
                    UserSpecification.keywordLike(search));
            
            long total = userRepository.count(UserSpecification.hasRole("STUDENT"));
            List<Users> filtered = userRepository.findAll(
                    SpecificationUtils.and(spec, UserSpecification.sortBy(sortField, sortDirection)));
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("items", filtered);
            payload.put("total", total);
            payload.put("matched", filtered.size());

            return universalResponse("Students fetched successfully", payload, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching students: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Attendance Logic
    public ResponseEntity<?> markAttendance(AttendanceRequest request, Principal principal) {
        try {
            Users teacher = userRepository.findByEmail(principal.getName());
            if (teacher == null) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            LocalDate date = (request.getDate() != null && !request.getDate().isEmpty())
                    ? LocalDate.parse(request.getDate())
                    : LocalDate.now();

            for (AttendanceEntry entry : request.getEntries()) {
                Users student = userRepository.findById(entry.getStudentId()).orElse(null);
                if (student == null) continue;

                String status = "PRESENT".equalsIgnoreCase(entry.getStatus()) ? "PRESENT" : "ABSENT";
                
                Attendance attendance = Attendance.builder()
                        .student(student)
                        .course(null)  // TODO: Link course when available
                        .teacher(teacher)
                        .date(date)
                        .status(status)
                        .build();

                attendanceRepository.save(attendance);

                // Send email notification if student is marked absent
                if ("ABSENT".equalsIgnoreCase(status)) {
                    emailService.sendAbsentNotificationEmail(student, date.toString(), teacher.getName());
                }
            }

            return universalResponse("Attendance marked successfully", null, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error marking attendance: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Course Content Logic - Get all courses with enrollments
    public ResponseEntity<?> getCourseContent(String searchKeyword, String categoryFilter) {
        try {
            Specification<Course> spec = SpecificationUtils.and(
            		CourseSpecification.keywordLike(searchKeyword),
            		CourseSpecification.hasCategory(categoryFilter));
            List<Course> courses = courseRepository
            		.findAll(SpecificationUtils.and(spec, CourseSpecification.sortBy("title", "asc")));

            // Build response with enrollment information
            List<Map<String, Object>> courseContentList = new ArrayList<>();
            
            for (Course course : courses) {
                List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);
                List<Map<String, Object>> enrolledStudents = enrollments.stream()
                    .map(enrollment -> {
                        Map<String, Object> studentInfo = new HashMap<>();
                        Users student = enrollment.getStudent();
                        studentInfo.put("id", student.getId());
                        studentInfo.put("name", student.getName());
                        studentInfo.put("email", student.getEmail());
                        studentInfo.put("enrolledAt", enrollment.getEnrolledAt());
                        return studentInfo;
                    })
                    .collect(Collectors.toList());

                Map<String, Object> courseContent = new HashMap<>();
                courseContent.put("id", course.getId());
                courseContent.put("title", course.getTitle());
                courseContent.put("description", course.getDescription());
                courseContent.put("category", course.getCategory());
                courseContent.put("price", course.getPrice());
                courseContent.put("teacher", course.getTeacher() != null ? course.getTeacher().getName() : null);
                courseContent.put("createdAt", course.getCreatedAt());
                courseContent.put("enrolledStudents", enrolledStudents);
                courseContent.put("enrollmentCount", enrolledStudents.size());
                
                courseContentList.add(courseContent);
            }

            return universalResponse("Course content fetched successfully", courseContentList, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching course content: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get teacher's assigned subjects
    public ResponseEntity<?> getMySubjects(Principal principal) {
        try {
            String email = principal.getName();
            Users teacherUser = userRepository.findByEmail(email);
            if (teacherUser == null) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            // Get Teacher record from Users
            Teacher teacher = teacherRepository.findByUser(teacherUser);
            if (teacher == null) {
            	return universalResponse("Teacher record not found", null, HttpStatus.NOT_FOUND);
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

    // Teacher Profile
    public ResponseEntity<?> getTeacherProfile(Principal principal) {
        try {
            String email = principal.getName();
            Users teacherUser = userRepository.findByEmail(email);
            if (teacherUser == null || !"TEACHER".equalsIgnoreCase(teacherUser.getRole())) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            Teacher teacher = teacherRepository.findByUser(teacherUser);
            Map<String, Object> profile = new HashMap<>();
            profile.put("qualification", teacher != null ? teacher.getQualification() : null);
            profile.put("address", teacher != null ? teacher.getAddress() : null);

            return universalResponse("Teacher profile fetched successfully", profile, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching teacher profile: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> updateTeacherProfile(Principal principal, String qualification, String address) {
        try {
            String email = principal.getName();
            Users teacherUser = userRepository.findByEmail(email);
            if (teacherUser == null || !"TEACHER".equalsIgnoreCase(teacherUser.getRole())) {
            	return universalResponse("Teacher not found", null, HttpStatus.NOT_FOUND);
            }

            Teacher teacher = teacherRepository.findByUser(teacherUser);
            if (teacher == null) {
                teacher = new Teacher();
                teacher.setUser(teacherUser);
            }

            if (qualification != null) {
                teacher.setQualification(qualification.trim());
            }
            if (address != null) {
                teacher.setAddress(address.trim());
            }

            Teacher savedTeacher = teacherRepository.save(teacher);

            return universalResponse("Teacher profile updated successfully", savedTeacher, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error updating teacher profile: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Upcoming events for teachers
    public ResponseEntity<?> getUpcomingEvents() {
        try {
            var events = upcomingEventRepository.findByEnabledTrueAndEventAtAfterOrderByEventAtAsc(java.time.LocalDateTime.now());
            return universalResponse("Event fetched", events, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching events: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}
