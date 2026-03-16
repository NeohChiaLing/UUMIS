package com.uumis.repository;
import com.uumis.entity.LevelSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LevelScheduleRepository extends JpaRepository<LevelSchedule, Long> {
    Optional<LevelSchedule> findByLevelName(String levelName);
}