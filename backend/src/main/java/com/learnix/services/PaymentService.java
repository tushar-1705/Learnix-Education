package com.learnix.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.models.Course;
import com.learnix.models.Enrollment;
import com.learnix.models.Payment;
import com.learnix.models.Users;
import com.learnix.repositories.CourseRepository;
import com.learnix.repositories.EnrollmentRepository;
import com.learnix.repositories.PaymentRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private MyResponseWrapper responseWrapper;

    @Value("${razorpay.key.id:rzp_test_123}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:test_secret}")
    private String razorpayKeySecret;

    private RazorpayClient getRazorpayClient() throws RazorpayException {
        return new RazorpayClient(razorpayKeyId, razorpayKeySecret);
    }

    // Create Razorpay order
    public ResponseEntity<?> createOrder(Long courseId, String studentEmail) {
        try {
            Users student = userRepository.findByEmail(studentEmail);
            if (student == null || !"STUDENT".equalsIgnoreCase(student.getRole())) {
            	return universalResponse("Invalid student", null, HttpStatus.BAD_REQUEST);
            }

            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isEmpty()) {
            	return universalResponse("Course not found", null, HttpStatus.NOT_FOUND);
            }

            Course course = courseOpt.get();
            Double amount = course.getPrice();
            if (amount == null || amount <= 0) {
            	return universalResponse("Invalid course price", null, HttpStatus.BAD_REQUEST);
            }

            // Check if already enrolled and paid
            Enrollment existingEnrollment = enrollmentRepository.findByStudentAndCourse(student, course);
            if (existingEnrollment != null && Boolean.TRUE.equals(existingEnrollment.getIsPaid())) {
            	return universalResponse("Already enrolled and paid", null, HttpStatus.CONFLICT);
            }

            // Check if there's an existing pending payment for this course and student
            List<Payment> existingPendingPayments = paymentRepository.findByStudentAndCourse(student, course)
                .stream()
                .filter(p -> "PENDING".equals(p.getStatus()) || "FAILED".equals(p.getStatus()))
                .collect(java.util.stream.Collectors.toList());

            Payment payment;
            if (!existingPendingPayments.isEmpty()) {
                // Update the most recent pending payment instead of creating a new one
                payment = existingPendingPayments.stream()
                    .max((p1, p2) -> {
                        if (p1.getCreatedAt() == null && p2.getCreatedAt() == null) return 0;
                        if (p1.getCreatedAt() == null) return -1;
                        if (p2.getCreatedAt() == null) return 1;
                        return p1.getCreatedAt().compareTo(p2.getCreatedAt());
                    })
                    .orElse(existingPendingPayments.get(0));
                
                // Mark other pending payments as failed
                existingPendingPayments.stream()
                    .filter(p -> !p.getId().equals(payment.getId()))
                    .forEach(p -> {
                        p.setStatus("FAILED");
                        paymentRepository.save(p);
                    });
            } else {
                // Create new payment record
                payment = Payment.builder()
                    .student(student)
                    .course(course)
                    .amount(amount)
                    .currency("INR")
                    .status("PENDING")
                    .build();
                paymentRepository.save(payment);
            }

            // Create Razorpay order
            RazorpayClient razorpay = getRazorpayClient();
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int)(amount * 100)); // Convert to paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "receipt_" + courseId + "_" + student.getId());
            orderRequest.put("notes", Map.of(
                "courseId", courseId.toString(),
                "studentEmail", studentEmail,
                "courseName", course.getTitle()
            ));

            Order order = razorpay.orders.create(orderRequest);
            String orderId = order.get("id");

            // Update payment with new order ID
            payment.setRazorpayOrderId(orderId);
            payment.setStatus("PENDING");
            paymentRepository.save(payment);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderId);
            response.put("amount", amount);
            response.put("currency", "INR");
            response.put("keyId", razorpayKeyId);

            return universalResponse("Order created successfully", response, HttpStatus.CREATED);

        } catch (RazorpayException e) {
        	return universalResponse("Error creating order: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
        	return universalResponse("Error: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Verify payment and update enrollment
    public ResponseEntity<?> verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
            if (paymentOpt.isEmpty()) {
            	return universalResponse("Payment not found", null, HttpStatus.NOT_FOUND);
            }

            Payment payment = paymentOpt.get();
            if ("SUCCESS".equals(payment.getStatus())) {
            	return universalResponse("Payment already verified", payment, HttpStatus.OK);
            }
            
            // Update payment status
            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setRazorpaySignature(razorpaySignature);
            payment.setStatus("SUCCESS");
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Mark all other pending/failed payments for the same course and student as CANCELLED
            List<Payment> otherPayments = paymentRepository.findByStudentAndCourse(payment.getStudent(), payment.getCourse())
                .stream()
                .filter(p -> !p.getId().equals(payment.getId()) && 
                            ("PENDING".equals(p.getStatus()) || "FAILED".equals(p.getStatus())))
                .collect(java.util.stream.Collectors.toList());
            
            for (Payment otherPayment : otherPayments) {
                otherPayment.setStatus("CANCELLED");
                paymentRepository.save(otherPayment);
            }

            // Create or update enrollment
            Enrollment enrollment = enrollmentRepository.findByStudentAndCourse(payment.getStudent(), payment.getCourse());
            if (enrollment == null) {
                enrollment = Enrollment.builder()
                    .student(payment.getStudent())
                    .course(payment.getCourse())
                    .isPaid(true)
                    .build();
            } else {
                enrollment.setIsPaid(true);
            }
            enrollment = enrollmentRepository.save(enrollment);
            // Flush to ensure enrollment is immediately available
            enrollmentRepository.flush();

            return universalResponse("Payment verified and enrollment completed", payment, HttpStatus.OK);

        } catch (Exception e) {
        	return universalResponse("Error verifying payment: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Check if student has paid for course
    public boolean isPaymentCompleted(String studentEmail, Long courseId) {
        Users student = userRepository.findByEmail(studentEmail);
        if (student == null) return false;

        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) return false;

        Enrollment enrollment = enrollmentRepository.findByStudentAndCourse(student, courseOpt.get());
        return enrollment != null && Boolean.TRUE.equals(enrollment.getIsPaid());
    }

    // Get revenue statistics
    public Map<String, Object> getRevenueStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Payment> allPayments = paymentRepository.findByStatus("SUCCESS");
        double totalRevenue = allPayments.stream()
            .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
            .sum();

        // Monthly revenue
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Payment> monthlyPayments = paymentRepository.findByStatusAndCreatedAtAfter("SUCCESS", startOfMonth);
        double monthlyRevenue = monthlyPayments.stream()
            .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
            .sum();

        // Yearly revenue
        LocalDateTime startOfYear = LocalDateTime.now().withMonth(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Payment> yearlyPayments = paymentRepository.findByStatusAndCreatedAtAfter("SUCCESS", startOfYear);
        double yearlyRevenue = yearlyPayments.stream()
            .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
            .sum();

        stats.put("totalRevenue", totalRevenue);
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("yearlyRevenue", yearlyRevenue);
        stats.put("totalTransactions", allPayments.size());

        return stats;
    }

    // Get all payments for a student
    public ResponseEntity<?> getStudentPayments(String studentEmail) {
        try {
            Users student = userRepository.findByEmail(studentEmail);
            if (student == null || !"STUDENT".equalsIgnoreCase(student.getRole())) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            List<Payment> payments = paymentRepository.findByStudent(student);
            
            // Group payments by course and filter duplicates
            Map<Long, List<Payment>> paymentsByCourse = payments.stream()
                .filter(p -> p.getCourse() != null && p.getCourse().getId() != null)
                .collect(java.util.stream.Collectors.groupingBy(p -> p.getCourse().getId()));
            
            List<Payment> filteredPayments = new java.util.ArrayList<>();
            
            for (List<Payment> coursePayments : paymentsByCourse.values()) {
                // Check if there's any successful payment
                boolean hasSuccess = coursePayments.stream()
                    .anyMatch(p -> "SUCCESS".equals(p.getStatus()));
                
                if (hasSuccess) {
                    // Show only successful payments for this course
                    filteredPayments.addAll(coursePayments.stream()
                        .filter(p -> "SUCCESS".equals(p.getStatus()))
                        .collect(java.util.stream.Collectors.toList()));
                } else {
                    // No success, show the most recent pending or failed payment
                    Optional<Payment> mostRecentPending = coursePayments.stream()
                        .filter(p -> "PENDING".equals(p.getStatus()))
                        .max((p1, p2) -> {
                            if (p1.getCreatedAt() == null && p2.getCreatedAt() == null) return 0;
                            if (p1.getCreatedAt() == null) return -1;
                            if (p2.getCreatedAt() == null) return 1;
                            return p1.getCreatedAt().compareTo(p2.getCreatedAt());
                        });
                    
                    if (mostRecentPending.isPresent()) {
                        filteredPayments.add(mostRecentPending.get());
                    } else {
                        // No pending, get most recent failed
                        Optional<Payment> mostRecentFailed = coursePayments.stream()
                            .filter(p -> "FAILED".equals(p.getStatus()))
                            .max((p1, p2) -> {
                                if (p1.getCreatedAt() == null && p2.getCreatedAt() == null) return 0;
                                if (p1.getCreatedAt() == null) return -1;
                                if (p2.getCreatedAt() == null) return 1;
                                return p1.getCreatedAt().compareTo(p2.getCreatedAt());
                            });
                        
                        if (mostRecentFailed.isPresent()) {
                            filteredPayments.add(mostRecentFailed.get());
                        }
                    }
                }
            }
            
            // Build payment records with course details
            List<Map<String, Object>> paymentRecords = filteredPayments.stream()
                    .map(payment -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("id", payment.getId());
                        record.put("amount", payment.getAmount());
                        record.put("currency", payment.getCurrency());
                        record.put("status", payment.getStatus() != null ? payment.getStatus().toLowerCase() : "pending");
                        record.put("transactionId", payment.getRazorpayPaymentId());
                        record.put("orderId", payment.getRazorpayOrderId());
                        record.put("createdAt", payment.getCreatedAt());
                        record.put("paidAt", payment.getPaidAt());
                        
                        // Course details
                        Course course = payment.getCourse();
                        if (course != null) {
                            Map<String, Object> courseInfo = new HashMap<>();
                            courseInfo.put("id", course.getId());
                            courseInfo.put("title", course.getTitle());
                            courseInfo.put("category", course.getCategory());
                            courseInfo.put("price", course.getPrice());
                            record.put("course", courseInfo);
                        }
                        
                        return record;
                    })
                    .sorted((a, b) -> {
                        // Sort by created date, most recent first
                        LocalDateTime dateA = (LocalDateTime) a.get("createdAt");
                        LocalDateTime dateB = (LocalDateTime) b.get("createdAt");
                        if (dateA == null && dateB == null) return 0;
                        if (dateA == null) return 1;
                        if (dateB == null) return -1;
                        return dateB.compareTo(dateA);
                    })
                    .collect(java.util.stream.Collectors.toList());

            // Calculate statistics
            double totalAmount = paymentRecords.stream()
                    .mapToDouble(record -> {
                        Object amount = record.get("amount");
                        return amount != null ? ((Number) amount).doubleValue() : 0.0;
                    })
                    .sum();

            double paidAmount = paymentRecords.stream()
                    .filter(record -> "success".equalsIgnoreCase((String) record.get("status")))
                    .mapToDouble(record -> {
                        Object amount = record.get("amount");
                        return amount != null ? ((Number) amount).doubleValue() : 0.0;
                    })
                    .sum();

            double pendingAmount = paymentRecords.stream()
                    .filter(record -> {
                        String status = (String) record.get("status");
                        return "pending".equalsIgnoreCase(status) || "failed".equalsIgnoreCase(status);
                    })
                    .mapToDouble(record -> {
                        Object amount = record.get("amount");
                        return amount != null ? ((Number) amount).doubleValue() : 0.0;
                    })
                    .sum();

            Map<String, Object> data = new HashMap<>();
            data.put("payments", paymentRecords);
            data.put("statistics", Map.of(
                "totalAmount", totalAmount,
                "paidAmount", paidAmount,
                "pendingAmount", pendingAmount,
                "totalPayments", paymentRecords.size()
            ));

            return universalResponse("Student payments fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching student payments: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get pending payments count for student dashboard
    public ResponseEntity<?> getPendingPaymentsCount(String studentEmail) {
        try {
            Users student = userRepository.findByEmail(studentEmail);
            if (student == null || !"STUDENT".equalsIgnoreCase(student.getRole())) {
            	return universalResponse("Student not found", null, HttpStatus.NOT_FOUND);
            }

            List<Payment> payments = paymentRepository.findByStudent(student);
            long pendingCount = payments.stream()
                    .filter(payment -> {
                        String status = payment.getStatus();
                        // Count only PENDING and FAILED, exclude CANCELLED and SUCCESS
                        if (status == null) return false;
                        String upperStatus = status.toUpperCase();
                        return ("PENDING".equals(upperStatus) || "FAILED".equals(upperStatus)) &&
                               !"CANCELLED".equals(upperStatus) &&
                               !"SUCCESS".equals(upperStatus);
                    })
                    .count();

            Map<String, Object> data = new HashMap<>();
            data.put("pendingPayments", pendingCount);

            return universalResponse("Pending payments count fetched successfully", data, HttpStatus.OK);
        } catch (Exception e) {
        	return universalResponse("Error fetching pending payments count: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus){
		responseWrapper.setMessage(message);
		responseWrapper.setData(data);
		return new ResponseEntity<>(responseWrapper, httpStatus);
	}
}

