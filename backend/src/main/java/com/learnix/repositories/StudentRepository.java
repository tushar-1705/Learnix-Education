package com.learnix.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Student;
import com.learnix.models.Users;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findByUser(Users user);
}
