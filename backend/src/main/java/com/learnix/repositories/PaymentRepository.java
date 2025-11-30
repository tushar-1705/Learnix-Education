package com.learnix.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.Course;
import com.learnix.models.Payment;
import com.learnix.models.Users;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    List<Payment> findByStudent(Users student);
    List<Payment> findByCourse(Course course);
    List<Payment> findByStatus(String status);
    List<Payment> findByStatusAndCreatedAtBetween(String status, LocalDateTime start, LocalDateTime end);
    List<Payment> findByStudentAndCourse(Users student, Course course);
    List<Payment> findByStatusAndCreatedAtAfter(String status, LocalDateTime date);
}

