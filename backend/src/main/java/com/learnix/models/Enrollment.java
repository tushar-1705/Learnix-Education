package com.learnix.models;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private Users student;

    @ManyToOne
    private Course course;

    private LocalDateTime enrolledAt;
    @Builder.Default
    private Boolean isPaid = false; // Track if payment is completed
    
    @PrePersist
    protected void onEnroll() {
        this.enrolledAt = LocalDateTime.now();
    }
}
