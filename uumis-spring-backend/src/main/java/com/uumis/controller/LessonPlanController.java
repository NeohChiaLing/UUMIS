package com.uumis.controller;

import com.uumis.entity.LessonPlan;
import com.uumis.repository.LessonPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lesson-plans")
@CrossOrigin("*")
public class LessonPlanController {

    @Autowired private LessonPlanRepository lessonPlanRepo;

    @GetMapping
    public List<LessonPlan> getAllPlans() {
        return lessonPlanRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createPlan(@RequestBody LessonPlan plan) {
        lessonPlanRepo.save(plan);
        return ResponseEntity.ok(Map.of("message", "Lesson Plan submitted!"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return lessonPlanRepo.findById(id).map(plan -> {
            plan.setStatus(body.get("status"));
            lessonPlanRepo.save(plan);
            return ResponseEntity.ok(Map.of("message", "Status updated!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable Long id) {
        lessonPlanRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Lesson Plan deleted!"));
    }
}