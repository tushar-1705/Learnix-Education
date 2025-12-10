package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Course;
import com.learnix.models.Grade;
import com.learnix.models.Users;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudent(Users student);
    List<Grade> findByTeacher(Users teacher);
    boolean existsByStudentAndCourse(Users student, Course course);
    List<Grade> findByCourse(Course course);
}


