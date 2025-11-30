package com.learnix.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String title;
    @Column(length = 2048)
    private String description;
    private String category;
    private Double price;
    private String thumbnail; // optional image URL


    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private Users teacher; // role = TEACHER
    
    private LocalDateTime createdAt = LocalDateTime.now();
}
