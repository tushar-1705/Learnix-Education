package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.learnix.models.Teacher;
import com.learnix.models.TeacherSubject;

@Repository
public interface TeacherSubjectRepository extends JpaRepository<TeacherSubject, Long> {
    List<TeacherSubject> findByTeacher(Teacher teacher);
    boolean existsByTeacherAndSubjectIgnoreCase(Teacher teacher, String subject);
    
    // Query by user ID (teacher's user ID) - joins through Teacher to get TeacherSubject
    @Query("SELECT ts FROM TeacherSubject ts WHERE ts.teacher.user.id = :userId")
    List<TeacherSubject> findByTeacherUserId(@Param("userId") Long userId);
}


