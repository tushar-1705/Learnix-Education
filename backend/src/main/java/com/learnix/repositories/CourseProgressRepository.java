package com.learnix.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Course;
import com.learnix.models.CourseContent;
import com.learnix.models.CourseProgress;
import com.learnix.models.Users;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    Optional<CourseProgress> findByStudentAndContent(Users student, CourseContent content);
    List<CourseProgress> findByStudentAndCourse(Users student, Course course);
    List<CourseProgress> findByStudentAndCourseAndIsCompleted(Users student, Course course, Boolean isCompleted);
    long countByStudentAndCourseAndIsCompleted(Users student, Course course, Boolean isCompleted);
    List<CourseProgress> findByCourse(Course course);
}

