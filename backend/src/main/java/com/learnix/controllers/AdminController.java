package com.learnix.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learnix.models.Users;
import com.learnix.services.AdminService;
import com.learnix.services.StudentHelpService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private StudentHelpService studentHelpService;

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllStudents(
    		@RequestParam(required = false) String search,
    		@RequestParam(defaultValue = "name") String sortField,
    		@RequestParam(defaultValue = "asc") String sortDirection) {
        return adminService.getAllStudents(search, sortField, sortDirection);
    }

    @GetMapping("/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTeachers(
    		@RequestParam(required = false) String search,
    		@RequestParam(defaultValue = "name") String sortField,
    		@RequestParam(defaultValue = "asc") String sortDirection) {
        return adminService.getAllTeachers(search, sortField, sortDirection);
    }

    @PostMapping("/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTeacher(@RequestBody Map<String, Object> request) {
        Users teacher = new Users();
        teacher.setName((String) request.get("name"));
        teacher.setEmail((String) request.get("email"));
        teacher.setPassword((String) request.get("password"));
        teacher.setPhoneNumber((String) request.get("phoneNumber"));
        
        String qualification = (String) request.get("qualification");
        String address = (String) request.get("address");
        return adminService.createTeacher(teacher, qualification, address);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/reports/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAnalytics() {
        return adminService.getAnalytics();
    }

    @DeleteMapping("/students/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        return adminService.deleteStudent(id);
    }

    @DeleteMapping("/teachers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        return adminService.deleteTeacher(id);
    }

    @GetMapping("/recent-admissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRecentAdmissions(@RequestParam(defaultValue = "5") int limit) {
        return adminService.getRecentAdmissions(limit);
    }

    @PostMapping("/approve-admission/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveAdmission(@PathVariable Long id) {
        return adminService.approveAdmission(id);
    }

    @GetMapping("/top-performers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTopPerformers(@RequestParam(defaultValue = "5") int limit) {
        return adminService.getTopPerformers(limit);
    }

    @GetMapping("/pending-admissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingAdmissions(@RequestParam(required = false) String search) {
        return adminService.getPendingAdmissions(search);
    }

    // Upcoming Events 
    @PostMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEvent(@RequestParam String title,
                                         @RequestParam(required = false) String description,
                                         @RequestParam(required = false) String eventAtIso) {
        return adminService.createUpcomingEvent(title, description, eventAtIso);
    }

    @GetMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> listEvents(@RequestParam(defaultValue = "true") boolean onlyFuture) {
        return adminService.listAllEventsForAdmin(onlyFuture);
    }

    @DeleteMapping("/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        return adminService.deleteUpcomingEvent(id);
    }

    @PutMapping("/events/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @RequestParam(required = false) String title,
                                         @RequestParam(required = false) String description,
                                         @RequestParam(required = false) String eventAtIso) {
        return adminService.updateUpcomingEvent(id, title, description, eventAtIso);
    }

    // Assign/Unassign classes (courses) to teachers
    @PostMapping("/assign-class")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignClassToTeacher(@RequestParam Long teacherId, @RequestParam Long courseId) {
        return adminService.assignClassToTeacher(teacherId, courseId);
    }

    @DeleteMapping("/assign-class")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unassignClassFromTeacher(@RequestParam Long courseId) {
        return adminService.unassignClassFromTeacher(courseId);
    }

    @GetMapping("/teachers/{id}/classes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTeacherClasses(@PathVariable("id") Long teacherId) {
        return adminService.getTeacherClasses(teacherId);
    }

    // Subjects (free text) assignment
    @PostMapping("/assign-subject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignSubjectToTeacher(@RequestParam Long teacherId, @RequestParam String subject) {
        return adminService.assignSubjectToTeacher(teacherId, subject);
    }

    @GetMapping("/teachers/{id}/subjects")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTeacherSubjects(@PathVariable("id") Long teacherId) {
        return adminService.getTeacherSubjects(teacherId);
    }

    @DeleteMapping("/assign-subject/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unassignSubject(@PathVariable Long assignmentId) {
        return adminService.unassignSubject(assignmentId);
    }

    // Payments Management
    @GetMapping("/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllPayments(
    		@RequestParam(required = false) String search,
    		@RequestParam(required = false) String category) {
        return adminService.getAllPayments(search, category);
    }

    @GetMapping("/payments/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getCourseBuyers(@PathVariable Long courseId) {
        return adminService.getCourseBuyers(courseId);
    }

    // Student Help Requests
    @GetMapping("/student-help")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllStudentHelpRequests(
    		@RequestParam(required = false) String status,
    		@RequestParam(required = false) String search) {
        return studentHelpService.getAllHelpRequests(status, search);
    }

    @PutMapping("/student-help/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateHelpRequestStatus(@PathVariable Long id, @RequestParam String status) {
        return studentHelpService.updateHelpRequestStatus(id, status);
    }
    
    @PostMapping("/student-help/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addReplyToHelpRequest(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String reply = request.get("reply");
        return studentHelpService.addReplyToHelpRequest(id, reply);
    }
}
