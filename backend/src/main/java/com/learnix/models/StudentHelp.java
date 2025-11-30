package com.learnix.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentHelp {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Users student;

    @Column(length = 2000)
    private String issue;

    @Default
    private String status = "PENDING"; // PENDING, RESOLVED

    @Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime resolvedAt;

    @Column(length = 2000)
    private String reply; // Admin's reply to the issue

    private LocalDateTime repliedAt; // When admin replied
}

