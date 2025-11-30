package com.learnix.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Entity
@Data
public class OnlineTestAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "submission_id")
    @JsonIgnore
    private OnlineTestSubmission submission;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private OnlineTestQuestion question;

    private String selectedOption;
    private Boolean correct;
}

