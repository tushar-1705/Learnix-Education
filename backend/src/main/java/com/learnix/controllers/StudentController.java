package com.learnix.controllers;

import java.security.Principal;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learnix.dto.OnlineTestSubmissionRequest;
import com.learnix.services.AdminService;
import com.learnix.services.AnnouncementService;
import com.learnix.services.OnlineTestService;
import com.learnix.services.PaymentService;
import com.learnix.services.StudentHelpService;
import com.learnix.services.StudentService;
import com.learnix.services.CourseProgressService;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private StudentService studentService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private StudentHelpService studentHelpService;
    
    @Autowired
    private OnlineTestService onlineTestService;

    @Autowired
    private CourseProgressService courseProgressService;

    @GetMapping("/announcements")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getAnnouncementsForStudent() {
        return announcementService.listAnnouncementsForStudent();
    }

    @GetMapping("/events")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> listUpcomingEventsForStudent(@RequestParam(defaultValue = "true") boolean onlyFuture) {
        return adminService.listUpcomingEvents(onlyFuture);
    }

    @GetMapping("/attendance")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentAttendance(@RequestParam String email) {
        return adminService.getStudentAttendance(email);
    }

    @GetMapping("/attendance/summary")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentAttendanceSummary(@RequestParam String email) {
        return adminService.getStudentAttendanceSummary(email);
    }

    @GetMapping("/grades")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentGrades(@RequestParam String email) {
        return adminService.getStudentGrades(email);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentProfile(@RequestParam String email) {
        return adminService.getStudentProfileInfo(email);
    }

    @PutMapping("/profile/{userId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> updateStudentProfile(
            @PathVariable Long userId,
            @RequestBody java.util.Map<String, String> request) {
        String address = request.get("address");
        String phone = request.get("contact");
        return studentService.updateStudentProfile(userId, address, phone);
    }

    @GetMapping("/payments")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentPayments(@RequestParam String email) {
        return paymentService.getStudentPayments(email);
    }

    @GetMapping("/payments/pending-count")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getPendingPaymentsCount(@RequestParam String email) {
        return paymentService.getPendingPaymentsCount(email);
    }

    // Student Help Requests
    @PostMapping("/help")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitHelpRequest(@RequestParam String email, @RequestBody Map<String, String> request) {
        String issue = request.get("issue");
        return studentHelpService.submitHelpRequest(email, issue);
    }

    @GetMapping("/help")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentHelpRequests(@RequestParam String email) {
        return studentHelpService.getStudentHelpRequests(email);
    }

    // Online MCQ Tests
    @GetMapping("/tests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> listOnlineTests(Principal principal) {
        return onlineTestService.listAvailableTestsForStudent(principal);
    }

    @GetMapping("/tests/{testId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getTest(@PathVariable Long testId, Principal principal) {
        return onlineTestService.getTestForStudent(testId, principal);
    }

    @PostMapping("/tests/{testId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitTest(@PathVariable Long testId,
                                        @RequestBody OnlineTestSubmissionRequest request,
                                        Principal principal) {
        return onlineTestService.submitTest(testId, principal, request);
    }

    @GetMapping("/tests/results")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyTestResults(Principal principal) {
        return onlineTestService.getStudentResults(principal);
    }

    // Course Progress
    @PostMapping("/courses/{courseId}/content/{contentId}/mark-watched")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> markContentAsWatched(
            @PathVariable Long courseId,
            @PathVariable Long contentId,
            @RequestParam String email) {
        return courseProgressService.markContentAsWatched(email, courseId, contentId);
    }
}


