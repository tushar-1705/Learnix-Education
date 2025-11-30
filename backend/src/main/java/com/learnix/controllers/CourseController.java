package com.learnix.controllers;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learnix.models.Course;
import com.learnix.services.CourseService;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

	@Autowired
	private CourseService courseService;
	
	 // ADMIN only
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCourse(@RequestBody Course course, Principal principal) {
    	return courseService.createCourse(course, principal.getName());
    }

    // PUBLIC (All roles)
    @GetMapping("/all")
    public ResponseEntity<?> getAllCourses(
    		@RequestParam(required = false) String search,
    		@RequestParam(required = false) String category,
    		@RequestParam(defaultValue = "createdAt") String sortField,
    		@RequestParam(defaultValue = "desc") String sortDirection) {
        return courseService.getAllCourses(search, category, sortField, sortDirection);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id);
    }

    @PostMapping("/{id}/contents")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> addCourseContent(@PathVariable Long id, @RequestBody com.learnix.models.CourseContent content) {
        return courseService.addCourseContent(id, content);
    }

    @GetMapping("/{id}/contents")
    public ResponseEntity<?> getCourseContents(@PathVariable Long id, @RequestParam(required = false) String email) {
        return courseService.getCourseContents(id, email);
    }

    // ADMIN can delete
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
    	return courseService.deleteCourse(id);
    }
	
}
