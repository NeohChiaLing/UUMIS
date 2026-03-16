package com.uumis.controller;

import com.uumis.entity.Assignment;
import com.uumis.repository.AssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin("*")
public class AssignmentController {

    @Autowired private AssignmentRepository assignmentRepo;

    @GetMapping
    public List<Assignment> getAllAssignments() { return assignmentRepo.findAll(); }

    @PostMapping
    public ResponseEntity<?> createAssignment(@RequestBody Assignment assignment) {
        assignmentRepo.save(assignment);
        return ResponseEntity.ok(Map.of("message", "Created successfully!"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @RequestBody Assignment updatedData) {
        updatedData.setId(id);
        assignmentRepo.save(updatedData);
        return ResponseEntity.ok(Map.of("message", "Updated successfully!"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        assignmentRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully!"));
    }
}