package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.StudentHelp;
import com.learnix.models.Users;

@Repository
public interface StudentHelpRepository extends JpaRepository<StudentHelp, Long> {
    List<StudentHelp> findByStudent(Users student);
    List<StudentHelp> findAllByOrderByCreatedAtDesc();
    List<StudentHelp> findByStatusOrderByCreatedAtDesc(String status);
}

