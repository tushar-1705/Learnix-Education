package com.learnix.models;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(optional = false)
    private Users student;

    @ManyToOne(optional = true)
    @JoinColumn(name = "course_id", nullable = true)
    private Course course;

    @ManyToOne(optional = false)
    private Users teacher;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String status; // "PRESENT" or "ABSENT"
}


