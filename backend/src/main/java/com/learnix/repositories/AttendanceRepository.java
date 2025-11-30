package com.learnix.repositories;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Attendance;
import com.learnix.models.Course;
import com.learnix.models.Users;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudent(Users student);
    List<Attendance> findByStudentAndCourse(Users student, Course course);
    List<Attendance> findByCourseAndDate(Course course, LocalDate date);
    List<Attendance> findByTeacher(Users teacher);
}


