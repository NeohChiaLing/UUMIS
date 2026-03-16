package com.uumis.controller;
import com.uumis.entity.Attendance;
import com.uumis.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin("*")
public class AttendanceController {

    @Autowired private AttendanceRepository attendanceRepo;

    // Fetch attendance for a specific Year and Date
    @GetMapping
    public List<Attendance> getAttendance(@RequestParam String yearGroup, @RequestParam String date) {
        return attendanceRepo.findByYearGroupAndDate(yearGroup, date);
    }
// ... inside AttendanceController.java

    // --- ADD THIS NEW ENDPOINT FOR THE STUDENT PORTAL ---
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentAttendance(@PathVariable String studentId) {
        return ResponseEntity.ok(attendanceRepo.findByStudentIdOrderByDateDesc(studentId));
    }
    // Save or Update Attendance Bulk
    @PostMapping("/bulk")
    public ResponseEntity<?> saveAttendance(@RequestBody List<Attendance> records) {
        for(Attendance r : records) {
            List<Attendance> existing = attendanceRepo.findByYearGroupAndDate(r.getYearGroup(), r.getDate());
            Attendance target = existing.stream().filter(e -> e.getStudentId().equals(r.getStudentId())).findFirst().orElse(new Attendance());

            target.setStudentId(r.getStudentId());
            target.setStudentName(r.getStudentName());
            target.setYearGroup(r.getYearGroup());
            target.setDate(r.getDate());
            target.setTimeIn(r.getTimeIn());
            target.setStatus(r.getStatus());
            target.setMcFile(r.getMcFile());
            target.setMcUrl(r.getMcUrl());
            attendanceRepo.save(target);
        }
        return ResponseEntity.ok(Map.of("message", "Attendance saved successfully!"));
    }

    // Delete Student Attendance Record
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        attendanceRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted Successfully"));
    }

    // --- ADD THIS FOR THE ADMIN DASHBOARD ---
    @GetMapping("/all")
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceRepo.findAll());
    }
}