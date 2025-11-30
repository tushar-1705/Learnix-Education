package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Course;
import com.learnix.models.CourseContent;

@Repository
public interface CourseContentRepository extends JpaRepository<CourseContent, Long> {
    List<CourseContent> findByCourseOrderByOrderIndexAsc(Course course);
}


