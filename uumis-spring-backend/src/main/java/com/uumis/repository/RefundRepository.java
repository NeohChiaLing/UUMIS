package com.uumis.repository;
 // Change to your actual package

import com.uumis.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RefundRepository extends JpaRepository<RefundRequest, Integer> {
    List<RefundRequest> findByStudentIdOrderByIdDesc(Integer studentId);
}