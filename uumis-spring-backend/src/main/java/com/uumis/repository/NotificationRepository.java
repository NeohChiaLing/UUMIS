package com.uumis.repository; // Change to your actual package

import com.uumis.entity.NotificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationRecord, Integer> {
    List<NotificationRecord> findAllByOrderByIdDesc(); // Newest first
}