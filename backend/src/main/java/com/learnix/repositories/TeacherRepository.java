package com.learnix.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Teacher;
import com.learnix.models.Users;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Teacher findByUser(Users user);
}

