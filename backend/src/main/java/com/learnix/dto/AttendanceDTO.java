package com.learnix.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

public class AttendanceDTO {

    @Getter
    @Setter
    public static class AttendanceEntry {
        private Long studentId;
        private String status; // PRESENT or ABSENT
    }

    @Getter
    @Setter
    public static class AttendanceRequest {
        private String date; // ISO format (e.g. 2025-10-29)
        private String subject; // Subject name for which attendance is marked
        private List<AttendanceEntry> entries = new ArrayList<>();
    }
}
