package com.learnix.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.learnix.services.AdminService;

@Component
public class ScheduledTasks {

    @Autowired
    private AdminService adminService;

    // Run every hour to check for events that have passed their event date/time by more than 24 hours
    @Scheduled(fixedRate = 3600000) // 3600000 ms = 1 hour
    public void deleteEventsPast24HoursAfterEventDate() {
        adminService.deleteEventsPast24HoursAfterEventDate();
    }
}

