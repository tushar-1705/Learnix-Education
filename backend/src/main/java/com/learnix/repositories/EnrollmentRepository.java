package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Course;
import com.learnix.models.Enrollment;
import com.learnix.models.Users;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
	boolean existsByStudentAndCourse(Users student, Course course);
    List<Enrollment> findByStudent(Users student);
    List<Enrollment> findByCourse(Course course);
    Enrollment findByStudentAndCourse(Users student, Course course);
}
	