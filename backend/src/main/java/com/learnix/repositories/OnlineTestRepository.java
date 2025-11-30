package com.learnix.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.OnlineTest;

@Repository
public interface OnlineTestRepository extends JpaRepository<OnlineTest, Long> {
    List<OnlineTest> findByTeacherUserId(Long userId);
    Optional<OnlineTest> findByIdAndTeacherUserId(Long id, Long userId);
    List<OnlineTest> findByPublishedTrueOrderByCreatedAtDesc();
}

