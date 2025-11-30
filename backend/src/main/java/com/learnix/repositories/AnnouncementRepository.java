package com.learnix.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Announcement;
import com.learnix.models.Users;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByTeacherOrderByCreatedAtDesc(Users teacher);
    List<Announcement> findAllByOrderByCreatedAtDesc();
}


