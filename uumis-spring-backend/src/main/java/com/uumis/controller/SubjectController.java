package com.uumis.controller;

import com.uumis.entity.Subject;
import com.uumis.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin("*")
public class SubjectController {

    @Autowired private SubjectRepository subjectRepo;

    @GetMapping
    public List<Subject> getSubjects() {
        return subjectRepo.findAll();
    }

    @PostMapping // (Or whatever your endpoint name is)
    public ResponseEntity<?> saveAllSubjects(@RequestBody List<Subject> subjects) {
        for (Subject s : subjects) {
            if (s.getId() != null) {
                // Updating an existing subject
                Subject existing = subjectRepo.findById(s.getId()).orElse(new Subject());
                existing.setName(s.getName());
                existing.setCode(s.getCode());
                existing.setCategory(s.getCategory());
                existing.setIcon(s.getIcon());
                existing.setActive(s.getActive());

                // MUST ADD THESE TWO LINES TO SAVE THE DROPDOWN DATA:
                existing.setLevel(s.getLevel());
                existing.setYearGroup(s.getYearGroup());

                subjectRepo.save(existing);
            } else {
                // Creating a brand new subject
                subjectRepo.save(s);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Subjects saved successfully!"));
    }

    // PUT: Single update mapping
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @RequestBody Subject details) {
        return subjectRepo.findById(id).map(subject -> {
            subject.setName(details.getName());
            subject.setCode(details.getCode());
            subject.setCategory(details.getCategory());
            subject.setActive(details.getActive());
            subject.setIcon(details.getIcon());
            subjectRepo.save(subject);
            return ResponseEntity.ok(Map.of("message", "Subject updated successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE: Immediately removes from database
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        if (subjectRepo.existsById(id)) {
            subjectRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Subject deleted successfully!"));
        }
        return ResponseEntity.notFound().build();
    }
}