package com.learnix.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.learnix.models.UpcomingEvent;

@Repository
public interface UpcomingEventRepository extends JpaRepository<UpcomingEvent, Long> {
    List<UpcomingEvent> findByEventAtAfterOrderByEventAtAsc(LocalDateTime after);
    List<UpcomingEvent> findByEnabledTrueAndEventAtAfterOrderByEventAtAsc(LocalDateTime after);
    List<UpcomingEvent> findByEnabledTrueOrderByCreatedAtDesc();
    List<UpcomingEvent> findByEventAtBefore(LocalDateTime before);
}


