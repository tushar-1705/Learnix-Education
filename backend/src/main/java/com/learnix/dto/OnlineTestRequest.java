package com.learnix.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineTestRequest {
    private String title;
    private String subject;
    private String description;
    private Integer maxMarks;

    private String startTime;
    private String endTime;
    private List<QuestionDTO> questions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDTO {
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption;
    }
}

