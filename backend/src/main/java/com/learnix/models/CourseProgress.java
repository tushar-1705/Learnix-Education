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
public class CourseProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private Users student;

    @ManyToOne
    private Course course;

    @ManyToOne
    private CourseContent content;

    @Builder.Default
    private Boolean isCompleted = false;
    private LocalDateTime completedAt;
    private LocalDateTime watchedAt;

    @PrePersist
    protected void onWatch() {
        if (this.watchedAt == null) {
            this.watchedAt = LocalDateTime.now();
        }
        if (this.isCompleted && this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }
    }
}

