package com.uumis.controller;

import com.uumis.entity.LevelSchedule;
import com.uumis.repository.LevelScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin("*")
public class ScheduleController {

    @Autowired private LevelScheduleRepository scheduleRepo;

    @GetMapping("/{level}")
    public ResponseEntity<?> getSchedule(@PathVariable String level) {
        return scheduleRepo.findByLevelName(level)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{level}")
    public ResponseEntity<?> saveSchedule(@PathVariable String level, @RequestBody LevelSchedule data) {
        LevelSchedule schedule = scheduleRepo.findByLevelName(level).orElse(new LevelSchedule());
        schedule.setLevelName(level);
        schedule.setHeaders(data.getHeaders());
        schedule.setGridData(data.getGridData());
        scheduleRepo.save(schedule);
        return ResponseEntity.ok(Map.of("message", "Schedule saved successfully!"));
    }
}