package com.learnix.controllers;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learnix.dto.AttendanceDTO.AttendanceRequest;
import com.learnix.dto.OnlineTestRequest;
import com.learnix.services.AnnouncementService;
import com.learnix.services.GradeService;
import com.learnix.services.OnlineTestService;
import com.learnix.services.TeacherService;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private AnnouncementService announcementService;

    @Autowired
    private GradeService gradeService;
    
    @Autowired
    private OnlineTestService onlineTestService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getTeacherDashboard(Principal principal) {
        return teacherService.getTeacherDashboard(principal);
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getMyStudents(
    		Principal principal,
    		@RequestParam(required = false) String search,
    		@RequestParam(defaultValue = "name") String sortField,
    		@RequestParam(defaultValue = "asc") String sortDirection) {
        return teacherService.getMyStudents(principal, search, sortField, sortDirection);
    }

    @PostMapping("/attendance/mark")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> markAttendance(@RequestBody AttendanceRequest request, Principal principal) {
        return teacherService.markAttendance(request, principal);
    }

    @GetMapping("/course-content")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<?> getCourseContent(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        return teacherService.getCourseContent(search, category);
    }

    // Announcements
    @GetMapping("/announcements")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getAnnouncements(Principal principal) {
        return announcementService.listMyAnnouncements(principal);
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createAnnouncement(
            Principal principal,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam(required = false) Long courseId
    ) {
        return announcementService.createAnnouncement(principal, title, message, courseId);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/announcements/delete")
    public ResponseEntity<?> deleteAnnouncement(
            Principal principal,
            @RequestParam Long id
    ) {
        return announcementService.deleteAnnouncement(principal, id);
    }

    // Grading & Dashboard Extras
    @PostMapping("/grading/assign")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> assignGrade(
            Principal principal,
            @RequestParam Long studentId,
            @RequestParam String grade,
            @RequestParam(required = false) String remarks,
            @RequestParam(required = false) Long courseId
    ) {
        return gradeService.assignGrade(principal, studentId, grade, remarks, courseId);
    }

    @GetMapping("/recent-students")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> recentStudents(@RequestParam(defaultValue = "5") int limit) {
        return gradeService.recentStudents(limit);
    }

    @GetMapping("/students/{id}/profile")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getStudentProfile(@PathVariable("id") Long studentId) {
        return teacherService.getStudentProfile(studentId);
    }

    @GetMapping("/my-subjects")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getMySubjects(Principal principal) {
        return teacherService.getMySubjects(principal);
    }

    @GetMapping("/events")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getUpcomingEvents() {
        return teacherService.getUpcomingEvents();
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getTeacherProfile(Principal principal) {
        return teacherService.getTeacherProfile(principal);
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> updateTeacherProfile(
            Principal principal,
            @RequestParam(required = false) String qualification,
            @RequestParam(required = false) String address
    ) {
        return teacherService.updateTeacherProfile(principal, qualification, address);
    }

    // Online Tests
    @GetMapping("/tests")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> listMyTests(Principal principal) {
        return onlineTestService.listTeacherTests(principal);
    }

    @PostMapping("/tests")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createTest(@RequestBody OnlineTestRequest request, Principal principal) {
        return onlineTestService.createTest(principal, request);
    }

    @GetMapping("/tests/{testId}/submissions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getTestSubmissions(@PathVariable Long testId, Principal principal) {
        return onlineTestService.getTestSubmissions(testId, principal);
    }
}
