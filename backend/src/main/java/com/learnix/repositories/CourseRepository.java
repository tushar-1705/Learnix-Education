package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.learnix.models.Course;
import com.learnix.models.Users;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long>, JpaSpecificationExecutor<Course> {
	List<Course> findByCategoryContainingIgnoreCase(String category);
    List<Course> findByTitleContainingIgnoreCase(String keyword);
    List<Course> findByTeacher(Users teacher);
}
