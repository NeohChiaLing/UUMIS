package com.uumis.repository;
import com.uumis.entity.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentGradeRepository extends JpaRepository<StudentGrade, Long> {

    List<StudentGrade> findByYearGroupAndSubject(String yearGroup, String subject);

    // --- ADD THIS MISSING LINE ---
    List<StudentGrade> findByStudentUsername(String studentUsername);
}