package com.learnix.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.learnix.services.PaymentService;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // Create payment order
    @PostMapping("/create-order")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createOrder(@RequestParam Long courseId, @RequestParam String email) {
        return paymentService.createOrder(courseId, email);
    }

    // Verify payment
    @PostMapping("/verify")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> verifyPayment(
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId,
            @RequestParam String razorpaySignature) {
        return paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    }

    // Check payment status
    @GetMapping("/check")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> checkPaymentStatus(@RequestParam Long courseId, @RequestParam String email) {
        boolean isPaid = paymentService.isPaymentCompleted(email, courseId);
        return ResponseEntity.ok(Map.of("isPaid", isPaid));
    }
}

