package com.uumis.repository;

import com.uumis.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    // Custom query to instantly fetch all payments for one specific student
    List<Payment> findByStudentIdOrderByIdDesc(Integer studentId);
}