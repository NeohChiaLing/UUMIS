package com.uumis.repository;
import com.uumis.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByYearGroupAndDate(String yearGroup, String date);

    // --- ADD THIS LINE ---
    List<Attendance> findByStudentIdOrderByDateDesc(String studentId);
}