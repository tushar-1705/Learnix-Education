package com.learnix.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.OnlineTest;
import com.learnix.models.OnlineTestSubmission;
import com.learnix.models.Student;

@Repository
public interface OnlineTestSubmissionRepository extends JpaRepository<OnlineTestSubmission, Long> {
    long countByTest(OnlineTest test);
    Optional<OnlineTestSubmission> findByTestAndStudent(OnlineTest test, Student student);
    List<OnlineTestSubmission> findByTest(OnlineTest test);
    List<OnlineTestSubmission> findByStudent(Student student);
}

