package com.uumis.controller;

import com.uumis.entity.StudentGrade;
import com.uumis.repository.StudentGradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin("*")
public class StudentGradeController {

    @Autowired private StudentGradeRepository gradeRepo;

    // 1. Fetches grades for Admin/Teacher grading table
    @GetMapping
    public List<StudentGrade> getGrades(@RequestParam String yearGroup, @RequestParam String subject) {
        return gradeRepo.findByYearGroupAndSubject(yearGroup, subject);
    }

    // --- ADD THIS MISSING ENDPOINT ---
    // 2. Fetches grades specifically for the logged-in Student
    @GetMapping("/student/{username}")
    public ResponseEntity<?> getStudentGrades(@PathVariable String username) {
        return ResponseEntity.ok(gradeRepo.findByStudentUsername(username));
    }

    // 3. Saves the grades from Admin/Teacher
    @PostMapping
    public ResponseEntity<?> saveGrades(@RequestBody List<StudentGrade> grades) {
        for(StudentGrade g : grades) {
            // Find existing grade to update, or create new
            List<StudentGrade> existing = gradeRepo.findByYearGroupAndSubject(g.getYearGroup(), g.getSubject());
            StudentGrade target = existing.stream().filter(e -> e.getStudentUsername().equals(g.getStudentUsername())).findFirst().orElse(new StudentGrade());

            target.setStudentUsername(g.getStudentUsername());
            target.setStudentName(g.getStudentName());
            target.setYearGroup(g.getYearGroup());
            target.setSubject(g.getSubject());
            target.setMark(g.getMark());
            target.setGradeLetter(g.getGradeLetter());
            target.setStatus(g.getStatus());
            gradeRepo.save(target);
        }
        return ResponseEntity.ok(Map.of("message", "Grades saved successfully!"));
    }
}